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
import { BottomSheet, Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { ChatCircleQuestion, CheckCircle } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, setOnboardingHasWa, usePipeline } from '../lib/pipeline-store'
import { AppScreen, StickyBar } from '../lib/ui'

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

  return (
    <AppScreen topBar={<NavigationHeader title="Persetujuan pendaftaran" onBack={() => flow.back()} />}>
      <Card>
        <div className="flex flex-col gap-2">
          <span className="text-16 font-bold text-default">{lead.name}</span>
          <span className="text-12 text-caption">Onboarding · {lead.product ?? 'Produk'}</span>
        </div>
      </Card>

      {/* 1 — AFIN: a question for a new mitra, a statement for reactivation. */}
      {hasAfin ? (
        <div className="flex items-start gap-8 rounded-16 border border-green-200 bg-green-50 p-12">
          <span className="shrink-0 text-green-600">
            <CheckCircle size={20} />
          </span>
          <span className="text-14 font-bold text-default">Mitra sudah punya AFIN</span>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <span className="text-14 font-bold text-default">Apakah mitra bisa install AFIN?</span>
          <SelectableCard
            name="can-afin"
            inputType="radio"
            title="Ya, bisa install AFIN"
            description="Mitra registrasi & mengisi survey sendiri di AFin"
            checked={canInstall === 'yes'}
            onChange={() => setCanInstall('yes')}
          />
          <SelectableCard
            name="can-afin"
            inputType="radio"
            title="Tidak bisa install AFIN"
            description="Konfirmasi nomor lewat passcode, dibantu BP"
            checked={canInstall === 'no'}
            onChange={() => setCanInstall('no')}
          />
        </div>
      )}

      {/* 2 — Phone: editable for a new mitra, locked (change via AFIN) otherwise. */}
      {hasAfin ? (
        <div className="flex flex-col gap-4">
          <span className="flex items-center gap-4 text-12 font-regular text-default">
            Nomor HP calon mitra
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="Cara ubah nomor HP"
              className="flex h-20 w-20 items-center justify-center rounded-full text-caption"
            >
              <ChatCircleQuestion size={16} />
            </button>
          </span>
          <div className="rounded-8 border border-default bg-neutral-50 px-12 py-8 text-14 text-caption">
            {phone}
          </div>
        </div>
      ) : (
        <Input
          label="Nomor HP calon mitra"
          required
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xx-xxxx-xxxx"
        />
      )}

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
