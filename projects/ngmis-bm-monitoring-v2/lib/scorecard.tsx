'use client'

// The branch scorecard, one Panel + table per activity. Two layouts, chosen by
// `orientation`:
//   - 'bp-rows'    — BPs down the side, the activity's metrics across the top
//                    (the default). The BP / Target / Completed columns take the
//                    same fixed widths in every table, so they line up.
//   - 'bp-columns' — the reference layout: metrics down the side, BPs across the
//                    top. Every table shares the same metric-label + BP columns,
//                    so the BP columns line up.
// Shared by the Monitoring tab (read-only) and both briefing forms, which pass
// `comment` to add a "Komentar" column (bp-rows) or "Komentar" row (bp-columns).

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
  type Orientation,
  type ScorecardColumn,
  type ScorecardSection,
} from './data'

// Fixed column widths (frame geometry → inline, not spacing tokens).
const W_BP = 190 // the BP name column, bp-rows
const W_TARGET = 92
const W_COMPLETED = 168
const W_COUNT = 132
const W_RUPIAH = 148
const COMMENT_W = 240
const W_METRIC_LABEL = 208 // the metric name column, bp-columns
const W_BP_COL = 150 // each BP's column, bp-columns

/** The toggle's two options, exported so every page labels the control the same. */
export const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: 'bp-rows', label: 'BP baris' },
  { value: 'bp-columns', label: 'BP kolom' },
]

const columnWidth = (col: ScorecardColumn): number => {
  // A money column is wide whatever its id — Cash Collection's "Target (Rp)" is
  // a rupiah amount, not the small integer the activity tables' Target holds.
  if (col.kind === 'rupiah') return W_RUPIAH
  if (col.id === 'target') return W_TARGET
  if (col.id === 'completed') return W_COMPLETED
  return W_COUNT
}

/** How the "Komentar" slot behaves: absent (Monitoring), an editable box (a live
 *  briefing), or seeded read-only text (a past briefing). */
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
 *  orange, a non-zero "didn't pay" reads red, cash held but not deposited
 *  reads orange. Everything else stays neutral. */
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

/** One figure, rendered for whichever axis it sits on. */
function ValueCell({ col, row }: { col: ScorecardColumn; row: Record<string, Metric> }) {
  const metric = row[col.id]
  return col.kind === 'rupiah' ? (
    <span className="text-default">{metricText(metric, 'rupiah')}</span>
  ) : (
    <CountCell metric={metric} tone={cellTone(col, metric, row)} />
  )
}

/** The editable commentary box, filling whichever cell holds it. */
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

function CommentReadCell({ text }: { text: string | undefined }) {
  return (
    <span className="block whitespace-normal text-14 text-default">
      {text ? text : <span className="text-placeholder">—</span>}
    </span>
  )
}

/** The commentary cell for a given section + BP, in whichever mode is active. */
function commentCell(comment: CommentMode, sectionId: string, bpId: string): ReactNode {
  if (comment.kind === 'none') return null
  const key = commentKey(sectionId, bpId)
  return comment.kind === 'edit' ? (
    <CommentInput value={comment.comments[key] ?? ''} onChange={(v) => comment.onChange(key, v)} />
  ) : (
    <CommentReadCell text={comment.comments[key]} />
  )
}

/** BP-rows: one row per BP, the activity's metrics across the top. */
function SectionTableRows({
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
      cells[col.id] = <ValueCell col={col} row={rowData} />
    }
    if (comment.kind !== 'none') cells.comment = commentCell(comment, section.id, bp.id)
    return { id: bp.id, cells }
  })

  return <SectionPanel title={section.title} columns={columns} rows={rows} />
}

/** BP-columns: one row per metric, the BPs across the top (reference layout). */
function SectionTableColumns({
  section,
  bps,
  comment,
}: {
  section: ScorecardSection
  bps: Bp[]
  comment: CommentMode
}) {
  const columns: Column[] = [
    { id: 'metric', header: 'Metric', width: W_METRIC_LABEL },
    ...bps.map((bp) => ({ id: bp.id, header: bp.name, width: W_BP_COL })),
  ]

  const rows = section.columns.map((col) => {
    const cells: Record<string, ReactNode> = {
      metric: <span className="font-bold text-default">{col.header}</span>,
    }
    for (const bp of bps) {
      cells[bp.id] = <ValueCell col={col} row={section.rows[bp.id]} />
    }
    return { id: col.id, cells }
  })

  if (comment.kind !== 'none') {
    const cells: Record<string, ReactNode> = {
      metric: <span className="font-bold text-default">Komentar</span>,
    }
    for (const bp of bps) cells[bp.id] = commentCell(comment, section.id, bp.id)
    rows.push({ id: 'comment', cells })
  }

  return <SectionPanel title={section.title} columns={columns} rows={rows} />
}

function SectionPanel({
  title,
  columns,
  rows,
}: {
  title: string
  columns: Column[]
  rows: { id: string; cells: Record<string, ReactNode> }[]
}) {
  return (
    <Panel>
      <PanelHeading title={title} />
      <DataTable columns={columns} rows={rows} sort={null} onSortChange={() => undefined} />
    </Panel>
  )
}

/** The activity tables in the reference's order, in the chosen orientation. */
export function Scorecard({
  sections = SECTIONS,
  bps = BPS,
  comment = { kind: 'none' },
  orientation = 'bp-rows',
}: {
  sections?: ScorecardSection[]
  bps?: Bp[]
  comment?: CommentMode
  orientation?: Orientation
}) {
  const SectionTable = orientation === 'bp-columns' ? SectionTableColumns : SectionTableRows
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
