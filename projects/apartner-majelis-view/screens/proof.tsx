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
      <SectionTitle>Ringkasan pembayaran</SectionTitle>
      <Card>
        <div className="flex items-center gap-12">
          <IconTile tint="green">
            <IconWallet size={20} />
          </IconTile>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-caption">Tunai terkumpul dari majelis ini</span>
            <span className="text-24 font-bold text-default">{rupiah(cashCollected)}</span>
          </div>
        </div>
        <div className="mt-12 flex items-center gap-8 border-t border-default pt-12 text-12 text-caption">
          <span>{lunasN} lunas</span>
          <span className="text-disabled">·</span>
          <span>{sebagianN} sebagian</span>
          <span className="text-disabled">·</span>
          <span>{tidakN} belum bayar</span>
        </div>
      </Card>

      {/* --- Bukti: the photo that closes the visit. */}
      <SectionTitle>Bukti pelayanan</SectionTitle>
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
        {/* One button now. Finishing hands straight to the WhatsApp preview,
            where the group's receipt is sent — the natural close of the visit
            rather than an optional control beside "finish". */}
        <Button size="lg" className="w-full" disabled={!s.photo} onClick={submit}>
          Selesaikan Tugas
        </Button>
      </StickyBar>
    </Screen>
  )
}
