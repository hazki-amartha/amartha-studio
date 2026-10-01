'use client'

// Cara onboarding — step 1 of 2. The BP picks whether the calon mitra has
// WhatsApp and (if she does) how the survey is filled; "Lanjut" carries the
// choice to the finalize step (onboarding-finalize).
//
//   Punya WhatsApp?  Ya → Assisted / Self-service ; Tidak → must be Assisted.

import { useState } from 'react'
import { Button, Card, NavigationHeader, SelectableCard } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, setOnboardingHasWa, usePipeline } from '../lib/pipeline-store'
import type { SurveyMode } from '../lib/pipeline'
import { AppScreen, StickyBar } from '../lib/ui'

export function OnboardingStartScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [hasWa, setHasWa] = useState<'yes' | 'no' | ''>('')
  const [sel, setSel] = useState<SurveyMode | ''>('')

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Persetujuan pendaftaran" onBack={() => flow.go('sales')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  // No WhatsApp forces assisted (no link to send).
  const mode: SurveyMode | '' = hasWa === 'no' ? 'assisted' : sel
  const canConfirm = hasWa === 'no' || (hasWa === 'yes' && sel !== '')

  function pickWa(v: 'yes' | 'no') {
    setHasWa(v)
    setSel('')
  }

  function lanjut() {
    if (!canConfirm || mode === '') return
    pipelineStore.chooseSurveyMode(lead.id, mode)
    setOnboardingHasWa(hasWa === 'no' ? 'no' : 'yes')
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

      {/* 1 — Punya WhatsApp? */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-14 font-bold text-default">Punya WhatsApp?</span>
          <span className="text-12 text-caption">
            Digunakan untuk mengirimkan passcode untuk konfirmasi nomor telepon
          </span>
        </div>
        <SelectableCard
          name="has-wa"
          inputType="radio"
          title="Ya, punya WhatsApp"
          checked={hasWa === 'yes'}
          onChange={() => pickWa('yes')}
        />
        <SelectableCard
          name="has-wa"
          inputType="radio"
          title="Tidak punya WhatsApp"
          description="Onboarding harus assisted (passcode dikirim ke SMS)"
          checked={hasWa === 'no'}
          onChange={() => pickWa('no')}
        />
      </div>

      {/* 2 — Cara onboarding (only when she has WhatsApp). */}
      {hasWa === 'yes' ? (
        <div className="flex flex-col gap-8">
          <span className="text-14 font-bold text-default">Cara onboarding</span>
          <SelectableCard
            name="cara-onboarding"
            inputType="radio"
            title="Assisted"
            description="Passcode akan dikirim ke WhatsApp untuk verifikasi"
            checked={sel === 'assisted'}
            onChange={() => setSel('assisted')}
          />
          <SelectableCard
            name="cara-onboarding"
            inputType="radio"
            title="Self-service"
            description="Calon mitra mengisi sendiri di aplikasi AFin"
            checked={sel === 'self'}
            onChange={() => setSel('self')}
          />
        </div>
      ) : null}

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!canConfirm} onClick={lanjut}>
          Lanjut
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
