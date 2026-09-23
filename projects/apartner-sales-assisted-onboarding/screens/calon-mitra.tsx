'use client'

// Calon Mitra detail — the onboarding page for a lead whose survey is ongoing or
// submitted (status label "Calon Mitra"). It merges the old lead detail and the
// separate onboarding page: her status, the majelis she is joining (with its
// acceptance state), the two survey boxes (BP Feedback · Uji Kelayakan), and
// Submit Onboarding. History sits behind "see history".
//
//   - Existing majelis → a "belum diterima" box that opens the acceptance flow
//     (group-formation, Perjanjian + Ritual). Once accepted it reads "diterima".
//   - New (draft) majelis → no box here; the draft majelis is activated from its
//     own page (see majelis-page / majelis-list).

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card, NavigationHeader } from '@/design-system/components'
import type { BadgeIntent } from '@/design-system/components/Badge'
import { ChevronRight } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { contextSteps, majelisLine } from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import {
  APPLICATION_SECTIONS,
  doneCount,
  sectionComplete,
  setActiveSection,
  useSurvey,
} from '../lib/survey'
import { isLeadAccepted, isMajelisActivated, setFormation, useFormation } from '../lib/formation'
import { store } from '../lib/store'
import { AppScreen, StickyBar } from '../lib/ui'

