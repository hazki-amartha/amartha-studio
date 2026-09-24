import type { Metadata } from 'next'
import { AssetFrame } from '@/platform/chrome/AssetFrame'

export const metadata: Metadata = {
  title: 'Assets — Amartha Studio',
  description: 'Generate, review and browse Amartha illustrations.',
}

export default function AssetsPage() {
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
