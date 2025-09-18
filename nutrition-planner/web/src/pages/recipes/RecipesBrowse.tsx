import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as recipes from '../../api/recipes'
import type { NutritionResponse } from '../../types'
import type { RecipeListItem } from '../../api/recipes'

/* ====== nutriments triables ====== */
const METRICS = {
  energy_kcal: { label: 'kcal', unit: '' },

  protein_g: { label: 'Protéines', unit: 'g' },
  carbs_g: { label: 'Glucides', unit: 'g' },
  sugars_g: { label: 'Sucres', unit: 'g' },
  fat_g: { label: 'Lipides', unit: 'g' },
  sat_fat_g: { label: 'Acides gras sat.', unit: 'g' },
  fiber_g: { label: 'Fibres', unit: 'g' },
  omega3_g: { label: 'Oméga-3', unit: 'g' },
  epa_g: { label: 'EPA', unit: 'g' },
  dha_g: { label: 'DHA', unit: 'g' },
  cholesterol_mg: { label: 'Cholestérol', unit: 'mg' },

  salt_g: { label: 'Sel', unit: 'g' },
  sodium_mg: { label: 'Sodium', unit: 'mg' },

  vit_a_ug: { label: 'Vit. A', unit: 'µg' },
  beta_carotene_ug: { label: 'β-carotène', unit: 'µg' },
  vit_c_mg: { label: 'Vit. C', unit: 'mg' },
  vit_d_ug: { label: 'Vit. D', unit: 'µg' },
  vit_e_mg: { label: 'Vit. E', unit: 'mg' },
  vit_k_ug: { label: 'Vit. K', unit: 'µg' },

  vit_b1_mg: { label: 'Vit. B1', unit: 'mg' },
  vit_b2_mg: { label: 'Vit. B2', unit: 'mg' },
  vit_b3_mg: { label: 'Vit. B3', unit: 'mg' },
  vit_b5_mg: { label: 'Vit. B5', unit: 'mg' },
  vit_b6_mg: { label: 'Vit. B6', unit: 'mg' },
  vit_b9_ug: { label: 'Vit. B9', unit: 'µg' },
  vit_b12_ug: { label: 'Vit. B12', unit: 'µg' },

  ca_mg: { label: 'Calcium', unit: 'mg' },
  mg_mg: { label: 'Magnésium', unit: 'mg' },
  p_mg: { label: 'Phosphore', unit: 'mg' },
  k_mg: { label: 'Potassium', unit: 'mg' },
  fe_mg: { label: 'Fer', unit: 'mg' },
  zn_mg: { label: 'Zinc', unit: 'mg' },
  cu_mg: { label: 'Cuivre', unit: 'mg' },
  mn_mg: { label: 'Manganèse', unit: 'mg' },
  se_ug: { label: 'Sélénium', unit: 'µg' },
  i_ug: { label: 'Iode', unit: 'µg' },
} as const
type MetricKey = keyof typeof METRICS

type NutMap = Record<string, NutritionResponse>

const COURSE_LABEL: Record<string, string> = {
  starter: 'Entrée',
  main: 'Plat',
  dessert: 'Dessert',
  side: 'Accompagnement',
  other: 'Autre',
}
const labelCourse = (v?: string | null) =>
  (v && COURSE_LABEL[v]) || (typeof v === 'string' ? v : '—')

