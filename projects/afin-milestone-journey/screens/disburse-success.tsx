'use client'

// Disbursement confirmed. The "Selanjutnya?" card points straight at week 24 —
// the loop closes here rather than ending, which is the behaviour the milestone
// ladder is trying to create.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { IconCheck } from '../lib/icons'
import { useApp } from '../lib/store'
import { FullWidthButton, ResultHeader, StickyBar } from '../lib/ui'

export function DisburseSuccessScreen() {
  const flow = useFlow()
  const s = useApp()

  return (
    <Screen topBar={<NavigationHeader title="Pencairan" hideBack />}>
      <ResultHeader
        tint="green"
        icon={<IconCheck size={24} />}
        title="Pencairan berhasil!"
        description={`${rupiah(s.lastDisburse)} sudah masuk ke saldo Poket Ibu.`}
      />

      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <p className="mb-4 text-14 font-bold text-default">Selanjutnya?</p>
        <p className="text-12 text-caption">
          Terus jaga kebiasaan baik untuk buka milestone berikutnya di minggu ke-24.
        </p>
      </div>

      <StickyBar>
        <FullWidthButton onClick={() => flow.go('progress')}>Lihat perjalananmu</FullWidthButton>
        <FullWidthButton variant="ghost" onClick={() => flow.go('home')}>
          Kembali ke Home
        </FullWidthButton>
      </StickyBar>
    </Screen>
  )
}
