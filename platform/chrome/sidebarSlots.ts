// =============================================================================
// Sidebar slots — where the running prototype draws into the shell's sidebar.
//
// Inside a prototype the left sidebar has three tabs: Screens, Layers and
// Notes. Screens is the shell's own (it comes from the project index), but the
// other two belong to the running prototype — Layers needs the selection, the
// hover preview and the drag rules; Notes needs the live screen — so the
// sidebar offers an element for each and PrototypeView portals into them.
//
//   • `layers` / `notes` — the sidebar's mount points, or null when it isn't
//     showing a project.
//   • `live` — whether a prototype is running, i.e. whether there is anything
//     to put in them. The sidebar draws the tabs only then (the flow view has
//     no runtime, so it gets Screens alone).
// =============================================================================

export type SlotName = 'layers' | 'notes'

interface SidebarSlots {
  layers: HTMLElement | null
  notes: HTMLElement | null
  live: boolean
}

let slots: SidebarSlots = { layers: null, notes: null, live: false }
const listeners = new Set<() => void>()

function set(next: Partial<SidebarSlots>) {
  if (Object.entries(next).every(([k, v]) => slots[k as keyof SidebarSlots] === v)) return
  slots = { ...slots, ...next }
  listeners.forEach((l) => l())
}

export const setSidebarSlot = (name: SlotName, el: HTMLElement | null) => set({ [name]: el })
export const setSidebarLive = (live: boolean) => set({ live })

export function subscribeSidebarSlots(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export const getSidebarSlots = (): SidebarSlots => slots

const SERVER: SidebarSlots = { layers: null, notes: null, live: false }
export const getSidebarSlotsServerSnapshot = (): SidebarSlots => SERVER
