// =============================================================================
// Push · the wire shape between the top bar's Push button and /api/push.
// Types only, so the client can import it without pulling in server code.
// =============================================================================

export interface PushFile {
  /** Repo-relative. */
  path: string
  change: 'added' | 'changed' | 'deleted'
}

export interface PushStatus {
  /** Dev server, editing password set, a real project. */
  available: boolean
  /** The studio's GitHub App is set up on this laptop. */
  configured: boolean
  needsPassword: boolean
  owners: string[]
  /** Why this project can't be pushed from here at all (production docs). */
  locked?: string
  /** What would go out: this project's files that differ from main. */
  files: PushFile[]
  /** Of those, the ones main changed since this laptop last updated. */
  conflicts: string[]
  /** The push in flight, if any. */
  change: 'none' | 'waiting' | 'failed' | 'landed' | 'closed'
}

export type PushResult = { ok: true; number: number; files: PushFile[] } | { ok: false; reason: string }
