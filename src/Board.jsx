import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'
import { stColor, stBg, stBorder } from './brand/pepsicoTheme'
import InsightsPanel from './dds/InsightsPanel'

const BLUE = '#155798'
const NAVY = '#02355A'

const GROUPS = [
  {
    label: 'Production & Schedule', color: '#1e3a5f',
    kpis: [
      { id:'psa_m', name:'PSA – Michrów', uom:'%', target:'81.6%', tv:0.816, hi:true, owner:'Jakub Krajewski', backup:'Milena Mikowska', freq:'Every DDS' },
      { id:'psa_z', name:'PSA – Żnin', uom:'%', target:'81.6%', tv:0.816, hi:true, owner:'Jakub Krajewski', backup:'Milena Mikowska', freq:'Every DDS' },
      { id:'scr', name:'Schedule change requests (last 24h)', uom:'# items', target:'0', tv:0, hi:false, owner:'Kamil Łubiński', backup:'Milena Mikowska', freq:'Every DDS' },
      { id:'constraint', name:'Warehouse / transport / production constraint?', uom:'yes(1)/no(0)', target:'0', tv:0, hi:false, owner:'Jakub Krajewski', backup:'Milena Mikowska', freq:'Every DDS' },
    ]
  },
  {
    label: 'Demand Fulfillment', color: '#1a3a5c',
    kpis: [
      { id:'oos_i', name:'OOS Items – unmet demand (physical)', uom:'# items', target:'0', tv:0, hi:false, owner:'Dina Rashed', backup:'Batoul Fahmy', freq:'Every DDS' },
      { id:'oos_sys', name:'OOS System Setup – unmet demand', uom:'# items', target:'0', tv:0, hi:false, owner:'Dina Rashed', backup:'Batoul Fahmy', freq:'Every DDS' },
      { id:'unmet_items', name:'Items with unmet demand (calculated)', uom:'# items', target:'0', tv:0, hi:false, owner:'Dina Rashed', backup:'Batoul Fahmy', freq:'Every DDS' },
      { id:'unmet_cs', name:'Volume of unmet demand', uom:'# cases', target:'≤350,000', tv:350000, hi:false, owner:'Dina Rashed', backup:'Batoul Fahmy', freq:'Every DDS' },
      { id:'mixes', name:'Mixes (DY) with unmet demand', uom:'# items', target:'0', tv:0, hi:false, owner:'Dina Rashed', backup:'Batoul Fahmy', freq:'Every DDS' },
    ]
  },
  {
    label: 'Data Quality & Planning', color: '#163352',
    kpis: [
      { id:'plan_err', name:'# Plan order errors', uom:'# items', target:'0', tv:0, hi:false, owner:'Dina Rashed', backup:'Batoul Fahmy', freq:'Every DDS' },
      { id:'rm_raised', name:'RM check requests raised (last working day)', uom:'# requests', target:'≤5', tv:5, hi:false, owner:'Kamil Łubiński', backup:'Milena Mikowska', freq:'Every DDS' },
      { id:'rm_open', name:'Open RM check requests', uom:'# requests', target:'≤10', tv:10, hi:false, owner:'Kamil Łubiński', backup:'Milena Mikowska', freq:'Every DDS' },
      { id:'rm_del', name:'RM requests with delayed confirmation', uom:'# requests', target:'0', tv:0, hi:false, owner:'Kamil Łubiński', backup:'Milena Mikowska', freq:'Every DDS' },
      { id:'data_inc', name:'# of days with incorrect data', uom:'yes(1)/no(0)', target:'0', tv:0, hi:false, owner:'Planning Lead', backup:'—', freq:'Daily' },
      { id:'rm_limit', name:'# of RM SKU limitations', uom:'# items', target:'TBD', tv:null, hi:false, owner:'Planning Lead', backup:'—', freq:'Daily' },
    ]
  },
  {
    label: 'Raw Material Stock-Outs — Daily', color: '#0f2744',
    kpis: [
      { id:'rmso_total', name:'Total RM SKUs in stock-out', uom:'# items', target:'≤21', tv:21, hi:false, owner:'RM Planning', backup:'—', freq:'Daily' },
      { id:'rm_conc', name:'CSD / Lipton / Rockstar concentrates', uom:'# items', target:'≤4', tv:4, hi:false, owner:'Ahmed Fekry', backup:'Danny Ayoub', freq:'Daily' },
      { id:'rm_pkg', name:'Corrugates, closures, additives, Schweppes conc.', uom:'# items', target:'≤1', tv:1, hi:false, owner:'Abdulrahman Moussa', backup:'Ahmed Fekry', freq:'Daily' },
      { id:'rm_foil', name:'Foils, BIB bags, stretch, glue, stickers, handles', uom:'# items', target:'≤2', tv:2, hi:false, owner:'Danny Ayoub', backup:'Hla El Marsafawi', freq:'Daily' },
      { id:'rm_lab', name:'Labels, metal closures', uom:'# items', target:'≤10', tv:10, hi:false, owner:'Hla El Marsafawi', backup:'Danny Ayoub', freq:'Daily' },
      { id:'rm_pref', name:'Preforms', uom:'# items', target:'≤2', tv:2, hi:false, owner:'Wiktoria Kępka', backup:'Natalia Dobrogowska', freq:'Daily' },
      { id:'rm_juice', name:'Juice concentrates', uom:'# items', target:'≤1', tv:1, hi:false, owner:'Wiktoria Kępka', backup:'Rafał Cichecki', freq:'Daily' },
      { id:'rm_cans', name:'Cans', uom:'# items', target:'≤2', tv:2, hi:false, owner:'Wiktoria Kępka', backup:'Natalia Dobrogowska', freq:'Daily' },
      { id:'rm_unmet_exc', name:'# of unmet demand RM exceptions', uom:'TBD with MRP', target:'TBD', tv:null, hi:false, owner:'RM Planning', backup:'—', freq:'Daily' },
    ]
  },
  {
    label: 'Raw Material Stock-Outs — Weekly', color: '#0a1f38',
    kpis: [
      { id:'w_rmso_wknd', name:'Stock-outs for weekend production', uom:'# items', target:'≤23', tv:23, hi:false, owner:'MRP Team', backup:'—', freq:'Friday MRP DDS' },
      { id:'w_conc', name:'CSD / Lipton / Rockstar concentrates (weekly)', uom:'# items', target:'≤8', tv:8, hi:false, owner:'Ahmed Fekry', backup:'Danny Ayoub', freq:'Weekly' },
      { id:'w_pkg', name:'Corrugates, closures, additives, Schweppes (weekly)', uom:'# items', target:'≤1', tv:1, hi:false, owner:'Abdulrahman Moussa', backup:'Ahmed Fekry', freq:'Weekly' },
      { id:'w_foil', name:'Foils, BIB bags, stretch, glue (weekly)', uom:'# items', target:'≤2', tv:2, hi:false, owner:'Danny Ayoub', backup:'Hla El Marsafawi', freq:'Weekly' },
      { id:'w_lab', name:'Labels, metal closures (weekly)', uom:'# items', target:'≤1', tv:1, hi:false, owner:'Hla El Marsafawi', backup:'Danny Ayoub', freq:'Weekly' },
      { id:'w_pref', name:'Preforms – JIT delivery', uom:'# items', target:'≤1', tv:1, hi:false, owner:'Wiktoria Kępka', backup:'Natalia Dobrogowska', freq:'Weekly' },
      { id:'w_juice', name:'Juice concentrates (weekly)', uom:'# items', target:'≤5', tv:5, hi:false, owner:'Wiktoria Kępka', backup:'Rafał Cichecki', freq:'Weekly' },
      { id:'w_cans', name:'Cans (weekly)', uom:'# items', target:'≤5', tv:5, hi:false, owner:'Wiktoria Kępka', backup:'Natalia Dobrogowska', freq:'Weekly' },
    ]
  }
]

const ALL_KPIS = GROUPS.flatMap(g => g.kpis)

const RC_CATS = [
  'Supply issue', 'Demand spike', 'Material shortage', 'Production constraint',
  'Supplier delay', 'Data / system issue', 'Planning error',
  'Logistics / transport', 'Capacity constraint', 'Other'
]

