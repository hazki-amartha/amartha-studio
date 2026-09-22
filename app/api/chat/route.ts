// =============================================================================
// Chat · local bridge. Runs a turn on the `claude` CLI installed on THIS laptop
// and streams it to the panel as SSE.
//
// A stand-in for STUDIO-EDITING-PLAN B3/B4 while there is no API key: instead of
// a Vercel Sandbox running the Agent SDK, the agent is Claude Code itself, signed
// in with the owner's subscription, working in this checkout. The dev server is
// already serving this checkout, so every edit hot-reloads into the preview —
// the same loop the sandbox is meant to give, with none of its setup.
//
// Dev only. On a deployment there is no CLI and no subscription; the route 404s.
//
// Behind design mode's editing password (STUDIO_EDIT_PASSWORD, same cookie, so
// unlocking one unlocks both). The dev server listens on every interface, and
// without a gate anyone on the same Wi-Fi could drive an agent on this laptop.
// With no password in .env.local, chat stays shut.
//
// What is enforced in code rather than asked for in prose (B4: an appended
// instruction loses to CLAUDE.md): no git, no gh, no dev server — denied at the
// tool level. Edits outside projects/<slug>/ are reported after the turn, not
// reset: this is a shared checkout, and a reset here could wipe someone else's
// uncommitted work.
// =============================================================================

import { spawn, execFileSync, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { KEBAB } from '@/platform/design/server/common'
import {
  createEditToken,
  EDIT_COOKIE,
  EDIT_MAX_AGE,
  editCookie,
  isEditGateConfigured,
  passwordMatches,
  verifyEditToken,
} from '@/platform/design/server/editGate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ROOT = process.cwd()

// One turn at a time: two agents in one checkout race each other's edits (B6).
let running: ChildProcess | null = null

const TOOLS = ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'Bash']
// Deny beats allow, which matters: the checked-in .claude/settings.json (loaded
// for CLAUDE.md) pre-approves git, gh and every npm script for local sessions.
const DENIED = [
  'Bash(git:*)',
  'Bash(npm install:*)',
  'Bash(npm ci:*)',
  'Bash(gh:*)',
  'Bash(npm run dev:*)',
  'Bash(npx next:*)',
  'Bash(next:*)',
]

function studioAppend(slug: string): string {
  return [
    `You are running inside the Amartha Studio chat panel for project \`${slug}\`,`,
    'on behalf of its designer, who is watching the prototype beside this chat.',
    `Edit only \`projects/${slug}/\`. Do not use git or gh at all — the studio`,
    'handles commit and push itself. A dev server is already running and hot-reloads',
    'your edits into the preview; do not start, stop or restart one, and do not open',
    'a browser. Run `npm run lint` after edits that touch classes. Keep replies short',
    'and in plain language — the designer does not read code.',
  ].join(' ')
}

/** Tracked + untracked paths that differ from HEAD, relative to the repo root. */
function dirtyPaths(): Set<string> {
  try {
    const out = execFileSync('git', ['status', '--porcelain', '-uall'], { cwd: ROOT }).toString()
    return new Set(out.split('\n').filter(Boolean).map((l) => l.slice(3)))
  } catch {
    return new Set()
  }
}

/** The one line a designer sees for a tool call. */
function toolDetail(input: Record<string, unknown>): string {
  const file = input.file_path ?? input.path ?? input.notebook_path
  if (typeof file === 'string') return path.relative(ROOT, file) || file
  if (typeof input.command === 'string') return input.command.split('\n')[0]
  if (typeof input.pattern === 'string') return input.pattern
  return ''
}

/** A clean env for the child: no API key (use the subscription login), and none
 *  of the parent Claude session's variables, which would make it a sub-session. */
function childEnv(): NodeJS.ProcessEnv {
  const env = {} as NodeJS.ProcessEnv
  for (const [k, v] of Object.entries(process.env)) {
    if (k === 'ANTHROPIC_API_KEY' || k === 'CLAUDECODE' || k.startsWith('CLAUDE_CODE_')) continue
    if (k === 'CLAUDE_PID' || k === 'NODE_OPTIONS') continue
    env[k] = v
  }
  env.ENABLE_CLAUDEAI_MCP_SERVERS = 'false'
  return env
}

export interface ChatStatus {
  /** False on a deployment, or with no editing password set locally. */
  available: boolean
  needsPassword: boolean
}

export async function GET(request: Request): Promise<Response> {
  const available = process.env.NODE_ENV === 'development' && isEditGateConfigured()
  const status: ChatStatus = {
    available,
    needsPassword: available && !verifyEditToken(editCookie(request)),
  }
  return Response.json(status, { headers: { 'cache-control': 'no-store' } })
}

async function unlock(password: unknown): Promise<Response> {
  if (!passwordMatches(password)) {
    // Slows guessing to a crawl without making a typo feel broken.
    await new Promise((r) => setTimeout(r, 750))
    return Response.json({ error: 'That isn’t the editing password.' }, { status: 403 })
  }
  const token = createEditToken()
  return Response.json(
    { ok: true },
    {
      headers: {
        'set-cookie': `${EDIT_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${EDIT_MAX_AGE}; HttpOnly; SameSite=Lax`,
      },
    },
  )
}

