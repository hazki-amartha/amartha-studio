// =============================================================================
// Theme — manual light/dark toggle for the studio chrome. Default is dark; the
// pre-hydration script in app/layout.tsx stamps <html data-theme> before paint,
// so this hook only mirrors + mutates that state. Persisted in localStorage.
// Dark styling lives on the chrome surfaces themselves (dark: variants); this
// module just flips the switch.
// =============================================================================

'use client'

import { useCallback, useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from './icons'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'db.chrome.theme'

function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  // Start from the DOM (already set pre-hydration) so first paint matches.
  const [theme, setTheme] = useState<Theme>('dark')
  useEffect(() => setTheme(currentTheme()), [])

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = next
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* private mode / storage disabled — theme still applies for the session */
      }
      return next
    })
  }, [])

  return { theme, toggle }
}

/** Icon button that flips the chrome theme. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      className={
        className ??
        'flex size-40 items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50'
      }
    >
      {isDark ? <SunIcon className="size-20" /> : <MoonIcon className="size-20" />}
    </button>
  )
}
