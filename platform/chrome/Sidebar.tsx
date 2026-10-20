// =============================================================================
// Sidebar — the studio's left column, drawn straight on the dark frame beside
// the page card, dark in either theme (data-theme="dark" below; the theme
// toggle at its foot changes the page card, not the frame).
//
// Outside a project it is the app switcher: Projects, FunDS and Assets, with
// the open section's own pages under it, and Jump to (⌘K) above. Inside one it
// is the project's own sidebar (ScreenSidebar). Folded, it is a 56px rail of
// the same destinations as icons. The button that folds and opens it is the
// page card's (TopBar), at the left end of its top bar either way.
// =============================================================================

'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { AccountButton } from './AccountButton'
import { AssetsSidebar } from './AssetsSidebar'
import {
  AssetsIcon,
  ChevronLeftIcon,
  FundsIcon,
  LayersIcon,
  NotesIcon,
  ProjectsIcon,
  ScreensIcon,
  SearchIcon,
  StudioMark,
} from './icons'
import { ScreenSidebar } from './ScreenSidebar'
import {
  getShellSlots,
  getShellSlotsServerSnapshot,
  setSidebarTab,
  subscribeShellSlots,
  type SidebarTab,
} from './shellSlots'
import { ICON_BUTTON, RAIL_ACTIVE, RAIL_IDLE, ROW_ACTIVE, ROW_IDLE } from './sidebarRows'
import { SystemSidebar } from './SystemSidebar'
import { ThemeToggle } from './theme'
import type { ProjectIndexEntry } from './loadProjectIndex'

export type Section = 'projects' | 'funds' | 'assets'

export const SECTIONS: { section: Section; href: string; label: string; Icon: typeof ProjectsIcon }[] = [
  { section: 'projects', href: '/', label: 'Projects', Icon: ProjectsIcon },
  { section: 'funds', href: '/system', label: 'FunDS', Icon: FundsIcon },
  { section: 'assets', href: '/assets', label: 'Assets', Icon: AssetsIcon },
]

const RAIL_TABS: { id: SidebarTab; label: string; Icon: typeof ScreensIcon }[] = [
  { id: 'screens', label: 'Screens', Icon: ScreensIcon },
  { id: 'layers', label: 'Layers', Icon: LayersIcon },
  { id: 'notes', label: 'Notes', Icon: NotesIcon },
]

interface SidebarProps {
  active: Section
  /** The open project, when there is one: the sidebar becomes its own. */
  project: ProjectIndexEntry | null
  /** Opened from a share link: the project alone, no way out to the studio. */
  guest: boolean
  onJump: () => void
}

export function Sidebar({ active, project, guest, onJump }: SidebarProps) {
  return (
    <nav data-theme="dark" aria-label="Studio" className="flex w-248 flex-none flex-col pt-8">
      {project ? (
        <ScreenSidebar project={project} guest={guest} />
      ) : (
        <>
          <div className="flex h-48 flex-none items-center px-8">
            <Link
              href="/"
              className="flex h-40 min-w-0 flex-1 items-center gap-8 rounded-8 px-8 hover:bg-ink-800"
            >
              <span className="flex size-24 flex-none items-center justify-center rounded-6 bg-primary-500 text-neutral-white">
                <StudioMark className="size-16" />
              </span>
              <span className="truncate text-14 font-bold text-neutral-50">Amartha Studio</span>
            </Link>
          </div>

          <div className="flex-none px-12 pt-8">
            <button
              type="button"
              onClick={onJump}
              className="flex h-32 w-full items-center gap-8 rounded-8 border border-ink-700 bg-ink-950 px-8 text-12 text-neutral-500 hover:bg-ink-800 hover:text-neutral-50"
            >
              <SearchIcon className="size-16 flex-none" />
              <span className="flex-1 text-left">Jump to…</span>
              <kbd className="rounded-4 border border-ink-700 px-4 font-sans text-10">⌘K</kbd>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-12 pb-12">
            <div className="flex flex-col gap-2 pt-16">
              {SECTIONS.map(({ section, href, label, Icon }) => (
                <Link
                  key={section}
                  href={href}
                  aria-current={active === section ? 'page' : undefined}
                  className={active === section ? ROW_ACTIVE : ROW_IDLE}
                >
                  <Icon className="size-16 flex-none" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </div>
            {active === 'funds' ? <SystemSidebar /> : active === 'assets' ? <AssetsSidebar /> : null}
          </div>
        </>
      )}

      {guest ? null : (
        <div className="flex flex-none items-center gap-8 px-12 pb-12 pt-8">
          <AccountButton row />
          <ThemeToggle className={`ml-auto ${ICON_BUTTON}`} />
        </div>
      )}
    </nav>
  )
}

/** The sidebar folded: its destinations as icons, each opening the sidebar
 *  where it would have led — a project's tab, or a section's page. */
export function SidebarRail({ active, project, guest, onJump, onExpand }: SidebarProps & { onExpand: () => void }) {
  const { live } = useSyncExternalStore(subscribeShellSlots, getShellSlots, getShellSlotsServerSnapshot)
  const tabs = live ? RAIL_TABS : RAIL_TABS.slice(0, 1)

  return (
    <nav data-theme="dark" aria-label="Studio" className="flex w-56 flex-none flex-col items-center gap-4 pb-12 pt-16">
      {guest ? null : (
        <Link
          href="/"
          aria-label="Amartha Studio home"
          className="mb-8 flex size-32 flex-none items-center justify-center rounded-8 bg-primary-500 text-neutral-white"
        >
          <StudioMark className="size-20" />
        </Link>
      )}

      {project ? (
        <>
          {guest ? null : (
            <Link href="/" aria-label="All projects" title="All projects" className={RAIL_IDLE}>
              <ChevronLeftIcon className="size-16" />
            </Link>
          )}
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSidebarTab(id)
                onExpand()
              }}
              aria-label={label}
              title={label}
              className={RAIL_IDLE}
            >
              <Icon className="size-16" />
            </button>
          ))}
        </>
      ) : (
        <>
          <button type="button" onClick={onJump} aria-label="Jump to" title="Jump to… · ⌘K" className={RAIL_IDLE}>
            <SearchIcon className="size-16" />
          </button>
          {SECTIONS.map(({ section, href, label, Icon }) => (
            <Link
              key={section}
              href={href}
              aria-label={label}
              title={label}
              aria-current={active === section ? 'page' : undefined}
              className={active === section ? RAIL_ACTIVE : RAIL_IDLE}
            >
              <Icon className="size-16" />
            </Link>
          ))}
        </>
      )}

      {guest ? null : (
        <div className="mt-auto flex flex-col items-center gap-4">
          <ThemeToggle className={RAIL_IDLE} />
          <AccountButton />
        </div>
      )}
    </nav>
  )
}