export function CalonMitraScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const survey = useSurvey()
  const formation = useFormation()
  const lead = leads[openId]
  const [historyOpen, setHistoryOpen] = useState(false)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Calon Mitra" onBack={() => flow.go('sales')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const submitted = lead.status === 'survey-submitted'
  const approved = lead.status === 'approved'
  const isSelf = lead.surveyMode === 'self'
  const assignment = lead.majelis
  const isExisting = assignment.kind === 'existing'
  const isNewMajelis = assignment.kind === 'new'
  const newMajelisName = assignment.kind === 'new' ? assignment.name : ''
  const accepted = isLeadAccepted(formation, lead.id)

  // She becomes a real Mitra once approved AND her majelis is settled: accepted
  // into an existing group, or her new group has been formed and activated.
  const isMitra =
    approved && (isExisting ? accepted : isNewMajelis ? isMajelisActivated(formation, newMajelisName) : false)
  // The status shown under her name follows the pipeline status until she is a Mitra.
  const statusLabel = isMitra
    ? 'Mitra'
    : submitted
      ? 'Survey submitted'
      : approved
        ? 'Survey approved'
        : 'Survey ongoing'
  const statusIntent: BadgeIntent = isMitra || approved ? 'green' : submitted ? 'blue' : 'orange'

  // Once the survey is submitted or approved it is read-only — nothing to fill in.
  const readOnly = submitted || approved

  // A submitted / approved survey reads complete regardless of session progress;
  // self-serve uji-kelayakan is the mitra's own AFin form, not the BP's.
  const complete = (id: (typeof APPLICATION_SECTIONS)[number]['id']) =>
    readOnly || sectionComplete(survey, lead.id, id)
  const required = APPLICATION_SECTIONS.filter((s) => !(isSelf && s.id === 'uji-kelayakan'))
  const allDone = required.every((s) => complete(s.id))

  function openSection(id: (typeof APPLICATION_SECTIONS)[number]['id']) {
    setActiveSection(id)
    flow.go('survey-form')
  }

  function submit() {
    pipelineStore.submitSurvey(lead.id)
    pipelineStore.setFlash(`Survey ${lead.name} dikirim — menunggu keputusan underwriting`)
    flow.go('sales')
  }

  function openAcceptance() {
    setFormation({
      mode: 'accept',
      leadId: lead.id,
      leadName: lead.name,
      majelisName: majelisLine(lead),
    })
    flow.go('group-formation')
  }

  function openNewMajelis() {
    store.openMajelisPage({ kind: 'draft', name: newMajelisName })
    flow.go('majelis-page')
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader title={isMitra ? 'Mitra' : 'Calon Mitra'} onBack={() => flow.go('sales')} />
      }
    >
      {/* Identity + status */}
      <Card>
        <div className="flex flex-col gap-8">
          <div className="flex items-start justify-between gap-8">
            <div className="flex min-w-0 flex-col gap-4">
              <span className="text-20 font-bold text-default">{lead.name}</span>
              <span className="flex">
                <Badge intent={statusIntent}>{statusLabel}</Badge>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="shrink-0 text-12 font-bold text-link underline"
            >
              see history
            </button>
          </div>
          {/* Majelis box — always tappable. An existing group opens the member
              acceptance form; a new (draft) majelis opens its detail page. */}
          {isExisting ? (
            <button
              type="button"
              onClick={openAcceptance}
              className="flex items-center justify-between gap-8 rounded-12 border border-default bg-neutral-white px-12 py-12 text-left active:bg-neutral-50"
            >
              <span className="flex min-w-0 flex-col gap-2">
                <span className="text-14 font-bold text-default">{majelisLine(lead)}</span>
                <span className={`text-12 ${accepted ? 'font-bold text-green-600' : 'text-orange-500'}`}>
                  {accepted ? 'Sudah diterima majelis' : 'Belum diterima majelis'}
                </span>
              </span>
              <span className="shrink-0 text-disabled">
                <ChevronRight size={20} />
              </span>
            </button>
          ) : isNewMajelis ? (
            <button
              type="button"
              onClick={openNewMajelis}
              className="flex items-center justify-between gap-8 rounded-12 border border-default bg-neutral-white px-12 py-12 text-left active:bg-neutral-50"
            >
              <span className="flex min-w-0 flex-col gap-2">
                <span className="text-14 font-bold text-default">{majelisLine(lead)}</span>
                <span className="text-12 text-orange-500">Majelis belum aktif</span>
              </span>
              <span className="shrink-0 text-disabled">
                <ChevronRight size={20} />
              </span>
            </button>
          ) : null}
        </div>
      </Card>

      {/* Onboarding survey — two boxes. */}
      <span className="pt-4 text-16 font-bold text-default">Onboarding</span>
      {APPLICATION_SECTIONS.map((sec) => {
        if (isSelf && sec.id === 'uji-kelayakan') {
          return (
            <Card key={sec.id}>
              <div className="flex flex-col gap-2">
                <span className="text-14 font-bold text-disabled">{sec.label}</span>
                <span className="text-12 text-caption">
                  Self-service: calon mitra mengisi sendiri via AFin
                </span>
                <span className="text-12 font-bold text-orange-500">
                  {readOnly ? 'Selesai' : 'Belum selesai'}
                </span>
              </div>
            </Card>
          )
        }
        const done = complete(sec.id)
        const count = doneCount(survey, lead.id, sec.id)
        const sub = done ? 'Selesai' : count === 0 ? 'Belum diisi' : `${count}/${sec.total} selesai`
        return (
          <Card key={sec.id}>
            <button
              type="button"
              onClick={() => (readOnly ? undefined : openSection(sec.id))}
              disabled={readOnly}
              className="flex w-full items-center gap-8 text-left disabled:cursor-default"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-14 font-bold text-default">{sec.label}</span>
                <span className={`text-12 ${done ? 'text-green-600' : 'text-caption'}`}>{sub}</span>
              </span>
              {readOnly ? null : (
                <span className="shrink-0 text-disabled">
                  <ChevronRight size={20} />
                </span>
              )}
            </button>
          </Card>
        )
      })}

      <StickyBar>
        {isMitra ? (
          <span className="rounded-12 border border-green-500 bg-green-50 px-12 py-12 text-center text-12 font-bold text-green-600">
            Sudah menjadi Mitra {majelisLine(lead)}.
          </span>
        ) : approved ? (
          <span className="rounded-12 border border-green-200 bg-green-50 px-12 py-12 text-center text-12 text-green-600">
            Survey disetujui — selesaikan penerimaan majelis untuk aktivasi.
          </span>
        ) : submitted ? (
          <span className="rounded-12 border border-blue-200 bg-blue-50 px-12 py-12 text-center text-12 text-blue-600">
            Survey sudah masuk — menunggu keputusan underwriting.
          </span>
        ) : (
          <>
            {!allDone ? (
              <span className="text-center text-12 text-caption">
                Lengkapi survey untuk mengirim onboarding.
              </span>
            ) : null}
            <Button size="lg" className="w-full" disabled={!allDone} onClick={submit}>
              Submit Onboarding
            </Button>
          </>
        )}
      </StickyBar>

      {/* History */}
      <BottomSheet open={historyOpen} onClose={() => setHistoryOpen(false)} title="Riwayat">
        <div className="flex flex-col gap-12">
          {contextSteps(lead).map((s, i) => (
            <div key={`${s.date}-${i}`} className="flex flex-col gap-2">
              <span className="text-12 text-caption">{s.date}</span>
              <span className="text-14 font-bold text-default">{s.title}</span>
              {s.detail ? <span className="text-12 italic text-caption">&ldquo;{s.detail}&rdquo;</span> : null}
            </div>
          ))}
        </div>
      </BottomSheet>
    </AppScreen>
  )
}
