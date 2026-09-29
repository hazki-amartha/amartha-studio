// DB projects · what GET /api/db-projects/<slug> answers.

export interface DbProjectBuild {
  slug: string
  /** Hash of every file's path and content — changes on each save. */
  version: string
  /** Project-relative path → compiled CommonJS source. */
  modules: Record<string, string>
  /** Tailwind utilities for the classes these files name. */
  css: string
  /** Files that failed to compile; they are missing from `modules`. */
  errors: { path: string; message: string }[]
}

export type DbProjectResponse = ({ ok: true } & DbProjectBuild) | { ok: false; error: string }

/** Realtime broadcast channel a save announces itself on. */
export function savedChannel(slug: string): string {
  return `studio-project:${slug}`
}
export const SAVED_EVENT = 'saved'
