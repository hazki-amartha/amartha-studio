'use client'

// The branch scorecard, transposed: one Panel + table per activity, with the
// BPs as ROWS and the activity's metrics as COLUMNS (the reference put BPs
// across the top). Shared by the Monitoring tab (read-only) and both briefing
// forms, which pass `comment` to grow a "Komentar" column onto every table —
// editable in a live briefing, read-only in a past one.
//
// Every table gives the BP / Target / Completed columns the SAME fixed widths,
// so those columns line up down the page across all four activities.

import type { ReactNode } from 'react'
import { Badge } from '@/design-system/components'
import { CheckCircleFill, CrossCircleFill } from '@/design-system/icons'
import { DataTable, Panel, PanelHeading, type Column } from './ui'
import {
  BPS,
  SECTIONS,
  commentKey,
  metricPct,
  metricText,
  type Bp,
  type Metric,
  type ScorecardColumn,
  type ScorecardSection,
} from './data'

// Fixed column widths (frame geometry → inline, not spacing tokens). The leading
// three are constant across every table so they align; the rest are by kind.
const W_BP = 190
const W_TARGET = 92
const W_COMPLETED = 168
const W_COUNT = 132
const W_RUPIAH = 148
const COMMENT_W = 240

const columnWidth = (col: ScorecardColumn): number => {
  // A money column is wide whatever its id — Cash Collection's "Target (Rp)" is
  // a rupiah amount, not the small integer the activity tables' Target holds.
  if (col.kind === 'rupiah') return W_RUPIAH
  if (col.id === 'target') return W_TARGET
  if (col.id === 'completed') return W_COMPLETED
  return W_COUNT
}

/** How the "Komentar" column behaves: absent (Monitoring), an editable box (a
 *  live briefing), or seeded read-only text (a past briefing). */
export type CommentMode =
  | { kind: 'none' }
  | { kind: 'edit'; comments: Record<string, string>; onChange: (key: string, value: string) => void }
  | { kind: 'read'; comments: Record<string, string> }

/** A count cell: the figure over its population, its percentage set quietly
 *  beside it. `tone` lifts the number where it carries a warning. */
function CountCell({ metric, tone }: { metric: Metric; tone?: string }) {
  const pct = metricPct(metric)
  return (
    <span className={tone ?? 'text-default'}>
      {metric.total === undefined ? metric.count : `${metric.count}/${metric.total}`}
      {pct !== null ? <span className="text-caption"> ({pct}%)</span> : null}
    </span>
  )
}

/** The signal colour a figure carries: a completed count short of target reads
 *  orange, a non-zero "didn't pay" reads red. Everything else stays neutral. */
function cellTone(
  column: ScorecardColumn,
  metric: Metric,
  row: Record<string, Metric>,
): string | undefined {
  if (column.id === 'completed') {
    const target = row.target?.count ?? metric.count
    if (metric.count < target) return 'text-orange-500 font-bold'
  }
  if (column.id === 'dpd0' && metric.count > 0) return 'text-red-500 font-bold'
  // Cash the BP has collected but not yet deposited — the BM's exposure.
  if (column.id === 'settled') {
    const collected = row.collected?.count ?? metric.count
    if (metric.count < collected) return 'text-orange-500 font-bold'
  }
  return undefined
}

function SectionTable({
  section,
  bps,
  comment,
}: {
  section: ScorecardSection
  bps: Bp[]
  comment: CommentMode
}) {
  const columns: Column[] = [
    { id: 'bp', header: 'Business Partner', width: W_BP },
    ...section.columns.map((c) => ({ id: c.id, header: c.header, width: columnWidth(c) })),
    ...(comment.kind === 'none' ? [] : [{ id: 'comment', header: 'Komentar', width: COMMENT_W } as Column]),
  ]

  const rows = bps.map((bp) => {
    const rowData = section.rows[bp.id]
    const cells: Record<string, ReactNode> = {
      bp: <span className="font-bold text-default">{bp.name}</span>,
    }
    for (const col of section.columns) {
      const metric = rowData[col.id]
      cells[col.id] =
        col.kind === 'rupiah' ? (
          <span className="text-default">{metricText(metric, 'rupiah')}</span>
        ) : (
          <CountCell metric={metric} tone={cellTone(col, metric, rowData)} />
        )
    }
    if (comment.kind !== 'none') {
      const key = commentKey(section.id, bp.id)
      cells.comment =
        comment.kind === 'edit' ? (
          <CommentInput
            value={comment.comments[key] ?? ''}
            onChange={(v) => comment.onChange(key, v)}
          />
        ) : (
          <span className="block whitespace-normal text-14 text-default">
            {comment.comments[key] ? comment.comments[key] : <span className="text-placeholder">—</span>}
          </span>
        )
    }
    return { id: bp.id, cells }
  })

  return (
    <Panel>
      <PanelHeading title={section.title} />
      <DataTable columns={columns} rows={rows} sort={null} onSortChange={() => undefined} />
    </Panel>
  )
}

/** The editable commentary box. Sized to a fixed column width so the table keeps
 *  its shape whether or not the BM has typed anything. */
function CommentInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Tulis komentar…"
      rows={2}
      className="w-full resize-none rounded-8 border border-default bg-neutral-white p-8 text-14 font-regular text-default placeholder:text-placeholder focus:border-primary-500 focus:outline-none"
    />
  )
}

/** The four activity tables in the reference's order. */
export function Scorecard({
  sections = SECTIONS,
  bps = BPS,
  comment = { kind: 'none' },
}: {
  sections?: ScorecardSection[]
  bps?: Bp[]
  comment?: CommentMode
}) {
  return (
    <div className="flex flex-col gap-16">
      {sections.map((section) => (
        <SectionTable key={section.id} section={section} bps={bps} comment={comment} />
      ))}
    </div>
  )
}

/** "Has closed the day?" — the reference's final row, per BP. A BP who hasn't
 *  closed is the one the BM chases at the evening briefing. */
export function ClosedDayPanel({ bps = BPS }: { bps?: Bp[] }) {
  return (
    <Panel>
      <PanelHeading title="Tutup hari" subtitle="Apakah BP sudah menutup hari di aplikasi lapangan?" />
      <div className="flex flex-col">
        {bps.map((bp, i) => (
          <div
            key={bp.id}
            className={`flex items-center justify-between gap-16 rounded-8 p-12 ${
              i % 2 === 1 ? 'bg-neutral-50' : 'bg-neutral-white'
            }`}
          >
            <span className="text-14 font-bold text-default">{bp.name}</span>
            {bp.closedDay ? (
              <Badge intent="green" variant="subtle" size="sm" leadingIcon={<CheckCircleFill size={16} />}>
                Sudah tutup
              </Badge>
            ) : (
              <Badge intent="red" variant="subtle" size="sm" leadingIcon={<CrossCircleFill size={16} />}>
                Belum tutup
              </Badge>
            )}
          </div>
        ))}
      </div>
    </Panel>
  )
}
