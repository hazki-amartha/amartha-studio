// =============================================================================
// The selection as chat context: Inspect's copyForAgent text for the element,
// with the blank for the change removed because the chat message IS the change.
// The label is what the chip in the composer says.
// =============================================================================

import { copyForAgent } from '@/platform/inspect/copyForAgent'
import type { InspectTarget } from '@/platform/inspect/resolve'

export interface ChatAttachment {
  /** What the chip in the composer says: "Button “Lanjut”", "<div>". */
  label: string
  /** Sent to the agent ahead of the message. */
  context: string
}

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
