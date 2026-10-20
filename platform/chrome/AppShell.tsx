// =============================================================================
// AppShell — the studio chrome. A dark frame holds three things side by side:
//
//   • the sidebar (Sidebar.tsx), drawn straight on the frame — the app
//     switcher outside a project, the project's own sidebar inside one, or,
//     folded, a 56px rail of icons;
//   • the page, a rounded card inset in the frame, with a 48px top bar
//     (TopBar.tsx) over whatever the route renders — its left end holds the
//     button that folds and opens the sidebar, in the same place either way.
//     The theme toggle changes the card; the frame and everything on it stay
//     dark;
//   • the panel column right of the card, on the frame, which the prototype
//     portals its Comments · Edit · Chat panel into (shellSlots.ts). Empty, it
//     takes no room.
//
// Wraps every tool route except /unlock, /auth/* and the share-link pages
// (which render bare). Below md there is no frame: the card fills the window,
// MobileTopNav carries the sections, and prototype routes go full screen.
// =============================================================================

'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  getBareMode,
  getBareServerSnapshot,
  subscribeBareMode,
} from '@/platform/runtime/presentBridge'
import { getScreenBridge, subscribeScreenBridge } from '@/platform/runtime/bridge'
import { resolveAssetPage } from './assetPages'
import { HeaderStatusProvider, useHeaderStatus } from './headerStatus'
import { ViewSwitch } from './CanvasControls'
import { JumpTo } from './JumpTo'
import { MobileTopNav } from './MobileTopNav'
import { setShellSlot } from './shellSlots'
import { isTyping } from './shortcuts'
import { Sidebar, SidebarRail, type Section } from './Sidebar'
import { Breadcrumb, TopBar, type Crumb } from './TopBar'
import { useGuestAccess, useStudioUser } from '@/platform/auth/session'
import { TripleTapExit } from './TripleTapExit'
import { getDbIndexEntry, subscribeDbIndexEntry } from '@/platform/dbProjects/active'
import type { ProjectIndexEntry } from './loadProjectIndex'

const STORAGE_KEY = 'db.chrome.sidebarCollapsed'

interface RouteInfo {
  active: Section
  currentSlug: string | null
  isFlow: boolean
  isGallery: boolean
  crumbs: Crumb[]
}

function resolveRoute(pathname: string): RouteInfo {
  const base = { currentSlug: null, isFlow: false, isGallery: false }

  if (pathname === '/system' || pathname.startsWith('/system/')) {
    return { ...base, active: 'funds', crumbs: [{ label: 'FunDS' }] }
  }

  if (pathname === '/assets' || pathname.startsWith('/assets/')) {
    return {
      ...base,
      active: 'assets',
      crumbs: [{ label: 'Assets', href: '/assets' }, { label: resolveAssetPage(pathname).label }],
    }
  }

  // /db/<slug> is the same view with its source in the database (platform/dbProjects).
  const proto = pathname.match(/^\/(?:p|db)\/([^/]+)(\/flow)?/)
  if (proto) {
    const isFlow = Boolean(proto[2])
    // The prototype's title is its live screen, filled in by the shell.
    return { active: 'projects', currentSlug: proto[1], isFlow, isGallery: false, crumbs: isFlow ? [{ label: 'Flow' }] : [] }
  }

  return { ...base, active: 'projects', isGallery: pathname === '/', crumbs: [{ label: 'Projects' }] }
}

// The gallery's business-unit folders (app/page.tsx) — a folder is a place,
// so the top bar names it: Projects › Lending.
const FOLDERS = ['Lending', 'Funding', 'Core', 'Payments']

/** Reads the folder from the query, so it sits in its own Suspense boundary:
 *  only the gallery renders it, and only it waits on the search params. */
function GalleryTitle() {
  const bu = useSearchParams()?.get('bu') ?? null
  const folder = bu && FOLDERS.includes(bu) ? bu : null
  return (
    <Breadcrumb crumbs={folder ? [{ label: 'Projects', href: '/' }, { label: folder }] : [{ label: 'Projects' }]} />
  )
}

/** Route-published extras (the flow canvas's badge) at the top bar's right. */
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

