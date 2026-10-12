'use client'

// Sisa setor tunai — the BM's view of cash the BPs have collected but not yet
// settled: two headline figures, then one row per BP with what she still owes
// and how her last settlements went. "Lihat" opens the detail setoran drawer:
// each outstanding amount grouped by the majelis visit or home visit it came
// from. Mirrors the NGMIS 2026 "View remaining settlement" flow.

import { useState } from 'react'
import { Button } from '@/design-system/components'
import { SideSheet } from './ui'

type Late = 'red' | 'orange'

interface Entry {
  kind: 'Pelayanan' | 'Home visit'
  date: string
  /** The majelis (Pelayanan) or the mitra (Home visit). */
  title: string
  /** A Home visit also names the mitra's majelis. */
  majelis?: string
  amount: number
  late?: Late
  /** Per-mitra split of a Pelayanan's amount. */
  mitra?: { name: string; amount: number }[]
}

interface Petugas {
  name: string
  outstanding: number
  last: { label: string; note: string; tone?: Late }
  entries: Entry[]
}

const PETUGAS: Petugas[] = [
  {
    name: 'Sukma Ayuningrum',
    outstanding: 4_180_000,
    last: { label: 'Tepat waktu', note: 'Belum ada setoran terlambat' },
    entries: [
      {
        kind: 'Pelayanan', date: '7 Agu 2026', title: 'Majelis Anggrek', amount: 980_000,
        mitra: [
          { name: 'Sri Rahayu', amount: 400_000 },
          { name: 'Dewi Lestari', amount: 300_000 },
          { name: 'Ani Suryani', amount: 280_000 },
        ],
      },
      {
        kind: 'Pelayanan', date: '22 Agu 2026', title: 'Majelis Kenanga', amount: 2_400_000,
        mitra: [
          { name: 'Yuni Astuti', amount: 800_000 },
          { name: 'Retno Wulandari', amount: 700_000 },
          { name: 'Lestari', amount: 500_000 },
          { name: 'Fitriani', amount: 400_000 },
        ],
      },
      { kind: 'Home visit', date: '21 Agu 2026', title: 'Marlina', majelis: 'Majelis Mawar', amount: 800_000 },
    ],
  },
  {
    name: 'Diski Tafa Ilham',
    outstanding: 2_080_000,
    last: { label: '5 setoran terlambat', note: 'Melebihi 24 jam', tone: 'red' },
    entries: [
      {
        kind: 'Pelayanan', date: '20 Agu 2026', title: 'Majelis Melati', amount: 1_280_000, late: 'red',
        mitra: [
          { name: 'Sri Rahayu', amount: 600_000 },
          { name: 'Dewi Lestari', amount: 400_000 },
          { name: 'Ani Suryani', amount: 280_000 },
        ],
      },
      { kind: 'Home visit', date: '19 Agu 2026', title: 'Marlina', majelis: 'Majelis Mawar', amount: 800_000, late: 'red' },
    ],
  },
  {
    name: 'Cenli Cencen',
    outstanding: 1_500_000,
    last: { label: '2 setoran terlambat', note: 'Melebihi 16:00', tone: 'orange' },
    entries: [
      {
        kind: 'Pelayanan', date: '21 Agu 2026', title: 'Majelis Mawar', amount: 1_500_000, late: 'orange',
        mitra: [
          { name: 'Yuni Astuti', amount: 700_000 },
          { name: 'Lestari', amount: 500_000 },
          { name: 'Fitriani', amount: 300_000 },
        ],
      },
    ],
  },
  {
    name: 'Laili Maulidia',
    outstanding: 850_000,
    last: { label: '10 setoran terlambat', note: 'Melebihi 24 jam', tone: 'red' },
    entries: [
      { kind: 'Home visit', date: '20 Agu 2026', title: 'Retno Wulandari', majelis: 'Majelis Anggrek', amount: 850_000, late: 'red' },
    ],
  },
  {
    name: 'Ainur Rohmah',
    outstanding: 220_000,
    last: { label: '5 setoran terlambat', note: 'Melebihi 16:00', tone: 'orange' },
    entries: [
      {
        kind: 'Pelayanan', date: '22 Agu 2026', title: 'Majelis Dahlia', amount: 220_000, late: 'orange',
        mitra: [{ name: 'Ani Suryani', amount: 220_000 }],
      },
    ],
  },
]

const rp = (n: number) => `Rp${n.toLocaleString('id-ID')}`
const TOTAL = PETUGAS.reduce((n, p) => n + p.outstanding, 0)

const LATE_TEXT: Record<Late, { text: string; cls: string }> = {
  red: { text: 'Terlambat, melebihi 24 jam', cls: 'text-red-500' },
  orange: { text: 'Terlambat, melebihi 16:00', cls: 'text-orange-500' },
}

