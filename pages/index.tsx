import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

// Map visible names → internal ids
const FACILITY_ID_MAP: Record<string, string> = {
  'EC Film Hub': 'ecfilm',
  'E-Sports & Gaming Club': 'esports',
  'Robotics & Coding Lab': 'robotics',
  'Electronics & Hardware Lab': 'electronics',
  'Arm Ecosystem Lab': 'arm',
  'Automotive Ethernet Lab': 'automotive',
  'Bare Metal as a Service Lab': 'baremetal',
  'Studio Room': 'studio',
}

// Studio checklist (same items as earlier starter)
const STUDIO_EQUIPMENT = [
  'Mic - Condenser',
  'Mic - Dynamic',
  'Pop Filter',
  'Headphones - Monitoring',
  'Audio Interface - 2ch',
  'Audio Interface - 4ch',
  'Mixer',
  'MIDI Keyboard',
  'Electric Guitar',
  'Bass Guitar',
  'Acoustic Guitar',
  'Drum Kit',
  'Keyboard Stand',
  'Studio Monitors (L/R)',
  'XLR Cables',
  'Instrument Cables',
  'Mic Stands',
  'Camera - 4K',
  'Tripod',
  'LED Light Panel',
  'Green Screen',
  'Teleprompter'
]

type BookingFormState = {
  fullName: string
  emailAddress: string
  whatsappConfirm: boolean
  phone?: string
  bookingDate: string
  startTime: string
  endTime: string
  specialRequirements: string
  studioEquipment: string[]
}

