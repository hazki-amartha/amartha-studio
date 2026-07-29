'use client'

// The two shipped homepage states, offered as one-click controls beside the
// device (`states` on the home ScreenDef). Kept out of the screen's own code:
// none of this is the prototype, it just writes the store the screen reads.

import { store } from './store'

/** Modal loan running, no agency — the PPOB row stays a five-shortcut strip. */
export const modalAktif = () => store.set({ modalActive: true, amarthaLinkActive: false })

/** AmarthaLink agent, no Modal loan — the PPOB row becomes the agent widget. */
export const amarthaLinkAktif = () => store.set({ modalActive: false, amarthaLinkActive: true })
