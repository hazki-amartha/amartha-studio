'use client'

// WS-0 provides the FlowApi context + useFlow hook so project screens compile.
// WS-A owns this directory and builds PrototypeProvider (screen stack,
// transitions, deep-linking) on top of this context.

import { createContext, useContext } from 'react'
import type { FlowApi } from '@/platform/types'

export const FlowContext = createContext<FlowApi | null>(null)

export function useFlow(): FlowApi {
  const ctx = useContext(FlowContext)
  if (!ctx) {
    throw new Error(
      'useFlow() must be called from a screen rendered inside the platform runtime (PrototypeProvider).',
    )
  }
  return ctx
}
