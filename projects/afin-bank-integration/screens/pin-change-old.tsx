'use client'

import { PinStep } from '../lib/pin-step'

export function PinChangeOldScreen() {
  return (
    <PinStep
      header="Ubah PIN"
      stage={null}
      title="Masukkan PIN lama"
      description="PIN rekening yang Anda pakai sekarang."
      next="pin-new"
    />
  )
}
