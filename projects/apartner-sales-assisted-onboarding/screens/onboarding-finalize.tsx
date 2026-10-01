'use client'

// Cara onboarding — step 2 of 2. The finalize gate for the combination chosen on
// step 1 (onboarding-start):
//   WhatsApp + Assisted → send the WhatsApp confirmation link, then enter the
//                         passcode the calon mitra reads back from it
//   WhatsApp + Self     → wait for her AFin registration
//   No WhatsApp + Assisted → photograph the signed consent document + the calon
//                            mitra holding it
// The orange "Tandai …" control is the prototype stand-in for the step the calon
// mitra completes herself; the BP's own actions use normal buttons.

import { useState } from 'react'
import { Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { Camera, CheckCircle, FileCheck, Hourglass, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { getOnboardingHasWa, pipelineStore, usePipeline } from '../lib/pipeline-store'
import { AppScreen, StickyBar } from '../lib/ui'

const SIM_FONT = { fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }

/** A single photo capture — a click-through affordance (flips a badge), never a
 *  real file picker, same as the rest of this prototype. */
function PhotoCapture({ label, done, onToggle }: { label: string; done: boolean; onToggle: () => void }) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-14 font-bold text-default">{label}</span>
      {done ? (
        <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12">
          <span className="text-green-500">
            <FileCheck size={20} />
          </span>
          <span className="flex-1 text-default">Foto terlampir</span>
          <button type="button" onClick={onToggle} className="shrink-0 text-12 font-bold text-link">
            Ambil ulang
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full flex-col items-center gap-4 rounded-8 border border-dashed border-default bg-canvas-blue p-16 text-caption"
        >
          <Camera size={24} />
          <span className="text-14 text-default">Ambil foto</span>
        </button>
      )}
    </div>
  )
}

export function OnboardingFinalizeScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [phone, setPhone] = useState(lead?.phone ?? '')
  const [sent, setSent] = useState(false)
  // Passcode the calon mitra reads back from the WhatsApp link once she agrees.
  const [passcode, setPasscode] = useState('')
  // No-WhatsApp consent evidence — two photos.
  const [consentPhoto, setConsentPhoto] = useState(false)
  const [withMitraPhoto, setWithMitraPhoto] = useState(false)

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
  const passcodeValid = passcode.replace(/\D/g, '').length >= 4
  const consentReady = consentPhoto && withMitraPhoto

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
          <div className="flex flex-col gap-8">
            <Input
              label="Masukkan passcode dari calon mitra"
              required
              inputMode="numeric"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Contoh: 6 digit passcode"
            />
            <span className="text-12 text-caption">
              Link sudah terkirim ke {phone}. Calon mitra membuka link, menyetujui, lalu membacakan
              passcode untuk Anda masukkan di sini.
            </span>
          </div>
        )
      ) : null}

      {/* WhatsApp + Self-service — wait for her AFin registration. */}
      {hasWa === 'yes' && mode === 'self'
        ? infoBox(
            'Menunggu registrasi AFin',
            'Menunggu calon mitra memulai registrasi & mengisi survey di aplikasi AFin.',
          )
        : null}

      {/* No WhatsApp — photograph the signed consent + the calon mitra holding it. */}
      {hasWa === 'no' ? (
        <div className="flex flex-col gap-16">
          <PhotoCapture
            label="Foto dokumen consent"
            done={consentPhoto}
            onToggle={() => setConsentPhoto((v) => !v)}
          />
          <PhotoCapture
            label="Foto calon mitra dengan dokumen consent"
            done={withMitraPhoto}
            onToggle={() => setWithMitraPhoto((v) => !v)}
          />
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
          <Button variant="ghost" size="lg" className="w-full" onClick={close}>
            Close
          </Button>
        </StickyBar>
      ) : hasWa === 'yes' && mode === 'assisted' && sent ? (
        <StickyBar>
          <Button size="lg" className="w-full" disabled={!passcodeValid} onClick={finish}>
            Lanjut ke survey
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              setSent(false)
              setPasscode('')
            }}
          >
            Kirim ulang link
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={close}>
            Close
          </Button>
        </StickyBar>
      ) : hasWa === 'yes' && mode === 'self' ? (
        <StickyBar>{simButton('Tandai registrasi dimulai — lanjut ke survey')}</StickyBar>
      ) : hasWa === 'no' ? (
        <StickyBar>
          <Button size="lg" className="w-full" disabled={!consentReady} onClick={finish}>
            Lanjut ke survey
          </Button>
        </StickyBar>
      ) : null}
    </AppScreen>
  )
}
