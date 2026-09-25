'use client'

// Home visit, step 3 of 3 — Kirim bukti. Per the BP APP 2026 Figma, the same
// shape as the majelis Bukti: "Jumlah dibayar" (the cash from this door), then
// "Bukti foto tugas", then Kembali / Selesaikan Tugas. When nobody was home, Tagih never
// happened, so the stage bar marks it Dilewati and the amount reads Rp0.

import { useState } from 'react'
import { Button, Card } from '@/design-system/components'
import { Camera, ChevronRight, MoneyBag, NotePencil } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { HomeReschedule, HomeTopBar, homeTaskState } from '../lib/home-visit-ui'
import { PhotoPreviewSheet } from '../lib/visit-sheets'
import { profileOf } from '../lib/profile'
import { openHomeMitra, openHomeTask, paidOf, store, useApp } from '../lib/store'
import { HOME_STAGE_LABELS, IconTile, SectionTitle, StageBar, StickyBar } from '../lib/ui'

// What the shot carries with it. Fixed, like the rest of the prototype's clock.
const PHOTO_TAKEN_AT = 'Selasa 21/07/26, 10.24 WIB'
const PHOTO_COORDS = 'Lat -6.4521398 Long 106.6710254'

export function HomeProofScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)
  const task = openHomeTask(s)
  const place = task?.place ?? profileOf(mitra).address
  const [rescheduling, setRescheduling] = useState(false)
  // The camera's preview — "Gunakan foto ini?" — before the shot lands here.
  const [previewing, setPreviewing] = useState(false)
  const { done, sent } = homeTaskState(s)

  const nobody = s.metWith[mitra.id] === 'nobody'
  const paid = nobody ? 0 : paidOf(s, mitra)

  // Selesaikan Tugas saves the visit and opens "Tugas selesai", where the
  // summary goes to the mitra. A sent task reopened for reference just closes.
  function submit() {
    if (sent) {
      flow.go('today')
      return
    }
    store.finishTask(s.openHome)
    flow.go('home-proof-wa')
  }

  return (
    <Screen className="bg-canvas-blue" topBar={<HomeTopBar onReschedule={() => setRescheduling(true)} />}>
      <div className="-mx-16 -mt-16 flex flex-col gap-12 rounded-b-16 border-b border-default bg-neutral-white px-16 pb-12 pt-16">
        <StageBar current={3} labels={HOME_STAGE_LABELS} skipped={nobody ? [2] : []} complete={done} />
      </div>

      <SectionTitle>Jumlah dibayar</SectionTitle>
      <Card>
        <div className="flex items-center gap-12">
          <IconTile tint="green">
            <MoneyBag size={20} />
          </IconTile>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-caption">Tunai</span>
            <span className="text-24 font-bold text-default">{rupiah(paid)}</span>
          </div>
        </div>
      </Card>

      <SectionTitle>Bukti foto tugas</SectionTitle>
      <Card>
        <div className="flex flex-col gap-12">
          <span className="text-12 text-caption">
            Pastikan GPS aktif dan Anda berada di lokasi mitra/kumpulan, lalu ambil foto bersama
            mitra jika ada.
          </span>
          {s.photo ? (
            <>
              <button
                type="button"
                onClick={() => setPreviewing(true)}
                disabled={sent}
                className="flex w-full items-center gap-12 rounded-12 border border-default p-4 pr-12 text-left"
              >
                <span className="flex h-64 w-64 shrink-0 items-center justify-center rounded-8 bg-neutral-200 text-neutral-500">
                  <Camera size={20} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="truncate text-14 font-bold text-default">{place}</span>
                  <span className="truncate text-12 text-caption">{PHOTO_TAKEN_AT}</span>
                  <span className="truncate text-12 text-caption">{PHOTO_COORDS}</span>
                </span>
                <span className="shrink-0 text-primary-500">
                  <ChevronRight size={20} />
                </span>
              </button>
              <Button
                variant={sent ? 'secondary' : 'outline'}
                className="w-full"
                disabled={sent}
                onClick={() => setPreviewing(true)}
              >
                <span className="flex items-center justify-center gap-8">
                  <NotePencil size={16} />
                  Ubah
                </span>
              </Button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setPreviewing(true)}
              className="flex w-full flex-col items-center gap-4 rounded-12 border border-dashed border-default bg-neutral-50 p-16 text-default"
            >
              <Camera size={24} />
              <span className="text-12 text-caption">Ambil foto</span>
            </button>
          )}
        </div>
      </Card>

      <StickyBar>
        <div className="flex gap-12">
          <Button size="lg" variant="outline" className="flex-1" onClick={() => flow.back()}>
            Kembali
          </Button>
          <Button size="lg" className="flex-1" disabled={!s.photo} onClick={submit}>
            {sent ? 'Tutup' : 'Selesaikan Tugas'}
          </Button>
        </div>
      </StickyBar>

      <PhotoPreviewSheet
        open={previewing}
        place={place}
        locationLabel="Lokasi rumah mitra"
        onClose={() => setPreviewing(false)}
        onRetake={() => store.setPhoto(false)}
        onUse={() => {
          store.setPhoto(true)
          setPreviewing(false)
        }}
      />

      <HomeReschedule open={rescheduling} onClose={() => setRescheduling(false)} />
    </Screen>
  )
}
