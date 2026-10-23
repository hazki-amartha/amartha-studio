// =============================================================================
// The selection as chat context: Inspect's copyForAgent text for the element,
// with the blank for the change removed because the chat message IS the change.
// The label is what the chip in the composer says. In the flow view there are
// no elements to click, only screens — a whole screen is the selection there.
// =============================================================================

import { diskPath } from '@/platform/dbProjects/active'
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

/** A whole screen, selected on the flow canvas. */
export function attachmentForScreen(slug: string, screen: { id: string; title: string }): ChatAttachment {
  return {
    label: `Screen “${screen.title}”`,
    context: [
      `Amartha Studio · project \`${slug}\` · screen \`${screen.id}\``,
      `File: ${diskPath(`projects/${slug}/screens/${screen.id}.tsx`)} (or a helper it imports from lib/)`,
      '',
      `Selected in the flow view: the whole screen "${screen.title}".`,
      '',
      'Rules: token-locked Tailwind only, no arbitrary values (CLAUDE.md §2).',
    ].join('\n'),
  }
}
