// =============================================================================
// Design · edit protocol v2 — addressed by node, applied on the syntax tree.
//
// The difference from the v1 protocol this replaces:
// that protocol found a JSX element by what it LOOKS LIKE (its class list, tie-
// broken on rendered text) and refused whenever that matched more than one
// place. Sound for swapping `gap-12` → `gap-16`; useless for "move this node",
// which has to name a specific node and nothing else.
//
// Here every edit carries a `src` — `<file>:<line>:<col>`, the position of the
// element's opening tag, stamped into the DOM at build time by `stamp.cjs`. The
// address is exact, so structural edits become expressible (D2). What carries
// over unchanged is the guardrail: an edit also names the OLD value, and the
// server applies it only when the old value is really there. Refuse, don't
// guess — a wrong-line write is strictly worse than no write.
//
// D1a implemented `class`, `text` and `prop`. D2 adds the structural kinds —
// `move`, `delete`, `duplicate` — into the same union.
//
// Structural edits change line numbers, so an address is only meaningful
// against the exact file it was read from. Every batch therefore also carries
// the file's `version` (see DesignRequest), and a batch read from an older
// version is refused whole rather than resolved against a file that has moved
// underneath it.
// =============================================================================

import type { Layout } from './layout'

/**
 * Where a node is in its source file: `<file>:<line>:<col>`.
 *
 * `file` is repo-relative and POSIX-separated (`projects/x/screens/home.tsx`).
 * `line` is 1-based and `col` is 0-based — Babel's own convention, used on both
 * sides so the loader that writes the address and the parser that resolves it
 * cannot disagree about it.
 */
export type Src = string

/** Swap one token class for another on the addressed node. */
export interface ClassEdit {
  kind: 'class'
  src: Src
  oldClass: string
  newClass: string
}

/** Replace the addressed node's text child. */
export interface TextEdit {
  kind: 'text'
  src: Src
  old: string
  next: string
}

/**
 * Change, introduce, or remove a prop on the addressed node.
 *
 * `old` is `null` when the prop is expected to be absent — which is how adding
 * one stays verifiable rather than becoming a blind write. `next` is `null` to
 * remove it, which is what makes the inverse of an add expressible: without it,
 * adding a prop would be the one edit in the protocol that could not be undone.
 */
export interface PropEdit {
  kind: 'prop'
  src: Src
  prop: string
  old: string | null
  next: string | null
  /**
   * How the value is written: a string (`label="…"`, the default), a number
   * (`count={3}`) or a boolean (`active={true}`). `old` and `next` carry it
   * as text either way.
   */
  type?: 'string' | 'number' | 'boolean'
}

/**
 * Where a moved node lands, named by a neighbour rather than an index.
 *
 * The plan specified `fromIndex`/`toIndex`. An index is a count over the JSX
 * children array, which the client cannot see: whitespace text, `{cond && …}`
 * and fragments are all children in source and invisible in the DOM. A
 * neighbour's address is something the client does have, and "before that
 * card" survives any number of intervening whitespace nodes.
 *
 * `inside` appends as the container's last child — the drop onto an empty
 * container, or onto a container's body rather than between its children.
 */
export type Place = { before: Src } | { after: Src } | { inside: Src }

/**
 * What a structural edit picks up, beyond a node written straight among its
 * parent's children:
 *
 *   • a node SHOWN BY A CONDITION (`{open ? <Sheet /> : null}`, `{a && <B />}`)
 *     is moved and copied together with its condition — the whole `{…}` — so
 *     it keeps showing exactly when it did. Deleting it takes away only the
 *     state it was selected in: its branch becomes `null`.
 *   • a ROW OF A LIST (`{items.map((i) => <Row … />)}`) is moved, copied or
 *     deleted only as the whole list, and only when the edit says so with
 *     `scope: 'list'`. Every row comes from one line; without the scope the
 *     edit is refused rather than read as "this row".
 *
 * Anchors follow the same rule: "before" a conditional node or a list is
 * before its whole `{…}`.
 */
