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
// There are two things the list can be spent on, and the pending list is
// identical either way:
//
//   • WRITE — the dev server has the source, so Apply writes the files.
//   • RECORD — a built deployment has no source and nothing that could write
//     it, so the list is copied out as a description of the changes instead.
//     This is the only honest behaviour there: the alternative is a panel that
//     appears to save and silently loses everything on refresh.
//
// Record mode is forced outside dev, and available inside it — a lead can go
// through someone else's running prototype and come away with a list without
// touching their working copy.
//
// Undo is a stack of inverse edits over APPLIED changes, so it only exists in
// write mode. Undoing never restores snapshots — it POSTs the reverse swap
// through the same route, so the file history stays a sequence of verified
// small edits whichever direction it moves. In record mode nothing was
// written, so undo is purely unstaging.
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

/** Where Apply sends the list. See the header. */
export type SinkMode = 'write' | 'record'

export interface EditStoreState {
  /** Staged edits not yet spent, in staging order. */
  pending: { key: string; label: string; screenId: string }[]
  /** Writes in flight. */
  busy: boolean
  /** Last refusal/failure, cleared by the next successful write. */
  error: { label: string; reason: string } | null
  undo: UndoEntry[]
  mode: SinkMode
}

interface PendingEntry {
  slug: string
  screenId: string
  edit: Edit
  label: string
  /** Monotonic touch order — "undo" on pending removes the last-touched knob. */
  seq: number
  /**
   * Whether this edit's optimistic patch is on the live DOM. False for entries
   * restored from a previous session: the list survived, the patch didn't, and
   * treating them as applied would make the next edit on the same element
   * compute the file's classes wrongly.
   */
  patched: boolean
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

/** A built deployment has no source behind it, so it can only ever record. */
const CAN_WRITE = process.env.NODE_ENV === 'development'

let state: EditStoreState = {
  pending: [],
  busy: false,
  error: null,
  undo: [],
  mode: CAN_WRITE ? 'write' : 'record',
}
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
      .map(([key, p]) => ({ key, label: p.label, screenId: p.screenId })),
  }
  listeners.forEach((l) => l())
  persist()
}

export function subscribeEditStore(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getEditStoreState(): EditStoreState {
  return state
}

const serverSnapshot: EditStoreState = {
  pending: [],
  busy: false,
  error: null,
  undo: [],
  mode: 'record',
}
export function getEditStoreServerSnapshot(): EditStoreState {
  return serverSnapshot
}

export function setSinkMode(mode: SinkMode) {
  if (!CAN_WRITE && mode === 'write') return
  if (state.mode === mode) return
  emit({ mode })
  // Switching INTO collecting picks up whatever was collected before, which is
  // the whole reason the list is persisted.
  if (mode === 'record') loadFromStorage()
}

// --- surviving a refresh -----------------------------------------------------
//
// Only in record mode, and only because there is nowhere else for the work to
// live: a written edit is safe in a file, but a recorded one exists solely in
// this tab. A lead half an hour into a review must not lose it to a stray
// reload. Keyed per project so a whole pass across screens copies as one list.

const STORAGE_PREFIX = 'db.edit.changes.'
let storageKey: string | null = null

function persist() {
  if (state.mode !== 'record' || !storageKey) return
  try {
    const rows = Array.from(pending.entries()).map(([key, p]) => ({
      key,
      slug: p.slug,
      screenId: p.screenId,
      edit: p.edit,
      label: p.label,
      seq: p.seq,
    }))
    if (rows.length === 0) window.localStorage.removeItem(storageKey)
    else window.localStorage.setItem(storageKey, JSON.stringify(rows))
  } catch {
    // A full or disabled localStorage costs persistence, not the session.
  }
}

/** Point the store at a project's collected list, reading back what is there.
 *  Called by the panel once it knows which project is on screen. */
export function restoreChanges(slug: string) {
  const key = `${STORAGE_PREFIX}${slug}`
  if (storageKey === key) return
  storageKey = key
  if (state.mode === 'record') loadFromStorage()
}

function loadFromStorage() {
  if (!storageKey) return
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return
    const rows = JSON.parse(raw) as {
      key: string
      slug: string
      screenId: string
      edit: Edit
      label: string
      seq: number
    }[]
    for (const row of rows) {
      // Restored entries are listed but NOT on the DOM — the screen they
      // belong to may not even be mounted.
      pending.set(row.key, { ...row, patched: false })
      seq = Math.max(seq, row.seq)
    }
    emit({})
  } catch {
    // Unreadable storage is treated as no storage.
  }
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
      patched: true,
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
      patched: true,
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
      patched: true,
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
 *  optimistic swaps reversed. Restored entries are skipped — their patch was
 *  never applied to this DOM, so reversing it would invent a class. */
export function fileClassesOf(rendered: string[]): string[] {
  let classes = rendered
  for (const p of pending.values()) {
    if (p.edit.kind !== 'class' || !p.patched) continue
    const { oldClass, newClass } = p.edit
    classes = classes.map((c) => (c === newClass ? oldClass : c))
  }
  return classes
}

// --- recording ---------------------------------------------------------------

/**
 * The change list as a paste-ready block.
 *
 * Every line carries the element, the old value and the new one, so applying it
 * on the other end is the same verified replacement the write path makes —
 * and a stale line (the old value no longer being there) is detectable rather
 * than silently forced.
 */
export function changeListText(): string {
  const rows = Array.from(pending.values()).sort((a, b) => a.seq - b.seq)
  if (rows.length === 0) return ''

  const slug = rows[0].slug
  const lines = [`Amartha Studio · project \`${slug}\` · ${rows.length} change(s) to apply`, '']

  // Grouped by screen, screens in the order they were first touched — a
  // reviewer who goes back to an earlier screen should not split its section.
  const screens: string[] = []
  for (const row of rows) if (!screens.includes(row.screenId)) screens.push(row.screenId)

  let n = 0
  for (const screen of screens) {
    lines.push(`Screen \`${screen}\` — projects/${slug}/screens/${screen}.tsx`)

    for (const row of rows.filter((r) => r.screenId === screen)) {
      n += 1
      const where =
        row.edit.kind === 'class'
          ? row.edit.text
            ? ` — on the element showing "${row.edit.text}"`
            : ` — on the element with classes: ${row.edit.find.join(' ')}`
          : row.edit.kind === 'prop'
            ? row.edit.text
              ? ` — the ${row.edit.component} showing "${row.edit.text}"`
              : ` — the ${row.edit.component}`
            : ''
      lines.push(`  ${n}. ${row.label}${where}`)
    }
    lines.push('')
  }

  lines.push('Please apply these, keeping to the design system (CLAUDE.md §2).')
  return lines.join('\n')
}

/** Copy the list out. Non-destructive: the list stays, so a reviewer can keep
 *  going and copy again. */
export async function copyChangeList(): Promise<boolean> {
  const text = changeListText()
  if (!text) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    emit({ error: { label: 'the change list', reason: 'The browser blocked the clipboard.' } })
    return false
  }
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

/** Write every pending edit, in staging order. One press, one refresh.
 *  Never reachable in record mode — there is no server to write through. */
export async function applyPending(): Promise<void> {
  if (pending.size === 0 || state.busy || state.mode !== 'write') return
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
