'use client'

// Follow Up — the call that decides what becomes of a prospect, drawn as the
// same kind of guided task as a majelis visit or a home visit: a stepper on top,
// one question per page, a sticky action at the foot.
//
// Two steps, because a follow-up is two facts asked in order:
//
//   1. HASIL KONTAK — did it land at all? Most calls don't connect, and a form
//      that opened on "how interested is she?" made an unanswered call look like
//      a lead who went cold. Reached / not answered / wrong number each end the
//      task their own way; only "Terhubung" carries on to step 2.
//   2. MINAT SEKARANG — where she stands now, in the SAME words the Sales
//      pipeline uses (Interested / Undecided / Not interested), so a follow up
//      and a Sales record grade a prospect the same way. Picking one opens a
//      bottom sheet to note why, and that note closes the task.
//
// The brief sits above the controls on step 1: what she said last time, and the
// loan that is the reason she is being called now, because a BP dials with the
// phone at her ear and cannot scroll to remember who this is.

import { useState } from 'react'
import { BottomSheet, Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { CONTACT_RESULTS, FOLLOW_UP_OPTIONS, type ContactResult, type Interest } from '../lib/leads'
import { LeadIdentityCard } from '../lib/lead-card'
import { INTEREST_META, INTEREST_ORDER, type Interest as PipelineInterest } from '../lib/pipeline'
import { findMajelisEntry } from '../lib/schedule'
import { openLead, rescheduleCount, store, useApp } from '../lib/store'
import {
  AppScreen,
  Chip,
  ChipGroup,
  RescheduleSheet,
  SectionTitle,
  StageBar,
  StickyBar,
  VisitTitle,
} from '../lib/ui'

const STEP_LABELS = ['Hasil kontak', 'Minat sekarang']

/**
 * The interest options, taken from the Sales pipeline so a follow-up records the
 * same three answers (Interested / Undecided / Not interested) the roster filters
 * on. Each maps back to this flow's own lead grade for the record it writes.
 */
type Minat = PipelineInterest
const MINAT_OPTIONS: Minat[] = INTEREST_ORDER
const MINAT_TO_INTEREST: Record<Minat, Interest> = {
  interested: 'tinggi',
  undecided: 'sedang',
  'not-interested': 'tidak',
}

const WRONG_NUMBER_NOTE =
  'Prospek ditutup. Jika ada nomor lain dari perujuk atau tetangga, catat di bawah dan buat prospek baru.'

export function FollowUpScreen() {
  const flow = useFlow()
  const s = useApp()
  const lead = openLead(s)
  const lastLog = lead.log[lead.log.length - 1]
  const rostered = s.activeTask !== null

  const [step, setStep] = useState<1 | 2>(1)
  const [contact, setContact] = useState<ContactResult | null>(null)
  const [via, setVia] = useState<'wa' | 'telepon'>('wa')
  const [retryDate, setRetryDate] = useState<string | null>(null)
  const [altNumber, setAltNumber] = useState('')
  const [minat, setMinat] = useState<Minat | null>(null)
  const [reasonOpen, setReasonOpen] = useState(false)
  const [note, setNote] = useState('')
  const [rescheduling, setRescheduling] = useState(false)

  const connected = contact === 'terhubung'
  const retry = contact === 'tidak-diangkat'
  const dead = contact === 'nomor-salah'

  function done() {
    if (rostered) {
      store.finishTask()
      flow.go('today')
    } else {
      flow.go('lead')
    }
  }

  function reschedule(reason: string, date: string) {
    if (s.activeTask) store.rescheduleTask(s.activeTask, reason, date)
    setRescheduling(false)
    flow.go('today')
  }

  function reject(reason: string) {
    if (s.activeTask) store.rejectTask(s.activeTask, reason)
    setRescheduling(false)
    flow.go('today')
  }

  // --- Step 1 outcomes that finish without a minat ------------------------

  function saveRetry() {
    store.recordFollowUp(lead.id, {
      contact: 'tidak-diangkat',
      via,
      interest: null,
      stage: 'follow-up',
      reason: '',
      followUpAt: retryDate,
      followUpTomorrow: retryDate === '22 Juli',
      note: '',
      outcome: `Tidak diangkat · coba lagi ${retryDate ?? 'belum dijadwalkan'}`,
    })
    done()
  }

  function saveDead() {
    store.recordFollowUp(lead.id, {
      contact: 'nomor-salah',
      via,
      interest: null,
      stage: 'tidak',
      reason: 'Nomor tidak aktif',
      followUpAt: null,
      followUpTomorrow: false,
      note: altNumber.trim(),
      outcome: 'Nomor tidak aktif · prospek ditutup',
    })
    done()
  }

  // --- Step 2 outcome: reached, with a grade and a reason -----------------

  function saveConnected() {
    if (!minat) return
    store.recordFollowUp(lead.id, {
      contact: 'terhubung',
      via,
      interest: MINAT_TO_INTEREST[minat],
      stage: minat === 'not-interested' ? 'tidak' : 'follow-up',
      reason: note.trim(),
      followUpAt: null,
      followUpTomorrow: false,
      note: note.trim(),
      outcome: `Terhubung · ${INTEREST_META[minat].label}`,
    })
    setReasonOpen(false)
    done()
  }

  // What the sticky action does, per state.
  const step1Ready = dead || (retry && retryDate !== null) || connected

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={lead.name} when="Follow up · Selasa, 11.45" />}
          link={rostered && step === 1 ? 'Jadwal ulang' : undefined}
          onLinkClick={rostered && step === 1 ? () => setRescheduling(true) : undefined}
          onBack={() => {
            if (step === 2) setStep(1)
            else flow.go(rostered ? 'today' : 'lead')
          }}
        />
      }
    >
      <StageBar current={step} labels={STEP_LABELS} />

      {step === 1 ? (
        <>
          {/* Tapping WhatsApp or the handset records the channel the call took. */}
          <LeadIdentityCard lead={lead} onContact={(v) => setVia(v)} />

          {/* The brief — everything the BP needs in her head before the line
              connects, and nothing she needs afterwards. */}
          <Card>
            <div className="flex flex-col gap-8">
              <span className="text-14 font-bold text-default">Sebelum menghubungi</span>
              {lastLog ? (
                <div className="flex flex-col gap-2 rounded-8 bg-canvas-blue px-12 py-8">
                  <span className="text-12 font-bold text-default">
                    {lastLog.at} · {lastLog.outcome}
                  </span>
                  {lastLog.note ? (
                    <span className="text-12 text-caption">{lastLog.note}</span>
                  ) : null}
                </div>
              ) : null}
              {lead.otherLoan ? (
                <span className="text-12 text-default">
                  Pinjaman {lead.otherLoan.lender} sisa {rupiah(lead.otherLoan.amount)} · perkiraan
                  lunas{' '}
                  <span className="font-bold">{lead.otherLoan.ends || 'belum diketahui'}</span>
                </span>
              ) : null}
              {lead.majelisId ? (
                <span className="text-12 text-caption">
                  Majelis tujuan {findMajelisEntry(lead.majelisId).name} ·{' '}
                  {findMajelisEntry(lead.majelisId).day}, {findMajelisEntry(lead.majelisId).time}
                </span>
              ) : null}
            </div>
          </Card>

          <SectionTitle>Hasil kontak</SectionTitle>
          <div className="flex flex-col gap-8">
            {CONTACT_RESULTS.map((option) => (
              <SelectableCard
                key={option.value}
                name="hasil-kontak"
                inputType="radio"
                title={option.title}
                description={option.description}
                checked={contact === option.value}
                onChange={() => {
                  setContact(option.value)
                  setRetryDate(null)
                  setAltNumber('')
                }}
              />
            ))}
          </div>

          {/* Nobody answered — one question: when to try again. */}
          {retry ? (
            <Card>
              <ChipGroup label="Coba lagi kapan">
                {FOLLOW_UP_OPTIONS.filter((o) => o.value !== null).map((option) => (
                  <Chip
                    key={option.label}
                    selected={retryDate === option.value}
                    onClick={() => setRetryDate(option.value)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </ChipGroup>
            </Card>
          ) : null}

          {dead ? (
            <Card>
              <div className="flex flex-col gap-12">
                <span className="text-12 text-default">{WRONG_NUMBER_NOTE}</span>
                <Input
                  label="Nomor alternatif"
                  optionalText="opsional"
                  inputMode="tel"
                  placeholder="08xx-xxxx-xxxx"
                  value={altNumber}
                  onChange={(e) => setAltNumber(e.target.value)}
                />
              </div>
            </Card>
          ) : null}

          <StickyBar>
            <Button
              size="lg"
              className="w-full"
              disabled={!step1Ready}
              onClick={() => {
                if (connected) setStep(2)
                else if (retry) saveRetry()
                else if (dead) saveDead()
              }}
            >
              {connected ? 'Lanjut' : 'Simpan & Selesai'}
            </Button>
          </StickyBar>
        </>
      ) : (
        <>
          <SectionTitle>Minat sekarang</SectionTitle>
          <div className="flex flex-col gap-8">
            {MINAT_OPTIONS.map((value) => (
              <SelectableCard
                key={value}
                name="minat"
                inputType="radio"
                title={INTEREST_META[value].label}
                description={INTEREST_META[value].hint}
                checked={minat === value}
                onChange={() => setMinat(value)}
              />
            ))}
          </div>

          {lead.interest && minat && MINAT_TO_INTEREST[minat] !== lead.interest ? (
            <span className="text-12 text-caption">
              Berubah dari catatan terakhir sejak {lastLog?.at ?? 'kontak terakhir'}.
            </span>
          ) : null}

          <StickyBar>
            <Button
              size="lg"
              className="w-full"
              disabled={!minat}
              onClick={() => setReasonOpen(true)}
            >
              Lanjut
            </Button>
          </StickyBar>
        </>
      )}

      {/* The reason, in a sheet — the last thing between a graded call and a
          closed task. The note is what the next BP reads before the next call. */}
      <BottomSheet
        open={reasonOpen}
        onClose={() => setReasonOpen(false)}
        title={minat === 'not-interested' ? 'Alasan tidak tertarik' : 'Catatan follow up'}
        description={
          minat
            ? `Minat sekarang: ${INTEREST_META[minat].label}. Catat alasannya sebelum menutup tugas.`
            : undefined
        }
        primaryAction={
          <Button size="lg" className="w-full" onClick={saveConnected}>
            Simpan & Selesai
          </Button>
        }
      >
        <Input
          label={minat === 'not-interested' ? 'Alasan' : 'Catatan'}
          optionalText="opsional"
          placeholder={
            minat === 'not-interested' ? 'Kenapa dia tidak tertarik' : 'Apa yang dia katakan'
          }
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </BottomSheet>

      <RescheduleSheet
        open={rescheduling}
        onClose={() => setRescheduling(false)}
        subject={lead.name}
        subjectNoun="Follow up"
        count={s.activeTask ? rescheduleCount(s, s.activeTask) : 0}
        onConfirm={reschedule}
        onReject={reject}
      />
    </AppScreen>
  )
}
