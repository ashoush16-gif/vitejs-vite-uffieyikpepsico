import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Hub from './Hub'
import Board from './Board'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedBU, setSelectedBU] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setSelectedBU(null)
    })
  }, [])

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Barlow', sans-serif", color:'#6b7280', fontSize:13 }}>
      Loading...
    </div>
  )

  if (!session) return <Login />
  if (!selectedBU) return <Hub session={session} onSelectBU={setSelectedBU} />
  return <Board session={session} selectedBU={selectedBU} onBack={() => setSelectedBU(null)} />
}