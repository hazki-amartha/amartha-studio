'use client'

// Ringkasan — the close.
//
// The reference ends on a celebration screen. This one is not that, on the
// designer's note that the layout there is not the reference — the INTENT is:
// close the loop, recap what was recorded, and say what it means for the group.
//
// So it does three things in order. It reads back the three stages, because
// submitting is final and this is the BP's last chance to catch a majelis she
// half-finished. It states the consequence for the group — the line about the
// majelis' credit limit, which is the only reason a BP can give a mitra for why
// her neighbour's late payment is any of her business. And then it submits.
//
// The credit-limit line is generic by design. A real figure would need a
// scoring model this prototype does not have, and inventing one would be the
// worst kind of mock: a number a BP might repeat to a mitra as if it were a
// promise. Stating the RELATIONSHIP without a number is honest and still gives
// her the argument.

import { Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MAJELIS, growthMembers, rupiah } from '../lib/data'
import { IconArrowRight, IconCheck } from '../lib/icons'
import {
  billableTotal,
  collectedTotal,
  growthDoneCount,
  pendingMembers,
  presentCount,
  store,
  useApp,
} from '../lib/store'
import { SectionTitle, StageBar, StatRows, StickyBar, VisitTitle } from '../lib/ui'

export function RecapScreen() {
  const flow = useFlow()
  const s = useApp()

  const total = MAJELIS.members.length
  const present = presentCount(s)
  const collected = collectedTotal(s)
  const billable = billableTotal()
  const offers = growthMembers().length
  const offersDone = growthDoneCount(s)
  const pending = pendingMembers(s)

  const rate = Math.round((collected / billable) * 100)

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={MAJELIS.name} when={MAJELIS.schedule} />}
          hideBack
        />
      }
    >
      {/* All three ticked. The stage bar is the same component the working
          screens use, which is what makes this read as the end of that sequence
          rather than a separate screen that happens to mention it. */}
      <StageBar current={4} />

      <div className="flex flex-col items-center gap-8 py-16 text-center">
        <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
          <IconCheck size={24} />
        </span>
        <span className="text-20 font-bold text-default">Pelayanan majelis selesai</span>
        <span className="text-12 text-caption">
          Periksa ringkasan di bawah sebelum tugas dikirim.
        </span>
      </div>

      <SectionTitle>Ringkasan</SectionTitle>

      <StatRows
        rows={[
          { label: 'Kehadiran', value: `${present} dari ${total} mitra` },
          {
            label: 'Terkumpul',
            value: rupiah(collected),
            tone: rate === 100 ? 'green' : 'orange',
          },
          { label: 'Dari total tagihan', value: rupiah(billable) },
          { label: 'Peluang ditawarkan', value: `${offersDone} dari ${offers}` },
        ]}
      />

      {pending.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-12 border border-orange-200 bg-orange-50 p-12">
          <span className="text-14 font-bold text-orange-500">
            {pending.length} mitra tanpa hasil penagihan
          </span>
          <span className="text-12 text-caption">
            Mereka akan muncul sebagai tunggakan berjalan minggu depan.
          </span>
        </div>
      ) : null}

      {/* --- What it means for the group. ---------------------------------- */}
      <section className="flex flex-col gap-8 pb-16">
        <SectionTitle>Untuk Majelis Mawar</SectionTitle>
        <div className="flex flex-col gap-8 rounded-12 border border-primary-200 bg-primary-50 p-12">
          <p className="text-14 text-default">
            Ketepatan bayar seluruh anggota menentukan limit pembiayaan yang bisa diberikan ke
            majelis ini pada siklus berikutnya. Minggu ini {rate}% tagihan terkumpul.
          </p>
          <p className="text-12 text-caption">
            {rate === 100
              ? 'Majelis penuh — catatan ini menjaga limit kelompok tetap naik.'
              : 'Selama masih ada tunggakan, kenaikan limit kelompok tertahan sampai lunas.'}
          </p>
        </div>
      </section>

      <StickyBar>
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            store.startVisit()
            flow.go('majelis')
          }}
        >
          <span className="flex items-center justify-center gap-8">
            Kirim Tugas
            <IconArrowRight size={20} />
          </span>
        </Button>
      </StickyBar>
    </Screen>
  )
}
