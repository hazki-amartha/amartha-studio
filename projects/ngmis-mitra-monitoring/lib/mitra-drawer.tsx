'use client'

// The BP drawer — opened from a BP's name. Slides in from the right, full height:
// the BP's mitra on the left (search, DPD and majelis filters, each card
// previewing her last two tindakan and her follow-up), and one mitra's full
// tindakan history on the right, the first mitra open by default.

import { useEffect, useState, type ReactNode } from 'react'
import { Badge, Button, Input } from '@/design-system/components'
import {
  CheckCircleFill,
  ChecklistDocFill,
  ChevronRight,
  Cross,
  CrossCircleFill,
  DownloadSimple,
  House,
  WarningFill,
  Prohibit,
  MagnifyingGlass,
  Phone,
} from '@/design-system/icons'
import { Select } from './ui'
import { BUCKETS, rupiah } from './data'
import { useRole } from './store'
import { WriteOffForm, type WriteOffAnswer } from './write-off-dialog'
import { bucketNow, tunggakanNow, type DrawerMitra, type PaymentStatus, type Tindakan } from './drawer-data'

const LIST_W = 520
const DETAIL_W = 520
const TOAST_MS = 3000
const DRAWER_W = LIST_W + DETAIL_W

const PAYMENT: { id: PaymentStatus; label: string; dot: string }[] = [
  { id: 'full', label: 'Full payment', dot: 'bg-green-500' },
  { id: 'partial', label: 'Partial payment', dot: 'bg-yellow-500' },
  { id: 'none', label: 'Not paying', dot: 'bg-red-500' },
]

const bucketOf = (id: string) => BUCKETS.find((b) => b.id === id)!

function Hasil({ t }: { t: Tindakan }) {
  const color = t.ok === null ? 'text-caption' : 'text-default'
  return (
    <span className={`flex items-center gap-4 text-12 ${color}`}>
      {t.ok === true ? (
        <span className="text-green-500"><CheckCircleFill size={16} /></span>
      ) : t.ok === false ? (
        <span className="text-red-500"><CrossCircleFill size={16} /></span>
      ) : (
        <Prohibit size={16} />
      )}
      {t.hasil}
    </span>
  )
}

