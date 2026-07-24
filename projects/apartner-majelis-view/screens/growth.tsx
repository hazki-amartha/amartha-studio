'use client'

// Stage 3 of 3 — Penawaran.
//
// The cross-sell tail, and it comes last on purpose: money first, offers after.
// A BP who pitched a savings product before collecting would be asking a woman
// to open an account with the instalment she has not handed over yet.
//
// Only mitra with an actual recommendation appear — an offer for everyone is a
// list nobody reads — but they appear in the SAME order as the two stages
// before, in the same card, with the offer sitting exactly where the bill sat.
// Nothing re-sorts when a card is answered; the row simply states the result.
//
// "Tawarkan" opens a page, exactly as "Tagih" does. The two actions on a visit
// card now behave identically: the card says what is at stake, the page settles
// it, the card comes back carrying the answer.
//
// The whole stage is skippable. It is a tail, and a tail that blocks the close
// of a visit has stopped being a tail.

import { Badge, Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { growthMembers } from '../lib/data'
import { majelisWhen } from '../lib/schedule'
import { IconCheck } from '../lib/icons'
import { DpdBadge, MitraCard } from '../lib/mitra-card'
import { growthDoneCount, store, useApp, openMajelisEntry } from '../lib/store'
import {
  ActionRow,
  ProductBadge,
  ProgressCard,
  SectionTitle,
  StageBar,
  StickyBar,
  VisitTitle,
} from '../lib/ui'

export function GrowthScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)

  const members = growthMembers()
  const done = growthDoneCount(s)

  function openOffer(mitraId: string) {
    store.openMitraPage(mitraId)
    flow.go('offer')
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
      <StageBar current={3} />

      {/* The same progress card as the two stages before it, rather than a
          standalone "peluang" banner: all three stages are a count of work done
          out of work in front of her, and the third one saying it differently
          made it read as a different kind of screen. */}
      <ProgressCard
        title="Sudah ditawarkan"
        value={`${done}`}
        of={`${members.length} mitra`}
        percent={members.length > 0 ? Math.round((done / members.length) * 100) : 0}
        tone="green"
      />

      <SectionTitle>Rekomendasi</SectionTitle>

      <div className="flex flex-col gap-8 pb-16">
        {members.map((mitra) => {
          const growth = mitra.growth
          if (!growth) return null
          const result = s.growthResults[mitra.id]
          const reason = s.growthReasons[mitra.id]
          const followUp = s.growthFollowUps[mitra.id]

          return (
            <MitraCard
              key={mitra.id}
              mitra={mitra}
              // Identical to stages 1 and 2. See attendance.tsx.
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
                result === undefined ? (
                  // Her STATE, not the product. "Siap cair Rp5.000.000" and
                  // "Belum pernah menabung" are things the BP can see and open a
                  // sentence from; "Pembiayaan Baru · Rp5.000.000" told her what
                  // the app wanted to sell. The offer page still names the
                  // product — that is where the pitch belongs.
                  <ActionRow label="Peluang" value={growth.status}>
                    {/* Default size, matching the attendance pills and Tagih —
                        see collection.tsx. */}
                    <Button className="h-40 px-24" onClick={() => openOffer(mitra.id)}>
                      Tawarkan
                    </Button>
                  </ActionRow>
                ) : (
                  // Once answered the card is a RECORD, so it names what was put
                  // to her and how it landed.
                  <ActionRow
                    label={result === 'ya' ? growth.label : 'Tidak tertarik'}
                    value={result === 'ya' ? growth.done : (reason ?? 'Tanpa alasan')}
                  >
                    <div className="flex items-center gap-8">
                      {/* A yes that was finished in the room and one that was
                          not are different states on this queue: the second is
                          work the next kumpulan inherits, and badging both
                          "Tertarik" hides it. */}
                      {result === 'ya' && followUp === 'lanjut' ? (
                        <Badge intent="orange">Lanjut kumpulan depan</Badge>
                      ) : result === 'ya' ? (
                        <Badge intent="green" leadingIcon={<IconCheck size={16} />}>
                          Selesai
                        </Badge>
                      ) : (
                        <Badge intent="neutral">Ditolak</Badge>
                      )}
                      {/* "Ubah" reopens the page that produced the answer, so a
                          recorded result is never trapped. */}
                      <Button size="xs" variant="ghost" onClick={() => openOffer(mitra.id)}>
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
        <span className="text-center text-12 text-caption">
          {done} dari {members.length} sudah ditawarkan · langkah ini opsional
        </span>
        <Button size="lg" className="w-full" onClick={() => flow.go('proof')}>
          Lanjut
        </Button>
      </StickyBar>
    </Screen>
  )
}
