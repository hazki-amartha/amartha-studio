// =============================================================================
// Chat · effort — how long Claude thinks before it answers and changes files.
// The composer's effort menu picks it for the next message; the laptop route
// passes it to the CLI as --effort, the studio's (./server/cloud.ts) as the
// SDK's effort option.
//
// Left unset, Opus 5.5 runs at medium — a level below the owner's own Claude
// Code, and the gap between Chat's work and a terminal's. High thinks longer:
// better on new screens and multi-step changes, at about 1.5× the tokens, and
// slower — on the studio a turn is likelier to reach its 255-second stop.
// =============================================================================

export const EFFORTS = ['medium', 'high'] as const
export type Effort = (typeof EFFORTS)[number]

/** Until a designer picks: Chat's work is mostly multi-step building, where a
 *  weaker answer that needs a second message costs more than the thinking. */
export const DEFAULT_EFFORT: Effort = 'high'

/** A known level, or the default — a request's value is never passed on as is. */
export function effortOf(value: unknown): Effort {
  return EFFORTS.includes(value as Effort) ? (value as Effort) : DEFAULT_EFFORT
}
