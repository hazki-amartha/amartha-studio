// =============================================================================
// ScreenSidebar — the page explorer shown while a prototype is open.
// Inside a project the common navigation is between its screens, not between
// projects, so the sidebar lists the project's screens instead of the gallery.
//   • Prototype route: the runtime publishes the screen bridge — rows highlight
//     the live screen and clicking jumps the device there, no page reload.
//   • Flow route (no runtime mounted): rows deep-link to /p/<slug>?screen=<id>.
// "All projects" returns to the gallery explorer.
// =============================================================================

'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import {
  getScreenBridge,
  screenBridgeJump,
  subscribeScreenBridge,
} from '@/platform/runtime/bridge'
import { ChevronLeftIcon } from './icons'
import type { ProjectIndexEntry, ScreenIndexEntry } from './loadProjectIndex'

const ROW_ACTIVE =
  'truncate rounded-8 bg-primary-50 px-12 py-8 text-left text-14 font-bold text-link dark:border dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-50'
const ROW_IDLE =
  'truncate rounded-8 px-12 py-8 text-left text-14 text-default hover:bg-neutral-50 dark:border dark:border-transparent dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50'

function getServerSnapshot() {
  return null
}

export function ScreenSidebar({ project }: { project: ProjectIndexEntry }) {
  const bridge = useSyncExternalStore(subscribeScreenBridge, getScreenBridge, getServerSnapshot)
  const live = bridge?.slug === project.slug
  const activeId = live ? bridge.current : null

  return (
    <div className="flex flex-col gap-16">
      <Link
        href="/"
        className="flex items-center gap-4 px-12 text-12 text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50"
      >
        <ChevronLeftIcon className="size-12 shrink-0" />
        All projects
      </Link>

      <p className="truncate px-12 text-16 font-bold text-default dark:text-neutral-50">{project.name}</p>

      <ScreenList label="Screens" screens={project.screens} slug={project.slug} activeId={activeId} live={live} />
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
          <button
            key={screen.id}
            type="button"
            onClick={() => screenBridgeJump(screen.id)}
            aria-current={isActive ? 'page' : undefined}
            className={className}
          >
            {screen.title}
          </button>
        ) : (
          <Link key={screen.id} href={`/p/${slug}?screen=${screen.id}`} className={className}>
            {screen.title}
          </Link>
        )
      })}
    </nav>
  )
}
