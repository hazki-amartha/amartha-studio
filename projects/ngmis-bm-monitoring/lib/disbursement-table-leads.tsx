'use client'

// Pencairan — "With Leads monitoring".
//
// The same monthly Pencairan-per-BP table as `disbursement-table.tsx`, with
// differences the STATES panel switches between:
//
// - The three headline cards drop their rate: no %, no "Target: …" corner
//   label. This cut is read as plain counts and rupiah, not counts scored
//   against a target — the scoring lives in the other cut.
// - A new "Potential mitra" section, above the table and as its own column
//   group inside it, opens up the recruitment pipeline that ends at Mitra
//   baru's NoA: New mitra (Dengan KTP / Tanpa KTP), Follow up (Interested /
//   Tidak interested), UK (Draft / Submitted, menjalani uji kelayakan) and
//   Disetujui — so a BM can tell a KTP problem from an interest problem from
//   a paperwork problem, rather than one flat count that could be any of the
//   three. The KTP split is named for what it is rather than a
//   "qualified/unqualified" label that made a BM go look up what qualifies a
//   lead.
//
// Potential mitra is deliberately its own group, in both the panel above the
// table and the table's own header row — not folded into "Mitra baru" — so a
// BM never reads a lead count as if it were already a disbursed mitra. Mitra
// baru keeps meaning exactly what it always has: NoA and Pencairan.
//
// It's also collapsed by default, in both places at once, from one shared
// `potentialOpen` state lifted to `DisbursementTableLeads`: a BM opens
// Pencairan to check Total, Mitra baru and Mitra lanjutan first — Potential
// mitra is a leading indicator she reaches for, not something she reads
// every time. The table's own toggle is a gsheet-style column-group control:
// a slim gutter column between Total and Mitra baru holding just the
// chevron, no border or fill of its own — it inherits the header row's and
// each body row's background instead of standing out with a flat
// `neutral-50` fill, and it doesn't add a border-l beside the one Mitra baru
// (or Potential mitra, once open) already carries. Two things were tried and
// dropped first: a gutter with its own fill and border read as a stray lane
// splitting the table into two disconnected pieces; a chevron folded inline
// into Mitra baru's header text read cramped and wasn't obviously a control.
// A blended, borderless gutter is the version that reads as "part of the
// same table" while still landing exactly at the seam it opens.
//
// Potential mitra isn't just closed by default — it isn't rendered at all
// until asked for. The entry point is a ghost button in Mitra baru's own
// card ("Lihat potential mitra"), not a header bar that sits on the page
// whether or not anyone wants it; a BM who never opens it never sees a
// second panel competing with the three headline cards for attention. Once
// open, the panel is still visually bonded to the card that opened it: an
// accent line — the card's bottom edge, a short connector bar, the panel's
// top edge — runs from one into the other. It's deliberately an edge accent,
// not a full accent border around the card: a full border around only Mitra
// baru, beside two cards still in `border-default`, reads as "this one is
// selected" (the same grammar a filter chip uses), not "this one continues
// below". The edge-only version reads as a pipe instead of a highlight.
//
// Disetujui and NoA are kept as separate figures on purpose, even though
// they're close: an approved lead can still miss disbursing in the period it
// was approved in, so Disetujui can run ahead of NoA, and folding them
// together would hide that gap — the thing this cut exists to show.
//
// The table itself scrolls horizontally rather than squeezing its twelve
// columns to fit — see the comment at the table wrapper.
//
// Everything else — Total's columns, mitra lanjutan's %NoA and rate pill, the
// per-BP shortfall captions — is unchanged from the plain cut, so a BM
// switching between the two states is comparing the one thing that differs.

import { Fragment, useState } from 'react'
import { Button } from '@/design-system/components'
import { ChevronLeft, ChevronRight, DownloadSimple } from '@/design-system/icons'
import { BucketCard, Panel, RatePill } from './ui'
import {
  DISBURSEMENT_BPS,
  DISBURSEMENT_TARGETS,
  branchDisbursement,
  leadsFollowUp,
  leadsUk,
  meetsRenewal,
  nilaiShortfall,
  nilaiTotal,
  noaBaruShortfall,
  noaTotal,
  potentialMitraFunnel,
  potentialMitraTotal,
  renewalRate,
  renewalShortfall,
  rupiah,
  type DisbursementBp,
} from './data'

