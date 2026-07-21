// =============================================================================
// PageHeader — per-route title block for the content region.
// Title + optional subtitle on the left, actions slot on the right.
// Token-locked; no arbitrary values.
// =============================================================================

import type { ReactNode } from 'react'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-24 font-bold text-default dark:text-neutral-50">{title}</h1>
        {subtitle ? <p className="text-14 text-caption dark:text-neutral-400">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-8">{actions}</div> : null}
    </header>
  )
}
