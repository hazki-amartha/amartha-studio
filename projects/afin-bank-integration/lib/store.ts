'use client'

// The three values this prototype genuinely carries across screens:
//
//   kyc      — the user's AFin KYC tier. VERIFIED reuses the KTP + selfie on
//              file; BASIC photographs them during onboarding (PRD, flow A).
//   account  — where the bank account is in its life: none yet, being opened,
//              rejected, or active. The homepage draws a different widget for each.
//   liveness — what the next liveness check will return, so a presenter can
//              show the failure states without faking a bad selfie.

import { useSyncExternalStore } from 'react'

export type KycTier = 'verified' | 'basic'
export type AccountStatus = 'none' | 'in-progress' | 'failed' | 'active'
export type LivenessResult = 'pass' | 'fail' | 'locked'

export interface BankState {
  kyc: KycTier
  account: AccountStatus
  liveness: LivenessResult
}

const initial: BankState = { kyc: 'verified', account: 'none', liveness: 'pass' }

let state: BankState = initial

const listeners = new Set<() => void>()

export const store = {
  get: () => state,
  set(patch: Partial<BankState>) {
    state = { ...state, ...patch }
    listeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useBankState(): BankState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
