'use client'

import { Button, NavigationHeader } from '@/design-system/components'
import { CheckCircleFill, CrossCircleFill } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, KtpArt, PageTitle, RuleList, StepHeader } from '../lib/ui'

// Copy and layout from the live Re-KYC "Sekarang, foto KTP Anda" page.
export function ObKtpGuideScreen() {
  const flow = useFlow()
  return (
    <Screen
      canvas="white"
      topBar={
        <NavigationHeader title="Buka Rekening" onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />
      }
    >
      <StepHeader stage={2} />
      <PageTitle title="Sekarang, foto KTP Anda" />
      <div className="flex gap-8">
        <div className="relative flex-1 rounded-12 border-2 border-green-500 p-4">
          <KtpArt />
          <CheckCircleFill size={24} className="absolute -bottom-8 -right-8 rounded-full bg-neutral-white text-green-500" />
        </div>
        <div className="relative flex-1 rounded-12 border-2 border-red-500 p-4">
          <KtpArt dim />
          <CrossCircleFill size={24} className="absolute -bottom-8 -right-8 rounded-full bg-neutral-white text-red-500" />
        </div>
      </div>
      <RuleList
        rules={[
          'KTP harus milik Anda sendiri.',
          'Foto dan semua data di KTP harus terbaca jelas (tidak buram, rusak, atau tertutup jari/pantulan cahaya).',
          'Foto KTP langsung dari kamera HP Anda (jangan foto fotokopi atau tangkapan layar).',
        ]}
      />
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('ob-ktp-camera')}>
          Mulai Ambil Foto
        </Button>
      </BottomAction>
    </Screen>
  )
}
