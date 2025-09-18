// web/src/api/profiles.ts
import { get, post, patch, del } from './http'

export type Gender = 'm' | 'f' | 'nb' | 'male' | 'female' | 'other'
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | string
export type Goal = 'cut' | 'maintain' | 'bulk' | 'custom' | string

export type Profile = {
  id: string
  user_id?: string | null
  external_code?: string | null

  // certains jeux de données ont name, d'autres first_name/last_name
  name?: string | null
  first_name?: string | null
  last_name?: string | null

  gender: Gender
  birth_date?: string | null
  age_years?: number | null

  weight_kg?: number | null
  height_cm?: number | null
  activity?: Activity | null
  goal?: Goal | null
  food_budget_level?: string | null
  max_time_per_meal_min?: number | null

  created_at?: string
}

export type ProfileListItem = Pick<
  Profile,
  'id' | 'name' | 'external_code' | 'weight_kg' | 'height_cm' | 'food_budget_level' | 'max_time_per_meal_min' |
  'gender' | 'birth_date' | 'age_years' | 'activity' | 'goal' | 'created_at'
>

export type NewProfile = {
  name?: string | null
  first_name?: string | null
  last_name?: string | null
  gender: Gender
  birth_date?: string | null
  weight_kg: number
  height_cm: number
  activity: Activity
  goal: Goal
  age_years?: number | null
  food_budget_level?: string | null
  max_time_per_meal_min?: number | null
  user_id?: string | null
  external_code?: string | null
}

export type ProfilePatch = Partial<NewProfile>

export type ProfileTarget = {
  profile_id: string
  nutrient_code: string
  unit: string
  target_value?: number | null
  min_value?: number | null
  max_value?: number | null
  priority?: number | null
}

// Endpoints
export const listProfiles = () => get<ProfileListItem[]>('/profiles')
export const getProfile = (id: string) => get<Profile>(`/profiles/${id}`)
export const createProfile = (body: NewProfile) => post<Profile>('/profiles', body)
export const updateProfile = (id: string, patchBody: ProfilePatch) => patch<Profile>(`/profiles/${id}`, patchBody)
type Empty = Record<string, never>
export const deleteProfile = (id: string) => del<{ ok: true } | Empty>(`/profiles/${id}`)
export const getProfileTargets = (id: string) => get<ProfileTarget[]>(`/profiles/${id}/targets`)
