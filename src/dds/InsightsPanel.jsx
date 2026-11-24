// "Insights" panel for the DDS board: headline numbers, root-cause Pareto, action ageing,
// red streaks, and export buttons - all in PepsiCo colours.
// Usage inside Board.jsx (e.g. at the top of the "Trends & Analysis" tab):
//   <InsightsPanel GROUPS={GROUPS} sessions={sessions} kpiValues={allKv}
//                  rootCauses={allRc} actions={actions} curDate={curDate} buName={selectedBU?.name} />

import { useMemo, useState } from 'react'
import { B, FONT, S, stText } from '../brand/pepsicoTheme'
import { sessionScorecard, valuesBySession, rootCausePareto, actionAgeing, redStreaks, getStatus } from './analytics'
import { exportWorkbook, exportCsv, kpiLongRows, printBoard } from './exportData'

function Tile({ label, value, sub, tone = 'navy' }) {
  const bg = tone === 'green' ? B.green300 : tone === 'amber' ? B.yellow300 : tone === 'red' ? B.red : B.navy
  const fg = tone === 'amber' ? B.yellow500 : B.white
  return (
    <div style={{ background: bg, color: fg, borderRadius: 14, padding: '14px 16px', minWidth: 0 }}>
      <div style={{ fontFamily: FONT.head, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.6, opacity: 0.9 }}>{label}</div>
      <div style={{ fontFamily: FONT.head, fontWeight: 900, fontSize: 32, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, opacity: 0.9 }}>{sub}</div>}
    </div>
  )
}

const band = (p, green = 90, amber = 75) => (p >= green ? 'green' : p >= amber ? 'amber' : 'red')

export default function InsightsPanel({ GROUPS, sessions, kpiValues, rootCauses, actions, curDate, buName = 'DDS', statusFn = getStatus }) {
  const [busy, setBusy] = useState(false)
  const today = useMemo(() => new Date((curDate || new Date().toISOString().slice(0, 10)) + 'T00:00:00'), [curDate])

  const data = useMemo(() => {
    const vbs = valuesBySession(kpiValues)
    const cur = (sessions || []).find((s) => s.date === curDate)
    return {
      card: sessionScorecard(GROUPS, cur ? vbs[cur.id] : {}, statusFn),
      pareto: rootCausePareto(rootCauses, sessions, 30, today),
      ageing: actionAgeing(actions, today),
      streaks: redStreaks(GROUPS, sessions, kpiValues, 3, statusFn),
    }
  }, [GROUPS, sessions, kpiValues, rootCauses, actions, curDate, today, statusFn])

  const { card, pareto, ageing, streaks } = data
  const maxCount = Math.max(1, ...pareto.map((p) => p.count))
  const maxBucket = Math.max(1, ...Object.values(ageing.buckets))

  async function onExcel() {
    setBusy(true)
    try { await exportWorkbook({ GROUPS, sessions, kpiValues, rootCauses, actions, buName }, statusFn) }
    catch (e) { console.error(e); exportCsv(kpiLongRows({ GROUPS, sessions, kpiValues, rootCauses }, statusFn), `${buName}_DDS.csv`) }
    finally { setBusy(false) }
  }

  return (
    <section style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={S.h2}>DDS insights · {curDate}</h2>
        <div className="no-print" style={{ display: 'flex', gap: 8 }}>
          <button style={S.btnPrimary} onClick={onExcel} disabled={busy}>{busy ? 'Exporting…' : 'Export to Excel'}</button>
          <button style={S.btnSecondary} onClick={printBoard}>Print / PDF</button>
        </div>
      </div>

      {/* Headline numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
        <Tile label="DDS compliance" value={`${card.compliancePct}%`} sub={`${card.filled} of ${card.total} KPIs filled`} tone={band(card.compliancePct, 95, 80)} />
        <Tile label="On target" value={`${card.onTargetPct}%`} sub={`${card.green} green · ${card.amber} amber · ${card.red} red`} tone={band(card.onTargetPct, 80, 60)} />
        <Tile label="Open actions" value={ageing.open} sub={`${ageing.overdue} overdue`} tone={ageing.overdue ? 'amber' : 'green'} />
        <Tile label="Avg days to close" value={ageing.avgDaysToClose ?? '–'} sub={`${ageing.onTimeClosePct}% closed on time`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
        {/* Root-cause Pareto */}
        <div style={{ ...S.card, padding: 16 }}>
          <h3 style={{ ...S.h2, fontSize: 13, marginBottom: 10 }}>Root causes · last 30 days</h3>
          {pareto.length === 0 && <div style={{ color: B.muted, fontSize: 13 }}>No root causes logged yet.</div>}
          {pareto.slice(0, 6).map((p) => (
            <div key={p.category} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 64px', alignItems: 'center', gap: 8, margin: '6px 0' }}>
              <span style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.category}>{p.category}</span>
              <div style={{ background: B.offWhite, borderRadius: 6, height: 14 }}>
                <div style={{ width: `${(p.count / maxCount) * 100}%`, height: '100%', borderRadius: 6, background: p.cumPct <= 80 ? B.navy : B.blue100 }} />
              </div>
              <span style={{ fontSize: 12, textAlign: 'right' }}>{p.count} · {p.pct}%</span>
            </div>
          ))}
          {pareto.length > 0 && <div style={{ fontSize: 11, color: B.muted, marginTop: 8 }}>Dark bars = the causes behind 80% of issues. {pareto.reduce((s, p) => s + p.recurring, 0)} flagged recurring.</div>}
        </div>

        {/* Action ageing */}
        <div style={{ ...S.card, padding: 16 }}>
          <h3 style={{ ...S.h2, fontSize: 13, marginBottom: 10 }}>Open action ageing</h3>
          {Object.entries(ageing.buckets).map(([k, v], i) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 30px', alignItems: 'center', gap: 8, margin: '6px 0' }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{k}</span>
              <div style={{ background: B.offWhite, borderRadius: 6, height: 14 }}>
                <div style={{ width: `${(v / maxBucket) * 100}%`, height: '100%', borderRadius: 6, background: [B.green300, B.yellow300, B.yellow500, B.red][i] }} />
              </div>
              <span style={{ fontSize: 12, textAlign: 'right' }}>{v}</span>
            </div>
          ))}
          {ageing.overdueByOwner.length > 0 && (
            <div style={{ fontSize: 12, marginTop: 10 }}>
              <b>Overdue by owner:</b> {ageing.overdueByOwner.slice(0, 4).map((o) => `${o.owner} (${o.count})`).join(' · ')}
            </div>
          )}
        </div>

        {/* Red streaks */}
        <div style={{ ...S.card, padding: 16 }}>
          <h3 style={{ ...S.h2, fontSize: 13, marginBottom: 10 }}>Red 3+ sessions in a row</h3>
          {streaks.length === 0 && <div style={{ color: B.green500, fontSize: 13, fontWeight: 700 }}>No KPI has been red for 3 sessions running.</div>}
          {streaks.slice(0, 6).map((s) => (
            <div key={s.kpiId} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: `1px solid ${B.line}` }}>
              <span style={{ fontSize: 12 }}><b>{s.name}</b><br /><span style={{ color: B.muted }}>{s.group} · {s.owner}</span></span>
              <span style={{ ...S.pill('#FCE8EB', stText('red')), alignSelf: 'center', whiteSpace: 'nowrap' }}>{s.streak} sessions</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
