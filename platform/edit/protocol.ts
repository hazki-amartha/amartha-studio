// =============================================================================
// Edit · the wire shape between the panel and the write-back route.
//
// Every edit is a deterministic replacement the server can verify before
// touching a file: it carries the OLD value, so the server refuses rather than
// guesses when the source doesn't contain exactly one match. No edit here is
// "apply this diff" — each is "find this, prove it's unique, swap it".
// =============================================================================

/** Swap one token class for another on the element whose className contains
 *  every class in `find` (the file's current class list for that element).
 *  `text` is the element's rendered text, used only as a tie-breaker when the
 *  class list alone matches several places. */
export interface ClassEdit {
  kind: 'class'
  find: string[]
  oldClass: string
  newClass: string
  text?: string
}

/** Replace one exact text occurrence. */
export interface TextEdit {
  kind: 'text'
  old: string
  next: string
}

/** Change (or introduce) an enumerated prop on a FunDS component tag.
 *  `text` is the component's rendered text, the tie-breaker between several
 *  tags of the same component. */
export interface PropEdit {
  kind: 'prop'
  component: string
  prop: string
  old: string
  next: string
  text?: string
}

export type Edit = ClassEdit | TextEdit | PropEdit

export interface EditRequest {
  slug: string
  screenId: string
  edit: Edit
}

export type EditResponse =
  | { ok: true; file: string }
  | { ok: false; reason: string }
