// =============================================================================
// AssetsSidebar — page nav for the Assets rail section. The embedded generator
// hides its own nav, so this is the only way between its pages.
// =============================================================================

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ASSET_PAGES, resolveAssetPage } from './assetPages'

export function AssetsSidebar() {
  const active = resolveAssetPage(usePathname() ?? '/assets').slug

  return (
    <div className="flex flex-col gap-16">
      <p className="px-12 text-16 font-bold text-default dark:text-neutral-50">Assets</p>
      <nav aria-label="Assets" className="flex flex-col gap-2">
        {ASSET_PAGES.map(({ slug, label }) => {
          const isActive = active === slug
          return (
            <Link
              key={slug}
              href={`/assets/${slug}`}
              aria-current={isActive ? 'page' : undefined}
              className={
                isActive
                  ? 'rounded-8 bg-primary-50 px-12 py-8 text-14 font-bold text-link dark:border dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-50'
                  : 'rounded-8 px-12 py-8 text-14 text-default hover:bg-neutral-50 dark:border dark:border-transparent dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50'
              }
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
