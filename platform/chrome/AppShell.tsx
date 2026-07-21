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
import { HeaderStatusProvider, useHeaderStatus } from './headerStatus'
import { ChevronRightIcon, DeviceIcon, FlowIcon, PanelIcon } from './icons'
import { MobileTopNav } from './MobileTopNav'
import { NavRail, type RailSection } from './NavRail'
import { ScreenSidebar } from './ScreenSidebar'
import { StudioSidebar } from './StudioSidebar'
import { TripleTapExit } from './TripleTapExit'
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
  isFlow: boolean
  crumbs: Crumb[]
}

function resolveRoute(pathname: string, projects: ProjectIndexEntry[]): RouteInfo {
  const isFunds = pathname === '/system' || pathname.startsWith('/system/')
  if (isFunds) {
    return {
      active: 'funds',
      currentSlug: null,
      isFlow: false,
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
    return { active: 'studio', currentSlug: slug, isFlow, crumbs }
  }

  return {
    active: 'studio',
    currentSlug: null,
    isFlow: false,
    crumbs: [{ label: 'Studio', href: '/' }, { label: 'Gallery' }],
  }
}

/** Segmented prototype/flow switch — only shown on a project route. */
function ViewToggle({ slug, isFlow }: { slug: string; isFlow: boolean }) {
  const base =
    'flex items-center gap-4 rounded-full px-12 py-4 text-12 transition-colors'
  const on = `${base} bg-neutral-white font-bold text-link shadow-sm dark:border dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-50 dark:shadow-none`
  const off = `${base} text-caption hover:text-default dark:border dark:border-transparent dark:text-neutral-400 dark:hover:text-neutral-50`

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full bg-neutral-50 p-2 dark:bg-ink-950">
      <Link
        href={`/p/${slug}`}
        aria-current={isFlow ? undefined : 'page'}
        className={isFlow ? off : on}
      >
        <DeviceIcon className="size-16" />
        Prototype
      </Link>
      <Link
        href={`/p/${slug}/flow`}
        aria-current={isFlow ? 'page' : undefined}
        className={isFlow ? on : off}
      >
        <FlowIcon className="size-16" />
        Flow
      </Link>
    </div>
  )
}

function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-8">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-8">
            {i > 0 ? <ChevronRightIcon className="size-12 shrink-0 text-placeholder dark:text-neutral-600" /> : null}
            {crumb.href && !isLast ? (
              <Link href={crumb.href} className="truncate text-14 text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50">
                {crumb.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? 'truncate text-14 font-bold text-default dark:text-neutral-50'
                    : 'truncate text-14 text-caption dark:text-neutral-400'
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

/** Route-published extras (zoom, badges) rendered into the top bar. */
function HeaderStatusView() {
  const status = useHeaderStatus()
  if (!status) return null
  return (
    <>
      {status.badge ? (
        <span className="rounded-full bg-neutral-50 px-8 py-4 text-10 uppercase text-caption dark:bg-ink-800 dark:text-neutral-400">
          {status.badge}
        </span>
      ) : null}
      {status.zoom != null ? (
        <span className="text-12 text-caption dark:text-neutral-400">{Math.round(status.zoom * 100)}%</span>
      ) : null}
    </>
  )
}

export function AppShell({
  projects,
  children,
}: {
  projects: ProjectIndexEntry[]
  children: ReactNode
}) {
  return (
    <HeaderStatusProvider>
      <AppShellInner projects={projects}>{children}</AppShellInner>
    </HeaderStatusProvider>
  )
}

function AppShellInner({
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

  const { active, currentSlug, isFlow, crumbs } = resolveRoute(pathname, projects)

  // Below md the rail and sidebar never render: prototype routes go fullscreen
  // (TripleTapExit is the way back), every other route gets MobileTopNav.
  const isProto = currentSlug != null
  // Inside a project the sidebar becomes its page explorer; an unknown slug
  // (the 404 route) falls back to the project list.
  const currentProject = currentSlug
    ? (projects.find((p) => p.slug === currentSlug) ?? null)
    : null

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-ink-950">
      <NavRail active={active} className="hidden md:flex" />

      {collapsed ? null : (
        <aside
          className={`${styles.secondary} hidden shrink-0 overflow-y-auto border-r border-default bg-neutral-white px-8 py-16 dark:border-ink-700 dark:bg-ink-900 md:block`}
        >
          {active === 'funds' ? (
            <SystemSidebar />
          ) : currentProject ? (
            <ScreenSidebar project={currentProject} />
          ) : (
            <StudioSidebar projects={projects} currentSlug={currentSlug} />
          )}
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {isProto ? null : <MobileTopNav active={active} />}

        <header
          className={`${isProto ? 'hidden md:flex' : 'flex'} h-48 shrink-0 items-center gap-12 border-b border-default bg-neutral-white px-16 dark:border-ink-700 dark:bg-ink-900`}
        >
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
            aria-pressed={!collapsed}
            className="hidden size-32 items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50 md:flex"
          >
            <PanelIcon className="size-20" />
          </button>
          <span aria-hidden className="hidden h-20 w-px bg-neutral-200 dark:bg-ink-700 md:block" />
          <Breadcrumb crumbs={crumbs} />
          <div className="ml-auto flex shrink-0 items-center gap-12">
            <HeaderStatusView />
            {currentSlug ? <ViewToggle slug={currentSlug} isFlow={isFlow} /> : null}
          </div>
        </header>

        {isProto ? (
          <TripleTapExit className="min-h-0 flex-1 touch-manipulation overflow-y-auto">
            {children}
          </TripleTapExit>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        )}
      </div>
    </div>
  )
}
