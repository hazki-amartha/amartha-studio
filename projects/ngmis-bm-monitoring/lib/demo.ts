'use client'

// Presentation states — the one-click conditions offered beside the device in
// desktop prototype view (`states` on a ScreenDef).
//
// Kept in its own file: none of this is the prototype. Both functions write the
// same store the screen already reads, so picking a state is indistinguishable
// from the page having been built that way.

import { store } from './store'

/** What ships first: the figures, no movement, no ranking. */
export const showMvp = () => store.set('mvp')

/** Where it is heading: rates lead, scored by colour, with week-on-week
 *  movement and the branch's worst bucket called out. */
export const showEndState = () => store.set('end')