export default function Home() {
  const router = useRouter()

  // Modal/UI state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFacilityName, setModalFacilityName] = useState<string>('E-Sports & Gaming Club')
  const [modalIcon, setModalIcon] = useState<string>('🎮')

  // User profile prefill
  const [profile, setProfile] = useState<any>(null)

  // Form state
  const [form, setForm] = useState<BookingFormState>({
    fullName: '',
    emailAddress: '',
    whatsappConfirm: false,
    phone: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    specialRequirements: '',
    studioEquipment: [],
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (prof) {
          setProfile(prof)
          setForm(f => ({
            ...f,
            fullName: prof.full_name || '',
            emailAddress: prof.email || user.email || '',
            phone: prof.phone || ''
          }))
        }
      }
    })()
  }, [])

  function openModal(name: string, icon: string) {
    setModalFacilityName(name)
    setModalIcon(icon)
    setModalOpen(true)
    const today = new Date().toISOString().split('T')[0]
    setForm(f => ({ ...f, bookingDate: f.bookingDate || today }))
    document.body.style.overflow = 'hidden'
  }

  function closeModal() {
    setModalOpen(false)
    document.body.style.overflow = 'auto'
  }

  function toggleEquipment(item: string) {
    setForm(f => {
      const has = f.studioEquipment.includes(item)
      return { ...f, studioEquipment: has ? f.studioEquipment.filter(x => x !== item) : [...f.studioEquipment, item] }
    })
  }

  async function submitBooking() {
    if (!form.fullName || !form.emailAddress || !form.bookingDate || !form.startTime || !form.endTime) {
      alert('Please fill all required fields (Full Name, Email, Date, Start, End).')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please sign in first.')
      router.push('/login')
      return
    }

    const facility_id = FACILITY_ID_MAP[modalFacilityName]
    if (!facility_id) { alert('Unknown facility.'); return }

    const startLocal = new Date(`${form.bookingDate}T${form.startTime}:00`)
    const endLocal = new Date(`${form.bookingDate}T${form.endTime}:00`)
    if (!(startLocal < endLocal)) {
      alert('End time must be after start time.')
      return
    }

    setSubmitting(true)

    // Persist phone to profile if we have one and it changed (optional nice-to-have)
    if (form.phone && profile?.id) {
      await supabase.from('profiles').update({ phone: form.phone, full_name: form.fullName, email: form.emailAddress }).eq('id', profile.id)
    }

    const project_updates = [
      form.specialRequirements?.trim() ? `Notes: ${form.specialRequirements.trim()}` : '',
      form.whatsappConfirm ? `Confirm via WhatsApp: yes (${form.phone || 'no phone'})` : ''
    ].filter(Boolean).join(' | ')

    const { data, error } = await supabase.from('bookings').insert({
      user_id: user.id,
      facility_id,
      start_time: startLocal.toISOString(),
      end_time: endLocal.toISOString(),
      project_name: `Booking for ${modalFacilityName}`,
      project_updates: project_updates || null,
      studio_equipment: facility_id === 'studio' ? form.studioEquipment : null
    }).select().single()

    setSubmitting(false)

    if (error) {
      alert(`Could not create booking: ${error.message}`)
      return
    }

    // WhatsApp confirmation (optional)
    if (form.whatsappConfirm && form.phone) {
      try {
        await fetch('/api/notify-whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: form.phone,
            message:
              `Cortex Hub: Booking confirmed\n` +
              `Facility: ${modalFacilityName}\n` +
              `Date: ${form.bookingDate}\n` +
              `Time: ${form.startTime} - ${form.endTime}\n` +
              (facility_id === 'studio' && form.studioEquipment.length ? `Studio gear: ${form.studioEquipment.join(', ')}\n` : '') +
              `Ref: ${data.id}`
          })
        })
      } catch { /* non-blocking */ }
    }

    alert('Booking submitted successfully! You can view it in your Dashboard.')
    closeModal()
    router.push(`/dashboard?facility=${facility_id}`)
  }

  const isStudio = modalFacilityName === 'Studio Room'

  return (
    <>
      <div className="container">
        <div className="header">
          <h1>Book a Space at The Cortex Hub</h1>
          <p>Access cutting-edge facilities designed for innovation. From film production to robotics development, find the perfect space for your next breakthrough project.</p>
        </div>

        <div className="facilities-section">
          <div className="section-title">
            <h2>Available Facilities</h2>
            <p className="section-subtitle">Choose from our state-of-the-art spaces</p>
          </div>

          <div className="facilities-grid">
            {/* Cards */}
            <div className="facility-card" onClick={() => openModal('EC Film Hub', '🎬')}>
              <div className="facility-icon">🎬</div>
              <h3>EC Film Hub</h3>
              <p>Professional film studio with 4K cameras, lighting equipment, and green screen.</p>
              <div className="facility-features">
                <span className="feature-tag">4K Cameras</span><span className="feature-tag">Professional Lighting</span><span className="feature-tag">Green Screen</span><span className="feature-tag">Audio Recording</span>
              </div>
              <button className="book-button">Book EC Film Hub</button>
            </div>

            <div className="facility-card" onClick={() => openModal('E-Sports & Gaming Club', '🎮')}>
              <div className="facility-icon">🎮</div>
              <h3>E-Sports & Gaming Club</h3>
              <p>Gaming arena with professional gaming rigs and streaming equipment.</p>
              <div className="facility-features">
                <span className="feature-tag">Gaming PCs</span><span className="feature-tag">Pro Equipment</span><span className="feature-tag">Streaming Setup</span><span className="feature-tag">Tournament Mode</span>
              </div>
              <button className="book-button">Book E-Sports & Gaming Club</button>
            </div>

            <div className="facility-card" onClick={() => openModal('Robotics & Coding Lab', '🤖')}>
              <div className="facility-icon">🤖</div>
              <h3>Robotics & Coding Lab</h3>
              <p>Fully equipped workspace with 3D printers, sensors, and high-performance workstations for robotics and software development.</p>
              <div className="facility-features">
                <span className="feature-tag">3D Printers</span><span className="feature-tag">Arduino/Raspberry Pi</span><span className="feature-tag">High-spec PCs</span><span className="feature-tag">Collaborative Workspace</span>
              </div>
              <button className="book-button">Book Robotics & Coding Lab</button>
            </div>

            <div className="facility-card" onClick={() => openModal('Electronics & Hardware Lab', '🔧')}>
              <div className="facility-icon">🔧</div>
              <h3>Electronics & Hardware Lab</h3>
              <p>Workshop for electronics prototyping with soldering stations, oscilloscopes, and various components.</p>
              <div className="facility-features">
                <span className="feature-tag">Soldering Stations</span><span className="feature-tag">Oscilloscopes</span><span className="feature-tag">Power Supplies</span><span className="feature-tag">Component Library</span>
              </div>
              <button className="book-button">Book Electronics & Hardware Lab</button>
            </div>

            <div className="facility-card" onClick={() => openModal('Arm Ecosystem Lab', '💻')}>
              <div className="facility-icon">💻</div>
              <h3>Arm Ecosystem Lab</h3>
              <p>Specialized lab for development on Arm-based hardware and systems.</p>
              <div className="facility-features">
                <span className="feature-tag">Arm Boards</span><span className="feature-tag">Development Tools</span><span className="feature-tag">Debuggers</span><span className="feature-tag">IoT</span>
              </div>
              <button className="book-button">Book Arm Ecosystem Lab</button>
            </div>

            <div className="facility-card" onClick={() => openModal('Automotive Ethernet Lab', '🚗')}>
              <div className="facility-icon">🚗</div>
              <h3>Automotive Ethernet Lab</h3>
              <p>Test and validation environment for automotive Ethernet applications.</p>
              <div className="facility-features">
                <span className="feature-tag">CAN/LIN Analysis</span><span className="feature-tag">Network Switches</span><span className="feature-tag">Test Benches</span><span className="feature-tag">Validation Tools</span>
              </div>
              <button className="book-button">Book Automotive Ethernet Lab</button>
            </div>

            <div className="facility-card" onClick={() => openModal('Bare Metal as a Service Lab', '🖥️')}>
              <div className="facility-icon">🖥️</div>
              <h3>Bare Metal as a Service Lab</h3>
              <p>Cloud of bare metal physical servers optimized for performance and low-latency.</p>
              <div className="facility-features">
                <span className="feature-tag">Dedicated Servers</span><span className="feature-tag">High-performance Computing</span><span className="feature-tag">Custom OS</span><span className="feature-tag">24/7 Access</span>
              </div>
              <button className="book-button">Book Bare Metal as a Service Lab</button>
            </div>

            <div className="facility-card" onClick={() => openModal('Studio Room', '🎵')}>
              <div className="facility-icon">🎵</div>
              <h3>Studio Room</h3>
              <p>Professional recording studio with audio equipment, microphones, and acoustic treatment.</p>
              <div className="facility-features">
                <span className="feature-tag">Professional Mics</span><span className="feature-tag">Audio Interface</span><span className="feature-tag">Acoustic Treatment</span><span className="feature-tag">Mixing Desk</span>
              </div>
              <button className="book-button">Book Studio Room</button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <div className={`modal-overlay ${modalOpen ? 'active' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
        <div className="modal">
          <div className="modal-header">
            <div className="icon">{modalIcon}</div>
            <h3>Book {modalFacilityName}</h3>
            <p>Complete the form to create your booking.</p>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input id="fullName" value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} required />
              </div>
              <div className="form-group">
                <label htmlFor="emailAddress">Email Address *</label>
                <input id="emailAddress" type="email" value={form.emailAddress} onChange={e=>setForm({...form, emailAddress:e.target.value})} required />
              </div>
            </div>

            <div className="checkbox-group" style={{alignItems:'flex-start', gap:12}}>
              <div>
                <input type="checkbox" id="whatsappConfirm" checked={form.whatsappConfirm} onChange={e=>setForm({...form, whatsappConfirm:e.target.checked})} />
              </div>
              <div style={{flex:1}}>
                <label htmlFor="whatsappConfirm">Send booking confirmation via WhatsApp</label>
                <div className="checkbox-note">Enter your WhatsApp number to receive a confirmation message.</div>
                {form.whatsappConfirm && (
                  <div className="form-group" style={{marginTop:12}}>
                    <label htmlFor="phone">Phone (WhatsApp)</label>
                    <input id="phone" placeholder="+27..." value={form.phone || ''} onChange={e=>setForm({...form, phone:e.target.value})} />
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bookingDate">Booking Date *</label>
              <input id="bookingDate" type="date" min={new Date().toISOString().split('T')[0]} value={form.bookingDate} onChange={e=>setForm({...form, bookingDate:e.target.value})} required />
            </div>

            <div className="time-grid">
              <div className="form-group">
                <label htmlFor="startTime">Start Time *</label>
                <select id="startTime" value={form.startTime} onChange={e=>setForm({...form, startTime:e.target.value})} required>
                  <option value="">Select start...</option>
                  {['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'].map(t=>(
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="endTime">End Time *</label>
                <select id="endTime" value={form.endTime} onChange={e=>setForm({...form, endTime:e.target.value})} required>
                  <option value="">Select end...</option>
                  {['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(t=>(
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {isStudio && (
              <div className="form-group">
                <label>Studio equipment checklist</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, maxHeight:200, overflow:'auto', padding:12, border:'1px solid #eee', borderRadius:6 }}>
                  {STUDIO_EQUIPMENT.map(item => {
                    const checked = form.studioEquipment.includes(item)
                    return (
                      <label key={item} style={{ display:'flex', alignItems:'center', gap:8, fontSize:14 }}>
                        <input type="checkbox" checked={checked} onChange={()=>toggleEquipment(item)} />
                        {item}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="specialRequirements">Notes or Special Requirements</label>
              <textarea id="specialRequirements" placeholder="Let us know if you have any special needs..." value={form.specialRequirements} onChange={e=>setForm({...form, specialRequirements:e.target.value})} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-cancel" onClick={closeModal} disabled={submitting}>Cancel</button>
            <button className="btn-submit" onClick={submitBooking} disabled={submitting}>{submitting ? 'Creating...' : 'Create Booking'}</button>
          </div>
        </div>
      </div>

      {/* Styles (global + scoped) */}
      <style jsx global>{`
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); min-height:100vh; padding:20px 0; }
      `}</style>
      <style jsx>{`
        .container { max-width:1200px; margin:0 auto; padding:0 20px; }
        .header { text-align:center; margin-bottom:50px; color:white; }
        .header h1 { font-size:2.5rem; font-weight:700; margin-bottom:10px; color:#1a1a1a; }
        .header p { font-size:1rem; opacity:0.8; max-width:600px; margin:0 auto; color:#333; }
        .facilities-section { background:white; border-radius:12px; padding:40px; box-shadow:0 10px 30px rgba(0,0,0,0.1); }
        .section-title { text-align:center; margin-bottom:30px; }
        .section-title h2 { font-size:1.8rem; font-weight:600; color:#1a1a1a; margin-bottom:8px; }
        .section-subtitle { color:#666; font-size:0.95rem; }
        .facilities-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:25px; margin-top:40px; }
        .facility-card { background:white; border:1px solid #e5e5e5; border-radius:8px; padding:25px; text-align:center; transition:all .3s ease; cursor:pointer; }
        .facility-card:hover { border-color:#667eea; transform:translateY(-2px); box-shadow:0 8px 25px rgba(102,126,234,0.15); }
        .facility-icon { width:48px; height:48px; margin:0 auto 20px; background:#f8f9ff; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:24px; }
        .facility-card h3 { font-size:1.2rem; font-weight:600; color:#1a1a1a; margin-bottom:10px; }
        .facility-card p { color:#666; font-size:0.9rem; line-height:1.5; margin-bottom:20px; }
        .facility-features { display:flex; justify-content:center; gap:15px; margin-bottom:25px; flex-wrap:wrap; }
        .feature-tag { background:#f1f3f4; color:#5f6368; padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:500; }
        .book-button { background:#1a1a1a; color:white; border:none; padding:12px 24px; border-radius:6px; font-weight:500; transition:all .3s ease; width:100%; }
        .book-button:hover { background:#333; }
        .book-button.warning { background:#f59e0b; }
        .book-button.warning:hover { background:#d97706; }
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:none; align-items:center; justify-content:center; z-index:1000; }
        .modal-overlay.active { display:flex; }
        .modal { background:white; border-radius:12px; padding:0; width:90%; max-width:500px; max-height:90vh; overflow-y:auto; }
        .modal-header { background:#2c3e50; color:white; padding:20px 25px; text-align:center; border-radius:12px 12px 0 0; }
        .modal-header .icon { font-size:32px; margin-bottom:10px; }
        .modal-header h3 { font-size:1.4rem; font-weight:600; margin-bottom:5px; }
        .modal-header p { font-size:.9rem; opacity:.9; }
        .modal-body { padding:25px; }
        .form-group { margin-bottom:20px; }
        .form-row { display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:20px; }
        .form-group label { display:block; font-weight:500; color:#333; margin-bottom:8px; }
        .form-group input, .form-group select, .form-group textarea { width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; font-size:1rem; transition:border-color .3s ease; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline:none; border-color:#667eea; }
        .form-group textarea { height:100px; resize:vertical; }
        .checkbox-group { display:flex; margin-bottom:20px; padding:12px; background:#f8f9ff; border-radius:6px; }
        .checkbox-note { font-size:.8rem; color:#666; margin-top:5px; }
        .modal-footer { padding:20px 25px; border-top:1px solid #eee; display:flex; gap:10px; justify-content:flex-end; }
        .btn-cancel { background:#f1f3f4; color:#5f6368; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:500; }
        .btn-submit { background:#1a1a1a; color:white; border:none; padding:10px 24px; border-radius:6px; cursor:pointer; font-weight:500; }
        .btn-submit:hover { background:#333; }
        .time-grid { display:grid; grid-template-columns:1fr 1fr; gap:15px; }
        @media (max-width:768px){ .form-row,.time-grid{ grid-template-columns:1fr; } .modal{ width:95%; margin:20px; } .facilities-grid{ grid-template-columns:1fr; } }
      `}</style>
    </>
  )
}
