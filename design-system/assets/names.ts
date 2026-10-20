// =============================================================================
// The names of FunDS's brand artwork, one list per family, each matching the
// SVGs in public/funds/. Plain data with no React, so server code can read it
// too: Edit's menus (platform/design/componentProps.ts) and the Assets
// section's Brand page are built from these lists. The components that draw
// them are in ./index.tsx.
// =============================================================================

export const PRODUCT_LOGOS = [
  'amartha-link',
  'celengan',
  'ggs',
  'insurance',
  'modal',
  'poket',
] as const

export const WORDMARKS = [
  // The corporate lockup — flower mark plus the word "amartha". This is the
  // company, not a product: it belongs in an app's own chrome (the NGMIS menu
  // header) rather than beside a product tile.
  'amartha',
  'amartha-link',
  'celengan',
  'empower',
  'ggs',
  'modal',
  'poket',
  'proteksi',
] as const

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
