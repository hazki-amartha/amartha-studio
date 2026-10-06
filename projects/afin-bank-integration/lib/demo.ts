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

export const statusAktif = () => store.set({ account: 'active', status: 'active' })
export const statusDormant = () => store.set({ account: 'active', status: 'dormant' })
export const statusBeku = () => store.set({ account: 'active', status: 'frozen' })

export const pinBenar = () => store.set({ pin: 'correct' })
export const pinSalah = () => store.set({ pin: 'wrong' })
export const pinTerkunci = () => store.set({ pin: 'locked' })

export const punyaRekening = () => store.set({ account: 'active' })
export const tanpaRekening = () => store.set({ account: 'none' })

// Modal onboarding home persona.
export const personaBorrower = () => store.set({ persona: 'borrower' })
export const personaRegular = () => store.set({ persona: 'regular' })

// --- The ten Beranda states (home state switcher) ---
// Non Modal → regular home, keyed by the bank account's status.
export const berandaNonBelum = () => store.set({ persona: 'regular', account: 'none' })
export const berandaNonProses = () => store.set({ persona: 'regular', account: 'in-progress' })
export const berandaNonGagal = () => store.set({ persona: 'regular', account: 'failed' })
export const berandaNonAktif = () => store.set({ persona: 'regular', account: 'active' })
// Modal → borrower home, keyed by the loan-lifecycle stage. Once Modal is active
// (approved onwards) the white-labelled Rekening Amartha opens too, so the wallet
// shows the active account (key logic).
export const berandaBelumKyc = () => store.set({ persona: 'borrower', modalStage: 'belum-kyc', account: 'none' })
export const berandaKycOngoing = () => store.set({ persona: 'borrower', modalStage: 'kyc-ongoing', account: 'none' })
export const berandaKycGagal = () => store.set({ persona: 'borrower', modalStage: 'kyc-gagal', account: 'none' })
export const berandaKycDiproses = () => store.set({ persona: 'borrower', modalStage: 'kyc-diproses', account: 'none' })
export const berandaKycBerhasil = () => store.set({ persona: 'borrower', modalStage: 'kyc-berhasil', account: 'active' })
export const berandaDicairkan = () => store.set({ persona: 'borrower', modalStage: 'dicairkan', account: 'active' })

// Whether the application's sections are pre-filled.
export const modalKosong = () => store.set({ modalFilled: false })
export const modalTerisi = () => store.set({ modalFilled: true })

// Poket detail tier.
export const poketNonPremium = () => store.set({ poketTier: 'non-premium' })
export const poketPremiumMitra = () => store.set({ poketTier: 'premium-mitra' })
export const poketPremiumNonMitra = () => store.set({ poketTier: 'premium-non-mitra' })

// Modal approved → the white-labelled bank account opens with it (key logic).
export const modalDisetujui = () => store.set({ modalFilled: true, account: 'active' })
export const modalMenunggu = () => store.set({ account: 'none' })
