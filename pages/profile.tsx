import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [expires, setExpires] = useState<string | null>(null)
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_DISPLAY || process.env.WHATSAPP_NUMBER_DISPLAY || 'your WhatsApp number'

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    })()
  }, [])

  async function saveBasic() {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({
      full_name: (document.getElementById('fullName') as HTMLInputElement).value,
      phone: (document.getElementById('phone') as HTMLInputElement).value
    }).eq('id', user.id)
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
    setSaving(false)
  }

  async function generateCode() {
    setCode(null); setExpires(null)
    const r = await fetch('/api/wa-link-code', { method: 'POST' })
    const j = await r.json()
    if (j.code) { setCode(j.code); setExpires(j.expires) }
  }

  if (!user || !profile) return <div className="page"><h2>Profile</h2><p>Please sign in.</p></div>

  return (
    <div className="page">
      <h2>Profile</h2>

      <div className="card">
        <label className="label">Full name</label>
        <input id="fullName" className="input" defaultValue={profile.full_name || ''} />

        <label className="label mt">Phone (E.164, e.g. +2760...)</label>
        <input id="phone" className="input" defaultValue={profile.phone || ''} placeholder="+27..." />

        <button className="btn mt" disabled={saving} onClick={saveBasic}>{saving ? 'Saving...' : 'Save'}</button>
      </div>

      <div className="card mt">
        <h3>Link my WhatsApp</h3>
        <p className="muted">Generate a one-time code, then message it to <b>{waNumber}</b> on WhatsApp:</p>
        <pre className="code">link 123456</pre>
        <button className="btn" onClick={generateCode}>Generate code</button>

        {code && (
          <div className="hint">
            <p>Send this in WhatsApp within 15 minutes:</p>
            <pre className="code">link {code}</pre>
            <p className="muted">Expires: {new Date(expires!).toLocaleString()}</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .page { max-width: 720px; margin: 24px auto; padding: 0 16px; }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
        .mt { margin-top: 16px; }
        .label { font-size: 14px; color: #374151; margin-bottom: 6px; display:block; }
        .input { width:100%; border:1px solid #e5e7eb; border-radius:10px; padding:10px; }
        .btn { display:inline-flex; align-items:center; gap:8px; background:#0b1f3a; color:#fff; border:none; border-radius:10px; padding:10px 14px; cursor:pointer; }
        .muted { color:#6b7280; }
        .code { background:#0b1f3a; color:#fff; padding:8px 10px; border-radius:8px; display:inline-block; }
        .hint { margin-top:12px; background:#f0f9ff; border:1px solid #bae6fd; padding:10px; border-radius:8px; }
      `}</style>
    </div>
  )
}
