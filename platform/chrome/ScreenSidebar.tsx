// =============================================================================
// ScreenSidebar — the sidebar while a project is open: its screens, and while
// it runs its Layers and Notes. The live screen's states (if it declares any)
// nest under its row. A long project groups its screens into folding sections
// (ScreenDef.section — a feature or a flow). In a database project an editor
// arranges them right here: drag a row or a section, double-click a section to
// rename it, New section to start one — each saved into index.ts at once
// (screenArrangement.ts). The live references stay as their code has them.
// Inside a project the common navigation is between its screens, not between
// projects, so the sidebar lists the project's screens instead of the studio's
// sections.
//   • Prototype route: the runtime publishes the screen bridge — rows highlight
//     the live screen and clicking jumps the device there, no page reload. The
//     list keeps the live screen (and its states) scrolled into view, however
//     the device got there.
//   • Flow route: the canvas publishes its selection (platform/flow/focus.ts)
//     — a row selects its screen on the canvas and brings it into view, and
//     the row of the screen selected there reads as the current one; its
//     states nest under it and apply to the whole canvas. Rows the canvas
//     doesn't draw (inherited screens) deep-link to /p/<slug>?screen=<id>.
// One header row: back to the gallery, the project name, then the branch
// button (the project and its branches) at the right end, where it stays
// however long the name is. Under it, Jump to (⌘K) — this project's pages
// first, so a page in a long list is a few letters away. Share moved to the top bar, beside Comment.
// Layers and Notes sit beside Screens as tabs while a prototype runs — the
// prototype portals them into the slots this renders (see shellSlots.ts). A
// share-link guest gets Screens and Notes only.
// =============================================================================

'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type DragEvent } from 'react'
import {
  applyScreenState,
  getScreenBridge,
  screenBridgeJump,
  subscribeScreenBridge,
} from '@/platform/runtime/bridge'
import { applyFlowState, getFlowFocus, selectInFlow, subscribeFlowFocus, type FlowFocus } from '@/platform/flow/focus'
import { ProjectSwitcher } from '@/platform/dbProjects/DraftControls'
import { isActiveDbProject } from '@/platform/dbProjects/active'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon } from './icons'
import {
  getShellSlots,
  getShellSlotsServerSnapshot,
  setShellSlot,
  setSidebarTab,
  subscribeShellSlots,
  type SidebarTab,
} from './shellSlots'
import { PanelTabs } from './SidePanel'
import { GROUP_LABEL, ICON_BUTTON, NEW_SECTION, ROW_ACTIVE, ROW_IDLE, SECTION_HEADER } from './sidebarRows'
import {
  flatten,
  groupsOf,
  moveScreen,
  moveSection,
  renameSection,
  sameArrangement,
  saveArrangement,
  type Group,
} from './screenArrangement'
import type { ScreenState } from '@/platform/types'
import type { ProjectIndexEntry, ScreenIndexEntry } from './loadProjectIndex'

const TABS: { id: SidebarTab; label: string }[] = [
  { id: 'screens', label: 'Screens' },
  { id: 'layers', label: 'Layers' },
  { id: 'notes', label: 'Notes' },
]

// A share-link guest only views the prototype, so Layers — an inspector for
// building it — stays out of their sidebar.
const GUEST_TABS = TABS.filter((t) => t.id !== 'layers')

function getServerSnapshot() {
  return null
}