export type Scope = 'list'

/**
 * Move the addressed node. Reorder is a move whose anchor is a sibling.
 *
 * Verifies: the node sits among its parent's JSX children — directly, by a
 * condition, or (with `scope: 'list'`) as a list — the anchor does too, the
 * anchor is not inside what moves, and an `inside` target can hold children.
 */
export interface MoveEdit {
  kind: 'move'
  src: Src
  to: Place
  scope?: Scope
}

/** Remove the addressed node — see Scope for a condition's or a list's. */
export interface DeleteEdit {
  kind: 'delete'
  src: Src
  scope?: Scope
}

/**
 * Insert a copy of the addressed node directly after it.
 *
 * The copy has no address until the file is written and the screen reloads,
 * so no later edit in the same batch can name it — which is also why the
 * overlay draws copies without a `data-src`.
 */
export interface DuplicateEdit {
  kind: 'duplicate'
  src: Src
  scope?: Scope
}

// --- D3: stacks and insert ----------------------------------------------------
//
// An element added in this batch has no position in the file yet, so it is
// named `new:<id>` — the id its insert or wrap edit chose. Anywhere a `Place`
// takes an address it also takes one of these, which is what lets a designer
// build a row and fill it before anything is written.

/** `new:<id>` — an element created earlier in the same batch. */
export const NEW_PREFIX = 'new:'
export const isNewRef = (src: string) => src.startsWith(NEW_PREFIX)

/**
 * Add an element from the Insert catalog (catalog.ts).
 *
 * Verifies: the item exists, every prop is one the item declares (or
 * `className`) with a value the panel could have produced, and the place can
 * take it. The backend adds the import the element needs.
 */
export interface InsertEdit {
  kind: 'insert'
  id: string
  to: Place
  /** Catalog key, e.g. `button`. */
  item: string
  /** For the `icon` item: which icon. */
  icon?: string
  props: Record<string, string>
  text?: string
}

/**
 * Wrap consecutive siblings in a new stack — a `div` carrying `className`.
 *
 * A plain `div` rather than a Stack primitive: it adds no import, reads like
 * the markup the agent writes, and the stack knobs edit it like any other.
 * Verifies: every node sits directly in the same parent, in this order, with
 * nothing but line breaks between them.
 */
export interface WrapEdit {
  kind: 'wrap'
  id: string
  srcs: Src[]
  className: string
}

/**
 * Replace a wrapper with its children. Verifies: a plain `div` whose only
 * attribute is a literal `className` — anything else carries meaning that
 * would be lost with it.
 */
export interface UnwrapEdit {
  kind: 'unwrap'
  src: Src
}

/**
 * Set a stack's direction, gap, alignment, justification, padding and clipping
 * (layout.ts).
 * A value edit: verifies the element's literal className reads as `old`.
 */
export interface StackEdit {
  kind: 'stack'
  src: Src
  old: Layout
  next: Layout
}

/**
 * Replace a piece of text written as a string in code — a list's row label,
 * a constant the screen shows — rather than as JSX text. `src` is the position
 * of the string itself (found by the facts route's `find`), in any of the
 * project's `.ts`/`.tsx` files. Verifies the string there still reads `old`.
 */
export interface LiteralEdit {
  kind: 'literal'
  src: Src
  old: string
  next: string
}

export type StructuralEdit =
  | MoveEdit
  | DeleteEdit
  | DuplicateEdit
  | InsertEdit
  | WrapEdit
  | UnwrapEdit
/** A structural edit as the overlay draws it: with the file version its
 *  addresses were read under, so it is never drawn against a newer file. */
export interface Staged {
  edit: StructuralEdit
  version?: string
}

export type ValueEdit = ClassEdit | TextEdit | PropEdit | StackEdit | LiteralEdit
export type Edit = ValueEdit | StructuralEdit

