// Auth · the wire shape of GET /api/me.

export type StudioRole = 'viewer' | 'editor' | 'admin'

export interface StudioUser {
  email: string
  /**
   * The name they go by — comments go out under it, projects are owned under
   * it (`owner` in project.config). Theirs to change (platform/auth/profiles.ts).
   * Null only where sign-in can't name anyone.
   */
  displayName: string | null
  /** What to show for them — the same name. */
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

/** POST /api/me — change the name you go by. */
export interface RenameRequest {
  name: string
}

export type RenameResponse = { ok: true; name: string } | { ok: false; reason: string }
