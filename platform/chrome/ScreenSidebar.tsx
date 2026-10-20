// =============================================================================
// ScreenSidebar — the sidebar while a project is open: its screens, and while
// it runs its Layers and Notes. The live screen's states (if it declares any)
// nest under its row.
// Inside a project the common navigation is between its screens, not between
// projects, so the sidebar lists the project's screens instead of the studio's
// sections.
//   • Prototype route: the runtime publishes the screen bridge — rows highlight
//     the live screen and clicking jumps the device there, no page reload.
//   • Flow route (no runtime mounted): rows deep-link to /p/<slug>?screen=<id>.
// One header row: back to the gallery, the project name, then the branch
// button (the project and its branches) at the right end, where it stays
// however long the name is. Share moved to the top bar, beside Comment.
// Layers and Notes sit beside Screens as tabs while a prototype runs — the
// prototype portals them into the slots this renders (see shellSlots.ts).
// =============================================================================

'use client'

import Link from 'next/link'
import { Fragment, useCallback, useState, useSyncExternalStore } from 'react'
import { getScreenBridge, screenBridgeJump, subscribeScreenBridge } from '@/platform/runtime/bridge'
import { ProjectSwitcher } from '@/platform/dbProjects/DraftControls'
import { ChevronLeftIcon } from './icons'
import {
  getShellSlots,
  getShellSlotsServerSnapshot,
  setShellSlot,
  setSidebarTab,
  subscribeShellSlots,
  type SidebarTab,
} from './shellSlots'
import { PanelTabs } from './SidePanel'
import { GROUP_LABEL, ICON_BUTTON, ROW_ACTIVE, ROW_IDLE } from './sidebarRows'
import type { ProjectIndexEntry, ScreenIndexEntry } from './loadProjectIndex'

const TABS: { id: SidebarTab; label: string }[] = [
  { id: 'screens', label: 'Screens' },
  { id: 'layers', label: 'Layers' },
  { id: 'notes', label: 'Notes' },
]

function getServerSnapshot() {
  return null
}

export function ScreenSidebar({
  project,
  guest,
}: {
  project: ProjectIndexEntry
  /** A share-link guest — or a viewer not yet known not to be one — only
   *  views: no way out to the gallery, no branches, nothing to share. */
  guest: boolean
}) {
  const bridge = useSyncExternalStore(subscribeScreenBridge, getScreenBridge, getServerSnapshot)
  const live = bridge?.slug === project.slug
  const activeId = live ? bridge.current : null

  const { live: running, tab: chosen } = useSyncExternalStore(
    subscribeShellSlots,
    getShellSlots,
    getShellSlotsServerSnapshot,
  )
  const tab: SidebarTab = running ? chosen : 'screens'
  const layersRef = useCallback((el: HTMLElement | null) => setShellSlot('layers', el), [])
  const notesRef = useCallback((el: HTMLElement | null) => setShellSlot('notes', el), [])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-48 flex-none items-center gap-4 px-8">
        {guest ? null : (
          <Link href="/" aria-label="All projects" title="All projects" className={ICON_BUTTON}>
            <ChevronLeftIcon className="size-16" />
          </Link>
        )}
        {guest ? (
          <span className="min-w-0 flex-1 truncate px-8 text-14 font-bold text-default dark:text-neutral-50">
            {project.name}
          </span>
        ) : (
          <ProjectSwitcher slug={project.slug} name={project.name} />
        )}
      </div>
      {running ? <PanelTabs tabs={TABS} active={tab} onChange={setSidebarTab} /> : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-12 pb-12 pt-8">
        {/* Mounted whenever the sidebar is, so the prototype always has somewhere
          to draw; hidden, not removed, while another tab is showing. */}
        <div ref={layersRef} className={tab === 'layers' ? 'flex flex-col' : 'hidden'} />
        <div ref={notesRef} className={tab === 'notes' ? 'flex flex-col gap-8 px-8 pt-4' : 'hidden'} />

        {tab !== 'screens' ? null : (
          <>
            <ScreenList label="Screens" screens={project.screens} slug={project.slug} activeId={activeId} live={live} />
            {/* Inherited screens sit in their own group so the feature's own pages
              stay readable at the top; they jump the device just the same. */}
            {project.inherited && project.inherited.screens.length > 0 ? (
              <ScreenList
                label={`From ${project.inherited.from} · ${project.inherited.screens.length}`}
                showLabel
                screens={project.inherited.screens}
                slug={project.slug}
                activeId={activeId}
                live={live}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

function ScreenList({
  label,
  showLabel,
  screens,
  slug,
  activeId,
  live,
}: {
  label: string
  /** The project's own screens go unlabelled; an inherited group says where
   *  it comes from. */
  showLabel?: boolean
  screens: ScreenIndexEntry[]
  slug: string
  activeId: string | null
  live: boolean
}) {
  return (
    <nav aria-label={label} className="flex flex-col gap-2">
      {showLabel ? <p className={GROUP_LABEL}>{label}</p> : null}
      {screens.map((screen) => {
        const isActive = screen.id === activeId
        const className = isActive ? ROW_ACTIVE : ROW_IDLE
        return live ? (
          <Fragment key={screen.id}>
            <button
              type="button"
              onClick={() => screenBridgeJump(screen.id)}
              aria-current={isActive ? 'page' : undefined}
              className={className}
            >
              <span className="truncate">{screen.title}</span>
            </button>
            {isActive ? <StateList /> : null}
          </Fragment>
        ) : (
          <Link key={screen.id} href={`/p/${slug}?screen=${screen.id}`} className={className}>
            <span className="truncate">{screen.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * The live screen's states, nested under its row — a presentation aid:
 * during a walkthrough the state being discussed is often six taps of setup
 * away, and some states cannot be tapped to at all. One click puts the screen
 * in the condition, without leaving it.
 *
 * The highlight is what was last APPLIED here, not what the project is
 * actually in — the platform cannot know that, and pretending otherwise would
 * mean reading project internals. It resets with the screen, since the list
 * only mounts under the active row.
 */
function StateList() {
  const bridge = useSyncExternalStore(subscribeScreenBridge, getScreenBridge, getServerSnapshot)
  const [applied, setApplied] = useState<string | null>(null)
  const states = bridge?.states ?? []
  if (states.length === 0) return null

  return (
    <div
      role="group"
      aria-label="States"
      className="ml-12 flex flex-col gap-2 border-l border-default pl-8 dark:border-ink-800"
    >
      {states.map((state) => {
        const on = applied === state.id
        return (
          <button
            key={state.id}
            type="button"
            onClick={() => {
              state.apply()
              setApplied(state.id)
            }}
            title={state.description}
            className={on ? ROW_ACTIVE : ROW_IDLE}
          >
            <span className="truncate">{state.label}</span>
          </button>
        )
      })}
    </div>
  )
}
