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
import { ArrowLeft, ChatCircleQuestion, CheckCircle, MapPin, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, setOnboardingHasWa, usePipeline } from '../lib/pipeline-store'
import { AppScreen, ContactButton, StickyBar } from '../lib/ui'

export function OnboardingStartScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [canInstall, setCanInstall] = useState<'yes' | 'no' | ''>('')
  const [phone, setPhone] = useState(lead?.phone ?? '')
  const [helpOpen, setHelpOpen] = useState(false)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Persetujuan pendaftaran" onBack={() => flow.go('sales')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  // A reactivation / renewal already has AFIN — the question becomes a statement
  // and her phone is locked.
  const hasAfin = Boolean(lead.reactivation)
  const phoneValid = phone.replace(/\D/g, '').length >= 9
  const canConfirm = hasAfin || (canInstall !== '' && phoneValid)

  function verify() {
    if (!canConfirm) return
    // Already has AFIN — straight into the survey (Onboarding page).
    if (hasAfin) {
      pipelineStore.setStartingOnboarding(lead.id, false)
      flow.go('calon-mitra')
      return
    }
    // New calon mitra — set the gate the finalize step reads, then go there.
    if (canInstall === 'yes') {
      // Can install AFIN → she registers & fills the survey herself.
      setOnboardingHasWa('yes')
      pipelineStore.chooseSurveyMode(lead.id, 'self')
    } else {
      // Can't install AFIN → confirm her number via passcode, BP-assisted.
      setOnboardingHasWa('no')
      pipelineStore.chooseSurveyMode(lead.id, 'assisted')
    }
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
          <span className="text-14 font-bold text-default">Akun AFin</span>
          {hasAfin ? (
            <div className="flex items-center gap-8">
              <span className="shrink-0 text-green-600">
                <CheckCircle size={20} />
              </span>
              <span className="text-14 text-default">Mitra sudah punya AFin</span>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              <span className="text-12 text-caption">Apakah mitra bisa install AFin?</span>
              <SelectableCard
                name="can-afin"
                inputType="radio"
                title="Ya, bisa install AFin"
                description="Mitra registrasi & mengisi survey sendiri di AFin"
                checked={canInstall === 'yes'}
                onChange={() => setCanInstall('yes')}
              />
              <SelectableCard
                name="can-afin"
                inputType="radio"
                title="Tidak bisa install AFin"
                description="Konfirmasi nomor lewat passcode, dibantu BP"
                checked={canInstall === 'no'}
                onChange={() => setCanInstall('no')}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Card 2 — Phone: editable for a new mitra, locked (change via AFin) for a
          reactivation, with the "?" explaining how. */}
      <Card>
        <div className="flex flex-col gap-8">
          <span className="flex items-center gap-4 text-14 font-bold text-default">
            Nomor HP calon mitra
            {hasAfin ? (
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                aria-label="Cara ubah nomor HP"
                className="flex h-20 w-20 items-center justify-center rounded-full text-caption"
              >
                <ChatCircleQuestion size={16} />
              </button>
            ) : null}
          </span>
          {hasAfin ? (
            <div className="rounded-8 border border-default bg-neutral-50 px-12 py-8 text-14 text-caption">
              {phone}
            </div>
          ) : (
            <Input
              required
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xx-xxxx-xxxx"
            />
          )}
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!canConfirm} onClick={verify}>
          {hasAfin ? 'Confirm' : 'Verify'}
        </Button>
      </StickyBar>

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
