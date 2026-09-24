// =============================================================================
// The Assets section's pages. Assets is the illustration generator, a separate
// app (repo: amartha-illustration) that the studio serves at /assets-app
// through a rewrite and embeds at /assets. One list feeds the sidebar, the
// breadcrumb and the embed, so a page added here appears in all three.
// =============================================================================

export const ASSET_PAGES = [
  { slug: 'generate', label: 'Generate' },
  { slug: 'qc', label: 'QC' },
  { slug: 'library', label: 'Library' },
  { slug: 'references', label: 'References' },
] as const

export type AssetPage = (typeof ASSET_PAGES)[number]

/** /assets and /assets/<slug> → the page it shows; unknown slugs fall back to Generate. */
export function resolveAssetPage(pathname: string): AssetPage {
  const slug = pathname.split('/')[2]
  return ASSET_PAGES.find((p) => p.slug === slug) ?? ASSET_PAGES[0]
}
