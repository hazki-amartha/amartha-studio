// =============================================================================
// Design · the pending-edit store.
//
// NOTHING writes on its own. Every tweak — class, text, prop, and from D2 every
// move, delete and duplicate — stages into a pending list, the optimistic
// layer shows it live, and the file writes happen only when the designer
// presses "Apply N changes". One press, one batch, one fast refresh: writing
// per nudge reloaded the screen on every step of a stepper, which read as the
// page breaking mid-thought.
//
// Value edits merge by knob: a second step on the same knob updates the NEW
// value but keeps the ORIGINAL old one, because the file still holds the
// original until apply. Stepping back to the original cancels the pending
// entry entirely, so the list only ever holds real diffs.
//
// Structural edits are an ORDERED list, not a set: "move A below B, then move
// C below A" means something different in the other order. The overlay
// (overlay.ts) replays them in exactly this order, and the backend applies
// them in exactly this order, which is what keeps the preview honest. Moving
// the same element twice keeps only the latest move, re-queued at the end.
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
// Undo, once applied, is one step per Apply press: the backend kept the file
// as it was before that write and restores it — only while the file is still
// exactly what the write produced (protocol.ts, DesignUndoRequest). Before
// Apply, undo just unstages the last-touched change.
// =============================================================================

import {
  isStructural,
  type DesignRequest,
  type DesignResponse,
  type DesignUndoRequest,
  type Edit,
  type Src,
  type StructuralEdit,
} from './protocol'

export interface UndoEntry {
  slug: string
  /** Backend handle for the pre-write file. */
  token: string
  /** Human line for the panel, phrased forward. */
  label: string
}

/** Where Apply sends the list. See the header. */
export type SinkMode = 'write' | 'record'

export interface DesignStoreState {
  /** Staged edits not yet spent, in staging order. */
  pending: { key: string; label: string; screenId: string }[]
  /** Staged structural edits, in the order they apply — what the overlay draws. */
  structure: StructuralEdit[]
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
  /** The `data-src-v` the address was read under. See DesignRequest. */
  version?: string
  /** Monotonic touch order — "undo" on pending removes the last-touched knob,
   *  and structural edits apply in this order. */
  seq: number
  /**
   * Whether this edit's optimistic patch is on the live DOM. False for entries
   * restored from a previous session: the list survived, the patch didn't, and
   * treating them as applied would make the next edit on the same element
   * compute the file's classes wrongly. (Structural edits have no patch to
   * lose — the overlay redraws them from this list.)
   */
  patched: boolean
}

let seq = 0

type Sink = (req: DesignRequest | DesignUndoRequest) => Promise<DesignResponse>

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
  structure: [],
  busy: false,
  error: null,
  undo: [],
  mode: CAN_WRITE ? 'write' : 'record',
}
const pending = new Map<string, PendingEntry>()
const listeners = new Set<() => void>()
/** Fires after every settled write batch — the panel uses it to re-pin. */
let onFlushed: (() => void) | null = null

const ordered = () => Array.from(pending.entries()).sort((a, b) => a[1].seq - b[1].seq)

