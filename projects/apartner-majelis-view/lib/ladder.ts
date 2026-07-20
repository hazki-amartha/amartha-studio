// Jalur Naik Modal — the capital ladder, derived for one mitra.
//
// Carried over from apartner-task-first, where the full argument for its shape
// lives. In short: it is not a dashboard and not a top-up pitch, it is a
// BRIEFING. The BP arrives with one hard argument — "keep paying on time and
// your modal grows" — and today makes it from half-remembered numbers, so this
// module's real output is `script`: the sentence she says, with the right amount
// and the right number of weeks already in it.
//
// One thing changed in the port, and it matters. Arrears used to be estimated
// from DPD (`ceil(dpd / 7) * weekly`), because that direction had no ledger to
// ask. This direction does, so the figure now comes from `outstandingOf` —
// missed weeks plus whatever is left over from a part-payment. That is the
// number the collect page collects, so the ladder and the bill can no longer
// quote different amounts for the same debt, which is exactly the kind of
// contradiction a mitra notices and a BP cannot defend.

import { outstandingOf, rupiah, type Mitra } from './data'

export type RungKind = 'topup' | 'pelunasan' | 'limit'

/**
 * - `tercapai` — behind her; the discipline argument has already paid once.
 * - `berjalan` — the rung she is climbing, with weeks left on it.
 * - `tertahan` — the same rung, frozen by arrears. Not a styling variant: it
 *                carries a different detail line and a different script.
 * - `terkunci` — ahead of her. Stated, not promised.
 */
export type RungState = 'tercapai' | 'berjalan' | 'tertahan' | 'terkunci'

export interface Rung {
  id: string
  month: number
  /** "3 Bulan" — the rail's heading. */
  title: string
  badge: string
  kind: RungKind
  /** The line above the number: "Tambah modal", "Limit naik menjadi". */
  lead: string
  /** Rupiah, or null where the reward isn't an amount (pelunasan dini). */
  amount: number | null
  state: RungState
  /** One line under the reward; null on a locked rung. */
  detail: string | null
  /** 0–100 for the rung being climbed; null everywhere else. */
  progress: number | null
}

export interface Ladder {
  status: 'berjalan' | 'tertahan'
  rungs: Rung[]
  /** The rung she is on — moving or held. Null once the cycle is finished. */
  current: Rung | null
  /** Weeks she paid nothing on. Drives the "one week" vs "all of it" wording. */
  missedWeeks: number
  /** What it costs to release the ladder: every overdue rupiah, not this week's. */
  arrears: number
  /** The sentence the BP says. The point of this module. */
  script: string
  /** The closing line — what keeps it moving, or what happens once it clears. */
  keep: string
}

/** Loan amounts are quoted in round money, never in derived decimals. */
const round50 = (n: number): number => Math.round(n / 50_000) * 50_000

const MILESTONES: Array<{
  month: number
  kind: RungKind
  badge: string
  lead: string
  /** Multiple of her current contract value; null where the reward isn't money. */
  factor: number | null
}> = [
  { month: 3, kind: 'topup', badge: 'TOP UP', lead: 'Tambah modal', factor: 0.25 },
  { month: 6, kind: 'topup', badge: 'TOP UP', lead: 'Tambah modal', factor: 0.5 },
  {
    month: 10,
    kind: 'pelunasan',
    badge: 'PELUNASAN DINI',
    lead: 'Bisa melunasi lebih awal',
    factor: null,
  },
  { month: 12, kind: 'limit', badge: 'LIMIT NAIK', lead: 'Limit naik menjadi', factor: 1.5 },
]

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const TODAY = new Date(2026, 6, 21)

function weeksAgo(weeks: number): string {
  const d = new Date(TODAY)
  d.setDate(d.getDate() - weeks * 7)
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
}

