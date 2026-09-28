'use client'

// Cara onboarding — the page reached after "Onboarding sekarang". The BP first
// picks how the survey gets filled (assisted / self-service) and CONFIRMS it;
// only then does that mode's gate appear:
//   assisted → confirm the number and send a WhatsApp consent link, then wait
//   self     → wait for the calon mitra to start her AFin registration
// The orange "Tandai …" control is the prototype stand-in for the step that, in
// the real product, the calon mitra completes herself.

import { useState } from 'react'
import { Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { CheckCircle, Hourglass, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import type { SurveyMode } from '../lib/pipeline'
import { AppScreen, StickyBar } from '../lib/ui'

const SIM_FONT = { fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }

export function OnboardingStartScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  // The selected mode, and whether it has been confirmed (which reveals the gate).
  const [sel, setSel] = useState<SurveyMode | ''>('')
  const [confirmed, setConfirmed] = useState(false)
  const [phone, setPhone] = useState(lead?.phone ?? '')
  const [sent, setSent] = useState(false)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Cara onboarding" onBack={() => flow.go('sales')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const phoneValid = phone.replace(/\D/g, '').length >= 9

  // Picking (or changing) a mode un-confirms it, hiding the fields until "Lanjut".
  function pick(m: SurveyMode) {
    setSel(m)
    setConfirmed(false)
    setSent(false)
  }

  function confirm() {
    if (!sel) return
    pipelineStore.chooseSurveyMode(lead.id, sel)
    setConfirmed(true)
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Cara onboarding" onBack={() => flow.back()} />}>
      <Card>
        <div className="flex flex-col gap-2">
          <span className="text-16 font-bold text-default">{lead.name}</span>
          <span className="text-12 text-caption">Onboarding · {lead.product ?? 'Produk'}</span>
        </div>
      </Card>

      {/* 1 — Cara onboarding, confirmed before anything else shows. */}
      <div className="flex flex-col gap-8">
        <span className="text-14 font-bold text-default">Cara onboarding</span>
        <SelectableCard
          name="cara-onboarding"
          inputType="radio"
          title="Assisted"
          description="BP mengisi survey bersama calon mitra"
          checked={sel === 'assisted'}
          onChange={() => pick('assisted')}
        />
        <SelectableCard
          name="cara-onboarding"
          inputType="radio"
          title="Self-service"
          description="Calon mitra mengisi sendiri di aplikasi AFin"
          checked={sel === 'self'}
          onChange={() => pick('self')}
        />
      </div>

      {/* 2a — Assisted gate: confirm number & send the WhatsApp link. */}
      {confirmed && sel === 'assisted' ? (
        !sent ? (
          <div className="flex flex-col gap-8">
            <Input
              label="Konfirmasi no. HP calon mitra"
              required
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xx-xxxx-xxxx"
            />
            <span className="text-12 text-caption">
              Calon mitra menerima link untuk mengonfirmasi nomor dan memberi konsen sebelum survey
              dimulai.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-8 rounded-16 border border-blue-200 bg-blue-50 p-12">
            <span className="shrink-0 text-primary-500">
              <Hourglass size={20} />
            </span>
            <div className="flex flex-col gap-2">
              <span className="text-14 font-bold text-default">Menunggu konfirmasi</span>
              <span className="text-12 text-default">
                Link sudah terkirim ke {phone}. Menunggu calon mitra klik & memberi konsen.
              </span>
            </div>
          </div>
        )
      ) : null}

      {/* 2b — Self-service gate: wait for her AFin registration. */}
      {confirmed && sel === 'self' ? (
        <div className="flex items-start gap-8 rounded-16 border border-blue-200 bg-blue-50 p-12">
          <span className="shrink-0 text-primary-500">
            <Hourglass size={20} />
          </span>
          <div className="flex flex-col gap-2">
            <span className="text-14 font-bold text-default">Menunggu registrasi AFin</span>
            <span className="text-12 text-default">
              Menunggu calon mitra memulai registrasi & mengisi survey di aplikasi AFin.
            </span>
          </div>
        </div>
      ) : null}

      {/* Bottom action — confirm first, then the chosen mode's step. */}
      {!confirmed ? (
        <StickyBar>
          <Button size="lg" className="w-full" disabled={!sel} onClick={confirm}>
            Lanjut
          </Button>
        </StickyBar>
      ) : sel === 'assisted' && !sent ? (
        <StickyBar>
          <Button size="lg" className="w-full" disabled={!phoneValid} onClick={() => setSent(true)}>
            <span className="flex items-center justify-center gap-8">
              <WhatsappLogo size={20} />
              Kirim link via WhatsApp
            </span>
          </Button>
        </StickyBar>
      ) : sel === 'assisted' && sent ? (
        <StickyBar>
          <button
            type="button"
            onClick={() => flow.go('calon-mitra')}
            style={SIM_FONT}
            className="flex w-full items-center justify-center gap-8 rounded-full border border-orange-500 bg-orange-50 px-16 py-12 text-14 font-bold text-orange-500"
          >
            <CheckCircle size={20} />
            Tandai terkonfirmasi — lanjut ke survey
          </button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => setSent(false)}>
            Kirim ulang link
          </Button>
        </StickyBar>
      ) : sel === 'self' ? (
        <StickyBar>
          <button
            type="button"
            onClick={() => flow.go('calon-mitra')}
            style={SIM_FONT}
            className="flex w-full items-center justify-center gap-8 rounded-full border border-orange-500 bg-orange-50 px-16 py-12 text-14 font-bold text-orange-500"
          >
            <CheckCircle size={20} />
            Tandai registrasi dimulai — lanjut ke survey
          </button>
        </StickyBar>
      ) : null}
    </AppScreen>
  )
}
