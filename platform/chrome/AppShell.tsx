// =============================================================================
// AppShell — the studio chrome: icon rail + contextual secondary sidebar +
// content region with a collapse toggle and breadcrumb top bar.
// Wraps every tool route except /unlock (which renders bare). Built only from
// FunDS tokens; the single non-token width lives in chrome.module.css.
// =============================================================================

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import styles from './chrome.module.css'
import { ChevronRightIcon, PanelIcon } from './icons'
import { NavRail, type RailSection } from './NavRail'
import { StudioSidebar } from './StudioSidebar'
import { SystemSidebar } from './SystemSidebar'
import type { ProjectIndexEntry } from './loadProjectIndex'

const STORAGE_KEY = 'db.chrome.sidebarCollapsed'

interface Crumb {
  label: string
  href?: string
}

interface RouteInfo {
  active: RailSection
  currentSlug: string | null
  crumbs: Crumb[]
}

function resolveRoute(pathname: string, projects: ProjectIndexEntry[]): RouteInfo {
  const isFunds = pathname === '/system' || pathname.startsWith('/system/')
  if (isFunds) {
    return {
      active: 'funds',
      currentSlug: null,
      crumbs: [{ label: 'FunDS', href: '/system' }, { label: 'System' }],
    }
  }

  const proto = pathname.match(/^\/p\/([^/]+)(\/flow)?/)
  if (proto) {
    const slug = proto[1]
    const isFlow = Boolean(proto[2])
    const name = projects.find((p) => p.slug === slug)?.name ?? slug
    const crumbs: Crumb[] = [{ label: 'Studio', href: '/' }]
    crumbs.push(isFlow ? { label: name, href: `/p/${slug}` } : { label: name })
    if (isFlow) crumbs.push({ label: 'Flow' })
    return { active: 'studio', currentSlug: slug, crumbs }
  }

  return {
    active: 'studio',
    currentSlug: null,
    crumbs: [{ label: 'Studio', href: '/' }, { label: 'Gallery' }],
  }
}

function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-8">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-8">
            {i > 0 ? <ChevronRightIcon className="size-12 shrink-0 text-placeholder" /> : null}
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="truncate text-14 text-caption hover:text-default">
                {crumb.label}
              </Link>
            ) : (
              <span
                className={
                  isLast ? 'truncate text-14 font-bold text-default' : 'truncate text-14 text-caption'
                }
              >
                {crumb.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}

export function AppShell({
  projects,
  children,
}: {
  projects: ProjectIndexEntry[]
  children: ReactNode
}) {
  const pathname = usePathname() ?? '/'
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1')
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }, [])

  // Unlock gate renders without any chrome.
  if (pathname.startsWith('/unlock')) return <>{children}</>

  const { active, currentSlug, crumbs } = resolveRoute(pathname, projects)

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <NavRail active={active} />

      {collapsed ? null : (
        <aside
          className={`${styles.secondary} shrink-0 overflow-y-auto border-r border-default bg-neutral-white px-8 py-16`}
        >
          {active === 'funds' ? (
            <SystemSidebar />
          ) : (
            <StudioSidebar projects={projects} currentSlug={currentSlug} />
          )}
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-48 shrink-0 items-center gap-12 border-b border-default bg-neutral-white px-16">
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
            aria-pressed={!collapsed}
            className="flex size-32 items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default"
          >
            <PanelIcon className="size-20" />
          </button>
          <span aria-hidden className="h-20 w-px bg-neutral-200" />
          <Breadcrumb crumbs={crumbs} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
