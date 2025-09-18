// components/NutritionPanel.tsx
import { useMemo, useState } from 'react'

type NutMap = Record<string, number>

type NutritionPanelProps = {
  totals?: NutMap | null
  perServing?: NutMap | null
  servings?: number
  loading?: boolean
  className?: string
}

const LABELS: Record<string, string> = {
  energy_kcal: 'Énergie (kcal)',
  protein_g: 'Protéines (g)',
  carbs_g: 'Glucides (g)',
  sugars_g: 'Sucres (g)',
  fat_g: 'Lipides (g)',
  sat_fat_g: 'Acides gras sat. (g)',
  fiber_g: 'Fibres (g)',
  omega3_g: 'Oméga-3 (g)',
  epa_g: 'EPA (g)',
  dha_g: 'DHA (g)',
  cholesterol_mg: 'Cholestérol (mg)',
  salt_g: 'Sel (g)',
  sodium_mg: 'Sodium (mg)',
  vit_a_ug: 'Vit. A (µg)',
  beta_carotene_ug: 'β-carotène (µg)',
  vit_c_mg: 'Vit. C (mg)',
  vit_d_ug: 'Vit. D (µg)',
  vit_e_mg: 'Vit. E (mg)',
  vit_k_ug: 'Vit. K (µg)',
  vit_b1_mg: 'Vit. B1 (mg)',
  vit_b2_mg: 'Vit. B2 (mg)',
  vit_b3_mg: 'Vit. B3 (mg)',
  vit_b5_mg: 'Vit. B5 (mg)',
  vit_b6_mg: 'Vit. B6 (mg)',
  vit_b9_ug: 'Vit. B9 (µg)',
  vit_b12_ug: 'Vit. B12 (µg)',
  ca_mg: 'Calcium (mg)',
  mg_mg: 'Magnésium (mg)',
  p_mg: 'Phosphore (mg)',
  k_mg: 'Potassium (mg)',
  fe_mg: 'Fer (mg)',
  zn_mg: 'Zinc (mg)',
  cu_mg: 'Cuivre (mg)',
  mn_mg: 'Manganèse (mg)',
  se_ug: 'Sélénium (µg)',
  i_ug: 'Iode (µg)',
}

const ORDER = [
  'energy_kcal',
  'protein_g', 'carbs_g', 'sugars_g', 'fat_g', 'sat_fat_g', 'fiber_g',
  'omega3_g', 'epa_g', 'dha_g',
  'salt_g', 'sodium_mg', 'cholesterol_mg',
  'vit_c_mg', 'vit_d_ug', 'vit_e_mg', 'vit_k_ug',
  'vit_b1_mg', 'vit_b2_mg', 'vit_b3_mg', 'vit_b5_mg', 'vit_b6_mg', 'vit_b9_ug', 'vit_b12_ug',
  'ca_mg', 'mg_mg', 'p_mg', 'k_mg', 'fe_mg', 'zn_mg', 'cu_mg', 'mn_mg', 'se_ug', 'i_ug',
] as const
type NutKey = typeof ORDER[number]

function fmt(n: unknown) {
  if (n == null) return '—'
  const v = Number(n)
  if (!isFinite(v)) return '—'
  return Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1)
}

export default function NutritionPanel({
  totals,
  perServing,
  servings,
  loading,
  className,
}: NutritionPanelProps) {
  const hasPerServing = !!perServing && Object.keys(perServing!).length > 0 && (servings ?? 1) > 1
  const [mode, setMode] = useState<'total' | 'portion'>(hasPerServing ? 'portion' : 'total')

  const data = useMemo(() => {
    const src: NutMap = (mode === 'portion' && hasPerServing ? perServing! : (totals || {})) as NutMap
    const keys: NutKey[] = ORDER.filter((k) => k in src)
    return { src, keys }
  }, [totals, perServing, mode, hasPerServing])

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium">Valeurs nutritionnelles {mode === 'portion' ? '— par portion' : '— total'}</div>
        <div className="flex items-center gap-2 text-sm">
          {loading && <span className="text-gray-500">Calcul…</span>}
          {hasPerServing && (
            <div className="inline-flex rounded-lg overflow-hidden border">
              <button className={`px-3 py-1 ${mode === 'total' ? 'bg-black text-white' : 'bg-white'}`} onClick={() => setMode('total')}>Total</button>
              <button className={`px-3 py-1 ${mode === 'portion' ? 'bg-black text-white' : 'bg-white'}`} onClick={() => setMode('portion')}>Par portion</button>
            </div>
          )}
        </div>
      </div>

      {(!data.keys.length) ? (
        <div className="text-sm text-gray-500">Aucune donnée disponible pour ces ingrédients.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.keys.map((k) => (
            <div key={k} className="border rounded-lg px-3 py-2 bg-white">
              <div className="text-xs text-gray-500">{LABELS[k] || k}</div>
              <div className="font-medium">{fmt(data.src[k])}</div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500">
        Hypothèses : valeurs CIQUAL par 100 g. Conversion : 1 ml ≈ 1 g (densité 1). Les items en « unité » sans poids connu sont ignorés.
      </p>
    </div>
  )
}
