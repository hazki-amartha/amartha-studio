'use client'

// Survey Assisted — the three boxes the BP works through with the calon mitra:
// BP Feedback, Survey Uji Kelayakan, and Ritual explanation. Each box opens its
// own multi-step page; this screen shows each one's progress and gates Submit on
// all three being complete. "Continue later" saves and reschedules a day out.

import { useState } from 'react'
import { Button, Card, NavigationHeader, SelectableCard } from '@/design-system/components'
import { BottomSheet, Input } from '@/design-system/components'
import { ChevronRight } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { dateFromToday, majelisLine } from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import {
  APPLICATION_SECTIONS,
  doneCount,
  sectionComplete,
  setActiveSection,
  useSurvey,
} from '../lib/survey'
import { AppScreen, StickyBar, VisitTitle } from '../lib/ui'

const LATER_REASONS = ['Perlu melengkapi dokumen', 'Tidak sempat melanjutkan sekarang']

export function ApplicationScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const survey = useSurvey()
  const lead = leads[openId]
  const [laterOpen, setLaterOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Survey Assisted" onBack={() => flow.go('sales')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  // Self-service: the calon mitra fills the uji-kelayakan survey herself on AFin,
  // so that box is not the BP's to complete — it is disabled and left out of the
  // submit gate; the BP still does BP Feedback and the ritual.
  const isSelf = lead.surveyMode === 'self'
  const requiredSections = isSelf
    ? APPLICATION_SECTIONS.filter((s) => s.id !== 'uji-kelayakan')
    : APPLICATION_SECTIONS
  const completeCount = requiredSections.filter((s) => sectionComplete(survey, lead.id, s.id)).length
  const allDone = completeCount === requiredSections.length

  function openSection(id: (typeof APPLICATION_SECTIONS)[number]['id']) {
    if (id === 'ritual') {
      flow.go('ritual')
      return
    }
    setActiveSection(id)
    flow.go('survey-form')
  }

  function submit() {
    pipelineStore.submitSurvey(lead.id)
    pipelineStore.setFlash(`Survey ${lead.name} dikirim — menunggu keputusan underwriting`)
    flow.go('sales')
  }

  function continueLater() {
    const completed = APPLICATION_SECTIONS.filter((s) => sectionComplete(survey, lead.id, s.id)).map(
      (s) => s.id,
    )
    pipelineStore.saveAssistedProgress(
      lead.id,
      completed,
      dateFromToday(1),
      [reason, note].filter(Boolean).join(' — '),
    )
    pipelineStore.setFlash(`Survey ${lead.name} disimpan — lanjut ${dateFromToday(1)}`)
    flow.go('sales')
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={lead.name} when={majelisLine(lead)} />}
          onBack={() => flow.back()}
        />
      }
    >
      {APPLICATION_SECTIONS.map((sec) => {
        // Self-service uji-kelayakan is the mitra's own AFin form — shown here as
        // a disabled, informational box, not a step the BP fills.
        if (isSelf && sec.id === 'uji-kelayakan') {
          return (
            <Card key={sec.id}>
              <div className="flex flex-col gap-2">
                <span className="text-14 font-bold text-disabled">{sec.label}</span>
                <span className="text-12 text-caption">
                  Self-service: calon mitra mengisi sendiri via AFin
                </span>
                <span className="text-12 font-bold text-orange-500">Belum selesai</span>
              </div>
            </Card>
          )
        }
        const count = doneCount(survey, lead.id, sec.id)
        const complete = count >= sec.total
        const sub = complete
          ? 'Selesai'
          : count === 0
            ? 'Belum diisi'
            : `${count}/${sec.total} selesai`
        return (
          <Card key={sec.id}>
            <button
              type="button"
              onClick={() => openSection(sec.id)}
              className="flex w-full items-center gap-8 text-left"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-14 font-bold text-default">{sec.label}</span>
                <span className={`text-12 ${complete ? 'text-green-600' : 'text-caption'}`}>{sub}</span>
              </span>
              <span className="shrink-0 text-disabled">
                <ChevronRight size={20} />
              </span>
            </button>
          </Card>
        )
      })}

      <StickyBar>
        {!allDone ? (
          <span className="text-center text-12 text-caption">
            {completeCount}/{requiredSections.length} bagian selesai — lengkapi semua untuk mengirim
          </span>
        ) : null}
        <Button size="lg" className="w-full" disabled={!allDone} onClick={submit}>
          Submit application
        </Button>
        <Button size="lg" variant="outline" className="w-full" onClick={() => setLaterOpen(true)}>
          Continue later
        </Button>
      </StickyBar>

      <BottomSheet open={laterOpen} onClose={() => setLaterOpen(false)} title="Kenapa lanjut nanti?">
        <div className="flex flex-col gap-8">
          {LATER_REASONS.map((r) => (
            <SelectableCard
              key={r}
              name="later-why"
              inputType="radio"
              title={r}
              checked={reason === r}
              onChange={() => setReason(r)}
            />
          ))}
          <label className="flex flex-col gap-4 pt-4">
            <span className="text-12 text-caption">Catatan (opsional)</span>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tambahkan catatan…" />
          </label>
          <span className="text-12 text-caption">
            Follow up berikutnya: <span className="font-bold text-default">{dateFromToday(1)}</span> (besok)
          </span>
          <Button size="lg" className="w-full" disabled={!reason} onClick={continueLater}>
            Simpan &amp; jadwalkan ulang
          </Button>
        </div>
      </BottomSheet>
    </AppScreen>
  )
}
