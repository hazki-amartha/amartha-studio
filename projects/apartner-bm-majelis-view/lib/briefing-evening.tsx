'use client'

// The evening briefing's data and its three worked steps.
//
// The morning briefing asks "what is the branch going to do today"; this one
// asks "what did it actually do". So every figure here is a PAIR — awal hari
// and setelah closing — rather than a single reading: a DPD bucket that stands
// at 19 tonight means nothing without the 21 it started at, and the whole point
// of closing the day with seven BPs in the room is the movement between the
// two.
//
// The same axis as the morning: the branch total first, then each BP. And the
// same shorthand the BP app speaks — MV / HV / Sos / FU — so the BM is reading
// her BPs' own vocabulary back to them.
//
// Every branch figure is DERIVED from the seven BP rows, and every "setelah
// closing" count is derived from the named mitra who moved. Only the starting
// counts and the movements are authored, so the arithmetic on screen cannot
// disagree with the breakdown under it.

import { useState, type ReactNode } from 'react'
import { rupiah } from './data'
import { BUSINESS_PARTNERS } from './bp'
import { KIND_TONE, type BpTaskKind } from './briefing-live'
import { IconChevronDown, IconChevronUp } from './icons'
import { EmptyState, StepSectionTitle } from './ui'

// --- Step 1 · Tugas selesai -------------------------------------------------

/** One BP's day, counted. The branch card is the sum of the seven. */
export interface TaskCounts {
  mv: { selesai: number; hadir: number; tidakHadir: number; dilewati: number }
  hv: { bertemuMitra: number; bertemuLain: number; tidakBertemu: number }
  sos: { selesai: number; dijadwalkanUlang: number }
  fu: { dilakukan: number; dijadwalkanUlang: number }
}

/** In roll-call order. Authored per BP, never per branch — see the header. */
const TASK_COUNTS: TaskCounts[] = [
  {
    mv: { selesai: 4, hadir: 62, tidakHadir: 6, dilewati: 1 },
    hv: { bertemuMitra: 2, bertemuLain: 1, tidakBertemu: 0 },
    sos: { selesai: 1, dijadwalkanUlang: 0 },
    fu: { dilakukan: 0, dijadwalkanUlang: 0 },
  },
  {
    mv: { selesai: 4, hadir: 64, tidakHadir: 4, dilewati: 0 },
    hv: { bertemuMitra: 2, bertemuLain: 0, tidakBertemu: 1 },
    sos: { selesai: 0, dijadwalkanUlang: 0 },
    fu: { dilakukan: 1, dijadwalkanUlang: 0 },
  },
  {
    mv: { selesai: 4, hadir: 58, tidakHadir: 9, dilewati: 1 },
    hv: { bertemuMitra: 2, bertemuLain: 1, tidakBertemu: 0 },
    sos: { selesai: 1, dijadwalkanUlang: 0 },
    fu: { dilakukan: 1, dijadwalkanUlang: 0 },
  },
  {
    mv: { selesai: 4, hadir: 60, tidakHadir: 7, dilewati: 0 },
    hv: { bertemuMitra: 2, bertemuLain: 0, tidakBertemu: 1 },
    sos: { selesai: 0, dijadwalkanUlang: 0 },
    fu: { dilakukan: 0, dijadwalkanUlang: 1 },
  },
  {
    mv: { selesai: 4, hadir: 66, tidakHadir: 5, dilewati: 1 },
    hv: { bertemuMitra: 2, bertemuLain: 1, tidakBertemu: 0 },
    sos: { selesai: 0, dijadwalkanUlang: 1 },
    fu: { dilakukan: 1, dijadwalkanUlang: 0 },
  },
  {
    mv: { selesai: 4, hadir: 54, tidakHadir: 10, dilewati: 0 },
    hv: { bertemuMitra: 1, bertemuLain: 1, tidakBertemu: 1 },
    sos: { selesai: 1, dijadwalkanUlang: 0 },
    fu: { dilakukan: 0, dijadwalkanUlang: 1 },
  },
  {
    mv: { selesai: 4, hadir: 56, tidakHadir: 9, dilewati: 1 },
    hv: { bertemuMitra: 1, bertemuLain: 0, tidakBertemu: 1 },
    sos: { selesai: 0, dijadwalkanUlang: 0 },
    fu: { dilakukan: 1, dijadwalkanUlang: 0 },
  },
]

