import { useEffect, useMemo, useState } from 'react'
import CiqualSelector from '../../components/CiqualSelector'
import NutritionPanel from '../../components/NutritionPanel'
import * as api from '../../api'
import type { CourseType } from '../../types'

type MealType = 'breakfast' | 'lunch' | 'dinner'
type Unit = 'g' | 'ml' | 'l' | 'cl' | 'kg' | 'unité'
const UNIT_OPTIONS: Unit[] = ['g', 'ml', 'l', 'cl', 'kg', 'unité']

type DishFamily =
  | 'Salade' | 'Soupe' | 'Pâtes' | 'Riz' | 'Poêlée' | 'Gratin'
  | 'Sandwich' | 'Pizza' | 'Tarte' | 'Bowl' | 'Wok' | 'Curry'
  | 'Viande' | 'Poisson' | 'Œufs' | 'Légumineuses' | 'Dessert'

type Cuisine =
  | 'Française' | 'Italienne' | 'Espagnole' | 'Méditerranéenne'
  | 'Indienne' | 'Japonaise' | 'Chinoise' | 'Thaï'
  | 'Mexicaine' | 'US' | 'Moyen-Orient' | 'Maghreb' | 'Fusion'

const DISH_FAMILY_OPTIONS: DishFamily[] = [
  'Salade', 'Soupe', 'Pâtes', 'Riz', 'Poêlée', 'Gratin',
  'Sandwich', 'Pizza', 'Tarte', 'Bowl', 'Wok', 'Curry',
  'Viande', 'Poisson', 'Œufs', 'Légumineuses', 'Dessert',
]

const CUISINE_OPTIONS: Cuisine[] = [
  'Française', 'Italienne', 'Espagnole', 'Méditerranéenne',
  'Indienne', 'Japonaise', 'Chinoise', 'Thaï',
  'Mexicaine', 'US', 'Moyen-Orient', 'Maghreb', 'Fusion',
]

type IngredientNew = {
  name: string
  ciqual_code?: string
  category?: string
  labels?: string[]
  allergens?: string[]
}

type Item = {
  ingredient_id?: string
  ciqual_code?: string
  ingredient_new?: IngredientNew | null
  quantity: number
  unit: Unit
  _label?: string
}

