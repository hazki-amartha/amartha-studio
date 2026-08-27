'use client'

// The check-in card, rewritten around ONE question: what does Ibu get, and
// when. It is read by a trader who scans numbers and dates and does not read
// paragraphs, so the card is three parts that make a single sentence going
// down the page —
//
//   1. where she stands            (green strip)
//   2. what she has earned and will earn   (the horizontal track)
//   3. what she must do this week  (tethered to the next point on that track)
//
// The tether is the design. Part 3 is not a block stacked under the track: the
// pale channel behind the 5 Sep point runs down and becomes the block, so the
// two read as "do these → reach that point". Everything else on the card is
// arranged to keep that one relationship legible.
//
// Two rules the copy holds absolutely. The units are weeks, dates and rupiah —
// never a named stretch, never a month axis, because those are our vocabulary
// and not hers. And the disbursement is never a gift: it is principal she has
// already repaid, borrowed again, and the note under the figure says so.

import { Badge, Button } from '@/design-system/components'
import type { BadgeIntent } from '@/design-system/components/Badge'
import {
  Check,
  CheckCircleFill,
  ChevronRight,
} from '@/design-system/icons'
import { ProductLogo, Wordmark } from '@/design-system/assets'
import { useFlow } from '@/platform/runtime'
import { useApp } from '../lib/store'
import { HomeShell } from '../lib/ui'

// The rail's geometry, and the one bit of arithmetic the layout needs.
//
// Five dates sit in flow: the outer two flush to the card's content edges, a
// fixed GAP between every pair except Mar–Jun, and that one pair taking all the
// space left over. Today sits in the middle of THAT span.
//
// Which puts today's centre at a figure CSS can work out on its own. With five
// TILE-wide dates and three fixed gaps, the fixed run is 5·TILE + 3·GAP, so the
// flexing span is (W − fixed) and today's centre lands at
//
//   2·TILE + GAP + (W − fixed)/2  =  W/2 − (TILE/2 + GAP/2)
//
// — a percentage minus a constant, which is exactly what calc() is for. Nothing
// here needs to measure the card.
type StatusKey =
  | 'sangat-baik' | 'baik' | 'baik-orange' | 'sedang' | 'buruk' | 'sangat-buruk'
  | 'kurang-baik' | 'tidak-baik'
const STATUS_CONFIG: Record<StatusKey, { label: string; cardBg: string; labelColor: string }> = {
  'sangat-baik':  { label: 'Sangat Baik',  cardBg: '#EDFAF3', labelColor: '#0F7A3D' },
  'baik':         { label: 'Baik',         cardBg: '#D8F0E3', labelColor: '#0F7A3D' },
  'baik-orange':  { label: 'Baik',         cardBg: '#FFF3E8', labelColor: '#B45309' },
  'sedang':       { label: 'Sedang',       cardBg: '#FFF3E8', labelColor: '#B45309' },
  'buruk':        { label: 'Buruk',        cardBg: '#FFF0F0', labelColor: '#B91C1C' },
  'sangat-buruk': { label: 'Sangat Buruk', cardBg: '#FFE0E0', labelColor: '#B91C1C' },
  'kurang-baik':  { label: 'Kurang Baik',  cardBg: '#FFF0F0', labelColor: '#B91C1C' },
  'tidak-baik':   { label: 'Tidak Baik',   cardBg: '#FFE0E0', labelColor: '#B91C1C' },
}

type HomeBVariant =
  | 'first-week'
  | 'limit-ready'
  // The status matrix — pribadi % x kelompok % lands on one of five grades.
  | 'matrix-sangat-baik' | 'matrix-baik' | 'matrix-sedang' | 'matrix-buruk' | 'matrix-sangat-buruk'
