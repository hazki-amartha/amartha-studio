// =============================================================================
// AppShell — the studio chrome: icon rail + contextual secondary sidebar +
// content region with a collapse toggle and breadcrumb top bar.
// Wraps every tool route except /unlock (which renders bare). Built only from
// FunDS tokens; the single non-token width lives in chrome.module.css.
// =============================================================================

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import {
  getInspectMode,
  getInspectServerSnapshot,
  setInspectMode,
  subscribeInspectMode,
} from '@/platform/runtime/inspectBridge'
import {
  getBareMode,
  getBareServerSnapshot,
  setBareMode,
  subscribeBareMode,
} from '@/platform/runtime/presentBridge'
import styles from './chrome.module.css'
import { HeaderStatusProvider, useHeaderStatus } from './headerStatus'
import {
  ChevronRightIcon,
  DeviceIcon,
  ExpandIcon,
  FlowIcon,
  InspectIcon,
  PanelIcon,
} from './icons'
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

/**
 * Segmented prototype/inspect/flow switch — only shown on a project route.
 *
 * Prototype and Inspect are the SAME route wearing two interaction models, so
 * Inspect is a plain button when we're already there: navigating would remount
 * PrototypeView and reset the visit stack, dumping the viewer back on the entry
 * screen — exactly wrong for a tool whose job is describing the element in
 * front of them. Coming from Flow there is no stack to protect, so it links,
 * setting the flag before the navigation so the view mounts already inspecting.
 */
function ViewToggle({ slug, isFlow }: { slug: string; isFlow: boolean }) {
  const inspect = useSyncExternalStore(
    subscribeInspectMode,
    getInspectMode,
    getInspectServerSnapshot,
  )

  const base =
    'flex items-center gap-4 rounded-full px-12 py-4 text-12 transition-colors'
  const on = `${base} bg-neutral-white font-bold text-link shadow-sm dark:border dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-50 dark:shadow-none`
  const off = `${base} text-caption hover:text-default dark:border dark:border-transparent dark:text-neutral-400 dark:hover:text-neutral-50`

  const showingPrototype = !isFlow && !inspect
  const showingInspect = !isFlow && inspect

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full bg-neutral-50 p-2 dark:bg-ink-950">
      <Link
        href={`/p/${slug}`}
        onClick={() => setInspectMode(false)}
        aria-current={showingPrototype ? 'page' : undefined}
        className={showingPrototype ? on : off}
      >
        <DeviceIcon className="size-16" />
        Prototype
      </Link>
      {isFlow ? (
        <Link
          href={`/p/${slug}`}
          onClick={() => setInspectMode(true)}
          className={off}
        >
          <InspectIcon className="size-16" />
          Inspect
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => setInspectMode(true)}
          aria-current={showingInspect ? 'page' : undefined}
          className={showingInspect ? on : off}
        >
          <InspectIcon className="size-16" />
          Inspect
        </button>
      )}
      <Link
        href={`/p/${slug}/flow`}
        onClick={() => setInspectMode(false)}
        aria-current={isFlow ? 'page' : undefined}
        className={isFlow ? on : off}
      >
        <FlowIcon className="size-16" />
        Flow
      </Link>
    </div>
  )
}

/**
 * Full screen — hands the whole browser window to the prototype.
 *
 * It sets a flag rather than navigating: the route is already right, and
 * remounting PrototypeView would reset the visit stack, dropping the viewer
 * back on the entry screen at exactly the moment they wanted to show something.
 * Same reasoning as the Inspect button beside it.
 *
 * Only on the prototype route — the flow view is a diagram, and there is
 * nothing to present bare.
 */
function FullScreenButton() {
  return (
    <button
      type="button"
      onClick={() => setBareMode(true)}
      aria-label="Full screen"
      title="Full screen"
      className="flex size-32 shrink-0 items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
    >
      <ExpandIcon className="size-20" />
    </button>
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

/**
 * The sidebar's project list, loaded here rather than handed down from the
 * root layout.
 *
 * The layout runs on every route, so importing the registry there put every
 * project — and, through the screen imports, every screen — into the module
 * graph and client chunk list of every page in the studio. Loading it from the
 * shell instead keeps the whole project graph in one on-demand chunk. The list
 * fills in just after hydration; the sidebar starts empty for that beat.
 */
function useProjectIndex(): ProjectIndexEntry[] {
  const [projects, setProjects] = useState<ProjectIndexEntry[]>([])

  useEffect(() => {
    let alive = true
    import('./loadProjectIndex')
      .then((m) => m.loadProjectIndex())
      .then((list) => {
        if (alive) setProjects(list)
      })
    return () => {
      alive = false
    }
  }, [])

  return projects
}

export function AppShell({ children }: { children: ReactNode }) {
  const projects = useProjectIndex()

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
  const bare = useSyncExternalStore(subscribeBareMode, getBareMode, getBareServerSnapshot)

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

  // Bare presentation — the prototype gets the window and the shell's own
  // chrome steps out of the way.
  //
  // This HIDES the chrome rather than returning a different tree, and that is
  // load-bearing: `children` is the running prototype, so any change to its
  // position in the tree unmounts it — which fired PrototypeView's cleanup, and
  // that cleanup turns bare mode back off. Full screen switched itself off the
  // instant it switched on. Keeping one tree keeps the visit stack too, which
  // was the whole reason the toggle sets a flag instead of navigating.
  const bareProto = isProto && bare

  // Inside a project the sidebar becomes its page explorer; an unknown slug
  // (the 404 route) falls back to the project list.
  const currentProject = currentSlug
    ? (projects.find((p) => p.slug === currentSlug) ?? null)
    : null

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-ink-950">
      <NavRail active={active} className={bareProto ? 'hidden' : 'hidden md:flex'} />

      {collapsed || bareProto ? null : (
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
          className={`${bareProto ? 'hidden' : isProto ? 'hidden md:flex' : 'flex'} h-48 shrink-0 items-center gap-12 border-b border-default bg-neutral-white px-16 dark:border-ink-700 dark:bg-ink-900`}
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
            {currentSlug && !isFlow ? <FullScreenButton /> : null}
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
