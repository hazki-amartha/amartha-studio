// =============================================================================
// MobileTopNav — the shell's chrome below md, where there is no room for the
// icon rail or the secondary sidebar. A 48px bar (hamburger + wordmark) sits
// above the breadcrumb bar; the hamburger expands the top-level destinations
// (Studio, FunDS) inline. Prototype routes never render this — they go
// fullscreen with TripleTapExit instead.
// =============================================================================

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CloseIcon, FundsIcon, MenuIcon, StudioIcon } from './icons'
import type { RailSection } from './NavRail'

const ITEMS: { section: RailSection; href: string; label: string; Icon: typeof StudioIcon }[] = [
  { section: 'studio', href: '/', label: 'Studio', Icon: StudioIcon },
  { section: 'funds', href: '/system', label: 'FunDS', Icon: FundsIcon },
]

export function MobileTopNav({ active }: { active: RailSection | null }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="shrink-0 md:hidden">
      <div className="flex h-48 items-center gap-12 border-b border-default bg-neutral-white px-16">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="flex size-32 items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default"
        >
          {open ? <CloseIcon className="size-20" /> : <MenuIcon className="size-20" />}
        </button>
        <Link href="/" className="flex items-center gap-8" onClick={() => setOpen(false)}>
          <span className="flex size-24 items-center justify-center rounded-8 bg-primary-500 text-12 font-bold text-neutral-white">
            D
          </span>
          <span className="text-14 font-bold text-default">Amartha Studio</span>
        </Link>
      </div>

      {open ? (
        <nav
          aria-label="Sections"
          className="flex flex-col gap-2 border-b border-default bg-neutral-white p-8"
        >
          {ITEMS.map(({ section, href, label, Icon }) => {
            const isActive = active === section
            return (
              <Link
                key={section}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={
                  isActive
                    ? 'flex items-center gap-12 rounded-8 bg-primary-50 px-12 py-8 text-14 font-bold text-link'
                    : 'flex items-center gap-12 rounded-8 px-12 py-8 text-14 text-default hover:bg-neutral-50'
                }
              >
                <Icon className="size-20" />
                {label}
              </Link>
            )
          })}
        </nav>
      ) : null}
    </div>
  )
}
