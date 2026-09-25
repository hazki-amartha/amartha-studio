'use client'

// A one-line confirmation above the tab bar — "Tugas ditandai dilewati." — per
// the BP APP 2026 Figma. FunDS has no snackbar yet, so it is project-local (see
// NOTES.md). It reads the store's `flash`, and clears it on "Oke" or after a
// few seconds, so it shows once, on the screen the action returned to.

import { useEffect } from 'react'
import { CheckCircleFill } from '@/design-system/icons'
import { store, useApp } from './store'

export function Snackbar() {
  const s = useApp()
  const message = s.flash

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => store.clearFlash(), 4000)
    return () => clearTimeout(t)
  }, [message])

  if (!message) return null
  return (
    <div className="px-16 pb-8">
      <div
        role="status"
        className="flex items-center gap-12 rounded-8 bg-green-500 px-16 py-12 text-neutral-white"
      >
        <CheckCircleFill size={20} />
        <span className="min-w-0 flex-1 text-14">{message}</span>
        <button type="button" onClick={() => store.clearFlash()} className="shrink-0 text-14 font-bold">
          Oke
        </button>
      </div>
    </div>
  )
}
