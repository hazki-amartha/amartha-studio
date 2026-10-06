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

import { useEffect, useState } from 'react'
import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import type { BadgeIntent } from '@/design-system/components/Badge'
import {
  ArrowLeft,
  CalendarDots,
  CheckCircle,
  ChevronDown,
  Hourglass,
  MapPin,
  WhatsappLogo,
} from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { ISSUE_LABEL, detailScreen, majelisLine, surveyStatusLabel, type SurveyMode } from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { DropLeadSheet, OnboardingModeSheet, PickSheet } from '../lib/pipeline-ui'
import {
  APPLICATION_SECTIONS,
  RITUAL_POINTS,
  doneCount,
  doneStepIds,
  processedSince,
  sectionComplete,
  setActiveSection,
  useSurvey,
} from '../lib/survey'
import {
  isMajelisActivated,
  isMemberAccepted,
  isPerjanjianAgreed,
  setFormation,
  useFormation,
} from '../lib/formation'
import { DRAFT_SCHEDULE, MAJELIS_DIRECTORY } from '../lib/schedule'
import { store } from '../lib/store'
import { Snackbar } from '../lib/snackbar'
import { AppScreen, ContactButton, StickyBar } from '../lib/ui'

// Members a new majelis needs before it can be formed.
const MIN_FORM_MEMBERS = 5

const TUJUAN_OPTIONS = [
  'Pembelian bahan baku produksi',
  'Modal kerja harian',
  'Pengembangan usaha',
  'Pembelian peralatan usaha',
]

