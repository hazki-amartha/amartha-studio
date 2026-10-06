'use client'

// The three values this prototype genuinely carries across screens:
//
//   kyc      — the user's AFin KYC tier. VERIFIED reuses the KTP + selfie on
//              file; BASIC photographs them during onboarding (PRD, flow A).
//   account  — where the bank account is in its life: none yet, being opened,
//              rejected, or active. The homepage draws a different widget for each.
//   liveness — what the next liveness check will return, so a presenter can
//              show the failure states without faking a bad selfie.
//   journey  — whether the shared liveness screens are part of opening a new
//              account or linking one the user already has.
//   status   — the active account's standing: active, dormant or frozen.
//   pin      — what the next account-PIN entry returns, for the error states.
//   pinFlow  — whether the new-PIN screens are a reset or a change.

import { useSyncExternalStore } from 'react'

export type KycTier = 'verified' | 'basic'
export type AccountStatus = 'none' | 'in-progress' | 'failed' | 'active'
export type LivenessResult = 'pass' | 'fail' | 'locked'
export type Journey = 'open' | 'bind'
export type AccountStanding = 'active' | 'dormant' | 'frozen'
export type PinResult = 'correct' | 'wrong' | 'locked'
export type PinFlow = 'reset' | 'change'

// Which homepage the person sees: a Modal borrower, or the regular AmarthaFin
// user (Hazki's original home). The switcher on the home flips this.
export type Persona = 'borrower' | 'regular'

// Where a Modal borrower is in the loan lifecycle — drives the home Modal card.
//   belum-kyc    — not started; invited to begin
//   kyc-ongoing  — mid data-collection (e.g. step 3 of 6)
//   kyc-gagal    — verification failed; must resubmit
//   kyc-diproses — submitted, under review
//   kyc-berhasil — approved, ready to disburse
//   dicairkan    — disbursed; loan running
export type ModalStage =
  | 'belum-kyc'
  | 'kyc-ongoing'
  | 'kyc-gagal'
  | 'kyc-diproses'
  | 'kyc-berhasil'
  | 'dicairkan'

// What the Poket detail shows: a plain wallet, a Premium wallet with a Mitra
// Amartha account (after Modal KYC), or a single Premium Plus wallet (after
// opening a Rekening / "Upgrade Poket Premium Plus").
export type PoketTier = 'non-premium' | 'premium-mitra' | 'premium-non-mitra'

export interface BankState {
  kyc: KycTier
  account: AccountStatus
  liveness: LivenessResult
  journey: Journey
  status: AccountStanding
  pin: PinResult
  pinFlow: PinFlow
  persona: Persona
  modalStage: ModalStage
  poketTier: PoketTier
  // Whether the application's sections are already filled (lets a presenter jump
  // to the completed hub/forms without typing every field).
  modalFilled: boolean
}

const initial: BankState = {
  kyc: 'verified',
  account: 'none',
  liveness: 'pass',
  journey: 'open',
  status: 'active',
  pin: 'correct',
  pinFlow: 'reset',
  persona: 'borrower',
  modalStage: 'belum-kyc',
  poketTier: 'non-premium',
  modalFilled: false,
}

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
