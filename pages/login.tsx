import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin'|'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Account created. Please check your email to confirm, then sign in.')
        setMode('signin')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (e: any) {
      setErr(e.message || 'Auth failed')
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{maxWidth: 420, margin: '40px auto', background:'#fff', padding:16, borderRadius:12, border:'1px solid #e5e7eb'}}>
      <h2 style={{marginBottom:12}}>{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
      <form onSubmit={handleAuth}>
        <label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <label className="label" style={{marginTop:10}}>Password</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />

        {err && <p style={{color:'#dc2626', marginTop:8}}>{err}</p>}

        <button className="btn" type="submit" disabled={loading} style={{marginTop:12, width:'100%'}}>
          {loading ? 'Please wait…' : (mode==='signin' ? 'Sign in' : 'Sign up')}
        </button>
      </form>

      <div style={{display:'flex', justifyContent:'space-between', marginTop:12}}>
        <button className="btn" onClick={()=>setMode(mode==='signin'?'signup':'signin')}>
          {mode==='signin' ? 'Create account' : 'Have an account? Sign in'}
        </button>
        <button className="btn" onClick={signOut}>Sign out</button>
      </div>
    </div>
  )
}
