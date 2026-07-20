'use client'

// Step 2 of 2 — Bukti & Kirim.
//
// The home-visit read of the majelis proof step, and deliberately identical to
// it: location and photo both gate submission, the recap reads back what the BP
// entered rather than showing a metric, and submitting finishes the task so the
// schedule promotes the next one.
//
// Location matters more here than at a majelis, not less. A majelis has a fixed
// meeting place the BM already knows; a home visit is the one that gets doubted,
// and "she was at the house" is exactly the claim a photo of a closed gate
// cannot make on its own.
//
// The recap is scaled to one mitra: who was met, what she paid, and — the fact
// a doorstep collection turns on — whether there is a promise to come back for.
// An outstanding balance with a promise is work closed for today; an outstanding
// balance with nothing recorded is the warning.

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findHomeVisit, findTask, rupiah } from '../lib/data'
import { IconCamera, IconCheck, IconPin } from '../lib/icons'
import { paidOf, paymentStatus, remainingOf, store, useApp } from '../lib/store'
import { HOME_STEP_LABELS, ProofTile, SectionTitle, StepBar } from '../lib/ui'

export function HomeProofScreen() {
  const flow = useFlow()
  const s = useApp()
  const visit = findHomeVisit(s.openHome)
  const mitra = visit.mitra

  const met = s.metWith[mitra.id]
  const status = paymentStatus(s, mitra)
  const paid = paidOf(s, mitra)
  const refusal = s.nonPayments[mitra.id]
  const task = findTask(visit.id)
  // Nothing recorded at all — no payment, no logged no — is the one state worth
  // warning about. A recorded "tidak bayar" is finished work, not a gap.
  const nothingRecorded = status === 'belum'

  const metLabel =
    met === 'mitra'
      ? 'Mitra sendiri'
      : met === 'pj'
        ? 'Keluarga / penanggung jawab'
        : met === 'nobody'
          ? 'Tidak ada orang'
          : 'Belum ditandai'

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
    <Screen topBar={<NavigationHeader title={mitra.name} onBack={() => flow.back()} />}>
      <StepBar current={2} labels={HOME_STEP_LABELS} />

      {/* --- Read-back of what the BP entered, not a dashboard. */}
      <Card>
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Mitra</span>
            <span className="text-14 font-bold text-default">{mitra.name}</span>
          </div>
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Ditemui</span>
            <span className="text-14 font-bold text-default">{metLabel}</span>
          </div>
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Pembayaran</span>
            <span className="text-14 font-bold text-default">{statusLine}</span>
          </div>
          {nothingRecorded ? (
            <div className="rounded-8 bg-orange-50 px-12 py-8 text-12 text-default">
              Belum ada hasil pembayaran yang dicatat. Kunjungan tetap bisa dikirim.
            </div>
          ) : null}
        </div>
      </Card>

      {/* --- Proof. Same pair, same weight, as the majelis close. */}
      <SectionTitle>Bukti kunjungan</SectionTitle>
      <div className="flex gap-8">
        <ProofTile
          done={s.geo}
          label="Rekam lokasi"
          doneLabel="Lokasi terekam"
          icon={<IconPin size={24} />}
          onClick={() => store.setGeo(!s.geo)}
        />
        <ProofTile
          done={s.photo}
          label="Ambil foto"
          doneLabel="Foto tersimpan"
          icon={<IconCamera size={24} />}
          onClick={() => store.setPhoto(!s.photo)}
        />
      </div>
      {s.geo || s.photo ? (
        <Card>
          <div className="flex flex-col gap-8">
            {s.geo ? (
              <div className="flex items-center gap-8">
                <span className="shrink-0 text-green-500">
                  <IconCheck size={16} />
                </span>
                <span className="flex-1 text-12 text-caption">{task?.place ?? 'Lokasi mitra'}</span>
                <span className="text-12 text-caption">±8 m</span>
              </div>
            ) : null}
            {s.photo ? (
              <div className="flex items-center gap-8">
                <span className="shrink-0 text-green-500">
                  <IconCheck size={16} />
                </span>
                <span className="flex-1 text-12 text-caption">home-visit-21juli.jpg</span>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="sticky bottom-0 -mx-16 mt-auto flex flex-col gap-8 border-t border-default bg-neutral-white p-16">
        {!s.geo || !s.photo ? (
          <span className="text-center text-12 text-caption">
            Rekam lokasi &amp; ambil foto dulu untuk mengirim
          </span>
        ) : null}
        <Button size="lg" className="w-full" disabled={!s.geo || !s.photo} onClick={submit}>
          Selesaikan Tugas
        </Button>
      </div>
    </Screen>
  )
}
