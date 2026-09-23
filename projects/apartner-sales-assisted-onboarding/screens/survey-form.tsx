'use client'

// The shared survey step-form — BP Feedback (3 steps) and Survey Uji Kelayakan
// (6 steps). Which one it shows is set on the survey store before navigating
// here. Each step lists three placeholder questions; "Lanjut" marks the step
// done and advances, the last step's "Selesai" returns to the survey page. The
// step is recorded as done in the store, so the survey page reflects progress.

import { useState } from 'react'
import { Button, Input, NavigationHeader } from '@/design-system/components'
import { Check } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { usePipeline } from '../lib/pipeline-store'
import {
  APPLICATION_SECTIONS,
  doneStepIds,
  getActiveSection,
  stepsFor,
  surveyStore,
  useSurvey,
} from '../lib/survey'
import { AppScreen, StickyBar } from '../lib/ui'

export function SurveyFormScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const survey = useSurvey()
  const lead = leads[openId]
  const section = getActiveSection()
  const steps = stepsFor(section)
  const label = APPLICATION_SECTIONS.find((s) => s.id === section)?.label ?? 'Survey'

  // Resume at the first step not yet completed; else the last.
  const [step, setStep] = useState(() => {
    const done = leads[openId] ? doneStepIds(surveyStore.get(), openId, section) : []
    const idx = steps.findIndex((s) => !done.includes(s.id))
    return idx === -1 ? steps.length - 1 : idx
  })

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title={label} onBack={() => flow.go('calon-mitra')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const current = steps[step]
  const isLast = step === steps.length - 1
  const done = doneStepIds(survey, lead.id, section)

  function next() {
    surveyStore.markStep(lead.id, section, current.id)
    if (isLast) flow.go('calon-mitra')
    else setStep(step + 1)
  }

  return (
    <AppScreen topBar={<NavigationHeader title={label} onBack={() => flow.go('calon-mitra')} />}>
      {/* Step tabs — jump between steps; a check marks a completed one. */}
      <div className="flex gap-8 overflow-x-auto pb-2">
        {steps.map((s, i) => {
          const isDone = done.includes(s.id)
          const isCurrent = i === step
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`Langkah ${i + 1}: ${s.title}${isDone ? ' (selesai)' : ''}`}
              className={`flex h-32 shrink-0 items-center gap-4 rounded-full border px-12 text-12 font-bold ${
                isCurrent
                  ? 'border-primary-500 bg-primary-50 text-primary-500'
                  : isDone
                    ? 'border-green-500 bg-green-50 text-green-600'
                    : 'border-default bg-neutral-white text-caption'
              }`}
            >
              <span>{i + 1}</span>
              {isDone ? <Check size={16} /> : null}
            </button>
          )
        })}
      </div>

      <span className="text-18 font-bold text-default">
        Langkah {step + 1} · {current.title}
      </span>

      <div className="flex flex-col gap-12">
        {current.questions.map((q, i) => (
          <Input key={i} label={q} placeholder="Tulis jawaban" />
        ))}
      </div>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={next}>
          {isLast ? 'Selesai' : 'Lanjut'}
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
