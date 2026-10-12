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
  /** The project it `extends`, when that is a database project too — sent in
   *  the same response, so whoever may open this project gets its base. */
  base?: DbProjectBuild
}

export type DbProjectResponse = ({ ok: true } & DbProjectBuild) | { ok: false; error: string }

/** Realtime broadcast channel a save announces itself on. */
export function savedChannel(slug: string): string {
  return `studio-project:${slug}`
}
export const SAVED_EVENT = 'saved'

/** One save in a project's history (platform/dbProjects/history.ts): the files
 *  one person saved together. `id` is its newest history row — restoring to it
 *  puts every file back as it was right after this save. */
export interface SavePoint {
  id: number
  at: string
  by: string | null
  files: string[]
}

export type HistoryResponse = { ok: true; points: SavePoint[] } | { ok: false; reason: string }
export type RestoreResult = { ok: true; changed: number } | { ok: false; reason: string }