/** The branch's day: the seven added up, field by field. */
const totalCounts = (rows: TaskCounts[]): TaskCounts =>
  rows.reduce((a, r) => ({
    mv: {
      selesai: a.mv.selesai + r.mv.selesai,
      hadir: a.mv.hadir + r.mv.hadir,
      tidakHadir: a.mv.tidakHadir + r.mv.tidakHadir,
      dilewati: a.mv.dilewati + r.mv.dilewati,
    },
    hv: {
      bertemuMitra: a.hv.bertemuMitra + r.hv.bertemuMitra,
      bertemuLain: a.hv.bertemuLain + r.hv.bertemuLain,
      tidakBertemu: a.hv.tidakBertemu + r.hv.tidakBertemu,
    },
    sos: {
      selesai: a.sos.selesai + r.sos.selesai,
      dijadwalkanUlang: a.sos.dijadwalkanUlang + r.sos.dijadwalkanUlang,
    },
    fu: {
      dilakukan: a.fu.dilakukan + r.fu.dilakukan,
      dijadwalkanUlang: a.fu.dijadwalkanUlang + r.fu.dijadwalkanUlang,
    },
  }))

// --- Step 2 · Repayment ------------------------------------------------------

/**
 * A mitra who changed bucket today, and how. `via` is the stop that reached her
 * — an MV or an HV — because "she paid" and "she paid at the majelis" are
 * different facts to a BM deciding what to ask of her BP tomorrow. A `reason`
 * only rides on a mitra who did NOT pay: the answer she gave, from the same
 * fixed list the BP app records it with.
 */
export interface MitraMove {
  name: string
  via: 'MV' | 'HV'
  reason?: string
}

export interface BpRepayment {
  bpId: string
  /** Her month's collection target, and where the gap stood this morning. */
  target: number
  gapAwal: number
  /** What today's stops brought in — the gap closes by exactly this much. */
  masukHariIni: number
  /** Bucket counts as the day OPENED. Tonight's are derived from the moves. */
  dpd0Awal: number
  dpd17Awal: number
  dpd830Awal: number
  /** Out of DPD 0 — did not pay, so she is in 1–7 tonight. */
  dpd0Keluar: MitraMove[]
  /** Out of 1–7: paid (→ DPD 0) or did not (→ 8–30). */
  dpd17Lunas: MitraMove[]
  dpd17Keluar: MitraMove[]
  /** Out of 8–30: paid (→ DPD 0) or did not (→ 31–60). */
  dpd830Lunas: MitraMove[]
  dpd830Keluar: MitraMove[]
}