const HISTORICAL_DATA = {"2026-04-13":{"psa_m":0.7734,"psa_z":0.8204,"constraint":0.0,"oos_i":3.0,"oos_sys":12.0,"unmet_items":27.0,"unmet_cs":468500.0,"mixes":9.0,"rm_raised":7.0,"rm_open":28.0,"rm_del":23.0,"rmso_total":9.0,"rm_conc":4.0,"rm_pkg":0.0,"rm_foil":1.0,"rm_lab":4.0,"rm_pref":0.0,"rm_juice":0.0,"rm_cans":0.0},"2026-04-14":{"psa_m":0.9146,"psa_z":0.777,"scr":5.0,"constraint":0.0,"oos_i":10.0,"oos_sys":16.0,"unmet_items":26.0,"unmet_cs":415904.111,"mixes":7.0,"rm_raised":5.0,"rm_open":3.0,"rm_del":0.0,"rmso_total":11.0,"rm_conc":4.0,"rm_pkg":0.0,"rm_foil":2.0,"rm_lab":4.0,"rm_pref":1.0,"rm_juice":0.0,"rm_cans":0.0},"2026-04-15":{"psa_m":0.9092,"psa_z":0.8791,"scr":9.0,"constraint":4.0,"oos_i":6.0,"oos_sys":14.0,"unmet_items":20.0,"unmet_cs":279512.0,"mixes":7.0,"rm_raised":9.0,"rm_open":12.0,"rm_del":5.0,"rmso_total":23.0,"rm_conc":6.0,"rm_pkg":3.0,"rm_foil":3.0,"rm_lab":10.0,"rm_pref":1.0,"rm_juice":0.0,"rm_cans":0.0},"2026-04-16":{"psa_m":0.7712,"psa_z":0.9037,"scr":6.0,"constraint":0.0,"rm_raised":4.0,"rm_open":11.0,"rm_del":1.0,"rmso_total":2.0,"rm_pref":1.0,"rm_juice":0.0,"rm_cans":1.0},"2026-04-17":{"psa_m":0.877,"psa_z":0.9099,"scr":17.0,"constraint":0.0,"plan_err":0.0,"rm_raised":17.0,"rm_open":15.0,"rm_del":7.0,"data_inc":0.0,"rmso_total":2.0,"rm_pref":0.0,"rm_juice":0.0,"rm_cans":2.0},"2026-04-20":{"psa_m":0.8134,"psa_z":0.8846,"scr":9.0,"constraint":2.0,"oos_i":11.0,"oos_sys":9.0,"unmet_items":20.0,"unmet_cs":181631.0,"mixes":3.0,"plan_err":0.0,"rm_raised":4.0,"rm_open":4.0,"rm_del":0.0,"data_inc":0.0,"rmso_total":9.0,"rm_conc":2.0,"rm_pkg":0.0,"rm_foil":0.0,"rm_lab":4.0,"rm_pref":0.0,"rm_juice":0.0,"rm_cans":3.0},"2026-04-21":{"psa_m":0.9375,"psa_z":0.9723,"scr":6.0,"constraint":0.0,"oos_i":2.0,"oos_sys":12.0,"unmet_items":14.0,"unmet_cs":453609.88,"mixes":2.0,"plan_err":0.0,"rm_raised":4.0,"rm_open":4.0,"rm_del":4.0,"data_inc":0.0,"rmso_total":10.0,"rm_conc":3.0,"rm_pkg":0.0,"rm_foil":1.0,"rm_lab":4.0,"rm_pref":0.0,"rm_juice":0.0,"rm_cans":2.0},"2026-04-22":{"psa_m":0.9414,"psa_z":0.9749,"scr":21.0,"constraint":7.0,"oos_i":2.0,"oos_sys":6.0,"unmet_items":8.0,"unmet_cs":195944.0,"mixes":2.0,"plan_err":0.0,"rm_raised":6.0,"rm_open":18.0,"rm_del":0.0,"data_inc":1.0,"rmso_total":23.0,"rm_conc":6.0,"rm_pkg":0.0,"rm_foil":2.0,"rm_lab":12.0,"rm_pref":1.0,"rm_juice":0.0,"rm_cans":2.0},"2026-04-23":{"psa_m":0.9151,"psa_z":0.8079,"scr":29.0,"constraint":0.0,"rm_raised":26.0,"rm_open":5.0,"rm_del":3.0,"rmso_total":4.0,"rm_pref":1.0,"rm_juice":0.0,"rm_cans":3.0},"2026-04-24":{"psa_m":0.9281,"psa_z":0.6485,"scr":5.0,"constraint":0.0,"rm_raised":5.0,"rm_open":8.0,"rm_del":5.0,"rmso_total":4.0,"rm_pref":1.0,"rm_juice":0.0,"rm_cans":3.0},"2026-04-27":{"psa_m":0.8864,"scr":3.0,"constraint":0.0,"oos_i":2.0,"oos_sys":11.0,"unmet_items":13.0,"unmet_cs":303234.0,"mixes":4.0,"rm_raised":3.0,"rm_open":5.0,"rm_del":2.0,"data_inc":0.0,"rmso_total":7.0,"rm_conc":1.0,"rm_pkg":0.0,"rm_foil":0.0,"rm_lab":4.0,"rm_pref":2.0,"rm_juice":0.0,"rm_cans":0.0},"2026-04-28":{"psa_m":0.8635,"psa_z":0.5636,"scr":4.0,"constraint":0.0,"oos_i":4.0,"oos_sys":7.0,"unmet_items":11.0,"unmet_cs":49265.037,"mixes":4.0,"plan_err":0.0,"rm_raised":4.0,"rm_open":4.0,"rm_del":0.0,"data_inc":0.0,"rmso_total":8.0,"rm_conc":1.0,"rm_pkg":3.0,"rm_foil":0.0,"rm_lab":4.0,"rm_pref":0.0,"rm_juice":0.0,"rm_cans":0.0},"2026-04-29":{"psa_m":0.8486,"psa_z":0.7846,"scr":6.0,"constraint":0.0,"oos_i":6.0,"oos_sys":7.0,"unmet_items":13.0,"unmet_cs":53475.364,"mixes":7.0,"plan_err":0.0,"rm_raised":6.0,"rm_open":16.0,"rm_del":0.0,"data_inc":0.0,"rmso_total":32.0,"rm_conc":7.0,"rm_pkg":4.0,"rm_foil":2.0,"rm_lab":18.0,"rm_pref":1.0,"rm_juice":0.0,"rm_cans":0.0}}

function getStatus(kpi, val) {
  if (kpi.tv === null) return 'empty'
  if (val === '' || val === null || val === undefined) return 'empty'
  const v = parseFloat(val)
  if (isNaN(v)) return 'empty'
  if (kpi.hi) return v >= kpi.tv ? 'green' : v >= kpi.tv * 0.9 ? 'amber' : 'red'
  return v <= kpi.tv ? 'green' : v <= kpi.tv * 1.3 ? 'amber' : 'red'
}

// stColor / stBg / stBorder now come from ./brand/pepsicoTheme (PepsiCo status colours)

function nextWeekday(date, dir) {
  const d = new Date(date + 'T12:00:00')
  do { d.setDate(d.getDate() + dir) } while (d.getDay()===0 || d.getDay()===6)
  return d.toISOString().slice(0,10)
}

function todayWeekday() {
  let d = new Date()
  while (d.getDay()===0 || d.getDay()===6) d.setDate(d.getDate()-1)
  return d.toISOString().slice(0,10)
}

function fmtDate(str) {
  return new Date(str+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})
}

function initials(name) {
  return name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()
}

