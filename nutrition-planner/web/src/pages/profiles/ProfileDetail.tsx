import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as profiles from '../../api/profiles'
import type { Profile, ProfileTarget } from '../../api/profiles'

const GENDER_LABEL: Record<string, string> = {
  m: 'Homme', f: 'Femme', nb: 'Non-binaire',
  male: 'Homme', female: 'Femme', other: 'Autre',
}
const ACTIVITY_LABEL: Record<string, string> = {
  sedentary: 'Sédentaire',
  light: 'Léger',
  moderate: 'Modéré',
  active: 'Actif',
  very_active: 'Très actif',
}
const GOAL_LABEL: Record<string, string> = {
  cut: 'Perte de poids',
  maintain: 'Maintien',
  bulk: 'Prise de masse',
  custom: 'Personnalisé',
}

function computeAge(birth?: string | null): number | null {
  if (!birth) return null
  const d = new Date(birth)
  if (Number.isNaN(+d)) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

function displayName(p: Profile): string {
  if (p.name && p.name.trim()) return p.name.trim()
  const fn = p.first_name?.trim() || ''
  const ln = p.last_name?.trim() || ''
  if (fn || ln) return `${fn}${fn && ln ? ' ' : ''}${ln}`
  if (p.external_code) return p.external_code
  return p.id.slice(0, 8)
}

function fmt(v?: number | null) {
  if (v == null || Number.isNaN(v)) return '—'
  const d = Math.abs(v) >= 10 ? 0 : 2
  return Number(v.toFixed(d)).toString()
}

function prettyCode(code: string) {
  // Fallback "humain" si on n’a pas (encore) de mapping code → nom
  return code.replace(/_/g, ' ')
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [targets, setTargets] = useState<ProfileTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let alive = true
    setLoading(true)
    setError(null)
    Promise.all([profiles.getProfile(id), profiles.getProfileTargets(id)])
      .then(([p, t]) => {
        if (!alive) return
        setProfile(p)
        setTargets(t ?? [])
      })
      .catch((e) => {
        if (alive) setError(e?.message || 'Erreur')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => { alive = false }
  }, [id])

  const sortedTargets = useMemo(() => {
    return [...targets].sort((a, b) => {
      const pa = a.priority ?? 0
      const pb = b.priority ?? 0
      if (pa !== pb) return pb - pa
      return a.nutrient_code.localeCompare(b.nutrient_code)
    })
  }, [targets])

  if (loading) return <div className="max-w-4xl mx-auto p-6">Chargement…</div>
  if (error) return <div className="max-w-4xl mx-auto p-6 text-red-600">Erreur : {error}</div>
  if (!profile) return <div className="max-w-4xl mx-auto p-6">Profil introuvable</div>

  const age = profile.age_years ?? computeAge(profile.birth_date)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{displayName(profile)}</h1>
        <Link to="/profiles" className="text-sm text-gray-600 hover:text-black">← Retour</Link>
      </div>

      {/* Infos de base */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Info label="Genre" value={GENDER_LABEL[profile.gender] || profile.gender} />
        <Info label="Âge" value={age != null ? `${age} ans` : '—'} />
        <Info label="Taille" value={profile.height_cm != null ? `${profile.height_cm} cm` : '—'} />
        <Info label="Poids" value={profile.weight_kg != null ? `${profile.weight_kg} kg` : '—'} />
        <Info label="Activité" value={profile.activity ? (ACTIVITY_LABEL[profile.activity] || profile.activity) : '—'} />
        <Info label="Objectif" value={profile.goal ? (GOAL_LABEL[profile.goal] || profile.goal) : '—'} />
        {profile.max_time_per_meal_min != null && (
          <Info label="Temps max/repas" value={`${profile.max_time_per_meal_min} min`} />
        )}
        {profile.food_budget_level && (
          <Info label="Budget alim." value={profile.food_budget_level} />
        )}
      </div>

      {/* Targets */}
      <div className="border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[minmax(16rem,1fr)_8rem_8rem_8rem_6rem] gap-x-4 bg-gray-50 text-sm font-medium">
          <div className="px-3 py-2">Nutriment (code)</div>
          <div className="px-3 py-2 text-right">Cible</div>
          <div className="px-3 py-2 text-right">Min</div>
          <div className="px-3 py-2 text-right">Max</div>
          <div className="px-3 py-2">Unité</div>
        </div>
        <div className="divide-y">
          {sortedTargets.map((t) => (
            <div key={t.nutrient_code} className="grid grid-cols-[minmax(16rem,1fr)_8rem_8rem_8rem_6rem] gap-x-4">
              <div className="px-3 py-2">{prettyCode(t.nutrient_code)}</div>
              <div className="px-3 py-2 text-right">{fmt(t.target_value)}</div>
              <div className="px-3 py-2 text-right">{fmt(t.min_value)}</div>
              <div className="px-3 py-2 text-right">{fmt(t.max_value)}</div>
              <div className="px-3 py-2">{t.unit || '—'}</div>
            </div>
          ))}
          {sortedTargets.length === 0 && (
            <div className="px-3 py-8 text-center text-gray-500">
              Aucune cible définie pour ce profil.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
