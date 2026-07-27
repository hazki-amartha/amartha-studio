'use client'

// Bukti kunjungan — the capture that gates submitting.
//
// One tile, exactly as the home visit's Bukti & Kirim: take the photo. Location
// used to be a second tile the BP tapped herself, which asked her to perform a
// step the phone does — the shot is geotagged whether or not anyone presses a
// button — and made a one-gesture screen into two. So the geotag is read back
// UNDER the photo instead, as the confirmation of where it was taken.
//
// The stage read-back above it is gone for the same reason it is absent from the
// home visit: this is the paperwork that closes the visit, not a second review
// of it. Attendance, collection and offers were each recorded on a screen that
// showed the running count while she worked, and the recap that follows says
// what those numbers MEAN.
//
// It is the visit's FOURTH step, in the same bar as the three before it, exactly
// as Bukti & Kirim is the home visit's third. It used to sit outside the bar —
// attendance, collection and offers are the work, proof is the paperwork — which
// left a BP two taps from finishing looking at a bar that already read as
// complete, and made the same visit a 3-step flow at the balai and a 3-step flow
// with a loose ending at the door.

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { majelisWhen } from '../lib/schedule'
import { IconCamera } from '../lib/icons'
import { pendingMembers, store, useApp, openMajelisEntry } from '../lib/store'
import { PinMark, ProofTile, SectionTitle, StageBar, StickyBar, VisitTitle } from '../lib/ui'

export function ProofScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)

  const pending = pendingMembers(s)

  function submit() {
    store.finishTask()
    flow.go('today')
  }

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={group.name} when={majelisWhen(group)} />}
          onBack={() => flow.back()}
        />
      }
    >
      {/* The same flat white band the three stages before it carry, so the bar
          does not move or change ground on the last step. */}
      <div className="-mx-16 -mt-16 flex flex-col gap-12 border-b border-default bg-neutral-white px-16 pb-12 pt-16">
        <StageBar current={4} />
      </div>

      <SectionTitle>Bukti Pelayanan</SectionTitle>
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
            <span className="flex-1 text-12 text-caption">{group.place}</span>
            <span className="shrink-0 text-12 text-caption">±8 m</span>
          </div>
        </Card>
      ) : null}

      {/* A warning, not a block. The field decides whether a mitra who never
          turned up is worth waiting for; the app's job is to make sure the BP
          knows what she is about to submit, not to overrule her. */}
      {pending.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-12 border border-orange-200 bg-orange-50 p-12">
          <span className="text-14 font-bold text-orange-500">
            {pending.length} mitra belum ditagih
          </span>
          <span className="text-12 text-caption">
            Tugas tetap bisa dikirim — mitra ini akan tercatat belum ada hasilnya.
          </span>
        </div>
      ) : null}

      <StickyBar>
        {!s.photo ? (
          <span className="text-center text-12 text-caption">
            Ambil foto dulu untuk mengirim
          </span>
        ) : null}
        {/* Submitting IS the end of the visit. There used to be a "Ringkasan &
            Kirim" page after this one, which put a second confirmation between
            the BP and a task she has finished. */}
        <Button size="lg" className="w-full" disabled={!s.photo} onClick={submit}>
          Kirim Laporan
        </Button>
      </StickyBar>
    </Screen>
  )
}
