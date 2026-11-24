import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import PepsiCoLogo from './brand/PepsiCoLogo'

const NAVY = '#02355A'
const BLUE = '#155798'

const BUS = [
  { country:'Poland', bu:'Beverages', live:true },
  { country:'Poland', bu:'Snacks', live:false },
  { country:'Mexico', bu:'Beverages', live:false },
  { country:'Mexico', bu:'Snacks', live:false },
  { country:'Egypt', bu:'Beverages', live:false },
  { country:'Egypt', bu:'Snacks', live:false },
  { country:'Saudi Arabia', bu:'Snacks', live:false },
  { country:'UK', bu:'Snacks', live:false },
]

const FLAGS = {
  'Poland':'🇵🇱','Mexico':'🇲🇽','Egypt':'🇪🇬','Saudi Arabia':'🇸🇦','UK':'🇬🇧'
}

const KPI_TARGETS = {
  psa_m:{tv:0.816,hi:true}, psa_z:{tv:0.816,hi:true},
  scr:{tv:0,hi:false}, constraint:{tv:0,hi:false},
  oos_i:{tv:0,hi:false}, oos_sys:{tv:0,hi:false},
  unmet_items:{tv:0,hi:false}, unmet_cs:{tv:350000,hi:false},
  mixes:{tv:0,hi:false}, plan_err:{tv:0,hi:false},
  rm_raised:{tv:5,hi:false}, rm_open:{tv:10,hi:false},
  rm_del:{tv:0,hi:false}, rmso_total:{tv:21,hi:false},
  rm_conc:{tv:4,hi:false}, rm_pkg:{tv:1,hi:false},
  rm_foil:{tv:2,hi:false}, rm_lab:{tv:10,hi:false},
  rm_pref:{tv:2,hi:false}, rm_juice:{tv:1,hi:false},
  rm_cans:{tv:2,hi:false},
}

function getStatus(tv, hi, val) {
  if (val === null || val === undefined) return 'empty'
  const v = parseFloat(val)
  if (isNaN(v)) return 'empty'
  if (hi) return v >= tv ? 'green' : v >= tv * 0.9 ? 'amber' : 'red'
  return v <= tv ? 'green' : v <= tv * 1.3 ? 'amber' : 'red'
}

