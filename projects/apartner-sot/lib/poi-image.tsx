'use client'

// A drawn stand-in for a photo of the POI. The prototype ships no real photos
// (§2: only tokens, no external assets), so each kind of place gets its own flat
// illustration, coloured entirely from design-system tokens — every shape sets
// its colour with a `text-*` class and `fill="currentColor"`, so nothing here is
// a hardcoded hex. Used as a thumbnail on the POI brief and, blown up, in a
// maximize sheet.

import type { PoiArt } from './leads'
import { POI_PHOTO } from './poi-photos'

/** The shapes for one scene. Each element carries its own token colour. */
function Scene({ art }: { art: PoiArt }) {
  if (art === 'pasar-ikan') {
    return (
      <>
        <rect x="0" y="0" width="64" height="64" className="text-blue-200" fill="currentColor" />
        {/* ripples */}
        <rect x="0" y="46" width="64" height="18" className="text-blue-400" fill="currentColor" opacity="0.4" />
        {/* big fish */}
        <ellipse cx="28" cy="34" rx="15" ry="9" className="text-blue-500" fill="currentColor" />
        <path d="M42 34 L56 25 L56 43 Z" className="text-blue-400" fill="currentColor" />
        <circle cx="21" cy="31" r="2.2" className="text-neutral-white" fill="currentColor" />
        {/* little fish */}
        <ellipse cx="47" cy="15" rx="7" ry="4.5" className="text-orange-500" fill="currentColor" />
        <path d="M54 15 L61 11 L61 19 Z" className="text-orange-400" fill="currentColor" />
        <circle cx="43" cy="13.5" r="1.4" className="text-neutral-white" fill="currentColor" />
        {/* bubbles */}
        <circle cx="12" cy="16" r="2" className="text-neutral-white" fill="currentColor" opacity="0.8" />
        <circle cx="18" cy="10" r="1.4" className="text-neutral-white" fill="currentColor" opacity="0.8" />
      </>
    )
  }
  if (art === 'balai') {
    return (
      <>
        <rect x="0" y="0" width="64" height="64" className="text-blue-200" fill="currentColor" />
        <rect x="0" y="48" width="64" height="16" className="text-green-200" fill="currentColor" />
        <rect x="14" y="30" width="36" height="18" className="text-neutral-white" fill="currentColor" />
        <path d="M10 30 L32 14 L54 30 Z" className="text-primary-500" fill="currentColor" />
        <rect x="28" y="37" width="8" height="11" className="text-primary-600" fill="currentColor" />
        <rect x="18" y="34" width="6" height="6" className="text-blue-400" fill="currentColor" />
        <rect x="40" y="34" width="6" height="6" className="text-blue-400" fill="currentColor" />
      </>
    )
  }
  // 'warung' — a striped-awning food stall.
  return (
    <>
      <rect x="0" y="0" width="64" height="64" className="text-blue-200" fill="currentColor" />
      <rect x="0" y="48" width="64" height="16" className="text-green-200" fill="currentColor" />
      {/* building */}
      <rect x="12" y="26" width="40" height="20" className="text-neutral-white" fill="currentColor" />
      <rect x="26" y="30" width="12" height="12" className="text-blue-400" fill="currentColor" />
      {/* counter */}
      <rect x="9" y="42" width="46" height="5" className="text-primary-600" fill="currentColor" />
      {/* striped awning */}
      <rect x="8" y="18" width="48" height="9" className="text-primary-500" fill="currentColor" />
      <rect x="14" y="18" width="6" height="9" className="text-neutral-white" fill="currentColor" />
      <rect x="28" y="18" width="6" height="9" className="text-neutral-white" fill="currentColor" />
      <rect x="42" y="18" width="6" height="9" className="text-neutral-white" fill="currentColor" />
    </>
  )
}

export function PoiImage({ art, className, alt }: { art: PoiArt; className?: string; alt?: string }) {
  // A real photo when the POI has one; the drawn scene otherwise.
  const photo = POI_PHOTO[art]
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={alt ?? ''} className={`${className ?? ''} object-cover`} />
  }
  return (
    <svg
      viewBox="0 0 64 64"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      <Scene art={art} />
    </svg>
  )
}
