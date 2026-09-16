// =============================================================================
// Design · the pending-edit store.
//
// NOTHING writes on its own. Every tweak — class, text, prop, stack layout, and
// every move, delete, duplicate, insert, wrap and unwrap — stages into a
// pending list, the optimistic layer shows it live, and the file writes happen only when the designer
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
// Where WRITE goes depends on where the studio is running (GET /api/design):
//
//   • `fs` — the dev server writes the working copy. Written edits leave the
//     list; undo is one step per Apply press, by a snapshot the backend kept
//     and restores only while the file is still what that write produced.
//   • `github` — a deployment with the studio's GitHub App (D4). The deployed
//     screen never changes, so written edits STAY on the list, marked
//     applied, and the overlay keeps drawing them. Every Apply re-sends a
//     file's whole list, which the backend rebuilds from the deployed copy;
//     undo is "drop the entry and apply again". Push opens the change. The
//     list is kept per deployment (by build SHA) and survives a reload.
//
// Before Apply, undo just unstages the last-touched change.
// =============================================================================

import type { Layout } from './layout'
import {
  addressesOf,
  type DesignPushRequest,
  type DesignStatus,
  isNewRef,
  isStructural,
  NEW_PREFIX,
  primaryAddress,
  type DesignRequest,
  type DesignResponse,
  type DesignUndoRequest,
  type Edit,
  type InsertEdit,
  type Place,
  type Src,
  type StructuralEdit,
  type WrapEdit,
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

export type Backend = DesignStatus['backend']

export interface PendingRow {
  key: string
  label: string
  screenId: string
  /** `github` only: written to the change branch already. */
  applied: boolean
}

export interface DesignStoreState {
  /** Staged edits, in staging order — on `github`, applied ones too. */
  pending: PendingRow[]
  /** Staged structural edits, in the order they apply — what the overlay draws. */
  structure: StructuralEdit[]
  /** Writes in flight. */
  busy: boolean
  /** Last refusal/failure, cleared by the next successful write. */
  error: { label: string; reason: string } | null
  undo: UndoEntry[]
  mode: SinkMode
  /** Where WRITE goes, once the route has said. */
  backend: Backend
  /** `github`: the deployment's build commit. */
  sha?: string
  /** The project's owners, for the name prompt. */
  owners: string[]
  /** Why this project can't be written from here at all. */
  locked?: string
  /** Who is editing, as the designer told the panel (`github`). */
  name: string | null
  /** `github`: this deployment's changes have been pushed. */
  pushed: boolean
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
  /** `github`: written to the change branch. */
  applied?: boolean
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

type Sink = (req: DesignRequest | DesignUndoRequest | DesignPushRequest) => Promise<DesignResponse>

const sink: Sink = async (req) => {
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

/** The dev server can write before the route has even answered; a
 *  deployment waits to hear whether it has a backend. */
const DEV = process.env.NODE_ENV === 'development'

const NAME_KEY = 'db.design.name'
function storedName(): string | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(NAME_KEY)
  } catch {
    return null
  }
}

let state: DesignStoreState = {
  pending: [],
  structure: [],
  busy: false,
  error: null,
  undo: [],
  mode: DEV ? 'write' : 'record',
  backend: DEV ? 'fs' : 'record',
  owners: [],
  name: null,
  pushed: false,
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
    pending: rows.map(([key, p]) => ({
      key,
      label: p.label,
      screenId: p.screenId,
      applied: Boolean(p.applied),
    })),
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
  backend: 'record',
  owners: [],
  name: null,
  pushed: false,
}
export function getDesignStoreServerSnapshot(): DesignStoreState {
  return serverSnapshot
}

/** Whether this person may write here, given what the route said. */
export function canWrite(s: DesignStoreState = state): boolean {
  if (s.backend === 'record' || s.locked) return false
  if (s.backend === 'fs') return true
  return Boolean(s.name && s.owners.some((o) => o.toLocaleLowerCase() === s.name!.toLocaleLowerCase()))
}

export function setSinkMode(mode: SinkMode) {
  if (mode === 'write' && !canWrite()) return
  if (state.mode === mode) return
  // Each mode has its own list; switching puts the current one away first.
  // The mode changes WITHOUT an emit, because every emit persists — an emit
  // here would save the emptied list over the one about to be read back.
  persist()
  pending.clear()
  state = { ...state, mode, error: null }
  loadFromStorage()
}

/** Remember who is editing, on this browser. */
export function setDesignerName(name: string | null) {
  try {
    if (name) window.localStorage.setItem(NAME_KEY, name)
    else window.localStorage.removeItem(NAME_KEY)
  } catch {
    // Not remembered; still used for this session.
  }
  state = { ...state, name }
  const mode: SinkMode = canWrite() ? 'write' : 'record'
  if (state.backend === 'github' && mode !== state.mode) setSinkMode(mode)
  else emit({})
}

/**
 * Ask the route where WRITE goes for this project, and settle the mode.
 * Called once per project by the panel.
 */
async function probe(slug: string) {
  let status: DesignStatus | null = null
  try {
    const res = await fetch(`/api/design?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
    if (res.ok) status = (await res.json()) as DesignStatus
  } catch {
    // No answer: stay as we are.
  }
  if (!status || storageSlug !== slug) return
  const settle = () => {
    const mode: SinkMode = canWrite() ? 'write' : 'record'
    if (mode !== state.mode) setSinkMode(mode)
    else emit({})
  }
  const next: DesignStoreState = {
    ...state,
    backend: status.backend,
    sha: status.sha,
    owners: status.owners,
    locked: status.locked,
    name: storedName(),
  }
  // Settled without an emit for the same reason as setSinkMode: the list's
  // storage key depends on these.
  state = next
  settle()
}

// --- surviving a refresh -----------------------------------------------------
//
// Only in record mode, and only because there is nowhere else for the work to
// live: a written edit is safe in a file, but a recorded one exists solely in
// this tab. A lead half an hour into a review must not lose it to a stray
// reload. Keyed per project so a whole pass across screens copies as one list.

const STORAGE_PREFIX = 'db.edit.changes.'
const GITHUB_PREFIX = 'db.design.github.'
let storageSlug: string | null = null

type StoredRow = Omit<PendingEntry, 'patched'> & { key: string }
interface GithubList {
  rows: StoredRow[]
  pushed: boolean
}

/** Where the current list lives, or null when it lives nowhere (fs writes). */
function storageKey(): string | null {
  if (!storageSlug) return null
  if (state.mode === 'record') return `${STORAGE_PREFIX}${storageSlug}`
  if (state.backend === 'github' && state.sha) return `${GITHUB_PREFIX}${storageSlug}.${state.sha}`
  return null
}

function persist() {
  const key = storageKey()
  if (!key) return
  try {
    const rows: StoredRow[] = ordered().map(([k, p]) => ({
      key: k,
      slug: p.slug,
      screenId: p.screenId,
      edit: p.edit,
      component: p.component,
      label: p.label,
      version: p.version,
      seq: p.seq,
      applied: p.applied,
    }))
    if (state.mode === 'record') {
      if (rows.length === 0) window.localStorage.removeItem(key)
      else window.localStorage.setItem(key, JSON.stringify(rows))
    } else if (rows.length === 0 && !state.pushed) {
      window.localStorage.removeItem(key)
    } else {
      window.localStorage.setItem(key, JSON.stringify({ rows, pushed: state.pushed } satisfies GithubList))
    }
  } catch {
    // A full or disabled localStorage costs persistence, not the session.
  }
}

/** Point the store at a project, reading back what is there and asking the
 *  route where WRITE goes. Called by the panel once it knows the project. */
export function restoreChanges(slug: string) {
  if (storageSlug === slug) return
  storageSlug = slug
  pending.clear()
  state = { ...state, pushed: false, undo: [] }
  loadFromStorage()
  void probe(slug)
}

/** Read the current list back from where it lives. Always emits. */
function loadFromStorage() {
  const key = storageKey()
  if (!key) {
    emit({ pushed: false })
    return
  }
  try {
    const raw = window.localStorage.getItem(key)
    let pushed = false
    if (raw) {
      const parsed = JSON.parse(raw) as StoredRow[] | GithubList
      const rows = Array.isArray(parsed) ? parsed : parsed.rows
      pushed = !Array.isArray(parsed) && parsed.pushed
      for (const { key: k, ...row } of rows) {
        // Restored entries are listed but NOT on the DOM — the screen they
        // belong to may not even be mounted.
        pending.set(k, { ...row, patched: false })
        seq = Math.max(seq, row.seq)
      }
    }
    if (state.backend === 'github') forgetOtherDeployments()
    emit({ pushed })
  } catch {
    // Unreadable storage is treated as no storage.
    emit({ pushed: false })
  }
}

/** A list from an earlier deployment is spent: either it landed, or it was
 *  never pushed and its positions no longer match anything. */
function forgetOtherDeployments() {
  if (!storageSlug || !state.sha) return
  const prefix = `${GITHUB_PREFIX}${storageSlug}.`
  const keep = `${prefix}${state.sha}`
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(prefix) && k !== keep) window.localStorage.removeItem(k)
    }
  } catch {
    // Harmless to leave.
  }
}

export function setOnFlushed(cb: (() => void) | null) {
  onFlushed = cb
}

/** The repo-relative file an address points into. */
export function fileOf(src: Src): string {
  return src.split(':').slice(0, -2).join(':')
}

/**
 * The file an edit lands in. An edit that only names elements created in the
 * same list (`new:<id>`) lands wherever the element that created them does.
 */
export function fileOfEdit(edit: Edit, seen = new Set<string>()): string {
  for (const src of addressesOf(edit)) {
    if (!isNewRef(src)) return fileOf(src)
    const id = src.slice(NEW_PREFIX.length)
    if (seen.has(id)) continue
    seen.add(id)
    const maker = creatorOf(id)
    if (maker) return fileOfEdit(maker, seen)
  }
  return ''
}

function creatorOf(id: string): InsertEdit | WrapEdit | undefined {
  for (const p of pending.values()) {
    if ((p.edit.kind === 'insert' || p.edit.kind === 'wrap') && p.edit.id === id) return p.edit
  }
  return undefined
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
  if (state.pushed) return
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
  if (state.pushed) return
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
  if (state.pushed) return
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
  if (state.pushed) return
  if (edit.kind === 'delete') pending.delete(`move|${edit.src}`)
  const key =
    edit.kind === 'move'
      ? `move|${edit.src}`
      : edit.kind === 'delete'
        ? `delete|${edit.src}`
        : edit.kind === 'duplicate'
          ? `duplicate|${edit.src}|${seq + 1}`
          : edit.kind === 'unwrap'
            ? `unwrap|${edit.src}`
            : `${edit.kind}|${edit.id}`
  pending.delete(key)
  pending.set(key, { ...ctx, edit, label, seq: ++seq, patched: true })
  emit({})
}

/** A fresh id for an element this list creates — short, and unique here. */
export function newId(): string {
  return `n${(++seq).toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Change a staged insert or wrap in place — how a new element is edited, since
 * it has no address of its own to aim a value edit at. Keeps its place in the
 * order, so what was put inside it stays inside it.
 */
export function updateNew(id: string, patch: (edit: InsertEdit | WrapEdit) => InsertEdit | WrapEdit) {
  for (const [key, p] of pending) {
    if ((p.edit.kind === 'insert' || p.edit.kind === 'wrap') && p.edit.id === id) {
      pending.set(key, { ...p, edit: patch(p.edit) })
      emit({})
      return
    }
  }
}

/** The staged insert or wrap that creates `id`. */
export function newEdit(id: string): InsertEdit | WrapEdit | undefined {
  return creatorOf(id)
}

/**
 * Remove a new element, and everything staged that depends on it — whatever
 * was inserted into it, moved beside it, or wrapped with it. Returns what was
 * removed, so value patches can be reverted.
 */
export function removeNew(id: string): Unstaged[] {
  const gone = new Set([id])
  const removed: Unstaged[] = []
  const touched = new Set<string>()
  let changed = true
  while (changed) {
    changed = false
    for (const [key, p] of ordered()) {
      const e = p.edit
      const makes = (e.kind === 'insert' || e.kind === 'wrap') && gone.has(e.id)
      const uses = addressesOf(e).some((src) => isNewRef(src) && gone.has(src.slice(NEW_PREFIX.length)))
      if (makes || uses) {
        if (p.applied) touched.add(fileOfEdit(p.edit))
        pending.delete(key)
        removed.push({ edit: e, component: p.component })
        if (e.kind === 'insert' || e.kind === 'wrap') gone.add(e.id)
        changed = true
      }
    }
  }
  emit({})
  for (const file of touched) void rewrite(file)
  return removed
}

/**
 * Stage a stack's layout. One entry per element: stepping the gap twice keeps
 * the layout the file really has as `old`, and stepping back to it drops the
 * entry.
 */
export function stageStackEdit(ctx: StageContext, src: Src, old: Layout, next: Layout, label: string) {
  if (state.pushed) return
  const key = `stack|${src}`
  const existing = pending.get(key)
  const original = existing && existing.edit.kind === 'stack' ? existing.edit.old : old
  const same =
    original.direction === next.direction &&
    original.gap === next.gap &&
    original.align === next.align &&
    original.justify === next.justify
  if (same) pending.delete(key)
  else {
    pending.set(key, {
      ...ctx,
      edit: { kind: 'stack', src, old: original, next },
      label,
      seq: existing?.seq ?? ++seq,
      patched: true,
    })
  }
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
  if (!entry || state.pushed) return null
  pending.delete(key)
  emit({})
  // Taken back after it was written: the branch has to be rebuilt without it.
  if (entry.applied) void rewrite(fileOfEdit(entry.edit), entry)
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
  const out: Unstaged[] = ordered().map(([, p]) => ({ edit: p.edit, component: p.component }))
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
    const file = fileOfEdit(row.edit)
    if (!files.includes(file)) files.push(file)
  }

  let n = 0
  for (const file of files) {
    const inFile = rows.filter((r) => fileOfEdit(r.edit) === file)
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
      const what = row.component ? ` (${row.component})` : ''
      lines.push(`  ${n}. ${where(primaryAddress(row.edit))} — ${row.label}${what}${whereTo(row.edit)}`)
    }
    lines.push('')
  }

  if (rows.some((r) => isStructural(r.edit))) {
    lines.push('Apply them in this order; every line:col is a position in the file before any of them.')
  }
  lines.push('Please apply these, keeping to the design system (CLAUDE.md §2).')
  return lines.join('\n')
}

/** A position as a reader wants it: `line 12:6`, or the new element's name. */
function where(src: Src): string {
  if (isNewRef(src)) return `new element ${src.slice(NEW_PREFIX.length)}`
  return `line ${src.split(':').slice(-2).join(':')}`
}

function whereTo(edit: Edit): string {
  if (edit.kind === 'insert') {
    const props = Object.entries(edit.props)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ')
    const what = `${edit.icon ?? edit.item}${props ? ` ${props}` : ''}${edit.text ? ` “${edit.text}”` : ''}`
    return ` (${what}; ${placeText(edit.to)}; call it ${edit.id})`
  }
  if (edit.kind === 'wrap') {
    return ` (${edit.srcs.map(where).join(', ')} into a div className="${edit.className}"; call it ${edit.id})`
  }
  if (edit.kind === 'stack') {
    const show = (l: Layout) =>
      `${l.direction ?? 'not flex'}, gap ${l.gap ?? 'none'}, align ${l.align ?? '—'}, justify ${l.justify ?? '—'}`
    return ` (${show(edit.old)} → ${show(edit.next)})`
  }
  if (edit.kind !== 'move') return ''
  return ` (${placeText(edit.to)})`
}

function placeText(to: Place): string {
  if ('before' in to) return `before the element at ${where(to.before)}`
  if ('after' in to) return `after the element at ${where(to.after)}`
  return `as the last child of the element at ${where(to.inside)}`
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
 * Write every pending edit. One press, one batch per file.
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
 * On `fs` a batch is the file's pending edits, and written ones leave the
 * list. On `github` it is EVERY edit for the file, applied or not — the
 * backend rebuilds the file from the deployed copy — and they stay, marked.
 *
 * Never reachable in record mode — there is nowhere to write.
 */
export async function applyPending(): Promise<void> {
  if (state.busy || state.mode !== 'write' || state.pushed) return
  const rows = ordered().filter(([, p]) => !p.applied)
  if (rows.length === 0) return
  emit({ busy: true })

  const files: string[] = []
  for (const [, p] of rows) {
    const f = fileOfEdit(p.edit)
    if (!files.includes(f)) files.push(f)
  }

  let error: DesignStoreState['error'] = null
  const undo: UndoEntry[] = []

  for (const file of files) {
    const group = ordered().filter(
      ([, p]) => fileOfEdit(p.edit) === file && (state.backend === 'github' || !p.applied),
    )
    const outcome = await send(file, group)
    if ('reason' in outcome) {
      error = outcome
      continue
    }
    for (const [key, p] of group) {
      if (state.backend === 'github') pending.set(key, { ...p, applied: true })
      else pending.delete(key)
    }
    if (outcome.undo) undo.push(outcome.undo)
  }

  emit({ busy: false, error, undo: [...state.undo, ...undo] })
  onFlushed?.()
}

type Outcome = { undo?: UndoEntry } | { label: string; reason: string }

async function send(file: string, group: [string, PendingEntry][], taken?: PendingEntry): Promise<Outcome> {
  const entries = group.map(([, p]) => p)
  const first = entries[0] ?? taken
  if (!first) return {}
  const { slug, screenId } = first
  const label = taken
    ? `undo ${taken.label}`
    : entries.length === 1
      ? entries[0].label
      : `${entries.length} changes`

  const versions = new Set([...entries, ...(taken ? [taken] : [])].map((e) => e.version).filter(Boolean))
  if (versions.size > 1) {
    return {
      label,
      reason:
        'Some of these were made before the screen last reloaded, so their positions are out of date. Remove them and make them again.',
    }
  }

  const res = await sink({
    slug,
    screenId,
    version: [...versions][0],
    edits: entries.map((e) => e.edit),
    file,
    name: state.backend === 'github' ? (state.name ?? undefined) : undefined,
  })
  if (!res.ok) return { label, reason: res.reason }
  return 'undo' in res && res.undo ? { undo: { slug, token: res.undo, label } } : {}
}

/**
 * `github`: rebuild one file on the branch from what is left of its list,
 * after an applied entry was taken back. An empty list puts the deployed copy
 * back.
 */
async function rewrite(file: string, taken?: PendingEntry) {
  if (state.backend !== 'github' || state.mode !== 'write') return
  emit({ busy: true })
  const group = ordered().filter(([, p]) => p.applied && fileOfEdit(p.edit) === file)
  const outcome = await send(file, group, taken)
  emit({ busy: false, error: 'reason' in outcome ? outcome : null })
}

/**
 * Take back the newest change.
 *
 * `fs`: put the file back as it was before the newest Apply. `github`: drop the
 * newest entry, applied or not, and rebuild its file if it had been written.
 */
export async function undoLast(): Promise<void> {
  if (state.busy) return
  if (state.backend === 'github') {
    unstageLast()
    return
  }
  const entry = state.undo[state.undo.length - 1]
  if (!entry) return
  emit({ busy: true, undo: state.undo.slice(0, -1) })
  const res = await sink({ slug: entry.slug, undo: entry.token })
  emit({
    busy: false,
    error: res.ok ? null : { label: `undo ${entry.label}`, reason: res.reason },
  })
  onFlushed?.()
}

/**
 * `github`: open this deployment's change and let it land itself. Everything
 * must be applied first. Afterwards the list is kept, and kept on screen,
 * until the next deployment brings the change in for real.
 */
export async function pushChanges(): Promise<void> {
  if (state.busy || state.backend !== 'github' || state.pushed || !state.name || !storageSlug) return
  const rows = ordered()
  if (rows.length === 0 || rows.some(([, p]) => !p.applied)) return
  emit({ busy: true })
  const res = await sink({ slug: storageSlug, push: true, name: state.name })
  emit({
    busy: false,
    pushed: res.ok,
    error: res.ok ? null : { label: 'the push', reason: res.reason },
  })
}

/** Every staged value edit, for re-painting a screen that re-rendered. */
export function valueEdits(): { edit: Edit; component?: string }[] {
  return ordered().flatMap(([, p]) => (isStructural(p.edit) ? [] : [{ edit: p.edit, component: p.component }]))
}

export function clearDesignError() {
  emit({ error: null })
}
