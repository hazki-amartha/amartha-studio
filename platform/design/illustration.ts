// =============================================================================
// Design · swapping an <Illustration> (design-system/assets/Illustration.tsx).
//
// Edit's Swap opens the illustration library's picker — amartha-illustration's
// /pick page, which this studio serves on its own origin under /assets-app —
// in a dialog, and gets back one PickMessage (the library's lib/pick.ts holds
// the same shape; change both together). A pick becomes prop edits: a library
// illustration is a `name` with its `tier`, a generic stand-in is a `generic`,
// and the two never sit on one element, so swapping from one to the other
// removes the old prop as it adds the new.
// =============================================================================

import { ILLUSTRATION_GENERICS } from '@/design-system/assets/Illustration'

export const PICK_SOURCE = 'amartha-illustration'

export type IllustrationPick =
  | { name: string; tier: 'spot' | 'hero' | 'splash' }
  | { generic: string; tier: 'spot' }

export type PickMessage =
  | ({ source: typeof PICK_SOURCE; type: 'pick' } & IllustrationPick)
  | { source: typeof PICK_SOURCE; type: 'close' }

/** The props as the source writes them; null where it doesn't. */
export interface IllustrationProps {
  name: string | null
  generic: string | null
  tier: string | null
}

export interface PropChange {
  prop: keyof IllustrationProps
  old: string | null
  next: string | null
}

const TIERS = new Set(['spot', 'hero', 'splash'])
const GENERICS = new Set<string>(ILLUSTRATION_GENERICS)
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** What an element's source says now. The component mirrors each prop as
 *  written onto a data-fds attribute, and leaves out what isn't written. */
export function illustrationProps(el: Element): IllustrationProps {
  return {
    name: el.getAttribute('data-fds-name'),
    generic: el.getAttribute('data-fds-generic'),
    tier: el.getAttribute('data-fds-tier'),
  }
}

/** A pick as props, written the way `now` writes them: Spot is the default,
 *  so it stays unwritten unless the source spells it out already. */
export function propsFor(pick: IllustrationPick, now: IllustrationProps): IllustrationProps {
  const tier = pick.tier === 'spot' ? (now.tier === 'spot' ? 'spot' : null) : pick.tier
  return 'name' in pick
    ? { name: pick.name, generic: null, tier }
    : { name: null, generic: pick.generic, tier }
}

/** The prop edits that turn `now` into `next`. */
export function swapEdits(now: IllustrationProps, next: IllustrationProps): PropChange[] {
  return (['generic', 'name', 'tier'] as const)
    .filter((prop) => now[prop] !== next[prop])
    .map((prop) => ({ prop, old: now[prop], next: next[prop] }))
}

/** The picker, opened on what the element shows now. */
export function pickerUrl(now: IllustrationProps): string {
  const params = new URLSearchParams({ tier: now.tier ?? 'spot' })
  if (now.name) params.set('name', now.name)
  if (now.generic) params.set('generic', now.generic)
  return `/assets-app/pick?${params}`
}

/** A small copy of what `props` shows, from the route the component loads. */
export function thumbnailUrl(props: IllustrationProps): string | null {
  if (props.generic) return `/assets-app/i/generic/${props.generic}.webp?w=120`
  if (props.name) return `/assets-app/i/${props.name}.webp?w=120`
  return null
}

/** A message from the picker, checked field by field, or null for anything
 *  else a frame might post. */
export function readPick(data: unknown): PickMessage | null {
  if (!data || typeof data !== 'object') return null
  const message = data as Record<string, unknown>
  if (message.source !== PICK_SOURCE) return null
  if (message.type === 'close') return { source: PICK_SOURCE, type: 'close' }
  if (message.type !== 'pick') return null
  if (typeof message.name === 'string' && NAME.test(message.name) && TIERS.has(message.tier as string)) {
    return { source: PICK_SOURCE, type: 'pick', name: message.name, tier: message.tier as 'spot' | 'hero' | 'splash' }
  }
  if (typeof message.generic === 'string' && GENERICS.has(message.generic) && message.tier === 'spot') {
    return { source: PICK_SOURCE, type: 'pick', generic: message.generic, tier: 'spot' }
  }
  return null
}
