// =============================================================================
// NavRail — the slim icon rail. Top-level destinations: Studio and FunDS.
// Active section is driven by the route (resolved in AppShell).
// =============================================================================

'use client'

import Link from 'next/link'
import { FundsIcon, StudioIcon } from './icons'

export type RailSection = 'studio' | 'funds'

const ITEMS: { section: RailSection; href: string; label: string; Icon: typeof StudioIcon }[] = [
  { section: 'studio', href: '/', label: 'Studio', Icon: StudioIcon },
  { section: 'funds', href: '/system', label: 'FunDS', Icon: FundsIcon },
]

export function NavRail({ active }: { active: RailSection | null }) {
  return (
    <nav
      aria-label="Sections"
      className="flex w-48 shrink-0 flex-col items-center gap-8 border-r border-default bg-neutral-white py-12"
    >
      <Link
        href="/"
        aria-label="Amartha Studio home"
        className="flex size-32 items-center justify-center rounded-8 bg-primary-500 text-14 font-bold text-neutral-white"
      >
        D
      </Link>
      <div className="mt-4 flex flex-col gap-4">
        {ITEMS.map(({ section, href, label, Icon }) => {
          const isActive = active === section
          return (
            <Link
              key={section}
              href={href}
              title={label}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={
                isActive
                  ? 'flex size-40 items-center justify-center rounded-8 bg-primary-50 text-link'
                  : 'flex size-40 items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default'
              }
            >
              <Icon className="size-20" />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
