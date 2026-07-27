// =============================================================================
// Inspect · the handoff string.
//
// The point of the whole feature: turn "the purple button on the card, you know
// the one" into something pasteable. It names the element precisely enough for
// an agent to grep to it and states the current values, so the ask can be a
// diff ("gap-12 → gap-16") rather than a description.
//
// The file line is hedged on purpose. Screen ids map to filenames by
// convention, but plenty of markup lives in helpers a screen imports, so
// promising an exact file would be a confident lie some of the time.
// =============================================================================

import type { InspectTarget } from './resolve'

export function copyForAgent(target: InspectTarget, slug: string, screenId: string): string {
  const lines: string[] = []

  lines.push(`Amartha Studio · project \`${slug}\` · screen \`${screenId}\``)
  lines.push(
    `File: projects/${slug}/screens/${screenId}.tsx (or a helper it imports from lib/)`,
  )
  lines.push('')

  const props = target.props.map(([k, v]) => ` ${k}="${v}"`).join('')
  const name = target.component
    ? `FunDS <${target.component}${props}>`
    : `<${target.tag}>`
  lines.push(`Element: ${name}${target.text ? ` — text: "${target.text}"` : ''}`)

  const authored = target.authored.map((a) => a.cls).join(' ')
  if (authored) lines.push(`Author classes: ${authored}`)

  const styling = target.computed
    .map((row) => `${row.label} ${row.token ?? `${row.value} (not a token)`}`)
    .join(' · ')
  if (styling) lines.push(`Styling now: ${styling}`)

  lines.push('')
  lines.push('Change: <describe what you want>')
  lines.push('')
  lines.push('Rules: token-locked Tailwind only, no arbitrary values (CLAUDE.md §2).')

  return lines.join('\n')
}