interface ChatRequest {
  /** Present only on an unlock request. */
  unlock?: string
  slug: string
  message: string
  /** The CLI session to continue; absent on the first turn. */
  sessionId?: string
}

export async function POST(request: Request): Promise<Response> {
  if (process.env.NODE_ENV !== 'development') return new Response(null, { status: 404 })

  if (!isEditGateConfigured()) {
    return Response.json(
      { error: 'Chat needs STUDIO_EDIT_PASSWORD in .env.local.' },
      { status: 403 },
    )
  }

  let body: ChatRequest
  try {
    body = (await request.json()) as ChatRequest
  } catch {
    return Response.json({ error: 'That request could not be read.' }, { status: 400 })
  }
  if ('unlock' in body) return unlock(body.unlock)
  if (!verifyEditToken(editCookie(request))) {
    return Response.json({ error: 'Enter the editing password first.' }, { status: 401 })
  }
  if (!body.slug || !KEBAB.test(body.slug)) {
    return Response.json({ error: 'That is not a project I recognise.' }, { status: 400 })
  }
  if (!body.message?.trim()) {
    return Response.json({ error: 'Type something first.' }, { status: 400 })
  }
  if (running) {
    return Response.json({ error: 'Another turn is still running.' }, { status: 409 })
  }

  const args = [
    '-p',
    body.message,
    '--output-format', 'stream-json',
    '--verbose',
    '--setting-sources', 'project',
    '--strict-mcp-config',
    '--permission-mode', 'acceptEdits',
    '--tools', ...TOOLS,
    // Bash is limited to the checks; reading goes through Read/Glob/Grep. In
    // print mode anything not allowed here is refused, not asked about.
    '--allowedTools', ...TOOLS.filter((t) => t !== 'Bash'), 'Bash(npm run lint:*)',
    'Bash(npm run check:flows:*)', 'Bash(npx tsc:*)',
    '--disallowedTools', ...DENIED,
    '--append-system-prompt', studioAppend(body.slug),
  ]
  if (process.env.CHAT_LOCAL_MODEL) args.push('--model', process.env.CHAT_LOCAL_MODEL)
  if (body.sessionId) args.push('--resume', body.sessionId)

  const before = dirtyPaths()
  const child = spawn(process.env.CHAT_LOCAL_CLAUDE ?? 'claude', args, {
    cwd: ROOT,
    env: childEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  running = child

  const encoder = new TextEncoder()
  let stderr = ''

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      const send = (event: object) => {
        if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      const finish = () => {
        if (closed) return
        closed = true
        controller.close()
      }

      request.signal.addEventListener('abort', () => child.kill('SIGTERM'))

      let buffer = ''
      let result: Record<string, unknown> | null = null
      child.stdout!.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        let nl: number
        while ((nl = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, nl).trim()
          buffer = buffer.slice(nl + 1)
          if (!line) continue
          let msg: Record<string, any>
          try {
            msg = JSON.parse(line)
          } catch {
            continue
          }
          if (msg.type === 'system' && msg.subtype === 'init') {
            send({ type: 'session', sessionId: msg.session_id, model: msg.model })
          } else if (msg.type === 'assistant') {
            for (const block of msg.message?.content ?? []) {
              if (block.type === 'text' && block.text?.trim()) {
                send({ type: 'text', text: block.text })
              } else if (block.type === 'tool_use') {
                send({ type: 'tool', tool: block.name, detail: toolDetail(block.input ?? {}) })
              }
            }
          } else if (msg.type === 'result') {
            result = msg
          }
        }
      })
      child.stderr!.on('data', (chunk: Buffer) => {
        stderr = (stderr + chunk.toString()).slice(-2000)
      })

      child.on('close', (code, signal) => {
        running = null
        const after = dirtyPaths()
        const changed = [...after].filter((p) => !before.has(p))
        const outside = changed.filter((p) => !p.startsWith(`projects/${body.slug}/`))
        send({
          type: 'done',
          sessionId: (result?.session_id as string | undefined) ?? body.sessionId,
          costUsd: (result?.total_cost_usd as number | undefined) ?? 0,
          durationMs: (result?.duration_ms as number | undefined) ?? 0,
          changed,
          outside,
          error:
            signal === 'SIGTERM'
              ? 'Stopped.'
              : code !== 0 || result?.is_error
                ? String(result?.result ?? stderr.trim() ?? `claude exited with ${code}`)
                : undefined,
        })
        finish()
      })
      child.on('error', (err) => {
        running = null
        send({
          type: 'done',
          costUsd: 0,
          durationMs: 0,
          changed: [],
          outside: [],
          error: `Could not start the claude CLI on this laptop: ${err.message}`,
        })
        finish()
      })
    },
    cancel() {
      child.kill('SIGTERM')
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    },
  })
}
