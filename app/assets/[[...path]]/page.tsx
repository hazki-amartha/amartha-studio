import type { Metadata } from 'next'
import { AssetFrame } from '@/platform/chrome/AssetFrame'
import { BRAND_PAGE } from '@/platform/chrome/assetPages'
import { BrandAssets } from '@/platform/chrome/BrandAssets'

export const metadata: Metadata = {
  title: 'Assets — Amartha Studio',
  description: 'Generate, review and browse Amartha illustrations, and the brand artwork.',
}

export default function AssetsPage({ params }: { params: { path?: string[] } }) {
  // Brand is the studio's own page: its artwork ships with the design system,
  // so it shows even where the generator isn't connected.
  if (params.path?.[0] === BRAND_PAGE.slug) return <BrandAssets />

  if (!process.env.ASSET_GENERATOR_URL) {
    return (
      <div className="flex size-full items-center justify-center p-24">
        <p className="text-14 text-caption dark:text-neutral-400">
          Assets isn&apos;t connected. Set ASSET_GENERATOR_URL to the generator&apos;s deployment and restart.
        </p>
      </div>
    )
  }

  return <AssetFrame />
}
