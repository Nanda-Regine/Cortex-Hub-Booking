// pages/api/book.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type Body = {
  user_id: string
  facility_id: string
  start_time: string   // ISO string
  end_time: string     // ISO string
  project_name?: string | null
  project_updates?: string | null
  studio_equipment?: string[] | null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

  const b = req.body as Body
  if (!b?.user_id || !b?.facility_id || !b?.start_time || !b?.end_time) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        user_id: b.user_id,
        facility_id: b.facility_id,
        start_time: b.start_time,
        end_time: b.end_time,
        project_name: b.project_name ?? null,
        project_updates: b.project_updates ?? null,
        studio_equipment: b.studio_equipment ?? null,
      })
      .select()
      .single()

    if (error) {
      // Unique violation (timeslot already booked)
      if ((error as any).code === '23505') {
        return res.status(409).json({ error: 'Time slot already booked' })
      }
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ data })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Server error' })
  }
}
