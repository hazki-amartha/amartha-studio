// =============================================================================
// ScreenSidebar — the page explorer shown while a prototype is open. The live
// screen's states (if it declares any) nest under its row.
// Inside a project the common navigation is between its screens, not between
// projects, so the sidebar lists the project's screens instead of the gallery.
//   • Prototype route: the runtime publishes the screen bridge — rows highlight
//     the live screen and clicking jumps the device there, no page reload.
//   • Flow route (no runtime mounted): rows deep-link to /p/<slug>?screen=<id>.
// "All projects" returns to the gallery explorer.
// While a prototype runs, Layers and Notes sit beside Screens as tabs — the
// prototype portals them into the slots this renders (see sidebarSlots.ts).
// =============================================================================

'use client'

import Link from 'next/link'
import { Fragment, useCallback, useState, useSyncExternalStore } from 'react'
import { getScreenBridge, screenBridgeJump, subscribeScreenBridge } from '@/platform/runtime/bridge'
import { ChevronLeftIcon, LayersIcon, NotesIcon, ScreensIcon } from './icons'
import {
  getSidebarSlots,
  getSidebarSlotsServerSnapshot,
  setSidebarSlot,
  subscribeSidebarSlots,
} from './sidebarSlots'
import { PanelTabs } from './SidePanel'
import type { ProjectIndexEntry, ScreenIndexEntry } from './loadProjectIndex'

const ROW_ACTIVE =
  'truncate rounded-8 bg-primary-50 px-12 py-8 text-left text-14 font-bold text-link dark:border dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-50'
const ROW_IDLE =
  'truncate rounded-8 px-12 py-8 text-left text-14 text-default hover:bg-neutral-50 dark:border dark:border-transparent dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50'

type Tab = 'screens' | 'layers' | 'notes'

const TABS: { id: Tab; label: string; icon: typeof ScreensIcon }[] = [
  { id: 'screens', label: 'Screens', icon: ScreensIcon },
  { id: 'layers', label: 'Layers', icon: LayersIcon },
  { id: 'notes', label: 'Notes', icon: NotesIcon },
]

function getServerSnapshot() {
  return null
}

export function ScreenSidebar({ project }: { project: ProjectIndexEntry }) {
  const bridge = useSyncExternalStore(subscribeScreenBridge, getScreenBridge, getServerSnapshot)
  const live = bridge?.slug === project.slug
  const activeId = live ? bridge.current : null

  const { live: running } = useSyncExternalStore(
    subscribeSidebarSlots,
    getSidebarSlots,
    getSidebarSlotsServerSnapshot,
  )
  const [chosen, setTab] = useState<Tab>('screens')
  const tab: Tab = running ? chosen : 'screens'
  const layersRef = useCallback((el: HTMLElement | null) => setSidebarSlot('layers', el), [])
  const notesRef = useCallback((el: HTMLElement | null) => setSidebarSlot('notes', el), [])

  return (
    <div className="flex flex-col">
      {/* Mirrors the Edit panel's header opposite — a 48px title row, then the
          tabs — so the two cards' titles and tabs line up across the canvas.
          Sticky, like that one, so the way out survives a long layer tree. */}
      <div className="sticky top-0 z-10 flex flex-col bg-neutral-white pb-8 dark:bg-ink-900">
        <div className="flex h-48 items-center gap-4">
          <Link
            href="/"
            aria-label="All projects"
            title="All projects"
            className="flex size-32 flex-none items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
          >
            <ChevronLeftIcon className="size-16" />
          </Link>
          <span className="truncate text-14 font-bold text-default dark:text-neutral-50">{project.name}</span>
        </div>
        {running ? <PanelTabs tabs={TABS} active={tab} onChange={setTab} /> : null}
      </div>

      <div className="flex flex-col gap-16">
        {/* Mounted whenever the sidebar is, so the prototype always has somewhere
          to draw; hidden, not removed, while another tab is showing. */}
        <div ref={layersRef} className={tab === 'layers' ? 'flex flex-col px-4' : 'hidden'} />
        <div ref={notesRef} className={tab === 'notes' ? 'flex flex-col gap-8 px-12' : 'hidden'} />

        {tab !== 'screens' ? null : (
          <>
            <ScreenList
              label="Screens"
              screens={project.screens}
              slug={project.slug}
              activeId={activeId}
              live={live}
            />
            {/* Inherited screens sit in their own group so the feature's own pages
              stay readable at the top; they jump the device just the same. */}
            {project.inherited && project.inherited.screens.length > 0 ? (
              <ScreenList
                label={`From ${project.inherited.from}`}
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
  screens,
  slug,
  activeId,
  live,
}: {
  label: string
  screens: ScreenIndexEntry[]
  slug: string
  activeId: string | null
  live: boolean
}) {
  return (
    <nav aria-label={label} className="flex flex-col gap-2">
      <p className="truncate px-12 py-4 text-10 font-bold uppercase text-caption dark:text-neutral-400">
        {label}
      </p>
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
              {screen.title}
            </button>
            {isActive ? <StateList /> : null}
          </Fragment>
        ) : (
          <Link key={screen.id} href={`/p/${slug}?screen=${screen.id}`} className={className}>
            {screen.title}
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
      className="ml-12 flex flex-col gap-2 border-l border-default pl-8 dark:border-ink-700"
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
            {state.label}
          </button>
        )
      })}
    </div>
  )
}
