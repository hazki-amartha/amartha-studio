'use client'

// One-click states beside the device. None of this is the prototype — it only
// writes the store the screens read.

import { store } from './store'

export const belumPunya = () => store.set({ account: 'none' })
export const sedangDiproses = () => store.set({ account: 'in-progress' })
export const gagal = () => store.set({ account: 'failed' })
export const aktif = () => store.set({ account: 'active' })

export const kycVerified = () => store.set({ kyc: 'verified' })
export const kycBasic = () => store.set({ kyc: 'basic' })

export const livenessLolos = () => store.set({ liveness: 'pass' })
export const livenessGagal = () => store.set({ liveness: 'fail' })
export const livenessTerkunci = () => store.set({ liveness: 'locked' })
