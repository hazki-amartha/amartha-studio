'use client'

// =============================================================================
// Illustration — artwork from the illustration library: the Assets section,
// which is the amartha-illustration app the studio serves at /assets-app.
// Prototypes never carry illustration files. They name one, and the library
// serves it, resized, from /assets-app/i/ (public, so share links show it).
//
//   <Illustration name="koneksi-terputus" />        a library illustration;
//                                                   Copy code on its card
//   <Illustration name="panen-raya" tier="hero" />  Hero and Splash say so
//   <Illustration generic="error" />                stands in until the right
//                                                   one exists
//
// A name is fixed: the library never points it at another image, so a
// prototype never changes under its designer. A generic state is the one
// pointer that moves, when the library picks a better stand-in.
//
// The element is a box of the tier's shape with the image inside, so the
// layout holds while it loads. If the image can't load (an unknown name, or
// ASSET_GENERATOR_URL unset on this machine), the box shows a tinted
// placeholder instead of a broken image.
// =============================================================================

import { useState, type HTMLAttributes } from 'react'
import { Image as ImageIcon } from '../icons'

/** The states with a generic illustration. The library lists the same ids. */
export const ILLUSTRATION_GENERICS = ['error', 'offline', 'empty', 'success', 'waiting', 'warning'] as const

export type IllustrationGeneric = (typeof ILLUSTRATION_GENERICS)[number]
export type IllustrationTier = 'spot' | 'hero' | 'splash'

type IllustrationProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  /** Spot (square, the default), Hero (16:9) or Splash (9:16), as the library made it. */
  tier?: IllustrationTier
  /** A Spot's side in px. Hero and Splash fill their container's width. */
  size?: number
  /** Empty by default: an illustration beside a title is decoration. */
  alt?: string
} & ({ name: string; generic?: never } | { generic: IllustrationGeneric; name?: never })

const BASE = '/assets-app/i'
// Asked for at twice the drawn width, for sharp screens; the library rounds
// up to a width it keeps.
const FULL_WIDTH = 1080

const ASPECT: Record<Exclude<IllustrationTier, 'spot'>, string> = { hero: '16 / 9', splash: '9 / 16' }

export function Illustration({
  name,
  generic,
  tier = 'spot',
  size = 160,
  alt = '',
  className,
  style,
  ...props
}: IllustrationProps) {
  const width = tier === 'spot' ? size * 2 : FULL_WIDTH
  const src = generic ? `${BASE}/generic/${generic}.webp?w=${width}` : `${BASE}/${name}.webp?w=${width}`
  // Kept per URL, so a swapped-in name gets its own try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = failedSrc === src
  const box = tier === 'spot' ? { width: size, height: size } : { aspectRatio: ASPECT[tier] }

  return (
    <span
      role={failed && alt ? 'img' : undefined}
      aria-label={failed && alt ? alt : undefined}
      {...props}
      className={[
        tier === 'spot' ? 'inline-flex' : 'flex w-full',
        'items-center justify-center overflow-hidden align-middle',
        failed ? 'rounded-16 bg-primary-50 text-primary-500' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...box, ...style }}
      data-fds="Illustration"
      data-fds-name={name}
      data-fds-generic={generic}
      data-fds-tier={tier}
    >
      {failed ? (
        <ImageIcon size={24} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- the library resizes it; next/image would only add a loader in front of a URL that is already the right size
        <img src={src} alt={alt} decoding="async" className="size-full object-contain" onError={() => setFailedSrc(src)} />
      )}
    </span>
  )
}
