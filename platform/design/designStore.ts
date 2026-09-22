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
// There is ONE list, and two things it can be spent on. It can always be
// copied out as a description of the changes, for someone else to apply. And
// where the studio can write (GET /api/design says where), it can be written:
//
//   • `fs` — the dev server writes the working copy (Save). Written edits
//     leave the list; undo is one step per Save press, by a snapshot the
//     backend kept and restores only while the file is still what that write
//     produced.
//   • `github` — a deployment with the studio's GitHub App (D4). Push writes
//     the list to a change branch and opens the change, in one press. The
//     deployed screen never changes, so written edits STAY on the list, marked
//     applied, and the overlay keeps drawing them. Every write re-sends a
//     file's whole list, which the backend rebuilds from the deployed copy;
//     taking an entry back is "drop it and write again".
//   • `record` — a deployment with nothing that could write: copying is all
//     there is. The alternative is a panel that appears to save and silently
//     loses everything on refresh.
//
// Whether THIS person may write — the editing password, and being an owner —
// is asked at the moment they press Push, never before: the list they made
// while looking around is the list they push. It survives a reload, per
// project, whichever backend it is headed for.
// =============================================================================

import { sameLayout, type Layout } from './layout'
import {
  addressesOf,
  type DesignCheckRequest,
  type DesignPushRequest,
  type DesignStatus,
  isNewRef,
  isStructural,
  NEW_PREFIX,
  primaryAddress,
  type DesignRequest,
  type DesignResponse,
  type DesignUndoRequest,
  type DesignUnlockRequest,
  type Edit,
  type InsertEdit,
  type Place,
  type Src,
  type Staged,
  type StructuralEdit,
  type WrapEdit,
} from './protocol'

export interface UndoEntry {
  slug: string
  /** Backend handle for the pre-write file. */
  token: string
  /** Human line for the panel, phrased forward. */
  label: string
  /** How many changes that write carried — what "Revert N changes" counts. */
  count: number
}

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
  /** Structural edits in the order they apply — what the overlay draws. */
  structure: Staged[]
  /** Writes in flight. */
  busy: boolean
  /** Last refusal/failure, cleared by the next successful write. `title`
   *  replaces the footer's "Couldn't apply …" when that isn't what happened. */
  error: { label: string; reason: string; title?: string } | null
  undo: UndoEntry[]
  /** Where a write goes, once the route has said. */
  backend: Backend
  /** `github`: the deployment's build commit. */
  sha?: string
  /** The project's owners, for the name prompt. */
  owners: string[]
  /** Why this project can't be written from here at all. */
  locked?: string
  /** `github`: this browser hasn't entered the editing password yet. */
  needsPassword?: boolean
  /** Who is editing, as the designer told the panel (`github`). */
  name: string | null
  /** `github`: this deployment's changes have been pushed. */
  pushed: boolean
  /** `github`: the pushed change has landed on main; the next deployment
   *  brings it in. */
  landed: boolean
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

type Sink = (
  req: DesignRequest | DesignUndoRequest | DesignPushRequest | DesignCheckRequest | DesignUnlockRequest,
) => Promise<DesignResponse>

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
  backend: DEV ? 'fs' : 'record',
  owners: [],
  name: null,
  pushed: false,
  landed: false,
}
const pending = new Map<string, PendingEntry>()
const listeners = new Set<() => void>()
/** Fires after every settled write batch — the panel uses it to re-pin. */
let onFlushed: (() => void) | null = null

const ordered = () => Array.from(pending.entries()).sort((a, b) => a[1].seq - b[1].seq)

/**
 * `fs`: structure just written, still drawn until the screen reloads.
 *
 * Between a write and the fast refresh that shows it, the page still has the
 * old markup; without these the moved card would jump back for that beat and
 * read as the write having failed. They carry the OLD version, so the moment
 * the reload restamps the file the overlay stops drawing them by itself —
 * the time limit only tidies the list.
 */
