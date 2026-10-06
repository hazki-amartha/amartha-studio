'use client'

// Persetujuan pembukaan layanan — before the akad photos, the mitra approves
// opening autodebit, celengan, SUPP and PPCPD by sharing a passcode. Same
// passcode pattern as the onboarding verification step.

import { useEffect, useState } from 'react'
import { Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { ArrowClockwise } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { getOnboardingVerifyMethod, usePipeline } from '../lib/pipeline-store'
import { AppScreen, StickyBar } from '../lib/ui'

// The passcode resend countdown — 2:57.
const RESEND_SECONDS = 177

export function DisbursementPasscodeScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [passcode, setPasscode] = useState('')
  const [resendLeft, setResendLeft] = useState(RESEND_SECONDS)
  useEffect(() => {
    if (resendLeft <= 0) return
    const t = setTimeout(() => setResendLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendLeft])
  const resendLabel = `${String(Math.floor(resendLeft / 60)).padStart(2, '0')}:${String(
    resendLeft % 60,
  ).padStart(2, '0')}`
  const phone = lead?.phone ?? ''
  const channel = getOnboardingVerifyMethod() === 'wa' ? 'WhatsApp' : 'SMS'

  return (
    <AppScreen
      topBar={<NavigationHeader title="Persetujuan Pembukaan Layanan" onBack={() => flow.back()} />}
    >
      {/* Consent — sharing the passcode is the mitra's agreement. */}
      <div className="flex items-start gap-8 rounded-16 border border-blue-200 bg-blue-50 p-12">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-blue-500 text-12 font-bold text-blue-500">
          i
        </span>
        <div className="flex flex-col gap-2">
          <span className="text-14 font-bold text-default">Passcode dikirim ke mitra</span>
          <span className="text-12 text-blue-700">
            Dengan membagikan passcode ke petugas, mitra menyetujui pembukaan autodebit, celengan,
            SUPP, dan PPCPD.
          </span>
        </div>
      </div>

      {/* Passcode entry — 6-character field, with a resend countdown. */}
      <Card>
        <div className="flex flex-col gap-16">
          <span className="text-14 text-caption">
            Dikirim via <span className="font-bold text-default">{channel}</span> ke{' '}
            <span className="font-bold text-default">{phone}</span>
          </span>
          <Input
            label="Passcode dari mitra"
            value={passcode}
            onChange={(e) =>
              setPasscode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6))
            }
            placeholder="Masukkan 6 karakter passcode"
          />
          <span className="flex items-center gap-8 text-14 text-caption">
            <ArrowClockwise size={20} />
            {resendLeft > 0 ? (
              <span>
                Kirim ulang passcode dalam{' '}
                <span className="font-bold text-default">{resendLabel}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setResendLeft(RESEND_SECONDS)}
                className="font-bold text-link"
              >
                Kirim ulang passcode
              </button>
            )}
          </span>
        </div>
      </Card>

      <StickyBar>
        <Button
          size="lg"
          className="w-full"
          disabled={passcode.length < 6}
          onClick={() => flow.go('disbursement-akad')}
        >
          Lanjut
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
