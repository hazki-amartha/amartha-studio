'use client'

// Stage 2 of 3 — Penagihan.
//
// Same roster, same order, same cards as the attendance stage — only the row
// under the rule has changed, from a register question to a bill. That is the
// whole idea of this direction now: the BP works one list three times and never
// has to find her place again, because the list never re-sorts itself. A card
// that has been dealt with says so where it stands; it does not travel to a
// "Sudah Ditagih" section the moment she taps.
//
// The stage's job is to RECORD an outcome for everyone, not to make everyone
// lunas — a card is done once it carries an outcome of ANY kind, "tidak bayar"
// included.
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
import { MAJELIS, isSelfServe, outstandingOf, rupiah } from '../lib/data'
import { majelisWhen } from '../lib/schedule'
import { IconCheck } from '../lib/icons'
import { DpdBadge, MitraCard } from '../lib/mitra-card'
import {
  billableTotal,
  collectStatus,
  collectedTotal,
  paidOf,
  pendingMembers,
  remainingOf,
  store,
  useApp,
  openMajelisEntry,
} from '../lib/store'
import {
  ActionRow,
  ProductBadge,
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

      <SectionTitle>Daftar Mitra</SectionTitle>

      <div className="flex flex-col gap-8 pb-16">
        {MAJELIS.members.map((mitra) => {
          const status = collectStatus(s, mitra)
          const owed = outstandingOf(mitra)
          const paid = paidOf(s, mitra)
          // She settled before the BP arrived — through the app, an agent or a
          // transfer. Money the BP never handles, so her card carries the fact
          // and no button: there is nothing to tagih from her, and offering the
          // control would invite a double entry.
          const selfPaid = isSelfServe(mitra) && status === 'lunas'
          const refusal = s.nonPayments[mitra.id]

          return (
            <MitraCard
              key={mitra.id}
              mitra={mitra}
              // Identical to stage 1, deliberately. See attendance.tsx.
              meta={null}
              labels={
                <>
                  <ProductBadge product={mitra.product} />
                  <DpdBadge dpd={mitra.dpd} format="short" />
                </>
              }
              onOpen={() => {
                store.openMitraPage(mitra.id)
                flow.go('mitra')
              }}
              action={
                selfPaid ? (
                  <ActionRow label="Dibayar mandiri" value={rupiah(paid)}>
                    <Badge intent="green" leadingIcon={<IconCheck size={16} />}>
                      Lunas
                    </Badge>
                  </ActionRow>
                ) : status === 'belum' ? (
                  <ActionRow label="Tagihan" value={rupiah(owed.total)}>
                    {/* Default size, not sm: sm sets 12px type and the pills on
                        the attendance stage are 14px, so the same card read at
                        two different sizes from one stage to the next. h-40
                        pins it to the avatar rhythm — see NOTES.md. */}
                    <Button className="h-40 px-24" onClick={() => openCollect(mitra.id)}>
                      Tagih
                    </Button>
                  </ActionRow>
                ) : (
                  <ActionRow
                    label={status === 'tidak' ? 'Tidak bayar' : 'Dibayar hari ini'}
                    value={
                      status === 'tidak'
                        ? `${refusal?.reason ?? ''}${refusal?.ptp ? ` · janji ${refusal.ptp}` : ''}`
                        : // A part-payment says why it was short, the same way a
                          // refusal says why it was a refusal.
                          `${rupiah(paid)}${
                            status === 'sebagian' && s.shortfallReasons[mitra.id]
                              ? ` · ${s.shortfallReasons[mitra.id]}`
                              : ''
                          }`
                    }
                  >
                    <div className="flex items-center gap-8">
                      {status === 'lunas' ? (
                        <Badge intent="green" leadingIcon={<IconCheck size={16} />}>
                          Lunas
                        </Badge>
                      ) : status === 'sebagian' ? (
                        <Badge intent="orange">Kurang {rupiah(remainingOf(s, mitra))}</Badge>
                      ) : (
                        <Badge intent="red">Tidak bayar</Badge>
                      )}
                      {/* "Ubah" reopens the same page that produced the outcome,
                          so a recorded entry is never trapped. */}
                      <Button size="xs" variant="ghost" onClick={() => openCollect(mitra.id)}>
                        Ubah
                      </Button>
                    </div>
                  </ActionRow>
                )
              }
            />
          )
        })}
      </div>

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
