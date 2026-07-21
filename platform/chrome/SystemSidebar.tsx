// =============================================================================
// SystemSidebar — section nav for the FunDS rail section (the /system manifest).
// Owns the scroll-spy that used to live inside Manifest: it observes the section
// ids rendered by the page in the same document and highlights the active one.
// =============================================================================

'use client'

import { useEffect, useState } from 'react'
import { NAV_SECTIONS } from '@/design-system/tokens'

type Section = (typeof NAV_SECTIONS)[number]

const SECTION_LABEL: Record<Section, string> = {
  overview: 'Overview',
  colors: 'Colors',
  typography: 'Typography',
  spacing: 'Spacing & Layout',
  buttons: 'Button',
  inputs: 'Input',
  badges: 'Badge',
  cards: 'Card & List Row',
  toggles: 'Toggle',
  'selectable-cards': 'Selectable Card',
  modals: 'Modal',
  'bottom-sheets': 'Bottom Sheet',
  'navigation-bars': 'Navigation',
  prompts: 'Prompts',
  llms: 'For Agents',
}

const GROUPS: { label: string; sections: Section[] }[] = [
  { label: 'Foundations', sections: ['overview', 'colors', 'typography', 'spacing'] },
  {
    label: 'Components',
    sections: [
      'buttons',
      'inputs',
      'badges',
      'cards',
      'toggles',
      'selectable-cards',
      'modals',
      'bottom-sheets',
      'navigation-bars',
    ],
  },
  { label: 'Reference', sections: ['prompts', 'llms'] },
]

export function SystemSidebar() {
  const [active, setActive] = useState<string>(NAV_SECTIONS[0])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 },
    )
    NAV_SECTIONS.forEach((slug) => {
      const el = document.getElementById(slug)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex flex-col gap-16">
      <p className="px-12 text-16 font-bold text-default dark:text-neutral-50">FunDS Lite</p>
      {GROUPS.map((group) => (
        <nav key={group.label} aria-label={group.label} className="flex flex-col gap-2">
          <p className="px-12 py-4 text-10 font-bold uppercase text-caption dark:text-neutral-400">{group.label}</p>
          {group.sections.map((slug) => {
            const isActive = active === slug
            return (
              <a
                key={slug}
                href={`#${slug}`}
                aria-current={isActive ? 'true' : undefined}
                className={
                  isActive
                    ? 'rounded-8 bg-primary-50 px-12 py-8 text-14 font-bold text-link dark:border dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-50'
                    : 'rounded-8 px-12 py-8 text-14 text-default hover:bg-neutral-50 dark:border dark:border-transparent dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50'
                }
              >
                {SECTION_LABEL[slug]}
              </a>
            )
          })}
        </nav>
      ))}
    </div>
  )
}
