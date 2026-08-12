// =============================================================================
// Edit · the pending-edit store.
//
// NOTHING writes on its own. Every tweak — class, text, prop — stages into a
// pending list, the optimistic DOM patch shows it live, and the file writes
// happen only when the designer presses "Apply N changes". One press, one
// batch, one fast refresh: writing per nudge reloaded the screen on every
// step of a stepper, which read as the page breaking mid-thought.
//
// Staging merges by knob: a second step on the same knob updates the NEW
// value but keeps the ORIGINAL old one, because the file still holds the
// original until apply. Stepping back to the original cancels the pending
// entry entirely, so the list only ever holds real diffs.
//
// The sink is swappable on purpose: today it POSTs to the dev-only write-back
// route; the deployed build gets a recorder that turns the same pending list
// into a copyable change list instead (phase 2).
//
// Undo is a stack of inverse edits over APPLIED changes. Undoing never
// restores snapshots — it POSTs the reverse swap through the same route, so
// the file history stays a sequence of verified small edits whichever
// direction it moves.
// =============================================================================

import type { Edit, EditRequest, EditResponse } from './protocol'

export interface UndoEntry {
  slug: string
  screenId: string
  /** The edit that would put the file back how it was. */
  inverse: Edit
  /** Human line for the panel, phrased forward: "gap-12 → gap-16". */
  label: string
}

export interface EditStoreState {
  /** Staged edits not yet written, in staging order. */
  pending: { key: string; label: string }[]
  /** Writes in flight. */
  busy: boolean
  /** Last refusal/failure, cleared by the next successful write. */
  error: { label: string; reason: string } | null
  undo: UndoEntry[]
}

interface PendingEntry {
  slug: string
  screenId: string
  edit: Edit
  label: string
  /** Monotonic touch order — "undo" on pending removes the last-touched knob. */
  seq: number
}

let seq = 0

type Sink = (req: EditRequest) => Promise<EditResponse>

