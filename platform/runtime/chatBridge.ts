// =============================================================================
// Chat bridge — the chat panel's state, shared between the shell's top-bar
// button, the docked panel, and the inspector that can hand it an element.
//
// Same shape as designBridge, for the same reason: the three are far apart in
// the tree, and a context would re-render the whole shell on every change.
//
// Chat is NOT a mode. It sits beside Prototype · Design · Inspect · Flow rather
// than among them, so it can stay open while the designer switches modes —
// pick an element in Inspect, ask for the change, watch the prototype move.
// =============================================================================

export interface ChatAttachment {
  /** What the chip in the composer says: "Button", "<div>". */
  label: string
  /** The copyForAgent text for the element, sent ahead of the message. */
  context: string
}

interface ChatBridgeState {
  open: boolean
  /** null until the server has answered; false on a deployment. */
  available: boolean | null
  attachment: ChatAttachment | null
  /** The chat's pick button is armed: the next click on the prototype attaches
   *  that element instead of doing what the prototype would do. */
  picking: boolean
}

let state: ChatBridgeState = { open: false, available: null, attachment: null, picking: false }
const listeners = new Set<() => void>()

function set(patch: Partial<ChatBridgeState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function subscribeChat(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getChat(): ChatBridgeState {
  return state
}

const SERVER: ChatBridgeState = { open: false, available: null, attachment: null, picking: false }
/** Chat is a client-only affordance; the server always renders it closed. */
export function getChatServerSnapshot(): ChatBridgeState {
  return SERVER
}

export function setChatOpen(open: boolean) {
  // A closed panel can't show what was picked, so closing also disarms.
  if (state.open !== open) set({ open, picking: open ? state.picking : false })
}

export function setChatPicking(picking: boolean) {
  if (state.picking !== picking) set({ picking })
}

export function setChatAvailable(available: boolean) {
  if (state.available !== available) set({ available })
}

/** Attach an element to the next message, and open the panel to show it. */
export function attachToChat(attachment: ChatAttachment | null) {
  set({ attachment, open: attachment ? true : state.open, picking: false })
}

let probed = false
/** Ask the server once whether chat can run here (dev server + password set). */
export function probeChat() {
  if (probed) return
  probed = true
  fetch('/api/chat', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((s: { available?: boolean } | null) => setChatAvailable(Boolean(s?.available)))
    .catch(() => setChatAvailable(false))
}
