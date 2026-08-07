'use client'

// The in-app data behind Alt-3 of the morning briefing.
//
// Alt-1 and Alt-2 print the NG-MIS path and stop — "Buka NG-MIS: Branches /
// Monitoring / Repayment" — because NG-MIS is another system and a prototype
// that navigates out of itself strands the review. Alt-3 asks the opposite
// question: what if the numbers she opens NG-MIS for were on the A-Partner
// handset already?
//
// Repayment and disbursement are drawn as the branch total first, then broken
// down by BP — the seven people she is briefing — each with the same two
// periods (this month, today). That is the axis she actually runs the meeting
// on: "cabang 86%, tapi Yanti baru 58% bulan ini". Per-majelis would be a
// hundred cards; per-BP is the seven she can turn to in the room.
//
// Dummy and small (CLAUDE.md §3): a branch line and seven BP lines, and a day's
// worth of tugas per BP.

import { useState, type ReactNode } from 'react'
import { rupiah } from './data'
import { BUSINESS_PARTNERS } from './bp'
import { IconCalendar, IconCheck, IconInfo, IconUserPlus } from './icons'
import { Badge, BottomSheet } from '@/design-system/components'
import { DotsThreeVertical } from '@/design-system/icons'
import { Meter, StepSectionTitle } from './ui'

// --- Repayment & disbursement ----------------------------------------------

export interface PeriodStat {
  /** "Bulan ini" / "Hari ini". */
  label: string
  target: number
  actual: number
}

export interface StatRow {
  /** "Total Branch Ciseeng", or a BP's name. */
  title: string
  /** The BP's code; omitted on the branch total. */
  subtitle?: string
  /** Which BP this row is; omitted on the branch total. Alt-4/Alt-5 read it to
   *  hang her day's tugas under her own numbers. */
  bpId?: string
  /** Two periods: this month, then today. */
  periods: PeriodStat[]
}

/** Two periods in one call — this month, then today — to keep the tables terse. */
const P = (bulanT: number, bulanA: number, hariT: number, hariA: number): PeriodStat[] => [
  { label: 'Bulan ini', target: bulanT, actual: bulanA },
  { label: 'Hari ini', target: hariT, actual: hariA },
]

// Per-BP figures, in the roll-call order. The branch row above them is authored
// separately (a branch total is not the sum of these seven in this prototype).
const REPAYMENT_BP: PeriodStat[][] = [
  P(130_000_000, 127_000_000, 6_500_000, 6_200_000),
  P(120_000_000, 118_000_000, 6_000_000, 5_900_000),
  P(150_000_000, 96_000_000, 7_500_000, 3_100_000),
  P(110_000_000, 90_000_000, 5_500_000, 3_800_000),
  P(125_000_000, 118_000_000, 6_200_000, 5_600_000),
  P(100_000_000, 58_000_000, 5_000_000, 1_900_000),
  P(105_000_000, 51_000_000, 5_300_000, 1_500_000),
]

const DISBURSEMENT_BP: PeriodStat[][] = [
  P(80_000_000, 78_000_000, 4_000_000, 4_000_000),
  P(75_000_000, 75_000_000, 3_800_000, 3_800_000),
  P(90_000_000, 47_000_000, 4_500_000, 1_200_000),
  P(70_000_000, 55_000_000, 3_500_000, 2_000_000),
  P(78_000_000, 70_000_000, 3_900_000, 3_100_000),
  P(65_000_000, 30_000_000, 3_300_000, 0),
  P(62_000_000, 33_000_000, 3_100_000, 0),
]

export const REPAYMENT: StatRow[] = [
  { title: 'Total Branch Ciseeng', periods: P(840_000_000, 726_000_000, 42_000_000, 28_400_000) },
  ...BUSINESS_PARTNERS.map((bp, i) => ({
    title: bp.name,
    subtitle: bp.code,
    bpId: bp.id,
    periods: REPAYMENT_BP[i],
  })),
]