export const REPAYMENT_BP: BpRepayment[] = [
  {
    bpId: 'bp1',
    target: 130_000_000,
    gapAwal: 3_000_000,
    masukHariIni: 6_500_000,
    dpd0Awal: 3,
    dpd17Awal: 4,
    dpd830Awal: 2,
    dpd0Keluar: [{ name: 'Ibu Wati Nurhasanah', via: 'HV', reason: 'Usaha sedang sepi' }],
    dpd17Lunas: [{ name: 'Ibu Karti', via: 'MV' }],
    dpd17Keluar: [{ name: 'Ibu Darsih', via: 'MV', reason: 'Ada kebutuhan mendesak' }],
    dpd830Lunas: [],
    dpd830Keluar: [],
  },
  {
    bpId: 'bp2',
    target: 120_000_000,
    gapAwal: 2_000_000,
    masukHariIni: 6_000_000,
    dpd0Awal: 3,
    dpd17Awal: 3,
    dpd830Awal: 3,
    dpd0Keluar: [{ name: 'Ibu Enok', via: 'MV', reason: 'Sedang tidak di tempat' }],
    dpd17Lunas: [],
    dpd17Keluar: [],
    dpd830Lunas: [],
    dpd830Keluar: [{ name: 'Ibu Rohaeti', via: 'HV', reason: 'Menolak bayar' }],
  },
  {
    bpId: 'bp3',
    target: 150_000_000,
    gapAwal: 54_000_000,
    masukHariIni: 6_800_000,
    dpd0Awal: 3,
    dpd17Awal: 2,
    dpd830Awal: 2,
    dpd0Keluar: [{ name: 'Ibu Cicih', via: 'MV', reason: 'Sedang tidak di tempat' }],
    dpd17Lunas: [{ name: 'Ibu Elin Herlina', via: 'HV' }],
    dpd17Keluar: [],
    dpd830Lunas: [{ name: 'Ibu Nani', via: 'MV' }],
    dpd830Keluar: [],
  },
  {
    bpId: 'bp4',
    target: 110_000_000,
    gapAwal: 20_000_000,
    masukHariIni: 5_500_000,
    dpd0Awal: 3,
    dpd17Awal: 3,
    dpd830Awal: 2,
    dpd0Keluar: [{ name: 'Ibu Sumiati', via: 'MV', reason: 'Usaha sedang sepi' }],
    dpd17Lunas: [],
    dpd17Keluar: [{ name: 'Ibu Lilis', via: 'HV', reason: 'Sakit / keluarga sakit' }],
    dpd830Lunas: [],
    dpd830Keluar: [],
  },
  {
    bpId: 'bp5',
    target: 125_000_000,
    gapAwal: 7_000_000,
    masukHariIni: 6_200_000,
    dpd0Awal: 3,
    dpd17Awal: 2,
    dpd830Awal: 3,
    dpd0Keluar: [],
    dpd17Lunas: [],
    dpd17Keluar: [],
    dpd830Lunas: [{ name: 'Ibu Sari Bulan', via: 'HV' }],
    dpd830Keluar: [{ name: 'Ibu Nurlaela', via: 'HV', reason: 'Sedang tidak di tempat' }],
  },
  {
    bpId: 'bp6',
    target: 100_000_000,
    gapAwal: 42_000_000,
    masukHariIni: 4_400_000,
    dpd0Awal: 3,
    dpd17Awal: 3,
    dpd830Awal: 3,
    dpd0Keluar: [{ name: 'Ibu Iis', via: 'MV', reason: 'Ada kebutuhan mendesak' }],
    dpd17Lunas: [],
    dpd17Keluar: [{ name: 'Ibu Yuyun', via: 'HV', reason: 'Menolak bayar' }],
    dpd830Lunas: [],
    dpd830Keluar: [],
  },
  {
    bpId: 'bp7',
    target: 105_000_000,
    gapAwal: 54_000_000,
    masukHariIni: 4_100_000,
    dpd0Awal: 3,
    dpd17Awal: 2,
    dpd830Awal: 2,
    dpd0Keluar: [{ name: 'Ibu Marni', via: 'MV', reason: 'Usaha sedang sepi' }],
    dpd17Lunas: [],
    dpd17Keluar: [],
    dpd830Lunas: [],
    dpd830Keluar: [{ name: 'Ibu Juju', via: 'HV', reason: 'Menolak bayar' }],
  },
]

/**
 * Where a BP's three buckets stand tonight. A mitra never simply "changes
 * number": she leaves one bucket for a named other, so each closing count is
 * its opening count plus who arrived minus who left. Derived rather than
 * authored, so the card and the list it opens can never disagree.
 */
function bucketsOf(r: BpRepayment) {
  const dpd0 = r.dpd0Awal - r.dpd0Keluar.length + r.dpd17Lunas.length + r.dpd830Lunas.length
  const dpd17 = r.dpd17Awal + r.dpd0Keluar.length - r.dpd17Lunas.length - r.dpd17Keluar.length
  const dpd830 =
    r.dpd830Awal + r.dpd17Keluar.length - r.dpd830Lunas.length - r.dpd830Keluar.length
  return { dpd0, dpd17, dpd830 }
}