export function ScreenSidebar({
  project,
  guest,
  onJump,
}: {
  project: ProjectIndexEntry
  /** A share-link guest — or a viewer not yet known not to be one — only
   *  views: no way out to the gallery, no branches, nothing to share. */
  guest: boolean
  /** Opens Jump to (⌘K) — not offered to a guest, who can't leave the project. */
  onJump?: () => void
}) {
  const bridge = useSyncExternalStore(subscribeScreenBridge, getScreenBridge, getServerSnapshot)
  const live = bridge?.slug === project.slug
  const focus = useSyncExternalStore(subscribeFlowFocus, getFlowFocus, getServerSnapshot)
  const flow = !live && focus?.slug === project.slug ? focus : null
  const activeId = live ? bridge.current : (flow?.selected ?? null)

  const { live: running, tab: chosen } = useSyncExternalStore(
    subscribeShellSlots,
    getShellSlots,
    getShellSlotsServerSnapshot,
  )
  const tab: SidebarTab = running && !(guest && chosen === 'layers') ? chosen : 'screens'
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
      {guest || !onJump ? null : (
        <div className="flex-none px-12 pb-4 pt-4">
          <button
            type="button"
            onClick={onJump}
            className="flex h-32 w-full items-center gap-8 rounded-8 border border-ink-700 bg-ink-950 px-8 text-12 text-neutral-500 hover:bg-ink-800 hover:text-neutral-50"
          >
            <SearchIcon className="size-16 flex-none" />
            <span className="flex-1 text-left">Jump to a page…</span>
            <kbd className="rounded-4 border border-ink-700 px-4 font-sans text-10">⌘K</kbd>
          </button>
        </div>
      )}
      {running ? <PanelTabs tabs={guest ? GUEST_TABS : TABS} active={tab} onChange={setSidebarTab} /> : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-12 pb-12 pt-8">
        {/* Mounted whenever the sidebar is, so the prototype always has somewhere
          to draw; hidden, not removed, while another tab is showing. */}
        <div ref={layersRef} className={tab === 'layers' ? 'flex flex-col' : 'hidden'} />
        <div ref={notesRef} className={tab === 'notes' ? 'flex flex-col gap-8 px-8 pt-4' : 'hidden'} />

        {tab !== 'screens' ? null : (
          <>
            <ScreenList
              label="Screens"
              screens={project.screens}
              slug={project.slug}
              activeId={activeId}
              live={live}
              flow={flow}
              editable={!guest && project.status !== 'live' && isActiveDbProject(project.slug)}
            />
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
                flow={flow}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

/** Which sections the viewer folded, per project — a per-viewer convenience,
 *  so it lives in this browser only and survives its loss. */
function useFoldedSections(slug: string) {
  const key = `studio.sidebar.folded.${slug}`
  const [folded, setFolded] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    try {
      setFolded(new Set(JSON.parse(window.localStorage.getItem(key) ?? '[]') as string[]))
    } catch {
      setFolded(new Set())
    }
  }, [key])
  const set = useCallback(
    (section: string, fold: boolean) =>
      setFolded((prev) => {
        if (prev.has(section) === fold) return prev
        const next = new Set(prev)
        if (fold) next.add(section)
        else next.delete(section)
        try {
          window.localStorage.setItem(key, JSON.stringify([...next]))
        } catch {
          /* private mode — the fold holds for this visit */
        }
        return next
      }),
    [key],
  )
  return { folded, set }
}

/** What is being dragged: a screen's row, or a section by its header. */
type Drag = { kind: 'screen'; id: string } | { kind: 'section'; group: number }
/** Where it would land: a screen before row `index` of `group`; a section
 *  before the group `before`. */
type Drop = { kind: 'screen'; group: number; index: number } | { kind: 'section'; before: number }

/** Above or below the middle of the element the pointer is over. */
const lowerHalf = (e: DragEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect()
  return e.clientY > r.top + r.height / 2
}

function ScreenList({
  label,
  showLabel,
  screens,
  slug,
  activeId,
  live,
  flow,
  editable,
}: {
  label: string
  /** The project's own screens go unlabelled; an inherited group says where
   *  it comes from. */
  showLabel?: boolean
  screens: ScreenIndexEntry[]
  slug: string
  activeId: string | null
  live: boolean
  /** The flow canvas, while it's showing this project. */
  flow: FlowFocus | null
  /** Rows and sections can be dragged, named and renamed — the project's own
   *  screens, in a database project an editor has open. */
  editable?: boolean
}) {
  // A drag shows its result at once; the project's next list — the save
  // landing, or anyone else's edit — replaces it.
  const [override, setOverride] = useState<ScreenIndexEntry[] | null>(null)
  useEffect(() => setOverride(null), [screens])
  const shown = override ?? screens
  // Sections made here that no screen has joined yet — this browser's only.
  const [drafts, setDrafts] = useState<string[]>([])
  const groups = useMemo(() => groupsOf(shown, drafts), [shown, drafts])
  const { folded, set } = useFoldedSections(slug)

  const [drag, setDrag] = useState<Drag | null>(null)
  const [drop, setDrop] = useState<Drop | null>(null)
  /** The section being named: its name, or '' for a new one. */
  const [naming, setNaming] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The device moving into a folded section opens it, so the live row is
  // always there to see (and to scroll to).
  const activeSection = shown.find((s) => s.id === activeId)?.section
  useEffect(() => {
    if (activeSection) set(activeSection, false)
  }, [activeSection, set])

  const commit = async (next: Group[]) => {
    const list = flatten(next)
    if (sameArrangement(list, shown)) return
    setOverride(list)
    setSaving(true)
    setError(null)
    // `shown` is what index.ts holds now: the project's list, or the last
    // drag's once its save came back.
    const why = await saveArrangement(slug, shown, list)
    setSaving(false)
    if (why) {
      setOverride(null)
      setError(why)
    }
  }

  const endDrag = () => {
    setDrag(null)
    setDrop(null)
  }
  const onDrop = (e: DragEvent<HTMLElement>) => {
    e.preventDefault()
    if (drag?.kind === 'screen' && drop?.kind === 'screen') {
      const name = groups[drop.group]?.section
      if (name) set(name, false)
      void commit(moveScreen(groups, drag.id, drop.group, drop.index))
    } else if (drag?.kind === 'section' && drop?.kind === 'section') {
      void commit(moveSection(groups, drag.group, drop.before))
    }
    endDrag()
  }

  const rename = (from: string, to: string) => {
    setNaming(null)
    const name = to.trim()
    if (from === '') {
      if (name && !groups.some((g) => g.section === name)) setDrafts((d) => [...d, name])
      return
    }
    if (drafts.includes(from) && !shown.some((s) => s.section === from)) {
      setDrafts((d) => (name ? d.map((n) => (n === from ? name : n)) : d.filter((n) => n !== from)))
      return
    }
    void commit(renameSection(groups, from, name))
  }

  const canDrag = Boolean(editable && live && !saving)
  const row = (screen: ScreenIndexEntry, group: number, index: number, rows: number) => {
    const mark =
      drop?.kind === 'screen' && drop.group === group
        ? drop.index === index
          ? 'top'
          : drop.index === rows && index === rows - 1
            ? 'bottom'
            : undefined
        : undefined
    return (
      <ScreenRow
        key={screen.id}
        screen={screen}
        slug={slug}
        active={screen.id === activeId}
        live={live}
        onFlow={Boolean(flow?.ids.has(screen.id))}
        flow={flow}
        mark={mark}
        drag={
          canDrag
            ? {
                start: () => setDrag({ kind: 'screen', id: screen.id }),
                over: (e) => {
                  if (drag?.kind !== 'screen') return
                  e.preventDefault()
                  setDrop({ kind: 'screen', group, index: index + (lowerHalf(e) ? 1 : 0) })
                },
                end: endDrag,
              }
            : undefined
        }
      />
    )
  }

  const [loose, ...sections] = groups
  const sectionMark = (group: number) =>
    drop?.kind === 'section'
      ? drop.before === group
        ? 'top'
        : drop.before === groups.length && group === groups.length - 1
          ? 'bottom'
          : undefined
      : drop?.kind === 'screen' && drop.group === group && (groups[group].rows.length === 0 || folded.has(groups[group].section!))
        ? 'bottom'
        : undefined

  return (
    <nav aria-label={label} className="flex flex-col gap-2" onDrop={onDrop} onDragOver={(e) => drag && e.preventDefault()}>
      {showLabel ? <p className={GROUP_LABEL}>{label}</p> : null}
      {error ? <p className="px-8 pb-4 text-12 text-red-500">{error}</p> : null}
      {loose.rows.map((s, i) => row(s, 0, i, loose.rows.length))}
      {/* With nothing unsectioned, somewhere to drop a screen out of its section. */}
      {drag?.kind === 'screen' && loose.rows.length === 0 && sections.length > 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDrop({ kind: 'screen', group: 0, index: 0 })
          }}
          className={`rounded-8 border border-dashed px-8 py-4 text-12 text-caption dark:text-neutral-500 ${
            drop?.kind === 'screen' && drop.group === 0 ? 'border-primary-500' : 'border-default dark:border-ink-700'
          }`}
        >
          No section
        </div>
      ) : null}
      {sections.map(({ section, rows }, s) => {
        const group = s + 1
        const name = section!
        const open = !folded.has(name)
        return (
          <div key={name} role="group" aria-label={name} className="flex flex-col gap-2">
            {naming === name ? (
              <SectionName initial={name} onDone={(to) => rename(name, to)} onCancel={() => setNaming(null)} />
            ) : (
              <div
                className="relative"
                draggable={canDrag}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move'
                  e.dataTransfer.setData('text/plain', name)
                  setDrag({ kind: 'section', group })
                }}
                onDragOver={(e) => {
                  if (!drag) return
                  e.preventDefault()
                  if (drag.kind === 'section') setDrop({ kind: 'section', before: lowerHalf(e) ? group + 1 : group })
                  else setDrop({ kind: 'screen', group, index: 0 })
                }}
                onDragEnd={endDrag}
              >
                <button
                  type="button"
                  onClick={() => set(name, open)}
                  onDoubleClick={editable ? () => setNaming(name) : undefined}
                  aria-expanded={open}
                  title={editable ? 'Drag to move · double-click to rename' : undefined}
                  className={SECTION_HEADER}
                >
                  <ChevronRightIcon className={`size-12 flex-none transition-transform ${open ? 'rotate-90' : ''}`} />
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  <span className="flex-none">{rows.length}</span>
                </button>
                <DropMark at={sectionMark(group)} />
              </div>
            )}
            {open ? rows.map((r, i) => row(r, group, i, rows.length)) : null}
            {open && rows.length === 0 ? (
              <p
                onDragOver={(e) => {
                  if (drag?.kind !== 'screen') return
                  e.preventDefault()
                  setDrop({ kind: 'screen', group, index: 0 })
                }}
                className="px-8 text-12 text-caption dark:text-neutral-500"
              >
                Drag screens here
              </p>
            ) : null}
          </div>
        )
      })}
      {editable && live ? (
        naming === '' ? (
          <SectionName initial="" onDone={(to) => rename('', to)} onCancel={() => setNaming(null)} />
        ) : (
          <button type="button" onClick={() => setNaming('')} className={NEW_SECTION}>
            <PlusIcon className="size-12 flex-none" />
            New section
          </button>
        )
      ) : null}
    </nav>
  )
}

