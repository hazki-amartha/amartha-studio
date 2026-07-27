'use client'

// Riwayat Penagihan — what has already been TRIED on a mitra who is behind.
//
// The mitra page could say what she owes and how she paid, but nothing about
// the effort spent chasing it. That is the one fact a BP needs to change the
// conversation at the door: "kami sudah empat kali ke rumah Ibu bulan ini, dan
// belum ada pembayaran" is a different sentence from "Ibu menunggak Rp650.000",
// and only the first one is hers to answer.
//
// It is also the handover. A mitra passed to another BP arrives with a DPD
// number and no story — every entry names WHO did it, so the new BP can see she
// is the third person to knock rather than repeating what two others already
// said. That is why the record is a list of attempts and not a counter.
//
// Mock data, authored per mitra in `EFFORTS` — a few representative attempts,
// not a realistic-scale log. Only mitra with DPD carry one; a lancar mitra has
// nothing to have been chased for, and the card doesn't render.

import { useState } from 'react'
import { Card } from '@/design-system/components'
import { House, Phone, Users, WhatsappLogo } from '@/design-system/icons'
import type { Mitra } from './data'
import { rupiah } from './data'
import { IconChevronRight } from './icons'

/** How the BP reached for her. Each one counts differently in the summary. */
export type EffortKind = 'kunjungan' | 'whatsapp' | 'telepon' | 'majelis'

export interface Effort {
  kind: EffortKind
  /** "14 Jul" — same short form the week grid uses. */
  date: string
  /** Who did it. The reason this is a list and not a tally. */
  by: string
  /** What came of it, in the words a BP would use out loud. */
  result: string
  /** What she said, or what the BP wrote down afterwards. */
  note?: string
}

const KIND: Record<EffortKind, { label: string; noun: string; icon: typeof House; ink: string }> = {
  kunjungan: { label: 'Kunjungan rumah', noun: 'kunjungan rumah', icon: House, ink: 'text-default' },
  whatsapp: { label: 'Pesan WhatsApp', noun: 'pesan WhatsApp', icon: WhatsappLogo, ink: 'text-green-500' },
  telepon: { label: 'Telepon', noun: 'telepon', icon: Phone, ink: 'text-primary-500' },
  majelis: { label: 'Ditagih di majelis', noun: 'penagihan di majelis', icon: Users, ink: 'text-default' },
}

// Newest first — the order the card reads them in, and the order a BP asks
// about them ("terakhir kapan?").
const EFFORTS: Record<string, Effort[]> = {
  // Rina — 34 hari, sudah dapat keringanan. The record explains WHY the relief
  // was approved, which is the thing a BP must not press against.
  m1: [
    {
      kind: 'kunjungan',
      date: '14 Jul',
      by: 'Rani (BP)',
      result: 'Tidak bertemu',
      note: 'Warung tutup, tetangga bilang Ibu ke pasar sampai sore.',
    },
    {
      kind: 'whatsapp',
      date: '10 Jul',
      by: 'Rani (BP)',
      result: 'Dibaca, tidak dibalas',
    },
    {
      kind: 'kunjungan',
      date: '7 Jul',
      by: 'Rani (BP)',
      result: 'Bayar sebagian Rp150.000',
      note: 'Dagangan sepi sejak anak masuk sekolah. Diajukan keringanan.',
    },
    {
      kind: 'majelis',
      date: '30 Jun',
      by: 'Rani (BP)',
      result: 'Tidak bayar',
      note: 'Hadir di pelayanan tapi tidak membawa uang.',
    },
  ],
  // Ani — 7 hari, sudah janji bayar. Two attempts and a promise: the ordinary
  // case, where the card's job is to stop the BP asking for a date she has.
  m2: [
    {
      kind: 'telepon',
      date: '18 Jul',
      by: 'Rani (BP)',
      result: 'Janji bayar 24 Jul',
      note: 'Menunggu setoran dari pembeli, minta ditagih setelah tanggal 24.',
    },
    {
      kind: 'majelis',
      date: '14 Jul',
      by: 'Rani (BP)',
      result: 'Tidak bayar',
    },
  ],
  // Yanti — 14 hari, keringanan berjalan.
  m6: [
    {
      kind: 'whatsapp',
      date: '16 Jul',
      by: 'Rani (BP)',
      result: 'Dibalas, belum ada tanggal',
      note: 'Suami sedang sakit, biaya berobat dulu.',
    },
    {
      kind: 'majelis',
      date: '14 Jul',
      by: 'Rani (BP)',
      result: 'Tidak hadir',
    },
    {
      kind: 'kunjungan',
      date: '9 Jul',
      by: 'Rani (BP)',
      result: 'Bertemu, tidak bayar',
      note: 'Minta jadwal angsuran diringankan. Pengajuan keringanan disetujui.',
    },
  ],
  // Wati — 63 hari, dan mitra ini PINDAH TANGAN. Dua nama BP di satu daftar
  // adalah seluruh alasan kartu ini ada: yang baru bisa melihat dia orang
  // ketiga yang mengetuk, bukan yang pertama.
  h1: [
    {
      kind: 'telepon',
      date: '19 Jul',
      by: 'Rani (BP)',
      result: 'Janji bayar hari ini Rp500.000',
      note: 'Bersedia ditemui di rumah, minta pagi sebelum ke pasar.',
    },
    {
      kind: 'kunjungan',
      date: '12 Jul',
      by: 'Rani (BP)',
      result: 'Tidak bertemu',
      note: 'Rumah kosong. Titip pesan lewat anaknya.',
    },
    {
      kind: 'kunjungan',
      date: '28 Jun',
      by: 'Dedi (BP sebelumnya)',
      result: 'Bertemu, tidak bayar',
      note: 'Usaha katering berhenti, sedang cari pinjaman keluarga.',
    },
    {
      kind: 'whatsapp',
      date: '20 Jun',
      by: 'Dedi (BP sebelumnya)',
      result: 'Tidak dibaca',
    },
    {
      kind: 'kunjungan',
      date: '9 Jun',
      by: 'Dedi (BP sebelumnya)',
      result: 'Janji bayar 16 Jun',
      note: 'Janji tidak ditepati.',
    },
  ],
  // Elin — 7 hari, janji untuk hari ini.
  h2: [
    {
      kind: 'whatsapp',
      date: '20 Jul',
      by: 'Rani (BP)',
      result: 'Janji bayar hari ini Rp250.000',
    },
    {
      kind: 'telepon',
      date: '17 Jul',
      by: 'Rani (BP)',
      result: 'Tidak dijawab',
    },
  ],
}

