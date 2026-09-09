'use client'

// FO Assisted Application — the checklist the BP fills sitting with the calon
// mitra, reached from a follow-up's "Continue application → FO Assisted" (or a
// "Takeover application" when self-service stalled).
//
// Eight sections, each tapped to "Completed". This is a click-through: tapping a
// row marks it done rather than opening a real sub-form. "Submit application"
// files the pengajuan and she moves to the Mitra list; "Continue later" saves
// which sections are done and reschedules a day out, so reopening the
// application resumes from exactly where she left off.

import { useState } from 'react'
import { Button, Card, NavigationHeader, SelectableCard } from '@/design-system/components'
import { BottomSheet, Input } from '@/design-system/components'
import { ChevronRight } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { APPLICATION_SECTIONS } from '../lib/application'
import { dateFromToday } from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { AppScreen, StickyBar } from '../lib/ui'

const LATER_REASONS = ['Perlu melengkapi dokumen', 'Tidak sempat melanjutkan sekarang']

export function ApplicationScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  // Resume from whatever was already completed the last time it was saved.
  const [done, setDone] = useState<Set<string>>(() => new Set(leads[openId]?.assistedDone ?? []))
  const [laterOpen, setLaterOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Aplikasi" onBack={() => flow.go('sales')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const allDone = done.size === APPLICATION_SECTIONS.length

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function submit() {
    pipelineStore.submitApplication(lead.id)
    pipelineStore.setFlash(`Aplikasi ${lead.name} dikirim — pindah ke daftar Mitra`)
    flow.go('sales')
  }

  function continueLater() {
    pipelineStore.saveAssistedProgress(
      lead.id,
      Array.from(done),
      dateFromToday(1),
      [reason, note].filter(Boolean).join(' — '),
    )
    pipelineStore.setFlash(`Aplikasi ${lead.name} disimpan — lanjut ${dateFromToday(1)}`)
    flow.go('sales')
  }

  return (
    <AppScreen topBar={<NavigationHeader title={lead.name} onBack={() => flow.go('follow-up')} />}>
      <Card>
        <div className="flex flex-col">
          {APPLICATION_SECTIONS.map((s, i) => {
            const complete = done.has(s.id)
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className={`flex items-center gap-8 py-12 text-left ${i > 0 ? 'border-t border-default' : ''}`}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="text-14 font-bold text-default">{s.label}</span>
                  <span className={`text-12 ${complete ? 'text-green-600' : 'text-caption'}`}>
                    {complete ? 'Completed' : s.hint}
                  </span>
                </span>
                <span className="shrink-0 text-disabled">
                  <ChevronRight size={20} />
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <StickyBar>
        {!allDone ? (
          <span className="text-center text-12 text-caption">
            {done.size}/{APPLICATION_SECTIONS.length} bagian selesai — lengkapi semua untuk mengirim
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