/** The branch's repayment day — the seven rows added up. */
const REPAYMENT_TOTAL = {
  /** Today's collection target, not the month's: the branch card asks how the
   *  DAY closed, which is the figure the BM is answering for tonight. */
  targetHariIni: 42_000_000,
  gapAwal: 13_600_000,
  gapAkhir: 2_500_000,
}

// --- Step 3 · Disbursement ---------------------------------------------------

/**
 * A stop that moved — or failed to move — today's disbursement. Three lists,
 * and the middle one is the reason there are three rather than two: a
 * sosialisasi that brought five leads is a good day's work that adds nothing to
 * tonight's figure, and filing it under "belum berhasil" would tell the BP she
 * wasted an afternoon.
 */
export interface DisbursementLine {
  /** The stop it happened on — "MV Majelis Kenanga", "Sosialisasi Ciseeng". */
  source: string
  /** The mitra or prospect, where there is one. */
  who?: string
  /** What came of it — an amount, an outcome, or a refusal with its reason. */
  outcome: string
}

export interface BpDisbursement {
  bpId: string
  target: number
  gapAwal: number
  gapAkhir: number
  /** Cair today — these are what closed the gap. */
  cair: DisbursementLine[]
  /** Real progress that does not land today: leads, a status change. */
  belumMasuk: DisbursementLine[]
  /** Did not happen, with the reason it did not. */
  gagal: DisbursementLine[]
}

export const DISBURSEMENT_BP: BpDisbursement[] = [
  {
    bpId: 'bp1',
    target: 4_000_000,
    gapAwal: 0,
    gapAkhir: 0,
    cair: [],
    belumMasuk: [
      {
        source: 'Sosialisasi Warung Bu Ida',
        outcome: '5 prospek baru untuk di-follow-up',
      },
    ],
    gagal: [
      {
        source: 'MV Majelis Mawar',
        who: 'Ibu Darsih',
        outcome: 'Belum mau cair — menunggu musim panen',
      },
    ],
  },
  {
    bpId: 'bp2',
    target: 3_800_000,
    gapAwal: 0,
    gapAkhir: 0,
    cair: [],
    belumMasuk: [
      { source: 'FU Ibu Ratna', outcome: 'Status menjadi “Siap diajukan”' },
    ],
    gagal: [
      {
        source: 'MV Majelis Melati',
        who: 'Ibu Wulan Sari',
        outcome: 'Belum mau cair — masih ada pinjaman lain',
      },
    ],
  },
  {
    bpId: 'bp3',
    target: 4_500_000,
    gapAwal: 3_300_000,
    gapAkhir: 1_500_000,
    cair: [
      { source: 'MV Majelis Kenanga', who: 'Ibu Enok', outcome: 'Cair Rp1.000.000' },
      { source: 'MV Majelis Kenanga', who: 'Ibu Nani', outcome: 'Cair Rp800.000' },
    ],
    belumMasuk: [
      { source: 'Sosialisasi Pengajian RW 02', outcome: '4 prospek baru untuk di-follow-up' },
    ],
    gagal: [],
  },
  {
    bpId: 'bp4',
    target: 3_500_000,
    gapAwal: 1_500_000,
    gapAkhir: 500_000,
    cair: [{ source: 'MV Majelis Teratai', who: 'Ibu Imas', outcome: 'Cair Rp1.000.000' }],
    belumMasuk: [],
    gagal: [
      {
        source: 'MV Majelis Krisan',
        who: 'Ibu Eem',
        outcome: 'Belum mau cair — menunggu keputusan suami',
      },
    ],
  },
  {
    bpId: 'bp5',
    target: 3_900_000,
    gapAwal: 800_000,
    gapAkhir: 0,
    cair: [{ source: 'MV Majelis Kenari', who: 'Ibu Ipah', outcome: 'Cair Rp800.000' }],
    belumMasuk: [{ source: 'FU Ibu Sumini', outcome: 'Status menjadi “Siap diajukan”' }],
    gagal: [],
  },
  {
    bpId: 'bp6',
    target: 3_300_000,
    gapAwal: 3_300_000,
    gapAkhir: 2_000_000,
    cair: [
      { source: 'MV Majelis Gardenia', who: 'Ibu Rohimah', outcome: 'Cair Rp800.000' },
      { source: 'MV Majelis Zinnia', who: 'Ibu Nengsih', outcome: 'Cair Rp500.000' },
    ],
    belumMasuk: [
      { source: 'Sosialisasi Posyandu Melati', outcome: '3 prospek baru untuk di-follow-up' },
    ],
    gagal: [],
  },
  {
    bpId: 'bp7',
    target: 3_100_000,
    gapAwal: 3_100_000,
    gapAkhir: 2_000_000,
    cair: [
      { source: 'MV Majelis Melur', who: 'Ibu Ecin', outcome: 'Cair Rp600.000' },
      { source: 'MV Majelis Bougenville', who: 'Ibu Wiwi', outcome: 'Cair Rp500.000' },
    ],
    belumMasuk: [],
    gagal: [
      {
        source: 'MV Majelis Sedap Malam',
        who: 'Ibu Odah',
        outcome: 'Belum mau cair — usaha sedang sepi',
      },
    ],
  },
]

