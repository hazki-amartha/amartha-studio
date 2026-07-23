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
// Nothing re-sorts when a card is answered; the pills simply fill in.
//
// The whole stage is skippable. It is a tail, and a tail that blocks the close
// of a visit has stopped being a tail.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { growthMembers } from '../lib/data'
import { majelisWhen } from '../lib/schedule'
import { IconCheck, IconTrendUp, IconX } from '../lib/icons'
import { DpdBadge, MitraCard } from '../lib/mitra-card'
import { growthDoneCount, store, useApp, openMajelisEntry } from '../lib/store'
import {
  ActionRow,
  ChoiceList,
  ChoicePill,
  ChosenRow,
  IconTile,
  ProductBadge,
  SectionTitle,
  StageBar,
  StickyBar,
  VisitTitle,
} from '../lib/ui'

// Why she said no to the offer. Borrowed from apartner-task-first's decline
// list: without a reason on file every "tidak tertarik" looks the same, and
// next week's BP can't tell a settled no from a "not right now".
const DECLINE_REASONS = [
  'Belum butuh saat ini',
  'Dana belum ada',
  'Mau diskusi dulu di rumah',
  'Sudah punya di tempat lain',
]

export function GrowthScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)

  // Which card has been opened for an answer. "Tawarkan" is the BP saying she
  // has raised the subject; the outcome pills only exist after that, so a row
  // she never brought up stays visibly un-pitched rather than un-answered.
  const [offering, setOffering] = useState<string | null>(null)

  const members = growthMembers()
  const done = growthDoneCount(s)

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

      <div className="flex items-center gap-12 rounded-12 bg-neutral-white p-12">
        <IconTile tint="green">
          <IconTrendUp size={20} />
        </IconTile>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-14 font-bold text-default">Peluang Penawaran</span>
          <span className="text-12 text-caption">
            {members.length} mitra bisa ditawari sesuatu hari ini
          </span>
        </div>
      </div>

      <SectionTitle>Rekomendasi</SectionTitle>

      <div className="flex flex-col gap-8 pb-16">
        {members.map((mitra) => {
          const growth = mitra.growth
          if (!growth) return null
          const result = s.growthResults[mitra.id]
          const reason = s.growthReasons[mitra.id]
          const open = offering === mitra.id || result !== undefined

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
                <div className="flex flex-col gap-12">
                  <ActionRow label={growth.label} value={growth.value}>
                    {open ? null : (
                      <Button
                        size="sm"
                        className="h-40 px-24"
                        onClick={() => setOffering(mitra.id)}
                      >
                        Tawarkan
                      </Button>
                    )}
                  </ActionRow>

                  {open ? (
                    <div className="flex flex-col gap-12 border-t border-default pt-12">
                      <div className="flex items-center gap-12">
                        <span className="shrink-0 text-14 text-caption">Tanggapan</span>
                        <div className="flex flex-1 gap-8">
                          <ChoicePill
                            selected={result === 'tidak'}
                            icon={<IconX size={16} />}
                            label={`Tidak tertarik — ${mitra.name}`}
                            onClick={() => store.setGrowthResult(mitra.id, 'tidak')}
                          >
                            Tidak
                          </ChoicePill>
                          <ChoicePill
                            selected={result === 'ya'}
                            icon={<IconCheck size={16} />}
                            label={`Tertarik — ${mitra.name}`}
                            onClick={() => store.setGrowthResult(mitra.id, 'ya')}
                          >
                            Tertarik
                          </ChoicePill>
                        </div>
                      </div>

                      {/* A no carries its reason, the same way an absence does —
                          same list, same collapse, so the two stages teach one
                          control rather than two. */}
                      {result === 'tidak' ? (
                        <div className="border-t border-default pt-12">
                          {reason ? (
                            <ChosenRow
                              label="Alasan tidak tertarik"
                              value={reason}
                              onChange={() => store.setGrowthResult(mitra.id, 'tidak')}
                            />
                          ) : (
                            <ChoiceList
                              label="Alasan tidak tertarik"
                              options={DECLINE_REASONS}
                              onPick={(picked) =>
                                store.setGrowthResult(mitra.id, 'tidak', picked)
                              }
                            />
                          )}
                        </div>
                      ) : null}

                      {result === 'ya' ? (
                        <div className="border-t border-default pt-12">
                          <ChosenRow
                            label="Tindak lanjut"
                            value={growth.done}
                            onChange={() => {
                              store.clearGrowthResult(mitra.id)
                              setOffering(mitra.id)
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
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
