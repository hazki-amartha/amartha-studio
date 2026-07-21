'use client'

// Home visit, step 2 of 2 — Bukti & Kirim.
//
// Deliberately identical in shape to the majelis close: location and photo both
// gate submission, the recap reads back what the BP entered rather than showing
// a metric, and submitting ticks the schedule row so the day advances.
//
// Location matters MORE here, not less. A majelis has a fixed meeting place the
// BM already knows; a home visit is the one that gets doubted, and "she was at
// the house" is exactly the claim a photo of a closed gate cannot make alone.
//
// The recap is scaled to one mitra: who was met, what she paid, and — the fact
// a doorstep collection turns on — whether there is a promise to come back for.
// A balance with a promise is work closed for today; a balance with nothing
// recorded is the warning.

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { IconCamera, IconCheck, IconPin } from '../lib/icons'
import {
  collectStatus,
  openHomeMitra,
  openHomeTask,
  paidOf,
  remainingOf,
  store,
  useApp,
} from '../lib/store'
import { HOME_STAGE_LABELS, ProofTile, SectionTitle, StageBar, StickyBar } from '../lib/ui'

export function HomeProofScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)
  const task = openHomeTask(s)

  const met = s.metWith[mitra.id]
  const status = collectStatus(s, mitra)
  const paid = paidOf(s, mitra)
  const refusal = s.nonPayments[mitra.id]
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

  const statusLine =
    status === 'lunas'
      ? rupiah(paid)
      : status === 'sebagian'
        ? // The balance and its date, because both were entered on step 1 and
          // this card's job is to read back everything that was recorded.
          `${rupiah(paid)} · sisa ${rupiah(remainingOf(s, mitra))} ${
            s.partialPtp[mitra.id] ? `· janji ${s.partialPtp[mitra.id]}` : '· tanpa janji'
          }`
        : status === 'tidak'
          ? `Tidak bayar · ${refusal?.ptp ? `janji ${refusal.ptp}` : 'tanpa janji'}`
          : 'Belum dicatat'

  function submit() {
    store.finishTask()
    flow.go('today')
  }

  return (
    <Screen topBar={<NavigationHeader title={mitra.name} onBack={() => flow.back()} />}>
      <StageBar current={2} labels={HOME_STAGE_LABELS} />

      {/* --- Read-back of what the BP entered, not a dashboard. */}
      <Card>
        <div className="flex flex-col gap-8">
          <Row label="Mitra" value={mitra.name} />
          <Row label="Ditemui" value={metLabel} />
          <Row label="Pembayaran" value={statusLine} />
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

      <StickyBar>
        {!s.geo || !s.photo ? (
          <span className="text-center text-12 text-caption">
            Rekam lokasi &amp; ambil foto dulu untuk mengirim
          </span>
        ) : null}
        <Button size="lg" className="w-full" disabled={!s.geo || !s.photo} onClick={submit}>
          Selesaikan Tugas
        </Button>
      </StickyBar>
    </Screen>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-12">
      <span className="flex-1 text-12 text-caption">{label}</span>
      <span className="text-14 font-bold text-default">{value}</span>
    </div>
  )
}