const DISBURSEMENT_TOTAL = {
  target: 26_000_000,
  gapAwal: 12_000_000,
  gapAkhir: 6_000_000,
}

// === The steps ===============================================================
// Each one is the branch total, then the seven BPs, each under her own name —
// the same sectioned shape the morning briefing's books use, so the two
// briefings read as one app rather than two.

/** The branch total's section name, used as the first title in every step. */
const BRANCH = 'Total Branch Ciseeng'

/** Wraps one section — a title and its cards — with its place in the run. */
function Section({
  title,
  index,
  total,
  children,
}: {
  title: string
  index: number
  total: number
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-8">
      <StepSectionTitle trailing={`${index + 1} dari ${total}`}>{title}</StepSectionTitle>
      {children}
    </div>
  )
}

/** Step 1 — what the branch actually got done, by kind. */
export function TaskCompletionStep() {
  const rows = [totalCounts(TASK_COUNTS), ...TASK_COUNTS]
  const names = [BRANCH, ...BUSINESS_PARTNERS.map((bp) => bp.name)]

  return (
    <div className="flex flex-col gap-16">
      {rows.map((counts, i) => (
        <Section key={names[i]} title={names[i]} index={i} total={rows.length}>
          <TallyCard
            kind="MV"
            name="Majelis Visit"
            head={`${counts.mv.selesai} MV selesai`}
            rows={[
              { label: 'Mitra hadir', value: `${counts.mv.hadir}`, tone: 'green' },
              { label: 'Mitra tidak hadir', value: `${counts.mv.tidakHadir}`, tone: 'red' },
              { label: 'MV dilewati', value: `${counts.mv.dilewati}`, tone: 'red' },
            ]}
          />
          <TallyCard
            kind="HV"
            name="Home Visit"
            head={`${counts.hv.bertemuMitra + counts.hv.bertemuLain + counts.hv.tidakBertemu} HV dikunjungi`}
            rows={[
              { label: 'Bertemu mitra', value: `${counts.hv.bertemuMitra}`, tone: 'green' },
              { label: 'Bertemu orang lain', value: `${counts.hv.bertemuLain}` },
              { label: 'Tidak bertemu orang', value: `${counts.hv.tidakBertemu}`, tone: 'red' },
            ]}
          />
          <TallyCard
            kind="Sos"
            name="Sosialisasi"
            head={`${counts.sos.selesai} Sos selesai`}
            rows={[
              {
                label: 'Dijadwalkan ulang',
                value: `${counts.sos.dijadwalkanUlang}`,
                tone: counts.sos.dijadwalkanUlang > 0 ? 'red' : 'default',
              },
            ]}
          />
          <TallyCard
            kind="FU"
            name="Follow Up"
            head={`${counts.fu.dilakukan} FU dilakukan`}
            rows={[
              {
                label: 'Dijadwalkan ulang',
                value: `${counts.fu.dijadwalkanUlang}`,
                tone: counts.fu.dijadwalkanUlang > 0 ? 'red' : 'default',
              },
            ]}
          />
        </Section>
      ))}
    </div>
  )
}

