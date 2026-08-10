'use client'

// The branch scorecard: one Panel + matrix per subject. BPs run across the top,
// each spanning its subject's paired measures (Target/Completed, Aktif/Terbayar,
// Collected/Settled); the metrics run down the side. A two-level header carries
// the BP name over its measure pair. Shared by the Monitoring tab (read-only)
// and both briefing forms, which pass `comment` to add a "Komentar" row.

import type { ReactNode } from 'react'
import { Badge } from '@/design-system/components'
import { CheckCircleFill, CrossCircleFill, NotePencil } from '@/design-system/icons'
import { Panel, PanelHeading } from './ui'
import {
  BPS,
  SECTIONS,
  commentKey,
  pctText,
  rupiah,
  type Bp,
  type CellKind,
  type MatrixRow,
  type MatrixSection,
} from './data'

// Fixed widths (frame geometry → inline, not spacing tokens). One measure width
// for EVERY subject — so each BP's column sits at the same x in all four tables
// and the eye can skim a BP straight down the page. 132 fits the widest cell
// (a rupiah amount over a "Sisa …" line).
const W_LABEL = 220
const MEASURE_W = 132

/** How the "Komentar" row behaves: absent (Monitoring), an editable box (a live
 *  briefing), or seeded read-only text (a past briefing). */
export type CommentMode =
  | { kind: 'none' }
  | { kind: 'edit'; comments: Record<string, string>; onChange: (key: string, value: string) => void }
  | { kind: 'read'; comments: Record<string, string> }
  | { kind: 'cta'; comments: Record<string, string>; onOpen: (sectionId: string, bpId: string) => void }

const fmtMain = (value: number, kind: CellKind): string =>
  kind === 'rupiah' ? rupiah(value) : String(value)

/** The secondary line under a row's SECOND measure: a percentage of the first
 *  (Terbayar of Aktif) or the remainder still held (Collected less Settled). */
function noteText(row: MatrixRow, first: number, second: number): string | null {
  if (row.note === 'pct') return `(${pctText(second, first)})`
  if (row.note === 'sisa') return `Sisa ${rupiah(first - second)}`
  return null
}

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

function commentCell(comment: CommentMode, sectionId: string, bpId: string): ReactNode {
  if (comment.kind === 'none') return null
  const key = commentKey(sectionId, bpId)
  const value = comment.comments[key]
  if (comment.kind === 'edit') {
    return <CommentInput value={value ?? ''} onChange={(v) => comment.onChange(key, v)} />
  }
  if (comment.kind === 'cta') {
    return (
      <div className="flex flex-col items-start gap-4">
        {value ? <span className="block whitespace-normal text-14 text-default">{value}</span> : null}
        <button
          type="button"
          onClick={() => comment.onOpen(sectionId, bpId)}
          className="flex items-center gap-4 text-14 font-bold text-link active:opacity-70"
        >
          <NotePencil size={16} /> {value ? 'Ubah' : 'Isi'}
        </button>
      </div>
    )
  }
  return (
    <span className="block whitespace-normal text-14 text-default">
      {value ? value : <span className="text-placeholder">—</span>}
    </span>
  )
}

function SectionMatrix({
  section,
  bps,
  comment,
}: {
  section: MatrixSection
  bps: Bp[]
  comment: CommentMode
}) {
  const { measures } = section
  const mw = MEASURE_W
  const totalWidth = W_LABEL + bps.length * measures.length * mw

  return (
    <Panel>
      <PanelHeading title={section.title} />
      <div className="overflow-x-auto">
        <table className="table-fixed border-collapse text-left" style={{ width: totalWidth }}>
          <colgroup>
            <col style={{ width: W_LABEL }} />
            {bps.flatMap((bp) =>
              measures.map((mm) => <col key={`${bp.id}-${mm.id}`} style={{ width: mw }} />),
            )}
          </colgroup>
          <thead>
            <tr className="bg-neutral-50">
              <th rowSpan={2} className="rounded-l-8 px-12 py-8 text-left align-bottom text-12 font-bold text-default" />
              {bps.map((bp, i) => (
                <th
                  key={bp.id}
                  colSpan={measures.length}
                  className={`border-l border-default px-12 py-8 text-12 font-bold text-default ${
                    i === bps.length - 1 ? 'rounded-tr-8' : ''
                  }`}
                >
                  {bp.name}
                </th>
              ))}
            </tr>
            <tr className="bg-neutral-50">
              {bps.flatMap((bp) =>
                measures.map((mm, j) => (
                  <th
                    key={`${bp.id}-${mm.id}`}
                    className={`px-12 py-8 text-12 font-regular text-caption ${
                      j === 0 ? 'border-l border-default' : ''
                    }`}
                  >
                    {mm.label}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, ri) => (
              <tr
                key={row.id}
                className={`border-b border-default align-top ${
                  ri % 2 === 1 ? 'bg-neutral-50' : 'bg-neutral-white'
                }`}
              >
                <td className="px-12 py-8 text-14 font-bold text-default">{row.label}</td>
                {bps.flatMap((bp) => {
                  const cells = section.values[bp.id][row.id]
                  const first = cells[measures[0].id]
                  const second = cells[measures[1].id]
                  return measures.map((mm, j) => {
                    const isSecond = j === 1
                    const short = section.shortfallTone && isSecond && second < first
                    const note = isSecond ? noteText(row, first, second) : null
                    return (
                      <td
                        key={`${bp.id}-${mm.id}`}
                        className={`px-12 py-8 text-14 ${j === 0 ? 'border-l border-default' : ''}`}
                      >
                        <span className={`block ${short ? 'font-bold text-red-500' : 'text-default'}`}>
                          {fmtMain(cells[mm.id], row.kind)}
                        </span>
                        {note ? <span className="block text-12 text-caption">{note}</span> : null}
                      </td>
                    )
                  })
                })}
              </tr>
            ))}
            {comment.kind !== 'none' ? (
              <tr className="border-b border-default bg-neutral-white align-top">
                <td className="px-12 py-8 text-14 font-bold text-default">Komentar</td>
                {bps.map((bp) => (
                  <td
                    key={bp.id}
                    colSpan={measures.length}
                    className="border-l border-default px-12 py-8"
                  >
                    {commentCell(comment, section.id, bp.id)}
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

/** The subject matrices in the reference's order. */
export function Scorecard({
  sections = SECTIONS,
  bps = BPS,
  comment = { kind: 'none' },
}: {
  sections?: MatrixSection[]
  bps?: Bp[]
  comment?: CommentMode
}) {
  return (
    <div className="flex flex-col gap-16">
      {sections.map((section) => (
        <SectionMatrix key={section.id} section={section} bps={bps} comment={comment} />
      ))}
    </div>
  )
}

/** "Has closed the day?" — per BP. A BP who hasn't closed is the one the BM
 *  chases at the evening briefing. */
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