function Thumb({ src, name }: { src?: string | null; name: string }) {
  return (
    <div className="w-14 aspect-square rounded-lg overflow-hidden bg-gray-100">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full grid place-items-center text-gray-500 font-semibold">
          {(name || '?').trim().charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
}

export default function RecipesBrowse() {
  const navigate = useNavigate()

  const [rows, setRows] = useState<RecipeListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nut, setNut] = useState<NutMap>({})
  const [fetchingNut, setFetchingNut] = useState(false)

  // clé de métrique sélectionnée (pas une recette)
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null)

  // ---- Load recettes ----
  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    recipes
      .listRecipes()
      .then((list) => {
        if (alive) setRows(list)
      })
      .catch((e) => {
        if (alive) setError(e?.message || 'Erreur')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  // ---- Charge nutrition (parallèle) ----
  useEffect(() => {
    if (!rows.length) return
    let alive = true
    setFetchingNut(true)

    const jobs: Promise<{ id: string; data: NutritionResponse }>[] = rows.map((r) =>
      recipes.getRecipeNutrition(r.id).then((data) => ({ id: r.id, data }))
    )

    Promise.allSettled(jobs)
      .then((results) => {
        if (!alive) return
        setNut((prev) => {
          const out: NutMap = { ...prev }
          for (const res of results) {
            if (res.status === 'fulfilled') {
              const { id, data } = res.value
              out[id] = data
            }
          }
          return out
        })
      })
      .finally(() => {
        if (alive) setFetchingNut(false)
      })

    return () => {
      alive = false
    }
  }, [rows])

  /* ==== valeur per portion en priorité ==== */
  const getMetricValue = useCallback(
    (id: string, key: MetricKey): number | null => {
      const m = nut[id]
      if (!m) return null
      if (m.per_serving && key in m.per_serving) return Number(m.per_serving[key]!)
      return m.totals && key in m.totals ? Number(m.totals[key]!) : null
    },
    [nut]
  )

  const getKcal = (id: string): number | null => getMetricValue(id, 'energy_kcal')

  const sortedRows = useMemo(() => {
    if (!selectedMetric) return rows
    const withVal = rows.map((r) => ({
      r,
      v: getMetricValue(r.id, selectedMetric) ?? -Infinity,
    }))
    withVal.sort((a, b) => b.v - a.v || a.r.name.localeCompare(b.r.name))
    return withVal.map((x) => x.r)
  }, [rows, selectedMetric, getMetricValue])

  if (loading) return <div className="max-w-6xl mx-auto p-6">Chargement…</div>
  if (error) return <div className="max-w-6xl mx-auto p-6 text-red-600">Erreur : {error}</div>

  const gridHeaderCols = selectedMetric
    ? 'grid-cols-[3.5rem_minmax(14rem,1fr)_8rem_12rem_6rem_8rem_9rem]'
    : 'grid-cols-[3.5rem_minmax(14rem,1fr)_8rem_12rem_6rem_8rem]'
  const gridRowCols = gridHeaderCols

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Explorer les recettes</h1>
        {fetchingNut && (
          <div className="text-sm text-gray-500">Calcul des nutriments…</div>
        )}
      </div>

      {/* boutons de tri par métrique */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(METRICS) as MetricKey[]).map((k) => {
          const active = selectedMetric === k
          return (
            <button
              key={k}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                active
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() =>
                setSelectedMetric((prev) => (prev === k ? null : k))
              }
              title={`${METRICS[k].label} / portion`}
            >
              {METRICS[k].label}
            </button>
          )
        })}
      </div>

      <div className="border rounded-xl overflow-hidden">
        {/* header */}
        <div
          className={`hidden md:grid ${gridHeaderCols} gap-x-3 md:gap-x-4 bg-gray-50 text-sm font-medium`}
        >
          <div className="px-3 py-2"></div>
          <div className="px-3 py-2">Nom</div>
          <div className="px-3 py-2">Type</div>
          <div className="px-3 py-2">Repas</div>
          <div className="px-3 py-2">Temps</div>
          <div className="px-3 py-2">kcal / portion</div>
          {selectedMetric && (
            <div className="px-3 py-2 text-right">
              {METRICS[selectedMetric].label} / portion
            </div>
          )}
        </div>

        {/* rows */}
        <div className="divide-y">
          {sortedRows.map((r) => {
            const kcal = getKcal(r.id)
            const activeVal = selectedMetric
              ? getMetricValue(r.id, selectedMetric)
              : null
            return (
              <div
                key={r.id}
                role="button"
                onClick={() => navigate(`/recipes/bdd/${r.id}`)}
                className={`grid ${gridRowCols} gap-x-3 md:gap-x-4 items-center hover:bg-gray-50 cursor-pointer transition`}
              >
                <div className="px-3 py-2">
                  <Thumb src={r.image} name={r.name} />
                </div>

                <div className="px-3 py-2">
                  <div className="font-medium">{r.name}</div>
                </div>
                <div className="px-3 py-2 text-gray-700">
                  {labelCourse(r.course_type)}
                </div>
                <div className="px-3 py-2 text-gray-700">
                  {(r.meal_types || []).length
                    ? (r.meal_types || []).join(', ')
                    : '—'}
                </div>
                <div className="px-3 py-2 text-gray-700">{r.time_min ?? '—'}</div>
                <div className="px-3 py-2 text-gray-900">
                  {kcal != null ? Math.round(kcal) : '—'}
                </div>

                {selectedMetric && (
                  <div className="px-3 py-2 text-right text-gray-900">
                    {activeVal != null
                      ? METRICS[selectedMetric].unit
                        ? `${Number(activeVal.toFixed(2))} ${
                            METRICS[selectedMetric].unit
                          }`
                        : Number(activeVal.toFixed(0))
                      : '—'}
                  </div>
                )}
              </div>
            )
          })}
          {sortedRows.length === 0 && (
            <div className="px-3 py-8 text-center text-gray-500">
              Aucune recette
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
