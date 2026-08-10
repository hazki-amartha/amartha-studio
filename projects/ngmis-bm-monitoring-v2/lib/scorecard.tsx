'use client'

// The branch scorecard, one Panel + table per section. One layout only: the
// section's rows down the side, the BPs across the top, and under each BP name
// the measures that section carries (Target / Completed, Target hari ini /
// Achievement hari ini, and so on). Shared by the Monitoring tab (read-only) and
// the briefing forms, which pass `comment` to add a "Komentar" row — one cell
// per BP, running the full width of that BP's block.

import type { ReactNode } from 'react'
import { Badge } from '@/design-system/components'
import { CheckCircleFill, CrossCircleFill, NotePencil } from '@/design-system/icons'
import { DataTable, Panel, PanelHeading, type Column, type ColumnGroup, type Row } from './ui'
import {
  BPS,
  SECTIONS,
  achievementPct,
  commentKey,
  isRupiah,
  rupiah,
  valueAt,
  type Bp,
  type Measure,
  type ScorecardSection,
  type SectionRow,
} from './data'

// Fixed column widths (frame geometry → inline, not spacing tokens).
const W_ROW_LABEL = 208 // the row-name column down the left
const W_COUNT = 132
const W_RUPIAH = 160

const measureWidth = (section: ScorecardSection, measure: Measure): number =>
  measure.kind === 'rupiah' || section.id === 'disbursement' ? W_RUPIAH : W_COUNT

/** The id a measure takes as a table column — one per BP, per measure. */
const cellId = (bp: Bp, measure: Measure): string => `${bp.id}:${measure.id}`

/** How the "Komentar" slot behaves: absent (Monitoring or a briefing that keeps
 *  its commentary in one dedicated section), an editable box (a live briefing),
 *  a CTA that opens the writing dialog, or seeded read-only text (a past one). */
export type CommentMode =
  | { kind: 'none' }
  | { kind: 'edit'; comments: Record<string, string>; onChange: (key: string, value: string) => void }
  | { kind: 'cta'; comments: Record<string, string>; onOpen: (key: string) => void }
  | { kind: 'read'; comments: Record<string, string> }

/** One figure. An achievement carries its percentage of target quietly beside it
 *  and lifts to orange when it falls short; an unsettled balance reads orange the
 *  moment it is above zero. A row that doesn't carry the measure reads "—". */
function ValueCell({
  section,
  row,
  bp,
  measure,
}: {
  section: ScorecardSection
  row: SectionRow
  bp: Bp
  measure: Measure
}) {
  const value = valueAt(section, row, bp.id, measure.id)
  if (value === null) return <span className="text-placeholder">—</span>

  const money = isRupiah(section, row, measure)
  const text = money ? rupiah(value) : String(value)

  if (measure.role === 'outstanding') {
    return <span className={value > 0 ? 'font-bold text-orange-500' : 'text-default'}>{text}</span>
  }
  if (measure.role !== 'achievement') return <span className="text-default">{text}</span>

  const target = valueAt(section, row, bp.id, 'target')
  const pct = achievementPct(section, row, bp.id, value)
  const short = target !== null && value < target
  return (
    <span className={short ? 'font-bold text-orange-500' : 'text-default'}>
      {text}
      {pct !== null ? <span className="font-regular text-caption"> ({pct}%)</span> : null}
    </span>
  )
}

/** The editable commentary box, filling whichever cell (or panel row) holds it. */
export function CommentInput({
  value,
  onChange,
  rows = 2,
}: {
  value: string
  onChange: (value: string) => void
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Tulis komentar…"
      rows={rows}
      className="w-full resize-none rounded-8 border border-default bg-neutral-white p-8 text-14 font-regular text-default placeholder:text-placeholder focus:border-primary-500 focus:outline-none"
    />
  )
}

/** The dialog entry point: an empty cell is a bare "Isi" CTA, a filled one shows
 *  the note back with the same control turned into "Ubah". Nothing is typed in
 *  the table itself — the writing happens in the dialog the CTA opens. */
function CommentCta({ text, onOpen }: { text: string | undefined; onOpen: () => void }) {
  return (
    <span className="flex flex-col items-start gap-4">
      {text ? <span className="block whitespace-normal text-14 text-default">{text}</span> : null}
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-4 text-14 font-bold text-link active:opacity-70"
      >
        <NotePencil size={16} /> {text ? 'Ubah' : 'Isi'}
      </button>
    </span>
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
  if (comment.kind === 'edit') {
    return <CommentInput value={comment.comments[key] ?? ''} onChange={(v) => comment.onChange(key, v)} />
  }
  if (comment.kind === 'cta') {
    return <CommentCta text={comment.comments[key]} onOpen={() => comment.onOpen(key)} />
  }
  return <CommentReadCell text={comment.comments[key]} />
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
    { id: 'row', header: '', width: W_ROW_LABEL },
    ...bps.flatMap((bp) =>
      section.measures.map((me) => ({
        id: cellId(bp, me),
        header: me.header,
        width: measureWidth(section, me),
      })),
    ),
  ]

  const groups: ColumnGroup[] = [
    { id: 'row', label: '', span: 1 },
    ...bps.map((bp) => ({ id: bp.id, label: bp.name, span: section.measures.length })),
  ]

  const rows: Row[] = section.rows.map((row) => {
    const cells: Record<string, ReactNode> = {
      row: (
        <span className="flex flex-col gap-2">
          <span className="font-bold text-default">{row.label}</span>
          {row.note ? <span className="text-12 font-regular text-caption">{row.note}</span> : null}
        </span>
      ),
    }
    for (const bp of bps) {
      for (const me of section.measures) {
        cells[cellId(bp, me)] = <ValueCell section={section} row={row} bp={bp} measure={me} />
      }
    }
    return { id: row.id, cells }
  })

  if (comment.kind !== 'none') {
    // One comment per BP, so the cell runs the whole width of that BP's block.
    const first = section.measures[0]
    const cells: Record<string, ReactNode> = {
      row: <span className="font-bold text-default">Komentar</span>,
    }
    const spans: Record<string, number> = {}
    for (const bp of bps) {
      cells[cellId(bp, first)] = commentCell(comment, section.id, bp.id)
      spans[cellId(bp, first)] = section.measures.length
    }
    rows.push({ id: 'comment', cells, spans })
  }

  return (
    <Panel>
      <PanelHeading title={section.title} />
      <DataTable
        columns={columns}
        groups={groups}
        rows={rows}
        sort={null}
        onSortChange={() => undefined}
      />
    </Panel>
  )
}

/** The sections in the reference's order. */
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
