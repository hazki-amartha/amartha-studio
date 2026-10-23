'use client'

// =============================================================================
// Comment pins on a flow thumbnail — the prototype's own CommentLayer, mounted
// in the thumbnail's device-sized box (ScreenThumb), told which state the
// canvas shows so a pin from another state can say so and bring it back.
// =============================================================================

import { useSyncExternalStore } from 'react'
import { CommentLayer } from '@/platform/comments/CommentLayer'
import type { CommentState } from '@/platform/comments/protocol'
import { useComments } from '@/platform/comments/store'
import { applyFlowState, getFlowFocus, subscribeFlowFocus } from './focus'

export function FlowComments() {
  const { mode } = useComments()
  const focus = useSyncExternalStore(subscribeFlowFocus, getFlowFocus, () => null)
  if (!mode) return null
  const applied = focus?.applied ? { screen: focus.applied.screen, id: focus.applied.state } : null
  const bring = (s: CommentState) => {
    const found = focus?.states.get(s.screen)?.find((st) => st.id === s.id)
    if (found) applyFlowState(s.screen, found)
  }
  return <CommentLayer applied={applied} onApplyState={bring} />
}
