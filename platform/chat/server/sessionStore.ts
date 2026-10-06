// =============================================================================
// Chat · where a conversation lives between turns on the deployed studio.
//
// On a laptop the CLI keeps its session in ~/.claude and the next turn resumes
// from there. A Vercel function has no such place: the next message may land on
// another instance with an empty /tmp. So the Agent SDK mirrors the transcript
// here (its SessionStore adapter) and materializes it again on resume.
//
// One Redis list per session, `studio:chat:session:<projectKey>:<id>[:<sub>]`,
// one JSON entry per element, kept for a week after the last turn. Same Upstash
// store as comments (platform/comments/server/store.ts) — no new service.
// =============================================================================

import type { SessionKey, SessionStore, SessionStoreEntry } from '@anthropic-ai/claude-agent-sdk'
import { isStoreConfigured, redis } from '@/platform/comments/server/store'

const TTL_SECONDS = 7 * 24 * 60 * 60

const keyOf = (k: SessionKey) =>
  `studio:chat:session:${k.projectKey}:${k.sessionId}${k.subpath ? `:${k.subpath}` : ''}`

export const isSessionStoreConfigured = isStoreConfigured

export const redisSessionStore: SessionStore = {
  async append(key, entries) {
    if (!entries.length) return
    const k = keyOf(key)
    await redis('RPUSH', k, ...entries.map((e) => JSON.stringify(e)))
    await redis('EXPIRE', k, TTL_SECONDS)
  },
  async load(key) {
    const raw = await redis<string[]>('LRANGE', keyOf(key), 0, -1)
    if (!raw.length) return null
    return raw.map((r) => JSON.parse(r) as SessionStoreEntry)
  },
}
