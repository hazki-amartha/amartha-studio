// =============================================================================
// Chat bridge — whether chat can run here: on the dev server, with an editing
// password set. Read by Edit mode's panel, which offers the Chat tab only then,
// and by the CSS tab's "Ask chat about this".
//
// Chat is the first tab of Edit mode's panel (STUDIO-EDITING-PLAN Part E), and
// it is about the current selection — the pinned element — so there is no
// attachment or pick state here: the selection IS the attachment. Which tab is
// showing lives in designBridge with the rest of Edit mode.
// =============================================================================

interface ChatBridgeState {
  /** null until the server has answered; false on a deployment. */
  available: boolean | null
}

let state: ChatBridgeState = { available: null }
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

const SERVER: ChatBridgeState = { available: null }
/** Chat is a client-only affordance; the server never offers it. */
export function getChatServerSnapshot(): ChatBridgeState {
  return SERVER
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