/** The line a drop would land on, along a row's or header's edge. */
function DropMark({ at }: { at?: 'top' | 'bottom' }) {
  if (!at) return null
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 h-2 rounded-full bg-primary-500 ${at === 'top' ? 'top-0' : 'bottom-0'}`}
    />
  )
}

/** Naming a section in place: Enter or leaving the field keeps it, Esc
 *  doesn't. Renamed to nothing, a section's screens leave it. */
function SectionName({
  initial,
  onDone,
  onCancel,
}: {
  initial: string
  onDone: (name: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(initial)
  const done = useRef(false)
  const finish = (keep: boolean) => {
    if (done.current) return
    done.current = true
    if (keep) onDone(value)
    else onCancel()
  }
  return (
    <div className="px-8 pb-4 pt-12">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') finish(true)
          if (e.key === 'Escape') finish(false)
        }}
        onBlur={() => finish(true)}
        placeholder={initial ? 'Empty takes its screens out' : 'Section name'}
        aria-label="Section name"
        className="h-24 w-full rounded-4 border border-default bg-neutral-white px-4 text-12 text-default dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50"
      />
    </div>
  )
}

function ScreenRow({
  screen,
  slug,
  active,
  live,
  onFlow,
  flow,
  mark,
  drag,
}: {
  screen: ScreenIndexEntry
  slug: string
  active: boolean
  live: boolean
  /** Drawn on the flow canvas showing now — the row selects it there. */
  onFlow: boolean
  /** That canvas — its states for this row, and which is applied. */
  flow: FlowFocus | null
  mark?: 'top' | 'bottom'
  drag?: { start: () => void; over: (e: DragEvent<HTMLElement>) => void; end: () => void }
}) {
  const className = active ? ROW_ACTIVE : ROW_IDLE

  // Follow the device: tapping through a flow, the stepper arrows, a state
  // applied from the phone dialog — the live row comes into view, its states
  // with it. On the row itself, so it also runs when the row first appears: a
  // section opening for it, or the Screens tab coming back. `nearest` leaves
  // the list alone while the row is already showing.
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!active) return
    const next = ref.current?.nextElementSibling
    if (next?.getAttribute('aria-label') === 'States') next.scrollIntoView({ block: 'nearest' })
    ref.current?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!live && !onFlow) {
    return (
      <Link href={`/p/${slug}?screen=${screen.id}`} className={className}>
        <span className="truncate">{screen.title}</span>
      </Link>
    )
  }
  return (
    <>
      <div
        ref={ref}
        className="relative"
        draggable={Boolean(drag)}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move'
          e.dataTransfer.setData('text/plain', screen.id)
          drag?.start()
        }}
        onDragOver={drag?.over}
        onDragEnd={drag?.end}
      >
        <button
          type="button"
          onClick={() => (live ? screenBridgeJump(screen.id) : selectInFlow(screen.id, true))}
          aria-current={active ? 'page' : undefined}
          className={className}
        >
          <span className="truncate">{screen.title}</span>
        </button>
        <DropMark at={mark} />
      </div>
      {active && live ? <LiveStateList /> : null}
      {active && !live && flow ? (
        <StateList
          states={flow.states.get(screen.id) ?? []}
          applied={flow.applied?.screen === screen.id ? flow.applied.state : null}
          onApply={(state) => applyFlowState(screen.id, state)}
        />
      ) : null}
    </>
  )
}

/**
 * The live screen's states, nested under its row — a presentation aid:
 * during a walkthrough the state being discussed is often six taps of setup
 * away, and some states cannot be tapped to at all. One click puts the screen
 * in the condition, without leaving it.
 *
 * The highlight is what was last APPLIED to this screen, not what the project
 * is actually in — the platform cannot know that, and pretending otherwise
 * would mean reading project internals. The bridge keeps it, so it survives an
 * edit landing (which applies it again) and a trip to another screen and back.
 */
function LiveStateList() {
  const bridge = useSyncExternalStore(subscribeScreenBridge, getScreenBridge, getServerSnapshot)
  return <StateList states={bridge?.states ?? []} applied={bridge?.applied ?? null} onApply={applyScreenState} />
}

/** The rows themselves — for the running prototype, or the flow canvas. */
function StateList({
  states,
  applied,
  onApply,
}: {
  states: ScreenState[]
  applied: string | null
  onApply: (state: ScreenState) => void
}) {
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
            onClick={() => onApply(state)}
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
