'use client'

// The majelis page as a queue that drains, not a dashboard to read.
//
// A visit records exactly two things per mitra — attendance and payment — so
// every card carries exactly those two controls and nothing else. Payment is an
// amount, not a yes/no: partial payment is a normal field outcome, so "Terima"
// opens a sheet prefilled with the full instalment. Paying in full is two taps;
// paying part costs one edit. A mitra leaves the queue only once they are lunas,
// so a partial payment is visible as an unfinished row rather than a green tick.
//
// What the page deliberately does NOT show: portfolio percentages, a collection
// target, or per-mitra loan history. Those are things to interpret; this page
// only holds things to do. Loan history moves to the mitra page (not yet built).

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMajelis, rupiah, type Mitra } from '../lib/data'
import { IconCheck, IconGift } from '../lib/icons'
import {
  outstandingMembers,
  paidOf,
  paymentStatus,
  remainingOf,
  settledMembers,
  store,
  taskForMajelis,
  useApp,
  type AppState,
} from '../lib/store'
import { Avatar, Collapsible, Segmented } from '../lib/ui'

const ATTENDANCE_OPTIONS = [
  { value: 'hadir' as const, label: 'Hadir' },
  { value: 'tidak' as const, label: 'Tidak' },
]

/** DPD is the only status worth a badge — "current" needs no decoration. */
function DpdBadge({ dpd }: { dpd: number }) {
  if (dpd === 0) return null
  // self-start so the pill hugs its text instead of being stretched by the
  // surrounding flex column.
  return (
    <Badge className="self-start" intent={dpd >= 30 ? 'red' : 'orange'}>
      Menunggak {dpd} hari
    </Badge>
  )
}

