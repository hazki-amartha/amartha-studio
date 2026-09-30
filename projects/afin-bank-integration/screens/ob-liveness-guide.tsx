'use client'

import { Button, NavigationHeader } from '@/design-system/components'
import { CheckCircleFill, CrossCircleFill } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, FaceArt, journeyTitle, PageTitle, RuleList, StepHeader } from '../lib/ui'
import { useBankState } from '../lib/store'

// The live "Selfie dulu, yuk!" guide, with one rule added for liveness: the
// check is passive, so the user must hold still until it finishes.
export function ObLivenessGuideScreen() {
  const flow = useFlow()
  const { journey } = useBankState()
  return (
    <Screen
      canvas="white"
      topBar={
        <NavigationHeader title={journeyTitle(journey)} onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />
      }
    >
      {journey === 'open' ? <StepHeader stage={2} /> : null}
      <PageTitle
        title="Verifikasi wajah dulu, yuk!"
        description={
          journey === 'bind'
            ? 'Untuk memastikan pemilik rekening yang dihubungkan adalah Anda sendiri.'
            : 'Untuk memastikan yang membuka rekening adalah Anda sendiri.'
        }
      />
      <div className="flex gap-8">
        <div className="relative flex-1 rounded-12 border-2 border-green-500 p-4">
          <FaceArt />
          <CheckCircleFill size={24} className="absolute -bottom-8 -right-8 rounded-full bg-neutral-white text-green-500" />
        </div>
        <div className="relative flex-1 rounded-12 border-2 border-red-500 p-4">
          <FaceArt blurred />
          <CrossCircleFill size={24} className="absolute -bottom-8 -right-8 rounded-full bg-neutral-white text-red-500" />
        </div>
      </div>
      <RuleList
        rules={[
          'Posisikan wajah di dalam batas oval.',
          'Lepas kacamata, masker, atau penutup wajah lainnya.',
          'Pastikan Anda berada di tempat yang terang.',
          <>
            <span className="font-bold">Tahan posisi dan jangan berkedip</span> sampai verifikasi selesai.
          </>,
        ]}
      />
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('ob-liveness-camera')}>
          Mulai Verifikasi
        </Button>
      </BottomAction>
    </Screen>
  )
}
