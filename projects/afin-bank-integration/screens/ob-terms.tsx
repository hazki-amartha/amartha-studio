'use client'

import { useState } from 'react'
import { Button, Card, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ACCOUNT_NAME, BottomAction, PageTitle, StepHeader } from '../lib/ui'

// PRD 4.1 — akad and T&C. The account is sharia, so the akad is its own
// consent, separate from the general terms.
const AKAD = [
  'Dana Anda dititipkan dengan akad Wadiah dan dapat ditarik kapan saja.',
  'Tidak ada biaya admin bulanan dan tidak ada saldo minimum.',
  'Dana dijamin LPS sesuai ketentuan yang berlaku.',
  'Data Anda dibagikan ke bank mitra hanya untuk pembukaan dan pengelolaan rekening.',
]

export function ObTermsScreen() {
  const flow = useFlow()
  const [akad, setAkad] = useState(false)
  const [tnc, setTnc] = useState(false)
  return (
    <Screen topBar={<NavigationHeader title="Buka Rekening" onBack={flow.back} />}>
      <StepHeader stage={4} />
      <PageTitle title="Akad dan syarat ketentuan" description={`Baca ringkasannya sebelum ${ACCOUNT_NAME} dibuat.`} />
      <Card>
        <p className="text-14 font-bold text-default">Ringkasan akad</p>
        <ul className="mt-8 flex list-disc flex-col gap-8 pl-20 text-14 text-default">
          {AKAD.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p className="mt-12 text-14 font-bold text-link">Baca akad lengkap</p>
      </Card>
      <SelectableCard
        inputType="checkbox"
        title="Saya setuju dengan Akad Wadiah"
        checked={akad}
        onChange={() => setAkad((v) => !v)}
      />
      <SelectableCard
        inputType="checkbox"
        title="Saya setuju dengan Syarat & Ketentuan dan Kebijakan Privasi"
        checked={tnc}
        onChange={() => setTnc((v) => !v)}
      />
      <BottomAction>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!akad || !tnc}
          onClick={() => flow.go('ob-pin')}
        >
          Setuju dan Lanjut
        </Button>
      </BottomAction>
    </Screen>
  )
}
