'use client'

// Summary & Bukti — the last step of a majelis visit.
//
// It carries two things now: a RECAP of what the room paid — how much cash she
// is walking away with from this majelis — and the photo that closes the visit.
// The recap is the point the three working stages were building to: attendance,
// collection and offers each showed a running count while she worked, and this
// is where those numbers land as one figure she can act on and settle against.
//
// The geotag is read back UNDER the photo rather than tapped as a second tile —
// the shot is geotagged whether or not anyone presses a button, so asking her to
// confirm the location is asking her to perform a step the phone already did.
//
// One CTA: Selesaikan Tugas. It finishes the visit and hands straight to the
// WhatsApp preview, where she sends the group its receipt. That send used to be
// an optional second button here, opening a sheet — but the group's recap is the
// natural close of a majelis, not a courtesy she might skip, so it is the next
// STEP now rather than a control competing with "finish" on the same bar.
//
// It is the visit's FOURTH step, in the same bar as the three before it.

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MAJELIS, rupiah } from '../lib/data'
import { majelisWhen } from '../lib/schedule'
import { IconCamera, IconWallet } from '../lib/icons'
import {
  collectStatus,
  paidOf,
  pendingMembers,
  recordedMembers,
  store,
  useApp,
  openMajelisEntry,
} from '../lib/store'
import {
  IconTile,
  PinMark,
  ProofTile,
  SectionTitle,
  StageBar,
  StickyBar,
  VisitTitle,
} from '../lib/ui'

// What the shot carries with it. Fixed, like the rest of the prototype's clock
// (see data.ts): a demo that re-dates itself overnight is worse than one that is
// honestly pinned, and the coordinates exist to be READ — the row is a
// read-back, not a route out to a map.
const PHOTO_TAKEN_AT = 'Selasa 21/07/26, 10.24 WIB'
const PHOTO_COORDS = 'Lat -6.4521398 Long 106.6710254'

export function ProofScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)

  const pending = pendingMembers(s)

  // What she actually collected at this majelis — the cash from the mitra SHE
  // recorded an outcome for, which excludes the ones who had already settled
  // through the app before she arrived (that money was never in her bag). The
  // three counts under it are the shape of the room: paid in full, part-paid,
  // or reached and did not pay.
  const recorded = recordedMembers(s)
  const cashCollected = recorded.reduce((sum, m) => sum + paidOf(s, m), 0)
  const lunasN = recorded.filter((m) => collectStatus(s, m) === 'lunas').length
  const sebagianN = recorded.filter((m) => collectStatus(s, m) === 'sebagian').length
  const tidakN = recorded.filter((m) => collectStatus(s, m) === 'tidak').length
  // Counted apart from "belum bayar", and only shown when there is one: a mitra
  // leaving the program is the outcome of this visit ops most wants to see, and
  // folding her into the refusals would hide the case she opens.
  const keluarN = recorded.filter((m) => collectStatus(s, m) === 'keluar').length

  function submit() {
    // Finishing the visit is what "Selesaikan Tugas" does; the WhatsApp preview
    // that follows is the send, not a second confirmation of the finish.
    store.finishTask()
    flow.go('proof-wa')
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

      {/* --- Summary: the cash this majelis put in her bag, and the room behind
          the figure. */}
      <SectionTitle>Jumlah dibayar</SectionTitle>
      <Card>
        <div className="flex items-center gap-12">
          <IconTile tint="green">
            <IconWallet size={20} />
          </IconTile>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-caption">Pembayaran diterima dari kunjungan ini</span>
            <span className="text-24 font-bold text-default">{rupiah(cashCollected)}</span>
          </div>
        </div>
        <div className="mt-12 flex items-center gap-8 border-t border-default pt-12 text-12 text-caption">
          <span>{lunasN} lunas</span>
          <span className="text-disabled">·</span>
          <span>{sebagianN} sebagian</span>
          <span className="text-disabled">·</span>
          <span>{tidakN} belum bayar</span>
          {keluarN > 0 ? (
            <>
              <span className="text-disabled">·</span>
              <span>{keluarN} berhenti pinjam</span>
            </>
          ) : null}
        </div>
      </Card>

      {/* --- Bukti: the photo that closes the visit, and the geotag it carries.
          One card, per the reference: the instruction, the shot, and where the
          shot says it was taken are one object — the BP reads the instruction
          BEFORE she shoots and the read-back after, and two cards would put a
          page gap between a sentence and the thing it governs. */}
      <SectionTitle>Bukti foto tugas</SectionTitle>
      <Card>
        <div className="flex flex-col gap-12">
          <span className="text-12 text-caption">
            Pastikan GPS aktif dan Anda berada di lokasi mitra/kumpulan, lalu ambil foto bersama
            mitra jika ada.
          </span>
          {s.photo ? (
            <>
              {/* The geotag is read back UNDER the shot rather than confirmed as
                  a second step: the photo is geotagged whether or not anyone
                  presses a button, so asking her to confirm the location is
                  asking her to perform a step the phone already did. */}
              <div className="flex items-center gap-12 rounded-8 border border-default p-8">
                <span className="flex h-48 w-48 shrink-0 items-center justify-center rounded-8 bg-neutral-200 text-neutral-500">
                  <IconCamera size={20} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="truncate text-14 font-bold text-default">{group.place}</span>
                  <span className="truncate text-12 text-caption">{PHOTO_TAKEN_AT}</span>
                  <span className="flex items-center gap-4 text-12 text-caption">
                    <span className="shrink-0">
                      <PinMark size={16} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{PHOTO_COORDS}</span>
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => store.setPhoto(false)}>
                Ubah
              </Button>
            </>
          ) : (
            <div className="flex">
              <ProofTile
                done={false}
                label="Ambil foto"
                doneLabel="Foto tersimpan"
                icon={<IconCamera size={24} />}
                onClick={() => store.setPhoto(true)}
              />
            </div>
          )}
        </div>
      </Card>

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
        {/* One button. Saving hands straight to the WhatsApp preview, where the
            group's receipt is sent — the natural close of the visit rather than
            an optional control beside "finish". Going back is the top bar's job;
            a second button here only competed with the one thing this step is
            for. */}
        <Button size="lg" className="w-full" disabled={!s.photo} onClick={submit}>
          Simpan
        </Button>
      </StickyBar>
    </Screen>
  )
}
