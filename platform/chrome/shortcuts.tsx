'use client'

// =============================================================================
// Keyboard shortcuts on the prototype canvas — single keys, as in Figma.
//
//   C  Comment      E  Edit        F  Full screen     R  Restart
//   Shift+1  Fit    Shift+0  100%  +  Zoom in         −  Zoom out
//   ?  this list    Esc  back out one step
//
// A key does nothing while someone is typing — the chat box, a comment, the
// Edit panel's fields, a text field inside the prototype itself — or with
// ⌘/Ctrl/Alt held, so copy, paste, undo and Edit mode's own ⌘-keys are
// untouched. Edit mode's plain keys (Delete, the arrows) aren't listed here, so
// they keep editing.
//
// Each layout passes only the actions it has: zoom only exists on a desktop
// frame, and full screen has nothing to open from inside itself.
// =============================================================================

import { useEffect, useRef } from 'react'

export type ShortcutAction =
  'comment' | 'edit' | 'fullscreen' | 'restart' | 'fit' | 'actual' | 'zoomIn' | 'zoomOut' | 'help' | 'escape'

export const SHORTCUTS: {
  action: ShortcutAction
  keys: string
  label: string
}[] = [
  { action: 'comment', keys: 'C', label: 'Comment' },
  { action: 'edit', keys: 'E', label: 'Edit' },
  { action: 'fullscreen', keys: 'F', label: 'Full screen' },
  { action: 'restart', keys: 'R', label: 'Restart from the first screen' },
  { action: 'fit', keys: 'Shift 1', label: 'Fit to the canvas' },
  { action: 'actual', keys: 'Shift 0', label: 'Zoom to 100%' },
  { action: 'zoomIn', keys: '+', label: 'Zoom in' },
  { action: 'zoomOut', keys: '−', label: 'Zoom out' },
  {
    action: 'escape',
    keys: 'Esc',
    label: 'Back out — close, leave a mode, exit full screen',
  },
  { action: 'help', keys: '?', label: 'Show these shortcuts' },
]

/** For a button's tooltip: "Comment · C". */
export const withKey = (title: string, action: ShortcutAction) =>
  `${title} · ${SHORTCUTS.find((s) => s.action === action)?.keys ?? ''}`

const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

function actionOf(e: KeyboardEvent): ShortcutAction | null {
  if (e.key === 'Escape') return 'escape'
  if (e.key === '?') return 'help'
  // By code, so Shift+1 is Shift+1 whatever the layout prints on the key.
  if (e.shiftKey && e.code === 'Digit1') return 'fit'
  if (e.shiftKey && e.code === 'Digit0') return 'actual'
  if (e.key === '+' || e.key === '=') return 'zoomIn'
  if (e.key === '-' || e.key === '_') return 'zoomOut'
  if (e.shiftKey) return null
  switch (e.key.toLowerCase()) {
    case 'c':
      return 'comment'
    case 'e':
      return 'edit'
    case 'f':
      return 'fullscreen'
    case 'r':
      return 'restart'
    default:
      return null
  }
}

/** An action returning true has fully handled the key: nothing else hears it
 *  (Esc closing this list shouldn't also leave Comment mode). */
export function useShortcuts(actions: Partial<Record<ShortcutAction, () => boolean | void>>) {
  // Read at key time, so the listener is attached once and never goes stale.
  const ref = useRef(actions)
  ref.current = actions

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      if (typing(e.target)) return
      const action = actionOf(e)
      const run = action ? ref.current[action] : undefined
      if (!run) return
      // Esc is shared with the layers that handle their own (a thread, a
      // selection), so it goes on to them unless this one claimed it.
      const claimed = run() === true
      if (action !== 'escape' || claimed) e.preventDefault()
      if (claimed) e.stopImmediatePropagation()
    }
    // Capture, so this runs before those layers' own window listeners.
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
}

/** The list, over the canvas. Esc, ?, or a click outside closes it. */
export function ShortcutSheet({ only, onClose }: { only?: ShortcutAction[]; onClose: () => void }) {
  const rows = only ? SHORTCUTS.filter((s) => only.includes(s.action)) : SHORTCUTS
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-16"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-12 rounded-16 bg-neutral-white p-20 shadow-sm dark:bg-ink-900"
      >
        <p className="text-16 font-bold text-default dark:text-neutral-50">Keyboard shortcuts</p>
        <ul className="flex flex-col gap-8">
          {rows.map((s) => (
            <li key={s.action} className="flex items-center justify-between gap-12">
              <span className="text-14 font-regular text-caption dark:text-neutral-400">{s.label}</span>
              <kbd className="flex-none rounded-8 border border-default px-8 py-2 text-12 font-bold text-default dark:border-ink-700 dark:text-neutral-50">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
