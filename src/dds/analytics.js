// DDS analytics: turns the raw Supabase rows into the numbers a DDS meeting needs.
// Pure functions - no React, no Supabase - so they can be reused by the board, the exports
// and the AI report payload.
//
// Data shapes (as used in Board.jsx today):
//   GROUPS       [{ label, color, kpis: [{ id, name, uom, target, tv, hi, owner, backup, freq }] }]
//   sessions     [{ id, date: 'YYYY-MM-DD', owner }]
//   kpiValues    [{ session_id, kpi_id, value }]
//   rootCauses   [{ session_id, kpi_id, category, description, recurring }]
//   actions      [{ id, description, owner, due_date, priority, kpi_ref, status, created_at, completed_at }]

// Same rule as Board.jsx getStatus(): hi=true -> higher is better, amber within 10%;
// hi=false -> lower is better, amber within +30%.
export function getStatus(kpi, val) {
  if (kpi.tv === null || kpi.tv === undefined) return 'empty'
  if (val === '' || val === null || val === undefined) return 'empty'
  const v = parseFloat(val)
  if (isNaN(v)) return 'empty'
  if (kpi.hi) return v >= kpi.tv ? 'green' : v >= kpi.tv * 0.9 ? 'amber' : 'red'
  return v <= kpi.tv ? 'green' : v <= kpi.tv * 1.3 ? 'amber' : 'red'
}

const DAY = 86400000
const toDate = (d) => new Date(String(d).slice(0, 10) + 'T00:00:00')
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY)
const round1 = (x) => Math.round(x * 10) / 10
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0)

export const allKpis = (GROUPS) => GROUPS.flatMap((g) => g.kpis.map((k) => ({ ...k, group: g.label })))

/** Map session_id -> { kpi_id: value } for quick lookups. */
export function valuesBySession(kpiValues) {
  const m = {}
  for (const r of kpiValues || []) (m[r.session_id] ||= {})[r.kpi_id] = r.value
  return m
}

/** Headline numbers for one session (one DDS meeting). */
export function sessionScorecard(GROUPS, sessionValues = {}, statusFn = getStatus) {
  const kpis = allKpis(GROUPS).filter((k) => k.tv !== null && k.tv !== undefined)
  const counts = { red: 0, amber: 0, green: 0, empty: 0 }
  const byGroup = {}
  for (const k of kpis) {
    const s = statusFn(k, sessionValues[k.id])
    counts[s]++
    const g = (byGroup[k.group] ||= { red: 0, amber: 0, green: 0, empty: 0 })
    g[s]++
  }
  const total = kpis.length
  const filled = total - counts.empty
  return {
    ...counts,
    total,
    filled,
    compliancePct: pct(filled, total),          // DDS compliance: KPIs filled / KPIs tracked
    onTargetPct: pct(counts.green, filled),     // of the KPIs filled, how many are green
    byGroup,
  }
}

/** One row per session: date, compliance %, on-target %, RAG counts. Oldest first. */
export function sessionTrend(GROUPS, sessions, kpiValues, lastN = 30, statusFn = getStatus) {
  const vbs = valuesBySession(kpiValues)
  return [...(sessions || [])]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-lastN)
    .map((s) => ({ date: s.date, ...sessionScorecard(GROUPS, vbs[s.id], statusFn) }))
}

/** KPIs that have been red for N sessions in a row up to the latest session. */
export function redStreaks(GROUPS, sessions, kpiValues, minStreak = 2, statusFn = getStatus) {
  const vbs = valuesBySession(kpiValues)
  const ordered = [...(sessions || [])].sort((a, b) => (a.date < b.date ? 1 : -1)) // newest first
  const out = []
  for (const k of allKpis(GROUPS)) {
    let streak = 0
    for (const s of ordered) {
      const st = statusFn(k, vbs[s.id]?.[k.id])
      if (st === 'empty') continue          // a missed entry doesn't break or extend the streak
      if (st !== 'red') break
      streak++
    }
    if (streak >= minStreak) out.push({ kpiId: k.id, name: k.name, group: k.group, owner: k.owner, streak })
  }
  return out.sort((a, b) => b.streak - a.streak)
}

/** Average value per KPI this week vs last week (Mon-Sun), with the RAG of each average. */
export function weekOverWeek(GROUPS, sessions, kpiValues, today = new Date(), statusFn = getStatus) {
  const t = toDate(today.toISOString?.() ?? today)
  const monday = new Date(t.getTime() - ((t.getDay() + 6) % 7) * DAY)
  const lastMonday = new Date(monday.getTime() - 7 * DAY)
  const sessDate = Object.fromEntries((sessions || []).map((s) => [s.id, toDate(s.date)]))
  const acc = {}
  for (const r of kpiValues || []) {
    const d = sessDate[r.session_id]
    const v = parseFloat(r.value)
    if (!d || isNaN(v)) continue
    const bucket = d >= monday ? 'thisWeek' : d >= lastMonday ? 'lastWeek' : null
    if (!bucket) continue
    const a = ((acc[r.kpi_id] ||= { thisWeek: [], lastWeek: [] })[bucket])
    a.push(v)
  }
  const avg = (xs) => (xs.length ? xs.reduce((p, c) => p + c, 0) / xs.length : null)
  return allKpis(GROUPS).map((k) => {
    const tw = avg(acc[k.id]?.thisWeek || [])
    const lw = avg(acc[k.id]?.lastWeek || [])
    const sNow = statusFn(k, tw)
    const sPrev = statusFn(k, lw)
    const rank = { red: 0, amber: 1, green: 2, empty: null }
    const trend = rank[sNow] === null || rank[sPrev] === null ? 'n/a'
      : rank[sNow] > rank[sPrev] ? 'improved' : rank[sNow] < rank[sPrev] ? 'worsened' : 'same'
    return { kpiId: k.id, name: k.name, group: k.group, thisWeek: tw, lastWeek: lw, statusNow: sNow, statusPrev: sPrev, trend }
  })
}

