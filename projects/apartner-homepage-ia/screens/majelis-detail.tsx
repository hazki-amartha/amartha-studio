'use client'

// Detail Majelis — browse-only.
//
// What the group is, its status this week, and a mitra list that taps through to
// mitra-detail. The old inline "visit mode" (attendance + payment recorded on
// this page) is gone: on a kumpulan day a "Mulai kunjungan" banner now launches
// the standalone three-step Majelis visit flow (majelis-visit) instead of
// flipping this page into a form.

import { useState } from 'react'
import { Button, Card } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { mitraOf, rp, type Mitra } from '../lib/data'
import { IconChat, IconChevL, IconInfo, IconPin, IconSearch } from '../lib/icons'
import { activeMembers, paidOf, paymentStatus, selectedMajelis, store, useApp, weeklyOf } from '../lib/store'
import { EmptyState } from '../lib/ui'
import { VisitMitraCard } from '../lib/visit-ui'

type MajFilter = 'all' | 'notpaid' | 'paid' | 'pending'

const MAJ_FILTERS: { k: MajFilter; l: string }[] = [
  { k: 'all', l: 'Semua' },
  { k: 'notpaid', l: 'Belum bayar' },
  { k: 'paid', l: 'Sudah bayar' },
  { k: 'pending', l: 'Pengajuan' },
]

