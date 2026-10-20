'use client'

// =============================================================================
// ShellPortal — draws its children into one of the shell's slots
// (shellSlots.ts), or nowhere while the shell isn't showing that slot.
// =============================================================================

import { useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { getShellSlots, subscribeShellSlots, type SlotName } from './shellSlots'

export function ShellPortal({ slot, children }: { slot: SlotName; children: ReactNode }) {
  const el = useSyncExternalStore(subscribeShellSlots, () => getShellSlots()[slot], () => null)
  return el ? createPortal(children, el) : null
}

/** A page's own part of the top bar — a count beside the title, and its
 *  actions at the right end — for a server page, which can't portal itself. */
export function TopBarContent({ meta, children }: { meta?: string; children?: ReactNode }) {
  return (
    <>
      {meta ? <ShellPortal slot="meta">{meta}</ShellPortal> : null}
      {children ? <ShellPortal slot="actions">{children}</ShellPortal> : null}
    </>
  )
}