function fmtDate(str) {
  return new Date(str + 'T12:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}


function PepsiGlobe({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="38" fill="#155798"/>
      <path d="M40 3 C40 3 16 14 16 40 C16 66 40 77 40 77 C40 77 64 66 64 40 C64 14 40 3 40 3Z" fill="#E31837"/>
      <path d="M40 3 C55 10 64 24 64 40 C64 56 55 70 40 77 L40 3Z" fill="white"/>
    </svg>
  )
}

function LaysBadge({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="38" fill="#FFD700"/>
      <circle cx="40" cy="40" r="30" fill="#E8180C"/>
      <text x="40" y="46" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontSize="20" fontWeight="900" fill="#FFD700">LAY'S</text>
    </svg>
  )
}

export default function Hub({ session, onSelectBU }) {
  const [polandStats, setPolandStats] = useState(null)
  const [agingActions, setAgingActions] = useState(0)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => { loadPolandStats() }, [])

  async function loadPolandStats() {
    try {
      const { data: sessions } = await supabase
        .from('sessions').select('*').order('date', { ascending: false }).limit(1)

      if (!sessions?.length) { setLoadingStats(false); return }
      const latest = sessions[0]

      const { data: kv } = await supabase
        .from('kpi_values').select('*').eq('session_id', latest.id)

      let red = 0, amber = 0, green = 0
      for (const row of (kv || [])) {
        const cfg = KPI_TARGETS[row.kpi_id]
        if (!cfg) continue
        const s = getStatus(cfg.tv, cfg.hi, row.value)
        if (s === 'red') red++
        else if (s === 'amber') amber++
        else if (s === 'green') green++
      }

      const { data: actions } = await supabase
        .from('actions').select('*').neq('status', 'Done')

      const today = new Date()
      const aging = (actions || []).filter(a => {
        if (!a.created_at) return false
        return Math.floor((today - new Date(a.created_at + 'T00:00:00')) / 86400000) >= 5
      }).length

      setPolandStats({ red, amber, green, date: latest.date })
      setAgingActions(aging)
    } catch (e) {
      console.error(e)
    }
    setLoadingStats(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F6F4F1', fontFamily: "Gilroy,Arial,sans-serif" }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 100%)`, boxShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <PepsiCoLogo height={44} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{session.user.email}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>Supply Planning Foundation</div>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              style={{ fontSize: 11, padding: '5px 12px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: 'white', cursor: 'pointer', fontFamily: "Gilroy,Arial,sans-serif" }}
            >Sign out</button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY}, ${BLUE})`, padding: '44px 24px 72px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: "'GT Pressura','Arial Narrow',Arial,sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 10 }}>
            Supply Planning Foundation · SPF Program
          </div>
          <h1 style={{ fontFamily: "'GT Pressura','Arial Narrow',Arial,sans-serif", fontSize: 46, fontWeight: 700, color: 'white', letterSpacing: 1, margin: 0 }}>
            Execution Control Tower
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginTop: 12 }}>
            Select your Business Unit to enter the DDS board
          </p>
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 1200, margin: '-36px auto 0', padding: '0 24px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 16 }}>
          {BUS.map((bu, i) => {
            const isBev = bu.bu === 'Beverages'
            const isLive = bu.live

            return (
              <div
                key={i}
                onClick={() => isLive && onSelectBU(bu)}
                style={{
                  background: 'white', borderRadius: 14, overflow: 'hidden',
                  boxShadow: isLive ? '0 4px 24px rgba(0,75,147,0.18)' : '0 2px 8px rgba(0,0,0,0.07)',
                  border: isLive ? `2px solid ${BLUE}` : '2px solid #E3E6EA',
                  cursor: isLive ? 'pointer' : 'default',
                  opacity: isLive ? 1 : 0.72,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (!isLive) return
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,75,147,0.25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = isLive ? '0 4px 24px rgba(0,75,147,0.18)' : '0 2px 8px rgba(0,0,0,0.07)'
                }}
              >
                {/* Card header strip */}
                <div style={{
                  background: isLive ? `linear-gradient(135deg, ${NAVY}, ${BLUE})` : '#5B6B7B',
                  padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 26 }}>{FLAGS[bu.country] || '🌍'}</span>
                    <div>
                      <div style={{ fontFamily: "'GT Pressura','Arial Narrow',Arial,sans-serif", fontSize: 17, fontWeight: 700, color: 'white', letterSpacing: 0.5 }}>{bu.country}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{bu.bu}</div>
                    </div>
                  </div>
                  {isBev ? <PepsiGlobe size={38} /> : <LaysBadge size={38} />}
                </div>

                {/* Card body */}
                <div style={{ padding: '16px 18px' }}>
                  {isLive ? (
                    loadingStats ? (
                      <div style={{ padding: '10px 0', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Loading stats...</div>
                    ) : polandStats ? (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                          {[
                            { label:'Red', val:polandStats.red, color:'#C8102E', bg:'#FCE8EB' },
                            { label:'Amber', val:polandStats.amber, color:'#EB9F0A', bg:'#FFF6DE' },
                            { label:'Green', val:polandStats.green, color:'#5D910D', bg:'#EEF6E0' },
                          ].map(s => (
                            <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: '8px 4px', textAlign: 'center' }}>
                              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'GT Pressura','Arial Narrow',Arial,sans-serif" }}>{s.val}</div>
                              <div style={{ fontSize: 10, color: '#5B6B7B' }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 10 }}>
                          Last session: {fmtDate(polandStats.date)}
                        </div>
                        {agingActions > 0 && (
                          <div style={{ background: '#FCE8EB', border: '1px solid #F3B3BE', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#C8102E', fontWeight: 500, marginBottom: 10 }}>
                            ⚠️ {agingActions} action{agingActions > 1 ? 's' : ''} open 5+ days
                          </div>
                        )}
                        <div style={{ background: BLUE, color: 'white', borderRadius: 8, padding: '9px', textAlign: 'center', fontSize: 13, fontWeight: 600, fontFamily: "Gilroy,Arial,sans-serif" }}>
                          Enter Board →
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>No sessions yet — enter to get started</div>
                        <div style={{ background: BLUE, color: 'white', borderRadius: 8, padding: '9px', textAlign: 'center', fontSize: 13, fontWeight: 600, fontFamily: "Gilroy,Arial,sans-serif" }}>
                          Enter Board →
                        </div>
                      </>
                    )
                  ) : (
                    <div style={{ padding: '16px 0', textAlign: 'center' }}>
                      <div style={{ fontSize: 30, marginBottom: 8 }}>🔒</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#02355A', marginBottom: 4 }}>Coming Soon</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>This board is not yet active</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}