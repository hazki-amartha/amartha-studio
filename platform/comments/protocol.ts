// =============================================================================
// Comments · what crosses the wire between the prototype view and
// app/api/comments. Review feedback pinned to a spot on a screen, Figma-style —
// written by whoever has the link, under the name they typed.
//
// Comments are data ABOUT a prototype, not part of it, so they live in a store
// (Upstash Redis, see server/store.ts) and never in the repo: a comment is
// saved the moment it's posted, with no commit and no redeploy.
// =============================================================================

export interface Comment {
  id: string
  screenId: string
  /** Where the pin sits, in the device's own pixels: x from the screen's left
   *  edge, y from the top of the screen's scrolled content — so a pin on a
   *  long page stays on the thing it points at when the page scrolls. */
  x: number
  y: number
  body: string
  author: string
  createdAt: string
  editedAt?: string
  resolved: boolean
  /** Written by the viewer asking — they may edit and delete it. Anyone may
   *  resolve or reopen, as in Figma. */
  mine: boolean
}

export interface CommentsResponse {
  /** False where no store is configured — the view then hides commenting. */
  available: boolean
  comments: Comment[]
}

export type CommentRequest =
  | { action: 'create'; slug: string; screenId: string; x: number; y: number; body: string; author: string }
  | { action: 'edit'; slug: string; id: string; body: string }
  | { action: 'resolve'; slug: string; id: string; resolved: boolean }
  | { action: 'delete'; slug: string; id: string }

/** The browser's commenter key travels in this header. It is a random secret
 *  kept in the viewer's own localStorage — not an account, just what makes
 *  "my comments" mean the same browser tomorrow. */
export const KEY_HEADER = 'x-comment-key'

export const LIMITS = { body: 2000, author: 60, perProject: 1000 } as const
