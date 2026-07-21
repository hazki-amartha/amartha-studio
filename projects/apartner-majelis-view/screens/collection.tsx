'use client'

// Stage 2 of 3 — Penagihan.
//
// The queue. One card per mitra nobody has dealt with yet, and it drains as the
// BP works. The stage's job is to RECORD an outcome for everyone, not to make
// everyone lunas — so a card leaves the queue once it has an outcome of ANY
// kind, "tidak bayar" included. Grouping on payment instead would strand a
// recorded refusal in the queue forever and the page could never reach zero.
//
// The one action is "Tagih", and unlike apartner-task-first it opens a PAGE
// rather than a bottom sheet. That is the second thing this direction is testing.
// The sheet's case was that it kept the queue behind it visible and scannable;
// the page's case is that at the moment the BP is negotiating an amount she is
// not looking at the queue at all — she is looking at one woman, who is arguing
// about one number, and the page can afford to show her the week-by-week ledger
// that produced it. A sheet that grew to hold a 50-week strip would be a page
// wearing a sheet's clothes.

import { Badge, Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MAJELIS, outstandingOf, rupiah } from '../lib/data'
import { majelisWhen } from '../lib/schedule'
import { IconCheck } from '../lib/icons'
import { MitraCard } from '../lib/mitra-card'
import {
  billableTotal,
  collectStatus,
  collectedTotal,
  paidOf,
  pendingMembers,
  recordedMembers,
  remainingOf,
  store,
  useApp,
  openMajelisEntry,
} from '../lib/store'
import {
  Collapsible,
  ProgressCard,
  SectionTitle,
  StageBar,
  StickyBar,
  VisitTitle,
} from '../lib/ui'

export function CollectionScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)

  const pending = pendingMembers(s)
  const recorded = recordedMembers(s)
  const collected = collectedTotal(s)
  const billable = billableTotal()

  function openCollect(mitraId: string) {
    store.openMitraPage(mitraId)
    flow.go('collect')
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
      <StageBar current={2} />

      <ProgressCard
        title="Terkumpul"
        value={rupiah(collected)}
        of={rupiah(billable)}
        percent={Math.round((collected / billable) * 100)}
        tone="green"
      />

      <SectionTitle>Belum Ditagih</SectionTitle>

      {pending.length > 0 ? (
        <div className="flex flex-col gap-8">
          {pending.map((mitra) => {
            const owed = outstandingOf(mitra)
            return (
              <MitraCard
                key={mitra.id}
                mitra={mitra}
                // The bill replaces the contract facts here. At this moment what
                // she owes outranks the loan it came from, and the loan is one
                // tap away on her page.
                meta={
                  <span className="truncate text-12 text-caption">
                    {owed.missedWeeks > 0
                      ? `${owed.missedWeeks} minggu tertunggak · jatuh tempo hari ini`
                      : 'Jatuh tempo hari ini'}
                  </span>
                }
                onOpen={() => {
                  store.openMitraPage(mitra.id)
                  flow.go('mitra')
                }}
                action={
                  <div className="flex items-center gap-8">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-12 text-caption">Total tagihan</span>
                      <span className="truncate text-18 font-bold text-default">
                        {rupiah(owed.total)}
                      </span>
                    </div>
                    {/* h-40 pins the button to the avatar rhythm. FunDS button
                        sizes step 28 (xs) → 36 (sm), so neither lands on 40 —
                        see NOTES.md. h-40 is a token class, not arbitrary. */}
                    <Button size="sm" className="h-40 px-24" onClick={() => openCollect(mitra.id)}>
                      Tagih
                    </Button>
                  </div>
                }
              />
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 rounded-12 bg-neutral-white py-24 text-center">
          <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
            <IconCheck size={24} />
          </span>
          <span className="text-20 font-bold text-default">Semua mitra sudah ditagih</span>
          <span className="text-12 text-caption">Lanjut ke peluang penawaran.</span>
        </div>
      )}

      {/* Recorded ≠ paid: a mitra who said no is done, and her row says what she
          said. "Ubah" reopens the same page that produced the outcome, so
          leaving the queue never traps an entry. */}
      <Collapsible title="Sudah ditagih" hint={`${recorded.length} mitra`}>
        {recorded.map((mitra) => {
          const status = collectStatus(s, mitra)
          const refusal = s.nonPayments[mitra.id]
          return (
            <div key={mitra.id} className="flex items-center gap-8">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-14 text-default">{mitra.name}</span>
                {status === 'tidak' ? (
                  <span className="truncate text-12 text-caption">
                    {refusal?.reason}
                    {refusal?.ptp ? ` · Janji ${refusal.ptp}` : ' · Tanpa janji'}
                  </span>
                ) : null}
              </div>
              {status === 'lunas' ? (
                <Badge intent="green" leadingIcon={<IconCheck size={16} />}>
                  {rupiah(paidOf(s, mitra))}
                </Badge>
              ) : status === 'sebagian' ? (
                <Badge intent="orange">Kurang {rupiah(remainingOf(s, mitra))}</Badge>
              ) : (
                <Badge intent="red">Tidak bayar</Badge>
              )}
              <Button size="xs" variant="ghost" onClick={() => openCollect(mitra.id)}>
                Ubah
              </Button>
            </div>
          )
        })}
      </Collapsible>

      <StickyBar>
        {pending.length > 0 ? (
          <span className="text-center text-12 text-caption">
            {pending.length} mitra belum ditagih — bisa dilanjut nanti
          </span>
        ) : null}
        <Button size="lg" className="w-full" onClick={() => flow.go('growth')}>
          Lanjut
        </Button>
      </StickyBar>
    </Screen>
  )
}
