'use client'

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card, Input, SelectableCard } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  mitraOf,
  mitraLoanInfo,
  offersCelengan,
  parseRp,
  ptpOptions,
  rp,
  type Majelis,
  type Mitra,
  type PtpOption,
} from '../lib/data'
import { IconCamera, IconChat, IconCheck, IconChevL, IconChevR, IconInfo, IconPin, IconSearch } from '../lib/icons'
import { selectedMajelis, store, useApp } from '../lib/store'
import { Avatar, ChipPicker, EmptyState } from '../lib/ui'

type MajFilter = 'all' | 'notpaid' | 'paid' | 'pending'

const MAJ_FILTERS: { k: MajFilter; l: string }[] = [
  { k: 'all', l: 'Semua' },
  { k: 'notpaid', l: 'Belum bayar' },
  { k: 'paid', l: 'Sudah bayar' },
  { k: 'pending', l: 'Pengajuan' },
]

export interface VisitRecord {
  attend?: boolean
  outcome?: 'paid-full' | 'paid-partial' | 'ptp' | null
  amount?: number | null
  ptp?: string | null
  remainder?: number | null
  renewalStarted?: boolean
  celenganOffered?: boolean
}

export function MajelisDetailScreen() {
  const flow = useFlow()
  const s = useApp()
  const g = selectedMajelis(s)

  const [mq, setMq] = useState('')
  const [filter, setFilter] = useState<MajFilter>('all')
  const [infoOpen, setInfoOpen] = useState(false)

  const [visit, setVisit] = useState(false)
  const [prep, setPrep] = useState({ geo: false, photo: false })
  const [records, setRecords] = useState<Record<string, VisitRecord>>({})
  const [submitted, setSubmitted] = useState(false)

  const mq2 = mq.trim().toLowerCase()
  const all = mitraOf(g.n)
  const activeMitra = all.filter((m) => !m.pending)

  const totalDue = activeMitra.reduce((sum, m) => sum + mitraLoanInfo(m).weekly, 0)
  const collectedRp = activeMitra.reduce((sum, m) => {
    const info = mitraLoanInfo(m)
    const r = records[m.n]
    if (m.dpd === 0) return sum + info.weekly
    if (r?.outcome === 'paid-full') return sum + (r.amount ?? info.weekly)
    if (r?.outcome === 'paid-partial') return sum + (r.amount ?? 0)
    return sum
  }, 0)
  const paidCount = activeMitra.filter(
    (m) => m.dpd === 0 || records[m.n]?.outcome === 'paid-full' || records[m.n]?.outcome === 'paid-partial',
  ).length
  const attendCount = Object.values(records).filter((r) => r.attend === true).length

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

  const additionalMitra = activeMitra.filter((m) => {
    const info = mitraLoanInfo(m)
    return info.nearRenewal || offersCelengan(m)
  })

  const isKumpulanDay = Boolean(g.kumpulanToday)
  function setRec(name: string, patch: Partial<VisitRecord>) {
    setRecords((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }))
  }

  function openMitra(m: Mitra) {
    store.set({ selMitra: m.n })
    flow.go('mitra-detail')
  }

  if (visit && submitted) {
    return (
      <Screen topBar={<Header title={g.n} onBack={() => setVisit(false)} />}>
        <Card className="flex flex-col items-center py-20 text-center">
          <span className="mb-12 flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-600">
            <IconCheck size={24} />
          </span>
          <p className="text-16 font-bold text-default">Kumpulan tersimpan</p>
          <p className="mt-4 text-12 text-caption">
            {attendCount} dari {activeMitra.length} mitra hadir · pembayaran &amp; janji bayar tercatat.
          </p>
          <Button className="mt-16 w-full" onClick={() => setVisit(false)}>
            Kembali ke halaman majelis
          </Button>
        </Card>
      </Screen>
    )
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

      {!visit && isKumpulanDay && !submitted ? (
        <div className="-mx-16 flex items-center gap-8 border-b border-primary-200 bg-primary-50 px-16 py-8">
          <div className="min-w-0 flex-1">
            <p className="text-14 font-bold text-primary-600">Jadwal kumpulan hari ini</p>
            <p className="mt-2 text-10 text-caption">
              {g.day} · {g.area}
            </p>
          </div>
          <Button size="sm" onClick={() => setVisit(true)}>
            Mulai kunjungan
          </Button>
        </div>
      ) : null}

      {!visit && submitted ? (
        <div className="-mx-16 flex items-center gap-8 border-b border-green-500 bg-green-50 px-16 py-8">
          <span className="shrink-0 text-green-600">
            <IconCheck size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-14 font-bold text-green-600">Kumpulan Done</p>
            <p className="mt-2 text-10 text-caption">
              {attendCount} dari {activeMitra.length} mitra hadir · tercatat
            </p>
          </div>
        </div>
      ) : null}

      {visit ? (
        <div className="-mx-16 flex items-center gap-8 border-b border-primary-200 bg-primary-50 px-16 py-8">
          <div className="min-w-0 flex-1">
            <p className="text-14 font-bold text-primary-600">Mode kunjungan kumpulan</p>
            <p className="mt-2 text-10 text-caption">Tandai kehadiran &amp; tagih pembayaran</p>
          </div>
          <button type="button" onClick={() => setVisit(false)} className="shrink-0 text-12 font-bold text-link">
            Keluar
          </button>
        </div>
      ) : null}

      {/* Status minggu ini */}
      <section className="flex flex-col gap-8">
        <h2 className="text-14 font-bold text-default">Status minggu ini</h2>
        <Card flush>
          <StatusRow label="Sudah bayar" value={`${paidCount} / ${activeMitra.length} mitra`} good={paidCount === activeMitra.length} />
          <StatusRow
            label="Penagihan"
            value={`${rp(collectedRp)} dari ${rp(totalDue)}`}
            good={collectedRp >= totalDue}
            warn={collectedRp < totalDue}
          />
          <StatusRow
            label="Kehadiran"
            value={visit || submitted ? `${attendCount} / ${activeMitra.length} hadir` : 'Pending'}
            muted={!visit && !submitted}
            last
          />
        </Card>
      </section>

      {/* Daftar Mitra */}
      <section className="flex flex-col gap-8">
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
                <MajelisMitraCard
                  m={m}
                  g={g}
                  visit={visit}
                  rec={records[m.n]}
                  onOpen={() => openMitra(m)}
                  setRec={(patch) => setRec(m.n, patch)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {visit && additionalMitra.length > 0 ? (
        <section className="flex flex-col gap-8">
          <div>
            <h2 className="text-14 font-bold text-default">Tugas tambahan</h2>
            <p className="text-12 text-caption">Penawaran untuk sebagian mitra saat kumpulan.</p>
          </div>
          <ul className="flex flex-col gap-8">
            {additionalMitra.map((m) => (
              <li key={m.n}>
                <AdditionalTaskCard m={m} g={g} rec={records[m.n]} setRec={(patch) => setRec(m.n, patch)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {visit ? (
        <section className="flex flex-col gap-8 pb-16">
          <h2 className="text-14 font-bold text-default">Rekam kumpulan</h2>
          <div className="flex gap-8">
            {(
              [
                { k: 'geo' as const, I: IconPin, l: 'Rekam lokasi' },
                { k: 'photo' as const, I: IconCamera, l: 'Ambil foto' },
              ]
            ).map((p) => {
              const done = prep[p.k]
              return (
                <button
                  key={p.k}
                  type="button"
                  onClick={() => setPrep((v) => ({ ...v, [p.k]: true }))}
                  className={`flex flex-1 flex-col items-center gap-4 rounded-8 border px-8 py-12 ${
                    done ? 'border-green-500 bg-green-50' : 'border-default bg-neutral-white'
                  }`}
                >
                  {done ? <IconCheck size={20} className="text-green-600" /> : <p.I size={20} className="text-disabled" />}
                  <span className={`text-12 font-bold ${done ? 'text-green-600' : 'text-neutral-700'}`}>
                    {done ? 'Selesai' : p.l}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      {visit ? (
        <div className="sticky bottom-0 z-10 -mx-16 mt-auto flex flex-col gap-4 border-t border-default bg-neutral-white px-16 py-12">
          <Button disabled={!prep.geo || !prep.photo} onClick={() => setSubmitted(true)}>
            Submit Kumpulan
          </Button>
          {!prep.geo || !prep.photo ? (
            <p className="text-center text-10 text-disabled">Rekam lokasi &amp; foto dulu sebelum submit.</p>
          ) : null}
        </div>
      ) : null}
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

// --- MajelisMitraCard --------------------------------------------------------
// Browse mode: tappable summary that opens the mitra page.
// Visit mode: always expanded, one line per task (attendance + payment).

function MajelisMitraCard({
  m,
  g,
  visit,
  rec,
  onOpen,
  setRec,
}: {
  m: Mitra
  g: Majelis
  visit: boolean
  rec?: VisitRecord
  onOpen: () => void
  setRec: (patch: Partial<VisitRecord>) => void
}) {
  const info = mitraLoanInfo(m)
  const isMenunggak = !m.pending && m.dpd > 0
  const isPending = Boolean(m.pending)
  const isKetua = Boolean(m.ketua)

  const tone = isMenunggak ? 'red' : isPending ? 'blue' : isKetua ? 'primary' : 'neutral'
  const statusText = isPending ? 'Pengajuan baru' : m.dpd === 0 ? 'DPD 0 · Lancar' : `DPD ${m.dpd}`
  const statusClass = isPending ? 'text-blue-700' : m.dpd === 0 ? 'text-green-600' : 'text-red-500'

  const paidThisWeek = m.dpd === 0 || rec?.outcome === 'paid-full' || rec?.outcome === 'paid-partial'
  const [payOpen, setPayOpen] = useState(false)
  const [payKind, setPayKind] = useState<'full' | 'partial' | 'notpaid' | null>(null)
  const [partialAmt, setPartialAmt] = useState('')
  const [ptpDay, setPtpDay] = useState<PtpOption | null>(null)
  const ptps = ptpOptions()

  function closePayDialog() {
    setPayOpen(false)
    setPayKind(null)
    setPartialAmt('')
    setPtpDay(null)
  }

  const partialValue = parseRp(partialAmt)
  const partialInvalid = partialValue <= 0 || partialValue > info.weekly
  const partialRemainder = info.weekly - partialValue
  const confirmDisabled =
    !payKind ||
    (payKind === 'partial' && (partialInvalid || !ptpDay)) ||
    (payKind === 'notpaid' && !ptpDay)

  function confirmPay() {
    if (payKind === 'full') {
      setRec({ outcome: 'paid-full', amount: info.weekly })
    } else if (payKind === 'partial' && ptpDay) {
      setRec({ outcome: 'paid-partial', amount: partialValue, ptp: ptpDay.date, remainder: partialRemainder })
    } else if (payKind === 'notpaid' && ptpDay) {
      setRec({ outcome: 'ptp', ptp: ptpDay.date })
    }
    closePayDialog()
  }

  return (
    <Card flush className={isMenunggak && !visit ? 'border-red-200' : undefined}>
      <button
        type="button"
        onClick={visit ? undefined : onOpen}
        className={`flex w-full items-center gap-8 p-12 text-left ${visit ? 'cursor-default' : ''}`}
      >
        <Avatar tone={tone} size={40}>
          {m.n.charAt(0)}
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-14 font-bold text-default">{m.n}</span>
            {isKetua ? <Badge intent="primary">Ketua</Badge> : null}
          </div>
          <p className={`text-10 font-bold ${statusClass}`}>{statusText}</p>
        </div>
        {!visit ? (
          <span className="shrink-0 text-placeholder">
            <IconChevR size={20} />
          </span>
        ) : null}
      </button>

      {!visit && !isPending ? (
        <div className="flex gap-8 px-12 pb-12">
          <div className="flex-1 rounded-8 bg-neutral-50 px-8 py-8">
            <p className="text-10 text-disabled">Outstanding</p>
            <p className="mt-2 text-12 font-bold text-default">{rp(info.outstanding)}</p>
            <p className="mt-2 text-10 text-disabled">dari {rp(info.total)}</p>
          </div>
          <div className="flex-1 rounded-8 bg-neutral-50 px-8 py-8">
            <p className="text-10 text-disabled">Angsuran / minggu</p>
            <p className="mt-2 text-12 font-bold text-default">{rp(info.weekly)}</p>
            <p className="mt-2 text-10 text-disabled">
              minggu ke-{info.week} / {info.tenor}
            </p>
          </div>
        </div>
      ) : null}

      {visit && !isPending ? (
        <div className="flex flex-col gap-12 border-t border-light px-12 pb-12 pt-8">
          <div className="flex items-center gap-8">
            <span className="flex-1 text-12 text-neutral-700">Kehadiran</span>
            <ChipPicker
              options={[
                { l: 'Hadir', v: 'yes' },
                { l: 'Tidak', v: 'no' },
              ]}
              value={rec?.attend === true ? 'yes' : rec?.attend === false ? 'no' : null}
              onPick={(v) => setRec({ attend: v === 'yes' })}
            />
          </div>

          <div className="flex items-center gap-8 border-t border-light pt-12">
            <div className="min-w-0 flex-1">
              <p className="text-12 text-neutral-700">Pembayaran</p>
              <p className="mt-2 text-10 text-disabled">{rp(info.weekly)} / minggu</p>
            </div>
            {paidThisWeek ? (
              rec?.outcome === 'paid-partial' ? (
                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-right">
                    <Badge intent="orange">Sebagian {rp(rec.amount ?? 0)}</Badge>
                    {rec.ptp ? <p className="mt-2 text-10 text-disabled">Sisa janji {rec.ptp}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRec({ outcome: null, amount: null, ptp: null, remainder: null })}
                    className="text-10 font-bold text-link"
                  >
                    Ubah
                  </button>
                </div>
              ) : (
                <Badge intent="green">{rec?.outcome === 'paid-full' ? 'Tertagih' : 'Lunas'}</Badge>
              )
            ) : rec?.outcome === 'ptp' ? (
              <div className="flex items-center gap-4">
                <Badge intent="orange">Janji {rec.ptp}</Badge>
                <button type="button" onClick={() => setRec({ outcome: null, ptp: null })} className="text-10 font-bold text-link">
                  Ubah
                </button>
              </div>
            ) : (
              <Button size="xs" onClick={() => setPayOpen(true)}>
                Tagih
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {visit && isPending ? (
        <p className="px-12 pb-12 text-10 text-disabled">Pengajuan baru — belum ada tagihan.</p>
      ) : null}

      <BottomSheet
        open={payOpen}
        onClose={closePayDialog}
        title="Pembayaran mitra"
        description={`Tagihan minggu ini: ${rp(info.weekly)}`}
        primaryAction={
          <Button disabled={confirmDisabled} onClick={confirmPay}>
            {payKind === 'notpaid' ? 'Simpan janji bayar' : payKind === 'partial' ? 'Simpan bayar & janji' : 'Konfirmasi pembayaran'}
          </Button>
        }
        size="md"
      >
        {/* Form content belongs in the body, not `slot` — `slot` is the
            illustration surface (centered text on a primary-50 fill). */}
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-8">
              <SelectableCard
                name={`pay-${m.n}`}
                title="Bayar penuh"
                description={rp(info.weekly)}
                checked={payKind === 'full'}
                onChange={() => setPayKind('full')}
              />
              <SelectableCard
                name={`pay-${m.n}`}
                title="Bayar sebagian"
                description="Kurang dari tagihan"
                checked={payKind === 'partial'}
                onChange={() => setPayKind('partial')}
              />
              <SelectableCard
                name={`pay-${m.n}`}
                title="Belum bayar"
                description="Buat janji bayar (PTP)"
                checked={payKind === 'notpaid'}
                onChange={() => setPayKind('notpaid')}
              />
            </div>

            {payKind === 'partial' ? (
              <div className="flex flex-col gap-8">
                <Input
                  label="Jumlah diterima"
                  prefix="Rp"
                  placeholder="0"
                  inputMode="numeric"
                  value={partialAmt ? partialValue.toLocaleString('id-ID') : ''}
                  onChange={(e) => setPartialAmt(e.target.value)}
                  state={partialValue > info.weekly ? 'error' : undefined}
                  helperText={
                    partialValue > info.weekly
                      ? 'Jumlah melebihi tagihan minggu ini.'
                      : partialValue > 0
                        ? `Sisa ${rp(partialRemainder)} — buat janji bayar untuk sisanya di bawah.`
                        : undefined
                  }
                />
                {partialValue > 0 && partialValue < info.weekly ? (
                  <div>
                    <p className="mb-4 text-10 text-disabled">Kapan mitra bayar sisanya?</p>
                    <ChipPicker
                      options={ptps.map((o) => ({ l: `${o.l} (${o.date})`, v: String(o.day) }))}
                      value={ptpDay ? String(ptpDay.day) : null}
                      onPick={(v) => setPtpDay(ptps.find((o) => String(o.day) === v) ?? null)}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {payKind === 'notpaid' ? (
              <div>
                <p className="mb-4 text-10 text-disabled">Kapan mitra berjanji bayar?</p>
                <ChipPicker
                  options={ptps.map((o) => ({ l: `${o.l} (${o.date})`, v: String(o.day) }))}
                  value={ptpDay ? String(ptpDay.day) : null}
                  onPick={(v) => setPtpDay(ptps.find((o) => String(o.day) === v) ?? null)}
                />
              </div>
            ) : null}
        </div>
      </BottomSheet>
    </Card>
  )
}

// --- AdditionalTaskCard --------------------------------------------------
// Renewal / celengan offers surfaced during a visit.

function AdditionalTaskCard({
  m,
  g,
  rec,
  setRec,
}: {
  m: Mitra
  g: Majelis
  rec?: VisitRecord
  setRec: (patch: Partial<VisitRecord>) => void
}) {
  const info = mitraLoanInfo(m)

  function startRenewal() {
    store.addTask({
      id: `renewal-${m.n}-${info.week}`,
      act: 'Pencairan Ulang',
      who: m.n,
      maj: m.m,
      time: 'Belum dijadwalkan',
      loc: g.area,
      types: ['Disbursement'],
      meta: `Renewal · minggu ke-${info.week}`,
      day: 0,
      kind: 'rekomendasi',
    })
    setRec({ renewalStarted: true })
  }

  function offerCelengan() {
    store.addTask({
      id: `celengan-${m.n}`,
      act: 'Tawarkan Celengan',
      who: m.n,
      maj: m.m,
      time: 'Belum dijadwalkan',
      loc: g.area,
      types: ['Cross-sell'],
      meta: 'Top-up Celengan',
      day: 0,
      kind: 'rekomendasi',
    })
    setRec({ celenganOffered: true })
  }

  return (
    <Card>
      <div className="flex items-center gap-8">
        <Avatar tone="primary" size={32}>
          {m.n.charAt(0)}
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-14 font-bold text-default">{m.n}</p>
          <p className="mt-2 text-10 text-disabled">
            minggu ke-{info.week} / {info.tenor}
          </p>
        </div>
      </div>

      {info.nearRenewal ? (
        <div className="mt-8 rounded-8 border border-primary-200 bg-primary-50 px-12 py-8">
          <p className="text-12 font-bold text-primary-600">Pinjaman hampir lunas</p>
          <p className="mt-2 text-10 text-caption">Tawarkan pencairan ulang untuk siklus berikutnya.</p>
          {rec?.renewalStarted ? (
            <p className="mt-8 text-12 font-bold text-green-600">✓ Renewal dimulai</p>
          ) : (
            <Button size="xs" className="mt-8 w-full" onClick={startRenewal}>
              Mulai renewal
            </Button>
          )}
        </div>
      ) : null}

      {offersCelengan(m) ? (
        <div className="mt-8 rounded-8 border border-green-500 bg-green-50 px-12 py-8">
          <p className="text-12 font-bold text-green-600">Belum punya Celengan</p>
          <p className="mt-2 text-10 text-caption">Repayment lancar — tawarkan buka/top-up Celengan.</p>
          {rec?.celenganOffered ? (
            <p className="mt-8 text-12 font-bold text-green-600">✓ Sudah ditawarkan</p>
          ) : (
            <Button variant="outline" size="xs" className="mt-8 w-full" onClick={offerCelengan}>
              Tawarkan Top-up Celengan
            </Button>
          )}
        </div>
      ) : null}
    </Card>
  )
}