/** Root-cause Pareto over the last `sinceDays` days: count, %, cumulative %, recurring count. */
export function rootCausePareto(rootCauses, sessions, sinceDays = 30, today = new Date()) {
  const cutoff = new Date(toDate(today.toISOString?.() ?? today).getTime() - sinceDays * DAY)
  const sessDate = Object.fromEntries((sessions || []).map((s) => [s.id, toDate(s.date)]))
  const m = {}
  let total = 0
  for (const r of rootCauses || []) {
    const d = sessDate[r.session_id]
    if (!d || d < cutoff || !r.category) continue
    const c = (m[r.category] ||= { category: r.category, count: 0, recurring: 0, kpis: new Set() })
    c.count++
    if (r.recurring) c.recurring++
    c.kpis.add(r.kpi_id)
    total++
  }
  let cum = 0
  return Object.values(m)
    .sort((a, b) => b.count - a.count)
    .map((c) => {
      cum += c.count
      return { category: c.category, count: c.count, recurring: c.recurring, kpiCount: c.kpis.size, pct: pct(c.count, total), cumPct: pct(cum, total) }
    })
}

const isClosed = (a) => !!a.completed_at || ['done', 'closed', 'completed'].includes(String(a.status || '').toLowerCase())

/** Open-action ageing buckets, overdue by owner, and closure performance. */
export function actionAgeing(actions, today = new Date()) {
  const now = today.toISOString?.() ?? today
  const buckets = { '0-2 days': 0, '3-5 days': 0, '6-10 days': 0, '>10 days': 0 }
  const overdueByOwner = {}
  let open = 0, overdue = 0, closed = 0, closedOnTime = 0, closeDaysSum = 0
  for (const a of actions || []) {
    if (isClosed(a)) {
      closed++
      if (a.created_at && a.completed_at) closeDaysSum += Math.max(0, daysBetween(a.created_at, a.completed_at))
      if (a.due_date && a.completed_at && toDate(a.completed_at) <= toDate(a.due_date)) closedOnTime++
      continue
    }
    open++
    const age = a.created_at ? daysBetween(a.created_at, now) : 0
    buckets[age <= 2 ? '0-2 days' : age <= 5 ? '3-5 days' : age <= 10 ? '6-10 days' : '>10 days']++
    if (a.due_date && toDate(a.due_date) < toDate(now)) {
      overdue++
      const o = a.owner || 'Unassigned'
      overdueByOwner[o] = (overdueByOwner[o] || 0) + 1
    }
  }
  return {
    open, overdue, closed, buckets,
    overdueByOwner: Object.entries(overdueByOwner).map(([owner, count]) => ({ owner, count })).sort((a, b) => b.count - a.count),
    avgDaysToClose: closed ? round1(closeDaysSum / closed) : null,
    onTimeClosePct: pct(closedOnTime, closed),
  }
}

/** Compact JSON for the AI report function: small, numeric, no free text from other systems. */
export function buildReportPayload({ GROUPS, sessions, kpiValues, rootCauses, actions, curDate, buName }, statusFn = getStatus) {
  const vbs = valuesBySession(kpiValues)
  const cur = (sessions || []).find((s) => s.date === curDate)
  const kpis = allKpis(GROUPS)
  return {
    businessUnit: buName,
    date: curDate,
    today: cur ? {
      scorecard: sessionScorecard(GROUPS, vbs[cur.id], statusFn),
      kpis: kpis.map((k) => ({ group: k.group, name: k.name, uom: k.uom, target: k.target, value: vbs[cur.id]?.[k.id] ?? null, status: statusFn(k, vbs[cur.id]?.[k.id]) })),
    } : null,
    trend30: sessionTrend(GROUPS, sessions, kpiValues, 30, statusFn).map(({ date, compliancePct, onTargetPct, red, amber, green }) => ({ date, compliancePct, onTargetPct, red, amber, green })),
    redStreaks: redStreaks(GROUPS, sessions, kpiValues, 2, statusFn),
    weekOverWeek: weekOverWeek(GROUPS, sessions, kpiValues, toDate(curDate || new Date().toISOString()), statusFn).filter((r) => r.trend === 'worsened' || r.trend === 'improved'),
    rootCausePareto: rootCausePareto(rootCauses, sessions, 30, toDate(curDate || new Date().toISOString())),
    actions: actionAgeing(actions, toDate(curDate || new Date().toISOString())),
  }
}