const VARIANT_CONFIG: Record<HomeBVariant, {
  status: StatusKey
  weekLabel: string
  weeklyTitle: string
  weeklySubtitle: string
  showBenefit: boolean
  benefitIcon: string
  benefitIconBg: string
  benefitTitle?: string
  benefitText: string
  benefitAmount: string
  benefitLink?: string
  /** The disbursement card above the reward line — only when a limit is actually ready to be pulled. */
  disbursementAmount?: string
  disbursementGiftAmount?: string
  overdueMode: boolean
  overdueLabel: string
  overdueAmount: string
  overdueSubtitle: string
  overdueFooter: string
  angsuranCaption: string
  kumpulanCaption: string
  groupTitle?: string
  groupIcon?: string
  groupBadgeIntent: BadgeIntent
  groupBadgeLabel: string
  showGroupBadge?: boolean
  groupCaption: string
  groupRowBg?: string
  groupTarget?: string
  showCheckmarks: boolean
}> = {
  'first-week':     { status: 'sangat-baik', weekLabel: '1 dari 48 minggu',  weeklyTitle: 'Tugas Ibu minggu ini',  weeklySubtitle: 'Lengkapi tugas berikut untuk menjaga status tetap {status}',                                    showBenefit: true,  benefitIcon: '🎁', benefitIconBg: '#FFF3E8', benefitText: 'Jika Sangat Baik hingga Desember, Ibu bisa cairkan limit hingga {amount}.', benefitAmount: 'Rp1.500.000', benefitLink: 'Lihat hadiah', overdueMode: false, overdueLabel: '', overdueAmount: '', overdueSubtitle: '', overdueFooter: '', angsuranCaption: 'Rp112.000 · Otomatis dari Poket, 19 Juni', kumpulanCaption: 'Kamis, 19 Juni, 09:00',        groupIcon: '🤝', showGroupBadge: false, groupBadgeIntent: 'green', groupBadgeLabel: 'Lancar',       groupCaption: 'Bisa meningkatkan limit di akhir tenor',      showCheckmarks: false },
  // ── The status matrix ─────────────────────────────────────────────────────
  // Her own repayment rate and her majelis's rate together decide the grade.
  // Both captions carry the figure that produced it, so the state control is
  // enough to read WHY the card says what it says.
  'matrix-sangat-baik':  { status: 'sangat-baik', weekLabel: '14 dari 48 minggu', weeklyTitle: 'Tugas Ibu minggu ini',  weeklySubtitle: 'Lengkapi tugas berikut untuk menjaga status tetap {status}',                                       showBenefit: true,  benefitIcon: '🎁', benefitIconBg: '#FFF3E8', benefitText: 'Jika Sangat Baik hingga Desember, Ibu bisa cairkan limit hingga {amount}.', benefitAmount: 'Rp1.500.000', benefitLink: 'Lihat hadiah', overdueMode: false, overdueLabel: '', overdueAmount: '', overdueSubtitle: '', overdueFooter: '', angsuranCaption: 'Terbayar dari Poket',                     kumpulanCaption: 'Ibu tercatat hadir kumpulan', groupIcon: '🤝', showGroupBadge: false, groupBadgeIntent: 'green', groupBadgeLabel: 'Lancar',       groupCaption: 'Semua sudah bayar · Bisa meningkatkan limit', showCheckmarks: true  },
  'matrix-baik':         { status: 'baik',         weekLabel: '14 dari 48 minggu', weeklyTitle: 'Tugas Ibu minggu ini', weeklySubtitle: '', showBenefit: true, benefitIcon: '⚠️', benefitIconBg: '#FFF3E8', benefitText: 'Status turun karena anggota kumpulan tidak bayar. Hadiah berpotensi berkurang hingga {amount}.', benefitAmount: 'Rp250.000', benefitLink: 'Lihat hadiah', overdueMode: false, overdueLabel: '', overdueAmount: '', overdueSubtitle: '', overdueFooter: '', angsuranCaption: 'Terbayar melalui Andi Saputra',         kumpulanCaption: 'Ibu tercatat hadir kumpulan',     showGroupBadge: false, groupBadgeIntent: 'red', groupBadgeLabel: '',       groupCaption: 'Ingatkan 6 anggota yang tidak bayar',       groupRowBg: '#FFF5F5', groupTarget: 'majelis-melati', showCheckmarks: false },
  'matrix-sedang':       { status: 'sedang',       weekLabel: '14 dari 48 minggu', weeklyTitle: 'Segera bayar angsuran untuk memperbaiki status', weeklySubtitle: '', showBenefit: true, benefitIcon: '⚠️', benefitIconBg: '#FFF3E8', benefitText: 'Hadiah Ibu berpotensi berkurang hingga {amount}.', benefitAmount: 'Rp500.000', benefitLink: 'Lihat hadiah', overdueMode: true, overdueLabel: 'Sudah lewat 7 minggu', overdueAmount: 'Rp875.000', overdueSubtitle: 'Bisa bayar sebagian dari Rp50.000', overdueFooter: 'Diskusikan kepada petugas kemampuan bayar Ibu pada kumpulan hari Kamis, 19 Juni', angsuranCaption: 'Pembayaran Ibu 50% tepat waktu',        kumpulanCaption: 'Ibu 2 kali tidak hadir kumpulan', groupBadgeIntent: 'orange', groupBadgeLabel: 'Perlu Dijaga', groupCaption: 'Kelompok di bawah 90% tepat waktu',         showCheckmarks: false },
  'matrix-buruk':        { status: 'buruk',        weekLabel: '14 dari 48 minggu', weeklyTitle: 'Segera bayar angsuran untuk memperbaiki status', weeklySubtitle: '', showBenefit: true, benefitIcon: '⚠️', benefitIconBg: '#FFF3E8', benefitText: 'Hadiah Ibu berpotensi berkurang hingga {amount}.', benefitAmount: 'Rp250.000', benefitLink: 'Lihat hadiah', overdueMode: true, overdueLabel: 'Sudah lewat 10 minggu', overdueAmount: 'Rp1.250.000', overdueSubtitle: 'Bisa bayar sebagian dari Rp50.000', overdueFooter: 'Diskusikan kepada petugas kemampuan bayar Ibu pada kumpulan hari Kamis, 19 Juni', angsuranCaption: 'Pembayaran Ibu 50% tepat waktu',        kumpulanCaption: 'Ibu 3 kali tidak hadir kumpulan', groupBadgeIntent: 'red',    groupBadgeLabel: 'Tidak Lancar', groupCaption: 'Kelompok di bawah 50% tepat waktu',  groupRowBg: '#FFF5F5', showCheckmarks: false },
  'matrix-sangat-buruk': { status: 'sangat-buruk', weekLabel: '14 dari 48 minggu', weeklyTitle: 'Segera bayar angsuran untuk memperbaiki status', weeklySubtitle: '', showBenefit: true, benefitIcon: '⚠️', benefitIconBg: '#FFF3E8', benefitText: 'Hadiah Ibu di bulan Desember berpotensi hangus.',  benefitAmount: '',            benefitLink: 'Lihat hadiah', overdueMode: true, overdueLabel: 'Sudah lewat 13 minggu', overdueAmount: 'Rp1.625.000', overdueSubtitle: 'Bisa bayar sebagian dari Rp50.000', overdueFooter: 'Diskusikan kepada petugas kemampuan bayar Ibu pada kumpulan hari Kamis, 19 Juni', angsuranCaption: 'Pembayaran Ibu kurang dari 50% tepat waktu', kumpulanCaption: 'Ibu 5 kali tidak hadir kumpulan', groupBadgeIntent: 'red',    groupBadgeLabel: 'Tidak Lancar', groupCaption: 'Kelompok di bawah 30% tepat waktu',  groupRowBg: '#FFF5F5', showCheckmarks: false },

  'limit-ready': { status: 'sangat-baik', weekLabel: '24 dari 48 minggu', weeklyTitle: 'Tugas Ibu minggu ini',  weeklySubtitle: 'Lengkapi tugas berikut untuk menjaga status tetap {status}',                                       showBenefit: false, benefitIcon: '🎁', benefitIconBg: '#FFF3E8', benefitText: '', benefitAmount: '', disbursementAmount: 'Rp2.250.000', disbursementGiftAmount: '+1,25jt', overdueMode: false, overdueLabel: '', overdueAmount: '', overdueSubtitle: '', overdueFooter: '', angsuranCaption: 'Rp112.000 · Otomatis dari Poket, 19 Juni', kumpulanCaption: 'Kamis, 19 Juni, 09:00',        groupIcon: '🤝', showGroupBadge: false, groupBadgeIntent: 'green', groupBadgeLabel: 'Lancar',       groupCaption: 'Bisa meningkatkan limit di akhir tenor',      showCheckmarks: false },
}

