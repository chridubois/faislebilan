import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as recipes from '../../api/recipes'
import type { Recipe, Unit, RecipeItem, NutResponse, ReplaceRecipeItemInput } from '../../types'
import NutritionPanel from '../../components/NutritionPanel'
import CiqualSelector from '../../components/CiqualSelector'

const UNIT_OPTIONS: Unit[] = ['g', 'ml', 'l', 'cl', 'kg', 'unité']

const COURSE_LABEL: Record<string, string> = {
  starter: 'Entrée',
  main: 'Plat',
  dessert: 'Dessert',
  side: 'Accompagnement',
  other: 'Autre',
}
const labelCourse = (v?: string | null) =>
  (v && COURSE_LABEL[v]) || (typeof v === 'string' ? v : '—')

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<Recipe | null>(null)
  const [items, setItems] = useState<RecipeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // lecture nutrition BDD
  const [nut, setNut] = useState<NutResponse | null>(null)
  const [nutLoading, setNutLoading] = useState<boolean>(true)

  // EDIT MODE
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState<Partial<Recipe>>({})
  const [draftItems, setDraftItems] = useState<Array<{
    ingredient_id?: string | null
    ciqual_code?: string | null
    ingredient_new?: { name: string; ciqual_code?: string } | null
    quantity: number
    unit: Unit
    _label?: string
  }>>([])

  // nutrition live en édition
  const [liveNut, setLiveNut] = useState<NutResponse | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveErr, setLiveErr] = useState<string | null>(null)

  // ------- Load -------
  useEffect(() => {
    if (!id) return
    let alive = true
    setLoading(true)
    setNutLoading(true)
    setErr(null)

    Promise.all([
      recipes.getRecipeById(id),
      recipes.getRecipeItems(id).catch(() => [] as RecipeItem[]),
    ])
      .then(([rec, its]) => {
        if (!alive) return
        setData(rec)
        setItems(its)
        setLoading(false)
      })
      .catch((e) => {
        if (!alive) return
        setErr(e?.message || 'Erreur de chargement')
        setLoading(false)
      })

    recipes.getRecipeNutrition(id)
      .then((r) => { if (alive) setNut(r as NutResponse) })
      .catch(() => { if (alive) setNut(null) })
      .finally(() => { if (alive) setNutLoading(false) })

    return () => { alive = false }
  }, [id])

  // ------- Enter/leave edit mode -------
  const enterEdit = () => {
    if (!data) return
    setEdit(true)
    setDraft({
      name: data.name,
      description: data.description || '',
      course_type: data.course_type,
      meal_types: data.meal_types || [],
      servings: data.servings || 1,
      time_min: data.time_min ?? undefined,
      dish_family: data.dish_family ?? '',
      cuisine: data.cuisine ?? '',
      image: data.image ?? '',
    })
    setDraftItems(
      items.map((it) => ({
        ingredient_id: it.ingredient_id,
        ciqual_code: it.ciqual_code || null,
        ingredient_new: null,
        quantity: it.quantity,
        unit: (it.unit as Unit) || 'g',
        _label: it.ingredient_name || undefined,
      }))
    )
    setLiveNut(null)
  }

  const cancelEdit = () => {
    setEdit(false)
    setLiveNut(null)
    setLiveErr(null)
  }

  // ------- live nutrition while editing (debounced) -------
  const computePayload = useMemo<ReplaceRecipeItemInput[]>(
    () =>
      draftItems.map(({ ingredient_id, ciqual_code, ingredient_new, quantity, unit }) => {
        const x: ReplaceRecipeItemInput = { quantity, unit }
        if (ingredient_id) x.ingredient_id = ingredient_id
        if (ciqual_code) x.ciqual_code = ciqual_code
        if (ingredient_new) x.ingredient_new = ingredient_new
        return x
      }),
    [draftItems]
  )

  useEffect(() => {
    if (!edit) return
    if (!computePayload.length) { setLiveNut(null); return }
    let alive = true
    const servings = Math.max(1, Number(draft.servings ?? 1))
    setLiveLoading(true); setLiveErr(null)
    const t = setTimeout(() => {
      recipes.computeNutrition({ items: computePayload, servings })
        .then((r) => { if (alive) setLiveNut(r) })
        .catch((e) => { if (alive) setLiveErr(e?.message || 'Erreur calcul nutrition') })
        .finally(() => { if (alive) setLiveLoading(false) })
    }, 250)
    return () => { alive = false; clearTimeout(t) }
  }, [edit, computePayload, draft.servings])

  // ------- Save -------
  const save = async () => {
    if (!id) return
    try {
      const servings = Math.max(1, Number(draft.servings ?? 1))
      await recipes.updateRecipe(id, {
        name: draft.name || '',
        description: (draft.description || '').trim() || null,
        course_type: draft.course_type || 'main',
        meal_types: draft.meal_types || [],
        servings,
        time_min: draft.time_min ?? null,
        dish_family: (draft.dish_family || '').trim() || null,
        cuisine: (draft.cuisine || '').trim() || null,
        image: (draft.image || '').trim() || null,
      })
      await recipes.replaceRecipeItems(id, computePayload)
      // reload after save
      const [rec, its] = await Promise.all([recipes.getRecipeById(id), recipes.getRecipeItems(id)])
      setData(rec); setItems(its)
      setEdit(false)
      // refresh nutrition BDD
      setNutLoading(true)
      recipes.getRecipeNutrition(id).then(setNut).finally(() => setNutLoading(false))
      alert('Recette mise à jour ✔')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      alert(msg || 'Erreur sauvegarde')
    }
  }

  // ------- helpers edition -------
  const updateDraft = (patch: Partial<Recipe>) => setDraft((d) => ({ ...d, ...patch }))
  const updateItem = (i: number, patch: Partial<(typeof draftItems)[number]>) =>
    setDraftItems((xs) => xs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const removeItem = (i: number) => setDraftItems((xs) => xs.filter((_, idx) => idx !== i))
  const addFromCiqual = (row: { ciqual_code: string; name_fr: string }) =>
    setDraftItems((xs) => [...xs, { ciqual_code: row.ciqual_code, quantity: 100, unit: 'g', _label: row.name_fr }])

  // ------- render -------
  if (loading) return <div className="max-w-6xl mx-auto p-6">Chargement…</div>
  if (err || !data) return <div className="max-w-6xl mx-auto p-6 text-red-600">Erreur : {err || 'not_found'}</div>

  const servingsView = Math.max(1, Number(data.servings ?? 1))
  const servingsEdit = Math.max(1, Number(draft.servings ?? 1))

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/recipes/browse" className="text-sm text-gray-600 hover:underline">← Retour à la liste</Link>
        {!edit ? (
          <button className="px-3 py-2 border rounded-lg" onClick={enterEdit}>Modifier</button>
        ) : (
          <div className="flex gap-2">
            <button className="px-3 py-2 border rounded-lg" onClick={cancelEdit}>Annuler</button>
            <button className="px-3 py-2 border rounded-lg bg-black text-white" onClick={save}>Sauvegarder</button>
          </div>
        )}
      </div>

      {/* ====== Informations ====== */}
      <section className="bg-white border rounded-2xl shadow-sm p-5 lg:p-6">
        <h2 className="text-lg font-medium mb-4">Informations</h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonne infos */}
          <div className="lg:col-span-8">
            {!edit ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoField label="Nom" value={data.name} />
                <InfoField label="Type (course)" value={labelCourse(data.course_type)} />
                <InfoField label="Temps (min)" value={data.time_min ?? '—'} />
                <InfoField label="Famille de plat" value={data.dish_family ?? '—'} />
                <InfoField label="Cuisine" value={data.cuisine ?? '—'} />
                <InfoField label="Portions" value={servingsView} />
                <div className="sm:col-span-2">
                  <div className="text-sm text-gray-600 mb-1">Repas</div>
                  <div className="flex flex-wrap gap-2">
                    {(data.meal_types || []).length
                      ? (data.meal_types || []).map((m) => (
                        <span key={m} className="px-3 py-1.5 rounded-full text-sm border bg-white">{m}</span>
                      ))
                      : <span className="text-gray-500">—</span>
                    }
                  </div>
                </div>
                {data.description && (
                  <div className="sm:col-span-2">
                    <div className="text-sm text-gray-600 mb-1">Description</div>
                    <div className="border rounded-lg px-3 py-2 bg-gray-50 whitespace-pre-wrap">{data.description}</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LabeledInput label="Nom" value={draft.name || ''} onChange={(v) => updateDraft({ name: v })} />
                <div className="space-y-1">
                  <span className="text-sm text-gray-600">Type (course)</span>
                  <select
                    className="border rounded-lg px-3 py-2 w-full"
                    value={draft.course_type || 'main'}
                    onChange={(e) => updateDraft({ course_type: e.target.value as Recipe['course_type'] })}
                  >
                    <option value="starter">Entrée</option>
                    <option value="main">Plat</option>
                    <option value="dessert">Dessert</option>
                    <option value="side">Accompagnement</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
                <LabeledNumber label="Temps (min)" value={draft.time_min ?? ''} onChange={(n) => updateDraft({ time_min: n === '' ? undefined : n })} />
                <LabeledInput label="Famille de plat" value={draft.dish_family || ''} onChange={(v) => updateDraft({ dish_family: v })} />
                <LabeledInput label="Cuisine" value={draft.cuisine || ''} onChange={(v) => updateDraft({ cuisine: v })} />
                <div className="space-y-1">
                  <span className="text-sm text-gray-600">Portions</span>
                  <input
                    type="number" min={1} step={1}
                    className="border rounded-lg px-3 py-2 w-32"
                    value={servingsEdit}
                    onChange={(e) => updateDraft({ servings: Math.max(1, Math.round(Number(e.target.value) || 1)) })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <span className="text-sm text-gray-600">Description</span>
                  <textarea
                    rows={3}
                    className="border rounded-lg px-3 py-2 w-full"
                    value={draft.description || ''}
                    onChange={(e) => updateDraft({ description: e.target.value })}
                  />
                </div>
                <LabeledInput
                  label="Image (URL)"
                  value={draft.image || ''}
                  onChange={(v) => updateDraft({ image: v })}
                  className="sm:col-span-2"
                />
              </div>
            )}
          </div>

          {/* Colonne image */}
          <div className="lg:col-span-4">
            <div className="space-y-2">
              <span className="text-sm text-gray-600">Image</span>
              <div className="border rounded-xl overflow-hidden bg-gray-50 aspect-[4/3] flex items-center justify-center">
                {(edit ? draft.image : data.image) ? (
                  <img src={(edit ? draft.image : data.image) as string} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 text-sm">Aucune image</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== Ingrédients ====== */}
      <section className="bg-white border rounded-2xl shadow-sm p-5 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Ingrédients</h2>
          <div className="text-sm text-gray-500">
            {(!edit ? items.length : draftItems.length)} élément{(!edit ? items.length : draftItems.length) > 1 ? 's' : ''}
          </div>
        </div>

        {!edit ? (
          <div className="border rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[minmax(12rem,1fr)_10rem_8rem_6rem] bg-gray-50 text-sm font-medium">
              <div className="px-3 py-2">Ingrédient</div>
              <div className="px-3 py-2">CIQUAL / ID</div>
              <div className="px-3 py-2 text-right">Quantité</div>
              <div className="px-3 py-2">Unité</div>
            </div>
            <div className="divide-y">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[minmax(12rem,1fr)_10rem_8rem_6rem] items-center">
                  <div className="px-3 py-2">{it.ingredient_name ?? '—'}</div>
                  <div className="px-3 py-2 text-gray-500">{it.ciqual_code ?? it.ingredient_id ?? '—'}</div>
                  <div className="px-3 py-2 text-right">{Number.isFinite(it.quantity) ? it.quantity : '—'}</div>
                  <div className="px-3 py-2">{it.unit ?? '—'}</div>
                </div>
              ))}
              {items.length === 0 && <div className="px-3 py-8 text-center text-gray-500">Aucun ingrédient</div>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Outils d’ajout */}
            <div className="lg:col-span-4 space-y-4">
              <div className="space-y-2">
                <div className="font-medium">Ajouter depuis CIQUAL</div>
                <CiqualSelector onSelect={addFromCiqual} />
              </div>
              <AddFreeIngredient onAdd={(name) => setDraftItems(xs => [...xs, { ingredient_new: { name }, quantity: 100, unit: 'g' }])} />
            </div>

            {/* Liste éditable */}
            <div className="lg:col-span-8">
              <div className="border rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-[minmax(12rem,1fr)_12rem_8rem_6rem_5rem] bg-gray-50 text-sm font-medium">
                  <div className="px-3 py-2">Ingrédient</div>
                  <div className="px-3 py-2">CIQUAL / ID</div>
                  <div className="px-3 py-2 text-right">Quantité</div>
                  <div className="px-3 py-2">Unité</div>
                  <div className="px-3 py-2"></div>
                </div>
                <div className="divide-y">
                  {draftItems.map((it, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-[minmax(12rem,1fr)_12rem_8rem_6rem_5rem] items-center">
                      <div className="px-3 py-2">
                        {it.ciqual_code ? (
                          <div className="text-gray-900">{it._label ?? 'Aliment CIQUAL'}</div>
                        ) : (
                          <input
                            className="border rounded-lg px-2 py-1 w-full"
                            placeholder="Nom ingrédient"
                            value={it.ingredient_new?.name ?? ''}
                            onChange={(e) => updateItem(i, { ingredient_new: { ...(it.ingredient_new || {}), name: e.target.value } })}
                          />
                        )}
                      </div>
                      <div className="px-3 py-2 text-gray-500">{it.ciqual_code ?? it.ingredient_id ?? '—'}</div>
                      <div className="px-3 py-2">
                        <input
                          type="number" step="0.01" min="0"
                          className="border rounded-lg px-2 py-1 w-full text-right"
                          value={Number.isFinite(it.quantity) ? it.quantity : ''}
                          onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="px-3 py-2">
                        <select
                          className="border rounded-lg px-2 py-1 w-full"
                          value={it.unit}
                          onChange={(e) => updateItem(i, { unit: e.target.value as Unit })}
                        >
                          {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className="px-3 py-2">
                        <button className="text-red-600 hover:underline text-sm" onClick={() => removeItem(i)}>Retirer</button>
                      </div>
                    </div>
                  ))}
                  {draftItems.length === 0 && <div className="px-3 py-8 text-center text-gray-500">Aucun ingrédient</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ====== Nutrition ====== */}
      <section className="bg-white border rounded-2xl shadow-sm p-5 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Valeurs nutritionnelles</h2>
        </div>
        {!edit ? (
          <NutritionPanel
            totals={nut?.totals || {}}
            perServing={nut?.per_serving || undefined}
            servings={servingsView}
            loading={nutLoading}
          />
        ) : (
          <NutritionPanel
            totals={liveNut?.totals || {}}
            perServing={liveNut?.per_serving || undefined}
            servings={servingsEdit}
            loading={liveLoading}
          />
        )}
        {edit && liveErr && <div className="mt-2 text-sm text-red-600">{liveErr}</div>}
      </section>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="border rounded-lg px-3 py-2 bg-gray-50">{value ?? '—'}</div>
    </label>
  )
}

function LabeledInput({
  label, value, onChange, className,
}: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={`space-y-1 ${className || ''}`}>
      <span className="text-sm text-gray-600">{label}</span>
      <input className="border rounded-lg px-3 py-2 w-full" value={value} onChange={e => onChange(e.target.value)} />
    </label>
  )
}
function LabeledNumber({
  label, value, onChange,
}: { label: string; value: number | ''; onChange: (v: number | '') => void }) {
  return (
    <label className="space-y-1">
      <span className="text-sm text-gray-600">{label}</span>
      <input
        type="number" min={0} step={1}
        className="border rounded-lg px-3 py-2 w-full"
        value={value === '' ? '' : value}
        onChange={e => {
          const v = e.target.value
          onChange(v === '' ? '' : Math.max(0, Math.round(Number(v) || 0)))
        }}
      />
    </label>
  )
}

function AddFreeIngredient({ onAdd }: { onAdd: (name: string) => void }) {
  const [val, setVal] = useState('')
  return (
    <div className="space-y-2">
      <div className="font-medium">Ajouter un ingrédient libre</div>
      <div className="flex gap-2">
        <input
          className="border rounded-lg px-3 py-2 flex-1"
          placeholder="Ex: Croûtons"
          value={val}
          onChange={e => setVal(e.target.value)}
        />
        <button
          type="button"
          className="px-3 py-2 border rounded-lg"
          onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal('') } }}
        >
          Ajouter
        </button>
      </div>
    </div>
  )
}
