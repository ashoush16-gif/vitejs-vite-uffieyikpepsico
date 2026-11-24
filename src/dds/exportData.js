// Excel / CSV / print exports for the DDS board.
// Excel needs SheetJS:  npm install xlsx
// It is loaded on demand, so the board stays fast for users who never export.

import { allKpis, getStatus, valuesBySession, sessionTrend, rootCausePareto, actionAgeing } from './analytics'

/** Long ("tidy") table: one row per session x KPI. Best shape for Excel pivots and Power BI. */
export function kpiLongRows({ GROUPS, sessions, kpiValues, rootCauses }, statusFn = getStatus) {
  const vbs = valuesBySession(kpiValues)
  const rc = {}
  for (const r of rootCauses || []) rc[`${r.session_id}|${r.kpi_id}`] = r
  const kpis = allKpis(GROUPS)
  const rows = []
  for (const s of [...(sessions || [])].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    for (const k of kpis) {
      const value = vbs[s.id]?.[k.id] ?? null
      const r = rc[`${s.id}|${k.id}`]
      rows.push({
        Date: s.date,
        Group: k.group,
        KPI: k.name,
        UoM: k.uom,
        Target: k.target,
        Value: value === null ? '' : Number(value),
        Status: statusFn(k, value).toUpperCase(),
        Owner: k.owner,
        Backup: k.backup,
        'Root cause category': r?.category || '',
        'Root cause': r?.description || '',
        Recurring: r?.recurring ? 'Yes' : '',
        'Session owner': s.owner || '',
      })
    }
  }
  return rows
}

export function actionRows(actions, today = new Date()) {
  const t = today.toISOString().slice(0, 10)
  return (actions || []).map((a) => {
    const closed = !!a.completed_at || ['done', 'closed', 'completed'].includes(String(a.status || '').toLowerCase())
    return {
      Action: a.description,
      'KPI reference': a.kpi_ref || '',
      Owner: a.owner || '',
      Priority: a.priority || '',
      Status: a.status || (closed ? 'done' : 'open'),
      Created: (a.created_at || '').slice(0, 10),
      Due: a.due_date || '',
      Completed: (a.completed_at || '').slice(0, 10),
      Overdue: !closed && a.due_date && a.due_date < t ? 'Yes' : '',
    }
  })
}

/** Builds a 4-sheet workbook and downloads it: Summary, KPI data, Actions, Root-cause Pareto. */
export async function exportWorkbook({ GROUPS, sessions, kpiValues, rootCauses, actions, buName = 'DDS' }, statusFn = getStatus) {
  const XLSX = await import('xlsx')
  const today = new Date()
  const summary = sessionTrend(GROUPS, sessions, kpiValues, 365, statusFn).map((r) => ({
    Date: r.date,
    'DDS compliance %': r.compliancePct,
    'On target %': r.onTargetPct,
    Red: r.red,
    Amber: r.amber,
    Green: r.green,
    'Not filled': r.empty,
  }))
  const pareto = rootCausePareto(rootCauses, sessions, 90, today).map((p) => ({
    Category: p.category, Count: p.count, '%': p.pct, 'Cumulative %': p.cumPct, Recurring: p.recurring, 'KPIs affected': p.kpiCount,
  }))
  const ageing = actionAgeing(actions, today)

  const wb = XLSX.utils.book_new()
  const add = (rows, name, widths) => {
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: 'No data' }])
    if (widths) ws['!cols'] = widths.map((w) => ({ wch: w }))
    if (rows.length) ws['!autofilter'] = { ref: ws['!ref'] }
    XLSX.utils.book_append_sheet(wb, ws, name)
  }
  add(summary, 'Summary', [12, 16, 12, 6, 7, 7, 10])
  add(kpiLongRows({ GROUPS, sessions, kpiValues, rootCauses }, statusFn), 'KPI data', [12, 22, 40, 8, 10, 10, 8, 18, 18, 18, 40, 9, 26])
  add(actionRows(actions, today), 'Actions', [50, 20, 18, 9, 10, 11, 11, 11, 8])
  add(pareto, 'Root-cause Pareto', [24, 8, 6, 13, 10, 13])
  add([
    { Metric: 'Open actions', Value: ageing.open },
    { Metric: 'Overdue actions', Value: ageing.overdue },
    ...Object.entries(ageing.buckets).map(([k, v]) => ({ Metric: `Open ${k}`, Value: v })),
    { Metric: 'Avg days to close', Value: ageing.avgDaysToClose ?? '' },
    { Metric: 'Closed on time %', Value: ageing.onTimeClosePct },
  ], 'Action ageing', [22, 10])

  const file = `${buName.replace(/[^\w-]+/g, '_')}_DDS_${today.toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, file)
  return file
}

/** Dependency-free fallback: one CSV file from an array of objects. */
export function exportCsv(rows, filename = 'dds_export.csv') {
  if (!rows?.length) return
  const cols = Object.keys(rows[0])
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Opens the browser print dialog; pepsico.css hides nav/buttons and prints A4 landscape. */
export function printBoard() {
  window.print()
}
