'use client'

// Pencairan — "With Leads monitoring", Option B.
//
// A second take on Patricia's leads cut (`disbursement-table-leads.tsx`, which
// stays as Option A). The branch funnel panel and its ghost button are gone;
// the funnel is read in the table at both levels:
//
// - A permanent `Lead` column between Total and Mitra baru carries each BP's
//   lead total, and its label is the control — a chevron opens the five
//   stages beside it and folds them back.
// - A `Total cabang` row pinned at the top of the body carries the branch's
//   own figures in every column, so a BP is compared to the branch by looking
//   straight up the column.
// - Every group header is one line; targets stay on the headline cards and in
//   the per-BP shortfall captions.
// - The table is `table-layout: fixed` with pinned column widths, so opening
//   the stages widens the table rather than re-solving columns a BM is
//   mid-way through reading.

import { Fragment, useState } from 'react'
import { Button } from '@/design-system/components'
import { ChevronLeft, ChevronRight, DownloadSimple } from '@/design-system/icons'
import { BucketCard, Panel, RatePill } from './ui'
import {
  DISBURSEMENT_BPS,
  DISBURSEMENT_TARGETS,
  branchDisbursement,
  meetsRenewal,
  leadsTotal,
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
  cols: ['NoA', 'Pencairan'],
} as const

const BARU_GROUP = {
  id: 'baru',
  header: 'Mitra baru',
  cols: ['NoA', 'Pencairan'],
} as const

const LANJUTAN_GROUP = {
  id: 'lanjutan',
  header: 'Mitra lanjutan',
  cols: ['NoA', '%NoA', 'Pencairan'],
} as const

/** Always on screen as a single Lead total; the five stages behind it open
 *  from the gutter toggle between this group and Mitra baru (see
 *  `DisbursementTableLeads`). */
const POTENTIAL_STAGE_COLS = ['Tanpa KTP', 'Dengan KTP', 'Follow up', 'UK', 'Disetujui'] as const

const potentialGroup = (open: boolean) =>
  ({
    id: 'potential',
    header: 'Leads',
    cols: open ? ['Total', ...POTENTIAL_STAGE_COLS] : ['Total'],
  }) as const

/** Fixed per-column widths, so every sub-column lines up the same amount of
 *  space under its header regardless of how long the label is — without
 *  this, "UK" sizes its column to two characters while "Tanpa KTP" sizes
 *  its neighbour to nine, and the numbers underneath drift out of rhythm. */
const COL_WIDTH: Record<string, number> = {
  NoA: 110,
  // Wide enough for the branch line's own figure — "Rp1.270.000.000" in bold,
  // the longest string the column ever holds. Under `table-layout: fixed`
  // nothing widens to fit, so the widest value has to be the width.
  Pencairan: 200,
  // Leads' permanent total, which also carries the disclosure — the label
  // plus its chevron.
  Total: 120,
  'Tanpa KTP': 100,
  'Dengan KTP': 100,
  'Follow up': 100,
  UK: 80,
  Disetujui: 100,
  '%NoA': 90,
}

/** The branch line's own label — the scope the page is filtered to. */
const BRANCH_ROW_LABEL = 'Total cabang'

/** Every column, Nama included, is a fixed width; the slack goes to an empty
 *  spacer column at the far right instead. That is what makes opening the
 *  stages widen the TABLE rather than re-solve the columns already on screen
 *  — a figure never moves under the reader mid-comparison. Letting Nama
 *  absorb the slack was tried first and is exactly the bug: Nama then shrank
 *  the moment the table outgrew the window. */
const NAME_COL_WIDTH = 260

/** One line box for every header cell, both rows, in every state — so the
 *  chevron beside Total can't make its row taller than its neighbours. */
const HEAD_LINE = 'flex h-20 items-center justify-center whitespace-nowrap'

const SHORT_CELL = 'px-4 pb-16 pt-4 text-center text-10 text-caption whitespace-nowrap'

/**
 * The branch headline: the same three buckets as the plain cut, minus the
 * rate badge and the "Target: …" corner label — this cut reads as counts and
 * rupiah on their own.
 *
 * The branch's lead funnel used to hang off this panel, behind a ghost button
 * in Mitra baru's card and bonded to it with an accent line. It is gone: the
 * funnel now lives in the table, and the branch's own figures are the summary
 * row pinned at the top of it — one place the funnel is read, at both levels,
 * instead of the same numbers drawn twice in two different shapes.
 */
export function DisbursementMetricsLeadsB() {
  const branch = branchDisbursement()
  const nilai = DISBURSEMENT_BPS.reduce((n, bp) => n + nilaiTotal(bp), 0)

  return (
    <div className="grid grid-cols-3 gap-16 pb-16">
      <BucketCard
        label="Pencairan"
        value={rp(nilai)}
        caption={`/${rp(DISBURSEMENT_TARGETS.nilai * DISBURSEMENT_BPS.length)}`}
      />
      <BucketCard
        label="Mitra baru"
        value={`${branch.baru}`}
        caption={`/${DISBURSEMENT_TARGETS.noaBaru * DISBURSEMENT_BPS.length}`}
      />
      <BucketCard label="Mitra lanjutan" value={`${branch.lanjutan}`} caption={`/${branch.due}`} />
    </div>
  )
}

