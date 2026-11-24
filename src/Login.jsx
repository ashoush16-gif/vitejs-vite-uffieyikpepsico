import { useState } from 'react'
import { supabase } from './supabaseClient'

const PepsiCoSVG = () => (
  <svg height="42" viewBox="0 0 320 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="36" fill="white" fillOpacity="0.95"/>
    <path d="M40 6 C28 12 18 25 18 40 C18 55 28 68 40 74" stroke="#155798" strokeWidth="2.5" fill="none"/>
    <path d="M40 6 C52 12 62 25 62 40 C62 55 52 68 40 74" stroke="#E31837" strokeWidth="2.5" fill="none"/>
    <line x1="4" y1="40" x2="76" y2="40" stroke="#9ca3af" strokeWidth="1.5"/>
    <line x1="8" y1="24" x2="72" y2="24" stroke="#9ca3af" strokeWidth="1"/>
    <line x1="8" y1="56" x2="72" y2="56" stroke="#9ca3af" strokeWidth="1"/>
    <text x="88" y="56" fontFamily="Arial Black, Arial, sans-serif" fontSize="48" fontWeight="900" fill="white" letterSpacing="-1">pepsico</text>
  </svg>
)

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    let result
    if (mode === 'login') {
      result = await supabase.auth.signInWithPassword({ email, password })
    } else {
      result = await supabase.auth.signUp({ email, password })
    }
    if (result.error) setError(result.error.message)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #02355A 0%, #02355A 50%, #155798 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "Gilroy,Arial,sans-serif", padding: 20,
    }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.04, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, white 40px, white 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, white 40px, white 41px)',
      }}/>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>

        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.1)', borderRadius: 14,
            padding: '12px 24px', border: '1px solid rgba(255,255,255,0.2)',
          }}>
            <PepsiCoSVG />
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 16, padding: 36, boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{
              fontSize: 22, fontWeight: 700, color: '#02355A',
              fontFamily: "'GT Pressura','Arial Narrow',Arial,sans-serif", letterSpacing: 0.5, margin: 0
            }}>
              Daily Direction Setting
            </h1>
            <p style={{ fontSize: 13, color: '#5B6B7B', marginTop: 6 }}>
              SPF Program · Execution Control Tower
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#02355A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Email address
            </label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@pepsico.com"
              style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid #E3E6EA', borderRadius: 8, outline: 'none', fontFamily: "Gilroy,Arial,sans-serif", boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#155798'}
              onBlur={e => e.target.style.borderColor = '#E3E6EA'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#02355A', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Password
            </label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid #E3E6EA', borderRadius: 8, outline: 'none', fontFamily: "Gilroy,Arial,sans-serif", boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#155798'}
              onBlur={e => e.target.style.borderColor = '#E3E6EA'}
            />
          </div>

          {error && (
            <div style={{ background: '#FCE8EB', border: '1px solid #F3B3BE', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#A00D25', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: '100%', padding: '13px',
            background: loading ? '#A6CBF0' : 'linear-gradient(135deg, #155798, #3680CE)',
            color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: loading ? 'default' : 'pointer', fontFamily: "Gilroy,Arial,sans-serif",
            letterSpacing: 0.5, boxShadow: loading ? 'none' : '0 4px 14px rgba(0,75,147,0.4)',
          }}>
            {loading ? 'Signing in...' : mode === 'login' ? 'Sign in to DDS Board' : 'Create account'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#5B6B7B' }}>
            {mode === 'login' ? (
              <>Don't have access?{' '}
                <span onClick={() => setMode('signup')} style={{ color: '#155798', cursor: 'pointer', fontWeight: 500 }}>Request account</span>
              </>
            ) : (
              <>Already registered?{' '}
                <span onClick={() => setMode('login')} style={{ color: '#155798', cursor: 'pointer', fontWeight: 500 }}>Sign in</span>
              </>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
          PepsiCo Confidential · Supply Planning Foundation
        </div>
      </div>
    </div>
  )
}