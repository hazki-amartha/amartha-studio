// =============================================================================
// Chat bridge — whether chat is showing, and whether it can run here. Shared
// between the shell's top-bar Chat button and the prototype view's panel,
// which are far apart in the tree (the same reason as designBridge).
//
// Chat is the first tab of the prototype view's panel (STUDIO-EDITING-PLAN
// Part E). It is about the current selection — Edit mode's pinned element —
// so there is no attachment or pick state here any more: the selection IS the
// attachment. `open` is the top-bar button's side of it: pressing it asks the
// panel to show Chat, and the panel reports back when Chat stops showing.
// =============================================================================

interface ChatBridgeState {
  open: boolean
  /** null until the server has answered; false on a deployment. */
  available: boolean | null
}

let state: ChatBridgeState = { open: false, available: null }
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

const SERVER: ChatBridgeState = { open: false, available: null }
/** Chat is a client-only affordance; the server always renders it closed. */
export function getChatServerSnapshot(): ChatBridgeState {
  return SERVER
}

export function setChatOpen(open: boolean) {
  if (state.open !== open) set({ open })
}

export function setChatAvailable(available: boolean) {
  if (state.available !== available) set({ available })
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
