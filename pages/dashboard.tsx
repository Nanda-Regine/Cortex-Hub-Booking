import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'
import BookingForm from '@/components/BookingForm'
import QRBadge from '@/components/QRBadge'

type Profile = {
  id: string
  email?: string | null
  full_name?: string | null
  avatar_url?: string | null
  qr_code?: string | null
}

type BookingRow = {
  id: string
  user_id: string
  facility_id: string
  start_time: string
  end_time: string
  project_name: string | null
}

export default function Dashboard() {
  const router = useRouter()
  const { facility } = (router.query || {}) as { facility?: string }

  const [profile, setProfile] = useState<Profile | null>(null)
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string>('')

  const [loading, setLoading] = useState(true)
  const [savingAvatar, setSavingAvatar] = useState(false)

  // Bootstrap: auth → profile → bookings
  useEffect(() => {
    if (!router.isReady) return
    ;(async () => {
      setLoading(true)

      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr) {
        console.error(userErr)
        setLoading(false)
        return
      }
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch or create profile
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profErr) console.warn('profiles select error:', profErr)

      if (!prof) {
        // Create minimal profile (depends on your RLS allowing user to insert own row)
        const qr = `cortexhub:${user.id}`
        const { error: insErr } = await supabase
          .from('profiles')
          .insert({ id: user.id, email: user.email, qr_code: qr })
        if (insErr) {
          console.error('profile insert failed:', insErr.message)
        }
        const { data: prof2 } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(prof2 as Profile)
      } else {
        setProfile(prof as Profile)
      }
      // pages/dashboard.tsx (where you create the profile on first login)
if (!prof) {
  const qr = `cortexhub:${user.id}`; // stable, unique
  await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    qr_code: qr
  });
  const { data: prof2 } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  setProfile(prof2);
}


      // Load my bookings
      const { data: myBookings, error: bErr } = await supabase
        .from('bookings')
        .select('id,user_id,facility_id,start_time,end_time,project_name')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true })

      if (bErr) console.warn('bookings list error:', bErr)
      setBookings((myBookings as BookingRow[]) || [])

      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady])

  // Realtime: keep "My bookings" in sync
  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const ch = supabase
        .channel(`my-bookings-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${user.id}` },
          () => {
            supabase
              .from('bookings')
              .select('id,user_id,facility_id,start_time,end_time,project_name')
              .eq('user_id', user.id)
              .order('start_time', { ascending: true })
              .then(({ data }) => {
                if (!active) return
                setBookings((data as BookingRow[]) || [])
              })
          }
        )
        .subscribe()
      return () => {
        active = false
        supabase.removeChannel(ch)
      }
    })()
  }, [])

  async function uploadAvatar() {
    if (!avatarFile || !profile) return
    try {
      setSavingAvatar(true)
      const ext = avatarFile.name.split('.').pop() || 'jpg'
      const safeName = `${Date.now()}.${ext}`
      const filePath = `${profile.id}/${safeName}`

      // Optional: detect content-type
      const options = { contentType: avatarFile.type || 'image/jpeg', upsert: true as const }
      const { error: upErr } = await supabase.storage.from('avatars').upload(filePath, avatarFile, options)
      if (upErr && upErr.message && !upErr.message.includes('already exists')) {
        setMessage(`Upload failed: ${upErr.message}`)
        setSavingAvatar(false)
        return
      }

      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = pub?.publicUrl
      if (!publicUrl) {
        setMessage('Could not get public URL')
        setSavingAvatar(false)
        return
      }

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updErr) {
        setMessage(`Profile update failed: ${updErr.message}`)
      } else {
        setProfile({ ...profile, avatar_url: publicUrl })
        setMessage('Avatar updated')
      }
    } finally {
      setSavingAvatar(false)
      // Clear message after a bit
      setTimeout(() => setMessage(''), 2500)
    }
  }

  if (loading) return <div className="card">Loading…</div>

  return (
    <div className="grid gap-4">
      <section className="grid md:grid-cols-3 gap-4">
        <div className="card md:col-span-2">
          <h2 className="text-xl font-semibold">
            Welcome{profile?.full_name ? `, ${profile.full_name}` : ''}
          </h2>
          <p className="text-slate-600">
            Manage your bookings, projects, collaborations and profile.
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="avatar" className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-skysoft" />
            )}
            <div>
              <div className="text-sm text-slate-600">Upload profile picture</div>
              <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
              <button onClick={uploadAvatar} className="btn mt-2" disabled={savingAvatar || !avatarFile}>
                {savingAvatar ? 'Saving…' : 'Save'}
              </button>
              {message && <p className="text-sm mt-1">{message}</p>}
            </div>
          </div>
        </div>

        {profile?.qr_code && <QRBadge code={profile.qr_code} />}
      </section>

      {facility && (
        <section>
          <BookingForm facilityId={facility} />
        </section>
      )}

      <section className="card">
        <h3 className="text-lg font-semibold mb-2">AI Booking Assistant</h3>
        <p className="text-sm text-slate-600 mb-2">Describe your booking and we’ll pre-fill the form.</p>
        <div className="flex gap-2">
          <input id="aiPrompt" className="input" placeholder='e.g., book studio tomorrow 2pm for Podcast Z' />
          <button
            className="btn"
            onClick={async () => {
              const el = document.getElementById('aiPrompt') as HTMLInputElement
              const prompt = el?.value?.trim()
              if (!prompt) return
              const r = await fetch('/api/ai-book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
              })
              const j = await r.json()
              if (j.facility_id && j.date && j.time) {
                router.push({ pathname: '/dashboard', query: { facility: j.facility_id } })
                alert(`Prefill suggestion -> Date: ${j.date}, Time: ${j.time}, Project: ${j.project || ''}\nSelect the hour and paste project if needed.`)
              } else {
                alert('Could not parse. Try: "Book robotics 2025-08-29 10:00 for Prototype X"')
              }
            }}
          >
            Suggest
          </button>
        </div>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold mb-2">My bookings</h3>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Facility</th>
                <th className="p-2">Start</th>
                <th className="p-2">End</th>
                <th className="p-2">Project</th>
              </tr>
            </thead>
            <tbody>
              {(bookings || []).length === 0 && (
                <tr>
                  <td className="p-2 text-slate-500" colSpan={4}>No bookings yet.</td>
                </tr>
              )}
              {(bookings || []).map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="p-2">{b.facility_id}</td>
                  <td className="p-2">{new Date(b.start_time).toLocaleString()}</td>
                  <td className="p-2">{new Date(b.end_time).toLocaleString()}</td>
                  <td className="p-2">{b.project_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