/** `initialBp` opens that petugas' detail straight away — the link from a BP's
 *  daily diagnosis lands here with her drawer already up. */
export function CashPage({ initialBp }: { initialBp?: string }) {
  const [open, setOpen] = useState<Petugas | null>(
    PETUGAS.find((p) => p.name === initialBp) ?? null,
  )

  return (
    <>
      <span className="pb-12 text-16 font-bold text-default">Sisa setoran</span>
      <div className="flex gap-16 pb-24">
        <div className="flex flex-1 flex-col gap-8 rounded-16 border border-default p-16">
          <span className="text-14 font-bold text-default">Belum disetor</span>
          <span className="text-24 font-bold text-default">{rp(TOTAL)}</span>
        </div>
        <div className="flex flex-1 flex-col gap-8 rounded-16 border border-default p-16">
          <span className="text-14 font-bold text-default">Belum setor</span>
          <span className="text-24 font-bold text-default">{PETUGAS.length} petugas</span>
        </div>
      </div>

      <span className="pb-12 text-16 font-bold text-default">Performa petugas</span>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: 720 }}>
          <colgroup>
            <col style={{ width: '32%' }} />
            <col style={{ width: '34%' }} />
            <col />
          </colgroup>
          <thead>
            <tr className="bg-neutral-200">
              <th className="rounded-l-8 px-12 py-12 text-14 font-regular text-default">Nama</th>
              <th className="px-12 py-12 text-14 font-regular text-default">Sisa setoran</th>
              <th className="rounded-r-8 px-12 py-12 text-14 font-regular text-default">Setoran terakhir</th>
            </tr>
          </thead>
          <tbody>
            {PETUGAS.map((p, i) => (
              <tr key={p.name} className={i % 2 === 1 ? 'bg-neutral-50' : 'bg-neutral-white'}>
                <td className="px-12 py-16 text-14 text-default">{p.name}</td>
                <td className="px-12 py-16">
                  <span className="flex items-center gap-16">
                    <span className="text-14 font-bold text-default">{rp(p.outstanding)}</span>
                    <Button variant="outline" size="sm" onClick={() => setOpen(p)}>
                      Lihat
                    </Button>
                  </span>
                </td>
                <td className="px-12 py-16">
                  <span className="block text-14 text-default">{p.last.label}</span>
                  <span
                    className={`block text-12 ${
                      p.last.tone === 'red'
                        ? 'text-red-500'
                        : p.last.tone === 'orange'
                          ? 'text-orange-500'
                          : 'text-caption'
                    }`}
                  >
                    {p.last.note}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? <SettlementDrawer petugas={open} onClose={() => setOpen(null)} /> : null}
    </>
  )
}

function SettlementDrawer({ petugas, onClose }: { petugas: Petugas; onClose: () => void }) {
  return (
    <SideSheet
      title="Detail setoran"
      description={petugas.name}
      onClose={onClose}
      footer={
        <span className="ml-auto">
          <Button variant="outline" size="md" onClick={onClose}>
            Tutup
          </Button>
        </span>
      }
    >
      <span className="text-14 text-default">Hubungi PST jika ada kesalahan nominal.</span>
      {petugas.entries.map((e) => (
        <EntryCard key={`${e.kind}-${e.date}-${e.title}`} e={e} />
      ))}
    </SideSheet>
  )
}

function EntryCard({ e }: { e: Entry }) {
  const late = e.late ? LATE_TEXT[e.late] : null
  return (
    <div className="flex flex-col overflow-hidden rounded-12 border border-default bg-neutral-white">
      <div className="flex flex-col gap-2 p-12">
        <span className="flex items-center justify-between gap-8 text-12 text-default">
          <span>
            {e.kind} · {e.date}
          </span>
          {late ? <span className={late.cls}>{late.text}</span> : null}
        </span>
        <span className="flex items-end justify-between gap-12">
          <span className="flex flex-col">
            <span className="text-16 font-bold text-default">{e.title}</span>
            {e.majelis ? <span className="text-12 text-default">{e.majelis}</span> : null}
          </span>
          <span className="text-16 font-bold text-default">{rp(e.amount)}</span>
        </span>
      </div>
      {e.mitra ? (
        <div className="flex flex-col bg-neutral-50 px-12">
          {e.mitra.map((m, i) => (
            <div
              key={m.name}
              className={`flex items-center justify-between py-12 text-14 text-default ${
                i > 0 ? 'border-t border-default' : ''
              }`}
            >
              <span>{m.name}</span>
              <span>{rp(m.amount)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
