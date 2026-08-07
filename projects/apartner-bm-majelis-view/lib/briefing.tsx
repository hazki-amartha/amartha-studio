'use client'

// The briefing's running order, and the pieces both briefing pages draw it
// with. Morning and evening are the same meeting at two ends of a day — same
// roll call, same checklist shape, same photo at the close — so the agenda is
// authored here as data and the page is the list of it.

import type { ReactNode } from 'react'
import { BottomSheet, Button } from '@/design-system/components'
import { User } from '@/design-system/icons'
import { BUSINESS_PARTNERS } from './bp'
import { IconCamera, IconCheck } from './icons'
import { AttendanceChoice } from './ui'

/** How each BP answered the register. Absent from the record = not asked yet,
 *  which is a third state and not the same as "tidak hadir". */
export type Attendance = Record<string, 'hadir' | 'tidak'>

/** A run of numbered steps under its own heading — "Keseluruhan cabang", then
 *  "Per BP" — for an item whose script splits into scopes. */
export interface StepGroup {
  label: string
  steps: string[]
}

export interface AgendaItem {
  id: string
  title: string
  /** The one line under the title: what it is, or where to open it. */
  subtitle?: string
  /** The steps to work through, printed as a numbered list under a rule. */
  steps?: string[]
  /** The steps grouped under sub-headings, when the script runs the same list
   *  at two scopes (the whole branch, then each BP). Takes the place of
   *  `steps` where present. */
  groups?: StepGroup[]
}

/**
 * The morning's running order, straight off the reference.
 *
 * The NG-MIS paths are printed as TEXT, not linked. NG-MIS is another system;
 * a prototype that navigated out of itself would leave the review stranded in
 * an app nobody opened it to look at.
 */
export const MORNING_AGENDA: AgendaItem[] = [
  {
    id: 'repayment',
    title: 'Bahas target repayment',
    subtitle: 'Buka NG-MIS: Branches / Monitoring / Repayment',
    groups: [
      {
        label: 'Keseluruhan cabang',
        steps: ['Share target & capaian bulan ini', 'Share target & capaian hari ini'],
      },
      {
        label: 'Per BP',
        steps: ['Share target & capaian bulan ini', 'Share target & capaian hari ini'],
      },
    ],
  },
  {
    id: 'disbursement',
    title: 'Bahas target disbursement',
    subtitle: 'Buka NG-MIS: Branches / Monitoring / Disbursement',
    groups: [
      {
        label: 'Keseluruhan cabang',
        steps: ['Share target & capaian bulan ini', 'Share target & capaian hari ini'],
      },
      {
        label: 'Per BP',
        steps: ['Share target & capaian bulan ini', 'Share target & capaian hari ini'],
      },
    ],
  },
  {
    id: 'tugas',
    title: 'Bahas tugas hari ini untuk setiap BP',
    subtitle: 'Buka NG-MIS: Branches / Monitoring / Tugas',
    steps: [
      'Pastikan tugas di BP App dan NG-MIS sama',
      'Pastikan tiap BP mengerti pentingnya setiap tugas yang mereka punya',
      'Bahas strategi menyelesaikan tugas',
    ],
  },
]

/**
 * The evening's running order — the same three subjects the morning hands out,
 * read back in the past tense.
 *
 * It exists for the two cuts that have NO data on the handset: there, the whole
 * briefing is a script plus an NG-MIS path, exactly as the morning's printed
 * cuts are. The in-app cut ignores this entirely and draws the numbers instead.
 *
 * Every item is phrased as a COMPARISON — awal hari against setelah closing —
 * because that is what makes this a closing rather than a second morning.
 */
export const EVENING_AGENDA: AgendaItem[] = [
  {
    id: 'tugas',
    title: 'Bahas penyelesaian tugas hari ini',
    subtitle: 'Buka NG-MIS: Branches / Monitoring / Tugas',
    groups: [
      {
        label: 'Keseluruhan cabang',
        steps: [
          'Share jumlah MV, HV, Sos & FU yang selesai hari ini',
          'Bahas tugas yang dilewati atau dijadwalkan ulang',
        ],
      },
      {
        label: 'Per BP',
        steps: [
          'Share jumlah tugas selesai tiap BP',
          'Bahas tugas yang belum selesai beserta alasannya',
        ],
      },
    ],
  },
  {
    id: 'repayment',
    title: 'Bahas capaian repayment',
    subtitle: 'Buka NG-MIS: Branches / Monitoring / Repayment',
    groups: [
      {
        label: 'Keseluruhan cabang',
        steps: [
          'Bandingkan capaian awal hari dengan setelah closing',
          'Share pergerakan DPD 0, DPD 1-7 dan DPD 8-30',
        ],
      },
      {
        label: 'Per BP',
        steps: [
          'Bandingkan capaian awal hari dengan setelah closing',
          'Bahas mitra yang pindah DPD beserta alasannya',
        ],
      },
    ],
  },
  {
    id: 'disbursement',
    title: 'Bahas capaian disbursement',
    subtitle: 'Buka NG-MIS: Branches / Monitoring / Disbursement',
    groups: [
      {
        label: 'Keseluruhan cabang',
        steps: ['Bandingkan capaian awal hari dengan setelah closing'],
      },
      {
        label: 'Per BP',
        steps: [
          'Bahas pencairan yang berhasil hari ini',
          'Bahas tugas yang berhasil tapi belum menambah capaian',
          'Bahas pencairan yang belum berhasil beserta alasannya',
        ],
      },
    ],
  },
]

