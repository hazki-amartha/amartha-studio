#!/usr/bin/env node
// =============================================================================
// chat-history — Chat's recent conversations as plain text, for /studio-memory
// (.claude/commands/studio-memory.md) to read lessons from.
//
//   studio   the live studio's, from Redis, kept 30 days after their last
//            message (platform/chat/server/sessionStore.ts). Needs the store's
//            KV_REST_API_URL / KV_REST_API_TOKEN in .env.local.
//   laptop   this laptop's, from Claude Code's own history of this checkout.
//            Other designers' laptop chats stay on their laptops.
//
// Prints what the designer wrote and what Chat replied, and counts the tools
// it used — never tool results or file contents, so a month of chats stays
// readable.
//
//   node scripts/chat-history.mjs [--days 30] [--source all|studio|laptop] [--project <slug>]
// =============================================================================

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const MAX_TEXT = 1500

const args = process.argv.slice(2)
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const days = Number(opt('days', '30'))
const source = opt('source', 'all')
const only = opt('project', null)
const since = Date.now() - days * 24 * 60 * 60 * 1000

const conversations = []
if (source !== 'laptop') conversations.push(...(await fromStudio()))
if (source !== 'studio') conversations.push(...fromLaptop())

const shown = conversations.filter((c) => c.at >= since && (!only || c.slug === only)).sort((a, b) => a.at - b.at)
if (!shown.length) console.log(`No Chat conversations in the last ${days} days.`)
for (const c of shown) print(c)

// --- the live studio -----------------------------------------------------------

async function fromStudio() {
  const url = env('KV_REST_API_URL') || env('UPSTASH_REDIS_REST_URL')
  const token = env('KV_REST_API_TOKEN') || env('UPSTASH_REDIS_REST_TOKEN')
  if (!url || !token) {
    console.error('studio: no Redis settings in .env.local — skipped.')
    return []
  }
  const redis = async (...command) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(command),
    })
    const json = await res.json()
    if (!res.ok || json.error) throw new Error(json.error ?? `Redis ${res.status}`)
    return json.result
  }
  // A session's own list; the `:<sub>` lists beside it are its subagents'. The
  // project key is the turn's workspace, /tmp/studio-chat/ws/<slug>/<id>, dashed.
  const SESSION = /^studio:chat:session:-tmp-studio-chat-ws-([a-z0-9-]+)-([0-9a-f-]{36}):\2$/i
  const keys = []
  let cursor = '0'
  do {
    const [next, batch] = await redis('SCAN', cursor, 'MATCH', 'studio:chat:session:*', 'COUNT', 200)
    cursor = String(next)
    keys.push(...batch.filter((k) => SESSION.test(k)))
  } while (cursor !== '0')
  const out = []
  for (const key of keys) {
    const [, slug, id] = SESSION.exec(key)
    const entries = (await redis('LRANGE', key, 0, -1)).map(parse).filter(Boolean)
    // Everything in this store is Chat's, from before the studio note too.
    const c = conversation('studio', id, entries, slug)
    if (c) out.push(c)
  }
  return out
}

// --- this laptop -----------------------------------------------------------------

function fromLaptop() {
  // Claude Code keeps a checkout's sessions under its path, every other
  // character turned into a dash.
  const base = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')
  const dir = join(base, 'projects', ROOT.replace(/[^a-zA-Z0-9]/g, '-'))
  if (!existsSync(dir)) return []
  const out = []
  for (const name of readdirSync(dir)) {
    const file = join(dir, name)
    if (!name.endsWith('.jsonl') || statSync(file).mtimeMs < since) continue
    const text = readFileSync(file, 'utf8')
    // Most sessions here are the owner's own; only Chat's carry the note.
    if (!text.includes('<studio-note>')) continue
    const entries = text.split('\n').map(parse).filter(Boolean)
    const c = conversation('laptop', name.slice(0, -'.jsonl'.length), entries)
    if (c) out.push(c)
  }
  return out
}

// --- reading a transcript ----------------------------------------------------------

/** Null unless it is a Chat conversation. With no `known` project, that means
 *  its first message opens with the studio's note (platform/chat/server/
 *  turnNote.ts), which names the project. */
function conversation(where, id, entries, known = null) {
  const turns = []
  const tools = new Map()
  let slug = known
  let at = 0
  for (const e of entries) {
    at = Math.max(at, Date.parse(e.timestamp ?? '') || 0)
    if (e.isMeta || !e.message) continue
    if (e.type === 'user') {
      const text = textOf(e.message.content)
      if (!text) continue // a tool result
      if (!slug) {
        if (!text.startsWith('<studio-note>')) return null
        slug = /Project: `([a-z0-9-]+)`/.exec(text)?.[1] ?? '?'
      }
      const said = text
        .replace(/<studio-note>[\s\S]*?<\/studio-note>/, '')
        .replace(/<prototype-memory[\s\S]*?<\/prototype-memory>/, '')
        .trim()
      if (said) turns.push({ who: 'Designer', text: said })
    } else if (e.type === 'assistant' && Array.isArray(e.message.content)) {
      for (const block of e.message.content) {
        if (block.type === 'text' && block.text?.trim()) turns.push({ who: 'Chat', text: block.text.trim() })
        else if (block.type === 'tool_use') tools.set(block.name, (tools.get(block.name) ?? 0) + 1)
      }
    }
  }
  return turns.length ? { where, id, slug, at, turns, tools } : null
}

function textOf(content) {
  if (typeof content === 'string') return content.trim()
  if (!Array.isArray(content)) return ''
  return content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
}

function print(c) {
  const when = new Date(c.at).toISOString().slice(0, 16).replace('T', ' ')
  const tools = [...c.tools].map(([name, n]) => `${name.replace(/^mcp__studio__/, '')} ×${n}`).join(', ')
  console.log(`\n## ${when} · ${c.slug} · ${c.where} · ${c.id}`)
  if (tools) console.log(`(tools: ${tools})`)
  for (const t of c.turns) console.log(`\n${t.who}: ${t.text.length > MAX_TEXT ? `${t.text.slice(0, MAX_TEXT)} …` : t.text}`)
}

function parse(line) {
  try {
    return JSON.parse(line)
  } catch {
    return null
  }
}

/** A setting from the environment, or else this checkout's .env.local. */
function env(name) {
  if (process.env[name]) return process.env[name]
  const file = join(ROOT, '.env.local')
  if (!existsSync(file)) return ''
  const line = readFileSync(file, 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${name}=`))
  return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : ''
}
