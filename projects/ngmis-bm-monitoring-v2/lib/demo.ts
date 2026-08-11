'use client'

// Presentation states — the one-click conditions offered beside the device in
// desktop prototype view (`states` on a ScreenDef, wired in index.ts).
//
// They exist for the walkthrough, not for the prototype: each just writes the
// `commentStyle` the briefing form already reads, so switching a state is
// indistinguishable from the form having shipped that way. Kept in their own
// file (CLAUDE.md §3) — none of this is the prototype itself.

import { store } from './store'

/** Komentar box in every section's table (the default). */
export const commentInline = () => store.set({ commentStyle: 'inline' })

/** No per-section box; one note per BP in a section of its own. */
export const commentDedicated = () => store.set({ commentStyle: 'dedicated' })

/** A "✎ Isi" CTA in every section that opens a dialog to type in. */
export const commentDialog = () => store.set({ commentStyle: 'dialog' })

/** Scorecard as the reference sheet draws it: BPs across the top. */
export const layoutMatrix = () => store.set({ scorecardLayout: 'matrix' })

/** Scorecard transposed: BPs down the side, measure pairs in one cell. */
export const layoutByBp = () => store.set({ scorecardLayout: 'bp-rows' })
