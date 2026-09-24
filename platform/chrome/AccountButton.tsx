// =============================================================================
// AccountButton — the rail's sign-in (platform/auth). Hidden where sign-in
// isn't configured, so local dev and unconfigured previews look as before.
// Signed out: a person icon that goes to Google. Signed in: initials, and a
// card with who you are, what you can do, and Sign out.
// =============================================================================

'use client'

import { useEffect, useRef, useState } from 'react'
import { signIn, signOut, useStudioUser } from '@/platform/auth/session'
import { AccountIcon } from './icons'

const ROLE: Record<string, string> = {
  viewer: 'Viewer — can look and comment',
  editor: 'Editor — can push to projects you own',
  admin: 'Admin',
}

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : label.slice(0, 2)).toUpperCase()
}

export function AccountButton() {
  const { loaded, configured, user } = useStudioUser()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  if (!loaded || !configured) return null

  if (!user) {
    return (
      <button
        type="button"
        onClick={signIn}
        aria-label="Sign in with Google"
        title="Sign in"
        className="flex size-40 items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
      >
        <AccountIcon className="size-20" />
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Signed in as ${user.label}`}
        aria-expanded={open}
        title={user.label}
        className="flex size-40 items-center justify-center rounded-8 hover:bg-neutral-50 dark:hover:bg-ink-800"
      >
        <span className="flex size-32 items-center justify-center rounded-full bg-primary-500 text-10 font-bold text-neutral-white">
          {initials(user.label)}
        </span>
      </button>
      {open ? (
        <div className="absolute bottom-0 left-48 z-50 flex w-240 flex-col gap-8 rounded-12 border border-default bg-neutral-white p-12 shadow-sm dark:border-ink-700 dark:bg-ink-900">
          <div className="flex flex-col gap-2">
            <span className="truncate text-14 font-bold text-default dark:text-neutral-50">{user.label}</span>
            <span className="truncate text-12 text-caption dark:text-neutral-400">{user.email}</span>
          </div>
          <span className="text-12 text-caption dark:text-neutral-400">
            {ROLE[user.role]}
            {user.role !== 'viewer' && !user.displayName ? ' · no display name yet, so you own no projects' : ''}
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            className="self-start rounded-full border border-default px-12 py-4 text-12 font-bold text-default hover:bg-neutral-50 dark:border-ink-700 dark:text-neutral-50 dark:hover:bg-ink-800"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
