// =============================================================================
// AssetFrame — Amartha Illustration, embedded. It is served from this origin
// under /assets-app (see the rewrite in next.config.mjs), so the frame is
// same-origin: the session cookie its Google sign-in popup sets is the one the
// frame sends, and it reads the studio theme straight off this document's
// <html data-theme>. Nothing crosses by postMessage.
// =============================================================================

'use client'

import { usePathname } from 'next/navigation'
import { resolveAssetPage } from './assetPages'

export function AssetFrame() {
  const page = resolveAssetPage(usePathname() ?? '/assets')

  return (
    <iframe
      key={page.slug}
      src={`/assets-app/${page.slug}`}
      title={`Assets — ${page.label}`}
      className="block size-full border-0 bg-neutral-50 dark:bg-ink-950"
    />
  )
}
