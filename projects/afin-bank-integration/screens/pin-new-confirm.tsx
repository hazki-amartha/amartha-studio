'use client'

import { PinStep } from '../lib/pin-step'
import { useBankState } from '../lib/store'

export function PinNewConfirmScreen() {
  const { pinFlow } = useBankState()
  return (
    <PinStep
      header={pinFlow === 'change' ? 'Ubah PIN' : 'Atur Ulang PIN'}
      stage={null}
      title="Ulangi PIN baru"
      description="Masukkan sekali lagi untuk memastikan."
      next="pin-done"
    />
  )
}