export const DISBURSEMENT: StatRow[] = [
  { title: 'Total Branch Ciseeng', periods: P(520_000_000, 388_000_000, 26_000_000, 14_000_000) },
  ...BUSINESS_PARTNERS.map((bp, i) => ({
    title: bp.name,
    subtitle: bp.code,
    bpId: bp.id,
    periods: DISBURSEMENT_BP[i],
  })),
]

/** "86%" — capaian over target, floored, and 0 target reads as full. */
const pct = (actual: number, target: number): number =>
  target <= 0 ? 100 : Math.round((actual / target) * 100)

/** Green once the target is met, orange while still short, red under 60%. */
const toneFor = (p: number): 'green' | 'orange' | 'red' =>
  p >= 100 ? 'green' : p >= 60 ? 'orange' : 'red'

/** The sentence Alt-5 puts in her mouth instead of a bar: the target, and what
 *  is still missing, in the words she would say out loud. */
const pointerLine = (p: PeriodStat): string => {
  const gap = p.target - p.actual
  return gap > 0
    ? `${p.label}, target ${rupiah(p.target)}, masih kurang ${rupiah(gap)}`
    : `${p.label}, target ${rupiah(p.target)}, target tercapai`
}

/** The verb a stop carries in Alt-5's pointer line — a repayment stop collects,
 *  a disbursement stop disburses. */
const BOOK_VERB: Record<Book, string> = { repayment: 'tagih', disbursement: 'cair' }

/** The one-line reading of a stop for Alt-5: what it is, when, and — where it
 *  lands today — the money it brings. "MV Majelis Mawar jam 7.30, tagih Rp…" */
const taskPointerLine = (c: TaskContribution, book: Book): string => {
  const head = `${c.task.kind} ${c.task.title} jam ${c.task.time}`
  return c.amount === undefined ? head : `${head}, ${BOOK_VERB[book]} ${rupiah(c.amount)}`
}

/**
 * A whole book — repayment or disbursement — as a stack of per-BP SECTIONS: the
 * branch total first, then the seven BPs, each a section TITLE (her name) over
 * her own cards rather than a card with her name inside it. Under each name sit
 * her progress card and, for a real BP, one card per stop she has today.
 *
 * Alt-5 swaps the whole body for pointer sentences — see `PointerBlock`.
 */
export function BookSections({
  rows,
  book,
  pointer = false,
  withTasks = true,
}: {
  rows: StatRow[]
  book: Book
  pointer?: boolean
  /** Alt-3 turns this OFF: its stops live in a tugas step of their own, so the
   *  books show only each BP's numbers. Alt-4 / Alt-5 keep the stops in the
   *  book, filed under the target they move. */
  withTasks?: boolean
}) {
  return (
    <div className="flex flex-col gap-16">
      {rows.map((r) => (
        <BpBookSection
          key={`${r.title}-${r.subtitle ?? ''}`}
          row={r}
          book={book}
          pointer={pointer}
          withTasks={withTasks}
        />
      ))}
    </div>
  )
}

function BpBookSection({
  row,
  book,
  pointer,
  withTasks,
}: {
  row: StatRow
  book: Book
  pointer: boolean
  withTasks: boolean
}) {
  // "Hari ini" is the period the stops are answerable for — a stop today cannot
  // move the month except through today.
  const today = row.periods[row.periods.length - 1]
  const tasks = row.bpId ? contributionsFor(row.bpId, book, today.target) : []

  return (
    <div className="flex flex-col gap-8">
      <StepSectionTitle>{row.title}</StepSectionTitle>
      {pointer ? (
        <PointerBlock periods={row.periods} tasks={tasks} book={book} />
      ) : (
        <>
          <PeriodsCard periods={row.periods} />
          {withTasks
            ? tasks.map((c) => (
                <BookTaskCard
                  key={`${c.task.kind}-${c.task.time}-${c.task.title}`}
                  contribution={c}
                />
              ))
            : null}
        </>
      )}
    </div>
  )
}