let settling: (Staged & { until: number })[] = []
const SETTLE_MS = 10_000

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
    structure: [
      ...settling.filter((x) => x.until > Date.now()),
      ...rows.flatMap(([, p]) => (isStructural(p.edit) ? [{ edit: p.edit, version: p.version }] : [])),
    ],
  }
  listeners.forEach((l) => l())
  persist()
  watchPush()
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
  backend: 'record',
  owners: [],
  name: null,
  pushed: false,
  landed: false,
}
export function getDesignStoreServerSnapshot(): DesignStoreState {
  return serverSnapshot
}

/** Whether this studio can write this project at all — the button exists. */
export function canSave(s: DesignStoreState = state): boolean {
  return s.backend !== 'record' && !s.locked
}

/** Whether this person may write here right now, given what the route said. */
export function canWrite(s: DesignStoreState = state): boolean {
  if (!canSave(s) || s.needsPassword) return false
  if (s.backend === 'fs') return true
  return Boolean(s.name && s.owners.some((o) => o.toLocaleLowerCase() === s.name!.toLocaleLowerCase()))
}

/** Remember who is editing, on this browser. */
export function setDesignerName(name: string | null) {
  try {
    if (name) window.localStorage.setItem(NAME_KEY, name)
    else window.localStorage.removeItem(NAME_KEY)
  } catch {
    // Not remembered; still used for this session.
  }
  emit({ name })
}

/**
 * Enter the editing password. Returns why it failed, or null once this
 * browser may save — the route has set a cookie that lasts 30 days. The list
 * is untouched either way.
 */
export async function unlockEditing(password: string): Promise<string | null> {
  if (!storageSlug) return 'Open a project first.'
  const res = await sink({ slug: storageSlug, unlock: password })
  if (!res.ok) return res.reason
  emit({ needsPassword: false })
  return null
}

/**
 * Ask the route where a write goes for this project. Called once per project
 * by the panel.
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
  state = {
    ...state,
    backend: status.backend,
    sha: status.sha,
    owners: status.owners,
    locked: status.locked,
    needsPassword: status.needsPassword,
    name: storedName(),
  }
  if (status.backend === 'github') settleDeployment()
  emit({})
}

// --- surviving a refresh -----------------------------------------------------
//
// The list lives in this tab until it is written — and on the link, a written
// list is still the only record of what the branch holds — so it is kept in
// localStorage, per project. A lead half an hour into a review must not lose
// it to a stray reload, and a whole pass across screens copies as one list.

const STORAGE_PREFIX = 'db.edit.changes.'
/** Before there was one list, the link kept its written list apart, per build. */
const LEGACY_GITHUB_PREFIX = 'db.design.github.'
let storageSlug: string | null = null
/** `github`: the build the stored list was written against, as read back. */
let storedSha: string | undefined

type StoredRow = Omit<PendingEntry, 'patched'> & { key: string }
interface StoredList {
  rows: StoredRow[]
  pushed: boolean
  /** `github`: the build the applied rows were written against. */
  sha?: string
}

const storageKey = () => (storageSlug ? `${STORAGE_PREFIX}${storageSlug}` : null)

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
    if (rows.length === 0 && !state.pushed) window.localStorage.removeItem(key)
    else {
      const list: StoredList = { rows, pushed: state.pushed, sha: state.sha ?? storedSha }
      window.localStorage.setItem(key, JSON.stringify(list))
    }
  } catch {
    // A full or disabled localStorage costs persistence, not the session.
  }
}

/** Point the store at a project, reading back what is there and asking the
 *  route where a write goes. Called by the panel once it knows the project. */
export function restoreChanges(slug: string) {
  if (storageSlug === slug) return
  storageSlug = slug
  pending.clear()
  state = { ...state, pushed: false, landed: false, undo: [] }
  storedSha = undefined
  const list = readList(storageKey())
  if (list) {
    addRows(list.rows)
    storedSha = list.sha
    state = { ...state, pushed: list.pushed }
  }
  emit({})
  void probe(slug)
}

