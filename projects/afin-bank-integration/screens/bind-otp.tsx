'use client'

import { OtpStep } from '../lib/otp-step'

// After the OTP, existing customers redo liveness (the shared ob-liveness-*
// screens, which read journey = 'bind' and return to bind-success).
export function BindOtpScreen() {
  return <OtpStep header="Hubungkan Rekening" next="ob-liveness-guide" />
}
