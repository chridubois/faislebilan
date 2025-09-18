// src/pages/Planner.tsx
import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { listProfiles, getProfileTargets } from '../api/profiles'
import { listRecipes } from '../api/recipes'
import {
  generatePlan,
  evaluatePlan,
  shoppingList,
  getPlanMacros,
} from '../api'

import type {
  WeekPlan,
  MealSlot,
  EvaluateResponse,
  Targets,
  PlanMacros,
  Macro,
  NutriSummary,
  Meal,
  MealItem,
  CourseType,
  RecipeListItem
} from '../types'

/* ---------------- Helpers ---------------- */

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner'] as const
const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Petit-déj',
  lunch: 'Déjeuner',
  dinner: 'Dîner',
}

function isMealSlot(s: string): s is MealSlot {
  return (['breakfast', 'lunch', 'dinner'] as const).includes(s as MealSlot)
}

function mealServings(m?: { servings?: number | null; scale?: number | null }) {
  const s = m?.servings ?? m?.scale ?? 1
  return typeof s === 'number' && Number.isFinite(s) ? s : 1
}
function itemServings(it?: { servings?: number | null; scale?: number | null }) {
  const s = it?.servings ?? it?.scale ?? 1
  return typeof s === 'number' && Number.isFinite(s) ? s : 1
}
function fmtServings(x: number | undefined) {
  const s = x ?? 1
  const r = Math.round(s * 2) / 2
  return `${r} portion${r > 1 ? 's' : ''}`
}
function fmtMacro(m: Macro): string {
  return `${m.kcal} kcal — Prot ${m.protein_g} g — Glu ${m.carbs_g} g — Lip ${m.fat_g} g`
}

/* --- Narrowing helpers (no `any`) --- */

function ensureWeekPlan(x: unknown): WeekPlan {
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>
    if (typeof o.plan_id === 'string' && Array.isArray(o.days)) {
      return o as WeekPlan
    }
  }
  throw new Error('Réponse serveur invalide (WeekPlan)')
}

function ensureTargets(x: unknown): Targets {
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>
    if ('kcal_per_day' in o) return o as Targets
  }
  throw new Error('Réponse serveur invalide (Targets)')
}

/* ---------------- Page ---------------- */

type ProfileListLite = { id: string; name?: string | null; external_code?: string | null }

/** Tolère id/profile_id et name/first_name */
function toLiteProfile(p: unknown): ProfileListLite | null {
  const o = (p ?? null) as Record<string, unknown> | null

  const id =
    (typeof o?.id === 'string' && (o.id as string)) ||
    (typeof o?.profile_id === 'string' && (o.profile_id as string)) ||
    undefined
  if (!id) return null

  const name =
    (typeof o?.name === 'string' && (o.name as string)) ||
    (typeof o?.first_name === 'string' && (o.first_name as string)) ||
    null

  const external_code =
    (typeof o?.external_code === 'string' && (o.external_code as string)) || null

  return { id, name, external_code }
}