const devSink: Sink = async (req) => {
  try {
    const res = await fetch('/api/edit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    })
    return (await res.json()) as EditResponse
  } catch {
    return { ok: false, reason: 'The studio server did not answer.' }
  }
}

let state: EditStoreState = { pending: [], busy: false, error: null, undo: [] }
const pending = new Map<string, PendingEntry>()
const listeners = new Set<() => void>()
/** Fires after every settled write batch — the panel uses it to re-pin. */
let onFlushed: (() => void) | null = null

function emit(next: Partial<EditStoreState>) {
  state = {
    ...state,
    ...next,
    pending: Array.from(pending.entries())
      .sort((a, b) => a[1].seq - b[1].seq)
      .map(([key, p]) => ({ key, label: p.label })),
  }
  listeners.forEach((l) => l())
}

export function subscribeEditStore(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getEditStoreState(): EditStoreState {
  return state
}

const serverSnapshot: EditStoreState = { pending: [], busy: false, error: null, undo: [] }
export function getEditStoreServerSnapshot(): EditStoreState {
  return serverSnapshot
}

export function setOnFlushed(cb: (() => void) | null) {
  onFlushed = cb
}

/** The utility family a class edits — `gap-12` and `gap-16` share a knob. */
function familyOf(cls: string): string {
  const i = cls.lastIndexOf('-')
  return i > 0 ? cls.slice(0, i) : cls
}

// --- staging -----------------------------------------------------------------

/**
 * Stage a class swap. `find` must be the FILE's class list for the element —
 * the caller reverses any still-pending optimistic swaps before passing it.
 */
export function stageClassEdit(
  slug: string,
  screenId: string,
  find: string[],
  oldClass: string,
  newClass: string,
  text: string,
) {
  const key = `class|${find.join(' ')}|${familyOf(oldClass)}`
  const existing = pending.get(key)
  const originalOld =
    existing && existing.edit.kind === 'class' ? existing.edit.oldClass : oldClass

  if (newClass === originalOld) {
    pending.delete(key)
  } else {
    pending.set(key, {
      slug,
      screenId,
      edit: { kind: 'class', find, oldClass: originalOld, newClass, text },
      label: `${originalOld} → ${newClass}`,
      seq: ++seq,
    })
  }
  emit({})
}

/** Stage a text replacement. `old` is the text as currently RENDERED — if a
 *  pending edit already produced it, the merge keeps that edit's original. */
export function stageTextEdit(slug: string, screenId: string, old: string, next: string) {
  let key = `text|${old}`
  let originalOld = old
  for (const [k, p] of pending) {
    if (p.edit.kind === 'text' && p.edit.next === old) {
      key = k
      originalOld = p.edit.old
      break
    }
  }

  if (next === originalOld) {
    pending.delete(key)
  } else {
    pending.set(key, {
      slug,
      screenId,
      edit: { kind: 'text', old: originalOld, next },
      label: `"${originalOld}" → "${next}"`,
      seq: ++seq,
    })
  }
  emit({})
}

/** Stage a component prop change. `old` is the value currently rendered. */
export function stagePropEdit(
  slug: string,
  screenId: string,
  component: string,
  prop: string,
  old: string,
  next: string,
  text: string,
) {
  const key = `prop|${component}|${prop}|${text}`
  const existing = pending.get(key)
  const originalOld = existing && existing.edit.kind === 'prop' ? existing.edit.old : old

  if (next === originalOld) {
    pending.delete(key)
  } else {
    pending.set(key, {
      slug,
      screenId,
      edit: { kind: 'prop', component, prop, old: originalOld, next, text },
      label: `${component} ${prop} ${originalOld} → ${next}`,
      seq: ++seq,
    })
  }
  emit({})
}

/** Remove one staged edit by key, returning it so the caller can revert the
 *  optimistic DOM patch. */
export function unstage(key: string): Edit | null {
  const entry = pending.get(key)
  if (!entry) return null
  pending.delete(key)
  emit({})
  return entry.edit
}

/** Remove the most recently touched staged edit — "undo" before anything has
 *  been written. */
export function unstageLast(): Edit | null {
  let last: { key: string; seq: number } | null = null
  for (const [key, p] of pending) {
    if (!last || p.seq > last.seq) last = { key, seq: p.seq }
  }
  return last ? unstage(last.key) : null
}

/** The file's class list for an element: its rendered classes with any pending
 *  optimistic swaps reversed. */
export function fileClassesOf(rendered: string[]): string[] {
  let classes = rendered
  for (const p of pending.values()) {
    if (p.edit.kind !== 'class') continue
    const { oldClass, newClass } = p.edit
    classes = classes.map((c) => (c === newClass ? oldClass : c))
  }
  return classes
}

// --- applying ----------------------------------------------------------------

function inverseOf(edit: Edit): Edit {
  if (edit.kind === 'text') return { kind: 'text', old: edit.next, next: edit.old }
  if (edit.kind === 'prop') return { ...edit, old: edit.next, next: edit.old }
  return {
    kind: 'class',
    find: edit.find.map((c) => (c === edit.oldClass ? edit.newClass : c)),
    oldClass: edit.newClass,
    newClass: edit.oldClass,
    text: edit.text,
  }
}

async function runEdit(req: EditRequest, label: string): Promise<boolean> {
  const res = await devSink(req)
  if (res.ok) {
    emit({
      error: null,
      undo: [
        ...state.undo,
        { slug: req.slug, screenId: req.screenId, inverse: inverseOf(req.edit), label },
      ],
    })
    return true
  }
  emit({ error: { label, reason: res.reason } })
  return false
}

/** Write every pending edit, in staging order. One press, one refresh. */
export async function applyPending(): Promise<void> {
  if (pending.size === 0 || state.busy) return
  const batch = Array.from(pending.values())
  pending.clear()
  emit({ busy: true })

  for (const p of batch) {
    await runEdit({ slug: p.slug, screenId: p.screenId, edit: p.edit }, p.label)
  }

  emit({ busy: false })
  onFlushed?.()
}

/** Pop the newest applied edit and post its inverse. */
export async function undoLast(): Promise<void> {
  const entry = state.undo[state.undo.length - 1]
  if (!entry || state.busy) return
  emit({ busy: true, undo: state.undo.slice(0, -1) })
  const res = await devSink({ slug: entry.slug, screenId: entry.screenId, edit: entry.inverse })
  if (!res.ok) emit({ error: { label: `undo ${entry.label}`, reason: res.reason } })
  emit({ busy: false })
  onFlushed?.()
}

export function clearEditError() {
  emit({ error: null })
}
