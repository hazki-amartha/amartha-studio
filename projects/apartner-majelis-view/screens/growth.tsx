'use client'

// Stage 3 of 3 — Pertumbuhan.
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

import { Badge, Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MAJELIS, growthMembers } from '../lib/data'
import { IconCheck, IconTrendUp } from '../lib/icons'
import { MitraCard } from '../lib/mitra-card'
import { growthDoneCount, store, useApp } from '../lib/store'
import { IconTile, SectionTitle, StageBar, StickyBar, VisitTitle } from '../lib/ui'

export function GrowthScreen() {
  const flow = useFlow()
  const s = useApp()

  const members = growthMembers()
  const done = growthDoneCount(s)

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={MAJELIS.name} when={MAJELIS.schedule} />}
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
          <span className="text-14 font-bold text-default">Peluang Pertumbuhan</span>
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
                result ? (
                  <div className="flex items-center gap-8">
                    <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-neutral-600">
                      <IconCheck size={16} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-12 text-caption">
                      {result === 'ya' ? growth.done : 'Belum tertarik — ditawarkan lagi nanti'}
                    </span>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => store.setGrowthResult(mitra.id, result === 'ya' ? 'tidak' : 'ya')}
                    >
                      Ubah
                    </Button>
                  </div>
                ) : (
                  // Two outcomes, not one button. "Ditawarkan" records that the
                  // BP spoke, which nobody downstream can act on; what the mitra
                  // SAID is the part worth capturing.
                  <div className="flex gap-8">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-40 flex-1"
                      onClick={() => store.setGrowthResult(mitra.id, 'tidak')}
                    >
                      Belum
                    </Button>
                    <Button
                      size="sm"
                      className="h-40 flex-1"
                      onClick={() => store.setGrowthResult(mitra.id, 'ya')}
                    >
                      {growth.action}
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
