'use client'

// =============================================================================
// Header status slot — lets the active route publish a little state into the
// shell's top bar (the flow canvas's zoom level, say) instead of growing a
// second header of its own.
//
// Values are primitives, not ReactNode: publishing an element would mint a new
// object each render, and the effect that pushes it upward would re-fire every
// render and loop. Primitives compare cleanly in the dependency array.
// =============================================================================

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export interface HeaderStatus {
  /** Canvas zoom, as a ratio (1 = 100%). */
  zoom?: number
  /** Short uppercase pill, e.g. "no flow metadata". */
  badge?: string
}

interface HeaderStatusCtx {
  status: HeaderStatus | null
  setStatus: (s: HeaderStatus | null) => void
}

const Ctx = createContext<HeaderStatusCtx | null>(null)

export function HeaderStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<HeaderStatus | null>(null)
  // setStatus is referentially stable, so publishers' effects don't re-fire.
  const value = useMemo(() => ({ status, setStatus }), [status])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Read the published status — for the shell header itself. */
export function useHeaderStatus(): HeaderStatus | null {
  return useContext(Ctx)?.status ?? null
}

/** Publish status from a route; clears automatically on unmount. */
export function usePublishHeaderStatus(status: HeaderStatus | null) {
  const setStatus = useContext(Ctx)?.setStatus
  const zoom = status?.zoom
  const badge = status?.badge

  useEffect(() => {
    if (!setStatus) return
    setStatus(zoom == null && badge == null ? null : { zoom, badge })
    return () => setStatus(null)
  }, [setStatus, zoom, badge])
}
