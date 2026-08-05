'use client'

// Home visit, step 3 of 3 — Bukti & Kirim.
//
// The close of a home visit, and — like the majelis visit's Summary & Bukti — it
// now carries a RECAP of what the door paid before the photo that proves the
// visit. What she recorded on Tagih lands here as one figure and its status, so
// she confirms what she is submitting rather than re-entering it.
//
// The photo carries the mitra's house location: a doorstep is the visit that
// gets questioned later, and "she was at the house" is exactly the claim a photo
// alone cannot make. So the confirmation reads back the geotag — where the shot
// was taken — rather than a filename.
//
// One CTA: Selesaikan Tugas. It finishes the visit and hands straight to the
// WhatsApp preview, where the mitra's payment receipt is sent — the same shape
// as the majelis visit, where the group's recap is its own next step rather than
// an optional second button competing with "finish".

import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { outstandingOf, rupiah } from '../lib/data'
import { profileOf } from '../lib/profile'
import { openHomeMitra, openHomeTask, paidOf, store, useApp } from '../lib/store'
import {
  HOME_STAGE_LABELS,
  IconTile,
  PinMark,
  ProofTile,
  SectionTitle,
  StageBar,
  StickyBar,
} from '../lib/ui'
import { IconCamera, IconWallet } from '../lib/icons'

export function HomeProofScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)
  const task = openHomeTask(s)
  const profile = profileOf(mitra)
  const houseLocation = task?.place ?? profile.address

  // What the door paid, and where that leaves the bill — the recap the WhatsApp
  // receipt on the next step is built from.
  const paid = paidOf(s, mitra)
  const total = outstandingOf(mitra).total
  const shortfall = Math.max(0, total - paid)
  const promise = s.partialPtp[mitra.id] ?? s.nonPayments[mitra.id]?.ptp
  const status = paid >= total && paid > 0 ? 'lunas' : paid > 0 ? 'sebagian' : 'belum'
  const statusLabel = status === 'lunas' ? 'Lunas' : status === 'sebagian' ? 'Sebagian' : 'Belum bayar'
  const statusIntent = status === 'lunas' ? 'green' : status === 'sebagian' ? 'orange' : 'neutral'

  function submit() {
    // Finishing the visit is what "Selesaikan Tugas" does; the WhatsApp preview
    // that follows is the send, not a second confirmation of the finish.
    store.finishTask()
    flow.go('home-proof-wa')
  }

  return (
    <Screen
      topBar={<NavigationHeader title="Bukti & Kirim" onBack={() => flow.back()} />}
    >
      <StageBar current={3} labels={HOME_STAGE_LABELS} />

      {/* --- Summary: what the door paid, and where the bill stands. */}
      <SectionTitle>Ringkasan pembayaran</SectionTitle>
      <Card>
        <div className="flex items-center gap-12">
          <IconTile tint="green">
            <IconWallet size={20} />
          </IconTile>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-caption">Pembayaran diterima dari kunjungan ini</span>
            <span className="text-24 font-bold text-default">{rupiah(paid)}</span>
          </div>
          <Badge intent={statusIntent}>{statusLabel}</Badge>
        </div>
        {shortfall > 0 || promise ? (
          <div className="mt-12 flex flex-col gap-2 border-t border-default pt-12 text-12 text-caption">
            {shortfall > 0 ? <span>Sisa tagihan {rupiah(shortfall)}</span> : null}
            {promise ? <span>Janji bayar {promise}</span> : null}
          </div>
        ) : null}
      </Card>

      {/* --- Bukti: the geotagged photo that closes the visit. */}
      <SectionTitle>Bukti kunjungan</SectionTitle>
      <div className="flex">
        <ProofTile
          done={s.photo}
          label="Ambil foto"
          doneLabel="Foto tersimpan"
          icon={<IconCamera size={24} />}
          onClick={() => store.setPhoto(!s.photo)}
        />
      </div>
      {s.photo ? (
        <Card>
          <div className="flex items-center gap-8">
            <span className="shrink-0 text-caption">
              <PinMark size={16} />
            </span>
            <span className="flex-1 text-12 text-caption">
              Rumah {mitra.name} · {houseLocation}
            </span>
            <span className="shrink-0 text-12 text-caption">±8 m</span>
          </div>
        </Card>
      ) : null}

      <StickyBar>
        {!s.photo ? (
          <span className="text-center text-12 text-caption">Ambil foto dulu untuk mengirim</span>
        ) : null}
        {/* One button now. Finishing hands straight to the WhatsApp preview,
            where the mitra's payment receipt is sent. */}
        <Button size="lg" className="w-full" disabled={!s.photo} onClick={submit}>
          Selesaikan Tugas
        </Button>
      </StickyBar>
    </Screen>
  )
}