function readList(key: string | null): StoredList | null {
  if (!key) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredRow[] | StoredList
    return Array.isArray(parsed) ? { rows: parsed, pushed: false } : parsed
  } catch {
    // Unreadable storage is treated as no storage.
    return null
  }
}

function addRows(rows: StoredRow[]) {
  for (const { key: k, ...row } of rows) {
    // What is already staged here is newer, and already painted.
    if (pending.has(k)) continue
    // Restored entries are listed but NOT on the DOM — the screen they
    // belong to may not even be mounted.
    pending.set(k, { ...row, patched: false })
    seq = Math.max(seq, row.seq)
  }
}

/**
 * `github`, once the build is known: a list written against an earlier build
 * is spent — either it landed, or it was never pushed and that branch is
 * gone with its build. What was never written is still good to push. Also
 * folds in the list an older studio kept apart for this build.
 */
function settleDeployment() {
  if (!storageSlug || !state.sha) return
  const prefix = `${LEGACY_GITHUB_PREFIX}${storageSlug}.`
  try {
    const legacy = readList(`${prefix}${state.sha}`)
    if (legacy) {
      addRows(legacy.rows)
      if (legacy.pushed) state = { ...state, pushed: true }
      storedSha = state.sha
    }
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith(prefix)) window.localStorage.removeItem(k)
    }
  } catch {
    // Harmless to leave.
  }
  if (storedSha && storedSha !== state.sha) {
    for (const [k, p] of pending) if (p.applied) pending.delete(k)
    state = { ...state, pushed: false }
  }
  storedSha = state.sha
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
  if (sameLayout(original, next)) pending.delete(key)
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
      `${l.direction ?? 'not flex'}, gap ${l.gap ?? 'none'}, align ${l.align ?? '—'}, justify ${l.justify ?? '—'}${
        l.padX !== undefined || l.padY !== undefined ? `, padding ${l.padX ?? '0'}/${l.padY ?? '0'}` : ''
      }${l.clip !== undefined ? `, ${l.clip ? 'clipped' : 'not clipped'}` : ''}${
        l.sizing !== undefined ? `, size ${l.sizing.join(' ') || 'default'}` : ''
      }`
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
 * Write every pending edit — Save on the dev server, the first half of Push on
 * the link. One press, one batch per file.
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
 * Returns whether everything was written.
 */
export async function applyPending(): Promise<boolean> {
  if (state.busy || !canWrite() || state.pushed) return false
  const rows = ordered().filter(([, p]) => !p.applied)
  if (rows.length === 0) return true
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
    const now = Date.now()
    settling = settling.filter((x) => x.until > now)
    for (const [key, p] of group) {
      if (state.backend === 'github') pending.set(key, { ...p, applied: true })
      else {
        pending.delete(key)
        if (isStructural(p.edit)) settling.push({ edit: p.edit, version: p.version, until: now + SETTLE_MS })
      }
    }
    if (outcome.undo) undo.push(outcome.undo)
  }

  emit({ busy: false, error, undo: [...state.undo, ...undo] })
  onFlushed?.()
  // Drop the settled structure from the published list once it has expired.
  if (settling.length > 0) setTimeout(() => emit({}), SETTLE_MS + 50)
  return error === null
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
  return 'undo' in res && res.undo ? { undo: { slug, token: res.undo, label, count: entries.length } } : {}
}

/**
 * `github`: rebuild one file on the branch from what is left of its list,
 * after an applied entry was taken back. An empty list puts the deployed copy
 * back.
 */
async function rewrite(file: string, taken?: PendingEntry) {
  if (state.backend !== 'github' || !canWrite()) return
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
  // The file goes back to the version the settling moves were read under;
  // drawn again, they would show a move that was just taken back.
  if (res.ok) settling = []
  emit({
    busy: false,
    error: res.ok ? null : { label: `undo ${entry.label}`, reason: res.reason },
  })
  onFlushed?.()
}

/**
 * `github`: write whatever isn't written yet, then open this deployment's
 * change and let it land itself — one press. A write that is refused stops
 * it before anything is opened. Afterwards the list is kept, and kept on
 * screen, until the next deployment brings the change in for real.
 */