/** Step 2 — the money in, and who moved between the DPD buckets to make it. */
export function RepaymentStep() {
  const total = REPAYMENT_BP.length + 1

  return (
    <div className="flex flex-col gap-16">
      <Section title={BRANCH} index={0} total={total}>
        <ChangeCard
          title="Target hari ini"
          awal={gapText(REPAYMENT_TOTAL.gapAwal)}
          akhir={gapText(REPAYMENT_TOTAL.gapAkhir)}
          better="down"
          improved={REPAYMENT_TOTAL.gapAkhir < REPAYMENT_TOTAL.gapAwal}
          footnote={`Target: ${rupiah(REPAYMENT_TOTAL.targetHariIni)}`}
        />
        <BucketCards rows={REPAYMENT_BP} />
      </Section>

      {REPAYMENT_BP.map((r, i) => {
        const bp = BUSINESS_PARTNERS.find((b) => b.id === r.bpId)
        const b = bucketsOf(r)
        const gapAkhir = Math.max(0, r.gapAwal - r.masukHariIni)
        return (
          <Section key={r.bpId} title={bp?.name ?? r.bpId} index={i + 1} total={total}>
            <ChangeCard
              title="Overall target"
              awal={gapText(r.gapAwal)}
              akhir={gapText(gapAkhir)}
              better="down"
              improved={gapAkhir < r.gapAwal}
              footnote={`Target: ${rupiah(r.target)}`}
            />
            <ChangeCard
              title="DPD 0"
              awal={`${r.dpd0Awal}`}
              akhir={`${b.dpd0}`}
              better="up"
              improved={b.dpd0 >= r.dpd0Awal}
            >
              <MoveList
                label="Tidak bayar — pindah ke DPD 1-7"
                tone="red"
                moves={r.dpd0Keluar}
              />
            </ChangeCard>
            <ChangeCard
              title="DPD 1-7"
              awal={`${r.dpd17Awal}`}
              akhir={`${b.dpd17}`}
              better="down"
              improved={b.dpd17 <= r.dpd17Awal}
            >
              <MoveList label="Bayar — pindah ke DPD 0" tone="green" moves={r.dpd17Lunas} />
              <MoveList
                label="Tidak bayar — pindah ke DPD 8-30"
                tone="red"
                moves={r.dpd17Keluar}
              />
            </ChangeCard>
            <ChangeCard
              title="DPD 8-30"
              awal={`${r.dpd830Awal}`}
              akhir={`${b.dpd830}`}
              better="down"
              improved={b.dpd830 <= r.dpd830Awal}
            >
              <MoveList label="Bayar — pindah ke DPD 0" tone="green" moves={r.dpd830Lunas} />
              <MoveList
                label="Tidak bayar — pindah ke DPD 31-60"
                tone="red"
                moves={r.dpd830Keluar}
              />
            </ChangeCard>
          </Section>
        )
      })}
    </div>
  )
}

/** The branch's three buckets — every BP's opening and closing counts summed. */
function BucketCards({ rows }: { rows: BpRepayment[] }) {
  const awal = rows.reduce(
    (a, r) => ({
      dpd0: a.dpd0 + r.dpd0Awal,
      dpd17: a.dpd17 + r.dpd17Awal,
      dpd830: a.dpd830 + r.dpd830Awal,
    }),
    { dpd0: 0, dpd17: 0, dpd830: 0 },
  )
  const akhir = rows.reduce(
    (a, r) => {
      const b = bucketsOf(r)
      return { dpd0: a.dpd0 + b.dpd0, dpd17: a.dpd17 + b.dpd17, dpd830: a.dpd830 + b.dpd830 }
    },
    { dpd0: 0, dpd17: 0, dpd830: 0 },
  )

  return (
    <>
      <ChangeCard
        title="DPD 0"
        awal={`${awal.dpd0}`}
        akhir={`${akhir.dpd0}`}
        better="up"
        improved={akhir.dpd0 >= awal.dpd0}
      />
      <ChangeCard
        title="DPD 1-7"
        awal={`${awal.dpd17}`}
        akhir={`${akhir.dpd17}`}
        better="down"
        improved={akhir.dpd17 <= awal.dpd17}
      />
      <ChangeCard
        title="DPD 8-30"
        awal={`${awal.dpd830}`}
        akhir={`${akhir.dpd830}`}
        better="down"
        improved={akhir.dpd830 <= awal.dpd830}
      />
    </>
  )
}

