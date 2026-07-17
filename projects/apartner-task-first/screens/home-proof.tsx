'use client'

// Step 3 of 3 — Foto & Kirim.
//
// The home-visit read of the majelis proof step. Photo gates submission, the
// recap reads back what the BP entered rather than showing a metric, and
// submitting finishes the task so the schedule promotes the next one.
//
// The recap is scaled to one mitra: whether she was met, what she paid, and —
// the fact a doorstep collection turns on — whether there is a promise to come
// back for. An outstanding balance with a promise is work closed for today; an
// outstanding balance with nothing recorded is the warning.

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findHomeVisit, rupiah } from '../lib/data'
import { IconCamera, IconCheck } from '../lib/icons'
import { paidOf, paymentStatus, remainingOf, store, useApp } from '../lib/store'
import { HOME_STEP_LABELS, StepBar } from '../lib/ui'

export function HomeProofScreen() {
  const flow = useFlow()
  const s = useApp()
  const visit = findHomeVisit(s.openHome)
  const mitra = visit.mitra

  const met = s.attendance[mitra.id]
  const status = paymentStatus(s, mitra)
  const paid = paidOf(s, mitra)
  const refusal = s.nonPayments[mitra.id]
  const offerTertarik = s.offerResults[mitra.id] === 'tertarik'
  // Nothing recorded at all — no payment, no logged no — is the one state worth
  // warning about. A recorded "tidak bayar" is finished work, not a gap.
  const nothingRecorded = status === 'belum'

  function submit() {
    store.finishTask(visit.id)
    flow.go('today')
  }

  const statusLine =
    status === 'lunas'
      ? rupiah(paid)
      : status === 'sebagian'
        ? `${rupiah(paid)} · kurang ${rupiah(remainingOf(s, mitra))}`
        : status === 'tidak'
          ? `Tidak bayar · ${refusal?.ptp ? `janji ${refusal.ptp}` : 'tanpa janji'}`
          : 'Belum dicatat'

  return (
    <Screen topBar={<NavigationHeader title="Home Visit" onBack={() => flow.back()} />}>
      <StepBar current={3} labels={HOME_STEP_LABELS} />

      {/* --- Read-back of what the BP entered, not a dashboard. */}
      <Card>
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Mitra</span>
            <span className="text-14 font-bold text-default">{mitra.name}</span>
          </div>
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Ditemui</span>
            <span className="text-14 font-bold text-default">
              {met === 'hadir' ? 'Ya' : met === 'tidak' ? 'Tidak' : 'Belum ditandai'}
            </span>
          </div>
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Pembayaran</span>
            <span className="text-14 font-bold text-default">{statusLine}</span>
          </div>
          {offerTertarik ? (
            <div className="flex items-center gap-12">
              <span className="flex-1 text-12 text-caption">Tugas tambahan</span>
              <span className="text-14 font-bold text-default">
                {mitra.offer?.label} · tertarik
              </span>
            </div>
          ) : null}
          {nothingRecorded ? (
            <div className="rounded-8 bg-orange-50 px-12 py-8 text-12 text-default">
              Belum ada hasil pembayaran yang dicatat. Kunjungan tetap bisa dikirim.
            </div>
          ) : null}
        </div>
      </Card>

      {/* --- Proof. */}
      <span className="text-14 font-bold text-default">Foto kunjungan</span>
      {s.photo ? (
        <Card>
          <div className="flex items-center gap-12">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-green-50 text-green-500">
              <IconCheck size={24} />
            </span>
            <div className="flex flex-1 flex-col">
              <span className="text-14 font-bold text-default">Foto tersimpan</span>
              <span className="text-12 text-caption">home-visit-21juli.jpg</span>
            </div>
            <Button size="xs" variant="ghost" onClick={() => store.setPhoto(false)}>
              Ambil ulang
            </Button>
          </div>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => store.setPhoto(true)}
          className="flex flex-col items-center gap-8 rounded-12 border border-default bg-neutral-white p-24 text-center"
        >
          <span className="flex h-48 w-48 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <IconCamera size={24} />
          </span>
          <span className="text-14 font-bold text-default">Ambil foto kunjungan</span>
          <span className="text-12 text-caption">Bukti kunjungan rumah, wajib sebelum kirim</span>
        </button>
      )}

      <div className="sticky bottom-0 -mx-16 mt-auto flex flex-col gap-8 border-t border-default bg-neutral-white p-16">
        {!s.photo ? (
          <span className="text-center text-12 text-caption">Ambil foto dulu untuk mengirim</span>
        ) : null}
        <Button size="lg" className="w-full" disabled={!s.photo} onClick={submit}>
          Selesaikan Tugas
        </Button>
      </div>
    </Screen>
  )
}
