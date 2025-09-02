import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Assistant() {
  const [input, setInput] = useState('')
  const [suggestion, setSuggestion] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  async function ask() {
    setBusy(true); setSuggestion(null)
    const r = await fetch('/api/ai-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: input })
    })
    const j = await r.json()
    setSuggestion(j)
    setBusy(false)
  }

  async function createBooking() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Sign in first.'); return }
    if (!suggestion?.facility_id || !suggestion?.date || !suggestion?.time) { alert('Missing fields.'); return }
    const start = new Date(`${suggestion.date}T${suggestion.time}:00`)
    const end = new Date(start.getTime() + 60*60*1000)
    const { error } = await supabase.from('bookings').insert({
      user_id: user.id,
      facility_id: suggestion.facility_id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      project_name: suggestion.project || 'AI booking'
    })
    if (error) alert(error.message); else alert('Booked! Check your dashboard.')
  }

  return (
    <div className="page">
      <h2>AI Booking Assistant</h2>
      <div className="row">
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder='e.g., "book studio tomorrow 2pm for Podcast Z"' />
        <button onClick={ask} disabled={busy}>{busy?'Thinking...':'Suggest'}</button>
      </div>

      {suggestion && (
        <div className="card">
          <h4>Suggestion</h4>
          <pre>{JSON.stringify(suggestion, null, 2)}</pre>
          {suggestion.facility_id && suggestion.date && suggestion.time && (
            <button onClick={createBooking}>Create booking</button>
          )}
        </div>
      )}

      <style jsx>{`
        .page { max-width:720px; margin:24px auto; padding:0 16px; }
        .row { display:flex; gap:8px; }
        input { flex:1; padding:10px; border:1px solid #e5e7eb; border-radius:10px; }
        button { padding:10px 14px; border-radius:10px; background:#0b1f3a; color:white; border:none; }
        .card { margin-top:12px; border:1px solid #e5e7eb; border-radius:12px; padding:12px; background:#fff; }
        pre { background:#0b1f3a; color:#fff; padding:8px; border-radius:8px; overflow:auto; }
      `}</style>
    </div>
  )
}