const rp = (jutaValue: number) => `Rp${rupiah(jutaValue * 1_000_000)}`
const pct = (v: number) => `${Math.round(v)}%`

/** Always on screen — Total, Mitra baru, Mitra lanjutan. */
const TOTAL_GROUP = {
  id: 'total',
  header: 'Total',
  target: `Target ${rp(DISBURSEMENT_TARGETS.nilai)} pencairan`,
  cols: ['NoA', 'Pencairan'],
} as const

const BARU_GROUP = {
  id: 'baru',
  header: 'Mitra baru',
  target: `Target ${DISBURSEMENT_TARGETS.noaBaru} NoA`,
  cols: ['NoA', 'Pencairan'],
} as const

const LANJUTAN_GROUP = {
  id: 'lanjutan',
  header: 'Mitra lanjutan',
  target: `Target ${DISBURSEMENT_TARGETS.renewalRate}% NoA`,
  cols: ['NoA', '%NoA', 'Pencairan'],
} as const

/** Hidden until `potentialOpen` — see the gutter toggle between Total and
 *  Mitra baru in `DisbursementTableLeads`. "With Leads monitoring" uses the
 *  flat version (5 cols, one count per stage); "Pencairan: NTB detail" swaps
 *  in the detailed one (7 cols) — New mitra by KTP status, Follow up by
 *  interest, UK by draft/submitted — so a BM can tell a KTP problem from an
 *  interest problem from a paperwork problem, rather than one flat count
 *  that could be any of the three. Picked by `potentialGroup(detailed)`. */
const POTENTIAL_GROUP_FLAT = {
  id: 'potential',
  header: 'Potential mitra',
  target: 'Menuju Mitra baru',
  cols: ['Tanpa KTP', 'Dengan KTP', 'Follow up', 'UK', 'Disetujui'],
} as const

const POTENTIAL_GROUP_DETAIL = {
  id: 'potential',
  header: 'Potential mitra',
  target: 'Menuju Mitra baru',
  cols: ['Dengan KTP', 'Tanpa KTP', 'Interested', 'Tidak interested', 'Draft', 'Submitted', 'Disetujui'],
} as const

/** The detailed cut's middle header tier — New mitra / Follow up / UK, each
 *  spanning the pair of leaf columns underneath it. Disetujui isn't listed
 *  here: it has no breakdown, so it's rendered directly with `rowSpan={2}`
 *  instead of getting a sub-group of its own. */
const POTENTIAL_SUBGROUPS = [
  { id: 'newMitra', label: 'New mitra', cols: ['Dengan KTP', 'Tanpa KTP'] },
  { id: 'followUp', label: 'Follow up', cols: ['Interested', 'Tidak interested'] },
  { id: 'uk', label: 'UK', cols: ['Draft', 'Submitted'] },
] as const

const potentialGroup = (detailed: boolean) => (detailed ? POTENTIAL_GROUP_DETAIL : POTENTIAL_GROUP_FLAT)

const GUTTER_COL_WIDTH = 48

/** Fixed per-column widths, so every sub-column lines up the same amount of
 *  space under its header regardless of how long the label is — without
 *  this, "UK" sizes its column to two characters while "Tanpa KTP" sizes
 *  its neighbour to nine, and the numbers underneath drift out of rhythm. */
const COL_WIDTH: Record<string, number> = {
  // Wide enough that its shortfall caption ("18 mitra lagi") sits on one
  // line rather than wrapping — a wrapped caption reads as two different
  // facts stacked, not one.
  NoA: 96,
  Pencairan: 116,
  'Tanpa KTP': 88,
  'Dengan KTP': 88,
  'Follow up': 84,
  UK: 72,
  Interested: 84,
  'Tidak interested': 100,
  Draft: 72,
  Submitted: 84,
  Disetujui: 88,
  '%NoA': 72,
}

const SHORT_CELL = 'px-4 pb-16 pt-4 text-center text-10 text-caption whitespace-nowrap'