const STRUCTURAL = new Set(['move', 'delete', 'duplicate', 'insert', 'wrap', 'unwrap'])

export function isStructural(edit: Edit): edit is StructuralEdit {
  return STRUCTURAL.has(edit.kind)
}

const placeSrc = (to: Place) => ('before' in to ? to.before : 'after' in to ? to.after : to.inside)

/** Every address an edit depends on — its own and any anchor's — including
 *  `new:` references, which the caller filters as it needs. */
export function addressesOf(edit: Edit): Src[] {
  switch (edit.kind) {
    case 'move':
      return [edit.src, placeSrc(edit.to)]
    case 'insert':
      return [placeSrc(edit.to)]
    case 'wrap':
      return edit.srcs
    default:
      return [edit.src]
  }
}

/** The address a change list line is about. */
export function primaryAddress(edit: Edit): Src {
  return addressesOf(edit)[0] ?? ''
}

/** Why an edit could not be applied. The panel shows this and falls back to
 *  handing the change to an agent as text. */
export interface Refusal {
  edit: Edit
  reason: string
}

/**
 * The result of applying a batch.
 *
 * Batches are atomic: one refusal refuses the whole list and the source is
 * returned untouched. A half-applied batch would leave the file in a state no
 * one asked for, and the client's pending list is already the unit a designer
 * reasons about.
 */
export type ApplyResult = { ok: true; source: string } | { ok: false; refused: Refusal }

// --- the wire shape between the panel and a backend ---------------------------

/**
 * One screen's worth of edits. Every edit's `src` must name the same file —
 * `applyEdits` works on one source string, and a batch spanning two files could
 * half-succeed, which is what atomicity exists to rule out.
 */
export interface DesignRequest {
  slug: string
  screenId: string
  /**
   * The `data-src-v` of the file the addresses were read from — a short hash
   * of its content, stamped by the loader next to every `data-src`. The
   * backend refuses the batch when the file on its side hashes differently:
   * someone (usually the agent) changed it since the screen loaded, and a line
   * number from before that change can name a different node now.
   *
   * Optional only so a list recorded before versions existed still reads.
   */
  version?: string
  edits: Edit[]
  /**
   * `github` backend only. Who is editing — the name the panel asked for,
   * checked against the project's owners and used in the branch name.
   */
  name?: string
  /**
   * `github` backend only. The file to rebuild when `edits` is empty — the
   * last change to it was taken back, so it returns to the deployed copy.
   */
  file?: string
}

/**
 * Database projects only: rearrange the screen list — the sidebar's drag and
 * drop (platform/design/arrangeScreens.ts). `seen` is what the sidebar showed,
 * and the save is refused unless index.ts still says exactly that.
 */
export interface DesignArrangeRequest {
  slug: string
  arrange: {
    seen: { id: string; section?: string }[]
    next: { id: string; section?: string }[]
  }
}

/** `github` backend only: open the change and let it land itself. */
export interface DesignPushRequest {
  slug: string
  push: true
  name: string
}

/**
 * `github` backend only: where a pushed change has got to — see
 * `GitHub.changeState`. The panel asks while it says the change is on its way.
 */
export interface DesignCheckRequest {
  slug: string
  check: true
  name: string
}

/**
 * `github` backend only: the editing password (STUDIO_EDIT_PASSWORD). A match
 * sets a cookie that lets this browser save for 30 days.
 */
export interface DesignUnlockRequest {
  slug: string
  unlock: string
}

/**
 * What the panel needs to know before it offers to write, from
 * `GET /api/design?slug=`.
 *
 * - `fs` — the dev server: Apply writes files; undo is by snapshot.
 * - `github` — a deployment with the studio's GitHub App: Apply commits to a
 *   branch for this deployment, Push opens it. `sha` keys the change list.
 * - `record` — a deployment without it: Collect only.
 */
