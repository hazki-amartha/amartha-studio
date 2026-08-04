// =============================================================================
// Physical geometry per DeviceKind.
// These are hardware specs, not design tokens — the same reason the phone's
// 390×844 has always lived in a CSS module rather than in tailwind.config.ts.
// Kept in one place because five call sites need to agree on them: the bezel,
// the scaler, the prototype layout, the flow thumbnail, and the CSS module.
// =============================================================================

import type { DeviceKind } from '@/platform/types'

export interface DeviceSpec {
  /** The app viewport the screen lays out in. */
  width: number
  height: number
  /** Bezel thickness around the viewport, per side. */
  bezel: number
}

export const DEVICE_SPECS: Record<DeviceKind, DeviceSpec> = {
  // A phone, held.
  mobile: { width: 390, height: 844, bezel: 12 },
  // The NG-MIS reference frame: a laptop browser viewport, not a monitor.
  // 1440×900 is what the FunDS desktop library draws against.
  desktop: { width: 1440, height: 900, bezel: 8 },
}

/** Outer dimensions including the bezel — what the scaler has to fit. */
export function outerSize(spec: DeviceSpec): { width: number; height: number } {
  return { width: spec.width + spec.bezel * 2, height: spec.height + spec.bezel * 2 }
}
