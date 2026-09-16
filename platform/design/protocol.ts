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
// D1a implements `class`, `text` and `prop`. The structural kinds (reorder,
// move, delete, duplicate, insert, wrap, unwrap, stack) arrive in D2 and slot
// into the same union; nothing here is reshaped to admit them.
// =============================================================================

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
}

export type Edit = ClassEdit | TextEdit | PropEdit

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
  edits: Edit[]
}

export type DesignResponse = { ok: true; file: string } | { ok: false; reason: string }
