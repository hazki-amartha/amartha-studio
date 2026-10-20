// =============================================================================
// SystemSidebar — FunDS's own pages, under the sidebar's section switcher
// while the /system manifest is open. Owns the scroll-spy that used to live
// inside Manifest: it observes the section ids rendered by the page in the
// same document and highlights the active one.
// =============================================================================

'use client'

import { useEffect, useState } from 'react'
import { NAV_SECTIONS } from '@/design-system/tokens'
import { GROUP_LABEL, ROW_ACTIVE, ROW_IDLE } from './sidebarRows'

type Section = (typeof NAV_SECTIONS)[number]

const SECTION_LABEL: Record<Section, string> = {
  overview: 'Overview',
  colors: 'Colors',
  typography: 'Typography',
  spacing: 'Spacing & Layout',
  icons: 'Icons',
  buttons: 'Button',
  inputs: 'Input',
  badges: 'Badge',
  cards: 'Card & List Row',
  toggles: 'Toggle',
  'selectable-cards': 'Selectable Card',
  'offer-cards': 'Offer Card',
  modals: 'Modal',
  'bottom-sheets': 'Bottom Sheet',
  'navigation-bars': 'Navigation Bar',
  'navigation-headers': 'Navigation Header',
  prompts: 'Prompts',
  llms: 'For Agents',
}

const GROUPS: { label: string; sections: Section[] }[] = [
  { label: 'Foundations', sections: ['overview', 'colors', 'typography', 'spacing', 'icons'] },
  {
    label: 'Components',
    sections: [
      'buttons',
      'inputs',
      'badges',
      'cards',
      'toggles',
      'selectable-cards',
      'offer-cards',
      'modals',
      'bottom-sheets',
      'navigation-bars',
      'navigation-headers',
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
    <div className="flex flex-col">
      {GROUPS.map((group) => (
        <nav key={group.label} aria-label={group.label} className="flex flex-col gap-2">
          <p className={GROUP_LABEL}>{group.label}</p>
          {group.sections.map((slug) => {
            const isActive = active === slug
            return (
              <a
                key={slug}
                href={`#${slug}`}
                aria-current={isActive ? 'true' : undefined}
                className={isActive ? ROW_ACTIVE : ROW_IDLE}
              >
                <span className="truncate">{SECTION_LABEL[slug]}</span>
              </a>
            )
          })}
        </nav>
      ))}
    </div>
  )
}