export default function Planner() {
  const [plan, setPlan] = useState<WeekPlan | null>(null)
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [evalRes, setEvalRes] = useState<EvaluateResponse | null>(null)
  const [targets, setTargets] = useState<Targets | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [macros, setMacros] = useState<PlanMacros | null>(null)
  const [nutri, setNutri] = useState<NutriSummary | null>(null)

  // profils (lite)
  const [profiles, setProfiles] = useState<ProfileListLite[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')

  // états de chargement robustes
  const [loading, setLoading] = useState<boolean>(true)

  // éviter double-fetch sous StrictMode
  const didBootstrap = useRef(false)

  // index { recipeId -> Recipe }
  const recIndex = useMemo<Record<string, RecipeListItem>>(
    () => Object.fromEntries(recipes.map((r) => [r.id, r] as const)),
    [recipes],
  )

  // ------- Helpers réseau -------
  async function refreshNutrients(pid: string) {
    try {
      const r = await fetch(`/api/menu/${pid}/nutrients`)
      if (!r.ok) throw new Error(`API /menu/${pid}/nutrients ${r.status}`)
      const json = await r.json()
      setNutri(json)
    } catch (e) {
      console.error('get /menu/:id/nutrients failed:', e)
    }
  }

  async function refreshEvaluation(pid: string) {
    try {
      const r = await evaluatePlan(pid)
      setEvalRes(r)
    } catch (e) {
      console.error('evaluatePlan failed:', e)
    }
  }

  async function refreshMacros(pid: string) {
    try {
      const m = await getPlanMacros(pid)
      setMacros(m)
    } catch (e) {
      console.error('getPlanMacros failed:', e)
    }
  }

  // ------- Bootstrap: recettes + profils -------
  async function bootstrap() {
    setError(null)
    setLoading(true)
    try {
      const [recipesRes, profilesRes] = await Promise.allSettled([listRecipes(), listProfiles()])

      if (recipesRes.status === 'fulfilled') {
        setRecipes(recipesRes.value)
      } else {
        const msg = recipesRes.reason instanceof Error ? recipesRes.reason.message : String(recipesRes.reason)
        console.warn('[Planner] listRecipes error:', msg)
      }

      if (profilesRes.status === 'fulfilled') {
        const raw = profilesRes.value as unknown
        const arr = Array.isArray(raw) ? raw : []
        const ps = arr.map(toLiteProfile).filter((x): x is ProfileListLite => !!x)
        setProfiles(ps)
        if (ps.length > 0) {
          setSelectedProfileId((prev) => prev || ps[0].id) // id (ou profile_id mappé)
        } else {
          setLoading(false) // pas de profil => pas de spinner infini
        }
      } else {
        const msg = profilesRes.reason instanceof Error ? profilesRes.reason.message : String(profilesRes.reason)
        setError(msg || 'Impossible de charger les profils')
        setLoading(false)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || 'Erreur lors du chargement initial')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (didBootstrap.current) return
    didBootstrap.current = true
    void bootstrap()
  }, [])

  // ------- Changer targets & générer un plan quand un profil change -------
  useEffect(() => {
    let cancelled = false
    if (!selectedProfileId) {
      setTargets(null)
      setPlan(null)
      if (profiles.length === 0) setLoading(false)
      return
    }

    setLoading(true)
    const t = setTimeout(() => {
      if (!cancelled) {
        console.warn('[Planner] plan timeout')
        setError('Timeout serveur lors de la génération du plan')
        setLoading(false)
      }
    }, 12_000)

      ; (async () => {
        try {
          const tRaw = await getProfileTargets(selectedProfileId)
          const tParsed = ensureTargets(tRaw as unknown)
          if (!cancelled) setTargets(tParsed)

          const pRaw = await generatePlan({ profile_id: selectedProfileId, allow_repeat: true })
          const p = ensureWeekPlan(pRaw as unknown)
          if (!cancelled) setPlan(p)
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          if (!cancelled) setError(msg || 'Erreur lors de la génération du plan')
        } finally {
          clearTimeout(t)
          if (!cancelled) setLoading(false)
        }
      })()

    return () => {
      cancelled = true
      clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProfileId])

  // ------- Quand le plan change → évaluation + macros + nutriments -------
  useEffect(() => {
    if (!plan) return
    void refreshEvaluation(plan.plan_id)
    void refreshMacros(plan.plan_id)
    void refreshNutrients(plan.plan_id)
  }, [plan])

  /* ---------- Actions POST pour items (swap/move) ---------- */

  type SwapBody = {
    day_index: number
    slot: MealSlot
    to_recipe_id: string
    item_index?: number
    course_type?: CourseType | null
  }

  async function swapItem(
    planId: string,
    dayIndex: number,
    slot: MealSlot,
    itemIndex: number | null,
    courseType: CourseType | null,
    toRecipeId: string,
  ) {
    const body: SwapBody = { day_index: dayIndex, slot, to_recipe_id: toRecipeId }
    if (itemIndex != null) body.item_index = itemIndex
    if (courseType) body.course_type = courseType

    const res = await fetch(`/api/menu/${planId}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`swap failed ${res.status}`)
    const updated: WeekPlan = await res.json()
    setPlan(updated)
  }

  type MoveBody = {
    from_day_index: number
    from_slot: MealSlot
    to_day_index: number
    to_slot: MealSlot
    item_index?: number
  }

  async function moveItem(
    planId: string,
    fromDay: number,
    fromSlot: MealSlot,
    itemIndex: number,
    toDay: number,
    toSlot: MealSlot,
  ) {
    const body: MoveBody = {
      from_day_index: fromDay,
      from_slot: fromSlot,
      to_day_index: toDay,
      to_slot: toSlot,
      item_index: itemIndex,
    }
    const res = await fetch(`/api/menu/${planId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`move failed ${res.status}`)
    const updated: WeekPlan = await res.json()
    setPlan(updated)
  }

  // ---------- Rendus d’états ----------

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ color: 'crimson', marginBottom: 8 }}>Erreur : {error}</div>
        <Button onClick={() => void bootstrap()}>Réessayer</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <p>Chargement…</p>
        <Button onClick={() => void bootstrap()} size="sm">
          Recharger
        </Button>
      </div>
    )
  }

  if (!selectedProfileId && profiles.length === 0) {
    return (
      <div style={{ padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Aucun profil</h2>
        <p>Crée un profil pour générer un planning.</p>
        <Link to="/profiles">
          <Button variant="primary">Aller aux profils</Button>
        </Link>
      </div>
    )
  }

  if (!plan) {
    return (
      <div style={{ padding: 16 }}>
        <p>Aucun plan disponible.</p>
        <Button onClick={() => void bootstrap()}>Rafraîchir</Button>
      </div>
    )
  }

  /* ---------------- UI ---------------- */

  return (
    <div style={{ padding: 0 }}>
      {/* Barre sticky : titre + actions */}
      <div
        style={{
          position: 'sticky',
          top: 64,
          zIndex: 5,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'saturate(180%) blur(8px)',
          borderBottom: '1px solid #eef2f7',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20 }}>Semaine {plan.plan_id}</h2>

          {/* Sélecteur de profil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor="profsel" style={{ fontSize: 13, color: '#374151' }}>
              Profil :
            </label>
            <select
              id="profsel"
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', fontSize: 14 }}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name ?? p.external_code ?? p.id}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }} />

          <Button
            onClick={async () => {
              try {
                if (!selectedProfileId) {
                  alert('Choisis un profil')
                  return
                }
                setLoading(true)
                const raw = (await generatePlan({
                  profile_id: selectedProfileId,
                  allow_repeat: true,
                })) as unknown
                const p = ensureWeekPlan(raw)
                setPlan(p)
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e)
                setError(msg || 'Erreur lors de la régénération du plan')
              } finally {
                setLoading(false)
              }
            }}
            variant="primary"
          >
            Régénérer
          </Button>
          <Button
            onClick={async () => {
              const list = await shoppingList(plan.plan_id)
              const txt = list.items.map((i) => `- ${i.name}: ${i.quantity_g} g`).join('\n')
              alert(`Liste de courses:\n\n${txt}`)
            }}
          >
            Liste de courses
          </Button>
        </div>
      </div>

      {/* Totaux semaine — stat cards */}
      {evalRes && (
        <div style={{ maxWidth: 1180, margin: '16px auto 0', padding: '0 16px' }}>
          <h3 style={{ margin: '6px 0 10px' }}>Totaux semaine</h3>
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            }}
          >
            <WeeklyStatCard
              label="kcal"
              value={evalRes.week_totals.energy_kcal}
              unit="kcal"
              targetPerDay={targets?.kcal_per_day ?? 0}
            />
            <WeeklyStatCard
              label="Prot"
              value={evalRes.week_totals.protein_g}
              unit="g"
              targetPerDay={targets?.protein_g_per_day ?? 0}
            />
            <WeeklyStatCard
              label="Glu"
              value={evalRes.week_totals.carbs_g}
              unit="g"
              targetPerDay={targets?.carbs_g_per_day ?? 0}
            />
            <WeeklyStatCard
              label="Lip"
              value={evalRes.week_totals.fat_g}
              unit="g"
              targetPerDay={targets?.fat_g_per_day ?? 0}
            />
          </div>

          {/* bloc détaillé autres nutriments */}
          {nutri && targets && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer' }}>Autres nutriments — totaux vs cibles</summary>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '220px 1fr 1fr 1fr',
                  gap: 6,
                  marginTop: 8,
                  padding: '8px 0',
                }}
              >
                <div style={{ fontWeight: 600 }}>Nutriment</div>
                <div style={{ fontWeight: 600 }}>Total semaine</div>
                <div style={{ fontWeight: 600 }}>Cible semaine</div>
                <div style={{ fontWeight: 600 }}>Δ</div>

                {(Object.keys(nutri.totals_week) as string[]).map((k) => {
                  const tot = nutri.totals_week[k] ?? 0
                  const tgt = nutri.targets_week[k]
                  const diff = nutri.diffs_week[k]
                  const unit = nutri.units[k] || ''
                  const fmt = (v: number | null | undefined) =>
                    v == null ? '—' : Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10
                  return (
                    <Fragment key={k}>
                      <div>{k}</div>
                      <div>
                        {fmt(tot)} {unit}
                      </div>
                      <div>{tgt == null ? '—' : `${fmt(tgt)} ${unit}`}</div>
                      <div style={{ color: (diff ?? 0) >= 0 ? 'green' : 'crimson' }}>
                        {diff == null ? '—' : `${diff >= 0 ? '+' : ''}${fmt(diff)} ${unit}`}
                      </div>
                    </Fragment>
                  )
                })}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Grille des jours */}
      <div
        style={{
          maxWidth: 1180,
          margin: '14px auto 32px',
          display: 'grid',
          gridTemplateColumns: '160px repeat(3, 1fr)',
          gap: 10,
          padding: '0 16px',
        }}
      >
        <div />
        {SLOTS.map((s) => (
          <div key={s} style={{ fontWeight: 800 }}>
            {SLOT_LABEL[s]}
          </div>
        ))}

        {plan.days.map((day, di) => (
          <Fragment key={di}>
            {/* Libellé du jour */}
            <div style={{ padding: '8px 0', fontWeight: 700, color: '#111827' }}>Jour {di + 1}</div>

            {/* Colonnes par slot */}
            {SLOTS.map((slot) => {
              const m: Meal | undefined = day.meals.find((x) => x.slot === slot)

              const items: MealItem[] | null =
                m?.items && Array.isArray(m.items) && m.items.length > 0
                  ? m.items
                  : m?.recipe_id
                    ? [{ recipe_id: m.recipe_id, servings: mealServings(m), course_type: 'main' }]
                    : null

              const mac = macros?.days?.[di]?.[slot] || null

              return (
                <div key={`${di}-${slot}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items?.map((it, idx) => {
                    const rid = it.recipe_id
                    const r = recIndex[rid]
                    const servings = itemServings(it)
                    const badge =
                      it.course_type ? (it.course_type === 'dessert' ? 'Dessert' : 'Plat') : idx === 0 ? 'Plat' : 'Item'
                    const sub = r ? [`${r.time_min ?? 15} min`, fmtServings(servings)].join(' • ') : fmtServings(servings)

                    return (
                      <Card key={`${di}-${slot}-${idx}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Chip>{badge}</Chip>
                              <Link
                                to={`/recipes/bdd/${rid}`} // adapte si ta route est différente
                                style={{ fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}
                              >
                                {r?.name ?? rid}
                              </Link>
                            </div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{sub}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <IconButton
                              title="Remplacer"
                              onClick={async () => {
                                const ct: CourseType | null =
                                  (it.course_type as CourseType | null) ?? (idx === 0 ? 'main' : null)
                                const candidates = recipes
                                  .filter((rr) => (ct ? rr.course_type === ct : true))
                                  .filter((rr) => (rr.meal_types || []).includes(slot))
                                if (!candidates.length) {
                                  alert('Aucune recette candidate.')
                                  return
                                }
                                const idList = candidates
                                  .slice(0, 24)
                                  .map((c) => `- ${c.id} (${c.name})`)
                                  .join('\n')
                                const pick = window.prompt(
                                  `ID recette (${ct ?? 'any'}) pour ${slot}:\n\n${idList}\n\nTape un ID:`,
                                )
                                if (!pick) return
                                try {
                                  await swapItem(plan.plan_id, di, slot, m?.items ? idx : null, ct, pick)
                                } catch (e) {
                                  console.error(e)
                                  alert('Swap échoué')
                                }
                              }}
                              icon="swap"
                            />
                            <IconButton
                              title="Déplacer"
                              onClick={async () => {
                                if (!m?.items) {
                                  alert("Ce repas est en format ancien (1 item) : utilise 'Déplacer' global.")
                                  return
                                }
                                const toDayStr = window.prompt('Déplacer vers quel jour (1..7) ?') ?? ''
                                const toDay = Number(toDayStr)
                                if (!Number.isFinite(toDay) || toDay < 1 || toDay > 7) return
                                const toSlotStr = (window.prompt('Slot cible (breakfast|lunch|dinner) ?') ?? '').toLowerCase()
                                if (!isMealSlot(toSlotStr)) return
                                try {
                                  await moveItem(plan.plan_id, di, slot, idx, toDay - 1, toSlotStr)
                                } catch (e) {
                                  console.error(e)
                                  alert('Déplacement échoué')
                                }
                              }}
                              icon="move"
                            />
                          </div>
                        </div>
                      </Card>
                    )
                  })}

                  {mac && (
                    <div style={{ fontSize: 12, opacity: 0.65, marginLeft: 2 }}>{fmtMacro(mac)}</div>
                  )}
                </div>
              )
            })}

            {/* Total jour */}
            <div style={{ gridColumn: '2 / span 3' }}>
              <DayTotalCard total={macros?.totals?.[di] || null} index={di} />
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

/* ------------------ UI components ------------------ */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 12,
        background: '#fff',
        boxShadow: '0 1px 0 rgba(16,24,40,0.02)',
      }}
    >
      {children}
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 999,
        border: '1px solid #e5e7eb',
        background: '#f8fafc',
      }}
    >
      {children}
    </span>
  )
}