/** The progress card under a section title: the two periods, each a meter with
 *  its capaian badge and the money under it. Just the numbers — the name is the
 *  section title above, and the stops are their own cards below. */
function PeriodsCard({ periods }: { periods: PeriodStat[] }) {
  return (
    <div className="flex flex-col gap-12 rounded-12 border border-default bg-neutral-white p-12">
      {periods.map((p) => {
        const percent = pct(p.actual, p.target)
        return (
          <div key={p.label} className="flex flex-col gap-4">
            <span className="flex items-center gap-8">
              <span className="min-w-0 flex-1 truncate text-14 font-regular text-caption">
                {p.label}
              </span>
              <Badge intent={toneFor(percent)}>{percent}%</Badge>
            </span>
            <Meter progress={percent} tone={toneFor(percent)} />
            <span className="text-12 font-regular text-default">
              {rupiah(p.actual)} <span className="text-caption">/ {rupiah(p.target)}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Alt-5's per-BP body: her achievement and her stops as two labelled runs of
 *  pointer sentences — a script she reads down rather than cards she scans. */
function PointerBlock({
  periods,
  tasks,
  book,
}: {
  periods: PeriodStat[]
  tasks: TaskContribution[]
  book: Book
}) {
  return (
    <div className="flex flex-col gap-12 rounded-12 border border-default bg-neutral-white p-12">
      <div className="flex flex-col gap-4">
        <span className="text-12 font-bold text-caption">Pencapaian</span>
        {periods.map((p) => (
          <span key={p.label} className="text-14 font-regular text-default">
            {pointerLine(p)}
          </span>
        ))}
      </div>
      {tasks.length > 0 ? (
        <div className="flex flex-col gap-4 border-t border-default pt-12">
          <span className="text-12 font-bold text-caption">Tugas terkait hari ini</span>
          {tasks.map((c) => (
            <span
              key={`${c.task.kind}-${c.task.time}-${c.task.title}`}
              className="text-14 font-regular text-default"
            >
              {taskPointerLine(c, book)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

// --- Per-BP tugas ----------------------------------------------------------
// What each BP has to do today, drawn in the BP app's own shorthand (MV / HV /
// Sos / FU) so the BM is looking at exactly the cards her BP sees. A real day is
// heavy — four majelis and four doorsteps is a normal load — and some cards
// carry an insight footer, the one fact that turns "she has an HV" into "watch
// this one".

export type BpTaskKind = 'MV' | 'HV' | 'Sos' | 'FU'

export interface BpTask {
  kind: BpTaskKind
  /** The kind spelled out, for the caption line. */
  name: string
  time: string
  title: string
  place: string
  /** The one line worth flagging about this stop, shown as a card footer. */
  insight?: string
}

/** The tint each kind wears — the BP app's palette: MV purple (servicing),
 *  HV red (arrears), Sos blue, FU orange. */
const KIND_TONE: Record<BpTaskKind, string> = {
  MV: 'bg-primary-50 text-primary-500',
  HV: 'bg-red-50 text-red-500',
  Sos: 'bg-blue-50 text-blue-500',
  FU: 'bg-orange-50 text-orange-500',
}

// Shared pools so a day is authored as two name lists per BP, not eight full
// objects. The times interleave MV and HV across the day; the places repeat
// across BPs, which is honest enough for dummy data.
const MV_TIMES = ['07.30', '09.00', '10.30', '13.30']
const HV_TIMES = ['08.15', '11.30', '14.30', '16.00']
const MV_PLACES = [
  'Balai RW 04, Ciseeng',
  'Rumah Bu Yanti, Putat Nutug',
  'Balai Desa Ciseeng',
  'Rumah Bu Imas, Cibeuteung',
]
const HV_PLACES = [
  'Kp. Cibeuteung RT 02',
  'Kp. Putat Nutug RT 05',
  'Kp. Ciseeng RT 01',
  'Kp. Cibeuteung RT 03',
]

interface HvSpec {
  name: string
  insight?: string
}

/** A late-afternoon sosialisasi / follow-up — the growth end of a BP's day.
 *  Only some BPs carry one, which is how a real day looks. */
const sos = (title: string, place: string): BpTask => ({
  kind: 'Sos',
  name: 'Sosialisasi',
  time: '15.30',
  title,
  place,
})
const fu = (title: string, place: string): BpTask => ({
  kind: 'FU',
  name: 'Follow Up',
  time: '17.00',
  title,
  place,
})

/** Four MV + four HV plus whatever growth stops she has, in clock order. */
function bpDay(mv: string[], hv: HvSpec[], extra: BpTask[] = []): BpTask[] {
  const tasks: BpTask[] = [
    ...extra,
    ...mv.map((title, i) => ({
      kind: 'MV' as const,
      name: 'Majelis Visit',
      time: MV_TIMES[i % MV_TIMES.length],
      title,
      place: MV_PLACES[i % MV_PLACES.length],
    })),
    ...hv.map((h, i) => ({
      kind: 'HV' as const,
      name: 'Home Visit',
      time: HV_TIMES[i % HV_TIMES.length],
      title: h.name,
      place: HV_PLACES[i % HV_PLACES.length],
      insight: h.insight,
    })),
  ]
  return tasks.sort((a, b) => a.time.localeCompare(b.time))
}

export const BP_TASKS: Record<string, BpTask[]> = {
  bp1: bpDay(
    ['Majelis Mawar', 'Majelis Seruni', 'Majelis Cempaka', 'Majelis Tulip'],
    [
      { name: 'Ibu Wati Nurhasanah', insight: 'HV ke-3 untuk mitra ini dalam 3 bulan terakhir' },
      { name: 'Ibu Karti' },
      { name: 'Ibu Darsih', insight: 'Janji bayar hari ini — sudah 2x tertunda' },
      { name: 'Ibu Sukaesih' },
    ],
    [sos('Warung Bu Ida, Ciseeng', 'Kp. Ciseeng RT 03')],
  ),
  bp2: bpDay(
    ['Majelis Melati', 'Majelis Anggrek', 'Majelis Bakung', 'Majelis Lavender'],
    [
      { name: 'Ibu Nurhayati' },
      { name: 'Ibu Wulan Sari' },
      { name: 'Ibu Rohaeti', insight: 'Menunggak 52 hari — eskalasi ke BM bila gagal' },
      { name: 'Ibu Enok' },
    ],
    [fu('Ibu Ratna — prospek', 'Kp. Putat Nutug RT 01')],
  ),
  bp3: bpDay(
    ['Majelis Kenanga', 'Majelis Dahlia', 'Majelis Flamboyan', 'Majelis Aster'],
    [
      { name: 'Ibu Elin Herlina', insight: 'Janji bayar hari ini' },
      { name: 'Ibu Cicih' },
      { name: 'Ibu Titin', insight: 'Kemungkinan pindah rumah — konfirmasi alamat' },
      { name: 'Ibu Nani' },
    ],
    [
      sos('Pengajian RW 02, Cibeuteung', 'Kp. Cibeuteung RT 04'),
      fu('Ibu Dedeh — prospek', 'Kp. Ciseeng RT 06'),
    ],
  ),
  bp4: bpDay(
    ['Majelis Teratai', 'Majelis Wijaya', 'Majelis Krisan', 'Majelis Soka'],
    [
      { name: 'Ibu Sumiati' },
      { name: 'Ibu Lilis', insight: 'HV pertama — menunggak 38 hari' },
      { name: 'Ibu Imas' },
      { name: 'Ibu Eem' },
    ],
  ),
  bp5: bpDay(
    ['Majelis Kenari', 'Majelis Sakura', 'Majelis Kamboja', 'Majelis Lily'],
    [
      { name: 'Ibu Nurlaela', insight: 'Menunggak 45 hari — HV pertama untuk kasus ini' },
      { name: 'Ibu Yanti' },
      { name: 'Ibu Ipah' },
      { name: 'Ibu Sari Bulan' },
    ],
    [fu('Ibu Sumini — prospek', 'Kp. Ciseeng RT 02')],
  ),
  bp6: bpDay(
    ['Majelis Gardenia', 'Majelis Zinnia', 'Majelis Alamanda', 'Majelis Kemuning'],
    [
      { name: 'Ibu Yuyun', insight: 'Sudah 4x ditagih dalam 30 hari' },
      { name: 'Ibu Rohimah' },
      { name: 'Ibu Nengsih' },
      { name: 'Ibu Iis', insight: 'Janji bayar kemarin, belum masuk' },
    ],
    [sos('Posyandu Melati, Putat Nutug', 'Kp. Putat Nutug RT 03')],
  ),
  bp7: bpDay(
    ['Majelis Nusa Indah', 'Majelis Bougenville', 'Majelis Sedap Malam', 'Majelis Melur'],
    [
      { name: 'Ibu Eni Nuraeni' },
      { name: 'Ibu Marni' },
      { name: 'Ibu Juju', insight: 'Menunggak 61 hari — pertimbangkan restrukturisasi' },
      { name: 'Ibu Odah' },
    ],
  ),
}

/** The BM's seven BPs, in the roll-call order — the order the runthrough walks. */
export const BP_ROLL = BUSINESS_PARTNERS

// --- Tugas as contributions (Alt-4 / Alt-5) --------------------------------
// Alt-3 keeps the day's tugas as a step of their own, after the two books.
// Alt-4 asks the sharper question: a tugas is not a separate subject, it is HOW
// today's target gets hit — so each stop is filed under the book it moves, with
// the amount it is expected to bring in.
//
// Which book a kind belongs to is a fact about the work: an MV collects and can
// disburse, an HV only collects, and a sosialisasi or a follow-up is growth —
// it belongs under disbursement, but it does not land today, so it carries no
// figure rather than a made-up one.

export type Book = 'repayment' | 'disbursement'

const BOOK_KINDS: Record<Book, BpTaskKind[]> = {
  repayment: ['MV', 'HV'],
  disbursement: ['MV', 'Sos', 'FU'],
}

/** How much of today's target each kind is expected to carry. 0 = listed, but
 *  with nothing landing today. */
const BOOK_WEIGHT: Record<Book, Partial<Record<BpTaskKind, number>>> = {
  repayment: { MV: 3, HV: 1 },
  disbursement: { MV: 1 },
}

export interface TaskContribution {
  task: BpTask
  /** Rupiah this stop should add to today. Absent = it doesn't land today. */
  amount?: number
}

/** Today's target split across the stops that carry it, to the nearest 100rb —
 *  a briefing number, not an accounting one. */
export function contributionsFor(bpId: string, book: Book, todayTarget: number): TaskContribution[] {
  const tasks = (BP_TASKS[bpId] ?? []).filter((t) => BOOK_KINDS[book].includes(t.kind))
  const weights = tasks.map((t) => BOOK_WEIGHT[book][t.kind] ?? 0)
  const total = weights.reduce((a, b) => a + b, 0)
  return tasks.map((task, i) => ({
    task,
    amount:
      weights[i] > 0
        ? Math.round((todayTarget * weights[i]) / total / 100_000) * 100_000
        : undefined,
  }))
}

/**
 * One stop in a BP's day, as its own card under her section title. It is the BP
 * app's task card — kind chip, what and where, its insight footer — with two
 * things the briefing adds: the money it is meant to bring TODAY, printed beside
 * the name, and a 3-dot menu the BM works from without leaving the stop.
 *
 * The amount sits on the name row and the menu is pinned to the card's right
 * edge, so the money reads as a fact ABOUT the stop while the actions stay a
 * control OVER it — two different jobs that a shared right-hand column blurs.
 */
export function BookTaskCard({ contribution }: { contribution: TaskContribution }) {
  const { task, amount } = contribution
  const [menuOpen, setMenuOpen] = useState(false)
  // Click-through state: "Tambah ke tugas saya" leaves a mark on the card so the
  // demo shows the outcome, without a store to carry it anywhere.
  const [added, setAdded] = useState(false)

  return (
    <div className="flex flex-col gap-8 rounded-12 border border-default bg-neutral-white p-12">
      <div className="flex items-start gap-12">
        <span
          className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-8 text-12 font-bold ${KIND_TONE[task.kind]}`}
        >
          {task.kind}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="flex items-center gap-8">
            <span className="min-w-0 flex-1 truncate text-16 font-bold text-default">
              {task.title}
            </span>
            {amount !== undefined ? (
              <span className="shrink-0 text-14 font-bold text-primary-500">+ {rupiah(amount)}</span>
            ) : null}
          </span>
          <span className="truncate text-12 font-regular text-caption">
            {task.name} · {task.time}
          </span>
          <span className="line-clamp-2 text-14 font-regular text-default">{task.place}</span>
          {added ? (
            <span className="mt-2 flex w-fit items-center gap-4 rounded-full bg-primary-50 px-8 py-2 text-12 font-bold text-primary-500">
              <IconCheck size={16} />
              Di tugas saya
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label={`Aksi untuk ${task.title}`}
          className="shrink-0 text-caption active:opacity-70"
        >
          <DotsThreeVertical size={20} />
        </button>
      </div>
      {task.insight ? (
        <span className="flex items-start gap-4 border-t border-default pt-8 text-12 font-regular text-caption">
          <span className="shrink-0 text-link">
            <IconInfo size={16} />
          </span>
          {task.insight}
        </span>
      ) : null}
      <TaskActionSheet
        open={menuOpen}
        title={task.title}
        added={added}
        onAdd={() => {
          setAdded(true)
          setMenuOpen(false)
        }}
        onReschedule={() => setMenuOpen(false)}
        onClose={() => setMenuOpen(false)}
      />
    </div>
  )
}

/** The 3-dot menu on a stop: take it onto the BM's own list, or move it to
 *  another day. A bottom sheet rather than a floating menu — the same surface
 *  every other picker in this direction uses. */
function TaskActionSheet({
  open,
  title,
  added,
  onAdd,
  onReschedule,
  onClose,
}: {
  open: boolean
  title: string
  added: boolean
  onAdd: () => void
  onReschedule: () => void
  onClose: () => void
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-8">
        <MenuRow
          icon={<IconUserPlus size={20} />}
          label={added ? 'Sudah di tugas saya' : 'Tambah ke tugas saya'}
          onClick={onAdd}
          disabled={added}
        />
        <MenuRow
          icon={<IconCalendar size={20} />}
          label="Jadwalkan ulang"
          onClick={onReschedule}
        />
      </div>
    </BottomSheet>
  )
}

function MenuRow({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-12 rounded-8 border border-default bg-neutral-white p-12 text-left active:opacity-70 disabled:opacity-50"
    >
      <span className="shrink-0 text-primary-500">{icon}</span>
      <span className="text-14 font-bold text-default">{label}</span>
    </button>
  )
}

/**
 * Alt-3's tugas step: every BP on one page, her name a section title over one
 * card per stop she has today — ALL of them, not split by book, because here
 * the subject is her day rather than a target it moves. The stops carry no
 * figure (a contribution is a fact about a book, and this step has none) but
 * keep the 3-dot menu, so the BM can still take a stop onto her own list or
 * move it. The same `BookTaskCard` as the books, so the two cannot drift.
 */
export function BpTugasSections() {
  return (
    <div className="flex flex-col gap-16">
      {BP_ROLL.map((bp) => {
        const tasks = BP_TASKS[bp.id] ?? []
        return (
          <div key={bp.id} className="flex flex-col gap-8">
            <StepSectionTitle>{bp.name}</StepSectionTitle>
            {tasks.map((task) => (
              <BookTaskCard key={`${task.time}-${task.title}`} contribution={{ task }} />
            ))}
          </div>
        )
      })}
    </div>
  )
}
