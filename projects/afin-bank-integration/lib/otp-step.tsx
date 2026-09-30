'use client'

// A one-time-code page outside onboarding (linking, PIN reset): the same
// boxes and keypad as ob-otp, without the stage bar.

import { useEffect, useState } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { CodeBoxes, Keypad, PageTitle } from './ui'

export function OtpStep({ header, next }: { header: string; next: string }) {
  const flow = useFlow()
  const [code, setCode] = useState('')

  useEffect(() => {
    if (code.length === 6) {
      const t = setTimeout(() => flow.go(next), 300)
      return () => clearTimeout(t)
    }
  }, [code, next, flow])

  return (
    <Screen canvas="white" topBar={<NavigationHeader title={header} onBack={flow.back} />}>
      <PageTitle
        title="Masukkan kode OTP"
        description={
          <>
            Kode 6 digit dikirim lewat SMS ke <span className="font-bold text-default">0812-3456-7890</span>
          </>
        }
      />
      <div className="py-8">
        <CodeBoxes value={code} />
      </div>
      <p className="text-center text-12 text-caption">
        Kirim ulang kode dalam <span className="font-bold text-default">00:59</span>
      </p>
      <div className="mt-auto pb-16">
        <Keypad
          onDigit={(d) => setCode((c) => (c.length < 6 ? c + d : c))}
          onDelete={() => setCode((c) => c.slice(0, -1))}
        />
      </div>
    </Screen>
  )
}