type ButtonProps = {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit' | 'reset'
}

function Button({
  children,
  onClick,
  variant = 'ghost',
  size = 'md',
  type = 'button',
}: ButtonProps) {
  const base: React.CSSProperties = {
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    background: '#fff',
    fontWeight: 600,
  }
  const paddings: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: '6px 10px',
    md: '8px 12px',
  }
  const style: React.CSSProperties =
    variant === 'primary'
      ? { ...base, background: '#111827', color: '#fff', border: '1px solid #111827', padding: paddings[size] }
      : { ...base, padding: paddings[size] }

  return (
    <button type={type} onClick={onClick} style={style}>
      {children}
    </button>
  )
}

function IconButton({
  title,
  onClick,
  icon,
}: {
  title: string
  onClick: () => void
  icon: 'swap' | 'move'
}) {
  const glyph = icon === 'swap' ? '↔︎' : '⇅'
  return (
    <button
      title={title}
      onClick={onClick}
      aria-label={title}
      style={{
        borderRadius: 10,
        border: '1px solid #e5e7eb',
        width: 36,
        height: 36,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        cursor: 'pointer',
        fontSize: 16,
      }}
    >
      {glyph}
    </button>
  )
}

function DayTotalCard({ total, index }: { total: Macro | null; index: number }) {
  if (!total) {
    return (
      <div
        style={{
          border: '1px dashed #e5e7eb',
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 12,
          color: '#637381',
          background: '#fafafa',
        }}
      >
        Totaux jour {index + 1} : en cours…
      </div>
    )
  }
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: '10px 12px',
        fontSize: 13,
        background: '#f8fafc',
      }}
    >
      <strong>Total jour {index + 1} :</strong>{' '}
      {total.kcal} kcal — Prot {total.protein_g} g — Glu {total.carbs_g} g — Lip {total.fat_g} g
    </div>
  )
}

