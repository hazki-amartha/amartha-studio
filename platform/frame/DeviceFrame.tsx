// =============================================================================
// WS-A · DeviceFrame — a 390×844 viewport inside a rounded bezel.
// Wraps the running app for the desktop presentation. Dimensions live in the
// CSS module (hardware spec, not a design token).
// =============================================================================

import type { ReactNode } from 'react'
import styles from './prototype.module.css'

export function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.bezel}>
      <div className={styles.screen}>{children}</div>
    </div>
  )
}
