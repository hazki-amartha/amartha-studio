// =============================================================================
// WS-A · DeviceFrame — the app viewport inside a bezel.
// Two kinds, both driven by DEVICE_SPECS: a phone (390×844, heavy rounded
// bezel) and a laptop browser viewport (1440×900, thin square bezel). The
// dimensions live in the CSS module beside these classes — hardware spec, not
// a design token.
// =============================================================================

import type { ReactNode } from 'react'
import type { DeviceKind } from '@/platform/types'
import styles from './prototype.module.css'

export function DeviceFrame({
  device = 'mobile',
  children,
}: {
  device?: DeviceKind
  children: ReactNode
}) {
  const desktop = device === 'desktop'
  return (
    <div className={desktop ? styles.bezelDesktop : styles.bezel}>
      <div className={desktop ? styles.screenDesktop : styles.screen}>{children}</div>
    </div>
  )
}