/* ---------- Weekly stat card component ---------- */

function WeeklyStatCard({
  label,
  value,
  unit,
  targetPerDay,
}: {
  label: string
  value: number
  unit: string
  targetPerDay: number
}) {
  const weekTarget = (targetPerDay ?? 0) * 7
  const delta = value - weekTarget
  const pct = weekTarget > 0 ? (value / weekTarget) * 100 : 0
  const pctClamped = Math.max(0, Math.min(200, pct))

  const barBg = '#eef2f7'
  const barFg = pct >= 95 && pct <= 105 ? '#10b981' : pct < 95 ? '#f59e0b' : '#ef4444'

  const fmt = (n: number) => (Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10)

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        background: '#fff',
        padding: 14,
      }}
    >
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{fmt(value)}</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{unit} / semaine</div>
      </div>

      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
        Cible: <b>{fmt(weekTarget)}</b> {unit} — Δ:{' '}
        <span style={{ color: delta >= 0 ? '#16a34a' : '#ef4444' }}>
          {delta >= 0 ? '+' : ''}
          {fmt(delta)} {unit}
        </span>{' '}
        — {fmt(pct)}%
      </div>

      <div style={{ marginTop: 8, height: 8, background: barBg, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pctClamped}%`, height: '100%', background: barFg }} />
      </div>
    </div>
  )
}
