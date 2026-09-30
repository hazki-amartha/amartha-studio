'use client'

import { OtpStep } from '../lib/otp-step'

export function PinResetOtpScreen() {
  return <OtpStep header="Atur Ulang PIN" next="pin-new" />
}
