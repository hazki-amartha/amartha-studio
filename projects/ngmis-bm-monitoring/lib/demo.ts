'use client'

// Presentation states — the one-click conditions offered beside the device in
// desktop prototype view (`states` on a ScreenDef).
//
// Kept in its own file: none of this is the prototype. Both functions write the
// same store the screen already reads, so picking a state is indistinguishable
// from the page having been built that way.

import { store } from './store'
import { store as dailyStore } from './daily-store'

/** What ships first: the figures, no movement, no ranking. */
export const showMvp = () => {
  store.clearTasks()
  store.setVariant('mvp')
}

/** Where it is heading: rates lead, scored by colour, with week-on-week
 *  movement and the branch's worst bucket called out. */
export const showEndState = () => {
  store.clearTasks()
  store.setVariant('end')
}

/** Evening is the briefing scheduled now — Progres harian's banner prompts it. */
export const scheduleEvening = () => dailyStore.set({ scheduled: 'evening' })

/** Morning is the briefing scheduled now — Progres harian's banner prompts it. */
export const scheduleMorning = () => dailyStore.set({ scheduled: 'morning' })