/** One mitra still owing: identity, then the two records the visit captures. */
function MitraCard({
  mitra,
  state,
  onCollect,
}: {
  mitra: Mitra
  state: AppState
  onCollect: () => void
}) {
  const status = paymentStatus(state, mitra)
  const paid = paidOf(state, mitra)
  const remaining = remainingOf(state, mitra)

  return (
    <Card>
      <div className="flex flex-col gap-12">
        <div className="flex items-start gap-12">
          <Avatar name={mitra.name} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate text-14 font-bold text-default">{mitra.name}</span>
            <span className="text-12 text-caption">
              {status === 'sebagian'
                ? `Dibayar ${rupiah(paid)} dari ${rupiah(mitra.due)}`
                : `Tagihan ${rupiah(mitra.due)}`}
            </span>
            <DpdBadge dpd={mitra.dpd} />
          </div>
        </div>

        {/* The two things a majelis visit exists to record. */}
        <div className="flex flex-col gap-8 border-t border-default pt-12">
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Kehadiran</span>
            <Segmented
              label={`Kehadiran ${mitra.name}`}
              options={ATTENDANCE_OPTIONS}
              value={state.attendance[mitra.id]}
              onChange={(value) => store.setAttendance(mitra.id, value)}
            />
          </div>
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Pembayaran</span>
            {status === 'sebagian' ? (
              <div className="flex items-center gap-8">
                <Badge intent="orange">Kurang {rupiah(remaining)}</Badge>
                <Button size="xs" variant="outline" onClick={onCollect}>
                  Ubah
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={onCollect}>
                Terima
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export function MajelisVisitScreen() {
  const flow = useFlow()
  const s = useApp()
  const majelis = findMajelis(s.openMajelis)
  const task = taskForMajelis(majelis.id)

  // Sheet state is deliberately local: it must not survive navigation.
  const [collecting, setCollecting] = useState<Mitra | null>(null)
  const [draft, setDraft] = useState('')

  const outstanding = outstandingMembers(s, majelis.members)
  const settled = settledMembers(s, majelis.members)
  const owed = outstanding.reduce((sum, m) => sum + remainingOf(s, m), 0)

  // Offers are nice-to-have, so they never compete with collection: only mitra
  // who have settled are eligible, and the section stays collapsed regardless.
  const offerable = majelis.members.filter((m) => m.offer && paymentStatus(s, m) === 'lunas')

  function openCollect(mitra: Mitra) {
    // Prefilled with what's left, so paying in full is Terima → Simpan.
    setDraft(String(remainingOf(s, mitra)))
    setCollecting(mitra)
  }

  function saveCollect() {
    if (!collecting) return
    const entered = Number(draft.replace(/\D/g, '')) || 0
    store.setPayment(collecting.id, paidOf(s, collecting) + entered)
    setCollecting(null)
  }

  function finish() {
    if (task) store.finishTask(task.id)
    flow.go('today')
  }

  const entered = Number(draft.replace(/\D/g, '')) || 0
  const shortfall = collecting ? remainingOf(s, collecting) - entered : 0

  return (
    <Screen topBar={<NavigationHeader title={majelis.name} onBack={() => flow.back()} />}>
      {/* --- The job, stated as one number: a countdown to zero, not a metric. */}
      <Card>
        <div className="flex items-center gap-12">
          <div className="flex flex-1 flex-col gap-2">
            <span className="text-12 text-caption">Belum lunas</span>
            <span className="text-24 font-bold text-default">
              {outstanding.length} dari {majelis.members.length} mitra
            </span>
          </div>
          <span className="text-16 font-bold text-default">{rupiah(owed)}</span>
        </div>
      </Card>

      {/* --- The queue. */}
      {outstanding.length > 0 ? (
        <div className="flex flex-col gap-8">
          {outstanding.map((mitra) => (
            <MitraCard
              key={mitra.id}
              mitra={mitra}
              state={s}
              onCollect={() => openCollect(mitra)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
              <IconCheck size={24} />
            </span>
            <span className="text-20 font-bold text-default">Semua mitra sudah lunas</span>
            <span className="text-12 text-caption">
              Kunjungan bisa ditutup. Tawaran produk di bawah bersifat opsional.
            </span>
          </div>
        </Card>
      )}

      {/* --- Everything the BP does not need in front of them. */}
      <Collapsible title="Sudah lunas" hint={`${settled.length} mitra`}>
        {settled.map((mitra) => (
          <div key={mitra.id} className="flex items-center gap-12">
            <span className="flex-1 truncate text-14 text-caption">{mitra.name}</span>
            <span className="text-12 text-caption">{rupiah(mitra.due)}</span>
            <span className="text-green-500">
              <IconCheck size={16} />
            </span>
          </div>
        ))}
      </Collapsible>

      {offerable.length > 0 ? (
        <Collapsible title="Bisa ditawari produk" hint={`${offerable.length} · opsional`}>
          {offerable.map((mitra) => (
            <div key={mitra.id} className="flex items-center gap-12">
              <span className="text-disabled">
                <IconGift size={20} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-14 font-bold text-default">{mitra.name}</span>
                <span className="truncate text-12 text-caption">
                  {mitra.offer?.label} · {mitra.offer?.reason}
                </span>
              </div>
              {s.offered.includes(mitra.id) ? (
                <Badge intent="green" leadingIcon={<IconCheck size={16} />}>
                  Ditawarkan
                </Badge>
              ) : (
                <Button size="xs" variant="outline" onClick={() => store.markOffered(mitra.id)}>
                  Tawarkan
                </Button>
              )}
            </div>
          ))}
        </Collapsible>
      ) : null}

      {/* --- Close out. Sticky so it's reachable without scrolling the queue;
          bleeds past the Screen primitive's 16px padding to the frame edges. */}
      <div className="sticky bottom-0 -mx-16 mt-auto border-t border-default bg-neutral-white p-16">
        <Button
          size="lg"
          className="w-full"
          variant={outstanding.length > 0 ? 'outline' : 'primary'}
          onClick={finish}
        >
          Selesaikan Kunjungan
        </Button>
      </div>

      {/* --- Payment. One number to type, prefilled with the full instalment. */}
      <BottomSheet
        open={collecting !== null}
        onClose={() => setCollecting(null)}
        title="Catat pembayaran"
        description={collecting?.name}
        primaryAction={
          <Button className="w-full" onClick={saveCollect}>
            Simpan
          </Button>
        }
        secondaryAction={
          <Button className="w-full" variant="ghost" onClick={() => setCollecting(null)}>
            Batal
          </Button>
        }
      >
        <div className="flex flex-col gap-12">
          <div className="flex items-center gap-12 rounded-8 bg-neutral-50 px-12 py-8">
            <span className="flex-1 text-12 text-caption">Sisa tagihan minggu ini</span>
            <span className="text-14 font-bold text-default">
              {collecting ? rupiah(remainingOf(s, collecting)) : ''}
            </span>
          </div>
          <Input
            label="Jumlah diterima"
            prefix="Rp"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
            helperText={
              shortfall > 0
                ? `Bayar sebagian — kurang ${rupiah(shortfall)}`
                : 'Lunas untuk minggu ini'
            }
            state={shortfall > 0 ? 'default' : 'valid'}
          />
        </div>
      </BottomSheet>
    </Screen>
  )
}