export interface DesignStatus {
  backend: 'fs' | 'github' | 'record'
  sha?: string
  /** The project's owners — the names the panel offers to edit as. */
  owners: string[]
  /** Set when the project can't be written from the link at all. */
  locked?: string
  /** `github`: this browser must enter the editing password before saving. */
  needsPassword?: boolean
  /** `github`: sign-in is how this link saves, and nobody is signed in. */
  needsSignIn?: boolean
  /** `github`: the signed-in editor's display name — who changes go out as. */
  signedInAs?: string
  /**
   * `fs`: every change saves itself a beat after it is made — no Save, Copy or
   * Revert, just Undo. On a database project a save is already live for
   * everyone with the link (`live`); in a git project it waits for Push.
   */
  instant?: boolean
  /** `instant` on a database project: a save is live as soon as it lands. */
  live?: boolean
}

// --- what the source says, before anything is staged ---------------------------
//
// The page shows what a screen RENDERS; whether a change to it can be written
// depends on how it is WRITTEN — `"Total"` or `{label}`, `className="…"` or
// `className={cn(…)}`. The panel asks once per file version
// (`GET …?slug=&facts=<file>`) and offers only the edits the file can take,
// instead of staging one that is refused at save.

/** One JSX element, keyed in FileFacts by `line:col` of its opening tag. */
export interface NodeFacts {
  /** How it sits in the element around it (see Scope). */
  slot: 'child' | 'cond' | 'list' | 'prop' | 'root'
  /** Its className: a plain string, a template with fixed classes, worked out
   *  by code, or absent. */
  cls: 'literal' | 'template' | 'computed' | 'none'
  /**
   * Its text: written as JSX text, the value of one of the enclosing
   * component's props (`{label}` → `textProp`), some other expression,
   * text mixed with expressions, or none.
   */
  text: 'literal' | 'prop' | 'expr' | 'mixed' | 'none'
  textProp?: string
  /** Props written as plain values — what an instance's panel may change. */
  props: Record<string, string | number | boolean>
  /** Props written as code. */
  exprProps: string[]
  /** Props handed straight on from the enclosing component's own props —
   *  `label={title}` → `{ label: 'title' }` — so text can be traced to where
   *  it is written. */
  passes?: Record<string, string>
}

export interface FileFacts {
  ok: true
  file: string
  version: string
  nodes: Record<string, NodeFacts>
}

/**
 * Where a piece of text is written as a string anywhere in the project
 * (`GET …?slug=&find=<text>`) — what a LiteralEdit is aimed at. Several
 * matches mean the text can't be pinned to one place.
 */
export interface FoundText {
  ok: true
  matches: { src: Src; version: string }[]
}

export type FactsResponse = FileFacts | FoundText | { ok: false; reason: string }

/**
 * Put a file back the way it was before one Apply.
 *
 * Undo is by snapshot, guarded by version: the backend keeps the file as it was
 * before each write and restores it only while the file is still exactly what
 * that write produced. The D1 inverse-edit scheme could not survive structural
 * edits — after a move, the inverse's addresses are the NEW positions, which
 * nobody knows until the screen reloads — and even for value edits a reprint
 * could leave the bytes different from before (see the one-off semicolon in
 * scripts/test-design.mjs), which made an older undo refuse for no visible
 * reason. A guarded snapshot is exact and still refuses rather than guesses.
 */
export interface DesignUndoRequest {
  slug: string
  undo: string
}

export type DesignResponse =
  | {
      ok: true
      file: string
      /** The file's version after the write. */
      version: string
      /** Hands back the pre-write file on request; absent when nothing changed. */
      undo?: string
    }
  | { ok: true; pushed: true }
  | { ok: true; unlocked: true }
  | { ok: true; change: 'none' | 'waiting' | 'failed' | 'landed' | 'closed' }
  | { ok: false; reason: string }