/**
 * One agenda item as a card the BM ticks off.
 *
 * The mark is on the LEFT of the title and the whole card is the target: she is
 * running a meeting with seven people in front of her, and a checkbox sized for
 * a cursor is not something you hit while talking.
 */
export function AgendaCard({
  item,
  done,
  onToggle,
}: {
  item: AgendaItem
  done: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      className="flex w-full items-start gap-12 rounded-12 border border-default bg-neutral-white p-12 text-left active:bg-neutral-50"
    >
      <CheckMark done={done} />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <span className="text-16 font-bold text-default">{item.title}</span>
        {item.subtitle ? (
          <span className="text-14 font-regular text-caption">{item.subtitle}</span>
        ) : null}
        <AgendaSteps item={item} />
      </div>
    </button>
  )
}

/** A numbered step list. Where the item has `groups`, each scope gets its own
 *  sub-heading over its own list; otherwise the flat `steps` are printed as one.
 *  Shared by the single-page card (Alt-1) and the stepper page (Alt-2) so the
 *  two draw the running order the same way.
 *
 *  `topRule` sets off the steps from whatever is above them — the card title on
 *  Alt-1, the subtitle on Alt-2. Every item now carries an NG-MIS path, so the
 *  rule always has something over it; the flag stays because an item authored
 *  without a subtitle would otherwise open on a bare line. */
export function AgendaSteps({ item, topRule = true }: { item: AgendaItem; topRule?: boolean }) {
  const frame = topRule ? 'mt-8 border-t border-default pt-12' : ''
  if (item.groups) {
    return (
      <div className={`flex flex-col gap-16 ${frame}`.trim()}>
        {item.groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-8">
            <span className="text-14 font-bold text-default">{group.label}</span>
            <StepList steps={group.steps} />
          </div>
        ))}
      </div>
    )
  }
  if (item.steps) {
    return topRule ? (
      <div className={frame}>
        <StepList steps={item.steps} />
      </div>
    ) : (
      <StepList steps={item.steps} />
    )
  }
  return null
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col gap-8">
      {steps.map((step, i) => (
        <li key={step} className="flex gap-12">
          <span className="w-12 shrink-0 text-14 font-bold text-default">{i + 1}</span>
          <span className="min-w-0 flex-1 text-14 font-regular text-default">{step}</span>
        </li>
      ))}
    </ol>
  )
}

/**
 * The tick, at ONE size everywhere — every agenda row and every absensi name
 * carries the same 24px circle, so the two lists read as one checklist rather
 * than two controls that happen to share a page.
 *
 * Unchecked is a solid neutral-400 ring, not a dashed hairline: the dashed
 * `border-default` was too faint to read as "waiting to be ticked", so an empty
 * row looked like it had no control at all.
 */