// The left-hand status marker on the onboarding cards — a green check once the
// item is done, an empty ring before, so the card doesn't shift left↔right.
function StatusDot({ done }: { done: boolean }) {
  return done ? (
    <span className="shrink-0 text-green-500">
      <CheckCircle size={24} />
    </span>
  ) : (
    <span className="h-24 w-24 shrink-0 rounded-full border-2 border-neutral-200" aria-hidden />
  )
}

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
  // The disbursement purpose, on the Ready-for-disbursement view.
  const [tujuan, setTujuan] = useState(TUJUAN_OPTIONS[0])
  const [tujuanSheet, setTujuanSheet] = useState(false)
  // Survey-ongoing "save for later" / drop actions — which sheet is open.
  const [taskSheet, setTaskSheet] = useState<'drop' | null>(null)
  // Uji Kelayakan shows "Diproses" for ~5s right after it is filled, then settles
  // to "Selesai".
  const [ujiProcessing, setUjiProcessing] = useState(
    () => Boolean(lead) && processedSince(lead.id, 'uji-kelayakan') < 5000,
  )
  useEffect(() => {
    if (!lead) return
    const since = processedSince(lead.id, 'uji-kelayakan')
    if (since >= 5000) {
      setUjiProcessing(false)
      return
    }
    setUjiProcessing(true)
    const t = setTimeout(() => setUjiProcessing(false), 5000 - since)
    return () => clearTimeout(t)
  }, [lead])

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

  // Ready-for-disbursement (approved) routing: an existing majelis or an already-
  // formed new majelis can disburse. A new (draft) majelis can be formed at any
  // time — group formation no longer waits for a minimum of approved members.
  const activatedNew = isNewMajelis && isMajelisActivated(formation, newMajelisName)
  // During onboarding a new majelis only needs its perjanjian agreed; the group
  // itself (ketua + jadwal) is formed after approval.
  const perjanjianDone = isNewMajelis && isPerjanjianAgreed(formation, newMajelisName)
  // A new majelis needs enough members before its perjanjian can be done.
  const enoughToForm = newMembers.length >= MIN_FORM_MEMBERS
  const canDisburse = isExisting || activatedNew

  // A negative underwriting outcome overrides the badge with its own label.
  const issue = lead.onboardingIssue
  // Need-to-resubmit: the Uji Kelayakan (blurry KTP) is re-editable, and once
  // it is redone she can resubmit the onboarding.
  const isResubmit = issue === 'resubmit'

  // Once approved: "Ready for disbursement" if her majelis is settled, else
  // "Waiting for group activation". Before that, the badge follows the survey stage.
  const statusLabel = issue
    ? ISSUE_LABEL[issue]
    : approved
      ? canDisburse
        ? 'Ready for disbursement'
        : 'Waiting for group activation'
      : surveyStatusLabel(lead.status)
  const statusIntent: BadgeIntent = issue
    ? issue === 'hard-reject'
      ? 'red'
      : 'orange'
    : approved
      ? 'green'
      : submitted
        ? 'blue'
        : 'orange'

  // Once the survey is submitted or approved it is read-only — nothing to fill in.
  const readOnly = submitted || approved

  // A submitted / approved survey reads complete regardless of session progress;
  // self-serve uji-kelayakan is the mitra's own AFin form, not the BP's. A
  // resubmit is the exception: its Uji Kelayakan must be redone, so it follows
  // the live survey progress rather than reading complete.
  const complete = (id: (typeof APPLICATION_SECTIONS)[number]['id']) =>
    isResubmit && id === 'uji-kelayakan'
      ? sectionComplete(survey, lead.id, id)
      : readOnly || sectionComplete(survey, lead.id, id)
  const ujiRedone = sectionComplete(survey, lead.id, 'uji-kelayakan')
  const required = APPLICATION_SECTIONS.filter((s) => !(isSelf && s.id === 'uji-kelayakan'))
  const ritualDone = readOnly || doneStepIds(survey, lead.id, 'ritual').length >= RITUAL_POINTS.length
  const allDone = required.every((s) => complete(s.id)) && ritualDone

  // Submit rule: an EXISTING majelis must have completed KM acceptance first; a
  // NEW majelis can submit even before it is activated.
  const needsAcceptance = isExisting && !accepted
  // A new majelis must be formed before the onboarding can be submitted.
  // Before submit, a new majelis needs its perjanjian agreed (not the full group).
  const needsFormation = isNewMajelis && !perjanjianDone
  const canSubmit = allDone && !needsAcceptance && !needsFormation

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

  // Resubmit after fixing the Uji Kelayakan — clears the issue and runs the same
  // (instant) underwriting flow as a first submit.
  function resubmit() {
    pipelineStore.resubmitOnboarding(lead.id)
    setSubmitting(true)
  }

  // Survey ongoing — "Simpan untuk nanti" just saves the latest survey progress
  // (already written on every toggle) and returns to Sales; "Drop lead" ends her.
  function saveForLater() {
    pipelineStore.setFlash(`Progress onboarding ${lead.name} disimpan`)
    flow.go('sales')
  }

  function dropLead(reason: string) {
    // Dropping a survey-ongoing lead ends her onboarding (status → rejected).
    pipelineStore.dropLead(lead.id, reason || 'Lead di-drop', lead.status === 'survey-created')
    pipelineStore.setFlash(`${lead.name} di-drop`)
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

  // `perjanjian` during onboarding (just the agreement); `majelis` after approval
  // (ketua + jadwal — the actual group).
  function startGroupFormation(phase: 'perjanjian' | 'majelis') {
    setFormation({
      mode: 'form',
      phase,
      majelisName: newMajelisName,
      memberCount: newApprovedCount,
      returnTo: detailScreen(lead),
    })
    flow.go('group-formation')
  }


  // Start the KM (Ketua Majelis) acceptance for this lead into her existing
  // group — the member-acceptance flow (Perjanjian).
  function startKmAcceptance() {
    setFormation({
      mode: 'accept',
      majelisName: existingEntry?.name ?? majelisLine(lead),
      memberIds: [lead.id],
      memberNames: [lead.name],
      returnTo: detailScreen(lead),
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
      </div>
      <ContactButton label={`Chat WhatsApp ${lead.name}`} tone="green" onClick={() => {}}>
        <WhatsappLogo size={20} />
      </ContactButton>
      <ContactButton label={`Peta ${lead.name}`} tone="red" onClick={() => {}}>
        <MapPin size={20} />
      </ContactButton>
    </header>
  )

  // Underwriting in progress — shown right after Submit, and whenever a plain
  // survey-submitted lead (no negative outcome yet) is opened. Held until the BP
  // taps the control below (the prototype stand-in for underwriting finishing).
  if (submitting || (submitted && !issue)) {
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
            style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}
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
      {/* Success confirmation — e.g. after a new majelis is formed. */}
      <Snackbar />

      {/* Negative underwriting outcome — a tinted box (red for a hard reject,
          orange otherwise) so it reads apart from the plain cards below. */}
      {issue ? (
        <div
          className={`flex flex-col gap-4 rounded-16 border p-12 ${
            issue === 'hard-reject' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'
          }`}
        >
          <span
            className={`text-14 font-bold ${
              issue === 'hard-reject' ? 'text-red-500' : 'text-orange-500'
            }`}
          >
            {ISSUE_LABEL[issue]}
          </span>
          {lead.onboardingIssueReason ? (
            <span className="text-12 text-default">{lead.onboardingIssueReason}</span>
          ) : null}
        </div>
      ) : null}

      {/* Ready for disbursement — a minimal Majelis card at the top (name +
          place + slot only), then a divider before the pencairan detail. */}
      {approved && canDisburse ? (
        <>
          <Card>
            <div className="flex flex-col gap-2">
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
                  {isExisting ? existingEntry?.place ?? 'Wilayah BP' : newLocation ?? 'Belum ada lokasi'}
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
          </Card>
          <div className="-mx-16 border-t border-default" />
        </>
      ) : null}

      {/* Majelis card — its group-formation context. Hidden only on the
          Ready-for-disbursement view (which leads with the pencairan detail). */}
      {(isExisting || isNewMajelis) && !(approved && canDisburse) ? (
        <Card>
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-2">
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
                  {isExisting ? existingEntry?.place ?? 'Wilayah BP' : newLocation ?? 'Belum ada lokasi'}
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

            {/* Footer — the majelis stage grouped with its action (KM acceptance
                for an existing group; a new one must be formed before submit). */}
            <div className="flex items-center justify-between gap-8 border-t border-default pt-12">
              {isNewMajelis ? (
                <>
                  <span className="flex min-w-0 items-center gap-8">
                    <StatusDot done={approved ? activatedNew : perjanjianDone} />
                    <span
                      className={`text-12 font-bold ${
                        (approved ? activatedNew : perjanjianDone)
                          ? 'text-green-600'
                          : 'text-orange-500'
                      }`}
                    >
                      {approved
                        ? activatedNew
                          ? 'Majelis sudah dibentuk'
                          : 'Menunggu pembentukan majelis'
                        : perjanjianDone
                          ? 'Perjanjian majelis disetujui'
                          : enoughToForm
                            ? 'Upload perjanjian majelis'
                            : `Baru ${newMembers.length} anggota. Kurang ${
                                MIN_FORM_MEMBERS - newMembers.length
                              } anggota lagi`}
                    </span>
                  </span>
                  {/* During onboarding, agree the perjanjian (needs enough members).
                      The actual group is formed from the Ready-to-disburse view. */}
                  {!approved && enoughToForm && !perjanjianDone ? (
                    <Button size="sm" variant="outline" onClick={() => startGroupFormation('perjanjian')}>
                      Start
                    </Button>
                  ) : null}
                </>
              ) : accepted ? (
                // KM acceptance done — locked, no Edit.
                <span className="flex min-w-0 items-center gap-8">
                  <StatusDot done />
                  <span className="text-12 font-bold text-green-600">Sudah diterima majelis</span>
                </span>
              ) : (
                <>
                  <span className="flex min-w-0 items-center gap-8">
                    <StatusDot done={false} />
                    <span className="text-12 font-bold text-orange-500">Pending KM Acceptance</span>
                  </span>
                  <Button size="sm" variant="outline" onClick={startKmAcceptance}>
                    Start
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      {/* Ready for disbursement — her limit and the pencairan detail. */}
      {approved && canDisburse ? (
        <>
          <Card>
            <div className="flex flex-col gap-4">
              <span className="text-14 font-bold text-default">Nominal</span>
              <span className="text-24 font-bold text-default">{lead.amount || 'Rp7.000.000'}</span>
              <span className="text-12 text-caption">
                Limit yang disetujui underwriting — sesuaikan dengan kebutuhan usaha.
              </span>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-12">
              <div className="flex items-start justify-between gap-8">
                <span className="text-14 text-default">Jangka waktu angsuran</span>
                <span className="flex flex-col items-end">
                  <span className="text-14 font-bold text-default">12 bulan</span>
                  <span className="text-12 text-caption">48x pembayaran</span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-8">
                <span className="text-14 text-default">Angsuran per minggu</span>
                <span className="text-14 font-bold text-default">Rp 135.000</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-8">
              <span className="text-14 font-bold text-default">Tujuan pencairan</span>
              <button
                type="button"
                onClick={() => setTujuanSheet(true)}
                className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-left text-14"
              >
                <span className="min-w-0 truncate text-default">{tujuan}</span>
                <span className="shrink-0 text-disabled">
                  <ChevronDown size={20} />
                </span>
              </button>
            </div>
          </Card>
        </>
      ) : null}

      {/* Survey + ritual cards — hidden once approved (Ready for disbursement). */}
      {!approved ? (
        <>
          {orderedSections.map((sec) => {
        if (isSelf && sec.id === 'uji-kelayakan') {
          return (
            <Card key={sec.id}>
              <div className="flex items-center gap-8">
                <StatusDot done={readOnly} />
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
              </div>
            </Card>
          )
        }
        const done = complete(sec.id)
        const count = doneCount(survey, lead.id, sec.id)
        // Uji Kelayakan with no mode chosen yet prompts the choice first.
        const needsMode = sec.id === 'uji-kelayakan' && !lead.surveyMode
        // Resubmit: the Uji Kelayakan is flagged for a re-do until it is redone.
        const resubmitUji = isResubmit && sec.id === 'uji-kelayakan' && !done
        // Uji Kelayakan reads "Diproses" for a few seconds after it is filled.
        const processingUji = sec.id === 'uji-kelayakan' && done && ujiProcessing
        const sub = processingUji
          ? 'Diproses'
          : resubmitUji
            ? 'Perlu diisi ulang'
            : done
              ? 'Selesai'
              : needsMode
                ? 'Pilih cara pengisian'
                : count === 0
                  ? 'Belum diisi'
                  : `${count}/${sec.total} selesai`
        return (
          <Card key={sec.id}>
            {/* Status dot on the left (check / empty ring); Start / Edit on the right. */}
            <div className="flex items-center gap-8">
              <StatusDot done={done} />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="flex items-center gap-8">
                  <span className="text-14 font-bold text-default">{sec.label}</span>
                  {sec.id === 'uji-kelayakan' && lead.surveyMode === 'assisted' ? (
                    <Badge intent="neutral" size="sm">
                      Assisted
                    </Badge>
                  ) : null}
                </span>
                <span
                  className={`text-12 ${
                    processingUji
                      ? 'font-bold text-blue-600'
                      : resubmitUji
                        ? 'font-bold text-orange-500'
                        : done
                          ? 'text-green-600'
                          : 'text-caption'
                  }`}
                >
                  {sub}
                </span>
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => (!done && needsMode ? setModeOpen(true) : openSection(sec.id))}
              >
                {done ? 'Edit' : 'Start'}
              </Button>
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
              <StatusDot done={ritualDone} />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-14 font-bold text-default">Ritual explanation</span>
                <span className={`text-12 ${ritualDone ? 'text-green-600' : 'text-caption'}`}>{rSub}</span>
              </span>
              <Button size="sm" variant="outline" onClick={() => flow.go('ritual')}>
                {ritualDone ? 'Edit' : 'Start'}
              </Button>
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
          {canDisburse ? (
            // Ready to disburse — only "Lanjut" (no save-for-later here).
            <Button size="lg" className="w-full" onClick={() => flow.go('disbursement-confirm')}>
              Lanjut
            </Button>
          ) : (
            <>
              <Button size="lg" className="w-full" onClick={() => startGroupFormation('majelis')}>
                Start group formation
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={saveForLater}>
                Simpan untuk nanti
              </Button>
            </>
          )}
        </StickyBar>
      ) : isResubmit ? (
        <StickyBar>
          {!ujiRedone ? (
            <span className="text-center text-12 text-caption">
              Perbaiki Survey Uji Kelayakan untuk resubmit onboarding.
            </span>
          ) : null}
          <Button size="lg" className="w-full" disabled={!ujiRedone} onClick={resubmit}>
            Resubmit onboarding
          </Button>
        </StickyBar>
      ) : readOnly ? null : (
        <StickyBar>
          {!canSubmit ? (
            <span className="text-center text-12 text-caption">
              {!allDone
                ? 'Lengkapi survey untuk mengirim onboarding.'
                : needsFormation
                  ? enoughToForm
                    ? 'Setujui perjanjian majelis untuk mengirim onboarding.'
                    : 'Tambah anggota majelis baru agar perjanjian bisa dibuat.'
                  : 'Selesaikan penerimaan majelis (KM) untuk mengirim onboarding.'}
            </span>
          ) : null}
          <Button size="lg" className="w-full" disabled={!canSubmit} onClick={submit}>
            Submit Onboarding
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={saveForLater}>
            Simpan untuk nanti
          </Button>
          <button
            type="button"
            onClick={() => setTaskSheet('drop')}
            className="mt-8 self-center py-4 text-12 font-bold text-link underline"
          >
            Drop lead
          </button>
        </StickyBar>
      )}

      {/* Survey mode — chosen at the first Uji Kelayakan tap. */}
      <OnboardingModeSheet open={modeOpen} onClose={() => setModeOpen(false)} onPick={pickMode} />

      {/* Disbursement purpose. */}
      <PickSheet
        open={tujuanSheet}
        title="Tujuan pencairan"
        options={TUJUAN_OPTIONS}
        value={tujuan}
        onClose={() => setTujuanSheet(false)}
        onPick={(v) => {
          setTujuan(v)
          setTujuanSheet(false)
        }}
      />

      {/* Survey ongoing — drop the lead. */}
      <DropLeadSheet open={taskSheet === 'drop'} onClose={() => setTaskSheet(null)} onDrop={dropLead} />
    </AppScreen>
  )
}
