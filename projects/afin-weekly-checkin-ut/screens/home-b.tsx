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

import { useState, type ReactNode } from 'react'
import {
  ChatCircleQuestion,
  Check,
  CheckCircleFill,
  CreditCard,
  Majelis,
  Users,
} from '@/design-system/icons'
import { Wordmark } from '@/design-system/assets'
import { useFlow } from '@/platform/runtime'
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
const TILE = 28
const GAP = 16
const TODAY_X = `calc(50% - ${TILE / 2 + GAP / 2}px)`
/** The today dot, white ring included — the bubble hangs off its bottom edge. */
const DOT = 24

export function HomeBScreen() {
  return (
    <HomeShell>
      <div className="overflow-hidden rounded-16 border border-default bg-neutral-white">
        {/* The track opens the card now. It is the only part that answers "when
            do I get something", so it takes the position the eye lands on
            first; the standing follows as the evidence that it is on course.

            The headline that used to sit above it is parked — see "limit
            akhir". */}
        {/* Full-bleed so the tint reaches the card's own edges and the two
            outer dates stay flush where they were — the px-16 inside restores
            exactly the geometry the track was built against. */}
        {/* repayment timeline */}
        {/*
        <div className="px-16 pb-12 pt-16" style={{ background: '#FAF7FC' }}>
          <Track />
        </div>
        */}

        <Standing />

        <div className="px-16 pt-16">
          <Ask />

          <p className="mt-12 pb-16 text-center text-12 text-caption">
            Tap tanggal lain di atas untuk lihat yang berikutnya
          </p>
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
function Standing() {
  return (
    <div>
      <div className="px-16 pt-12">
        <Wordmark name="modal" height={24} />
      </div>
      <div className="mt-12 border-t border-default" />
      <div className="flex items-center justify-between gap-12 px-16 py-12">
        <span className="min-w-0">
          <span className="flex items-center gap-4">
            <span className="uppercase text-10 text-caption" style={{ lineHeight: '1.2' }}>
              Status pinjaman
            </span>
            <span className="text-10 text-caption" style={{ lineHeight: '1.2' }}>
              (14 dari 48 minggu)
            </span>
          </span>
          <span className="flex items-center gap-4 mt-2">
            <span className="text-16 font-bold text-green-500">Sangat Baik</span>
            <ChatCircleQuestion size={16} className="text-caption" />
          </span>
        </span>
      </div>
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

/**
 * Part 3, hanging off the 5 Sep point. It never repeats that date — the track
 * said it once, and this block says "2 minggu lagi" and "sampai tanggal itu"
 * so the two cannot be read as two separate deadlines.
 *
 * The note under the figure is not a disclaimer, it is the point: this is her
 * own repaid principal, lent again. A card that let it read as a bonus would be
 * selling debt.
 */
function Ask() {
  const [paid, setPaid] = useState(false)

  return (
    <div className="rounded-16 bg-primary-50 p-12">
      <p className="text-12 font-bold text-primary-500">2 minggu lagi</p>
      <p className="mt-8 text-14 text-default">Ibu bisa cairkan hingga</p>
      <p className="mt-2 text-24 font-bold text-primary-500">Rp1.250.000</p>
      <p className="mt-8 text-12 text-caption">
        Uangnya dari angsuran yang sudah Ibu bayar. Nanti dibayar lagi seperti biasa.
      </p>

      <p className="mt-16 text-12 text-caption">
        Kalau lancar sampai tanggal itu, tiap minggu Ibu perlu:
      </p>

      <div className="mt-8 flex flex-col gap-8">
        <Row
          icon={<CreditCard size={20} />}
          label="Bayar angsuran"
          detail="Rp112.000 · minggu ini"
          done={paid}
          action={
            <button
              type="button"
              onClick={() => setPaid(true)}
              className="shrink-0 rounded-full bg-primary-500 px-24 py-8 text-14 font-bold text-neutral-white"
            >
              Bayar
            </button>
          }
        />
        <Row icon={<Users size={20} />} label="Datang kumpulan Kamis" done />
        <Row icon={<Majelis size={20} />} label="Kelompok ikut lancar" done />
      </div>
    </div>
  )
}

/**
 * One of the three weekly asks, on white so it reads as a thing to act on
 * rather than as more of the pale surface it sits in. Only the first row has an
 * action, and it is the strongest control on the card — nothing else is a solid
 * button.
 */
function Row({
  icon,
  label,
  detail,
  done,
  action,
}: {
  icon: ReactNode
  label: string
  detail?: string
  done: boolean
  action?: ReactNode
}) {
  return (
    <div className="flex items-center gap-12 rounded-12 bg-neutral-white p-12">
      <span
        className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-12 ${
          done ? 'bg-green-50 text-green-500' : 'bg-primary-50 text-primary-500'
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-14 text-default">{label}</span>
        {detail ? <span className="mt-2 block text-12 text-caption">{detail}</span> : null}
      </span>
      {done ? (
        <CheckCircleFill size={24} className="shrink-0 text-green-500" />
      ) : (
        action
      )}
    </div>
  )
}
