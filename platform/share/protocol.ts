// =============================================================================
// Share · Figma-style links to one prototype for people without an Amartha
// account — stakeholders reviewing it, field teams running training or UT.
//
// A link opens exactly one prototype, never edits it, and is either
//   view      look only; no comments, no chrome beyond the prototype
//   comment   look, read and leave comments (under a typed name, as a guest)
// Any signed-in editor can make one; anyone signed in can revoke it. No
// expiry by default.
// =============================================================================

export type ShareAccess = 'view' | 'comment'

export interface ShareLink {
  token: string
  slug: string
  access: ShareAccess
  createdBy: string
  createdAt: string
  /** ISO time the link stops working, or null for never. */
  expiresAt: string | null
}

export type ShareRequest =
  | { action: 'create'; slug: string; access: ShareAccess; days: number | null }
  | { action: 'revoke'; slug: string; token: string }

export interface ShareResponse {
  links?: ShareLink[]
  link?: ShareLink
  error?: string
}

/** Days a new link can last, null being never. The first is the default. */
export const EXPIRY_CHOICES: (number | null)[] = [null, 7, 30]

/** One cookie per shared prototype, so links to two prototypes can coexist. */
export const shareCookie = (slug: string) => `studio_share_${slug}`
