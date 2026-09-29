'use client'

import { Button, Input, NavigationHeader } from '@/design-system/components'
import { Eye } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle, RuleList, StepHeader } from '../lib/ui'
import { useBankState } from '../lib/store'

// PRD 1.2 — the bank asks for its own password even inside a partner app
// (Super Flip by Aladin does the same).
export function ObPasswordScreen() {
  const flow = useFlow()
  const { kyc } = useBankState()
  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Buka Rekening" onBack={flow.back} />}>
      <StepHeader stage={1} />
      <PageTitle title="Buat kata sandi rekening" description="Dipakai untuk mengamankan rekening Anda." />
      <Input label="Kata sandi" type="password" defaultValue="Amartha2026" suffix={<Eye size={16} />} />
      <Input label="Ulangi kata sandi" type="password" defaultValue="Amartha2026" suffix={<Eye size={16} />} />
      <RuleList rules={['Minimal 8 karakter', 'Ada huruf besar dan huruf kecil', 'Ada angka']} />
      <BottomAction>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => flow.go(kyc === 'verified' ? 'ob-ktp-verified' : 'ob-ktp-guide')}
        >
          Lanjut
        </Button>
      </BottomAction>
    </Screen>
  )
}
