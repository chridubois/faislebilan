import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as profiles from '../../api/profiles'
import type { ProfileListItem } from '../../api/profiles'

const GENDER_LABEL: Record<string, string> = {
  m: 'H', f: 'F', nb: 'NB',
  male: 'H', female: 'F', other: 'Autre',
}
const ACTIVITY_LABEL: Record<string, string> = {
  sedentary: 'Séd.',
  light: 'Léger',
  moderate: 'Mod.',
  active: 'Actif',
  very_active: 'Très actif',
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

export default function ProfilesList() {
  const [rows, setRows] = useState<ProfileListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    profiles
      .listProfiles()
      .then((list) => { if (alive) setRows(list ?? []) })
      .catch((e) => { if (alive) setError(e?.message || 'Erreur') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  if (loading) return <div className="max-w-5xl mx-auto p-6">Chargement…</div>
  if (error) return <div className="max-w-5xl mx-auto p-6 text-red-600">Erreur : {error}</div>

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Profils</h1>
        {/* <Link to="/profiles/new" className="px-3 py-1.5 rounded bg-black text-white text-sm">Nouveau profil</Link> */}
      </div>

      <div className="border rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-[minmax(14rem,1fr)_8rem_6rem_12rem] gap-x-4 bg-gray-50 text-sm font-medium">
          <div className="px-3 py-2">Nom</div>
          <div className="px-3 py-2">Genre</div>
          <div className="px-3 py-2">Âge</div>
          <div className="px-3 py-2">Activité</div>
        </div>
        <div className="divide-y">
          {rows.map((p) => {
            return (
              // ...
              <Link
                key={p.id ?? p.external_code ?? Math.random()}
                to={(p.id ?? p.external_code) ? `/profiles/${p.id ?? p.external_code}` : '#'}
                aria-disabled={!p.id && !p.external_code}
                onClick={(e) => { if (!p.id && !p.external_code) e.preventDefault() }}
                className="grid grid-cols-[minmax(14rem,1fr)_8rem_6rem_12rem] gap-x-4 hover:bg-gray-50 transition"
              >
                <div className="px-3 py-2 font-medium">{p.name}</div>
                <div className="px-3 py-2 text-gray-700">{GENDER_LABEL[p.gender] || p.gender}</div>
                <div className="px-3 py-2 text-gray-700">{(p.age_years ?? computeAge(p.birth_date)) ?? '—'}</div>
                <div className="px-3 py-2 text-gray-700">{p.activity ? (ACTIVITY_LABEL[p.activity] || p.activity) : '—'}</div>
              </Link>

            )
          })}
          {rows.length === 0 && (
            <div className="px-3 py-8 text-center text-gray-500">Aucun profil</div>
          )}
        </div>
      </div>
    </div>
  )
}