export async function pushChanges(): Promise<void> {
  if (state.busy || state.backend !== 'github' || state.pushed || !state.name || !storageSlug) return
  if (!(await applyPending())) return
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

/** How many changes Revert would take back: the list, and on the dev server
 *  what was saved from it too. */
export function revertableCount(s: DesignStoreState = state): number {
  if (s.pushed) return 0
  return s.pending.length + (s.backend === 'fs' ? s.undo.reduce((n, u) => n + u.count, 0) : 0)
}

/**
 * Take back every change — the list, and whatever was written from it: on the
 * link the branch's files go back to the deployed copy, on the dev server each
 * Save is undone, newest first. Returns what was unstaged, so the caller can
 * revert the optimistic patches.
 */
export function revertAll(): Unstaged[] {
  if (state.busy || state.pushed) return []
  const rows = ordered()
  const written = new Map<string, PendingEntry>()
  for (const [, p] of rows) if (p.applied) written.set(fileOfEdit(p.edit), p)
  pending.clear()
  const out = rows.map(([, p]) => ({ edit: p.edit, component: p.component }))
  emit({ error: null })
  if (state.backend === 'github') {
    void rewriteAll(written)
  } else if (state.backend === 'fs' && state.undo.length > 0) {
    void undoAllSaves()
  }
  return out
}

/** One file at a time: every write moves the same branch. */
async function rewriteAll(written: Map<string, PendingEntry>) {
  for (const [file, taken] of written) await rewrite(file, taken)
}

async function undoAllSaves() {
  while (state.undo.length > 0 && !state.error) await undoLast()
}

// --- after Push ----------------------------------------------------------------
//
// A pushed change lands only once CI is green. Until it has, the panel asks
// where it has got to: a change that fails a check hands the list back with
// the reason, instead of saying "on its way" until someone wonders why it
// never arrived.

const WATCH_MS = 30_000
let watching: ReturnType<typeof setTimeout> | null = null
let lastCheck = 0

const didntGoLive = (reason: string) => ({ label: 'the push', title: 'Your push didn’t go live', reason })

/** Keep exactly one check scheduled while a push is on its way. Runs after
 *  every emit, so it follows the state rather than being called at each
 *  place that changes it. */
function watchPush() {
  const due = state.backend === 'github' && state.pushed && !state.landed && Boolean(state.name && storageSlug)
  if (!due) {
    if (watching) clearTimeout(watching)
    watching = null
    return
  }
  if (watching) return
  // The first check after a reload runs at once: a push that failed an hour
  // ago should say so now, not in thirty seconds.
  watching = setTimeout(() => void checkPush(), Math.max(0, lastCheck + WATCH_MS - Date.now()))
}

async function checkPush() {
  const slug = storageSlug
  const name = state.name
  if (!slug || !name) return
  const res = await sink({ slug, check: true, name })
  lastCheck = Date.now()
  watching = null
  // The project or the push changed while asking: this answer is about
  // something else. emit() schedules the next check if one is due.
  if (slug !== storageSlug || !state.pushed || !res.ok || !('change' in res)) {
    emit({})
    return
  }
  if (res.change === 'landed') emit({ landed: true })
  else if (res.change === 'failed')
    emit({
      pushed: false,
      error: didntGoLive(
        'One of the studio’s checks failed on it, so it stopped before going live. Your changes are still saved here — adjust them and push again, or copy them for your agent.',
      ),
    })
  else if (res.change === 'closed' || res.change === 'none')
    emit({
      pushed: false,
      error: didntGoLive('It was stopped before it went live. Your changes are still saved here — push again when you’re ready.'),
    })
  else emit({})
}

/** Every staged value edit, for re-painting a screen that re-rendered. */
export function valueEdits(): { edit: Edit; component?: string }[] {
  return ordered().flatMap(([, p]) => (isStructural(p.edit) ? [] : [{ edit: p.edit, component: p.component }]))
}

export function clearDesignError() {
  emit({ error: null })
}
