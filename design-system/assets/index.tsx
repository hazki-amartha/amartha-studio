// FunDS brand assets — the multi-colour artwork, kept separate from the icon
// set on purpose.
//
// `@/design-system/icons` is 166 monochrome Phosphor glyphs that inherit
// currentColor and come in 16/20/24. These are a different species: fixed brand
// illustrations with their own palettes and gradients. They can't take a text-*
// token and they must not be recoloured, so giving them the icon API would be a
// lie.
//
// Four families, and the difference between the first two matters when you are
// picking one:
//
//   ProductLogo  56x56 square — the MARK alone, no words. For tiles and rows
//                where a label sits beside or under it.
//   Wordmark     wide lockup — the mark AND the product name set as artwork.
//                Already says its own name, so never pair it with a text label.
//   ServiceIcon  48x48 square — the PPOB / service glyphs.
//   NavIcon      24x24 — the bottom navigation bar's own artwork, which is
//                two-tone when active and a flat neutral-500 silhouette when
//                not. That state is baked into the file, so it takes `active`
//                rather than a colour.
//
//   import { NavIcon, ProductLogo, ServiceIcon, Wordmark } from '@/design-system/assets'
//   <ProductLogo name="poket" />
//   <Wordmark name="poket" height={20} />
//   <ServiceIcon name="pln" size={40} />
//   <NavIcon name="home" active />
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

export const WORDMARKS = ['celengan', 'empower', 'modal', 'poket', 'proteksi'] as const

export const SERVICE_ICONS = [
  'all',
  'belanja',
  'bpjs',
  'cicilan-kredit',
  'donasi',
  'donasi-inverted',
  'donasi-pohon',
  'donasi-rutin',
  'e-wallet',
  'grassroot',
  'isi-celengan',
  'kirim-uang',
  'laporan-keuangan',
  'paket-data',
  'pdam',
  'pln',
  'pulsa',
  'receipt',
  'tarik-tunai',
  'top-up-game',
  'tv-kabel',
  'wakaf',
  'zakat',
  'zakat-inverted',
] as const

export const NAV_ICONS = ['celengan', 'home', 'modal', 'scan', 'transaction'] as const

export type ProductLogoName = (typeof PRODUCT_LOGOS)[number]
export type WordmarkName = (typeof WORDMARKS)[number]
export type ServiceIconName = (typeof SERVICE_ICONS)[number]
export type NavIconName = (typeof NAV_ICONS)[number]

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

/**
 * A product lockup — mark plus name, drawn as artwork. Sized by height; the
 * width follows the lockup's own proportions. It already carries the product
 * name, so don't set a text label next to it.
 */
export function Wordmark({
  name,
  height = 20,
  ...props
}: Omit<AssetProps, 'size'> & { name: WordmarkName; height?: number }) {
  return (
    <img
      src={`/funds/wordmarks/${name}.svg`}
      height={height}
      alt=""
      aria-hidden="true"
      {...props}
      className={['w-auto', props.className].filter(Boolean).join(' ')}
      style={{ height }}
      data-fds="Wordmark"
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

/**
 * A bottom-navigation glyph. Unlike the Phosphor icons, the selected state is
 * drawn into the artwork — active is two-tone primary-500/primary-300, inactive
 * is a flat neutral-500 silhouette — so this takes `active`, never a colour.
 * Pass it straight to NavigationBar's `icon`, alongside the same `active` flag
 * you give the item.
 */
export function NavIcon({
  name,
  active = false,
  size = 24,
  ...props
}: AssetProps & { name: NavIconName; active?: boolean }) {
  return (
    <img
      src={`/funds/nav/${name}${active ? '-active' : ''}.svg`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      {...props}
      data-fds="NavIcon"
    />
  )
}

/* eslint-enable @next/next/no-img-element */