// ── TREND CHART ──────────────────────────────────────────────────────────────
function TrendChart({ sessions, kpiId, kpi, color }) {
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    const last30 = sessions.slice(-30)
    if (!last30.length || !canvasRef.current || !window.Chart) return
    const labels = last30.map(s => new Date(s.date+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short'}))
    const data = last30.map(s => { const v=parseFloat(s.values?.[kpiId]); return isNaN(v)?null:v })
    const rolling = data.map((_,i) => {
      const slice = data.slice(Math.max(0,i-6),i+1).filter(v=>v!==null)
      return slice.length ? Math.round(slice.reduce((a,b)=>a+b,0)/slice.length*100)/100 : null
    })
    const barColors = last30.map(s => { const st=getStatus(kpi,s.values?.[kpiId]); return st==='red'?'#F3B3BE':st==='amber'?'#FFE8AD':st==='green'?'#BFDE7D':'#E3E6EA' })
    const barBorder = last30.map(s => stColor(getStatus(kpi,s.values?.[kpiId])))
    if (chartRef.current) chartRef.current.destroy()
    chartRef.current = new window.Chart(canvasRef.current, {
      data: { labels, datasets: [
        { type:'bar', data, backgroundColor:barColors, borderColor:barBorder, borderWidth:1.5, borderRadius:3 },
        { type:'line', data:rolling, borderColor:color, borderWidth:2.5, pointRadius:3, pointBackgroundColor:color, fill:false, tension:0.4, spanGaps:true },
        ...(kpi.tv!==null?[{ type:'line', data:last30.map(()=>kpi.tv), borderColor:'#9ca3af', borderDash:[5,4], borderWidth:1.5, pointRadius:0, fill:false }]:[])
      ]},
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'rgba(0,26,64,0.9)', titleFont:{family:"Gilroy,Arial,sans-serif",size:11}, bodyFont:{family:"Gilroy,Arial,sans-serif",size:12} }},
        scales:{
          x:{ ticks:{font:{family:"Gilroy,Arial,sans-serif",size:9},maxRotation:45,autoSkip:true,maxTicksLimit:8}, grid:{color:'rgba(0,0,0,0.04)'} },
          y:{ ticks:{font:{family:"Gilroy,Arial,sans-serif",size:10}}, grid:{color:'rgba(0,0,0,0.06)'} }
        }
      }
    })
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current=null } }
  }, [sessions, kpiId])

  return <canvas ref={canvasRef} style={{ width:'100%', height:'100%' }}/>
}