/** Step 3 — the day's disbursement, and the stops behind the movement. */
export function DisbursementStep() {
  const total = DISBURSEMENT_BP.length + 1

  return (
    <div className="flex flex-col gap-16">
      <Section title={BRANCH} index={0} total={total}>
        <ChangeCard
          title="Target hari ini"
          awal={gapText(DISBURSEMENT_TOTAL.gapAwal)}
          akhir={gapText(DISBURSEMENT_TOTAL.gapAkhir)}
          better="down"
          improved={DISBURSEMENT_TOTAL.gapAkhir < DISBURSEMENT_TOTAL.gapAwal}
          footnote={`Target: ${rupiah(DISBURSEMENT_TOTAL.target)}`}
        />
      </Section>

      {DISBURSEMENT_BP.map((d, i) => {
        const bp = BUSINESS_PARTNERS.find((b) => b.id === d.bpId)
        return (
          <Section key={d.bpId} title={bp?.name ?? d.bpId} index={i + 1} total={total}>
            <ChangeCard
              title="Target hari ini"
              awal={gapText(d.gapAwal)}
              akhir={gapText(d.gapAkhir)}
              better="down"
              improved={d.gapAkhir < d.gapAwal}
              footnote={`Target: ${rupiah(d.target)}`}
            >
              <LineList label="Berhasil — sudah menambah target" tone="green" lines={d.cair} />
              <LineList
                label="Berhasil — belum menambah target"
                tone="orange"
                lines={d.belumMasuk}
              />
              <LineList label="Belum berhasil" tone="red" lines={d.gagal} />
            </ChangeCard>
          </Section>
        )
      })}
    </div>
  )
}

/** Step 4 — the spec for it is the next conversation, so the page says so. */
export function SalesStep() {
  return (
    <EmptyState title="Belum ada isi" body="Bagian sales pada briefing sore menyusul." />
  )
}

// === The pieces ==============================================================

/** "Kurang Rp2.500.000", or the one line a BM wants to hear instead. */
const gapText = (gap: number): string =>
  gap > 0 ? `Kurang ${rupiah(gap)}` : 'Target tercapai'

/**
 * A count card for step 1: the kind's tile and name, the headline count under
 * it, then the breakdown as label/value rows.
 */