/** The flat cut's five stages, one count each — "With Leads monitoring". */
const FUNNEL_STAGES_FLAT = [
  { id: 'unqualified', label: 'Tanpa KTP', hint: undefined },
  { id: 'qualified', label: 'Dengan KTP', hint: undefined },
  { id: 'followUp', label: 'Follow up', hint: undefined },
  { id: 'uk', label: 'UK', hint: 'Uji kelayakan' },
  { id: 'disetujui', label: 'Disetujui', hint: undefined },
] as const

/** `potentialMitraFunnel()` only stores the detailed halves (KTP status,
 *  interest, draft/submitted) — this collapses Follow up and UK back into
 *  one count each for the flat cut, so the two cuts share one source of
 *  truth rather than the flat one carrying its own separately-summed
 *  numbers that could drift from the detailed halves. */
function flatFunnelValues(funnel: ReturnType<typeof potentialMitraFunnel>) {
  return {
    unqualified: funnel.unqualified,
    qualified: funnel.qualified,
    followUp: funnel.followUpInterested + funnel.followUpNotInterested,
    uk: funnel.ukDraft + funnel.ukSubmitted,
    disetujui: funnel.disetujui,
  }
}

/** The detailed cut's three breakdown stages — New mitra, Follow up, UK —
 *  each a total plus the two counts it's made of. Disetujui and Dicairkan
 *  stay flat single-value boxes either way, rendered separately below. */
const FUNNEL_GROUPS = [
  {
    id: 'newMitra',
    label: 'New mitra',
    hint: undefined,
    parts: [
      { id: 'qualified', label: 'Dengan KTP' },
      { id: 'unqualified', label: 'Tanpa KTP' },
    ],
  },
  {
    id: 'followUp',
    label: 'Follow up',
    hint: undefined,
    parts: [
      { id: 'followUpInterested', label: 'Interested' },
      { id: 'followUpNotInterested', label: 'Tidak interested' },
    ],
  },
  {
    id: 'uk',
    label: 'UK',
    hint: 'Uji kelayakan',
    parts: [
      { id: 'ukDraft', label: 'Draft' },
      { id: 'ukSubmitted', label: 'Submitted' },
    ],
  },
] as const

