'use client'

// Step 2 of 3 — Tugas Tambahan.
//
// The same mitra list as step 1, rendered by the same MitraCard, with only the
// action row swapped for the recommended action. The sameness is doing work: the
// BP is looking at the same faces in the same layout, so the only thing they
// have to read is what changed — the recommendation.
//
// Cross-sell is nice-to-have, so the sequence carries the priority rather than
// the visual weight: this step comes AFTER collection, is capped at one action
// per mitra, and is skippable — "Lanjut" is always enabled. Only mitra who have
// a recommendation are listed at all.

import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMajelis } from '../lib/data'
import { IconCheck } from '../lib/icons'
import { MitraCard } from '../lib/mitra-card'
import { store, useApp } from '../lib/store'
import { StepBar } from '../lib/ui'

export function MajelisOffersScreen() {
  const flow = useFlow()
  const s = useApp()
  const majelis = findMajelis(s.openMajelis)

  const recommended = majelis.members.filter((m) => m.offer)
  const doneCount = recommended.filter((m) => s.offered.includes(m.id)).length

  return (
    <Screen topBar={<NavigationHeader title={majelis.name} onBack={() => flow.back()} />}>
      <StepBar current={2} />

      {recommended.length > 0 ? (
        <>
          <Card>
            <div className="flex items-center gap-12">
              <div className="flex flex-1 flex-col gap-2">
                <span className="text-12 text-caption">Bisa ditawari</span>
                <span className="text-24 font-bold text-default">
                  {recommended.length} dari {majelis.members.length} mitra
                </span>
              </div>
              <Badge intent="neutral">Opsional</Badge>
            </div>
          </Card>

          <div className="flex flex-col gap-8">
            {recommended.map((mitra) => {
              const offered = s.offered.includes(mitra.id)
              return (
                <MitraCard
                  key={mitra.id}
                  mitra={mitra}
                  state={s}
                  action={
                    // Same row shape as step 1: the recommendation, then its action.
                    <div className="flex items-center gap-8">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-12 font-bold text-default">
                          {mitra.offer?.label}
                        </span>
                        <span className="truncate text-12 text-caption">{mitra.offer?.reason}</span>
                      </div>
                      {offered ? (
                        <Badge intent="green" leadingIcon={<IconCheck size={16} />}>
                          Ditawarkan
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => store.markOffered(mitra.id)}
                        >
                          Tawarkan
                        </Button>
                      )}
                    </div>
                  }
                />
              )
            })}
          </div>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="text-20 font-bold text-default">Tidak ada tugas tambahan</span>
            <span className="text-12 text-caption">Lanjut untuk menutup kunjungan.</span>
          </div>
        </Card>
      )}

      <div className="sticky bottom-0 -mx-16 mt-auto border-t border-default bg-neutral-white p-16">
        <Button size="lg" className="w-full" onClick={() => flow.go('majelis-proof')}>
          {doneCount > 0 || recommended.length === 0 ? 'Lanjut' : 'Lewati'}
        </Button>
      </div>
    </Screen>
  )
}