function TallyCard({
  kind,
  name,
  head,
  rows,
}: {
  kind: BpTaskKind
  name: string
  head: string
  rows: { label: string; value: string; tone?: 'default' | 'green' | 'red' }[]
}) {
  return (
    <div className="flex flex-col gap-12 rounded-12 border border-default bg-neutral-white p-12">
      <div className="flex items-center gap-12">
        <span
          className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-8 text-12 font-bold ${KIND_TONE[kind]}`}
        >
          {kind}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-12 font-regular text-caption">{name}</span>
          <span className="truncate text-16 font-bold text-default">{head}</span>
        </div>
      </div>
      <div className="flex flex-col gap-8 border-t border-default pt-12">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-12">
            <span className="min-w-0 flex-1 text-14 font-regular text-caption">{r.label}</span>
            <span className={`shrink-0 text-14 font-bold ${valueTone(r.tone)}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const valueTone = (tone?: 'default' | 'green' | 'red' | 'orange'): string =>
  tone === 'green'
    ? 'text-green-500'
    : tone === 'red'
      ? 'text-red-500'
      : tone === 'orange'
        ? 'text-orange-500'
        : 'text-default'

/**
 * The evening's one card shape: a figure as it stood this morning, and as it
 * stands after closing, side by side.
 *
 * Only the CLOSING figure is coloured, and it is coloured by whether the day
 * moved it the right way — which is not the same as its sign. A DPD 0 bucket
 * wants to grow and a DPD 8-30 bucket wants to shrink, so `better` says which
 * direction counts as good and the card colours accordingly. Awal hari stays
 * grey throughout: it is the baseline being measured from, not a result.
 */
function ChangeCard({
  title,
  awal,
  akhir,
  better,
  improved,
  footnote,
  children,
}: {
  title: string
  awal: string
  akhir: string
  /** Which way this figure has to move to be good news. */
  better: 'up' | 'down'
  improved: boolean
  footnote?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-12 rounded-12 border border-default bg-neutral-white p-12">
      <span className="text-14 font-bold text-default">{title}</span>
      <div className="flex items-end gap-12">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-12 font-regular text-caption">Awal hari</span>
          <span className="text-16 font-regular text-caption">{awal}</span>
        </div>
        <span className="shrink-0 pb-4 text-caption" aria-hidden>
          →
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-12 font-regular text-caption">Setelah closing</span>
          <span
            className={`text-16 font-bold ${improved ? 'text-green-500' : 'text-red-500'}`}
            aria-label={`Setelah closing ${akhir}, ${
              improved ? 'membaik' : better === 'up' ? 'turun' : 'naik'
            }`}
          >
            {akhir}
          </span>
        </div>
      </div>
      {footnote ? (
        <span className="text-14 font-regular text-caption">{footnote}</span>
      ) : null}
      {children}
    </div>
  )
}

/**
 * A named breakdown under a change card, collapsed to its count until she asks
 * for it. Seven BPs times three buckets is a lot of names to scroll past to
 * reach the one BP being discussed — and the count alone answers most of the
 * questions the card raises.
 *
 * A list with nothing in it draws nothing at all: "0 mitra" under a bucket that
 * did not move is a row that says only that it is empty.
 */
function Disclosure({
  label,
  tone,
  count,
  children,
}: {
  label: string
  tone: 'green' | 'red' | 'orange'
  count: number
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  if (count === 0) return null

  return (
    <div className="flex flex-col gap-8 border-t border-default pt-12">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-8 text-left active:opacity-70"
      >
        <span className={`min-w-0 flex-1 text-12 font-bold ${valueTone(tone)}`}>{label}</span>
        <span className="shrink-0 text-12 font-regular text-caption">{count}</span>
        <span className="shrink-0 text-disabled">
          {open ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
        </span>
      </button>
      {open ? <div className="flex flex-col gap-8">{children}</div> : null}
    </div>
  )
}

/** The mitra who crossed a bucket boundary today, with the stop that reached
 *  them and — where they did not pay — the answer they gave. */
function MoveList({
  label,
  tone,
  moves,
}: {
  label: string
  tone: 'green' | 'red'
  moves: MitraMove[]
}) {
  return (
    <Disclosure label={label} tone={tone} count={moves.length}>
      {moves.map((m) => (
        <div key={`${m.name}-${m.via}`} className="flex items-start gap-8">
          <span
            className={`shrink-0 rounded-8 px-8 py-2 text-12 font-bold ${KIND_TONE[m.via]}`}
          >
            {m.via}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate text-14 font-bold text-default">{m.name}</span>
            {m.reason ? (
              <span className="text-12 font-regular text-caption">{m.reason}</span>
            ) : null}
          </div>
        </div>
      ))}
    </Disclosure>
  )
}

/** The disbursement equivalent: the stop, who it was with, and what came of
 *  it. No chip — the stop names its own kind ("MV Majelis Kenanga"), and a
 *  sosialisasi has no mitra to hang a bucket move on. */
function LineList({
  label,
  tone,
  lines,
}: {
  label: string
  tone: 'green' | 'red' | 'orange'
  lines: DisbursementLine[]
}) {
  return (
    <Disclosure label={label} tone={tone} count={lines.length}>
      {lines.map((l) => (
        <div key={`${l.source}-${l.who ?? ''}-${l.outcome}`} className="flex flex-col gap-2">
          <span className="text-14 font-bold text-default">
            {l.who ? `${l.source} · ${l.who}` : l.source}
          </span>
          <span className="text-12 font-regular text-caption">{l.outcome}</span>
        </div>
      ))}
    </Disclosure>
  )
}