export function CheckMark({ done }: { done: boolean }) {
  return (
    <span
      className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full ${
        done
          ? 'bg-primary-500 text-neutral-white'
          : 'border border-neutral-400 bg-neutral-white'
      }`}
    >
      {done ? <IconCheck size={16} /> : null}
    </span>
  )
}

/**
 * The register on the SINGLE-PAGE cut: each name its own tap target, unticked
 * by default, because attendance is something she records as the room fills.
 *
 * A tick has only one value here — ticked means hadir, unticked means she has
 * not reached that name yet. That is enough on Alt-1, where the register is a
 * collapsed count she opens while people arrive, and not enough on the stepper,
 * where it is a page of its own she works down (see `RollCallChoice`).
 */
export function RollCallTicks({
  marks,
  onToggle,
}: {
  marks: Attendance
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-12">
      {BUSINESS_PARTNERS.map((bp) => (
        <button
          key={bp.id}
          type="button"
          onClick={() => onToggle(bp.id)}
          aria-pressed={marks[bp.id] === 'hadir'}
          className="flex items-center gap-12 text-left active:opacity-70"
        >
          <CheckMark done={marks[bp.id] === 'hadir'} />
          <span className="min-w-0 flex-1 truncate text-16 font-regular text-default">
            {bp.name}
          </span>
        </button>
      ))}
    </div>
  )
}

/**
 * The register on every STEPPER cut: one card per BP, drawn like the mitra
 * roster on the MV — her photo and name on the first line, a rule, then the BP
 * app's own two-cell answer. Green for present and red for absent, the unchosen
 * cell going quiet once she has answered.
 *
 * A tick cannot say "tidak hadir" — it can only fail to say "hadir", which is
 * the same mark as a name she has not reached yet. On a page she works down
 * that difference is the whole record.
 */
export function RollCallChoice({
  marks,
  onMark,
}: {
  marks: Attendance
  onMark: (id: string, value: 'hadir' | 'tidak') => void
}) {
  return (
    <div className="flex flex-col gap-12">
      {BUSINESS_PARTNERS.map((bp) => {
        const answer = marks[bp.id]
        return (
          <div
            key={bp.id}
            className="flex flex-col gap-12 rounded-16 border border-default bg-neutral-white p-12"
          >
            <div className="flex items-center gap-12">
              <span
                className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-500"
                aria-hidden
              >
                <User size={20} />
              </span>
              <span className="min-w-0 flex-1 truncate text-16 font-bold text-default">
                {bp.name}
              </span>
            </div>
            <div className="flex gap-8 border-t border-default pt-12">
              <AttendanceChoice
                tone="red"
                selected={answer === 'tidak'}
                answered={Boolean(answer)}
                label={`Tidak hadir — ${bp.name}`}
                onClick={() => onMark(bp.id, 'tidak')}
              >
                Tidak hadir
              </AttendanceChoice>
              <AttendanceChoice
                tone="green"
                selected={answer === 'hadir'}
                answered={Boolean(answer)}
                label={`Hadir — ${bp.name}`}
                onClick={() => onMark(bp.id, 'hadir')}
              >
                Hadir
              </AttendanceChoice>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** How many BPs are in the room, by the register as it stands. */
export const hadirCount = (marks: Attendance): number =>
  BUSINESS_PARTNERS.filter((bp) => marks[bp.id] === 'hadir').length

/**
 * An agenda item drawn read-only for a stepper page — the same subtitle and
 * numbered steps the single-page card carries, minus the tick. The printed cuts
 * of both briefings use it; the in-app cuts replace the whole step with data.
 */
export function PrintedAgenda({ item }: { item: AgendaItem }) {
  return (
    <div className="flex flex-col gap-12 rounded-12 border border-default bg-neutral-white p-12">
      {item.subtitle ? (
        <span className="text-14 font-regular text-caption">{item.subtitle}</span>
      ) : null}
      <AgendaSteps item={item} topRule={Boolean(item.subtitle)} />
    </div>
  )
}

/**
 * The closing photo, as a bottom sheet. It comes up over the last step when she
 * taps "Selesaikan Briefing", so the running order ends on the subject she
 * actually briefs and the proof is a gesture on top of it rather than a screen
 * of its own. The briefing does not close until the photo is taken, so the
 * confirm INSIDE the sheet is what actually finishes it.
 */
export function PhotoSheet({
  open,
  photo,
  onToggle,
  onClose,
  onConfirm,
}: {
  open: boolean
  photo: boolean
  onToggle: () => void
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Bukti kehadiran">
      <div className="flex flex-col gap-12">
        <span className="text-14 font-regular text-caption">
          Ambil foto bersama semua peserta yang hadir
        </span>
        <button
          type="button"
          onClick={onToggle}
          className={`flex flex-col items-center gap-8 rounded-12 border border-dashed p-24 ${
            photo ? 'border-green-500 bg-green-50 text-green-500' : 'border-default text-caption'
          }`}
        >
          <IconCamera size={24} />
          <span className="text-14 font-bold">{photo ? 'Foto tersimpan' : 'Ambil foto'}</span>
        </button>
        <Button size="lg" className="w-full" disabled={!photo} onClick={onConfirm}>
          Selesaikan Briefing
        </Button>
      </div>
    </BottomSheet>
  )
}

/** A titled block on the briefing page — the absensi and the photo both sit in one. */
export function BriefingCard({
  title,
  hint,
  children,
}: {
  title: string
  /** Right-aligned in the header — the absensi's count, and its disclosure. */
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-12 rounded-12 border border-default bg-neutral-white p-12">
      <div className="flex items-center gap-8">
        <span className="min-w-0 flex-1 text-16 font-bold text-default">{title}</span>
        {hint ? <span className="flex shrink-0 items-center gap-4">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}
