// =============================================================================
// The Assets section's pages. Most are the illustration generator, a separate
// app (repo: amartha-illustration) that the studio serves at /assets-app
// through a rewrite and embeds at /assets. One list feeds the sidebar, the
// breadcrumb and the embed, so a page added here appears in all three.
//
// Brand is the exception: the studio draws it itself (BrandAssets.tsx), since
// its artwork ships with the design system rather than the generator.
// =============================================================================

export const ASSET_PAGES = [
  { slug: 'generate', label: 'Generate' },
  { slug: 'qc', label: 'QC' },
  { slug: 'library', label: 'Library' },
  { slug: 'references', label: 'References' },
] as const

export const BRAND_PAGE = { slug: 'brand', label: 'Brand' } as const

export type AssetPage = (typeof ASSET_PAGES)[number] | typeof BRAND_PAGE

/** /assets and /assets/<slug> → the page it shows; unknown slugs fall back to Generate. */
export function resolveAssetPage(pathname: string): AssetPage {
  const slug = pathname.split('/')[2]
  if (slug === BRAND_PAGE.slug) return BRAND_PAGE
  return ASSET_PAGES.find((p) => p.slug === slug) ?? ASSET_PAGES[0]
}
