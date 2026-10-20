// =============================================================================
// Shell slots — where a route draws into the shell's own chrome.
//
// The shell owns the frame: the sidebar, the page card's top bar, and the
// column right of the card. Some of what goes in them belongs to whatever the
// route is running, so the shell offers an element for each and the route
// portals into it (ShellPortal):
//
//   • `layers` / `notes` — the project sidebar's Layers and Notes tabs. They
//     need the running prototype: Layers the selection, the hover preview and
//     the drag rules; Notes the live screen.
//   • `actions` — the right end of the top bar: the prototype's Comment ·
//     Edit · Chat, the gallery's New project.
//   • `meta` — beside the top bar's title: the gallery's project count.
//   • `panel` — the column right of the card, on the dark frame, for the
//     prototype's Comments · Edit · Chat panel. Empty, it takes no room.
//
// Each is null while the shell isn't drawing it. Two more fields ride along:
//
//   • `live` — whether a prototype is running, i.e. whether Layers and Notes
//     have anything to show. The sidebar draws its tabs only then (the flow
//     view has no runtime, so it gets Screens alone).
//   • `tab` — the project sidebar's tab, kept here so the folded rail's icons
//     can open the sidebar straight onto one.
// =============================================================================

export type SlotName = 'layers' | 'notes' | 'actions' | 'meta' | 'panel'
export type SidebarTab = 'screens' | 'layers' | 'notes'

interface ShellSlots {
  layers: HTMLElement | null
  notes: HTMLElement | null
  actions: HTMLElement | null
  meta: HTMLElement | null
  panel: HTMLElement | null
  live: boolean
  tab: SidebarTab
}

const EMPTY: ShellSlots = {
  layers: null,
  notes: null,
  actions: null,
  meta: null,
  panel: null,
  live: false,
  tab: 'screens',
}

let slots: ShellSlots = EMPTY
const listeners = new Set<() => void>()

function set(next: Partial<ShellSlots>) {
  if (Object.entries(next).every(([k, v]) => slots[k as keyof ShellSlots] === v)) return
  slots = { ...slots, ...next }
  listeners.forEach((l) => l())
}

export const setShellSlot = (name: SlotName, el: HTMLElement | null) => set({ [name]: el })
export const setPrototypeLive = (live: boolean) => set({ live })
export const setSidebarTab = (tab: SidebarTab) => set({ tab })

export function subscribeShellSlots(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export const getShellSlots = (): ShellSlots => slots
export const getShellSlotsServerSnapshot = (): ShellSlots => EMPTY
