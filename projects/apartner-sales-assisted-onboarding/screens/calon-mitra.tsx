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
import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import type { BadgeIntent } from '@/design-system/components/Badge'
import { ArrowLeft, CalendarDots, CheckCircle, Hourglass, MapPin, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { dateFromToday, majelisLine, surveyStatusLabel, type SurveyMode } from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { OnboardingModeSheet } from '../lib/pipeline-ui'
import {
  APPLICATION_SECTIONS,
  RITUAL_POINTS,
  doneCount,
  doneStepIds,
  sectionComplete,
  setActiveSection,
  useSurvey,
} from '../lib/survey'
import { isMajelisActivated, isMemberAccepted, setFormation, useFormation } from '../lib/formation'
import { DRAFT_SCHEDULE, MAJELIS_DIRECTORY, MIN_MEMBERS } from '../lib/schedule'
import { store } from '../lib/store'
import { AppScreen, ContactButton, StickyBar } from '../lib/ui'

export function CalonMitraScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const survey = useSurvey()
  const formation = useFormation()
  const lead = leads[openId]
  // The survey-mode choice (assisted / self) is made here, at the first Survey
  // Uji Kelayakan tap — not back at registration.
  const [modeOpen, setModeOpen] = useState(false)
  // After Submit Onboarding the page shows a loading state until the BP taps the
  // control that finishes the (simulated) underwriting.
  const [submitting, setSubmitting] = useState(false)

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
  const existingId = assignment.kind === 'existing' ? assignment.id : ''
  const newMajelisName = assignment.kind === 'new' ? assignment.name : ''
  const accepted = isMemberAccepted(formation, lead)

  // Majelis card data. An existing group carries its directory place + slot; a
  // new (draft) majelis carries how many of its calon mitra are approved vs
  // still in progress (survey ongoing / submitted).
  const existingEntry = isExisting ? MAJELIS_DIRECTORY.find((m) => m.id === existingId) : undefined
  const newAssign = assignment.kind === 'new' ? assignment : undefined
  const newSched = isNewMajelis ? DRAFT_SCHEDULE[newMajelisName] : undefined
  const newLocation = newAssign?.location ?? newSched?.location
  const newDay = newAssign?.day ?? newSched?.day
  const newTime = newAssign?.time ?? newSched?.time
  const newMembers = isNewMajelis
    ? Object.values(leads).filter((l) => l.majelis.kind === 'new' && l.majelis.name === newMajelisName)
    : []
  const newApprovedCount = newMembers.filter((l) => l.status === 'approved').length
  const newInProgressCount = newMembers.filter(
    (l) => l.status === 'survey-created' || l.status === 'survey-submitted',
  ).length

  // Ready-for-disbursement (approved) routing: an existing majelis or an already-
  // formed new majelis can disburse; a new majelis with enough approved members
  // can be formed; otherwise it waits for more members.
  const activatedNew = isNewMajelis && isMajelisActivated(formation, newMajelisName)
  const readyToForm = isNewMajelis && !activatedNew && newApprovedCount >= MIN_MEMBERS
  const canDisburse = isExisting || activatedNew

  // Once approved she is Ready for disbursement — the same status for everyone,
  // whatever her majelis state. Before that, the badge follows the survey stage.
  const statusLabel = approved ? 'Waiting for disbursement' : surveyStatusLabel(lead.status)
  const statusIntent: BadgeIntent = approved ? 'green' : submitted ? 'blue' : 'orange'

  // Once the survey is submitted or approved it is read-only — nothing to fill in.
  const readOnly = submitted || approved

  // A submitted / approved survey reads complete regardless of session progress;
  // self-serve uji-kelayakan is the mitra's own AFin form, not the BP's.
  const complete = (id: (typeof APPLICATION_SECTIONS)[number]['id']) =>
    readOnly || sectionComplete(survey, lead.id, id)
  const required = APPLICATION_SECTIONS.filter((s) => !(isSelf && s.id === 'uji-kelayakan'))
  const ritualDone = readOnly || doneStepIds(survey, lead.id, 'ritual').length >= RITUAL_POINTS.length
  const allDone = required.every((s) => complete(s.id)) && ritualDone

  // Submit rule: an EXISTING majelis must have completed KM acceptance first; a
  // NEW majelis can submit even before it is activated.
  const needsAcceptance = isExisting && !accepted
  const canSubmit = allDone && !needsAcceptance

  // Survey cards, in display order: Uji Kelayakan first, then BP Feedback.
  const orderedSections = (['uji-kelayakan', 'bp-feedback'] as const)
    .map((id) => APPLICATION_SECTIONS.find((s) => s.id === id))
    .filter((s): s is (typeof APPLICATION_SECTIONS)[number] => Boolean(s))

  function openSection(id: (typeof APPLICATION_SECTIONS)[number]['id']) {
    setActiveSection(id)
    flow.go('survey-form')
  }

  // First Uji Kelayakan tap picks the mode: assisted opens the BP's form; self
  // hands it to the calon mitra on AFin (the card then shows the self state).
  function pickMode(mode: SurveyMode) {
    pipelineStore.chooseSurveyMode(lead.id, mode)
    setModeOpen(false)
    if (mode === 'assisted') openSection('uji-kelayakan')
  }

  // Submit stays on the page: the survey goes in and a loading state shows until
  // the BP finishes the (simulated) underwriting.
  function submit() {
    pipelineStore.submitSurvey(lead.id)
    setSubmitting(true)
  }

  function finishUnderwriting() {
    pipelineStore.approveSurvey(lead.id)
    setSubmitting(false)
  }

  // Survey progress is already saved to the survey store on every toggle, so
  // "save for later" just leaves the onboarding open and returns to Sales.
  function saveForLater() {
    pipelineStore.setFlash(`Progress onboarding ${lead.name} disimpan`)
    flow.go('sales')
  }

  // The Majelis name opens the group's page — an existing directory group, or the
  // new (draft) majelis' page.
  function openMajelis() {
    store.openMajelisPage(
      isExisting ? { kind: 'existing', id: existingId } : { kind: 'draft', name: newMajelisName },
    )
    flow.go('majelis-page')
  }

  function startGroupFormation() {
    setFormation({ mode: 'form', majelisName: newMajelisName, memberCount: newApprovedCount })
    flow.go('group-formation')
  }

  function startDisbursement() {
    flow.go('disbursement')
  }

  // Start the KM (Ketua Majelis) acceptance for this lead into her existing
  // group — the member-acceptance flow (Perjanjian).
  function startKmAcceptance() {
    setFormation({
      mode: 'accept',
      majelisName: existingEntry?.name ?? majelisLine(lead),
      memberIds: [lead.id],
      memberNames: [lead.name],
    })
    flow.go('group-formation')
  }

  const header = (
    <header className="flex shrink-0 items-center gap-8 border-b border-default bg-neutral-white px-16 py-8">
      <button
        type="button"
        onClick={() => flow.go('sales')}
        aria-label="Kembali"
        className="-ml-4 flex h-32 w-32 shrink-0 items-center justify-center text-default"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-16 font-bold text-default">{lead.name}</span>
        <span className="flex">
          <Badge intent={statusIntent} size="sm">
            {statusLabel}
          </Badge>
        </span>
        {submitted ? (
          <span className="text-10 text-caption">
            Waiting for underwriting results · ETA: {dateFromToday(3)}
          </span>
        ) : null}
      </div>
      <ContactButton label={`Chat WhatsApp ${lead.name}`} tone="green" onClick={() => {}}>
        <WhatsappLogo size={20} />
      </ContactButton>
      <ContactButton label={`Peta ${lead.name}`} tone="red" onClick={() => {}}>
        <MapPin size={20} />
      </ContactButton>
    </header>
  )

  // Loading state after Submit — held until the BP taps the control below.
  if (submitting) {
    return (
      <AppScreen topBar={header}>
        <div className="flex flex-1 flex-col items-center justify-center gap-12 py-48 text-center">
          <span className="flex h-48 w-48 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <Hourglass size={24} />
          </span>
          <div className="flex flex-col gap-2">
            <span className="text-16 font-bold text-default">Memproses onboarding</span>
            <span className="text-12 text-caption">
              Survey masuk — KYC &amp; underwriting sedang berjalan.
            </span>
          </div>
          {/* Orange = a simulation control, not part of the real design. */}
          <button
            type="button"
            onClick={finishUnderwriting}
            className="rounded-full border border-orange-500 bg-orange-50 px-16 py-8 text-14 font-bold text-orange-500"
          >
            Tandai underwriting selesai
          </button>
        </div>
      </AppScreen>
    )
  }

  return (
    <AppScreen topBar={header}>
      {/* Majelis card — name, place + kumpulan slot, then the stage. A new
          (draft) majelis shows its approved / in-progress counts; an existing
          group shows the KM-acceptance state and its Start button. Both can open
          the Majelis page. */}
      {isExisting || isNewMajelis ? (
        <Card>
          <div className="flex flex-col gap-8">
            <div className="flex items-start gap-8">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {/* The name opens the Majelis page. */}
                <button
                  type="button"
                  onClick={openMajelis}
                  className="min-w-0 truncate text-left text-16 font-bold text-link underline"
                >
                  {isExisting ? existingEntry?.name ?? majelisLine(lead) : newMajelisName}
                </button>
                <span className="flex items-center gap-4 text-12 text-caption">
                  <MapPin size={16} />
                  <span className="min-w-0 truncate">
                    {isExisting
                      ? existingEntry?.place ?? 'Wilayah BP'
                      : newLocation ?? 'Belum ada lokasi'}
                  </span>
                </span>
                <span className="flex items-center gap-4 text-12 text-caption">
                  <CalendarDots size={16} />
                  <span className="min-w-0 truncate">
                    {isExisting
                      ? `Kumpulan ${existingEntry?.day}, ${existingEntry?.time}`
                      : newDay && newTime
                        ? `Kumpulan ${newDay}, ${newTime}`
                        : 'Belum ada jadwal'}
                  </span>
                </span>
              </div>
              {/* Existing group: a Start CTA runs KM acceptance while pending; a
                  green check once she is accepted. */}
              {isExisting ? (
                accepted ? (
                  <span className="shrink-0 text-green-500">
                    <CheckCircle size={24} />
                  </span>
                ) : (
                  <Button size="sm" variant="outline" onClick={startKmAcceptance}>
                    Start
                  </Button>
                )
              ) : null}
            </div>

            {isNewMajelis ? (
              <span className="text-12 font-bold text-blue-600">
                {newApprovedCount} mitra approved · {newInProgressCount} dalam proses
              </span>
            ) : accepted ? (
              <span className="text-12 font-bold text-green-600">Sudah diterima majelis</span>
            ) : (
              <span className="text-12 font-bold text-orange-500">Pending KM Acceptance</span>
            )}
          </div>
        </Card>
      ) : null}

      {/* Survey + ritual cards — hidden once approved (Ready for disbursement). */}
      {!approved ? (
        <>
          {orderedSections.map((sec) => {
        if (isSelf && sec.id === 'uji-kelayakan') {
          return (
            <Card key={sec.id}>
              <div className="flex items-center gap-8">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="flex items-center gap-8">
                    <span className="text-14 font-bold text-disabled">{sec.label}</span>
                    <Badge intent="neutral" size="sm">
                      Self serve
                    </Badge>
                  </span>
                  <span className={`text-12 font-bold ${readOnly ? 'text-green-600' : 'text-orange-500'}`}>
                    {readOnly ? 'Selesai' : 'Belum selesai'}
                  </span>
                </div>
                {readOnly ? (
                  <span className="shrink-0 text-green-500">
                    <CheckCircle size={24} />
                  </span>
                ) : null}
              </div>
            </Card>
          )
        }
        const done = complete(sec.id)
        const count = doneCount(survey, lead.id, sec.id)
        // Uji Kelayakan with no mode chosen yet prompts the choice first.
        const needsMode = sec.id === 'uji-kelayakan' && !lead.surveyMode
        const sub = done
          ? 'Selesai'
          : needsMode
            ? 'Pilih cara pengisian'
            : count === 0
              ? 'Belum diisi'
              : `${count}/${sec.total} selesai`
        return (
          <Card key={sec.id}>
            <div className="flex items-center gap-8">
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="flex items-center gap-8">
                  <span className="text-14 font-bold text-default">{sec.label}</span>
                  {sec.id === 'uji-kelayakan' && lead.surveyMode === 'assisted' ? (
                    <Badge intent="neutral" size="sm">
                      Assisted
                    </Badge>
                  ) : null}
                </span>
                <span className={`text-12 ${done ? 'text-green-600' : 'text-caption'}`}>{sub}</span>
              </span>
              {done ? (
                <span className="shrink-0 text-green-500">
                  <CheckCircle size={24} />
                </span>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => (needsMode ? setModeOpen(true) : openSection(sec.id))}
                >
                  Start
                </Button>
              )}
            </div>
          </Card>
        )
      })}

      {/* Ritual explanation — a box like the others, opening its own page. */}
      {(() => {
        const rDone = doneStepIds(survey, lead.id, 'ritual').length
        const rSub = ritualDone
          ? 'Selesai'
          : rDone === 0
            ? 'Belum diisi'
            : `${rDone}/${RITUAL_POINTS.length} selesai`
        return (
          <Card>
            <div className="flex items-center gap-8">
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-14 font-bold text-default">Ritual explanation</span>
                <span className={`text-12 ${ritualDone ? 'text-green-600' : 'text-caption'}`}>{rSub}</span>
              </span>
              {ritualDone ? (
                <span className="shrink-0 text-green-500">
                  <CheckCircle size={24} />
                </span>
              ) : (
                <Button size="sm" variant="outline" onClick={() => flow.go('ritual')}>
                  Start
                </Button>
              )}
            </div>
          </Card>
        )
      })()}
        </>
      ) : null}

      {/* CTA — Ready for disbursement (approved) routes by majelis state;
          otherwise the survey submit bar. */}
      {approved ? (
        <StickyBar>
          {readyToForm ? (
            <Button size="lg" className="w-full" onClick={startGroupFormation}>
              Start group formation
            </Button>
          ) : !canDisburse ? (
            <span className="text-center text-12 text-caption">
              Menunggu anggota lain — majelis belum cukup untuk dibentuk.
            </span>
          ) : null}
          {/* The disbursement button always shows; it is disabled until the
              majelis is settled (existing, or a new one already formed). */}
          <Button
            size="lg"
            className="w-full"
            disabled={!canDisburse}
            onClick={startDisbursement}
          >
            Start disbursement
          </Button>
        </StickyBar>
      ) : readOnly ? null : (
        <StickyBar>
          {!canSubmit ? (
            <span className="text-center text-12 text-caption">
              {!allDone
                ? 'Lengkapi survey untuk mengirim onboarding.'
                : 'Selesaikan penerimaan majelis (KM) untuk mengirim onboarding.'}
            </span>
          ) : null}
          <Button size="lg" className="w-full" disabled={!canSubmit} onClick={submit}>
            Submit Onboarding
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={saveForLater}>
            Simpan untuk nanti
          </Button>
        </StickyBar>
      )}

      {/* Survey mode — chosen at the first Uji Kelayakan tap. */}
      <OnboardingModeSheet open={modeOpen} onClose={() => setModeOpen(false)} onPick={pickMode} />
    </AppScreen>
  )
}
