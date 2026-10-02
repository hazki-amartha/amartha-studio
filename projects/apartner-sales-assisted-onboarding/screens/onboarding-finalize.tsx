'use client'

// Cara onboarding — step 2 of 2. The finalize gate for the combination chosen on
// step 1 (onboarding-start):
//   WhatsApp + Assisted → send the WhatsApp confirmation link, then enter the
//                         passcode the calon mitra reads back from it
//   WhatsApp + Self     → wait for her AFin registration
//   No WhatsApp + Assisted → confirm via passcode (typed in, all caps)
// The orange "Tandai …" control is the prototype stand-in for the step the calon
// mitra completes herself; the BP's own actions use normal buttons.

import { useState } from 'react'
import { Badge, Button, Input, NavigationHeader } from '@/design-system/components'
import { ArrowLeft, CheckCircle, Hourglass, MapPin, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { getOnboardingHasWa, pipelineStore, usePipeline } from '../lib/pipeline-store'
import { AppScreen, ContactButton, StickyBar } from '../lib/ui'

const SIM_FONT = { fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }

export function OnboardingFinalizeScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [phone, setPhone] = useState(lead?.phone ?? '')
  const [sent, setSent] = useState(false)
  // Passcode the calon mitra reads back from the WhatsApp link once she agrees.
  const [passcode, setPasscode] = useState('')
  // No-WhatsApp number confirmation — her own typed-in passcode, all caps.
  const [noWaPasscode, setNoWaPasscode] = useState('')

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
            'Pandu calon mitra menyelesaikan registrasi & verifikasi nomor HP di AFin. Saat selesai, otomatis diproses ke halaman onboarding.',
          )
        : null}

      {/* No WhatsApp — same phone confirmation as the WhatsApp path (there's
          no link to send it over, so it's just typed in), then the number is
          confirmed via a typed passcode. Forced uppercase to match how the
          passcode is actually printed/read out. */}
      {hasWa === 'no' ? (
        <div className="flex flex-col gap-16">
          <div className="flex flex-col gap-8 rounded-16 border border-blue-200 bg-blue-50 p-12">
            <div className="flex flex-col gap-2">
              <span className="text-14 font-bold text-default">Passcode terkirim ke calon mitra</span>
              <span className="text-12 text-default">
                Dikirim via SMS ke <span className="font-bold">{phone}</span>.
              </span>
            </div>
            <span className="border-t border-blue-200 pt-8 text-12 text-default">
              Dengan membagikan passcode ke petugas, calon mitra menyetujui syarat &amp; ketentuan
              pendaftaran Amartha.
            </span>
          </div>
          <Input
            label="Passcode dari calon mitra"
            required
            value={noWaPasscode}
            onChange={(e) => setNoWaPasscode(e.target.value.toUpperCase())}
            placeholder="Masukkan Passcode"
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
          <Button
            size="lg"
            className="w-full"
            disabled={noWaPasscode.trim().length === 0}
            onClick={finish}
          >
            Lanjut ke Survey
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={close}>
            Close
          </Button>
        </StickyBar>
      ) : null}
    </AppScreen>
  )
}
