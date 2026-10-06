'use client'

// Persetujuan pendaftaran — the registration-approval page.
//
// For a NEW calon mitra the BP states whether she can install AFIN and confirms
// her phone, then taps "Verify":
//   can install AFIN  → onboarding-finalize → "Menunggu registrasi AFin"
//   can't install     → onboarding-finalize → passcode input
// For a REACTIVATION / RENEWAL (she already has AFIN) the AFIN question becomes a
// statement, her phone is locked (changed only in AFIN — the "?" explains how),
// and the button is "Confirm", which goes straight to the survey.

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { ArrowLeft, CheckCircle, MapPin, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  pipelineStore,
  setOnboardingHasWa,
  setOnboardingVerifyMethod,
  usePipeline,
} from '../lib/pipeline-store'
import { AppScreen, ContactButton, StickyBar } from '../lib/ui'

// What each AFin answer implies — shown under the options once one is picked.
const AFIN_YES_INFO = [
  'Mitra akan melakukan survey uji kelayakan mandiri via AFin',
  'Verifikasi nomor hp calon mitra akan dilakukan via AFin',
  'Semua proses verifikasi dan persetujuan mitra akan dilakukan langsung dalam aplikasi AFin calon mitra',
]
const AFIN_NO_INFO = [
  'BP akan memandu seluruh proses onboarding calon mitra via APartner, termasuk survey uji kelayakan calon mitra.',
  'Verifikasi nomor hp calon mitra dan persetujuan pendaftaran akan dilakukan dengan passcode yang dikirimkan ke no. HP calon mitra',
  'Pastikan dokumen-dokumen berikut siap untuk bisa memulai proses onboarding: Form A, Form B, Form C, Form D, Form E, Form F',
]

/** A small bulleted note list, shown under the AFin options. */
function InfoList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col gap-8 rounded-12 bg-neutral-50 p-12">
      {items.map((t) => (
        <div key={t} className="flex gap-8">
          <span className="mt-8 h-4 w-4 shrink-0 rounded-full bg-neutral-400" />
          <span className="text-12 text-default">{t}</span>
        </div>
      ))}
    </div>
  )
}