function emit(next: Partial<DesignStoreState>) {
  const rows = ordered()
  state = {
    ...state,
    ...next,
    pending: rows.map(([key, p]) => ({ key, label: p.label, screenId: p.screenId })),
    structure: rows.flatMap(([, p]) => (isStructural(p.edit) ? [p.edit] : [])),
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
  structure: [],
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

type StoredRow = Omit<PendingEntry, 'patched'> & { key: string }

function persist() {
  if (state.mode !== 'record' || !storageKey) return
  try {
    const rows: StoredRow[] = ordered().map(([key, p]) => ({
      key,
      slug: p.slug,
      screenId: p.screenId,
      edit: p.edit,
      component: p.component,
      label: p.label,
      version: p.version,
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
    const rows = JSON.parse(raw) as StoredRow[]
    for (const { key, ...row } of rows) {
      // Restored entries are listed but NOT on the DOM — the screen they
      // belong to may not even be mounted.
      pending.set(key, { ...row, patched: false })
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

/** Who the edit is for, and which file version its address was read under. */
export interface StageContext {
  slug: string
  screenId: string
  version?: string
}

/**
 * Stage a class swap on the node at `src`.
 *
 * One knob per node per family: stepping `gap-12 → 16 → 20` updates the NEW
 * value and keeps the ORIGINAL old one, because the file still holds the
 * original until Apply. Stepping back to the original drops the entry.
 */
export function stageClassEdit(ctx: StageContext, src: Src, oldClass: string, newClass: string) {
  const key = `class|${src}|${familyOf(oldClass)}`
  const existing = pending.get(key)
  const originalOld =
    existing && existing.edit.kind === 'class' ? existing.edit.oldClass : oldClass

  if (newClass === originalOld) {
    pending.delete(key)
  } else {
    pending.set(key, {
      ...ctx,
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
export function stageTextEdit(ctx: StageContext, src: Src, old: string, next: string) {
  const key = `text|${src}`
  const existing = pending.get(key)
  const originalOld = existing && existing.edit.kind === 'text' ? existing.edit.old : old

  if (next === originalOld) {
    pending.delete(key)
  } else {
    pending.set(key, {
      ...ctx,
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
  ctx: StageContext,
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
      ...ctx,
      edit: { kind: 'prop', src, prop, old: originalOld, next },
      component,
      label: `${component} ${prop} ${originalOld} → ${next}`,
      seq: ++seq,
      patched: true,
    })
  }
  emit({})
}

/**
 * Stage a move, delete or duplicate.
 *
 * A second move of the same element replaces the first and goes to the end of
 * the queue — the designer means "put it HERE", not "move it twice". Deleting
 * an element drops any pending move of it, which could only confuse the list.
 * Duplicates never merge: pressing it twice means two copies.
 */
export function stageStructuralEdit(ctx: StageContext, edit: StructuralEdit, label: string) {
  if (edit.kind === 'delete') pending.delete(`move|${edit.src}`)
  const key =
    edit.kind === 'move'
      ? `move|${edit.src}`
      : edit.kind === 'delete'
        ? `delete|${edit.src}`
        : `duplicate|${edit.src}|${seq + 1}`
  pending.delete(key)
  pending.set(key, { ...ctx, edit, label, seq: ++seq, patched: true })
  emit({})
}

/** Whether a structural edit is already staged for this element. */
export function isDeleted(src: Src): boolean {
  return pending.has(`delete|${src}`)
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
  const rows = ordered()
  const last = rows[rows.length - 1]
  return last ? unstage(last[0]) : null
}

/** Drop everything staged. Used when a staged list can no longer be applied
 *  (the screen changed under it) and the designer chooses to start over. */
export function discardPending(): Unstaged[] {
  const out = ordered().map(([, p]) => ({ edit: p.edit, component: p.component }))
  pending.clear()
  emit({ error: null })
  return out
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
 * Every line carries the element's address and the change, so applying it on
 * the other end is the same verified edit the write path makes — and a stale
 * line is detectable rather than silently forced. Structural lines are
 * numbered in the order they must be applied.
 */
export function changeListText(): string {
  const rows = ordered().map(([, p]) => p)
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
    const version = inFile.find((r) => r.version)?.version
    lines.push(
      `\`${file}\`${version ? ` (version ${version})` : ''} — seen on screen ${screensHere
        .map((s) => `\`${s}\``)
        .join(', ')}`,
    )
    // `line:col` below is into this file, as it was when the list was made.

    for (const row of inFile) {
      n += 1
      // The address, not a description of the element. v1 had to say "the
      // element showing X" because that was all it knew; `src` is the exact
      // line and column, which is both shorter and unambiguous to whoever — or
      // whatever — applies it on the other end.
      const at = row.edit.src.split(':').slice(-2).join(':')
      const what = row.component ? ` (${row.component})` : ''
      lines.push(`  ${n}. line ${at} — ${row.label}${what}${whereTo(row.edit)}`)
    }
    lines.push('')
  }

  if (rows.some((r) => isStructural(r.edit))) {
    lines.push('Apply them in this order; every line:col is a position in the file before any of them.')
  }
  lines.push('Please apply these, keeping to the design system (CLAUDE.md §2).')
  return lines.join('\n')
}

function whereTo(edit: Edit): string {
  if (edit.kind !== 'move') return ''
  const to = edit.to
  const [how, src] =
    'before' in to ? ['before', to.before] : 'after' in to ? ['after', to.after] : ['as the last child of', to.inside]
  return ` (${how} the element at line ${src.split(':').slice(-2).join(':')})`
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

/**
 * Write every pending edit. One press, one batch per file, one fast refresh.
 *
 * Each batch is applied ATOMICALLY: the backend checks the file's version,
 * verifies each edit against the syntax tree, and refuses the whole list on
 * the first mismatch. Refused batches stay staged — the overlay keeps showing
 * them and the designer can remove the offending line and try again, rather
 * than losing the rest of their work to one bad edit.
 *
 * Edits are grouped by FILE because a batch must name one file. That is not the
 * same as grouping by screen: a screen's rows often come from a component in
 * the project's `lib/`, whose elements are stamped with the lib file's path.
 *
 * Never reachable in record mode — there is no server to write through.
 */
export async function applyPending(): Promise<void> {
  if (pending.size === 0 || state.busy || state.mode !== 'write') return
  const batch = ordered()
  emit({ busy: true })

  const groups = new Map<string, [string, PendingEntry][]>()
  for (const row of batch) {
    const key = `${row[1].slug}|${fileOf(row[1].edit.src)}`
    groups.set(key, [...(groups.get(key) ?? []), row])
  }

  let error: DesignStoreState['error'] = null
  const undo: UndoEntry[] = []

  for (const group of groups.values()) {
    const entries = group.map(([, p]) => p)
    const { slug, screenId } = entries[0]
    const label = entries.length === 1 ? entries[0].label : `${entries.length} changes`

    const versions = new Set(entries.map((e) => e.version).filter(Boolean))
    if (versions.size > 1) {
      error = {
        label,
        reason:
          'Some of these were made before the screen last reloaded, so their positions are out of date. Remove them and make them again.',
      }
      continue
    }

    const res = await devSink({
      slug,
      screenId,
      version: [...versions][0],
      edits: entries.map((e) => e.edit),
    })

    if (res.ok) {
      for (const [key] of group) pending.delete(key)
      if (res.undo) undo.push({ slug, token: res.undo, label })
    } else {
      error = { label, reason: res.reason }
    }
  }

  emit({ busy: false, error, undo: [...state.undo, ...undo] })
  onFlushed?.()
}

/** Put the file back as it was before the newest Apply. */
export async function undoLast(): Promise<void> {
  const entry = state.undo[state.undo.length - 1]
  if (!entry || state.busy) return
  emit({ busy: true, undo: state.undo.slice(0, -1) })
  const res = await devSink({ slug: entry.slug, undo: entry.token })
  emit({
    busy: false,
    error: res.ok ? null : { label: `undo ${entry.label}`, reason: res.reason },
  })
  onFlushed?.()
}

export function clearDesignError() {
  emit({ error: null })
}
