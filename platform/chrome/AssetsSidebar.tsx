// =============================================================================
// AssetsSidebar — the Assets section's pages, under the sidebar's section
// switcher. The embedded generator hides its own nav, so this is the only way
// between its pages. Brand, the design system's artwork, sits in its own group.
// =============================================================================

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ASSET_PAGES, BRAND_PAGE, resolveAssetPage, type AssetPage } from './assetPages'
import { GROUP_LABEL, ROW_ACTIVE, ROW_IDLE } from './sidebarRows'

export function AssetsSidebar() {
  const active = resolveAssetPage(usePathname() ?? '/assets').slug

  const row = ({ slug, label }: AssetPage) => {
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
  }

  return (
    <nav aria-label="Assets" className="flex flex-col gap-2">
      <p className={GROUP_LABEL}>Illustrations</p>
      {ASSET_PAGES.map(row)}
      <p className={GROUP_LABEL}>Design system</p>
      {row(BRAND_PAGE)}
    </nav>
  )
}
