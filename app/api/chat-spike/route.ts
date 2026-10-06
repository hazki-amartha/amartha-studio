// THROWAWAY SPIKE — can one Agent SDK turn run inside a Vercel function on a
// subscription token (CLAUDE_CODE_OAUTH_TOKEN)? Preview-only; 404s unless
// CHAT_SPIKE_KEY is set and the request carries it. Never merge this.

import { mkdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { query } from '@anthropic-ai/claude-agent-sdk'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: Request) {
  const key = process.env.CHAT_SPIKE_KEY
  if (!key || request.headers.get('x-spike-key') !== key) return new Response(null, { status: 404 })

  const t0 = Date.now()
  const work = join('/tmp', `spike-${t0}`)
  mkdirSync(work, { recursive: true })
  mkdirSync('/tmp/home', { recursive: true })

  const binary = join(process.cwd(), 'node_modules/@anthropic-ai/claude-agent-sdk-linux-x64/claude')
  const log: string[] = []
  let firstMessageMs: number | null = null
  let result: unknown = null
  let error: string | null = null

  try {
    for await (const m of query({
      prompt: 'Create a file named hello.txt in the current directory containing exactly the text: spike ok',
      options: {
        cwd: work,
        pathToClaudeCodeExecutable: binary,
        allowedTools: ['Write', 'Read'],
        tools: ['Write', 'Read'],
        permissionMode: 'acceptEdits',
        maxTurns: 4,
        settingSources: [],
        env: {
          PATH: process.env.PATH ?? '/usr/bin:/bin',
          HOME: '/tmp/home',
          CLAUDE_CODE_OAUTH_TOKEN: process.env.CLAUDE_CODE_OAUTH_TOKEN ?? '',
          DISABLE_AUTOUPDATER: '1',
          CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
        },
        stderr: (s: string) => log.push(s.slice(0, 500)),
      },
    })) {
      firstMessageMs ??= Date.now() - t0
      log.push(`${m.type}${'subtype' in m ? `:${m.subtype}` : ''}`)
      if (m.type === 'result') result = m
    }
  } catch (e) {
    error = e instanceof Error ? `${e.message}\n${e.stack ?? ''}`.slice(0, 2000) : String(e)
  }

  const file = join(work, 'hello.txt')
  return Response.json({
    binaryExists: existsSync(binary),
    firstMessageMs,
    totalMs: Date.now() - t0,
    fileWritten: existsSync(file),
    fileContent: existsSync(file) ? readFileSync(file, 'utf8') : null,
    error,
    result,
    log: log.slice(-40),
  })
}
