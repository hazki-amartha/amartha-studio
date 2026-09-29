'use client'

import { PinStep } from '../lib/pin-step'
import { ACCOUNT_NAME } from '../lib/ui'

export function ObPinScreen() {
  return <PinStep title={`Buat PIN ${ACCOUNT_NAME}`} next="ob-pin-confirm" />
}
