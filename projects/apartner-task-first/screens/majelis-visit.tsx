'use client'

// Step 1 of 3 — Kehadiran & Pembayaran.
//
// The collection queue: one count at the top that is a countdown to zero, and
// one card per mitra who still owes. Each card's action row is a single row —
// attendance on the left, payment on the right — so a mitra is one glance and
// at most two taps.
//
// Payment is an amount, not a flag: partial payment is a normal field outcome.
// "Terima Pembayaran" opens a sheet prefilled with the full instalment, so
// paying in full is two taps and paying part costs one edit. A mitra leaves the
// queue only once lunas; a partial payer keeps their card, labelled with what's
// still short, because an unfinished row is more honest than a green tick.

import { useState } from 'react'
import { BottomSheet, Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMajelis, rupiah, type Mitra } from '../lib/data'
import { IconCheck } from '../lib/icons'
import { MitraCard } from '../lib/mitra-card'
import {
  outstandingMembers,
  paidOf,
  paymentStatus,
  remainingOf,
  settledMembers,
  store,
  useApp,
} from '../lib/store'
import { Collapsible, Segmented, StepBar } from '../lib/ui'

const ATTENDANCE_OPTIONS = [
  { value: 'hadir' as const, label: 'Hadir' },
  { value: 'tidak' as const, label: 'Tidak' },
]

export function MajelisVisitScreen() {
  const flow = useFlow()
  const s = useApp()
  const majelis = findMajelis(s.openMajelis)

  // Sheet state is deliberately local: it must not survive navigation.
  const [collecting, setCollecting] = useState<Mitra | null>(null)
  const [draft, setDraft] = useState('')

  const outstanding = outstandingMembers(s, majelis.members)
  const settled = settledMembers(s, majelis.members)
  const owed = outstanding.reduce((sum, m) => sum + remainingOf(s, m), 0)

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

  const entered = Number(draft.replace(/\D/g, '')) || 0
  const shortfall = collecting ? remainingOf(s, collecting) - entered : 0

  return (
    <Screen topBar={<NavigationHeader title={majelis.name} onBack={() => flow.back()} />}>
      <StepBar current={1} />

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
          {outstanding.map((mitra) => {
            const status = paymentStatus(s, mitra)
            return (
              <MitraCard
                key={mitra.id}
                mitra={mitra}
                state={s}
                action={
                  // One row: kehadiran, then pembayaran.
                  <div className="flex items-center gap-8">
                    <Segmented
                      label={`Kehadiran ${mitra.name}`}
                      options={ATTENDANCE_OPTIONS}
                      value={s.attendance[mitra.id]}
                      onChange={(value) => store.setAttendance(mitra.id, value)}
                    />
                    <Button
                      size="sm"
                      className="flex-1"
                      variant={status === 'sebagian' ? 'outline' : 'primary'}
                      onClick={() => openCollect(mitra)}
                    >
                      {status === 'sebagian'
                        ? `Kurang ${rupiah(remainingOf(s, mitra))}`
                        : 'Terima Pembayaran'}
                    </Button>
                  </div>
                }
              />
            )
          })}
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
              <IconCheck size={24} />
            </span>
            <span className="text-20 font-bold text-default">Semua mitra sudah lunas</span>
            <span className="text-12 text-caption">Lanjut ke tugas tambahan.</span>
          </div>
        </Card>
      )}

      {/* --- Out of the way: the ones already done. */}
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

      {/* --- Advance. Sticky so it's reachable without scrolling the queue;
          bleeds past the Screen primitive's 16px padding to the frame edges. */}
      <div className="sticky bottom-0 -mx-16 mt-auto border-t border-default bg-neutral-white p-16">
        <Button size="lg" className="w-full" onClick={() => flow.go('majelis-offers')}>
          Lanjut
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