export default function RecipeCreate() {
  const [name, setName] = useState('')
  const [course, setCourse] = useState<CourseType>('main')
  const [mealTypes, setMealTypes] = useState<MealType[]>([])
  const [servings, setServings] = useState<number>(1)
  const [description, setDescription] = useState('')
  const [dishFamily, setDishFamily] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [timeMin, setTimeMin] = useState<number | ''>('')
  const [items, setItems] = useState<Item[]>([])
  const [saving, setSaving] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>("");
  useEffect(() => () => { if (imageUrl?.startsWith('blob:')) URL.revokeObjectURL(imageUrl) }, [imageUrl])

  // ===== Nutrition state =====
  const [nutTotals, setNutTotals] = useState<Record<string, number> | null>(null)
  const [nutPerServing, setNutPerServing] = useState<Record<string, number> | null>(null)
  const [nutLoading, setNutLoading] = useState(false)
  const [nutErr, setNutErr] = useState<string | null>(null)

  const addFromCiqual = (row: { ciqual_code: string; name_fr: string }) => {
    setItems(xs => [...xs, { ciqual_code: row.ciqual_code, quantity: 100, unit: 'g', _label: row.name_fr }])
  }
  const toggleMealType = (mt: MealType, checked: boolean) => {
    setMealTypes(ms => (checked ? [...ms, mt] : ms.filter(x => x !== mt)))
  }
  const updateItem = (i: number, patch: Partial<Item>) => {
    setItems(xs => xs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  }
  const removeItem = (i: number) => setItems(xs => xs.filter((_, idx) => idx !== i))


  // ===== Compute nutrition (debounced) =====
  const computePayload = useMemo(() => (
    items.map(it => ({
      ingredient_id: it.ingredient_id ?? null,
      ciqual_code: it.ciqual_code ?? null,
      quantity: Number.isFinite(it.quantity) ? it.quantity : 0,
      unit: it.unit,
    }))
  ), [items])

  useEffect(() => {
    let alive = true
    if (!computePayload.length) {
      setNutTotals(null); setNutPerServing(null); setNutErr(null)
      return
    }
    setNutLoading(true)
    setNutErr(null)
    const t = setTimeout(() => {
      api.computeNutrition({ items: computePayload, servings })
        .then(res => {
          if (!alive) return
          setNutTotals(res?.totals || null)
          setNutPerServing(res?.per_serving || null)
        })
        .catch(e => { if (alive) setNutErr(e?.message || 'Erreur calcul nutrition') })
        .finally(() => { if (alive) setNutLoading(false) })
    }, 250) // debounce 250ms

    return () => { alive = false; clearTimeout(t) }
  }, [computePayload, servings])

  const save = async () => {
    setSaving(true)
    try {
      if (!name.trim()) throw new Error('Nom requis')
      if (!items.length) throw new Error('Ajoute au moins un ingrédient')
      for (const it of items) {
        if (it.quantity == null || !isFinite(it.quantity) || it.quantity <= 0) throw new Error('Quantité invalide')
        if (!UNIT_OPTIONS.includes(it.unit)) throw new Error('Unité invalide')
        if (!(it.ingredient_id || it.ciqual_code || it.ingredient_new)) {
          throw new Error('Chaque item doit avoir ingredient_id OU ciqual_code OU ingredient_new')
        }
      }

      await api.createRecipe({
        name,
        description: description.trim() || null,
        course_type: course,
        meal_types: mealTypes,
        servings: Math.max(1, Math.round(servings)),
        image: imageUrl.trim() ? imageUrl.trim() : null,
        dish_family: dishFamily.trim() || null,
        cuisine: cuisine.trim() || null,
        time_min: typeof timeMin === 'number' && isFinite(timeMin) && timeMin > 0
          ? Math.round(timeMin) : null,
        items: items.map(({ ingredient_id, ciqual_code, ingredient_new, quantity, unit }) => ({
          ingredient_id: ingredient_id ?? null,
          ciqual_code: ciqual_code ?? null,
          ingredient_new: ingredient_new ?? null,
          quantity,
          unit,
        })),
      })

      // reset
      setName(''); setDescription(''); setDishFamily(''); setCuisine(''); setTimeMin('')
      setItems([]); setMealTypes([]); setServings(1); setImageUrl("");
      setNutTotals(null); setNutPerServing(null)
      alert('Recette créée ✔')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Créer une recette</h1>
        <p className="text-sm text-gray-500">Renseigne les infos, ajoute tes ingrédients, enregistre ✨</p>
      </div>

      {/* ====== Informations (horizontal + image) ====== */}
      <section className="bg-white border rounded-2xl shadow-sm p-5 lg:p-6">
        <h2 className="text-lg font-medium mb-4">Informations</h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form fields */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm text-gray-600">Nom</span>
                <input className="border rounded-lg px-3 py-2 w-full"
                  value={name} onChange={e => setName(e.target.value)} />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-600">Type (course)</span>
                <select className="border rounded-lg px-3 py-2 w-full"
                  value={course}
                  onChange={e => setCourse(e.target.value as CourseType)}>
                  <option value="starter">Entrée</option>
                  <option value="main">Plat</option>
                  <option value="dessert">Dessert</option>
                  <option value="side">Accompagnement</option>
                </select>
              </label>

              {/* Temps (min) */}
              <label className="space-y-1">
                <span className="text-sm text-gray-600">Temps (min)</span>
                <input type="number" min={0} step={1}
                  className="border rounded-lg px-3 py-2 w-full"
                  value={timeMin === '' ? '' : timeMin}
                  onChange={e => {
                    const v = e.target.value
                    setTimeMin(v === '' ? '' : Math.max(0, Math.round(Number(v) || 0)))
                  }} />
              </label>

              {/* Famille de plat */}
              <label className="space-y-1">
                <span className="text-sm text-gray-600">Famille de plat</span>
                <select
                  className="border rounded-lg px-3 py-2 w-full"
                  value={dishFamily}
                  onChange={e => setDishFamily(e.target.value)}
                >
                  <option value="">— Sélectionner —</option>
                  {DISH_FAMILY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>

              {/* Portions */}
              <label className="space-y-1">
                <span className="text-sm text-gray-600">Nombre de portions</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-2 border rounded-lg"
                    onClick={() => setServings(s => Math.max(1, Math.round(s) - 1))}
                    aria-label="Diminuer"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="border rounded-lg px-3 py-2 w-24 text-center"
                    value={servings}
                    onChange={e => setServings(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                  />
                  <button
                    type="button"
                    className="px-3 py-2 border rounded-lg"
                    onClick={() => setServings(s => Math.max(1, Math.round(s) + 1))}
                    aria-label="Augmenter"
                  >
                    +
                  </button>
                </div>
              </label>

              {/* Cuisine */}
              <label className="space-y-1">
                <span className="text-sm text-gray-600">Cuisine</span>
                <select
                  className="border rounded-lg px-3 py-2 w-full"
                  value={cuisine}
                  onChange={e => setCuisine(e.target.value)}
                >
                  <option value="">— Sélectionner —</option>
                  {CUISINE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>

              {/* Repas */}
              <div className="space-y-1 sm:col-span-2">
                <span className="text-sm text-gray-600">Repas</span>
                <div className="flex flex-wrap gap-2">
                  {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(mt => {
                    const active = mealTypes.includes(mt)
                    return (
                      <button
                        key={mt}
                        type="button"
                        onClick={() => toggleMealType(mt, !active)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition
                          ${active ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        {mt}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Description */}
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm text-gray-600">Description</span>
                <textarea
                  rows={3}
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder="Quelques notes…"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </label>
            </div>
          </div>

          {/* Image */}
          <div className="lg:col-span-4">
            <div className="space-y-2">
              <span className="text-sm text-gray-600">Image (URL)</span>
              <input
                className="border rounded-lg px-3 py-2 w-full"
                placeholder="https://…/photo.webp"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
              />
              <div className="border rounded-xl overflow-hidden bg-gray-50 aspect-[4/3] flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Prévisualisation" className="w-full h-full object-cover" />
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
          <div className="text-sm text-gray-500">{items.length} élément{items.length > 1 ? 's' : ''}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Outils d’ajout */}
          <div className="lg:col-span-4 space-y-4">
            <div className="space-y-2">
              <div className="font-medium">Ajouter depuis CIQUAL</div>
              <CiqualSelector onSelect={addFromCiqual} />
            </div>
            <div className="space-y-2">
              <div className="font-medium">Ajouter un ingrédient libre</div>
              <AddFreeIngredient onAdd={(n) =>
                setItems(xs => [...xs, { ingredient_new: { name: n }, quantity: 100, unit: 'g' }])
              } />
            </div>
          </div>

          {/* Liste */}
          <div className="lg:col-span-8">
            <div className="border rounded-xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[minmax(12rem,1fr)_10rem_8rem_5rem_5rem] bg-gray-50 text-sm font-medium">
                <div className="px-3 py-2">Ingrédient</div>
                <div className="px-3 py-2">CIQUAL / ID</div>
                <div className="px-3 py-2 text-right">Quantité</div>
                <div className="px-3 py-2">Unité</div>
                <div className="px-3 py-2"></div>
              </div>
              <div className="divide-y">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[minmax(12rem,1fr)_10rem_8rem_5rem_5rem] items-center">
                    <div className="px-3 py-2">
                      {it.ciqual_code ? (
                        <div className="text-gray-900">{it._label ?? 'Aliment CIQUAL'}</div>
                      ) : (
                        <input
                          className="border rounded-lg px-2 py-1 w-full"
                          placeholder="Nom ingrédient"
                          value={it.ingredient_new?.name ?? ''}
                          onChange={e => updateItem(i, { ingredient_new: { ...(it.ingredient_new || {}), name: e.target.value } })}
                        />
                      )}
                    </div>
                    <div className="px-3 py-2 text-gray-500">{it.ciqual_code ?? it.ingredient_id ?? '—'}</div>
                    <div className="px-3 py-2">
                      <input
                        type="number" step="0.01" min="0"
                        className="border rounded-lg px-2 py-1 w-full text-right"
                        value={Number.isFinite(it.quantity) ? it.quantity : ''}
                        onChange={e => updateItem(i, { quantity: Number(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="px-3 py-2">
                      <select
                        className="border rounded-lg px-2 py-1 w-full"
                        value={it.unit}
                        onChange={e => updateItem(i, { unit: e.target.value as Unit })}
                      >
                        {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="px-3 py-2">
                      <button className="text-red-600 hover:underline text-sm" onClick={() => removeItem(i)}>Retirer</button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="px-3 py-6 text-center text-gray-500">Aucun ingrédient</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== Nutrition (temps réel) ====== */}
      <section className="bg-white border rounded-2xl shadow-sm p-5 lg:p-6">
        <NutritionPanel
          totals={nutTotals}
          perServing={nutPerServing}
          servings={servings}
          loading={nutLoading}
        />
        {nutErr && <div className="mt-2 text-sm text-red-600">Erreur : {nutErr}</div>}
      </section>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          className="px-4 py-2 border rounded-xl bg-black text-white disabled:opacity-50"
          disabled={saving || !name || items.length === 0}
          onClick={save}
        >
          {saving ? 'Sauvegarde…' : 'Créer la recette'}
        </button>
      </div>
    </div>
  )
}

function AddFreeIngredient({ onAdd }: { onAdd: (name: string) => void }) {
  const [val, setVal] = useState('')
  return (
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
  )
}
