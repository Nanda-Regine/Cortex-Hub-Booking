import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const FACILITIES = ['robotics','studio','ecfilm','esports','electronics','arm','automotive','baremetal']

type BookingRow = {
  id: string
  user_id: string
  facility_id: string
  start_time: string
  end_time: string
  project_name: string | null
  studio_equipment: string[] | null
  profiles?: { full_name?: string | null; email?: string | null } | null
}

export default function Admin() {
  const [profile, setProfile] = useState<any>(null)
  const [facility, setFacility] = useState<string>('robotics')
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Auth + admin check
    (async () => {
      setLoading(true)
      setError(null)
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr) { setError(userErr.message); setLoading(false); return }
      if (!user) { setError('Please sign in as admin'); setLoading(false); return }

      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profErr) { setError(profErr.message); setLoading(false); return }
      if (!prof?.is_admin) { setError('Not authorized'); setLoading(false); return }

      setProfile(prof)
      await loadBookings(facility)
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadBookings(fac: string) {
    setFacility(fac)
    setError(null)
    const { data, error } = await supabase
      .from('bookings')
      .select('id,user_id,facility_id,start_time,end_time,project_name,studio_equipment,profiles(full_name,email)')
      .eq('facility_id', fac)
      .order('start_time', { ascending: true })

    if (error) { setError(error.message); return }
    setBookings((data as BookingRow[]) || [])
  }

  // Realtime: refresh table when bookings change for the selected facility
  useEffect(() => {
    if (!profile?.is_admin) return // subscribe only after admin verified
    const ch = supabase
      .channel(`admin-${facility}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `facility_id=eq.${facility}` },
        () => loadBookings(facility)
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [facility, profile?.is_admin]) // re-subscribe when facility changes

  if (loading) return <div className="card">Loading…</div>
  if (error) return <div className="card text-red-600">{error}</div>

  return (
    <div className="grid gap-4">
      <div className="card flex items-center gap-3">
        <h2 className="text-xl font-semibold">Admin Dashboard</h2>
        <select
          className="input max-w-xs"
          value={facility}
          onChange={(e) => loadBookings(e.target.value)}
        >
          {FACILITIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">User</th>
              <th className="p-2">Start</th>
              <th className="p-2">End</th>
              <th className="p-2">Project</th>
              <th className="p-2">Studio Gear</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr><td className="p-2 text-slate-500" colSpan={5}>No bookings for this facility.</td></tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="p-2">
                  {b.profiles?.full_name || b.user_id}
                  {b.profiles?.email && <span className="text-slate-500"> · {b.profiles.email}</span>}
                </td>
                <td className="p-2">{new Date(b.start_time).toLocaleString()}</td>
                <td className="p-2">{new Date(b.end_time).toLocaleString()}</td>
                <td className="p-2">{b.project_name || '-'}</td>
                <td className="p-2">{(b.studio_equipment || []).join(', ') || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
