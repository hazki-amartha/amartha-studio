import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Metadata } from 'next'
import { Manifest, type Guidelines } from './Manifest'

export const metadata: Metadata = {
  title: 'System — Prototype Studio',
  description: 'Browsable reference for the FunDS Lite design system: tokens and components.',
}

// Guideline markdown files surfaced inline / collapsibly on the manifest.
// Keys match the lookups in Manifest.tsx.
const GUIDELINE_FILES: Record<string, string> = {
  GUIDELINES: 'GUIDELINES.md',
  'foundations/colors': 'foundations/colors.md',
  'foundations/typography': 'foundations/typography.md',
  'foundations/spacing': 'foundations/spacing.md',
  'components/overview': 'components/overview.md',
  'components/button': 'components/button.md',
  'components/input': 'components/input.md',
  'components/badge': 'components/badge.md',
  'components/card': 'components/card.md',
  'components/list-row': 'components/list-row.md',
  'components/toggle': 'components/toggle.md',
  'components/selectable-card': 'components/selectable-card.md',
  'components/modal': 'components/modal.md',
  'components/bottom-sheet': 'components/bottom-sheet.md',
  'components/navigation-bar': 'components/navigation-bar.md',
  'components/navigation-header': 'components/navigation-header.md',
}

async function loadGuidelines(): Promise<Guidelines> {
  const root = path.join(process.cwd(), 'design-system', 'guidelines')
  const entries = await Promise.all(
    Object.entries(GUIDELINE_FILES).map(async ([key, file]) => {
      try {
        const source = await readFile(path.join(root, file), 'utf8')
        return [key, source] as const
      } catch {
        return [key, ''] as const
      }
    }),
  )
  return Object.fromEntries(entries)
}

export default async function SystemPage() {
  const guidelines = await loadGuidelines()
  return <Manifest guidelines={guidelines} />
}