export function OnboardingStartScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [canInstall, setCanInstall] = useState<'yes' | 'no' | ''>('')
  const [phone, setPhone] = useState(lead?.phone ?? '')
  const [helpOpen, setHelpOpen] = useState(false)
  // Editing the phone (new lead) — via a sheet, so the field isn't open inline.
  const [editOpen, setEditOpen] = useState(false)
  const [phoneDraft, setPhoneDraft] = useState('')
  // The "Kirim Passcode" sheet (can't-install-AFin path) — pick WhatsApp or SMS.
  const [otpOpen, setOtpOpen] = useState(false)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Persetujuan pendaftaran" onBack={() => flow.go('sales')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  // A reactivation / renewal already has AFIN (unless flagged otherwise) — the
  // question becomes a statement and her phone is locked.
  const hasAfin = lead.reactivation ? lead.reactivation.hasAfin !== false : false
  const phoneValid = phone.replace(/\D/g, '').length >= 9
  const canConfirm = hasAfin || (canInstall !== '' && phoneValid)

  function verify() {
    if (!canConfirm) return
    // Already has AFIN — she self-serves the Uji Kelayakan survey, then straight
    // into the Onboarding page. Mark onboarding started so she re-opens here on
    // Complete onboarding rather than the Follow-up entry.
    if (hasAfin) {
      pipelineStore.chooseSurveyMode(lead.id, 'self')
      pipelineStore.setStartingOnboarding(lead.id, false)
      pipelineStore.setOnboardingStarted(lead.id, true)
      flow.go('calon-mitra')
      return
    }
    // Can install AFIN → she registers & fills the survey herself.
    if (canInstall === 'yes') {
      setOnboardingHasWa('yes')
      pipelineStore.chooseSurveyMode(lead.id, 'self')
      flow.go('onboarding-finalize')
      return
    }
    // Can't install AFIN → pick the passcode channel (WhatsApp / SMS) in a sheet.
    setOtpOpen(true)
  }

  // Send the passcode on the chosen channel, then continue to the Finalisasi step.
  function sendOtp(channel: 'wa' | 'sms') {
    setOnboardingHasWa('no')
    setOnboardingVerifyMethod(channel)
    pipelineStore.chooseSurveyMode(lead.id, 'assisted')
    setOtpOpen(false)
    flow.go('onboarding-finalize')
  }

  // The detail header shared with the Calon Mitra pages — name + status on the
  // left, call & map on the right.
  const header = (
    <header className="flex shrink-0 items-center gap-8 border-b border-default bg-neutral-white px-16 py-8">
      <button
        type="button"
        onClick={() => flow.back()}
        aria-label="Kembali"
        className="-ml-4 flex h-32 w-32 shrink-0 items-center justify-center text-default"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-16 font-bold text-default">{lead.name}</span>
        <span className="flex">
          <Badge intent="blue" size="sm">
            Start onboarding
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

  return (
    <AppScreen topBar={header}>
      {/* Card 1 — AFin: whether she owns / can own an AFin account. A statement
          for a reactivation (she already has one), a question for a new mitra. */}
      <Card>
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-2">
            <span className="text-14 font-bold text-default">Akun AFin</span>
            {hasAfin ? null : (
              <span className="text-12 text-caption">Apakah mitra bisa install AFin?</span>
            )}
          </div>
          {hasAfin ? (
            <div className="flex items-center gap-8">
              <span className="shrink-0 text-green-600">
                <CheckCircle size={20} />
              </span>
              <span className="text-14 text-default">Mitra sudah punya AFin</span>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <SelectableCard
                name="can-afin"
                inputType="radio"
                title="Ya, bisa install AFin"
                checked={canInstall === 'yes'}
                onChange={() => setCanInstall('yes')}
              />
              <SelectableCard
                name="can-afin"
                inputType="radio"
                title="Tidak bisa install AFin"
                checked={canInstall === 'no'}
                onChange={() => setCanInstall('no')}
              />
              {canInstall === 'yes' ? (
                <InfoList items={AFIN_YES_INFO} />
              ) : canInstall === 'no' ? (
                <InfoList items={AFIN_NO_INFO} />
              ) : null}
            </div>
          )}
        </div>
      </Card>

      {/* Card 2 — Phone: editable for a new mitra, locked (change via AFin) for a
          reactivation, with the "?" explaining how. */}
      <Card>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-8">
              <span className="text-14 font-bold text-default">Nomor HP calon mitra</span>
              <button
                type="button"
                onClick={() => {
                  if (hasAfin) {
                    setHelpOpen(true)
                  } else {
                    setPhoneDraft(phone)
                    setEditOpen(true)
                  }
                }}
                className="shrink-0 text-12 font-bold text-link"
              >
                {hasAfin ? 'Ubah' : 'Ganti'}
              </button>
            </div>
            <span className="text-12 text-caption">
              Pastikan benar. Digunakan untuk proses verifikasi
            </span>
          </div>
          <div className="rounded-8 border border-default bg-neutral-50 px-12 py-8 text-14 text-default">
            {phone}
          </div>
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!canConfirm} onClick={verify}>
          {hasAfin ? 'Confirm' : 'Verify'}
        </Button>
      </StickyBar>

      {/* Ganti nomor HP — new lead edits the number in a sheet. */}
      <BottomSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Ganti nomor HP"
        primaryAction={
          <Button
            size="lg"
            className="w-full"
            disabled={phoneDraft.replace(/\D/g, '').length < 9}
            onClick={() => {
              setPhone(phoneDraft.trim())
              setEditOpen(false)
            }}
          >
            Simpan
          </Button>
        }
      >
        <Input
          label="Nomor HP calon mitra"
          required
          inputMode="tel"
          value={phoneDraft}
          onChange={(e) => setPhoneDraft(e.target.value)}
          placeholder="08xx-xxxx-xxxx"
        />
      </BottomSheet>

      {/* Kirim Passcode — pick the channel. */}
      <BottomSheet
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        title="Kirim Passcode"
        description={`Pastikan nomor ${phone} sudah benar`}
      >
        <div className="flex flex-col gap-8 pt-8">
          <Button size="lg" className="w-full" onClick={() => sendOtp('wa')}>
            <span className="flex items-center justify-center gap-8">
              <WhatsappLogo size={20} />
              Kirim ke WhatsApp
            </span>
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => sendOtp('sms')}>
            Kirim ke SMS
          </Button>
        </div>
      </BottomSheet>

      {/* How to change a reactivation mitra's locked number. */}
      <BottomSheet
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Ubah nomor HP"
        primaryAction={
          <Button size="lg" className="w-full" onClick={() => setHelpOpen(false)}>
            Mengerti
          </Button>
        }
      >
        <span className="text-14 text-default">
          Nomor HP mitra reaktivasi sudah terdaftar di akun AFIN-nya. Untuk mengubahnya, minta mitra
          memperbarui nomor langsung di aplikasi AFIN, lalu ulangi proses ini.
        </span>
      </BottomSheet>
    </AppScreen>
  )
}
