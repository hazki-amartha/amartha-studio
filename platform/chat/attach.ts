// =============================================================================
// Turning a picked element into a chat attachment — shared by the chat's own
// pick button and Inspect's "Ask chat about this", so both hand the agent the
// same thing: Inspect's copyForAgent text, with the blank for the change removed
// because the chat message IS the change.
// =============================================================================

import { copyForAgent } from '@/platform/inspect/copyForAgent'
import { resolveTarget, type InspectTarget } from '@/platform/inspect/resolve'
import { attachToChat, type ChatAttachment } from '@/platform/runtime/chatBridge'

export function attachmentFor(target: InspectTarget, slug: string, screenId: string): ChatAttachment {
  const name = target.component ?? `<${target.tag}>`
  const text = target.text.length > 24 ? `${target.text.slice(0, 24)}…` : target.text
  return {
    label: text ? `${name} “${text}”` : name,
    context: copyForAgent(target, slug, screenId).replace(
      /\nChange: <describe what you want>\n/,
      '\n',
    ),
  }
}

export function attachElement(el: Element, slug: string, screenId: string) {
  attachToChat(attachmentFor(resolveTarget(el), slug, screenId))
}
