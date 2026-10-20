// =============================================================================
// AssetsSidebar — the Assets section's pages, under the sidebar's section
// switcher. The embedded generator hides its own nav, so this is the only way
// between its pages.
// =============================================================================

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ASSET_PAGES, resolveAssetPage } from './assetPages'
import { GROUP_LABEL, ROW_ACTIVE, ROW_IDLE } from './sidebarRows'

export function AssetsSidebar() {
  const active = resolveAssetPage(usePathname() ?? '/assets').slug

  return (
    <nav aria-label="Illustrations" className="flex flex-col gap-2">
      <p className={GROUP_LABEL}>Illustrations</p>
      {ASSET_PAGES.map(({ slug, label }) => {
        const isActive = active === slug
        return (
          <Link
            key={slug}
            href={`/assets/${slug}`}
            aria-current={isActive ? 'page' : undefined}
            className={isActive ? ROW_ACTIVE : ROW_IDLE}
          >
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
