export type Profile = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  qr_code: string | null
  is_admin: boolean
}

export type Booking = {
  id: string
  user_id: string
  facility_id: string
  start_time: string // ISO
  end_time: string // ISO
  project_name: string | null
  project_updates: string | null
  studio_equipment: string[] | null
  created_at: string
}
