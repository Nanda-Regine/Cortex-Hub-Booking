// components/BookingForm.tsx
import { useEffect, useMemo, useState } from 'react'
import { format, addHours } from 'date-fns'
import { supabase } from '@/lib/supabaseClient'

const HOURS = Array.from({ length: 10 }, (_, i) => 9 + i) // 09:00 .. 18:00

export default function BookingForm({ facilityId }: { facilityId: string }) {
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [taken, setTaken] = useState<number[]>([])
  const [hour, setHour] = useState<number>(9)
  const [projectName, setProjectName] = useState('')
  const [projectUpdates, setProjectUpdates] = useState('')
  const [equipment, setEquipment] = useState<string[]>([])
  const [status, setStatus] = useState<string>('')

  // fetch taken hours for the selected day
  useEffect(() => {
    ;(async () => {
      const start = new Date(`${date}T00:00:00`)
      const end = new Date(`${date}T23:59:59`)
      const { data, error } = await supabase
        .from('bookings')
        .select('start_time')
        .eq('facility_id', facilityId)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time')

      if (error) {
        setTaken([])
      } else {
        const hours = (data ?? []).map((r: any) => new Date(r.start_time).getHours())
        setTaken(hours)
      }
    })()
  }, [facilityId, date])

  const availableHours = useMemo(() => HOURS.filter((h) => !taken.includes(h)), [taken])

  async function submit() {
    setStatus('')

    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      setStatus('Please sign in first.')
      return
    }

    const start = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`)
    const end = addHours(start, 1)

    // call the API (server uses service role + handles unique constraint)
    const r = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        facility_id: facilityId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        project_name: projectName || null,
        project_updates: projectUpdates || null,
        studio_equipment: facilityId === 'studio' ? equipment : null,
      }),
    })
    const j = await r.json()
    if (!r.ok) {
      setStatus(j?.error || 'Booking failed')
    } else {
      setStatus('Booked! ✅')
      // refresh taken hours
      const updated = [...taken, hour]
      setTaken(updated)
    }
  }

  function toggleEquip(id: string) {
    setEquipment((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="space-y-4 p-4 rounded-xl border">
      <h3 className="text-lg font-semibold">Book {facilityId}</h3>

      <label className="block">
        <span className="text-sm">Date</span>
        <input
          type="date"
          className="mt-1 w-full rounded border p-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm">Hour</span>
        <select
          className="mt-1 w-full rounded border p-2"
          value={hour}
          onChange={(e) => setHour(parseInt(e.target.value))}
        >
          {availableHours.map((h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, '0')}:00
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm">Project name (optional)</span>
        <input
          className="mt-1 w-full rounded border p-2"
          placeholder="Podcast shoot"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm">Project updates (optional)</span>
        <textarea
          className="mt-1 w-full rounded border p-2"
          rows={3}
          value={projectUpdates}
          onChange={(e) => setProjectUpdates(e.target.value)}
        />
      </label>

      {facilityId === 'studio' && (
        <div>
          <span className="text-sm">Studio equipment</span>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {['Camera', 'Lighting', 'Green Screen', 'Teleprompter', 'Mics'].map((e) => (
              <label key={e} className="flex items-center gap-2">
                <input type="checkbox" checked={equipment.includes(e)} onChange={() => toggleEquip(e)} />
                <span>{e}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={submit}
        className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
      >
        Book
      </button>

      {!!status && <p className="text-sm">{status}</p>}
      {!!taken.length && (
        <p className="text-xs text-gray-500">
          Taken: {taken.map((h) => `${String(h).padStart(2, '0')}:00`).join(', ')}
        </p>
      )}
    </div>
  )
}
