'use client'

import { useEffect, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * What a modal surface owes a keyboard or a screen reader, shared by Modal and
 * BottomSheet: focus moves into the panel when it opens, Tab and Shift+Tab stay
 * inside it while it is open, and focus goes back to whatever opened it when
 * it closes.
 *
 * A prototype runs beside the studio's own panels, so the dialog only takes
 * focus that is already the prototype's — inside the same Screen, or nowhere.
 * A save re-renders every screen; a sheet left open while the designer types
 * in Chat must not pull the cursor out of the chat box when it mounts again,
 * nor hand it back to the prototype when it closes.
 */
export function useDialogFocus(open: boolean, panel: RefObject<HTMLElement>) {
  useEffect(() => {
    const node = panel.current
    if (!open || !node) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const scope = node.closest('[data-fds="Screen"]') ?? node.parentElement
    const ours = !opener || opener === document.body || Boolean(scope?.contains(opener))
    if (ours) node.focus({ preventScroll: true })

    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !node) return
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === node)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    node.addEventListener('keydown', onKey)
    return () => {
      node.removeEventListener('keydown', onKey)
      // Only if focus is still the dialog's — gone with it, or still inside —
      // and only to an opener that is still on the page.
      const stillOurs = document.activeElement === document.body || node.contains(document.activeElement)
      if (ours && stillOurs && opener && opener !== document.body && opener.isConnected) {
        opener.focus({ preventScroll: true })
      }
    }
  }, [open, panel])
}