const TILE = 28
const GAP = 16
const TODAY_X = `calc(50% - ${TILE / 2 + GAP / 2}px)`
/** The today dot, white ring included — the bubble hangs off its bottom edge. */
const DOT = 24

export function HomeBScreen() {
  const { homeBVariant } = useApp()
  const variant = VARIANT_CONFIG[homeBVariant ?? 'matrix-sangat-baik']
  const { cardBg, labelColor } = STATUS_CONFIG[variant.status]

  return (
    <HomeShell>
      <div className="overflow-hidden rounded-16 border border-default" style={{ background: cardBg }}>
        {/* repayment timeline */}
        {/*
        <div className="px-16 pb-12 pt-16" style={{ background: '#FAF7FC' }}>
          <Track />
        </div>
        */}

        <Standing status={variant.status} weekLabel={variant.weekLabel} />

        <div className="overflow-hidden rounded-16 bg-neutral-white">
          {variant.disbursementAmount && (
            <div className="px-16 pt-12">
              <DisbursementCard amount={variant.disbursementAmount} giftAmount={variant.disbursementGiftAmount ?? ''} />
            </div>
          )}
          {variant.showBenefit && (
            <Benefit
              icon={variant.benefitIcon}
              iconBg={variant.benefitIconBg}
              title={variant.benefitTitle}
              text={variant.benefitText}
              amount={variant.benefitAmount}
              link={variant.benefitLink}
            />
          )}
          <div className="px-16 pb-16 pt-12">
            <p className="text-14 font-bold text-default">{variant.weeklyTitle}</p>
            {variant.weeklySubtitle && (
              <p className="text-12 text-caption">{variant.weeklySubtitle.replace('{status}', STATUS_CONFIG[variant.status].label)}</p>
            )}
            <div className="pt-12">
              {variant.overdueMode ? (
                <OverdueCard
                  label={variant.overdueLabel}
                  amount={variant.overdueAmount}
                  subtitle={variant.overdueSubtitle}
                  footer={variant.overdueFooter}
                  accent={labelColor}
                />
              ) : (
                <Ask
                  angsuranCaption={variant.angsuranCaption}
                  kumpulanCaption={variant.kumpulanCaption}
                  groupTitle={variant.groupTitle}
                  groupIcon={variant.groupIcon}
                  groupBadgeIntent={variant.groupBadgeIntent}
                  groupBadgeLabel={variant.groupBadgeLabel}
                  showGroupBadge={variant.showGroupBadge}
                  groupCaption={variant.groupCaption}
                  groupRowBg={variant.groupRowBg}
                  groupTarget={variant.groupTarget}
                  showCheckmarks={variant.showCheckmarks}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </HomeShell>
  )
}

/**
 * Part 1. Her standing, and the one line of evidence under it — a verdict with
 * no visible basis is an opinion. Green because it is the only part of the card
 * that is purely a report: nothing here is asked of her, it is already true.
 */
function Standing({ status, weekLabel }: { status: StatusKey; weekLabel: string }) {
  const flow = useFlow()
  const { label, labelColor } = STATUS_CONFIG[status]
  return (
    <div>
      {/* logo modal */}
      {/*
      <div className="px-16 pt-12">
        <Wordmark name="modal" height={24} />
      </div>
      <div className="mt-12 border-t border-default" />
      */}
      <button
        type="button"
        onClick={() => flow.go('status-detail')}
        className="flex w-full items-center justify-between gap-8 px-16 py-12 text-left"
      >
        <ProductLogo name="modal" size={28} className="shrink-0 self-start" style={{ marginTop: '2px' }} />
        <span className="min-w-0 flex-1">
          <span className="block uppercase text-10 text-caption" style={{ lineHeight: '1' }}>
            Status pinjaman Modal{' '}
            <span className="normal-case">· {weekLabel}</span>
          </span>
          <span className="mt-2 flex items-center gap-4" style={{ lineHeight: '1' }}>
            <span className="text-16 font-bold" style={{ color: labelColor }}>{label}</span>
          </span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-caption" />
      </button>
    </div>
  )
}

/**
 * Part 2's timeline. Six rows: caption → rail → date → month → chips → tooltip.
 * Today (node 2) has an inner ring. Node 3 is the largest with a tooltip.
 */
function Track() {
  return (
    <div>

      {/* ROW B — the rail. A thick pill whose filled run is hatched, with the
          dates riding ON it as calendar tiles and today as a solid dot in the
          open span between Mar and Jun.

          The stops are laid out in flow rather than by percentage: the two
          outer dates are flush to the card's own edges, the three fixed gaps
          are exactly GAP, and only the Mar–Jun span flexes. That span is where
          today sits, so it is the one distance allowed to breathe. */}
      <div className="relative flex items-center" style={{ height: '34px' }}>
        {/* Unfilled track */}
        <div
          className="absolute rounded-full"
          style={{ left: '0', right: '0', top: '50%', transform: 'translateY(-50%)', height: '24px', background: '#EAE4F2' }}
        />
        {/* Filled run, hatched. It stops at the today dot, whose centre falls
            at TODAY_X for the layout above — see the constant. */}
        <div
          className="absolute rounded-full"
          style={{
            left: '0',
            width: TODAY_X,
            top: '50%',
            transform: 'translateY(-50%)',
            height: '24px',
            background:
              'repeating-linear-gradient(115deg, #6D28A8 0px, #6D28A8 6px, #8B3FC7 6px, #8B3FC7 12px)',
          }}
        />

        <TimelineTile done />
        <Gap />
        <TimelineTile done />
        {/* The one flexing span — and the only place anything sits between two
            dates, which is why today goes here. The bubble hangs off the dot
            inside this same span, so it is centred on the dot by construction
            and needs no arithmetic of its own. */}
        <div className="relative flex flex-1 items-center justify-center">
          <TimelineToday />
          <TimelineTooltip />
        </div>
        <TimelineTile />
        <Gap />
        <TimelineTile muted />
        <Gap />
        <TimelineTile muted />
      </div>

      {/* ROW C — the date under each tile, on the same skeleton so the two rows
          can never drift out of alignment. The tile is a marker, not a label:
          the day is read here, next to its month, where a date is normally
          read. */}
      <div className="flex" style={{ marginTop: '0', height: '32px' }}>
        <TimelineStop day="13" month="Des" />
        <Gap />
        <TimelineStop day="15" month="Mar" />
        <span className="flex-1" />
        <TimelineStop day="12" month="Jun" />
        <Gap />
        <TimelineStop day="14" month="Sep" muted />
        <Gap />
        <TimelineStop day="10" month="Des" muted />
      </div>

      {/* disbursement limit */}
      {/*
      <div className="flex items-start justify-between" style={{ marginTop: '10px' }}>
        <TimelineChip label="Sudah cair" bg="#F4ECFC" fg="#6D28A8" />
        <TimelineChip label="Limit Rp7 juta" bg="#E6F5EB" fg="#0F7A3D" />
      </div>
      */}

      {/* The bubble is out of flow now (it hangs off the dot above), so the
          block still has to reserve the height it hangs into. */}
      <div style={{ height: '22px' }} />
    </div>
  )
}

/** The fixed distance between two dates that are not the flexing pair. */
function Gap() {
  return <span className="shrink-0" style={{ width: `${GAP}px` }} />
}

/**
 * A date on the rail, drawn as a calendar tile — white page, coloured rule and
 * two binding stubs poking above it. Muted for a date far enough out that
 * nothing is being asked about it yet.
 */
function TimelineTile({ done, muted }: { done?: boolean; muted?: boolean }) {
  const flow = useFlow()
  const color = muted ? '#9AA0AE' : '#6D28A8'

  return (
    <button
      type="button"
      onClick={() => flow.go('progress-tier')}
      className="relative shrink-0"
      style={{ width: `${TILE}px`, zIndex: 10 }}
    >
      <span
        className="absolute"
        style={{ top: '-3px', left: '7px', width: '3px', height: '6px', borderRadius: '2px', background: color }}
      />
      <span
        className="absolute"
        style={{ top: '-3px', left: '18px', width: '3px', height: '6px', borderRadius: '2px', background: color }}
      />
      <span
        className="flex items-center justify-center font-bold"
        style={{
          width: `${TILE}px`,
          height: `${TILE}px`,
          borderRadius: '8px',
          border: `2px solid ${color}`,
          background: done ? color : '#FFFFFF',
          // A settled date is a white check on the fill; one still ahead is a
          // question mark in the tile's own colour — same glyph weight, so the
          // row reads as "done, done, not yet, not yet".
          color: done ? '#FFFFFF' : color,
          // A hairline of white inside the border, so a solid tile still reads
          // as a calendar page rather than as a plain purple square.
          boxShadow: done ? 'inset 0 0 0 2px #FFFFFF' : undefined,
          fontSize: '14px',
          lineHeight: '1',
        }}
      >
        {done ? <Check size={16} /> : '?'}
      </span>
    </button>
  )
}

/**
 * Today. A solid dot rather than a tile, because it is not a date she is
 * walking toward — it is where she is standing. It carries no number of its
 * own: the bubble below names the day, and printing it twice at 4px apart
 * would just be the card stuttering.
 */
function TimelineToday() {
  return (
    <span
      className="rounded-full"
      style={{
        width: '18px',
        height: '18px',
        background: '#6D28A8',
        border: '3px solid #FFFFFF',
        zIndex: 20,
      }}
    />
  )
}

/**
 * One date under its tile: day over month, same size, the day bold so the two
 * lines read as one date rather than as two labels.
 */
function TimelineStop({ day, month, muted }: { day: string; month: string; muted?: boolean }) {
  const color = muted ? '#9AA0AE' : '#6D28A8'

  return (
    <span
      className="shrink-0 text-center"
      style={{ width: `${TILE}px`, color, lineHeight: '1.25' }}
    >
      <span className="block font-bold" style={{ fontSize: '14px' }}>
        {day}
      </span>
      <span className="block font-regular" style={{ fontSize: '11.5px' }}>
        {month}
      </span>
    </span>
  )
}

/** A chip hanging off one of the two outer dates. */
function TimelineChip({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <span
      className="whitespace-nowrap rounded-full px-10 py-3 text-11"
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  )
}

/**
 * Today's date, in a bubble whose tail points back up at the dot on the rail.
 * The dot alone says "somewhere in here"; the bubble is what makes it a date.
 */
function TimelineTooltip() {
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: '50%',
        // The dot is DOT px across, so half of it clears the centre line and
        // the tail's tip lands exactly on its bottom edge.
        top: `calc(50% + ${DOT / 2}px)`,
        transform: 'translateX(-50%)',
        zIndex: 15,
      }}
    >
      {/* Tail — triangle pointing up at the dot */}
      <span
        style={{
          width: '0',
          height: '0',
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '7px solid #6D28A8',
        }}
      />
      <span
        className="flex flex-col items-center whitespace-nowrap rounded-12 text-neutral-white"
        style={{ background: '#6D28A8', padding: '8px 14px', lineHeight: '1.25' }}
      >
        <span style={{ fontSize: '11px' }}>Hari ini</span>
        <span className="font-bold" style={{ fontSize: '11px' }}>
          13 Mar
        </span>
      </span>
    </div>
  )
}

