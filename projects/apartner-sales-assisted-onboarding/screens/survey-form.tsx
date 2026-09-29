'use client'

// The shared survey step-form — BP Feedback (typed fields from the Assisted
// Onboarding field list) and Survey Uji Kelayakan (plain questions). Which one
// it shows is set on the survey store before navigating here. "Lanjut" marks the
// step done and advances; the last step's "Selesai" returns to the survey page.
// Field values are local (the survey page only tracks step completion).

import { useState } from 'react'
import { BottomSheet, Button, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Camera, Check, FileCheck } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { usePipeline } from '../lib/pipeline-store'
import { detailScreen } from '../lib/pipeline'
import {
  APPLICATION_SECTIONS,
  doneStepIds,
  getActiveSection,
  markProcessed,
  stepsFor,
  surveyStore,
  useSurvey,
  type Field,
} from '../lib/survey'
import { PickSheet, SelectField } from '../lib/pipeline-ui'
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
  // Field values — local to this visit.
  const [values, setValues] = useState<Record<string, string>>({})
  const [fieldNotes, setFieldNotes] = useState<Record<string, string>>({})
  const [fotos, setFotos] = useState<Record<string, boolean>>({})
  const [multi, setMulti] = useState<Record<string, string[]>>({})
  const [sheet, setSheet] = useState<{ key: string; label: string; options: string[] } | null>(null)
  const [multiSheet, setMultiSheet] = useState<{ key: string; label: string; options: string[] } | null>(
    null,
  )

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
  // Return to whichever Calon Mitra detail she came from.
  const detail = detailScreen(lead)

  function next() {
    surveyStore.markStep(lead.id, section, current.id)
    if (isLast) {
      // Section just completed — start its brief "Diproses" window.
      markProcessed(lead.id, section)
      flow.go(detail)
    } else setStep(step + 1)
  }

  function renderField(f: Field, i: number) {
    const k = `${current.id}-${i}`

    if (f.type === 'foto') {
      return (
        <div key={k} className="flex flex-col gap-8">
          <span className="text-12 font-regular text-default">{f.label}</span>
          {fotos[k] ? (
            <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12">
              <span className="text-green-500">
                <FileCheck size={20} />
              </span>
              <span className="flex-1 text-default">Foto + lat/long terlampir</span>
              <button
                type="button"
                onClick={() => setFotos({ ...fotos, [k]: false })}
                className="shrink-0 text-12 font-bold text-link"
              >
                Ambil ulang
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setFotos({ ...fotos, [k]: true })}
              className="flex w-full flex-col items-center gap-4 rounded-8 border border-dashed border-default bg-canvas-blue p-16 text-caption"
            >
              <Camera size={24} />
              <span className="text-14 text-default">Ambil foto</span>
              <span className="text-12">Foto + lat/long</span>
            </button>
          )}
        </div>
      )
    }

    if (f.type === 'multiselect') {
      const sel = multi[k] ?? []
      return (
        <SelectField
          key={k}
          label={f.label}
          value={sel.length ? `${sel.length} indikasi dipilih` : undefined}
          placeholder="Pilih indikasi"
          onClick={() => setMultiSheet({ key: k, label: f.label, options: f.options ?? [] })}
        />
      )
    }

    // dropdown / dropdown-notes
    return (
      <div key={k} className="flex flex-col gap-8">
        <SelectField
          label={f.label}
          value={values[k] || undefined}
          placeholder="Pilih jawaban"
          onClick={() => setSheet({ key: k, label: f.label, options: f.options ?? [] })}
        />
        {f.type === 'dropdown-notes' ? (
          <Input
            value={fieldNotes[k] ?? ''}
            onChange={(e) => setFieldNotes({ ...fieldNotes, [k]: e.target.value })}
            placeholder="Catatan (opsional)"
          />
        ) : null}
      </div>
    )
  }

  return (
    <AppScreen topBar={<NavigationHeader title={label} onBack={() => flow.go(detail)} />}>
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

      <div className="flex flex-col gap-16">
        {current.fields
          ? current.fields.map(renderField)
          : (current.questions ?? []).map((q, i) => (
              <Input key={i} label={q} placeholder="Tulis jawaban" />
            ))}
      </div>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={next}>
          {isLast ? 'Selesai' : 'Lanjut'}
        </Button>
      </StickyBar>

      <PickSheet
        open={Boolean(sheet)}
        title={sheet?.label ?? ''}
        options={sheet?.options ?? []}
        value={sheet ? values[sheet.key] ?? '' : ''}
        onClose={() => setSheet(null)}
        onPick={(v) => {
          if (sheet) setValues({ ...values, [sheet.key]: v })
          setSheet(null)
        }}
      />

      {/* Multi-select — a checkbox bottom sheet. */}
      {multiSheet ? (
        <BottomSheet
          open
          onClose={() => setMultiSheet(null)}
          title={multiSheet.label}
          primaryAction={
            <Button size="lg" className="w-full" onClick={() => setMultiSheet(null)}>
              Simpan
            </Button>
          }
        >
          <div className="flex flex-col gap-8">
            {multiSheet.options.map((o) => {
              const sel = multi[multiSheet.key] ?? []
              return (
                <SelectableCard
                  key={o}
                  name={`multi-${multiSheet.key}`}
                  inputType="checkbox"
                  title={o}
                  checked={sel.includes(o)}
                  onChange={() =>
                    setMulti({
                      ...multi,
                      [multiSheet.key]: sel.includes(o)
                        ? sel.filter((x) => x !== o)
                        : [...sel, o],
                    })
                  }
                />
              )
            })}
          </div>
        </BottomSheet>
      ) : null}
    </AppScreen>
  )
}