// ── HEATMAP ──────────────────────────────────────────────────────────────────
function HeatmapChart({ sessions }) {
  const last14 = sessions.slice(-14)
  if (!last14.length) return <div style={{padding:20,color:'#9ca3af',fontSize:12}}>No data yet</div>

  const displayKpis = ALL_KPIS.filter(k => k.tv !== null).slice(0, 16)

  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ borderCollapse:'collapse', fontSize:10, width:'100%' }}>
        <thead>
          <tr>
            <th style={{ padding:'4px 8px', textAlign:'left', color:'#5B6B7B', fontWeight:500, minWidth:160 }}>KPI</th>
            {last14.map(s => (
              <th key={s.date} style={{ padding:'4px 4px', textAlign:'center', color:'#5B6B7B', fontWeight:400, minWidth:32 }}>
                {new Date(s.date+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayKpis.map(kpi => (
            <tr key={kpi.id}>
              <td style={{ padding:'3px 8px', color:'#02355A', fontSize:11, borderBottom:'1px solid #f3f4f6' }}>
                {kpi.name.length > 28 ? kpi.name.slice(0,28)+'…' : kpi.name}
              </td>
              {last14.map(s => {
                const st = getStatus(kpi, s.values?.[kpi.id])
                const bg = st==='red'?'#F3B3BE':st==='amber'?'#FFE8AD':st==='green'?'#BFDE7D':'#f3f4f6'
                const val = s.values?.[kpi.id]
                return (
                  <td key={s.date} title={`${kpi.name}: ${val ?? '—'}`} style={{ padding:'3px 4px', textAlign:'center', background:bg, borderBottom:'1px solid #f9fafb', borderRight:'1px solid #f9fafb' }}>
                    <div style={{ width:24, height:24, borderRadius:4, background:bg, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color: st==='red'?'#A00D25':st==='amber'?'#954F09':st==='green'?'#166534':'#9ca3af' }}>
                      {st==='red'?'✕':st==='amber'?'~':st==='green'?'✓':'·'}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── WORST OFFENDERS ───────────────────────────────────────────────────────────
function WorstOffenders({ sessions }) {
  const last30 = sessions.slice(-30)
  if (last30.length < 3) return <div style={{padding:20,color:'#9ca3af',fontSize:12}}>Need 3+ sessions</div>

  const ranked = ALL_KPIS
    .filter(k => k.tv !== null)
    .map(k => {
      const reds = last30.filter(s => getStatus(k, s.values?.[k.id]) === 'red').length
      return { kpi:k, pct: Math.round(reds/last30.length*100), reds }
    })
    .filter(x => x.pct > 0)
    .sort((a,b) => b.pct-a.pct)
    .slice(0, 10)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {ranked.map(({ kpi, pct }) => (
        <div key={kpi.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontSize:11, color:'#02355A', width:200, flexShrink:0 }}>
            {kpi.name.length>26?kpi.name.slice(0,26)+'…':kpi.name}
          </div>
          <div style={{ flex:1, background:'#f3f4f6', borderRadius:4, height:18, overflow:'hidden' }}>
            <div style={{ width:`${pct}%`, height:'100%', background: pct>=50?'#C8102E':pct>=25?'#EB9F0A':'#5D910D', borderRadius:4, transition:'width 0.5s' }}/>
          </div>
          <div style={{ fontSize:11, fontWeight:600, color: pct>=50?'#C8102E':pct>=25?'#EB9F0A':'#5D910D', width:36, textAlign:'right' }}>{pct}%</div>
        </div>
      ))}
      {!ranked.length && <div style={{color:'#9ca3af',fontSize:12}}>All KPIs green 🎉</div>}
    </div>
  )
}

// ── STREAK TRACKER ────────────────────────────────────────────────────────────
function StreakTracker({ sessions }) {
  if (!sessions.length) return <div style={{padding:20,color:'#9ca3af',fontSize:12}}>No data yet</div>

  const sorted = [...sessions].sort((a,b)=>a.date.localeCompare(b.date))

  const streaks = ALL_KPIS.filter(k=>k.tv!==null).map(k => {
    let streak = 0
    let streakColor = 'gray'
    for (let i=sorted.length-1; i>=0; i--) {
      const st = getStatus(k, sorted[i].values?.[k.id])
      if (i === sorted.length-1) { streakColor = st==='red'?'red':st==='green'?'green':'amber' }
      if (st === streakColor || (streakColor==='green'&&st==='green') || (streakColor==='red'&&st==='red')) streak++
      else break
    }
    return { kpi:k, streak, streakColor }
  }).filter(x=>x.streak>1).sort((a,b)=>b.streak-a.streak).slice(0,10)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {streaks.map(({ kpi, streak, streakColor }) => {
        const color = streakColor==='red'?'#C8102E':streakColor==='green'?'#5D910D':'#EB9F0A'
        const bg = streakColor==='red'?'#FCE8EB':streakColor==='green'?'#EEF6E0':'#FFF6DE'
        const label = streakColor==='red'?'🔴 Red':streakColor==='green'?'🟢 Green':'🟡 Amber'
        return (
          <div key={kpi.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:bg, borderRadius:8, border:`1px solid ${streakColor==='red'?'#F3B3BE':streakColor==='green'?'#BFDE7D':'#FFE8AD'}` }}>
            <div>
              <div style={{ fontSize:12, fontWeight:500, color:'#1f2937' }}>{kpi.name.length>35?kpi.name.slice(0,35)+'…':kpi.name}</div>
              <div style={{ fontSize:10, color:'#5B6B7B', marginTop:1 }}>{label} streak</div>
            </div>
            <div style={{ fontSize:22, fontWeight:700, color, fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif" }}>{streak}d</div>
          </div>
        )
      })}
      {!streaks.length && <div style={{color:'#9ca3af',fontSize:12}}>No notable streaks yet</div>}
    </div>
  )
}

// ── RC ANALYTICS ──────────────────────────────────────────────────────────────
function RCAnalytics({ sessions }) {
  const allRcs = sessions.flatMap(s =>
    Object.values(s.rootCauses || {}).filter(r => r?.category)
  )

  if (!allRcs.length) return <div style={{padding:20,color:'#9ca3af',fontSize:12}}>No root causes logged yet. Add root causes on the KPI board to see analysis.</div>

  const cats = {}
  allRcs.forEach(r => { cats[r.category] = (cats[r.category]||0)+1 })
  const sorted = Object.entries(cats).sort((a,b)=>b[1]-a[1])
  const total = allRcs.length
  const recurring = allRcs.filter(r=>r.recurring).length
  const colors = ['#155798','#3680CE','#3b82f6','#60a5fa','#A6CBF0','#bfdbfe','#dbeafe','#E31837','#ef4444','#f87171']

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
        {[
          { label:'Total RC logged', val:total, color:BLUE },
          { label:'Recurring issues', val:recurring, color:'#C8102E' },
          { label:'Top category', val:sorted[0]?.[0]?.split(' ')[0]||'—', color:'#EB9F0A', small:true },
        ].map(c => (
          <div key={c.label} style={{ background:'white', border:'1px solid #E3E6EA', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
            <div style={{ fontSize:10, color:'#5B6B7B', marginBottom:3, textTransform:'uppercase', letterSpacing:0.3 }}>{c.label}</div>
            <div style={{ fontSize:c.small?14:22, fontWeight:700, color:c.color, fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif" }}>{c.val}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {sorted.map(([cat, cnt], i) => (
          <div key={cat} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background:colors[i%colors.length], flexShrink:0 }}/>
            <div style={{ fontSize:12, color:'#02355A', flex:1 }}>{cat}</div>
            <div style={{ background:'#f3f4f6', borderRadius:4, height:14, width:120, overflow:'hidden' }}>
              <div style={{ width:`${Math.round(cnt/sorted[0][1]*100)}%`, height:'100%', background:colors[i%colors.length], borderRadius:4 }}/>
            </div>
            <div style={{ fontSize:11, color:'#5B6B7B', width:20, textAlign:'right' }}>{cnt}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── AI REPORTS ────────────────────────────────────────────────────────────────
function AIReports({ sessions, actions }) {
  const [reportType, setReportType] = useState('daily')
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generateReport() {
    setLoading(true)
    setReport('')

    const today = todayWeekday()
    const last30 = sessions.slice(-30)
    const latest = sessions[sessions.length-1]
    const openActions = actions.filter(a=>a.status!=='Done')
    const overdueActions = actions.filter(a=>a.status!=='Done'&&a.due_date&&a.due_date<today)

    // Build KPI summary
    const kpiSummary = ALL_KPIS.filter(k=>k.tv!==null).map(k => {
      const val = latest?.values?.[k.id]
      const st = getStatus(k, val)
      return `${k.name}: ${val!==undefined?val:'N/A'} (target ${k.target}) — ${st.toUpperCase()}`
    }).join('\n')

    // Build trends summary
    const trendSummary = ALL_KPIS.filter(k=>k.tv!==null).map(k => {
      const reds = last30.filter(s=>getStatus(k,s.values?.[k.id])==='red').length
      return `${k.name}: ${reds}/${last30.length} days red (${Math.round(reds/last30.length*100)}%)`
    }).join('\n')

    let prompt = ''

    if (reportType === 'daily') {
      prompt = `You are a supply chain performance analyst for PepsiCo Poland Beverages. Generate a concise Daily Flash Report for the DDS (Daily Direction Setting) meeting.

Date: ${latest?.date || today}
Business Unit: Poland Beverages

TODAY'S KPI STATUS:
${kpiSummary}

OPEN ACTIONS: ${openActions.length} total, ${overdueActions.length} overdue

Write a professional daily flash report with:
1. One-paragraph executive summary (3-4 sentences max)
2. Top 3 red KPIs with brief root cause context
3. Key risks for today
4. Actions requiring immediate attention

Keep it under 200 words. Use bullet points. Tone: professional, direct, action-oriented.`

    } else if (reportType === 'weekly') {
      const thisWeek = last30.slice(-5)
      const prevWeek = last30.slice(-10,-5)

      prompt = `You are a supply chain performance analyst for PepsiCo Poland Beverages. Generate a Weekly Trend Report.

Business Unit: Poland Beverages
Period: Last 5 working days vs previous 5 working days

THIS WEEK KPI PERFORMANCE (% days red):
${ALL_KPIS.filter(k=>k.tv!==null).map(k=>{
  const thisRed = thisWeek.filter(s=>getStatus(k,s.values?.[k.id])==='red').length
  const prevRed = prevWeek.filter(s=>getStatus(k,s.values?.[k.id])==='red').length
  const trend = thisRed < prevRed ? '↑ Improved' : thisRed > prevRed ? '↓ Deteriorated' : '→ Stable'
  return `${k.name}: ${thisRed}/${thisWeek.length} red this week vs ${prevRed}/${prevWeek.length} prev — ${trend}`
}).join('\n')}

ACTIONS: ${openActions.length} open, ${overdueActions.length} overdue

Write a weekly trend report with:
1. Executive summary paragraph
2. What improved this week
3. What deteriorated this week  
4. Top systemic issues to address next week
5. Actions closure rate commentary

Keep under 300 words. Professional tone for supply chain leadership.`

    } else {
      prompt = `You are a supply chain performance analyst for PepsiCo Poland Beverages. Generate an Executive Scorecard — a strategic narrative for senior leadership.

Business Unit: Poland Beverages
Period: Last ${last30.length} working days

KPI STABILITY (% days red over period):
${trendSummary}

ACTIONS: ${actions.length} total logged, ${openActions.length} currently open, ${overdueActions.length} overdue

Write a 30-day executive scorecard with:
1. Strategic performance narrative (1 paragraph, no bullet points)
2. Key strengths observed
3. Primary challenges and root cause themes
4. Recommended management focus areas for next month

Tone: Executive briefing level — strategic, data-driven, no jargon. Under 350 words.`
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await response.json()
      const text = data.content?.map(c=>c.text||'').join('')
      setReport(text || 'No report generated. Please try again.')
    } catch (e) {
      setReport('Error generating report. Please check your connection and try again.')
    }
    setLoading(false)
  }

  function copyReport() {
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const REPORT_TYPES = [
    { id:'daily', label:'Daily Flash', desc:'30-second read for today\'s DDS meeting', icon:'⚡' },
    { id:'weekly', label:'Weekly Trend', desc:'Week-over-week performance comparison', icon:'📈' },
    { id:'executive', label:'Executive Scorecard', desc:'30-day strategic narrative for leadership', icon:'🎯' },
  ]

  return (
    <div>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ fontSize:18, fontWeight:700, color:NAVY, fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif" }}>AI Reports</h2>
        <p style={{ fontSize:12, color:'#5B6B7B', marginTop:2 }}>Generate intelligent reports from your DDS data powered by Claude AI</p>
      </div>

      {/* Report type selector */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {REPORT_TYPES.map(rt => (
          <div key={rt.id} onClick={() => setReportType(rt.id)} style={{
            background: reportType===rt.id ? BLUE : 'white',
            border: `2px solid ${reportType===rt.id ? BLUE : '#E3E6EA'}`,
            borderRadius:10, padding:'14px 16px', cursor:'pointer', transition:'all 0.15s',
          }}>
            <div style={{ fontSize:20, marginBottom:6 }}>{rt.icon}</div>
            <div style={{ fontSize:13, fontWeight:600, color:reportType===rt.id?'white':NAVY, marginBottom:3, fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif" }}>{rt.label}</div>
            <div style={{ fontSize:11, color:reportType===rt.id?'rgba(255,255,255,0.75)':'#5B6B7B' }}>{rt.desc}</div>
          </div>
        ))}
      </div>

      <button onClick={generateReport} disabled={loading} style={{
        background: loading ? '#A6CBF0' : `linear-gradient(135deg,${BLUE},#3680CE)`,
        color:'white', border:'none', borderRadius:8, padding:'11px 24px',
        fontSize:13, fontWeight:600, cursor:loading?'default':'pointer',
        fontFamily:"Gilroy,Arial,sans-serif", marginBottom:16,
        boxShadow: loading?'none':'0 3px 12px rgba(0,75,147,0.35)',
      }}>
        {loading ? '⏳ Generating report...' : `Generate ${REPORT_TYPES.find(r=>r.id===reportType)?.label}`}
      </button>

      {report && (
        <div style={{ background:'white', borderRadius:10, border:'1px solid #E3E6EA', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ background:`linear-gradient(135deg,${NAVY},${BLUE})`, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'white' }}>
              {REPORT_TYPES.find(r=>r.id===reportType)?.label} — {new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
            </div>
            <button onClick={copyReport} style={{ background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:6, color:'white', fontSize:11, padding:'4px 12px', cursor:'pointer', fontFamily:"Gilroy,Arial,sans-serif" }}>
              {copied ? '✓ Copied!' : '📋 Copy for Teams/Email'}
            </button>
          </div>
          <div style={{ padding:'20px', fontSize:13, color:'#02355A', lineHeight:1.7, whiteSpace:'pre-wrap' }}>
            {report}
          </div>
        </div>
      )}
    </div>
  )
}

// ── IMPORT PANEL ──────────────────────────────────────────────────────────────
function ImportPanel() {
  const [log, setLog] = useState([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  async function runImport() {
    setRunning(true)
    setLog(['Starting import of 13 historical sessions...'])
    let imported = 0
    let skipped = 0

    const dates = Object.keys(HISTORICAL_DATA).sort()
    for (const date of dates) {
      const { data: existing } = await supabase.from('sessions').select('id').eq('date', date).single()
      if (existing) {
        skipped++
        setLog(prev => [...prev, `⏭ Skipped ${date} — already exists`])
        continue
      }
      const { data: sess, error } = await supabase.from('sessions').insert({ date, owner: 'historical-import' }).select().single()
      if (error || !sess) {
        setLog(prev => [...prev, `❌ Error on ${date}: ${error?.message}`])
        continue
      }
      const kvRows = Object.entries(HISTORICAL_DATA[date]).map(([kpi_id, value]) => ({ session_id: sess.id, kpi_id, value }))
      await supabase.from('kpi_values').insert(kvRows)
      imported++
      setLog(prev => [...prev, `✅ Imported ${date} — ${kvRows.length} KPIs`])
    }
    setLog(prev => [...prev, ``, `🎉 Done — ${imported} imported, ${skipped} skipped`])
    setRunning(false)
    setDone(true)
  }

  return (
    <div style={{ maxWidth:600 }}>
      <div style={{ marginBottom:16 }}>
        <h2 style={{ fontSize:18, fontWeight:700, color:NAVY, fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif" }}>Import Historical Data</h2>
        <p style={{ fontSize:13, color:'#5B6B7B', marginTop:4 }}>Loads 13 sessions from April 13–29, 2026 from your DDS Excel file into Supabase.</p>
      </div>
      <div style={{ background:'white', borderRadius:10, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', marginBottom:16 }}>
        <div style={{ fontSize:13, color:'#02355A', marginBottom:16 }}>
          This will load all historical KPI values. Existing sessions are skipped automatically. <strong>Run once only.</strong>
        </div>
        <button onClick={runImport} disabled={running||done} style={{
          background: done?'#5D910D':running?'#A6CBF0':`linear-gradient(135deg,${BLUE},#3680CE)`,
          color:'white', border:'none', borderRadius:8, padding:'10px 20px',
          fontSize:13, fontWeight:600, cursor:running||done?'default':'pointer',
          fontFamily:"Gilroy,Arial,sans-serif",
        }}>
          {done ? '✅ Import complete' : running ? '⏳ Importing...' : '▶ Run import'}
        </button>
      </div>
      {log.length > 0 && (
        <div style={{ background:'#1f2937', borderRadius:10, padding:16, fontFamily:'monospace', fontSize:11, color:'#d1fae5', maxHeight:320, overflowY:'auto' }}>
          {log.map((l,i) => <div key={i} style={{ marginBottom:2, color: l.startsWith('❌')?'#F3B3BE':l.startsWith('⏭')?'#FFE8AD':'#d1fae5' }}>{l}</div>)}
        </div>
      )}
    </div>
  )
}

// ── MAIN BOARD ────────────────────────────────────────────────────────────────
export default function Board({ session, selectedBU, onBack }) {
  const [tab, setTab] = useState('board')
  const [curDate, setCurDate] = useState(todayWeekday())
  const [vals, setVals] = useState({})
  const [rcs, setRcs] = useState({})
  const [actions, setActions] = useState([])
  const [sessions, setSessions] = useState([])
  const [collapsed, setCollapsed] = useState({})
  const [rcModal, setRcModal] = useState(null)
  const [actModal, setActModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [newAct, setNewAct] = useState({ desc:'', owner:'', due:'', priority:'High', kpiRef:'' })
  const [rcForm, setRcForm] = useState({ category:'', desc:'', recurring:false })
  const [chartLoaded, setChartLoaded] = useState(false)

  useEffect(() => {
    if (window.Chart) { setChartLoaded(true); return }
    const s = document.createElement('script')
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
    s.onload = () => setChartLoaded(true)
    document.head.appendChild(s)
  }, [])

  useEffect(() => { loadAll() }, [])
  useEffect(() => { loadSession(curDate) }, [curDate, sessions.length])

  async function loadAll() {
    const { data:s } = await supabase.from('sessions').select('*').order('date')
    const { data:a } = await supabase.from('actions').select('*').order('created_at')
    setActions(a||[])
    if (s?.length) {
      const { data:allKv } = await supabase.from('kpi_values').select('*')
      const { data:allRc } = await supabase.from('root_causes').select('*')
      const kvBySess = {}
      ;(allKv||[]).forEach(r => { if (!kvBySess[r.session_id]) kvBySess[r.session_id]={}; kvBySess[r.session_id][r.kpi_id]=r.value })
      const rcBySess = {}
      ;(allRc||[]).forEach(r => { if (!rcBySess[r.session_id]) rcBySess[r.session_id]={}; rcBySess[r.session_id][r.kpi_id]=r })
      setSessions(s.map(sess => ({ ...sess, values:kvBySess[sess.id]||{}, rootCauses:rcBySess[sess.id]||{} })))
    } else setSessions([])
  }

  async function loadSession(date) {
    const sess = sessions.find(s=>s.date===date)
    if (!sess) { setVals({}); setRcs({}); return }
    const { data:kv } = await supabase.from('kpi_values').select('*').eq('session_id',sess.id)
    const { data:rc } = await supabase.from('root_causes').select('*').eq('session_id',sess.id)
    const v={}; (kv||[]).forEach(r=>v[r.kpi_id]=r.value)
    const r2={}; (rc||[]).forEach(r=>r2[r.kpi_id]=r)
    setVals(v); setRcs(r2)
  }

  async function saveSession() {
    setSaving(true)
    const { data:sess } = await supabase.from('sessions')
      .upsert({ date:curDate, owner:session.user.email },{ onConflict:'date' })
      .select().single()
    const kvRows = Object.entries(vals).map(([kpi_id,value])=>({ session_id:sess.id, kpi_id, value:parseFloat(value)??null })).filter(r=>r.value!==null&&!isNaN(r.value))
    if (kvRows.length) await supabase.from('kpi_values').upsert(kvRows,{ onConflict:'session_id,kpi_id' })
    const rcRows = Object.entries(rcs).filter(([,r])=>r?.category).map(([kpi_id,r])=>({ session_id:sess.id, kpi_id, category:r.category, description:r.desc||r.description||'', recurring:r.recurring||false }))
    if (rcRows.length) await supabase.from('root_causes').upsert(rcRows,{ onConflict:'session_id,kpi_id' })
    await loadAll()
    setSaving(false)
    setSaveMsg('Saved ✓')
    setTimeout(()=>setSaveMsg(''),2000)
  }

  async function saveAction() {
    if (!newAct.desc.trim()) { alert('Enter a description'); return }
    await supabase.from('actions').insert({ description:newAct.desc, owner:newAct.owner, due_date:newAct.due||null, priority:newAct.priority, kpi_ref:newAct.kpiRef, status:'Open', created_at:curDate })
    setActModal(false)
    setNewAct({ desc:'', owner:'', due:'', priority:'High', kpiRef:'' })
    loadAll()
  }

  async function markDone(id) {
    await supabase.from('actions').update({ status:'Done', completed_at:curDate }).eq('id',id)
    loadAll()
  }

  async function deleteAction(id) {
    if (!confirm('Delete this action?')) return
    await supabase.from('actions').delete().eq('id',id)
    loadAll()
  }

  function saveRc() {
    if (!rcForm.category) { alert('Select a category'); return }
    setRcs(prev=>({...prev,[rcModal.id]:rcForm}))
    setRcModal(null)
  }

  const today = todayWeekday()
  const counts = ALL_KPIS.reduce((a,k)=>{ const s=getStatus(k,vals[k.id]); a[s]=(a[s]||0)+1; return a },{})
  const openActions = actions.filter(a=>a.status!=='Done')
  const overdueActions = actions.filter(a=>a.status!=='Done'&&a.due_date&&a.due_date<today)
  const agingCount = actions.filter(a=>{
    if (a.status==='Done'||!a.created_at) return false
    return Math.floor((new Date()-new Date(a.created_at+'T00:00:00'))/86400000)>=5
  }).length

  const TABS = [
    { id:'board', label:'KPI Board' },
    { id:'actions', label:`Actions${openActions.length>0?` (${openActions.length})`:''}` },
    { id:'trends', label:'Trends & Analysis' },
    { id:'ai', label:'AI Reports' },
    { id:'log', label:'Session Log' },
    { id:'import', label:'Import Data' },
  ]

  const tabStyle = (t) => ({
    fontSize:12, fontFamily:"Gilroy,Arial,sans-serif", fontWeight:tab===t?600:400,
    padding:'10px 14px', background:'none', border:'none',
    borderBottom:`2px solid ${tab===t?'white':'transparent'}`,
    color:tab===t?'white':'rgba(255,255,255,0.55)',
    cursor:'pointer', whiteSpace:'nowrap', letterSpacing:0.3, transition:'all 0.15s',
  })

  return (
    <div style={{ minHeight:'100vh', background:'#F6F4F1', fontFamily:"Gilroy,Arial,sans-serif" }}>

      {/* HEADER */}
      <div style={{ background:`linear-gradient(135deg,${NAVY} 0%,${BLUE} 100%)`, boxShadow:'0 2px 20px rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              {onBack && (
                <button onClick={onBack} style={{ background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'white', fontSize:12, padding:'5px 10px', cursor:'pointer', fontFamily:"Gilroy,Arial,sans-serif" }}>
                  ← Hub
                </button>
              )}
              <div>
                <div style={{ fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif", fontSize:16, fontWeight:700, color:'white', letterSpacing:1 }}>
                  DAILY DIRECTION SETTING
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', letterSpacing:0.5 }}>
                  Poland Beverages · Supply Planning Foundation
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {agingCount > 0 && (
                <div style={{ background:'#C8102E', color:'white', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600 }}>
                  ⚠️ {agingCount} aging action{agingCount>1?'s':''}
                </div>
              )}
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)' }}>{session.user.email}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>
                  {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}
                </div>
              </div>
              <button onClick={()=>supabase.auth.signOut()} style={{ fontSize:11, padding:'5px 12px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:6, color:'white', cursor:'pointer', fontFamily:"Gilroy,Arial,sans-serif" }}>
                Sign out
              </button>
            </div>
          </div>
          <div style={{ display:'flex', gap:2, overflowX:'auto' }}>
            {TABS.map(t=><button key={t.id} style={tabStyle(t.id)} onClick={()=>setTab(t.id)}>{t.label}</button>)}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'20px' }}>

        {/* ══ BOARD TAB ══ */}
        {tab==='board' && (
          <div>
            {/* Summary cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:16 }}>
              {[
                { label:'Red KPIs', val:counts.red||0, color:'#C8102E', bg:'#FCE8EB', border:'#F3B3BE' },
                { label:'Amber KPIs', val:counts.amber||0, color:'#EB9F0A', bg:'#FFF6DE', border:'#FFE8AD' },
                { label:'Green KPIs', val:counts.green||0, color:'#5D910D', bg:'#EEF6E0', border:'#BFDE7D' },
                { label:'Not filled', val:counts.empty||0, color:'#5B6B7B', bg:'#f9fafb', border:'#E3E6EA' },
                { label:'Open actions', val:openActions.length, color:BLUE, bg:'#eff6ff', border:'#A6CBF0' },
              ].map(c=>(
                <div key={c.label} style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:10, padding:'12px 16px', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize:10, color:'#5B6B7B', fontWeight:500, textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>{c.label}</div>
                  <div style={{ fontSize:28, fontWeight:700, color:c.color, fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif" }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Date controls */}
            <div style={{ background:'white', borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', marginBottom:12, flexWrap:'wrap', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={()=>setCurDate(d=>nextWeekday(d,-1))} style={{ background:'#f3f4f6', border:'1.5px solid #E3E6EA', borderRadius:6, padding:'6px 14px', fontSize:14, cursor:'pointer', color:'#02355A' }}>←</button>
                <div style={{ background:'#f8fafc', border:'1.5px solid #E3E6EA', borderRadius:6, padding:'6px 18px', fontSize:13, fontWeight:600, color:NAVY, minWidth:210, textAlign:'center' }}>
                  {fmtDate(curDate)}
                  {curDate===today&&<span style={{ marginLeft:8, fontSize:10, background:BLUE, color:'white', padding:'1px 6px', borderRadius:10 }}>TODAY</span>}
                </div>
                <button onClick={()=>setCurDate(d=>nextWeekday(d,1))} style={{ background:'#f3f4f6', border:'1.5px solid #E3E6EA', borderRadius:6, padding:'6px 14px', fontSize:14, cursor:'pointer', color:'#02355A' }}>→</button>
                <button onClick={()=>setCurDate(today)} style={{ background:'#eff6ff', border:'1.5px solid #A6CBF0', borderRadius:6, padding:'6px 12px', fontSize:11, cursor:'pointer', color:BLUE, fontWeight:500 }}>Today</button>
              </div>
              <button onClick={saveSession} disabled={saving} style={{ background:saving?'#A6CBF0':`linear-gradient(135deg,${BLUE},#3680CE)`, color:'white', border:'none', borderRadius:8, padding:'9px 22px', fontSize:13, fontWeight:600, cursor:saving?'default':'pointer', fontFamily:"Gilroy,Arial,sans-serif", boxShadow:saving?'none':'0 3px 12px rgba(0,75,147,0.35)', minWidth:140 }}>
                {saveMsg||(saving?'Saving...':'Save Session')}
              </button>
            </div>

            {/* KPI Groups */}
            {GROUPS.map(g=>(
              <div key={g.label} style={{ background:'white', borderRadius:10, marginBottom:10, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
                <div onClick={()=>setCollapsed(p=>({...p,[g.label]:!p[g.label]}))} style={{ background:`linear-gradient(135deg,${g.color},${BLUE})`, padding:'10px 16px', display:'flex', alignItems:'center', cursor:'pointer', userSelect:'none' }}>
                  <span style={{ fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif", fontSize:13, fontWeight:600, color:'white', letterSpacing:0.8, textTransform:'uppercase' }}>{g.label}</span>
                  <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.7)', fontSize:11 }}>{collapsed[g.label]?'▶':'▼'}</span>
                </div>
                {!collapsed[g.label]&&(
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'12px 1fr 90px 90px 110px 130px', padding:'6px 16px', gap:10, background:'#f8fafc', borderBottom:'1px solid #f3f4f6' }}>
                      {['','KPI Measure','Target','Value','Root Cause','Owner'].map((h,i)=>(
                        <div key={i} style={{ fontSize:10, fontWeight:600, color:'#9ca3af', textTransform:'uppercase', letterSpacing:0.5, textAlign:i>=2?'center':'left' }}>{h}</div>
                      ))}
                    </div>
                    {g.kpis.map((kpi,ki)=>{
                      const val=vals[kpi.id]!==undefined?vals[kpi.id]:''
                      const s=getStatus(kpi,val)
                      const rc=rcs[kpi.id]
                      const hasRc=rc?.category
                      const kpiActions=actions.filter(a=>a.status!=='Done'&&a.kpi_ref===kpi.id)
                      return (
                        <div key={kpi.id}
                          style={{ display:'grid', gridTemplateColumns:'12px 1fr 90px 90px 110px 130px', padding:'10px 16px', gap:10, alignItems:'center', borderBottom:ki<g.kpis.length-1?'1px solid #f3f4f6':'none', transition:'background 0.1s' }}
                          onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
                          onMouseLeave={e=>e.currentTarget.style.background='white'}
                        >
                          <div style={{ width:10, height:10, borderRadius:'50%', background:stColor(s), boxShadow:s!=='empty'?`0 0 6px ${stColor(s)}80`:'none' }}/>
                          <div>
                            <div style={{ fontSize:13, fontWeight:500, color:'#1f2937', lineHeight:1.3 }}>{kpi.name}</div>
                            <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>
                              {kpi.uom} · <span style={{ color:'#5B6B7B' }}>{kpi.freq}</span>
                              {kpiActions.length>0&&<span style={{ marginLeft:8, color:'#EB9F0A', fontWeight:500 }}>{kpiActions.length} action{kpiActions.length>1?'s':''} open</span>}
                            </div>
                          </div>
                          <div style={{ textAlign:'center', fontSize:12, color:'#5B6B7B', fontWeight:500 }}>{kpi.target}</div>
                          <div style={{ textAlign:'center' }}>
                            {kpi.tv===null?(
                              <span style={{ fontSize:11, color:'#9ca3af' }}>TBD</span>
                            ):(
                              <input type="number" value={val} placeholder="—" step="any"
                                onChange={e=>setVals(p=>({...p,[kpi.id]:e.target.value}))}
                                style={{ width:80, padding:'6px 8px', border:`1.5px solid ${s!=='empty'?stBorder(s):'#E3E6EA'}`, borderRadius:6, fontSize:13, fontWeight:600, textAlign:'center', outline:'none', background:s!=='empty'?stBg(s):'white', color:stColor(s), fontFamily:"Gilroy,Arial,sans-serif", transition:'all 0.15s' }}
                              />
                            )}
                          </div>
                          <div style={{ textAlign:'center' }}>
                            <button onClick={()=>{ setRcModal(kpi); setRcForm(rc||{category:'',desc:'',recurring:false}) }} style={{ fontSize:11, padding:'5px 10px', border:`1.5px solid ${hasRc?'#F3B3BE':'#E3E6EA'}`, borderRadius:6, cursor:'pointer', background:hasRc?'#FCE8EB':'#f9fafb', color:hasRc?'#C8102E':'#5B6B7B', fontFamily:"Gilroy,Arial,sans-serif", fontWeight:500, whiteSpace:'nowrap' }}>
                              {hasRc?`✓ ${rc.category.split(' ')[0]}`:'+ Root cause'}
                            </button>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ width:28, height:28, borderRadius:'50%', background:`linear-gradient(135deg,${BLUE},#3680CE)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'white', flexShrink:0 }} title={`${kpi.owner} / ${kpi.backup}`}>
                              {initials(kpi.owner)}
                            </div>
                            <div style={{ fontSize:10, color:'#5B6B7B', lineHeight:1.2 }}>
                              <div style={{ fontWeight:500 }}>{kpi.owner.split(' ')[0]}</div>
                              <div style={{ color:'#9ca3af' }}>bkp: {kpi.backup.split(' ')[0]}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══ ACTIONS TAB ══ */}
        {tab==='actions'&&(
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div>
                <h2 style={{ fontSize:18, fontWeight:700, color:NAVY, fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif" }}>Action Tracker</h2>
                <p style={{ fontSize:12, color:'#5B6B7B', marginTop:2 }}>{openActions.length} open · {overdueActions.length} overdue · {agingCount} aging (5+ days)</p>
              </div>
              <button onClick={()=>setActModal(true)} style={{ background:`linear-gradient(135deg,${BLUE},#3680CE)`, color:'white', border:'none', borderRadius:8, padding:'10px 18px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:"Gilroy,Arial,sans-serif", boxShadow:'0 3px 12px rgba(0,75,147,0.35)' }}>+ Add action</button>
            </div>
            <div style={{ background:'white', borderRadius:10, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:`linear-gradient(135deg,${NAVY},${BLUE})` }}>
                    {['Action','KPI','Owner','Due date','Priority','Status','Days open',''].map(h=>(
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:600, color:'rgba(255,255,255,0.8)', textTransform:'uppercase', letterSpacing:0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!actions.length&&<tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'#9ca3af', fontSize:13 }}>No actions yet.</td></tr>}
                  {actions.map(a=>{
                    const overdue=a.status!=='Done'&&a.due_date&&a.due_date<today
                    const disp=overdue?'Overdue':a.status
                    const days=a.created_at?Math.floor((new Date()-new Date(a.created_at+'T00:00:00'))/86400000):0
                    const aging=a.status!=='Done'&&days>=5
                    const stB=disp==='Done'?['#EEF6E0','#5D910D']:disp==='Overdue'?['#FCE8EB','#C8102E']:['#FFF6DE','#EB9F0A']
                    return (
                      <tr key={a.id} style={{ borderBottom:'1px solid #f3f4f6', background:aging&&disp!=='Done'?'#FFF6DE':'white' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#f9fafb'}
                        onMouseLeave={e=>e.currentTarget.style.background=aging&&disp!=='Done'?'#FFF6DE':'white'}>
                        <td style={{ padding:'10px 14px', fontWeight:500, color:'#1f2937', maxWidth:240 }}>{a.description}</td>
                        <td style={{ padding:'10px 14px', color:'#5B6B7B', fontSize:12 }}>{a.kpi_ref||'—'}</td>
                        <td style={{ padding:'10px 14px', color:'#02355A' }}>{a.owner}</td>
                        <td style={{ padding:'10px 14px', color:'#5B6B7B', fontSize:12 }}>{a.due_date||'—'}</td>
                        <td style={{ padding:'10px 14px', fontSize:12, fontWeight:600, color:a.priority==='High'?'#C8102E':a.priority==='Medium'?'#EB9F0A':'#5D910D' }}>{a.priority}</td>
                        <td style={{ padding:'10px 14px' }}><span style={{ fontSize:11, padding:'3px 10px', borderRadius:12, background:stB[0], color:stB[1], fontWeight:600 }}>{disp}</span></td>
                        <td style={{ padding:'10px 14px', color:aging?'#EB9F0A':'#9ca3af', fontSize:12, fontWeight:aging?600:400 }}>{days}d{aging?' ⚠️':''}</td>
                        <td style={{ padding:'10px 14px', display:'flex', gap:6 }}>
                          {a.status!=='Done'&&<button onClick={()=>markDone(a.id)} style={{ fontSize:11, padding:'3px 8px', border:'1px solid #BFDE7D', borderRadius:4, cursor:'pointer', background:'#EEF6E0', color:'#5D910D' }}>✓</button>}
                          <button onClick={()=>deleteAction(a.id)} style={{ fontSize:11, padding:'3px 8px', border:'1px solid #F3B3BE', borderRadius:4, cursor:'pointer', background:'#FCE8EB', color:'#C8102E' }}>✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ TRENDS TAB ══ */}
        {tab==='trends'&&(
          <div>
            <div style={{ marginBottom:16 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:NAVY, fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif" }}>Trends & Analysis</h2>
              <p style={{ fontSize:12, color:'#5B6B7B', marginTop:2 }}>Last 30 working days · RAG-coloured bars · 7-day rolling average · dashed target</p>
            </div>

            <InsightsPanel
              GROUPS={GROUPS}
              sessions={sessions}
              kpiValues={sessions.flatMap(s => Object.entries(s.values || {}).map(([kpi_id, value]) => ({ session_id: s.id, kpi_id, value })))}
              rootCauses={sessions.flatMap(s => Object.entries(s.rootCauses || {}).map(([kpi_id, r]) => ({ ...r, session_id: s.id, kpi_id })))}
              actions={actions}
              curDate={curDate}
              buName={selectedBU ? `${selectedBU.country} ${selectedBU.bu}` : 'Poland Beverages'}
              statusFn={getStatus}
            />

            {sessions.length < 3 && (
              <div style={{ background:'#FFF6DE', border:'1px solid #FFE8AD', borderRadius:10, padding:24, textAlign:'center', color:'#954F09', marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>Not enough data yet</div>
                <div style={{ fontSize:13 }}>Save at least 3 sessions or run the Import Data tool to populate trends.</div>
              </div>
            )}

            {sessions.length >= 3 && (
              <>
                {/* KPI Health Heatmap */}
                <div style={{ background:'white', borderRadius:10, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', marginBottom:14 }}>
                  <div style={{ fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif", fontSize:15, fontWeight:700, color:NAVY, marginBottom:4 }}>KPI Health Heatmap</div>
                  <div style={{ fontSize:11, color:'#5B6B7B', marginBottom:12 }}>Last 14 sessions · ✓ green · ~ amber · ✕ red · · empty</div>
                  <HeatmapChart sessions={sessions}/>
                </div>

                {/* Worst Offenders + Streak side by side */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <div style={{ background:'white', borderRadius:10, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif", fontSize:15, fontWeight:700, color:NAVY, marginBottom:4 }}>Worst Offenders</div>
                    <div style={{ fontSize:11, color:'#5B6B7B', marginBottom:12 }}>% days red in last 30 sessions</div>
                    <WorstOffenders sessions={sessions}/>
                  </div>
                  <div style={{ background:'white', borderRadius:10, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif", fontSize:15, fontWeight:700, color:NAVY, marginBottom:4 }}>Streak Tracker</div>
                    <div style={{ fontSize:11, color:'#5B6B7B', marginBottom:12 }}>Consecutive days same RAG status</div>
                    <StreakTracker sessions={sessions}/>
                  </div>
                </div>

                {/* RC Analytics */}
                <div style={{ background:'white', borderRadius:10, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', marginBottom:14 }}>
                  <div style={{ fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif", fontSize:15, fontWeight:700, color:NAVY, marginBottom:4 }}>Root Cause Analytics</div>
                  <div style={{ fontSize:11, color:'#5B6B7B', marginBottom:12 }}>Category distribution across all red KPI sessions</div>
                  <RCAnalytics sessions={sessions}/>
                </div>

                {/* Trend Charts */}
                {chartLoaded && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                    {[
                      { id:'psa_m', color:BLUE },
                      { id:'psa_z', color:'#3680CE' },
                      { id:'oos_i', color:'#C8102E' },
                      { id:'rmso_total', color:'#EB9F0A' },
                      { id:'scr', color:'#155798' },
                      { id:'unmet_cs', color:'#0F440E' },
                      { id:'rm_conc', color:'#954F09' },
                      { id:'rm_open', color:'#0891b2' },
                    ].map(({ id, color })=>{
                      const kpi=ALL_KPIS.find(k=>k.id===id)
                      if (!kpi) return null
                      return (
                        <div key={id} style={{ background:'white', borderRadius:10, padding:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
                          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12 }}>
                            <div>
                              <div style={{ fontSize:13, fontWeight:600, color:NAVY }}>{kpi.name}</div>
                              <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>Target: {kpi.target} · {kpi.owner}</div>
                            </div>
                            <div style={{ width:10, height:10, borderRadius:'50%', background:color, flexShrink:0 }}/>
                          </div>
                          <div style={{ height:160 }}>
                            <TrendChart sessions={sessions} kpiId={id} kpi={kpi} color={color}/>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ AI REPORTS TAB ══ */}
        {tab==='ai'&&<AIReports sessions={sessions} actions={actions}/>}

        {/* ══ SESSION LOG TAB ══ */}
        {tab==='log'&&(
          <div>
            <div style={{ marginBottom:16 }}>
              <h2 style={{ fontSize:18, fontWeight:700, color:NAVY, fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif" }}>Session Log</h2>
              <p style={{ fontSize:12, color:'#5B6B7B', marginTop:2 }}>{sessions.length} sessions saved</p>
            </div>
            {!sessions.length&&<div style={{ background:'white', borderRadius:10, padding:40, textAlign:'center', color:'#9ca3af', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>No sessions saved yet.</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[...sessions].reverse().map(s=>{
                const isToday=s.date===today
                const reds=ALL_KPIS.filter(k=>getStatus(k,s.values?.[k.id])==='red').length
                const greens=ALL_KPIS.filter(k=>getStatus(k,s.values?.[k.id])==='green').length
                return (
                  <div key={s.id} style={{ background:'white', borderRadius:10, padding:'14px 18px', display:'flex', alignItems:'center', gap:16, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:isToday?`1.5px solid ${BLUE}`:'1.5px solid transparent' }}>
                    <div style={{ minWidth:170 }}>
                      <div style={{ fontSize:14, fontWeight:600, color:NAVY }}>{fmtDate(s.date)}</div>
                      <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>by {s.owner||'unknown'}</div>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:12, background:'#FCE8EB', color:'#C8102E', fontWeight:600 }}>{reds} red</span>
                      <span style={{ fontSize:11, padding:'3px 10px', borderRadius:12, background:'#EEF6E0', color:'#5D910D', fontWeight:600 }}>{greens} green</span>
                    </div>
                    {isToday&&<span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:BLUE, color:'white', fontWeight:600 }}>TODAY</span>}
                    <button onClick={()=>{ setCurDate(s.date); setTab('board') }} style={{ marginLeft:'auto', fontSize:12, padding:'6px 14px', border:'1.5px solid #E3E6EA', borderRadius:6, cursor:'pointer', background:'#f9fafb', color:'#02355A', fontFamily:"Gilroy,Arial,sans-serif" }}>Load →</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ IMPORT TAB ══ */}
        {tab==='import'&&<ImportPanel/>}
      </div>

      {/* ROOT CAUSE MODAL */}
      {rcModal&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,26,64,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99, padding:20 }}>
          <div style={{ background:'white', borderRadius:16, padding:28, width:420, maxWidth:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:NAVY, marginBottom:4, fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif" }}>Root Cause Analysis</h3>
            <p style={{ fontSize:12, color:'#5B6B7B', marginBottom:20 }}>{rcModal.name}</p>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#02355A', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Category *</label>
              <select value={rcForm.category} onChange={e=>setRcForm(p=>({...p,category:e.target.value}))} style={{ width:'100%', padding:'10px 12px', fontSize:13, border:'1.5px solid #E3E6EA', borderRadius:8, fontFamily:"Gilroy,Arial,sans-serif", outline:'none' }}>
                <option value="">Select category…</option>
                {RC_CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#02355A', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Description & corrective action</label>
              <textarea value={rcForm.desc} onChange={e=>setRcForm(p=>({...p,desc:e.target.value}))} rows={3} placeholder="What caused this? What is the corrective action?" style={{ width:'100%', padding:'10px 12px', fontSize:13, border:'1.5px solid #E3E6EA', borderRadius:8, fontFamily:"Gilroy,Arial,sans-serif", resize:'vertical', outline:'none' }}/>
            </div>
            <div style={{ marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
              <input type="checkbox" id="recur" checked={rcForm.recurring} onChange={e=>setRcForm(p=>({...p,recurring:e.target.checked}))} style={{ width:16, height:16 }}/>
              <label htmlFor="recur" style={{ fontSize:13, color:'#02355A', cursor:'pointer' }}>This is a recurring issue</label>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={()=>setRcModal(null)} style={{ fontSize:13, padding:'9px 18px', border:'1.5px solid #E3E6EA', borderRadius:8, cursor:'pointer', background:'white', color:'#02355A', fontFamily:"Gilroy,Arial,sans-serif" }}>Cancel</button>
              <button onClick={saveRc} style={{ fontSize:13, padding:'9px 18px', background:`linear-gradient(135deg,${BLUE},#3680CE)`, color:'white', border:'none', borderRadius:8, cursor:'pointer', fontFamily:"Gilroy,Arial,sans-serif", fontWeight:600 }}>Save root cause</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ACTION MODAL */}
      {actModal&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,26,64,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99, padding:20 }}>
          <div style={{ background:'white', borderRadius:16, padding:28, width:440, maxWidth:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:NAVY, marginBottom:20, fontFamily:"'GT Pressura','Arial Narrow',Arial,sans-serif" }}>Add New Action</h3>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#02355A', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Action description *</label>
              <textarea value={newAct.desc} onChange={e=>setNewAct(p=>({...p,desc:e.target.value}))} rows={2} placeholder="What needs to happen?" style={{ width:'100%', padding:'10px 12px', fontSize:13, border:'1.5px solid #E3E6EA', borderRadius:8, fontFamily:"Gilroy,Arial,sans-serif", resize:'none', outline:'none' }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
              {[{label:'Owner',key:'owner',type:'text',ph:'Name'},{label:'Due date',key:'due',type:'date',ph:''},{label:'KPI reference',key:'kpiRef',type:'text',ph:'e.g. PSA, OOS…'}].map(f=>(
                <div key={f.key}>
                  <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#02355A', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>{f.label}</label>
                  <input type={f.type} value={newAct[f.key]} placeholder={f.ph} onChange={e=>setNewAct(p=>({...p,[f.key]:e.target.value}))} style={{ width:'100%', padding:'9px 12px', fontSize:13, border:'1.5px solid #E3E6EA', borderRadius:8, fontFamily:"Gilroy,Arial,sans-serif", outline:'none' }}/>
                </div>
              ))}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'#02355A', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>Priority</label>
                <select value={newAct.priority} onChange={e=>setNewAct(p=>({...p,priority:e.target.value}))} style={{ width:'100%', padding:'9px 12px', fontSize:13, border:'1.5px solid #E3E6EA', borderRadius:8, fontFamily:"Gilroy,Arial,sans-serif", outline:'none' }}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={()=>setActModal(false)} style={{ fontSize:13, padding:'9px 18px', border:'1.5px solid #E3E6EA', borderRadius:8, cursor:'pointer', background:'white', color:'#02355A', fontFamily:"Gilroy,Arial,sans-serif" }}>Cancel</button>
              <button onClick={saveAction} style={{ fontSize:13, padding:'9px 18px', background:`linear-gradient(135deg,${BLUE},#3680CE)`, color:'white', border:'none', borderRadius:8, cursor:'pointer', fontFamily:"Gilroy,Arial,sans-serif", fontWeight:600, boxShadow:'0 3px 12px rgba(0,75,147,0.35)' }}>Save action</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}