export const effortsOf = (mitra: Mitra): Effort[] => EFFORTS[mitra.id] ?? []

/** "3 kunjungan rumah · 2 pesan WhatsApp" — the attempts, counted by channel. */
function breakdown(efforts: Effort[]): string {
  const order: EffortKind[] = ['kunjungan', 'majelis', 'telepon', 'whatsapp']
  return order
    .map((kind) => ({ kind, n: efforts.filter((e) => e.kind === kind).length }))
    .filter((c) => c.n > 0)
    .map((c) => `${c.n} ${KIND[c.kind].noun}`)
    .join(' · ')
}

/**
 * The collection record, under Riwayat Angsuran on the mitra page. Renders only
 * for a mitra with attempts on file — which is every mitra in DPD, and nobody
 * who is lancar.
 *
 * Three parts, in the order they are said: the COUNT ("sudah 4 kali ditagih
 * dalam 34 hari" — the sentence the BP opens with), the PROMISE on file if
 * there is one, and then the attempts themselves with what she said each time.
 * The promise sits above the list rather than in it, because it is the only row
 * here about the future: everything below it has already happened.
 *
 * The attempts are CLOSED by default, and the card is the count plus the
 * promise until they're asked for. Three entries with quoted notes ran taller
 * than the ledger above them, which put the page's longest block on the thing a
 * BP most often only needs the tally of — she says "sudah empat kali" from the
 * summary and opens the log only when the mitra argues with it. The count is on
 * the button too, so it's clear what's behind it without opening.
 */
export function PenagihanCard({ mitra }: { mitra: Mitra }) {
  const [open, setOpen] = useState(false)
  const efforts = effortsOf(mitra)
  if (efforts.length === 0) return null

  return (
    <Card>
      <div className="flex flex-col gap-12">
        <span className="text-16 font-bold text-default">Riwayat Penagihan</span>

        {/* The headline is the sentence, not a number in a tile: this card
            exists so a BP can say it out loud. The channels underneath are what
            makes it specific — four knocks and two messages is a different
            story from six messages. */}
        <div className="flex flex-col gap-2">
          <span className="text-14 font-bold text-default">
            Sudah {efforts.length} kali ditagih dalam {mitra.dpd} hari
          </span>
          <span className="text-12 text-caption">{breakdown(efforts)}</span>
        </div>

        <PtpRow mitra={mitra} />

        {open ? (
          <div className="flex flex-col gap-12">
            {efforts.map((e, i) => (
              <EffortRow key={`${e.date}-${e.kind}`} effort={e} first={i === 0} />
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="-mx-12 -mb-12 flex items-center justify-center gap-2 border-t border-default px-12 py-12 text-12 font-bold text-link"
        >
          {open ? 'Sembunyikan penagihan' : `Lihat ${efforts.length} penagihan`}
          <span className={open ? '-rotate-90' : 'rotate-90'}>
            <IconChevronRight size={16} />
          </span>
        </button>
      </div>
    </Card>
  )
}

/**
 * The janji bayar, as the one row here that faces forward. Tinted when there is
 * a promise — it is the thing the BP must not talk over — and drawn plainly
 * when there isn't, because "belum ada janji bayar" is itself the finding: four
 * visits and nothing committed is the case for escalating.
 */
function PtpRow({ mitra }: { mitra: Mitra }) {
  if (!mitra.ptp) {
    return (
      <div className="rounded-8 bg-neutral-50 px-12 py-8">
        <span className="text-12 text-caption">Belum ada janji bayar</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-12 rounded-8 bg-orange-50 px-12 py-8">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-10 text-caption">Janji bayar</span>
        <span className="text-14 font-bold text-orange-500">{mitra.ptp}</span>
      </div>
      {mitra.ptpAmount ? (
        <span className="shrink-0 text-14 font-bold text-orange-500">
          {rupiah(mitra.ptpAmount)}
        </span>
      ) : null}
    </div>
  )
}

/**
 * One attempt: the channel as a tile, the outcome as the sentence, the date and
 * the BP who did it as its caption, and whatever she said in a quiet block
 * underneath. The note is set apart rather than run on, because it is HER words
 * and the rest of the row is the app's.
 */
function EffortRow({ effort, first }: { effort: Effort; first?: boolean }) {
  const kind = KIND[effort.kind]
  const Glyph = kind.icon
  return (
    <div className={`flex gap-12 ${first ? '' : '-mx-12 border-t border-default px-12 pt-12'}`}>
      <span
        className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-8 bg-neutral-50 ${kind.ink}`}
      >
        <Glyph size={16} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <span className="text-14 font-bold text-default">{effort.result}</span>
        <span className="text-12 text-caption">
          {kind.label} · {effort.date} · {effort.by}
        </span>
        {effort.note ? (
          <span className="rounded-8 bg-neutral-50 px-12 py-8 text-12 text-default">
            {effort.note}
          </span>
        ) : null}
      </div>
    </div>
  )
}
