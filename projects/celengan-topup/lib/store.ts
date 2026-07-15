'use client'

// Minimal project-local store so the selected goal / amount / payment method
// persist across screens (each screen remounts on navigation, so component
// state alone won't survive). Backed by useSyncExternalStore — no design-system
// concerns here.

import { useSyncExternalStore } from 'react'
import { GOALS, METHODS, type PaymentMethod, type SavingsGoal } from './data'

export interface TopUpState {
  goalId: string
  amount: number
  methodId: string
}

let state: TopUpState = {
  goalId: GOALS[0].id,
  amount: 0,
  methodId: METHODS[0].id,
}

const listeners = new Set<() => void>()

function emit() {
  // forEach (not for..of) — the repo's tsconfig target predates Set iteration.
  listeners.forEach((l) => l())
}

export const store = {
  get: () => state,
  set(patch: Partial<TopUpState>) {
    state = { ...state, ...patch }
    emit()
  },
  reset() {
    state = { goalId: GOALS[0].id, amount: 0, methodId: METHODS[0].id }
    emit()
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useTopUp(): TopUpState {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}

export function selectedGoal(s: TopUpState): SavingsGoal {
  return GOALS.find((g) => g.id === s.goalId) ?? GOALS[0]
}

export function selectedMethod(s: TopUpState): PaymentMethod {
  return METHODS.find((m) => m.id === s.methodId) ?? METHODS[0]
}