function FunnelBox({
  label,
  value,
  hint,
  highlight,
  parts,
}: {
  label: string
  value: number
  hint?: string
  /** Marks the funnel's actual target — the disbursed NoA it all leads to. */
  highlight?: boolean
  /** The stage's own breakdown, printed under the total rather than beside
   *  it — New mitra's 62 means nothing on its own until it's split into how
   *  many have KTP and how many don't. */
  parts?: { label: string; value: number }[]
}) {
  return (
    <div
      className={`flex flex-1 flex-col gap-2 rounded-8 p-12 ${
        highlight ? 'border border-primary-500 bg-primary-50' : 'bg-neutral-50'
      }`}
    >
      <span className={`text-12 ${highlight ? 'font-bold text-primary-500' : 'text-caption'}`}>
        {label}
      </span>
      <span
        className={`text-20 font-bold ${highlight ? 'text-primary-500' : 'text-default'}`}
      >
        {value}
      </span>
      {hint ? <span className="text-10 text-caption">{hint}</span> : null}
      {parts ? (
        <div className="flex flex-col gap-1 pt-2">
          {parts.map((p) => (
            <span key={p.label} className="flex items-center justify-between gap-8 text-10 text-caption">
              <span>{p.label}</span>
              <span className="font-bold text-default">{p.value}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * The branch headline: same three buckets as the plain cut, minus the rate
 * badge and the "Target: …" corner label — this cut reads as counts and
 * rupiah on their own. Underneath, the recruitment pipeline that feeds Mitra
 * baru: New mitra, Follow up and UK each open onto their own breakdown, then
 * Disetujui, then an arrow into Dicairkan — the NoA count that is the actual
 * target, not just another funnel stage.
 *
 * Mitra baru's card and the panel are bridged by an accent line, not a
 * matching accent OUTLINE: a full border around Mitra baru's card, sitting
 * beside two cards in plain `border-default`, read as "this one is
 * selected" rather than "this one continues below" — the same visual
 * grammar a filter chip or a radio card uses. Instead, only the card's
 * bottom edge and the panel's top edge carry the accent, joined by a short
 * connector bar between them, so the colour reads as a pipe running from one
 * to the other rather than a highlight singling Mitra baru out from its
 * siblings. It's plain `neutral-400`, not the brand purple the funnel's
 * Dicairkan box uses — a connector is structural, not a highlight, so it
 * carries no colour meaning at all rather than a toned-down version of one.
 */
export function DisbursementMetricsLeads({
  open,
  onToggle,
  detailed = false,
}: {
  /** Shared with the table's own toggle gutter — one control, read in two
   *  places, rather than the panel and the table drifting out of sync. */
  open: boolean
  onToggle: (open: boolean) => void
  /** Swaps in the New mitra/Follow up/UK breakdown ("Pencairan: NTB
   *  detail") in place of the flat five-stage funnel ("With Leads
   *  monitoring"). */
  detailed?: boolean
}) {
  const branch = branchDisbursement()
  const nilai = DISBURSEMENT_BPS.reduce((n, bp) => n + nilaiTotal(bp), 0)
  const funnel = potentialMitraFunnel()
  const flat = flatFunnelValues(funnel)

  return (
    <div className="flex flex-col pb-16">
      <div className="grid grid-cols-3 gap-16">
        <BucketCard label="Pencairan" value={rp(nilai)} caption={`/${rp(DISBURSEMENT_TARGETS.nilai * DISBURSEMENT_BPS.length)}`} />
        <BucketCard
          label="Mitra baru"
          value={`${branch.baru}`}
          caption={`/${DISBURSEMENT_TARGETS.noaBaru * DISBURSEMENT_BPS.length}`}
          borderClassName={open ? 'border-default border-b-2 border-b-neutral-400' : undefined}
          footer={
            <Button variant="ghost" size="sm" onClick={() => onToggle(!open)}>
              {open ? 'Sembunyikan potential mitra' : 'Lihat potential mitra'}
            </Button>
          }
        />
        <BucketCard label="Mitra lanjutan" value={`${branch.lanjutan}`} caption={`/${branch.due}`} />
      </div>

      {open ? (
        <>
          <div className="grid grid-cols-3">
            <div />
            <div className="mx-auto bg-neutral-400" style={{ width: 2, height: 8 }} />
            <div />
          </div>

          <div className="rounded-12 border border-default border-t-2 border-t-neutral-400 bg-neutral-white p-16">
            <div className="flex flex-col gap-8">
              <span className="flex items-center justify-between gap-8">
                <span className="text-14 font-bold text-default">Potential mitra — menuju Mitra baru</span>
                <span className="text-12 text-caption">{potentialMitraTotal()} lead</span>
              </span>
              <span className="text-12 text-caption">Alur rekrutmen menuju Mitra baru.</span>
              <div className="flex items-stretch gap-8">
                {detailed ? (
                  <>
                    {FUNNEL_GROUPS.map((group) => (
                      <FunnelBox
                        key={group.id}
                        label={group.label}
                        hint={group.hint}
                        value={group.parts.reduce((n, p) => n + funnel[p.id], 0)}
                        parts={group.parts.map((p) => ({ label: p.label, value: funnel[p.id] }))}
                      />
                    ))}
                    <FunnelBox label="Disetujui" value={funnel.disetujui} />
                    <span className="flex items-center text-disabled">
                      <ChevronRight size={16} />
                    </span>
                    <FunnelBox label="Dicairkan" value={branch.baru} highlight />
                  </>
                ) : (
                  <>
                    {FUNNEL_STAGES_FLAT.map((stage) => (
                      <FunnelBox key={stage.id} label={stage.label} value={flat[stage.id]} hint={stage.hint} />
                    ))}
                    <span className="flex items-center text-disabled">
                      <ChevronRight size={16} />
                    </span>
                    <FunnelBox label="Disbursed" value={branch.baru} highlight />
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export function DisbursementHeadingLeads() {
  const [preparing, setPreparing] = useState(false)

  return (
    <div className="flex flex-wrap items-center justify-between gap-16 pb-12">
      <span className="text-16 font-bold text-default">Pencairan per Business Partner (BP)</span>
      <Button variant="outline" size="sm" onClick={() => setPreparing(true)}>
        <span className="flex items-center gap-8">
          <DownloadSimple size={16} />
          {preparing ? 'Sedang disiapkan' : 'Download'}
        </span>
      </Button>
    </div>
  )
}

export function DisbursementTableLeads({ detailed = false }: { detailed?: boolean }) {
  // Closed by default — a BM checks Total, Mitra baru and Mitra lanjutan
  // first, and reaches for Potential mitra as a second question rather than
  // reading it every time. One state drives both the summary panel above and
  // the table's own toggle, so they can't drift out of sync.
  const [potentialOpen, setPotentialOpen] = useState(false)
  // The gutter sits between Total and Mitra baru — where Potential mitra
  // expands into — on both the header and the body, so `restGroups`
  // (everything after Total) is what actually renders around it in each.
  const restGroups = potentialOpen
    ? [potentialGroup(detailed), BARU_GROUP, LANJUTAN_GROUP]
    : [BARU_GROUP, LANJUTAN_GROUP]
  // The detailed cut's Potential mitra group gets a third header tier — New
  // mitra / Follow up / UK, each spanning its own pair of leaf columns —
  // rather than presenting all seven leaf columns flat, the way the panel
  // above already groups them into boxes. Every other group's header cells
  // grow a `rowSpan` to span past this extra row instead of repeating
  // themselves in it.
  const showSubgroups = detailed && potentialOpen
  const groups = [TOTAL_GROUP, ...restGroups]
  const colspan = 2 + groups.reduce((n, g) => n + g.cols.length, 0)

  return (
    <>
      <DisbursementMetricsLeads open={potentialOpen} onToggle={setPotentialOpen} detailed={detailed} />
      <DisbursementHeadingLeads />

      <Panel className="p-0">
        {/* Scrolls horizontally rather than squeezing its columns to fit — a
            BM can still read a value without it wrapping or truncating.
            `min-w-0` on the wrapper is what lets the table overflow it
            instead of stretching the wrapper along with it. */}
        <div className="min-w-0 overflow-x-auto">
          <table
            className="border-collapse text-left"
            style={{ width: '100%', minWidth: potentialOpen ? 1200 : 940 }}
          >
            <colgroup>
              <col style={{ width: 150 }} />
              {TOTAL_GROUP.cols.map((label) => (
                <col key={`total-${label}`} style={{ width: COL_WIDTH[label] ?? 90 }} />
              ))}
              <col style={{ width: GUTTER_COL_WIDTH }} />
              {restGroups.flatMap((group) =>
                group.cols.map((label) => (
                  <col key={`${group.id}-${label}`} style={{ width: COL_WIDTH[label] ?? 90 }} />
                )),
              )}
            </colgroup>
            <thead>
              <tr className="bg-neutral-200">
                <th
                  rowSpan={showSubgroups ? 3 : 2}
                  className="px-16 pb-12 pt-16 text-12 font-bold text-default"
                  style={{ width: 150 }}
                >
                  Nama
                </th>
                <th
                  colSpan={TOTAL_GROUP.cols.length}
                  className="border-l border-default px-16 pb-8 pt-16 text-center text-12 font-bold text-default"
                >
                  <span className="flex flex-col gap-2">
                    {TOTAL_GROUP.header}
                    <span className="text-12 font-regular text-caption">{TOTAL_GROUP.target}</span>
                  </span>
                </th>
                {/* The gsheet-style entry point: the cell itself carries no
                    border or fill of its own, so the column reads as a seam
                    in the same table rather than a lane running down it — it
                    inherits this row's `bg-neutral-200` same as every other
                    header cell here. The handle inside is what's visible:
                    gsheet's own column-group control, copied — a tinted
                    pill straddling the seam with both directions in it, a
                    hairline divider down the middle, rather than a single
                    bare chevron with nothing to say "grab me". */}
                <th rowSpan={showSubgroups ? 3 : 2} className="p-0">
                  {/* Grey and white, not the brand purple — this is a
                      structural control, not a highlight, same reasoning as
                      the connector line below it. Positioned absolutely so
                      its own centre divider sits exactly on the real column
                      border (the gutter's right edge, where the next
                      group's `border-l` already is) regardless of how wide
                      the gutter itself is — a centred flex would put the
                      divider in the middle of the gutter instead, off the
                      actual grid line. */}
                  <div className="relative h-full">
                    <button
                      type="button"
                      onClick={() => setPotentialOpen(!potentialOpen)}
                      aria-expanded={potentialOpen}
                      aria-label={
                        potentialOpen ? 'Sembunyikan Potential mitra' : 'Tampilkan Potential mitra'
                      }
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '100%',
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="flex h-24 items-stretch overflow-hidden rounded-8 border border-default bg-neutral-white text-caption hover:text-default"
                    >
                      {/* Closed points outward (‹ ›) — expand out from the
                          line. Open reverses to point inward (› ‹) — collapse
                          back into it. Same pill, same position on the line
                          either way; only the arrows flip. */}
                      <span className="flex w-20 items-center justify-center">
                        {potentialOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                      </span>
                      <span className="w-px bg-neutral-200" />
                      <span className="flex w-20 items-center justify-center">
                        {potentialOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </button>
                  </div>
                </th>
                {restGroups.map((group) => (
                  <th
                    key={group.id}
                    colSpan={group.cols.length}
                    className="border-l border-default px-16 pb-8 pt-16 text-center text-12 font-bold text-default"
                  >
                    <span className="flex flex-col gap-2">
                      {group.header}
                      <span className="text-12 font-regular text-caption">{group.target}</span>
                    </span>
                  </th>
                ))}
              </tr>
              <tr className="bg-neutral-200">
                {TOTAL_GROUP.cols.map((label, i) => (
                  <th
                    key={label}
                    rowSpan={showSubgroups ? 2 : 1}
                    className={`px-12 pb-12 text-center text-12 font-regular text-caption ${
                      i === 0 ? 'border-l border-default' : ''
                    }`}
                  >
                    {label}
                  </th>
                ))}
                {restGroups.map((group) => {
                  // Only Potential mitra's detailed cut gets a middle tier —
                  // New mitra / Follow up / UK, each spanning its own pair of
                  // leaf columns below, plus Disetujui rowSpanning straight
                  // through since it has no breakdown to group. Every other
                  // group's leaf labels move here too, with rowSpan={2}, so
                  // they don't have to repeat themselves in the row below.
                  if (showSubgroups && group.id === 'potential') {
                    return (
                      <Fragment key={group.id}>
                        {POTENTIAL_SUBGROUPS.map((sub, i) => (
                          <th
                            key={sub.id}
                            colSpan={sub.cols.length}
                            className={`px-12 pb-8 text-center text-12 font-bold text-default ${
                              i === 0 ? 'border-l border-default' : ''
                            }`}
                          >
                            {sub.label}
                          </th>
                        ))}
                        <th rowSpan={2} className="px-12 pb-12 text-center text-12 font-regular text-caption">
                          Disetujui
                        </th>
                      </Fragment>
                    )
                  }
                  return (
                    <Fragment key={group.id}>
                      {group.cols.map((label, i) => (
                        <th
                          key={label}
                          rowSpan={showSubgroups ? 2 : 1}
                          className={`px-12 pb-12 text-center text-12 font-regular text-caption ${
                            i === 0 ? 'border-l border-default' : ''
                          }`}
                        >
                          {label}
                        </th>
                      ))}
                    </Fragment>
                  )
                })}
              </tr>
              {showSubgroups ? (
                <tr className="bg-neutral-200">
                  {POTENTIAL_SUBGROUPS.flatMap((sub, si) =>
                    sub.cols.map((label, i) => (
                      <th
                        key={label}
                        className={`px-12 pb-12 text-center text-12 font-regular text-caption ${
                          si === 0 && i === 0 ? 'border-l border-default' : ''
                        }`}
                      >
                        {label}
                      </th>
                    )),
                  )}
                </tr>
              ) : null}
            </thead>
            <tbody>
              {DISBURSEMENT_BPS.length === 0 ? (
                <tr>
                  <td colSpan={colspan} className="px-16 py-24 text-center text-12 text-caption">
                    Belum ada pencairan pada periode ini.
                  </td>
                </tr>
              ) : null}
              {DISBURSEMENT_BPS.map((bp, i) => (
                <BpRow
                  key={bp.id}
                  bp={bp}
                  zebra={i % 2 === 1}
                  potentialOpen={potentialOpen}
                  detailed={detailed}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}

function BpRow({
  bp,
  zebra,
  potentialOpen,
  detailed,
}: {
  bp: DisbursementBp
  zebra: boolean
  potentialOpen: boolean
  detailed: boolean
}) {
  const stripe = zebra ? 'bg-neutral-50' : 'bg-neutral-white'
  const noaShort = noaBaruShortfall(bp)
  const lanjutanShort = renewalShortfall(bp)
  const nilaiShort = nilaiShortfall(bp)

  return (
    <Fragment>
      <tr className={`align-middle ${stripe}`}>
        <td rowSpan={2} className="px-16 py-12 text-14 text-default">
          {bp.name}
        </td>

        {/* Total: unchanged from the plain cut. */}
        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {noaTotal(bp)}
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{rp(nilaiTotal(bp))}</td>

        {/* The gutter's body cell — no border or fill of its own, same as
            its header, so it blends into this row's stripe instead of
            reading as a separate lane. */}
        <td />

        {/* Potential mitra: its own group, not folded into Mitra baru — a
            lead is not yet a mitra. Hidden until the gutter's toggle opens
            it, same as the panel above the table. */}
        {potentialOpen ? (
          detailed ? (
            <>
              <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
                {bp.leadsQualified}
              </td>
              <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsUnqualified}</td>
              <td className="px-12 pt-16 text-center text-14 text-default">
                {bp.leadsFollowUpInterested}
              </td>
              <td className="px-12 pt-16 text-center text-14 text-default">
                {bp.leadsFollowUpNotInterested}
              </td>
              <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsUkDraft}</td>
              <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsUkSubmitted}</td>
              <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsDisetujui}</td>
            </>
          ) : (
            <>
              <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
                {bp.leadsUnqualified}
              </td>
              <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsQualified}</td>
              <td className="px-12 pt-16 text-center text-14 text-default">{leadsFollowUp(bp)}</td>
              <td className="px-12 pt-16 text-center text-14 text-default">{leadsUk(bp)}</td>
              <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsDisetujui}</td>
            </>
          )
        ) : null}

        {/* Mitra baru: plain NoA/Pencairan, the same as the default cut — the
            funnel that feeds it is told beside it, not inside it. */}
        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {bp.noaBaru}
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{rp(bp.nilaiBaru)}</td>

        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {bp.noaLanjutan}
        </td>
        <td className="px-12 pt-16 text-center">
          <RatePill ok={meetsRenewal(bp)}>{pct(renewalRate(bp))}</RatePill>
        </td>
        <td className="px-12 pt-16 text-center text-14 text-default">{rp(bp.nilaiLanjutan)}</td>
      </tr>

      <tr className={`border-b border-default align-top ${stripe}`}>
        <td className="border-l border-default px-12 pb-16 pt-4" />
        <td className={SHORT_CELL}>{nilaiShort ? `${rp(nilaiShort)} lagi` : null}</td>

        <td />

        {/* Potential mitra carries no shortfall of its own — it's a leading
            indicator, not something with a monthly pass/fail line. One blank
            cell per column in `potentialGroup(detailed).cols` — five for the
            flat cut, seven for the detailed one. */}
        {potentialOpen
          ? potentialGroup(detailed).cols.map((label, i) => (
              <td
                key={label}
                className={`px-12 pb-16 pt-4 ${i === 0 ? 'border-l border-default' : ''}`}
              />
            ))
          : null}

        {/* The shortfall is about clearing the month's mitra baru NoA target,
            so it sits under Mitra baru's own NoA. */}
        <td className={`border-l border-default ${SHORT_CELL}`}>
          {noaShort ? `${noaShort} mitra lagi` : null}
        </td>
        <td className="px-12 pb-16 pt-4" />

        <td className={`border-l border-default ${SHORT_CELL}`}>
          {lanjutanShort ? `${lanjutanShort} mitra lagi` : null}
        </td>
        <td className="px-12 pb-16 pt-4" />
        <td className="px-12 pb-16 pt-4" />
      </tr>
    </Fragment>
  )
}
