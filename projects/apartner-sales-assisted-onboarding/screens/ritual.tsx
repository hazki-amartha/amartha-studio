'use client'

// Ritual explanation — the third onboarding box on the Calon Mitra page opens
// this dedicated page: the three ritual points the BP runs through with the
// calon mitra, each a checkbox. Progress is saved to the survey store, so the
// box reflects how many are done; "Selesai" returns.

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { CheckCircle } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { usePipeline } from '../lib/pipeline-store'
import { RITUAL_POINTS, doneStepIds, surveyStore, useSurvey } from '../lib/survey'
import { AppScreen, StickyBar } from '../lib/ui'

const POINT_ID = (i: number) => `r${i}`

export function RitualScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const survey = useSurvey()
  const lead = leads[openId]

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Ritual explanation" onBack={() => flow.go('calon-mitra')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const done = doneStepIds(survey, lead.id, 'ritual')

  return (
    <AppScreen
      topBar={<NavigationHeader title="Ritual explanation" onBack={() => flow.go('calon-mitra')} />}
    >
      <span className="text-14 text-caption">
        Jalankan dan centang ketiga ritual berikut bersama calon anggota majelis.
      </span>

      <Card>
        <div className="flex flex-col">
          {RITUAL_POINTS.map((point, i) => {
            const checked = done.includes(POINT_ID(i))
            return (
              <button
                key={point}
                type="button"
                onClick={() => surveyStore.toggleStep(lead.id, 'ritual', POINT_ID(i))}
                className={`flex items-center gap-12 py-12 text-left ${i > 0 ? 'border-t border-default' : ''}`}
              >
                <span className="shrink-0">
                  {checked ? (
                    <span className="text-green-500">
                      <CheckCircle size={24} />
                    </span>
                  ) : (
                    <span className="block h-24 w-24 rounded-full border-2 border-neutral-400" />
                  )}
                </span>
                <span className="min-w-0 flex-1 text-14 text-default">{point}</span>
              </button>
            )
          })}
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => flow.go('calon-mitra')}>
          Selesai
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
