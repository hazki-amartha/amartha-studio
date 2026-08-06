// =============================================================================
// The BP's day, as NG-MIS sees it — and the bottom of the drill-down.
//
// These are the same four kinds of work the A-Partner BP app hands out (MV
// majelis visit, HV home visit, Sos sosialisasi, FU follow-up), and the reasons
// on a mitra row use the app's own fixed vocabulary. That matters: the BM is
// not reading a summary somebody wrote for her, she is reading what the BP
// recorded standing in front of the mitra.
// =============================================================================

import { bpById, type Bp, type TaskCounts } from './data'

export type TaskKind = 'MV' | 'HV' | 'Sos' | 'FU'

export interface Task {
  id: string
  kind: TaskKind
  title: string
  place: string
  time: string
  done: boolean
}

const KIND_LABEL: Record<TaskKind, string> = {
  MV: 'Kunjungan majelis',
  HV: 'Kunjungan rumah',
  Sos: 'Sosialisasi',
  FU: 'Follow-up',
}

export const kindLabel = (k: TaskKind) => KIND_LABEL[k]

const MAJELIS = ['Melati', 'Kenanga', 'Anggrek', 'Cempaka', 'Mawar', 'Seroja']
const PLACES = ['Alalak Utara', 'Berangas', 'Kelayan', 'Sungai Jingah', 'Gambut', 'Martapura']
const MITRA = [
  'Siti Aminah',
  'Ratna Dewi',
  'Wulan Sari',
  'Endang Puspa',
  'Rina Kartika',
  'Yuli Astuti',
  'Mega Lestari',
  'Ayu Ningsih',
  'Dinda Larasati',
  'Tuti Herawati',
  'Nur Hayati',
  'Umi Kulsum',
]
const SLOTS = ['07.30', '09.00', '10.30', '13.00', '14.30', '15.30', '16.30']

/**
 * The day, expanded from the counts on the board. Done tasks come first within a
 * kind, so the row a BM taps to ask "what happened there" is the one still open.
 */
export function tasksOf(bp: Bp): Task[] {
  const out: Task[] = []
  let slot = 0
  const push = (kind: TaskKind, pair: TaskCounts['mv'], namer: (i: number) => string) => {
    const [done, total] = pair
    for (let i = 0; i < total; i += 1) {
      out.push({
        id: `${bp.id}-${kind}-${i}`,
        kind,
        title: namer(i),
        place: PLACES[(i + out.length) % PLACES.length],
        time: SLOTS[slot % SLOTS.length],
        done: i < done,
      })
      slot += 1
    }
  }
  push('MV', bp.tasks.mv, (i) => `Majelis ${MAJELIS[i % MAJELIS.length]}`)
  push('HV', bp.tasks.hv, (i) => MITRA[i % MITRA.length])
  push('Sos', bp.tasks.sos, () => 'Sosialisasi calon mitra')
  push('FU', bp.tasks.fu, (i) => MITRA[(i + 6) % MITRA.length])
  return out
}

export const taskById = (bpId: string, taskId: string) =>
  tasksOf(bpById(bpId)).find((t) => t.id === taskId)

// --- Mitra outcomes ---------------------------------------------------------

/** The A-Partner reason list, verbatim (`collect-options.ts` REASONS). Free text
 *  is deliberately absent there, which is exactly what makes it countable here. */
const REASONS = [
  'Usaha sedang sepi',
  'Ada kebutuhan mendesak',
  'Sakit / keluarga sakit',
  'Sedang tidak di tempat',
  'Menolak bayar',
]

/** The janji bayar the BP negotiated on the spot, from the app's own options. */
const JANJI = ['Nanti hari ini', 'Besok, 29 Juli', 'Lusa, 30 Juli', 'Minggu depan, 4 Agustus', null]

export interface MitraOutcome {
  name: string
  /** The week's bill, and what she actually handed over. */
  tagihan: number
  bayar: number
  reason?: string
  janji?: string | null
}

const ANGSURAN = 133_000

/** Deterministic from the task id — the same task always shows the same room. */
function seed(str: string) {
  let h = 2166136261
  for (const c of str) h = ((h ^ c.charCodeAt(0)) * 16777619) >>> 0
  return () => {
    h = (h * 1664525 + 1013904223) >>> 0
    return h / 4294967296
  }
}

/**
 * The register behind one majelis visit: who paid, who didn't, and — for every
 * mitra who didn't — the reason and the promise the BP recorded. This is the
 * bottom of the BM's drill-down and the only screen in the prototype that
 * answers "why", so a majelis is never drawn as fully paid.
 */
export function majelisOutcome(task: Task): { hadir: number; total: number; mitra: MitraOutcome[] } {
  const r = seed(task.id)
  const total = 18 + Math.floor(r() * 6)
  const belum = 3 + Math.floor(r() * 4)
  const mitra: MitraOutcome[] = []
  for (let i = 0; i < total; i += 1) {
    const unpaid = i < belum
    if (!unpaid) {
      mitra.push({ name: MITRA[i % MITRA.length], tagihan: ANGSURAN, bayar: ANGSURAN })
      continue
    }
    const partial = r() < 0.35
    mitra.push({
      name: MITRA[i % MITRA.length],
      tagihan: ANGSURAN,
      bayar: partial ? Math.round((ANGSURAN * (0.3 + r() * 0.4)) / 1000) * 1000 : 0,
      reason: REASONS[Math.floor(r() * REASONS.length)],
      janji: JANJI[Math.floor(r() * JANJI.length)],
    })
  }
  return { hadir: total - Math.floor(r() * 3), total, mitra }
}

/** The same record for a single home visit — one mitra, one outcome. */
export function homeOutcome(task: Task): MitraOutcome & { alamat: string } {
  const r = seed(task.id)
  const paid = r() < 0.4
  return {
    name: task.title,
    alamat: `Jl. ${task.place} No. ${10 + Math.floor(r() * 80)}`,
    tagihan: ANGSURAN * (2 + Math.floor(r() * 3)),
    bayar: paid ? Math.round((ANGSURAN * (1 + r() * 2)) / 1000) * 1000 : 0,
    reason: paid ? undefined : REASONS[Math.floor(r() * REASONS.length)],
    janji: paid ? undefined : JANJI[Math.floor(r() * JANJI.length)],
  }
}
