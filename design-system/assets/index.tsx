// FunDS brand assets — the multi-colour artwork, kept separate from the icon
// set on purpose.
//
// `@/design-system/icons` is 166 monochrome Phosphor glyphs that inherit
// currentColor and come in 16/20/24. These are a different species: fixed
// brand illustrations with their own palettes and gradients, drawn at 56px
// (product logos) or 48px (service tiles). They can't take a text-* token and
// they must not be recoloured, so giving them the icon API would be a lie.
//
//   import { ProductLogo, ServiceIcon } from '@/design-system/assets'
//   <ProductLogo name="poket" />
//   <ServiceIcon name="pln" size={40} />
//
// They render as <img> against files in public/funds/ rather than inlined JSX.
// The artwork uses gradient defs with fixed ids, and inlining the same asset
// twice on one page would make those ids collide — an <img> gives each one its
// own document and keeps the source tree from carrying 36 hand-pasted SVGs.

import type { ImgHTMLAttributes } from 'react'

export const PRODUCT_LOGOS = [
  'amartha-link',
  'celengan',
  'ggs',
  'insurance',
  'modal',
  'poket',
] as const

export const SERVICE_ICONS = [
  'all',
  'belanja',
  'bpjs',
  'celengan',
  'cicilan-kredit',
  'donasi',
  'donasi-inverted',
  'donasi-pohon',
  'donasi-rutin',
  'e-wallet',
  'empower',
  'grassroot',
  'isi-celengan',
  'kirim-uang',
  'laporan-keuangan',
  'modal',
  'paket-data',
  'pdam',
  'pln',
  'poket',
  'proteksi',
  'pulsa',
  'receipt',
  'tarik-tunai',
  'top-up-game',
  'tv-kabel',
  'wakaf',
  'zakat',
  'zakat-inverted',
] as const

export type ProductLogoName = (typeof PRODUCT_LOGOS)[number]
export type ServiceIconName = (typeof SERVICE_ICONS)[number]

type AssetProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'> & {
  /** Rendered box in px. Defaults to the size the artwork was drawn at. */
  size?: number
}

/* eslint-disable @next/next/no-img-element --
   These are static SVGs served from public/. next/image adds a loader, layout
   machinery and a build-time dependency for artwork that is already vector and
   already the right size — it buys nothing here. */

/** A product logo: Poket, Modal, Celengan, GGS, Insurance, AmarthaLink. */
export function ProductLogo({ name, size = 56, ...props }: AssetProps & { name: ProductLogoName }) {
  return (
    <img
      src={`/funds/logos/${name}.svg`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      {...props}
      data-fds="ProductLogo"
    />
  )
}

/** A service tile glyph: PLN, Pulsa, Zakat, Kirim Uang, … */
export function ServiceIcon({ name, size = 48, ...props }: AssetProps & { name: ServiceIconName }) {
  return (
    <img
      src={`/funds/services/${name}.svg`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      {...props}
      data-fds="ServiceIcon"
    />
  )
}

/* eslint-enable @next/next/no-img-element */