function OverdueCard({ label, amount, subtitle, footer, accent }: { label: string; amount: string; subtitle: string; footer: string; accent: string }) {
  return (
    <div className="rounded-16 border border-default bg-neutral-white p-16">
      <p className="text-12 font-bold" style={{ color: accent, lineHeight: '1' }}>
        {label}
      </p>
      <p className="mt-4 font-bold" style={{ color: accent, fontSize: '34px', lineHeight: '1.1' }}>{amount}</p>
      <p className="mt-4 text-12 text-caption">{subtitle}</p>
      <div className="mt-16">
        <Button variant="primary" size="sm" className="w-full">Bayar sekarang</Button>
      </div>
      <p className="mt-12 text-center text-12 text-caption">
        {footer}
      </p>
    </div>
  )
}

function Ask({
  angsuranCaption,
  kumpulanCaption,
  groupTitle = 'Jaga kelancaran kumpulan',
  groupIcon = '⚠️',
  groupBadgeIntent,
  groupBadgeLabel,
  showGroupBadge = true,
  groupCaption,
  groupRowBg,
  groupTarget,
  showCheckmarks,
}: {
  angsuranCaption: string
  kumpulanCaption: string
  groupTitle?: string
  groupIcon?: string
  groupBadgeIntent: BadgeIntent
  groupBadgeLabel: string
  showGroupBadge?: boolean
  groupCaption: string
  groupRowBg?: string
  /** Screen id to open when the caption is tapped — only set when there's somewhere for it to go. */
  groupTarget?: string
  showCheckmarks: boolean
}) {
  const flow = useFlow()
  return (
    <div
      className="bg-neutral-white"
      style={{ border: '1px solid #E9DEF6', borderRadius: '14px', overflow: 'hidden' }}
    >
      {/* Row 1 — Bayar angsuran */}
      <div className="flex items-center gap-12 px-12 py-12">
        <span
          className="flex shrink-0 items-center justify-center"
          style={{ width: '24px', height: '24px', borderRadius: '10px', background: '#F4ECFC', fontSize: '13px' }}
        >
          💳
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-14 font-regular text-default">Bayar angsuran</span>
          <span className="block text-12" style={{ color: '#8E86A3' }}>{angsuranCaption}</span>
        </span>
        {showCheckmarks && <CheckCircleFill size={20} className="shrink-0" style={{ color: '#0F7A3D' }} />}
      </div>

      <div style={{ height: '1px', background: '#F4F0F9' }} />

      {/* Row 2 — Datang kumpulan */}
      <div className="flex items-center gap-12 px-12 py-12">
        <span
          className="flex shrink-0 items-center justify-center"
          style={{ width: '24px', height: '24px', borderRadius: '10px', background: '#E6F5EB', fontSize: '13px' }}
        >
          👭
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-14 text-default">Datang kumpulan</span>
          <span className="block text-12 text-caption">{kumpulanCaption}</span>
        </span>
        {showCheckmarks && <CheckCircleFill size={20} className="shrink-0" style={{ color: '#0F7A3D' }} />}
      </div>

      <div style={{ height: '1px', background: '#F4F0F9' }} />

      {/* Row 3 — Jaga status kelompok */}
      <div className="flex items-center gap-12 px-12 py-12" style={groupRowBg ? { background: groupRowBg } : undefined}>
        <span
          className="flex shrink-0 items-center justify-center"
          style={{ width: '24px', height: '24px', borderRadius: '10px', background: '#E6F5EB', fontSize: '13px' }}
        >
          {groupIcon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-4 text-14 text-default">
            {groupTitle}
            {showGroupBadge && (
              <Badge intent={groupBadgeIntent} variant="subtle" size="sm"
                style={groupBadgeIntent === 'red' ? { background: '#FF0000', color: '#fff' } : undefined}
              >{groupBadgeLabel}</Badge>
            )}
          </span>
          {groupTarget ? (
            <button
              type="button"
              onClick={() => flow.go(groupTarget)}
              className="flex items-center gap-2 text-12 font-bold underline"
              style={{ color: '#B91C1C' }}
            >
              {groupCaption}
              <ChevronRight size={16} className="shrink-0" style={{ color: '#B91C1C' }} />
            </button>
          ) : (
            <span
              className={groupRowBg ? 'block text-12 font-bold underline' : 'block text-12 text-caption'}
              style={groupRowBg ? { color: '#B91C1C' } : undefined}
            >
              {groupCaption}
            </span>
          )}
        </span>
        {showCheckmarks && <CheckCircleFill size={20} className="shrink-0" style={{ color: '#0F7A3D' }} />}
      </div>
    </div>
  )
}

function Benefit({ icon, iconBg, title, text, amount, link }: { icon: string; iconBg: string; title?: string; text: string; amount: string; link?: string }) {
  const flow = useFlow()
  const [before, after] = text.split('{amount}')
  return (
    <div className="px-16 pb-0 pt-12">
      <div className="flex items-start gap-8 rounded-12 border border-default bg-neutral-white p-12">
        <span className="flex shrink-0 items-center justify-center" style={{ width: '24px', height: '24px', borderRadius: '10px', background: iconBg, fontSize: '13px' }}>{icon}</span>
        <span className="min-w-0 flex-1">
          {title && <span className="block text-12 font-bold text-default">{title}</span>}
          <span className={title ? 'mt-2 block text-12 text-caption' : 'block text-12 text-caption'}>
            {/* The figure is bolded in place. A copy with no {amount} at all is
                legal — some states name no number — so the span only appears
                when the placeholder was actually there to replace. */}
            {before}
            {after !== undefined && <span className="font-bold text-default">{amount}</span>}
            {after}
          </span>
          {link && (
            <button type="button" className="mt-4 block text-12 font-bold text-primary-500" onClick={() => flow.go('perjalanan-limit')}>
              {link}
            </button>
          )}
        </span>
      </div>
    </div>
  )
}

/** The disbursement card — a limit that is actually ready to be pulled, with the reward already folded into it. */
function DisbursementCard({ amount, giftAmount }: { amount: string; giftAmount: string }) {
  return (
    <div className="rounded-16 border border-default bg-neutral-white p-16">
      <p className="text-12 text-caption">Hadiah yang bisa dicairkan</p>
      <div className="mt-4 flex items-center justify-between gap-8">
        <p className="text-18 font-bold text-default">{amount}</p>
        <Button variant="primary" size="xs" className="shrink-0">Cairkan</Button>
      </div>
      {giftAmount && (
        <>
          <div className="my-12" style={{ height: '1px', background: '#F4F0F9' }} />
          <p className="text-12 text-caption">
            Pencairan limit berikutnya Desember 2026.{' '}
            <PerjalananLimitLink />
          </p>
        </>
      )}
    </div>
  )
}

/** The link into the milestone journey — a plain purple word inline in a sentence. */
function PerjalananLimitLink() {
  const flow = useFlow()
  return (
    <button type="button" className="font-bold text-primary-500" onClick={() => flow.go('perjalanan-limit')}>
      Lihat hadiah.
    </button>
  )
}


