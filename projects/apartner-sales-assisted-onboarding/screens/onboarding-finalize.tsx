'use client'

// Cara onboarding — step 2 of 2. The finalize gate for the combination chosen on
// step 1 (onboarding-start):
//   WhatsApp + Assisted → send the WhatsApp confirmation link
//   WhatsApp + Self     → wait for her AFin registration
//   No WhatsApp + Assisted → upload the consent document
// The orange "Tandai …" control is the prototype stand-in for the step the calon
// mitra completes herself; the BP's own actions use normal buttons.

import { useState } from 'react'
import { Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { CheckCircle, CloudArrowUp, FileCheck, Hourglass, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { getOnboardingHasWa, pipelineStore, usePipeline } from '../lib/pipeline-store'
import { AppScreen, StickyBar } from '../lib/ui'

const SIM_FONT = { fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }

export function OnboardingFinalizeScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [phone, setPhone] = useState(lead?.phone ?? '')
  const [sent, setSent] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  // Persetujuan finished — leave the "Starting onboarding" state and open the
  // survey. Closing instead parks her in "Starting onboarding" to finish later.
  function finish() {
    if (lead) pipelineStore.setStartingOnboarding(lead.id, false)
    flow.go('calon-mitra')
  }
  function close() {
    if (lead) {
      pipelineStore.setStartingOnboarding(lead.id, true)
      pipelineStore.setFlash(`${lead.name} — onboarding dimulai, menunggu persetujuan`)
    }
    flow.go('sales')
  }

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Finalisasi persetujuan pendaftaran" onBack={() => flow.go('sales')} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const hasWa = getOnboardingHasWa()
  const mode = lead.surveyMode
  const phoneValid = phone.replace(/\D/g, '').length >= 9

  const infoBox = (title: string, body: string) => (
    <div className="flex items-start gap-8 rounded-16 border border-blue-200 bg-blue-50 p-12">
      <span className="shrink-0 text-primary-500">
        <Hourglass size={20} />
      </span>
      <div className="flex flex-col gap-2">
        <span className="text-14 font-bold text-default">{title}</span>
        <span className="text-12 text-default">{body}</span>
      </div>
    </div>
  )

  const simButton = (label: string) => (
    <button
      type="button"
      onClick={finish}
      style={SIM_FONT}
      className="flex w-full items-center justify-center gap-8 rounded-full border border-orange-500 bg-orange-50 px-16 py-12 text-14 font-bold text-orange-500"
    >
      <CheckCircle size={20} />
      {label}
    </button>
  )

  return (
    <AppScreen topBar={<NavigationHeader title="Finalisasi persetujuan pendaftaran" onBack={() => flow.back()} />}>
      <Card>
        <div className="flex flex-col gap-2">
          <span className="text-16 font-bold text-default">{lead.name}</span>
          <span className="text-12 text-caption">
            {hasWa === 'no'
              ? 'Assisted · tanpa WhatsApp'
              : mode === 'self'
                ? 'Self-service · WhatsApp'
                : 'Assisted · WhatsApp'}
          </span>
        </div>
      </Card>

      {/* WhatsApp + Assisted — confirm number & send the link. */}
      {hasWa === 'yes' && mode === 'assisted' ? (
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
          infoBox(
            'Menunggu konfirmasi',
            `Link sudah terkirim ke ${phone}. Menunggu calon mitra klik & memberi konsen.`,
          )
        )
      ) : null}

      {/* WhatsApp + Self-service — wait for her AFin registration. */}
      {hasWa === 'yes' && mode === 'self'
        ? infoBox(
            'Menunggu registrasi AFin',
            'Menunggu calon mitra memulai registrasi & mengisi survey di aplikasi AFin.',
          )
        : null}

      {/* No WhatsApp — upload the consent document. */}
      {hasWa === 'no' ? (
        <div className="flex flex-col gap-8">
          <span className="text-14 font-bold text-default">Upload dokumen consent</span>
          {uploaded ? (
            <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12">
              <span className="text-green-500">
                <FileCheck size={20} />
              </span>
              <span className="flex-1 text-default">Dokumen consent terunggah</span>
              <button
                type="button"
                onClick={() => setUploaded(false)}
                className="shrink-0 text-12 font-bold text-link"
              >
                Ganti
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setUploaded(true)}
              className="flex w-full flex-col items-center gap-4 rounded-8 border border-dashed border-default bg-canvas-blue p-16 text-caption"
            >
              <CloudArrowUp size={24} />
              <span className="text-14 text-default">Upload dokumen consent</span>
              <span className="text-12">Foto / scan dokumen yang sudah ditandatangani</span>
            </button>
          )}
        </div>
      ) : null}

      {/* Bottom action per gate. */}
      {hasWa === 'yes' && mode === 'assisted' && !sent ? (
        <StickyBar>
          <Button size="lg" className="w-full" disabled={!phoneValid} onClick={() => setSent(true)}>
            <span className="flex items-center justify-center gap-8">
              <WhatsappLogo size={20} />
              Kirim link via WhatsApp
            </span>
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={close}>
            Close
          </Button>
        </StickyBar>
      ) : hasWa === 'yes' && mode === 'assisted' && sent ? (
        <StickyBar>
          {simButton('Tandai terkonfirmasi — lanjut ke survey')}
          <Button variant="outline" size="lg" className="w-full" onClick={() => setSent(false)}>
            Kirim ulang link
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={close}>
            Close
          </Button>
        </StickyBar>
      ) : hasWa === 'yes' && mode === 'self' ? (
        <StickyBar>{simButton('Tandai registrasi dimulai — lanjut ke survey')}</StickyBar>
      ) : hasWa === 'no' ? (
        <StickyBar>
          <Button size="lg" className="w-full" disabled={!uploaded} onClick={finish}>
            Lanjut ke survey
          </Button>
        </StickyBar>
      ) : null}
    </AppScreen>
  )
}
