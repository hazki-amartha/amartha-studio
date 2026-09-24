// Auth · the wire shape of GET /api/me.

export type StudioRole = 'viewer' | 'editor' | 'admin'

export interface StudioUser {
  email: string
  /**
   * The name projects are owned under — `owner` in project.config — from
   * `user_roles.display_name`. Null until the studio owner sets it, and then
   * this account owns nothing.
   */
  displayName: string | null
  /** What to show when there is no display name yet: Google's name, or the email. */
  label: string
  role: StudioRole
}

export interface MeResponse {
  /** Whether this deployment has sign-in at all. */
  configured: boolean
  /** Whether the whole studio needs it (STUDIO_REQUIRE_SIGN_IN). */
  required: boolean
  user: StudioUser | null
  /** Prototypes this browser holds a share link to (platform/share). */
  shares: Record<string, 'view' | 'comment'>
}
