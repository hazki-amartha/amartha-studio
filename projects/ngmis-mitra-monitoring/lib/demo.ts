'use client'

// Presentation states offered beside the device. Each writes the same store
// the screen reads, so picking one is the same as the page having been built
// that way.

import { store } from './store'
import { store as dailyStore } from './daily-store'

export const showHmb = () => store.setRole('hmb')
export const showFo = () => store.setRole('fo')

/** Evening is the briefing scheduled now — Progres harian's banner prompts it. */
export const scheduleEvening = () => dailyStore.set({ scheduled: 'evening' })

/** Morning is the briefing scheduled now — Progres harian's banner prompts it. */
export const scheduleMorning = () => dailyStore.set({ scheduled: 'morning' })