export function DisbursementHeadingLeadsB() {
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

export function DisbursementTableLeadsB() {
  // Closed by default — a BM checks Total, Mitra baru and Mitra lanjutan
  // first, and reaches for Potential mitra as a second question rather than
  // reading it every time. One state drives both the summary panel above and
  // the table's own toggle, so they can't drift out of sync.
  const [potentialOpen, setPotentialOpen] = useState(false)
  // The gutter sits on the seam the stages open at — between Potential
  // mitra's lead total and Mitra baru — so `leftGroups` renders before it and
  // `restGroups` after it, in both the header and every body row.
  const leftGroups = [TOTAL_GROUP, potentialGroup(potentialOpen)]
  const restGroups = [BARU_GROUP, LANJUTAN_GROUP]
  const groups = [...leftGroups, ...restGroups]
  const colspan = 2 + groups.reduce((n, g) => n + g.cols.length, 0)
  const dataWidth = groups.reduce(
    (n, g) => n + g.cols.reduce((m, label) => m + (COL_WIDTH[label] ?? 90), 0),
    0,
  )

  return (
    <>
      <DisbursementMetricsLeadsB />
      <DisbursementHeadingLeadsB />

      <Panel className="p-0">
        {/* Scrolls horizontally rather than squeezing its columns to fit — a
            BM can still read a value without it wrapping or truncating.
            `min-w-0` on the wrapper is what lets the table overflow it
            instead of stretching the wrapper along with it. */}
        <div className="min-w-0 overflow-x-auto">
          <table
            className="border-collapse text-left"
            // `table-layout: fixed` is what holds COL_WIDTH exactly: with the
            // browser's own sizing, the five stage columns opening would
            // re-solve every other column too. Nama carries no width, so it
            // absorbs whatever slack the window has and is the only thing
            // that moves.
            style={{ tableLayout: 'fixed', width: '100%', minWidth: NAME_COL_WIDTH + dataWidth }}
          >
            <colgroup>
              <col style={{ width: NAME_COL_WIDTH }} />
              {leftGroups.flatMap((group) =>
                group.cols.map((label) => (
                  <col key={`${group.id}-${label}`} style={{ width: COL_WIDTH[label] ?? 90 }} />
                )),
              )}
              {restGroups.flatMap((group) =>
                group.cols.map((label) => (
                  <col key={`${group.id}-${label}`} style={{ width: COL_WIDTH[label] ?? 90 }} />
                )),
              )}
              {/* The slack column — no header, no data, no border; it exists
                  so every real column can keep its own width at any window
                  size. */}
              <col />
            </colgroup>
            <thead>
              <tr className="bg-neutral-200">
                <th rowSpan={2} className="px-16 pb-12 pt-16 text-12 font-bold text-default">
                  Nama
                </th>
                {leftGroups.map((group) => (
                  <th
                    key={group.id}
                    colSpan={group.cols.length}
                    className="border-l border-default px-16 pb-8 pt-16 text-center text-12 font-bold text-default"
                  >
                    <span className={HEAD_LINE}>{group.header}</span>
                  </th>
                ))}
                {restGroups.map((group) => (
                  <th
                    key={group.id}
                    colSpan={group.cols.length}
                    className="border-l border-default px-16 pb-8 pt-16 text-center text-12 font-bold text-default"
                  >
                    <span className={HEAD_LINE}>{group.header}</span>
                  </th>
                ))}
                <th rowSpan={2} />
              </tr>
              <tr className="bg-neutral-200">
                {leftGroups.map((group) => (
                  <Fragment key={group.id}>
                    {group.cols.map((label, i) => (
                      <th
                        key={label}
                        className={`px-12 pb-12 text-center text-12 font-regular text-caption ${
                          i === 0 ? 'border-l border-default' : ''
                        }`}
                      >
                        {/* The column label IS the control — the lead total
                            is the collapsed reading of the five stages, so
                            the thing that opens them belongs on it rather
                            than on a separate handle floating in a gutter of
                            its own. The chevron points the way the columns
                            travel: right to open them out, left to fold them
                            back in. */}
                        {label === 'Total' ? (
                          <button
                            type="button"
                            onClick={() => setPotentialOpen(!potentialOpen)}
                            aria-expanded={potentialOpen}
                            className={`mx-auto gap-2 text-12 font-bold text-primary-500 hover:text-primary-600 ${HEAD_LINE}`}
                          >
                            {label}
                            {potentialOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                          </button>
                        ) : (
                          <span className={HEAD_LINE}>{label}</span>
                        )}
                      </th>
                    ))}
                  </Fragment>
                ))}
                {restGroups.map((group) => (
                  <Fragment key={group.id}>
                    {group.cols.map((label, i) => (
                      <th
                        key={label}
                        className={`px-12 pb-12 text-center text-12 font-regular text-caption ${
                          i === 0 ? 'border-l border-default' : ''
                        }`}
                      >
                        <span className={HEAD_LINE}>{label}</span>
                      </th>
                    ))}
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              <BranchRow potentialOpen={potentialOpen} />
              {DISBURSEMENT_BPS.length === 0 ? (
                <tr>
                  <td colSpan={colspan} className="px-16 py-24 text-center text-12 text-caption">
                    Belum ada pencairan pada periode ini.
                  </td>
                </tr>
              ) : null}
              {DISBURSEMENT_BPS.map((bp, i) => (
                <BpRow key={bp.id} bp={bp} zebra={i % 2 === 1} potentialOpen={potentialOpen} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}

/**
 * The branch's own line, pinned above the BPs — where the funnel panel's
 * figures went when it came out. It is the same columns, read one level up,
 * so a BM compares a BP against the branch by looking straight up the column
 * rather than back at a panel in a different shape.
 */
function BranchRow({ potentialOpen }: { potentialOpen: boolean }) {
  const branch = branchDisbursement()
  const funnel = potentialMitraFunnel()
  const nilai = DISBURSEMENT_BPS.reduce((n, bp) => n + nilaiTotal(bp), 0)
  const noa = DISBURSEMENT_BPS.reduce((n, bp) => n + noaTotal(bp), 0)
  const nilaiBaru = DISBURSEMENT_BPS.reduce((n, bp) => n + bp.nilaiBaru, 0)
  const nilaiLanjutan = DISBURSEMENT_BPS.reduce((n, bp) => n + bp.nilaiLanjutan, 0)
  const cell = 'px-12 py-12 text-center text-14 font-bold text-default'

  return (
    <tr className="border-b border-default bg-primary-50 align-middle">
      <td className="px-16 py-12 text-14 font-bold text-default">{BRANCH_ROW_LABEL}</td>

      <td className={`border-l border-default ${cell}`}>{noa}</td>
      <td className={cell}>{rp(nilai)}</td>

      <td className={`border-l border-default ${cell}`}>{potentialMitraTotal()}</td>
      {potentialOpen ? (
        <>
          <td className={cell}>{funnel.unqualified}</td>
          <td className={cell}>{funnel.qualified}</td>
          <td className={cell}>{funnel.followUp}</td>
          <td className={cell}>{funnel.uk}</td>
          <td className={cell}>{funnel.disetujui}</td>
        </>
      ) : null}

      <td className={`border-l border-default ${cell}`}>{branch.baru}</td>
      <td className={cell}>{rp(nilaiBaru)}</td>

      <td className={`border-l border-default ${cell}`}>{branch.lanjutan}</td>
      <td className="px-12 py-12 text-center">
        <RatePill ok={branch.renewal >= DISBURSEMENT_TARGETS.renewalRate}>
          {pct(branch.renewal)}
        </RatePill>
      </td>
      <td className={cell}>{rp(nilaiLanjutan)}</td>
      <td />
    </tr>
  )
}

function BpRow({
  bp,
  zebra,
  potentialOpen,
}: {
  bp: DisbursementBp
  zebra: boolean
  potentialOpen: boolean
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

        {/* Potential mitra: its own group, not folded into Mitra baru — a
            lead is not yet a mitra. The lead total is always on screen; the
            five stages behind it open from the gutter toggle, same state as
            the panel above the table. */}
        <td className="border-l border-default px-12 pt-16 text-center text-14 text-default">
          {leadsTotal(bp)}
        </td>
        {potentialOpen ? (
          <>
            <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsUnqualified}</td>
            <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsQualified}</td>
            <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsFollowUp}</td>
            <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsUk}</td>
            <td className="px-12 pt-16 text-center text-14 text-default">{bp.leadsDisetujui}</td>
          </>
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
        <td rowSpan={2} />
      </tr>

      <tr className={`border-b border-default align-top ${stripe}`}>
        <td className="border-l border-default px-12 pb-16 pt-4" />
        <td className={SHORT_CELL}>{nilaiShort ? `${rp(nilaiShort)} lagi` : null}</td>

        {/* Potential mitra carries no shortfall of its own — it's a leading
            indicator, not something with a monthly pass/fail line. */}
        <td className="border-l border-default px-12 pb-16 pt-4" />
        {potentialOpen ? (
          <>
            <td className="px-12 pb-16 pt-4" />
            <td className="px-12 pb-16 pt-4" />
            <td className="px-12 pb-16 pt-4" />
            <td className="px-12 pb-16 pt-4" />
            <td className="px-12 pb-16 pt-4" />
          </>
        ) : null}

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
