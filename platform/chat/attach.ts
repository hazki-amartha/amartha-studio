// =============================================================================
// The selection as chat context: Inspect's copyForAgent text for the element,
// with the blank for the change removed because the chat message IS the change.
// The label is what the chip in the composer says. In the flow view there are
// no elements to click, only screens — a whole screen is the selection there.
// =============================================================================

import { diskPath } from '@/platform/dbProjects/active'
import { copyForAgent } from '@/platform/inspect/copyForAgent'
import type { InspectTarget } from '@/platform/inspect/resolve'

/**
 * What Edit knows about the selected element, beyond its box — the layer it
 * is (platform/design/layers.ts). Set by the prototype view, which has Edit
 * loaded; Chat doesn't import Edit, so the flow view's Chat stays light.
 */
type Describer = (el: Element) => { name: string; text: string; lines: string[] } | null
let describe: Describer | null = null
export function setSelectionDescriber(fn: Describer | null) {
  describe = fn
}

export interface ChatAttachment {
  /** What the chip in the composer says: "Button “Lanjut”", "<div>". */
  label: string
  /** Sent to the agent ahead of the message. */
  context: string
}

export function attachmentFor(target: InspectTarget, slug: string, screenId: string): ChatAttachment {
  const layer = describe?.(target.el) ?? null
  const name = layer?.name ?? target.component ?? `<${target.tag}>`
  const words = layer?.text ?? target.text
  const text = words.length > 24 ? `${words.slice(0, 24)}…` : words
  const context = copyForAgent(target, slug, screenId).replace(/\nChange: <describe what you want>\n/, '\n')
  const about = layer?.lines ?? []
  return {
    label: text ? `${name} “${text}”` : name,
    // What was selected comes first: the element's own lines below describe
    // its box, which for a component is the component's markup, not this use.
    context: about.length > 0 ? context.replace(/\n/, `\n${about.join('\n')}\n`) : context,
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
