'use client'

// =============================================================================
// DB projects · who else has this project open, as a stack of initials beside
// the Flow button — as in Figma. It used to be a pill across the top of the
// canvas, which sat over the device. Click it for the names in full.
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { ChevronRightIcon } from '@/platform/chrome/icons'

const SHOWN = 3
// Each person keeps one colour wherever they appear.
const COLORS = ['bg-primary-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-yellow-500']

function colorOf(name: string): string {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return COLORS[h % COLORS.length]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)).toUpperCase()
}

const DISC = 'flex size-32 flex-none items-center justify-center rounded-full border-2 border-neutral-white text-12 font-bold text-neutral-white dark:border-ink-900'

export function PresenceAvatars({ names }: { names: string[] }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])

  if (!names.length) return null
  const extra = names.length - SHOWN

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={`Also here: ${names.join(', ')}`}
        aria-label={`Also here: ${names.join(', ')}`}
        className="flex h-40 items-center gap-4 rounded-full border border-default bg-neutral-white py-4 pl-4 pr-8 shadow-sm hover:bg-neutral-50 dark:border-ink-700 dark:bg-ink-900 dark:shadow-none dark:hover:bg-ink-800"
      >
        <span className="flex">
          {names.slice(0, SHOWN).map((n, i) => (
            <span key={n} className={`${DISC} ${colorOf(n)} ${i ? '-ml-8' : ''}`}>
              {initials(n)}
            </span>
          ))}
          {extra > 0 ? <span className={`${DISC} -ml-8 bg-ink-700`}>+{extra}</span> : null}
        </span>
        <ChevronRightIcon className="size-16 rotate-90 text-caption dark:text-neutral-400" />
      </button>
      {open ? (
        <div className="absolute left-0 top-full mt-8 min-w-200 rounded-12 border border-default bg-neutral-white p-8 shadow-sm dark:border-ink-700 dark:bg-ink-900">
          <p className="px-8 pb-4 text-12 text-caption dark:text-neutral-400">Also here</p>
          {names.map((n) => (
            <div key={n} className="flex items-center gap-8 px-8 py-4">
              <span className={`${DISC} border-0 ${colorOf(n)}`}>{initials(n)}</span>
              <span className="text-14 text-default dark:text-neutral-50">{n}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