export function ladderOf(mitra: Mitra): Ladder {
  // Her contract value today — what a top up is quoted against. Rungs escalate
  // off it so the ladder actually climbs: a second rung worth the same as the
  // first is a calendar, not a ladder.
  const plafond = mitra.weekly * mitra.totalWeeks
  const monthsIn = Math.floor(mitra.week / 4)

  const owed = outstandingOf(mitra)
  // This week's instalment is due, not overdue — it does not hold the ladder.
  const arrears = owed.missed + owed.partial
  const status: Ladder['status'] = arrears > 0 ? 'tertahan' : 'berjalan'

  // The first rung she has not cleared. Everything after it is locked.
  const currentIndex = MILESTONES.findIndex((m) => m.month > monthsIn)

  const rungs: Rung[] = MILESTONES.map((m, i) => {
    const base = {
      id: `bulan-${m.month}`,
      month: m.month,
      title: `${m.month} Bulan`,
      badge: m.badge,
      kind: m.kind,
      lead: m.lead,
      amount: m.factor === null ? null : round50(plafond * m.factor),
    }

    if (currentIndex === -1 || i < currentIndex) {
      return {
        ...base,
        state: 'tercapai',
        detail: `Selesai pada ${weeksAgo(mitra.week - m.month * 4)}`,
        progress: null,
      }
    }

    if (i > currentIndex) {
      return { ...base, state: 'terkunci', detail: null, progress: null }
    }

    // The rung she is on. Progress spans THIS rung, not the whole cycle — "3
    // minggu tersisa" is a number she can hold in her head; "week 9 of 50" is
    // one she has to do arithmetic on.
    const prevMonth = i === 0 ? 0 : MILESTONES[i - 1].month
    const weeksTotal = (m.month - prevMonth) * 4
    const weeksDone = Math.min(weeksTotal, Math.max(0, mitra.week - prevMonth * 4))
    const missedWeeks = owed.missedWeeks

    return {
      ...base,
      state: status === 'tertahan' ? 'tertahan' : 'berjalan',
      detail:
        status === 'tertahan'
          ? `Tertahan — ${missedWeeks} minggu belum dibayar`
          : `${weeksTotal - weeksDone} minggu tersisa`,
      progress: Math.round((weeksDone / weeksTotal) * 100),
    }
  })

  const current = currentIndex === -1 ? null : rungs[currentIndex]

  // What the script points AT, which is not always the rung she is on. A mitra
  // approaching "pelunasan dini" is being told that clearing her arrears earns
  // her the right to pay EARLY, which is not an argument — it is a joke at her
  // expense. So the pitch skips ahead to the next rung that pays her in modal.
  const reward =
    currentIndex === -1 ? null : (rungs.slice(currentIndex).find((r) => r.amount !== null) ?? current)

  // "Bu Rina", not "Bu Marlina" — the given name leads, as it is said aloud.
  const first = mitra.name.split(' ')[0]

  return {
    status,
    rungs,
    current,
    missedWeeks: owed.missedWeeks,
    arrears,
    script: scriptFor(first, status, current, reward, arrears),
    keep:
      status === 'tertahan'
        ? 'Setelah tunggakan lunas, jalur lanjut dari titik ini — tidak diulang dari awal.'
        : 'Yang menjaga jalur ini tetap jalan: bayar tepat waktu dan hadir di kumpulan tiap minggu.',
  }
}

/**
 * The line the BP delivers, written to be said out loud rather than read.
 *
 * It is quoted verbatim on the screen on purpose. A BP handed bullet points has
 * to compose the sentence herself at the door, in front of the mitra, and that
 * is exactly where a real argument collapses into "ada program top up, Bu".
 */
function scriptFor(
  first: string,
  status: Ladder['status'],
  current: Rung | null,
  reward: Rung | null,
  arrears: number,
): string {
  if (current === null || reward === null) {
    return `Bu ${first}, siklus Ibu sudah selesai penuh dengan catatan baik — Ibu bisa ajukan pembiayaan baru dengan limit lebih tinggi.`
  }

  const prize =
    reward.amount === null
      ? 'Ibu bisa melunasi lebih awal'
      : reward.kind === 'limit'
        ? `limit Ibu naik jadi ${rupiah(reward.amount)}`
        : `Ibu bisa tambah modal ${rupiah(reward.amount)}`

  if (status === 'tertahan') {
    return `Bu ${first}, jalur naik modal Ibu sedang tertahan. Kalau tunggakan ${rupiah(arrears)} ini lunas, jalurnya jalan lagi — di ${reward.month} bulan ${prize}.`
  }

  // The rung she is on carries the countdown; the rung being pitched carries the
  // prize. Usually the same rung — when they are not, the sentence still has to
  // read as one thought.
  const weeks = current.detail?.split(' ')[0] ?? ''
  return current.id === reward.id
    ? `Bu ${first}, tinggal ${weeks} minggu lagi bayar tepat waktu — setelah itu ${prize}.`
    : `Bu ${first}, tinggal ${weeks} minggu lagi ke ${current.title}, dan di ${reward.month} bulan ${prize}.`
}
