'use client'

import { PinStep } from '../lib/pin-step'
import { useBankState } from '../lib/store'

export function PinNewScreen() {
  const { pinFlow } = useBankState()
  return (
    <PinStep
      header={pinFlow === 'change' ? 'Ubah PIN' : 'Atur Ulang PIN'}
      stage={null}
      title="Buat PIN baru"
      description="6 angka, berbeda dengan PIN AmarthaFin. Hindari angka berurutan atau tanggal lahir."
      next="pin-new-confirm"
    />
  )
}
