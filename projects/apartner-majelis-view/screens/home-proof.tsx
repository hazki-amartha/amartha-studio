'use client'

// Home visit, step 3 of 3 — Bukti & Kirim.
//
// The close of a home visit: a geotagged photo of the door, and submitting ticks
// the schedule row so the day advances. Everything the BP recorded — who she
// met, what was paid — was entered on the two steps before and is not read back
// here; this step is the paperwork that closes the visit, not a second review.
//
// The photo carries the mitra's house location: a doorstep is the visit that
// gets questioned later, and "she was at the house" is exactly the claim a photo
// alone cannot make. So the confirmation reads back the geotag — where the shot
// was taken — rather than a filename.

import { useState } from 'react'
import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { profileOf } from '../lib/profile'
import { openHomeMitra, openHomeTask, store, useApp } from '../lib/store'
import {
  HOME_STAGE_LABELS,
  PinMark,
  ProofTile,
  RescheduleSheet,
  SectionTitle,
  StageBar,
  StickyBar,
} from '../lib/ui'
import { IconCamera } from '../lib/icons'

export function HomeProofScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)
  const task = openHomeTask(s)
  const houseLocation = task?.place ?? profileOf(mitra).address
  const [rescheduling, setRescheduling] = useState(false)

  function submit() {
    store.finishTask()
    flow.go('today')
  }

  function reschedule(reason: string, date: string) {
    store.rescheduleTask(s.openHome, reason, date)
    setRescheduling(false)
    flow.go('today')
  }

  return (
    <Screen
      topBar={
        <NavigationHeader
          title="Bukti & Kirim"
          link="Jadwal ulang"
          onLinkClick={() => setRescheduling(true)}
          onBack={() => flow.back()}
        />
      }
    >
      <StageBar current={3} labels={HOME_STAGE_LABELS} />

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
        <Button size="lg" className="w-full" disabled={!s.photo} onClick={submit}>
          Selesaikan Tugas
        </Button>
      </StickyBar>

      <RescheduleSheet
        open={rescheduling}
        onClose={() => setRescheduling(false)}
        subject={mitra.name}
        onConfirm={reschedule}
      />
    </Screen>
  )
}