export function MajelisDetailScreen() {
  const flow = useFlow()
  const s = useApp()
  const g = selectedMajelis(s)

  const [mq, setMq] = useState('')
  const [filter, setFilter] = useState<MajFilter>('all')
  const [infoOpen, setInfoOpen] = useState(false)

  const mq2 = mq.trim().toLowerCase()
  const all = mitraOf(g.n)
  const active = activeMembers(g.n)

  const totalDue = active.reduce((sum, m) => sum + weeklyOf(m), 0)
  const collectedRp = active.reduce((sum, m) => sum + paidOf(s, m), 0)
  const paidCount = active.filter((m) => {
    const st = paymentStatus(s, m)
    return st === 'lunas' || st === 'sebagian'
  }).length
  const attendCount = active.filter((m) => s.attendance[m.n] === 'hadir').length

  function matchesFilter(m: Mitra) {
    if (filter === 'all') return true
    if (filter === 'pending') return Boolean(m.pending)
    if (filter === 'paid') return !m.pending && m.dpd === 0
    if (filter === 'notpaid') return !m.pending && m.dpd > 0
    return true
  }

  const list = all
    .filter((m) => !mq2 || m.n.toLowerCase().includes(mq2))
    .filter(matchesFilter)
    .sort((a, b) => (b.dpd || 0) - (a.dpd || 0))

  const isKumpulanDay = Boolean(g.kumpulanToday)

  function openMitra(m: Mitra) {
    store.set({ selMitra: m.n })
    flow.go('mitra-detail')
  }

  function startVisit() {
    store.openMajelisVisit(g.n)
    flow.go('majelis-visit')
  }

  return (
    <Screen topBar={<Header title={g.n} sub={g.day} infoOpen={infoOpen} onToggleInfo={() => setInfoOpen((v) => !v)} onBack={flow.back} />}>
      {infoOpen ? (
        <Card className="flex flex-col gap-12">
          <div className="flex items-start gap-8">
            <span className="mt-2 shrink-0 text-disabled">
              <IconPin size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-10 text-disabled">Lokasi kumpulan</p>
              <p className="mt-2 text-12 text-default">{g.lokasi}</p>
              <button type="button" className="mt-2 text-12 font-bold text-link">
                Buka peta
              </button>
            </div>
          </div>
          <div className="flex items-start gap-8 border-t border-light pt-12">
            <span className="mt-2 shrink-0 text-disabled">
              <IconChat size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-10 text-disabled">Grup WhatsApp</p>
              <p className="mt-2 break-words text-12 text-default">{g.wa}</p>
              <button type="button" className="mt-2 text-12 font-bold text-link">
                Buka grup
              </button>
            </div>
          </div>
        </Card>
      ) : null}

      {isKumpulanDay ? (
        <div className="-mx-16 flex items-center gap-8 border-b border-primary-200 bg-primary-50 px-16 py-8">
          <div className="min-w-0 flex-1">
            <p className="text-14 font-bold text-primary-600">Jadwal kumpulan hari ini</p>
            <p className="mt-2 text-10 text-caption">
              {g.day} · {g.area}
            </p>
          </div>
          <Button size="sm" onClick={startVisit}>
            Mulai kunjungan
          </Button>
        </div>
      ) : null}

      {/* Status minggu ini */}
      <section className="flex flex-col gap-8">
        <h2 className="text-14 font-bold text-default">Status minggu ini</h2>
        <Card flush>
          <StatusRow label="Sudah bayar" value={`${paidCount} / ${active.length} mitra`} good={paidCount === active.length} />
          <StatusRow
            label="Penagihan"
            value={`${rp(collectedRp)} dari ${rp(totalDue)}`}
            good={collectedRp >= totalDue}
            warn={collectedRp < totalDue}
          />
          <StatusRow
            label="Kehadiran"
            value={attendCount > 0 ? `${attendCount} / ${active.length} hadir` : 'Pending'}
            muted={attendCount === 0}
            last
          />
        </Card>
      </section>

      {/* Daftar Mitra */}
      <section className="flex flex-col gap-8 pb-16">
        <h2 className="text-14 font-bold text-default">Daftar Mitra</h2>

        <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8">
          <span className="shrink-0 text-disabled">
            <IconSearch size={16} />
          </span>
          <input
            value={mq}
            onChange={(e) => setMq(e.target.value)}
            placeholder={`Cari mitra di ${g.n}`}
            className="min-w-0 flex-1 bg-transparent text-12 text-default outline-none placeholder:text-placeholder"
          />
          {mq ? (
            <button type="button" onClick={() => setMq('')} className="shrink-0 text-10 font-bold text-link">
              Hapus
            </button>
          ) : null}
        </div>

        <div className="flex gap-4 overflow-x-auto">
          {MAJ_FILTERS.map((f) => {
            const on = filter === f.k
            return (
              <button
                key={f.k}
                type="button"
                onClick={() => setFilter(f.k)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-12 py-4 text-12 font-bold ${
                  on ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-default bg-neutral-white text-neutral-600'
                }`}
              >
                {f.l}
              </button>
            )
          })}
        </div>

        <p className="text-12 text-caption">
          {mq2 || filter !== 'all' ? `${list.length} dari ${all.length} mitra` : `${all.length} mitra`}
        </p>

        {list.length === 0 ? (
          <EmptyState title="Tidak ada mitra" body="Coba ubah filter atau kata kunci." />
        ) : (
          <ul className="flex flex-col gap-8">
            {list.map((m) => (
              <li key={m.n}>
                <VisitMitraCard mitra={m} onOpen={() => openMitra(m)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Screen>
  )
}

function Header({
  title,
  sub,
  infoOpen,
  onToggleInfo,
  onBack,
}: {
  title: string
  sub?: string
  infoOpen?: boolean
  onToggleInfo?: () => void
  onBack: () => void
}) {
  return (
    <header className="relative flex items-center gap-8 border-b border-default bg-neutral-white px-16 py-12">
      <button type="button" onClick={onBack} className="-ml-4 flex shrink-0 text-default">
        <IconChevL size={24} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-16 font-bold text-default">{title}</p>
        {sub ? <p className="text-12 text-caption">{sub}</p> : null}
      </div>
      {onToggleInfo ? (
        <button
          type="button"
          onClick={onToggleInfo}
          className={`flex shrink-0 items-center gap-4 rounded-full border px-12 py-4 text-12 font-bold ${
            infoOpen ? 'border-primary-500 bg-primary-500 text-neutral-white' : 'border-primary-200 bg-primary-50 text-primary-600'
          }`}
        >
          <IconInfo size={16} />
          Info
        </button>
      ) : null}
    </header>
  )
}

function StatusRow({
  label,
  value,
  good,
  warn,
  muted,
  last,
}: {
  label: string
  value: string
  good?: boolean
  warn?: boolean
  muted?: boolean
  last?: boolean
}) {
  const tone = muted ? 'text-disabled' : good ? 'text-green-600' : warn ? 'text-orange-700' : 'text-default'
  return (
    <div className={`flex items-center px-12 py-12 ${last ? '' : 'border-b border-light'}`}>
      <span className="flex-1 text-12 text-caption">{label}</span>
      <span className={`text-12 font-bold ${tone}`}>{value}</span>
    </div>
  )
}