/** The running prototype's screen, for the top bar's title. */
function useScreenTitle(project: ProjectIndexEntry | null): string | null {
  const bridge = useSyncExternalStore(subscribeScreenBridge, getScreenBridge, () => null)
  if (!project || bridge?.slug !== project.slug) return null
  const all = [...project.screens, ...(project.inherited?.screens ?? [])]
  return all.find((s) => s.id === bridge.current)?.title ?? null
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
  const [jumping, setJumping] = useState(false)
  const bare = useSyncExternalStore(subscribeBareMode, getBareMode, getBareServerSnapshot)
  const dbEntry = useSyncExternalStore(subscribeDbIndexEntry, getDbIndexEntry, () => null)
  const panelRef = useCallback((el: HTMLElement | null) => setShellSlot('panel', el), [])

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

  const { active, currentSlug, isFlow, isGallery, crumbs } = resolveRoute(pathname)
  // Opened from a share link: the prototype and its screens, and no way out
  // to the rest of the studio (platform/share).
  const guest = useGuestAccess(currentSlug) !== null
  const viewerKnown = useStudioUser().loaded
  const isProto = currentSlug != null

  // A prototype keeps the studio's chrome out until it's known whether this
  // viewer is a guest — otherwise a share link flashes the way back to the
  // gallery before the guest view takes it away.
  const pendingViewer = isProto && !viewerKnown
  const studioHidden = guest || pendingViewer

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

  // Inside a project the sidebar becomes its own; an unknown slug (the 404
  // route) falls back to the app switcher. A database project's screens come
  // from the running prototype.
  const currentProject = currentSlug
    ? (dbEntry?.slug === currentSlug ? dbEntry : null) ?? projects.find((p) => p.slug === currentSlug) ?? null
    : null
  const screenTitle = useScreenTitle(isFlow ? null : currentProject)

  // A guest only ever sees the prototype they were shared, so nothing shows
  // while its screens are still loading or the viewer isn't known.
  const sidebarShown = !bareProto && !(isProto && !currentProject && studioHidden)

  // ⌘K opens Jump to; [ folds and opens the sidebar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        if (studioHidden) return
        e.preventDefault()
        setJumping((open) => !open)
        return
      }
      if (e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target) && sidebarShown) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [studioHidden, sidebarShown, toggle])

  // The unlock gate, the sign-in hand-off and share-link pages render without
  // any chrome.
  if (['/unlock', '/auth/', '/s/', '/share-ended'].some((p) => pathname.startsWith(p))) return <>{children}</>

  const sidebarProps = {
    active,
    project: currentProject,
    guest: studioHidden,
    onJump: () => setJumping(true),
  }

  const title = isGallery ? (
    <Suspense fallback={<Breadcrumb crumbs={crumbs} />}>
      <GalleryTitle />
    </Suspense>
  ) : isProto && !isFlow ? (
    screenTitle ? <Breadcrumb crumbs={[{ label: screenTitle }]} /> : null
  ) : (
    <Breadcrumb crumbs={crumbs} />
  )

  return (
    <div className="flex h-screen overflow-hidden bg-ink-900">
      {sidebarShown ? (
        <div className="hidden md:flex">
          {collapsed ? (
            <SidebarRail {...sidebarProps} onExpand={toggle} />
          ) : (
            <Sidebar {...sidebarProps} />
          )}
        </div>
      ) : null}

      <div
        className={`flex min-w-0 flex-1 flex-col overflow-hidden bg-neutral-white dark:bg-ink-950 ${
          bareProto ? '' : `md:my-8 md:mr-8 md:rounded-12 md:ring-1 md:ring-transparent md:dark:ring-neutral-white/5 ${sidebarShown ? '' : 'md:ml-8'}`
        }`}
      >
        {/* Below md, prototype routes go full screen (TripleTapExit is the way
            back); every other route gets MobileTopNav. */}
        {isProto ? null : <MobileTopNav active={active} />}

        {bareProto ? null : (
          <TopBar
            title={title}
            status={<HeaderStatusView />}
            sidebar={sidebarShown ? { folded: collapsed, onToggle: toggle } : undefined}
            className={isProto ? 'hidden md:flex' : 'flex'}
          />
        )}

        <div className="relative flex min-h-0 flex-1">
          {isProto ? (
            <TripleTapExit className="min-h-0 min-w-0 flex-1 touch-manipulation overflow-y-auto">
              {children}
            </TripleTapExit>
          ) : (
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</div>
          )}
          {/* The prototype draws its own, beside full screen; the flow view's
              canvas is the whole area, so it goes in the corner here — the
              same place, so going across and back is the same click. */}
          {currentSlug && isFlow ? (
            <ViewSwitch slug={currentSlug} isFlow className="absolute bottom-16 right-16 z-30 hidden md:flex" />
          ) : null}
        </div>
      </div>

      {/* The prototype's panel column, on the frame. Dark in either theme. */}
      <div ref={panelRef} data-theme="dark" className="hidden w-360 flex-none flex-col py-8 pr-8 md:flex md:empty:hidden" />

      {jumping ? <JumpTo projects={projects} onClose={() => setJumping(false)} /> : null}
    </div>
  )
}
