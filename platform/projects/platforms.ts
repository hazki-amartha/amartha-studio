// =============================================================================
// The platforms as the studio shows them — their label and swatch — shared by
// the gallery (cards, filter chips) and the New Project dialog, so a colour
// names the same product everywhere.
// =============================================================================

import type { Platform } from '@/platform/types'

// Enum value is code-friendly; the display label carries the hyphen/casing.
export const PLATFORM_LABEL: Record<Platform, string> = {
  APartner: 'A-Partner',
  AFIN: 'AFIN',
  NGMIS: 'NGMIS',
}

// Platform is a filter now, not a folder — display order only.
export const PLATFORM_ORDER: Platform[] = ['AFIN', 'APartner', 'NGMIS']

// One hue per platform — AFIN purple (the brand's consumer app), A-Partner
// blue, NGMIS green — so a card's colour tells you which product it belongs to
// before you read a word of it. The platform chips carry the same swatch, which
// makes the filter row the legend.
export const PLATFORM_COLOR: Record<Platform, { card: string; dot: string }> = {
  AFIN: { card: 'from-primary-700 to-primary-900', dot: 'bg-primary-500' },
  APartner: { card: 'from-blue-600 to-blue-800', dot: 'bg-blue-500' },
  NGMIS: { card: 'from-green-600 to-green-800', dot: 'bg-green-500' },
}