function TindakanRow({ t, payment }: { t: Tindakan; payment: PaymentStatus }) {
  return (
    <div className="flex items-start justify-between gap-12">
      <div className="flex flex-col gap-4">
        <span className="text-12 text-caption">{t.date}</span>
        <span className="flex items-center gap-8">
          <span className="w-24 shrink-0 text-12 font-bold text-caption">{t.pelaku}</span>
          <span className="text-14 font-bold text-default">{t.jenis}</span>
          <Hasil t={t} />
        </span>
        {t.catatan ? (
          <span className="text-12 text-caption">{t.catatan}</span>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-12 text-caption">Pembayaran:</span>
        {t.dibayar > 0 ? (
          <span className="flex items-center gap-8 text-14 font-bold text-default">
            <span
              className={`block size-8 rounded-full ${payment === 'full' ? 'bg-green-500' : 'bg-yellow-500'}`}
            />
            Rp{rupiah(t.dibayar)}
          </span>
        ) : (
          <span className="text-14 font-bold text-caption">Rp0</span>
        )}
        {t.catatanBayar ? <span className="pt-2 text-12 text-caption">{t.catatanBayar}</span> : null}
        {t.janji ? (
          <span className="pt-2 text-12 text-caption">
            Janji bayar {t.janji.date}, Rp{rupiah(t.janji.amount)}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function MitraCard({
  m,
  selected,
  onSelect,
}: {
  m: DrawerMitra
  selected: boolean
  onSelect: () => void
}) {
  const b = bucketOf(bucketNow(m))
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex shrink-0 flex-col overflow-hidden rounded-12 border bg-neutral-white text-left ${
        selected ? 'border-primary-500' : 'border-default hover:border-primary-500'
      }`}
    >
      <span className="flex items-start justify-between gap-12 p-16">
        <span className="flex flex-col gap-4">
          <span className="flex items-center gap-8">
            <span className="text-16 font-bold text-default">{m.name}</span>
            <Badge intent={b.intent} variant="outline" size="sm">{b.label}</Badge>
          </span>
          <span className="text-12 text-caption">{m.code} - {m.majelis}</span>
        </span>
        <span className="flex flex-col items-end gap-2">
          <span className="text-12 text-caption">Tunggakan</span>
          <span className="text-16 font-bold text-default">Rp{rupiah(tunggakanNow(m))}</span>
          <span className="text-12 text-caption">dari {m.loanIds.length} pinjaman</span>
        </span>
      </span>
      {m.tindakan.length > 0 ? (
      <span className="flex flex-col gap-16 border-t border-default bg-neutral-50 p-16">
        <span className="text-14 font-bold text-default">Tindakan terakhir</span>
        {m.tindakan.slice(0, 2).map((t, i) => (
          <div key={i} className={i === 0 ? 'border-b border-default pb-12' : ''}>
            <TindakanRow t={t} payment={m.payment} />
          </div>
        ))}
        {m.followUp && bucketNow(m) !== 'dpd0' ? (
        <span className="flex flex-col gap-4 rounded-8 border border-default bg-neutral-200 p-16">
          <span className="flex items-start justify-between gap-12 text-14 text-default">
            <span className="font-bold">Tindak lanjut:</span>
            <span className="text-right">{m.followUp}</span>
          </span>
          {m.followUpNote ? (
            <span className="text-right text-12 text-caption">{m.followUpNote}</span>
          ) : null}
        </span>
        ) : null}
      </span>
      ) : null}
    </button>
  )
}

function Stat({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-1 items-center justify-between gap-12 rounded-12 border border-default p-16">
      <span className="flex flex-col gap-2">
        <span className="text-16 font-bold text-default">{title}</span>
        <span className="text-12 text-caption">{sub}</span>
      </span>
      <span className="flex size-40 items-center justify-center rounded-full bg-neutral-100 text-default">
        {icon}
      </span>
    </div>
  )
}

function DetailPanel({
  m,
  proposed,
  onSuggest,
}: {
  m: DrawerMitra
  proposed: boolean
  onSuggest: () => void
}) {
  const role = useRole()
  const b = bucketOf(bucketNow(m))
  const calls = m.tindakan.filter((t) => t.jenis === 'Telepon')
  const visits = m.tindakan.filter((t) => t.jenis === 'Home visit')
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-16 overflow-y-auto p-24" style={{ maxWidth: DETAIL_W }}>
      <div className="flex items-start justify-between gap-16">
        <div className="flex flex-col gap-4">
          <span className="flex items-center gap-8">
            <span className="text-24 font-bold text-default">{m.name}</span>
            <Badge intent={b.intent} variant="outline" size="sm">{b.label}</Badge>
          </span>
          <span className="text-12 text-caption">
            Loan ID: <span className="text-link">{m.loanIds.join(', ')}</span>
          </span>
          <span className="text-12 text-caption">{m.code} - {m.majelis}</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-12 text-caption">Tunggakan</span>
          <span className="text-20 font-bold text-default">Rp{rupiah(tunggakanNow(m))}</span>
          {/* Only an HMB can suggest, and only for a DPD 90+ mitra. */}
          {role === 'hmb' && bucketNow(m) === 'dpd90' ? (
            proposed ? (
              <span className="pt-8">
                <button type="button" onClick={onSuggest} aria-label="Lihat usulan write off">
                  <Badge intent="neutral" variant="subtle" size="sm" trailingIcon={<ChevronRight size={16} />}>
                    Write off diusulkan
                  </Badge>
                </button>
              </span>
            ) : (
              <span className="pt-8">
                <Button variant="danger" size="sm" onClick={onSuggest}>
                  <span className="flex items-center gap-8">
                    <WarningFill size={16} />
                    Suggest write off
                  </span>
                </Button>
              </span>
            )
          ) : null}
        </div>
      </div>

      <span className="text-16 font-bold text-default">Riwayat tindakan</span>
      <div className="flex gap-16">
        <Stat
          icon={<Phone size={20} />}
          title={`${calls.length} telepon`}
          sub={`${calls.filter((t) => t.ok).length} dijawab`}
        />
        <Stat
          icon={<House size={20} />}
          title={`${visits.length} home visit`}
          sub={`${visits.filter((t) => t.ok).length} dapat ditemui`}
        />
      </div>

      {m.tindakan.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-12 py-48">
          <span className="flex size-48 items-center justify-center rounded-16 bg-neutral-100 text-placeholder">
            <ChecklistDocFill size={24} />
          </span>
          <span className="flex flex-col items-center gap-2">
            <span className="text-14 font-bold text-default">No history found</span>
            <span className="text-12 text-caption">No task has been done by FO to this mitra</span>
          </span>
        </div>
      ) : (
      <div className="flex flex-col">
        {m.tindakan.map((t, i) => (
          <div key={i} className="flex gap-12">
            {/* One unbroken line: each row draws its segment from its own dot's
                centre to the next row's dot centre (20px below the row's
                bottom), so the line meets every dot instead of floating. */}
            <div className="relative w-8 shrink-0">
              {i === m.tindakan.length - 1 ? null : (
                <span
                  className="absolute left-1/2 w-2 -translate-x-1/2 bg-neutral-200"
                  style={{ top: 20, bottom: -20 }}
                />
              )}
              <span
                className="absolute left-0 block size-8 rounded-full bg-primary-500"
                style={{ top: 16 }}
              />
            </div>
            <div className={`min-w-0 flex-1 py-12 ${i === m.tindakan.length - 1 ? '' : 'border-b border-default'}`}>
              <TindakanRow t={t} payment={m.payment} />
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}

export function MitraDrawer({
  bpName,
  roster,
  onClose,
}: {
  bpName: string
  roster: DrawerMitra[]
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [dpd, setDpd] = useState('all')
  const [majelis, setMajelis] = useState('all')
  const [janjiOnly, setJanjiOnly] = useState(false)
  const [selectedId, setSelectedId] = useState(roster[0]?.id)
  const [writeOffOpen, setWriteOffOpen] = useState(false)
  // What was sent, by mitra, so the page can be opened again and read back.
  const [proposals, setProposals] = useState<Record<string, WriteOffAnswer>>({})
  const [toast, setToast] = useState(false)

  // The confirmation lingers for three seconds, then goes by itself.
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(false), TOAST_MS)
    return () => clearTimeout(t)
  }, [toast])

  const majelisOptions = Array.from(new Set(roster.map((m) => m.majelis))).map((v) => ({
    value: v,
    label: v,
  }))
  const filtered = roster.filter(
    (m) =>
      (dpd === 'all' || bucketNow(m) === dpd) &&
      (majelis === 'all' || m.majelis === majelis) &&
      (!janjiOnly || (m.followUp && m.followUpNote && bucketNow(m) !== 'dpd0')) &&
      m.name.toLowerCase().includes(query.trim().toLowerCase()),
  )
  const selected = filtered.find((m) => m.id === selectedId) ?? filtered[0]
  const loans = filtered.reduce((n, m) => n + m.loanIds.length, 0)

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-overlay">
      <div
        className="flex h-full w-full flex-col bg-neutral-white"
        style={{ maxWidth: DRAWER_W }}
      >
        <div className="flex shrink-0 items-center justify-between gap-16 border-b border-default px-24 py-16">
          <span className="text-20 font-bold text-default">{bpName}</span>
          <span className="flex items-center gap-16">
            <Button variant="outline" size="sm" onClick={() => undefined}>
              <span className="flex items-center gap-8">
                <DownloadSimple size={16} />
                Download
              </span>
            </Button>
            <button type="button" aria-label="Tutup" onClick={onClose} className="text-default">
              <Cross size={20} />
            </button>
          </span>
        </div>

        <div className="relative flex min-h-0 flex-1">
          <div className="flex shrink-0 flex-col bg-neutral-50" style={{ width: LIST_W }}>
            <div className="flex shrink-0 flex-col gap-12 p-24 pb-0">
              <Input
                size="sm"
                prefix={<MagnifyingGlass size={16} />}
                placeholder="Cari mitra"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-12">
                <Select
                  label="Semua DPD"
                  value={dpd}
                  onChange={setDpd}
                  options={[{ value: 'all', label: 'Semua DPD' }, ...BUCKETS.map((b) => ({ value: b.id, label: b.label }))]}
                />
                <Select
                  label="Semua majelis"
                  value={majelis}
                  onChange={setMajelis}
                  options={[{ value: 'all', label: 'Semua majelis' }, ...majelisOptions]}
                />
                <label className="flex items-center gap-8 text-14 text-default">
                  <input
                    type="checkbox"
                    checked={janjiOnly}
                    onChange={(e) => setJanjiOnly(e.target.checked)}
                  />
                  Tampilkan janji bayar
                </label>
              </div>
              <span className="text-14 text-default">
                Total {loans} pinjaman dari {filtered.length} mitra ditampilkan
              </span>
              <div className="grid grid-cols-3 gap-12">
                {PAYMENT.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col gap-4 rounded-12 border border-default bg-neutral-white p-12"
                  >
                    <span className="flex items-center gap-8 text-12 text-caption">
                      <span className={`block size-8 rounded-full ${p.dot}`} />
                      {p.label}
                    </span>
                    <span className="text-20 font-bold text-default">
                      {filtered.filter((m) => m.payment === p.id).length}
                      <span className="text-12 font-regular text-caption"> mitra</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-16 overflow-y-auto p-24">
              {filtered.length === 0 ? (
                <span className="text-14 text-caption">Tidak ada mitra yang cocok.</span>
              ) : null}
              {filtered.map((m) => (
                <MitraCard
                  key={m.id}
                  m={m}
                  selected={selected?.id === m.id}
                  onSelect={() => setSelectedId(m.id)}
                />
              ))}
            </div>
          </div>
          {selected && writeOffOpen ? (
            <WriteOffForm
              mitra={selected}
              onClose={() => setWriteOffOpen(false)}
              submitted={proposals[selected.id]}
              onSubmit={(answer) => {
                setProposals((p) => ({ ...p, [selected.id]: answer }))
                setWriteOffOpen(false)
                setToast(true)
              }}
            />
          ) : selected ? (
            <DetailPanel
              m={selected}
              proposed={selected.id in proposals}
              onSuggest={() => setWriteOffOpen(true)}
            />
          ) : (
            <div className="flex-1" />
          )}
          {toast ? (
            <div
              role="status"
              className="absolute bottom-16 right-24 flex items-center justify-between gap-12 rounded-8 bg-neutral-900 px-16 py-12 text-14 text-neutral-white"
              style={{ width: DETAIL_W - 48 }}
            >
              Proposal to write off has been sent
              <button type="button" aria-label="Tutup" onClick={() => setToast(false)}>
                <Cross size={16} />
              </button>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-end border-t border-default px-24 py-16">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
