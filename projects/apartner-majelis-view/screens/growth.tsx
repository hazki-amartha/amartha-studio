'use client'

// Stage 3 of 3 — Penawaran.
//
// The cross-sell tail, and it comes last on purpose: money first, offers after.
// A BP who pitched a savings product before collecting would be asking a woman
// to open an account with the instalment she has not handed over yet.
//
// Only mitra with an actual recommendation appear. The reference shows four rows
// on a 22-member majelis, which is the right ratio — an offer for everyone is a
// list nobody reads. Each row states where she STANDS ("Belum pernah menabung")
// rather than what to say about it; the BP reads a fact and draws the obvious
// conclusion, which is the same move the mitra page makes.
//
// The whole stage is skippable. It is a tail, and a tail that blocks the close
// of a visit has stopped being a tail.

import { useState } from 'react'
import { Badge, Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MAJELIS, growthMembers } from '../lib/data'
import { majelisWhen } from '../lib/schedule'
import { IconCheck, IconTrendUp } from '../lib/icons'
import { MitraCard } from '../lib/mitra-card'
import { growthDoneCount, store, useApp, openMajelisEntry } from '../lib/store'
import { Chip, ChipGroup, IconTile, SectionTitle, StageBar, StickyBar, VisitTitle } from '../lib/ui'

// Why she said no to the offer. Borrowed from apartner-task-first's decline
// list: without a reason on file every "tidak tertarik" looks the same, and
// next week's BP can't tell a settled no from a "not right now".
const DECLINE_REASONS = [
  'Belum butuh saat ini',
  'Dana belum ada',
  'Mau diskusi dulu di rumah',
  'Sudah punya di tempat lain',
  'Tidak berminat',
]

export function GrowthScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)

  // Which card is picking its decline reason. "Tidak tertarik" opens the reason
  // picker in place rather than recording the no outright — the result is only
  // saved once she's said why. Local state, matching the attendance stage:
  // nothing is recorded until a reason is chosen, so leaving abandons the tap.
  const [asking, setAsking] = useState<string | null>(null)

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

      <div className="flex flex-col gap-8">
        {members.map((mitra) => {
          const growth = mitra.growth
          if (!growth) return null
          const result = s.growthResults[mitra.id]
          return (
            <MitraCard
              key={mitra.id}
              mitra={mitra}
              // Her standing on the thing being offered replaces the contract
              // facts — this stage is not about her loan.
              meta={<span className="truncate text-12 text-caption">{growth.status}</span>}
              trailing={<Badge intent="primary">{growth.label}</Badge>}
              onOpen={() => {
                store.openMitraPage(mitra.id)
                flow.go('mitra')
              }}
              action={
                asking === mitra.id ? (
                  // "Tidak tertarik" was tapped; capture WHY before the row
                  // resolves. Picking a reason records the no in one gesture.
                  <div className="flex flex-col gap-12">
                    <ChipGroup label={`Alasan tidak tertarik — ${mitra.name}`}>
                      {DECLINE_REASONS.map((reason) => (
                        <Chip
                          key={reason}
                          selected={s.growthReasons[mitra.id] === reason}
                          onClick={() => {
                            store.setGrowthResult(mitra.id, 'tidak', reason)
                            setAsking(null)
                          }}
                        >
                          {reason}
                        </Chip>
                      ))}
                    </ChipGroup>
                    <Button size="sm" variant="ghost" onClick={() => setAsking(null)}>
                      Batal
                    </Button>
                  </div>
                ) : result ? (
                  <div className="flex items-center gap-8">
                    <span
                      className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-full ${result === 'ya' ? 'bg-green-50 text-green-500' : 'bg-neutral-50 text-neutral-600'}`}
                    >
                      <IconCheck size={16} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-12 text-caption">
                      {result === 'ya'
                        ? growth.done
                        : `Tidak tertarik${s.growthReasons[mitra.id] ? ` — ${s.growthReasons[mitra.id]}` : ''}`}
                    </span>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() =>
                        result === 'ya' ? setAsking(mitra.id) : store.setGrowthResult(mitra.id, 'ya')
                      }
                    >
                      Ubah
                    </Button>
                  </div>
                ) : (
                  // Two outcomes, not one button. What the mitra SAID is the part
                  // worth capturing — and a no carries its reason before it lands.
                  <div className="flex gap-8">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-40 flex-1"
                      onClick={() => setAsking(mitra.id)}
                    >
                      Tidak tertarik
                    </Button>
                    <Button
                      size="sm"
                      className="h-40 flex-1"
                      onClick={() => store.setGrowthResult(mitra.id, 'ya')}
                    >
                      Tertarik
                    </Button>
                  </div>
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
