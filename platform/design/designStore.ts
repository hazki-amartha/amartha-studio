// =============================================================================
// Design · the pending-edit store.
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

import type { DesignRequest, DesignResponse, Edit, Src } from './protocol'

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

export interface DesignStoreState {
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
  /** For a prop edit: the FunDS component's name. Not part of the wire shape —
   *  `src` already identifies the node — but `applyDom` needs it to repaint the
   *  component optimistically, and the label reads better with it. */
  component?: string
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

type Sink = (req: DesignRequest) => Promise<DesignResponse>

const devSink: Sink = async (req) => {
  try {
    const res = await fetch('/api/design', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    })
    return (await res.json()) as DesignResponse
  } catch {
    return { ok: false, reason: 'The studio server did not answer.' }
  }
}

/** A built deployment has no source behind it, so it can only ever record. */
const CAN_WRITE = process.env.NODE_ENV === 'development'

let state: DesignStoreState = {
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

function emit(next: Partial<DesignStoreState>) {
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

export function subscribeDesignStore(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getDesignStoreState(): DesignStoreState {
  return state
}

const serverSnapshot: DesignStoreState = {
  pending: [],
  busy: false,
  error: null,
  undo: [],
  mode: 'record',
}
export function getDesignStoreServerSnapshot(): DesignStoreState {
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

/** The repo-relative file an address points into. */
export function fileOf(src: Src): string {
  return src.split(':').slice(0, -2).join(':')
}

/** The utility family a class edits — `gap-12` and `gap-16` share a knob. */
function familyOf(cls: string): string {
  const i = cls.lastIndexOf('-')
  return i > 0 ? cls.slice(0, i) : cls
}

// --- staging -----------------------------------------------------------------

/**
 * Stage a class swap on the node at `src`.
 *
 * One knob per node per family: stepping `gap-12 → 16 → 20` updates the NEW
 * value and keeps the ORIGINAL old one, because the file still holds the
 * original until Apply. Stepping back to the original drops the entry.
 */
export function stageClassEdit(
  slug: string,
  screenId: string,
  src: Src,
  oldClass: string,
  newClass: string,
) {
  const key = `class|${src}|${familyOf(oldClass)}`
  const existing = pending.get(key)
  const originalOld =
    existing && existing.edit.kind === 'class' ? existing.edit.oldClass : oldClass

  if (newClass === originalOld) {
    pending.delete(key)
  } else {
    pending.set(key, {
      slug,
      screenId,
      edit: { kind: 'class', src, oldClass: originalOld, newClass },
      label: `${originalOld} → ${newClass}`,
      seq: ++seq,
      patched: true,
    })
  }
  emit({})
}

/** Stage a text replacement on the node at `src`. `old` is the text as
 *  currently RENDERED — if a pending edit already produced it, the merge keeps
 *  that edit's original, so the file's value is what finally gets verified. */
export function stageTextEdit(
  slug: string,
  screenId: string,
  src: Src,
  old: string,
  next: string,
) {
  const key = `text|${src}`
  const existing = pending.get(key)
  const originalOld = existing && existing.edit.kind === 'text' ? existing.edit.old : old

  if (next === originalOld) {
    pending.delete(key)
  } else {
    pending.set(key, {
      slug,
      screenId,
      edit: { kind: 'text', src, old: originalOld, next },
      label: `"${originalOld}" → "${next}"`,
      seq: ++seq,
      patched: true,
    })
  }
  emit({})
}

/** Stage a component prop change on the node at `src`. `old` is the value
 *  currently rendered. */
export function stagePropEdit(
  slug: string,
  screenId: string,
  src: Src,
  component: string,
  prop: string,
  old: string,
  next: string,
) {
  const key = `prop|${src}|${prop}`
  const existing = pending.get(key)
  const originalOld = existing && existing.edit.kind === 'prop' ? existing.edit.old : old

  if (next === originalOld) {
    pending.delete(key)
  } else {
    pending.set(key, {
      slug,
      screenId,
      edit: { kind: 'prop', src, prop, old: originalOld, next },
      component,
      label: `${component} ${prop} ${originalOld} → ${next}`,
      seq: ++seq,
      patched: true,
    })
  }
  emit({})
}

/** Remove one staged edit by key, returning it so the caller can revert the
 *  optimistic DOM patch. */
export interface Unstaged {
  edit: Edit
  /** Present for prop edits — `applyDom` needs it to repaint. */
  component?: string
}

export function unstage(key: string): Unstaged | null {
  const entry = pending.get(key)
  if (!entry) return null
  pending.delete(key)
  emit({})
  return { edit: entry.edit, component: entry.component }
}

/** Remove the most recently touched staged edit — "undo" before anything has
 *  been written. */
export function unstageLast(): Unstaged | null {
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

  // Grouped by file, in the order each was first touched — a reviewer who goes
  // back to an earlier screen should not split its section. By file rather
  // than by screen because an element can live in the project's `lib/`, and
  // the address below is only meaningful against the file it came from.
  const files: string[] = []
  for (const row of rows) {
    const file = fileOf(row.edit.src)
    if (!files.includes(file)) files.push(file)
  }

  let n = 0
  for (const file of files) {
    const inFile = rows.filter((r) => fileOf(r.edit.src) === file)
    const screensHere = Array.from(new Set(inFile.map((r) => r.screenId)))
    lines.push(`\`${file}\` — seen on screen ${screensHere.map((s) => `\`${s}\``).join(', ')}`)
    // `line:col` below is into this file.

    for (const row of inFile) {
      n += 1
      // The address, not a description of the element. v1 had to say "the
      // element showing X" because that was all it knew; `src` is the exact
      // line and column, which is both shorter and unambiguous to whoever — or
      // whatever — applies it on the other end.
      const at = row.edit.src.split(':').slice(-2).join(':')
      const what = row.component ? ` (${row.component})` : ''
      lines.push(`  ${n}. line ${at} — ${row.label}${what}`)
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

/** The edit that puts the file back. `src` is unchanged — the node did not
 *  move, only its value did. */
function inverseOf(edit: Edit): Edit {
  if (edit.kind === 'class') {
    return { ...edit, oldClass: edit.newClass, newClass: edit.oldClass }
  }
  if (edit.kind === 'text') {
    return { ...edit, old: edit.next, next: edit.old }
  }
  // A prop edit is the only one whose inverse can change shape: the inverse of
  // ADDING a prop (old: null) is REMOVING it (next: null).
  return { ...edit, old: edit.next, next: edit.old }
}

/**
 * Write every pending edit. One press, one batch, one fast refresh.
 *
 * The batch goes to the route as a single request and is applied ATOMICALLY:
 * `applyEdits` verifies each edit's old value against the syntax tree and
 * refuses the whole list on the first mismatch. The v1 route took one edit at a
 * time, so a batch could half-apply and leave the file in a state nobody asked
 * for — the panel would show three changes saved and a fourth refused, with the
 * file somewhere in between.
 *
 * Edits are grouped by FILE because a batch must name one file. That is not the
 * same as grouping by screen: a screen's rows often come from a component in
 * the project's `lib/`, whose elements are stamped with the lib file's path.
 * Grouping by screen sent those in one batch with the screen's own edits, and
 * the route refused the lot for spanning two files.
 *
 * Never reachable in record mode — there is no server to write through.
 */
export async function applyPending(): Promise<void> {
  if (pending.size === 0 || state.busy || state.mode !== 'write') return
  const batch = Array.from(pending.values()).sort((a, b) => a.seq - b.seq)
  pending.clear()
  emit({ busy: true })

  const groups = new Map<string, PendingEntry[]>()
  for (const entry of batch) {
    const key = `${entry.slug}|${fileOf(entry.edit.src)}`
    const group = groups.get(key)
    if (group) group.push(entry)
    else groups.set(key, [entry])
  }

  for (const group of groups.values()) {
    const { slug, screenId } = group[0]
    const label = group.length === 1 ? group[0].label : `${group.length} changes`
    const res = await devSink({ slug, screenId, edits: group.map((g) => g.edit) })

    if (res.ok) {
      // One undo entry per applied edit, newest last, so Undo walks back one
      // change at a time rather than unwinding a whole press.
      emit({
        error: null,
        undo: [
          ...state.undo,
          ...group.map((g) => ({
            slug: g.slug,
            screenId: g.screenId,
            inverse: inverseOf(g.edit),
            label: g.label,
          })),
        ],
      })
    } else {
      emit({ error: { label, reason: res.reason } })
    }
  }

  emit({ busy: false })
  onFlushed?.()
}

/** Pop the newest applied edit and post its inverse — a batch of one. */
export async function undoLast(): Promise<void> {
  const entry = state.undo[state.undo.length - 1]
  if (!entry || state.busy) return
  emit({ busy: true, undo: state.undo.slice(0, -1) })
  const res = await devSink({
    slug: entry.slug,
    screenId: entry.screenId,
    edits: [entry.inverse],
  })
  if (!res.ok) emit({ error: { label: `undo ${entry.label}`, reason: res.reason } })
  emit({ busy: false })
  onFlushed?.()
}

export function clearDesignError() {
  emit({ error: null })
}
