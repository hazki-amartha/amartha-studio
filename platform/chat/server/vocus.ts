// =============================================================================
// Chat · Vocus, read-only, for the chat on the deployed studio (./cloud.ts).
//
// Research context while prototyping: the insight wiki, clustered VoC insights
// and product-level CSAT/NPS, from Vocus's MCP server. Tools on the in-process
// `studio` MCP server, like ./figma.ts, so the agent still has no network of its
// own: the function calls Vocus with MCP_STUDIO_TOKEN and hands back the text.
// The token stays in this process — never in the CLI's env.
//
// Anyone in studio chat may read Vocus: the studio's sign-in is stricter than
// Vocus's. The signed-in designer is named to Vocus for its usage tracking.
// With no VOCUS_MCP_URL or MCP_STUDIO_TOKEN the tools aren't offered.
//
// Each chat turn also reports its Claude usage to Vocus (reportUsage), which
// keeps the one log of the owner's subscription token across both apps.
// =============================================================================

import { tool } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'

const CALL_MS = 60_000
// A turn's context is precious; a long wiki answer is cut, not dropped.
const MAX_CHARS = 60_000

const env = (name: string) => process.env[name]?.trim().replace(/^["']|["']$/g, '') || null

export function vocusConfigured(): boolean {
  return Boolean(env('VOCUS_MCP_URL') && env('MCP_STUDIO_TOKEN'))
}

export const VOCUS_TOOLS = [
  'vocus_answer_query',
  'vocus_read_pages',
  'vocus_answer_card',
  'vocus_search_insights',
  'vocus_get_insight',
  'vocus_product_voc',
].map((name) => `mcp__studio__${name}`)

let nextId = 1

/** One tools/call on Vocus's MCP endpoint (stateless, answers as JSON or one SSE message). */
async function vocus(name: string, args: Record<string, unknown>, user: string): Promise<string> {
  const res = await fetch(env('VOCUS_MCP_URL')!, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env('MCP_STUDIO_TOKEN')}`,
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'x-studio-user': user,
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method: 'tools/call', params: { name, arguments: args } }),
    signal: AbortSignal.timeout(CALL_MS),
  })
  if (res.status === 401) throw new Error('Vocus refused the studio’s token (MCP_STUDIO_TOKEN).')
  if (!res.ok) throw new Error(`Vocus answered ${res.status}.`)
  const body = await res.text()
  const payload = res.headers.get('content-type')?.includes('text/event-stream')
    ? body
        .split('\n')
        .filter((l) => l.startsWith('data:'))
        .map((l) => l.slice(5).trim())
        .pop()
    : body
  const msg = JSON.parse(payload ?? '{}') as {
    result?: { content?: { type: string; text?: string }[]; isError?: boolean }
    error?: { message?: string }
  }
  if (msg.error) throw new Error(`Vocus: ${msg.error.message ?? 'tool call failed'}.`)
  const text = (msg.result?.content ?? []).map((c) => c.text ?? '').join('\n').trim()
  if (msg.result?.isError) throw new Error(`Vocus: ${text || 'tool call failed'}.`)
  if (!text) return 'Vocus returned nothing for this.'
  return text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}\n\n[cut at ${MAX_CHARS} characters]` : text
}

/** `user`: the signed-in designer's email, for Vocus's usage tracking. */
export function vocusTools(user: string) {
  const run = (name: string) => async (args: Record<string, unknown>) => {
    try {
      return { content: [{ type: 'text' as const, text: await vocus(name, args, user) }] }
    } catch (err) {
      return { content: [{ type: 'text' as const, text: err instanceof Error ? err.message : String(err) }], isError: true }
    }
  }
  return [
    tool(
      'vocus_answer_query',
      'Primary research tool: the insight wiki pages most relevant to a question about Amartha customers, products, findings or VoC, plus their linked neighbours, already cited. Cite pages as [[Page Title]].',
      { question: z.string() },
      run('answer_query'),
    ),
    tool(
      'vocus_read_pages',
      'Read insight wiki pages by approximate title, e.g. to follow [[wikilinks]] from vocus_answer_query.',
      { titles: z.array(z.string()) },
      run('read_pages'),
    ),
    tool(
      'vocus_answer_card',
      'The Ask Vocus answer for a question as JSON: summary, ranked customer problems with trend and action status, top verbatims, wiki research cards, caveats and sources. Scope comes from the question (product, business unit, user type, topic). Pass the previous question as context for a follow-up. Always pass on the caveats.',
      { question: z.string(), context: z.string().optional() },
      run('get_answer_card'),
    ),
    tool(
      'vocus_search_insights',
      'Search clustered VoC insights (each one a recurring customer problem backed by CSAT/NPS). Returns ids for vocus_get_insight.',
      { query: z.string(), product: z.string().optional() },
      run('search_insights'),
    ),
    tool(
      'vocus_get_insight',
      'One clustered VoC insight in full by id or slug: volume, trend, linked actions and the customer wording behind it.',
      { id: z.string() },
      run('get_insight'),
    ),
    tool(
      'vocus_product_voc',
      'Voice of Customer for one product (e.g. "Modal") or business unit (e.g. "Funding"): CSAT/NPS scores, top pain points with trend and action status, delights and related wiki findings. Give exactly one of product or business_unit.',
      { product: z.string().optional(), business_unit: z.string().optional(), max_issues: z.number().optional() },
      run('get_product_voc'),
    ),
  ]
}

/** One chat turn's Claude usage, to Vocus's log of the subscription token
 *  (its /api/ai-usage). Never throws: a lost record must not fail a turn. */
export async function reportUsage(run: {
  user: string | null
  sessionId: string
  model: string | null
  failure: string | undefined
  durationMs: number
  result: Record<string, any> | null
  rateLimit: unknown
}): Promise<void> {
  if (!vocusConfigured()) return
  // modelUsage counts every model call of the turn; for a resumed conversation
  // it's the running total, which Vocus turns into this turn's share.
  const models = run.result?.modelUsage as Record<string, Record<string, number>> | undefined
  const totals = models
    ? Object.values(models).reduce(
        (t, m) => ({
          input_tokens: t.input_tokens + (m.inputTokens ?? 0),
          output_tokens: t.output_tokens + (m.outputTokens ?? 0),
          cache_read_tokens: t.cache_read_tokens + (m.cacheReadInputTokens ?? 0),
          cache_write_tokens: t.cache_write_tokens + (m.cacheCreationInputTokens ?? 0),
          cost_usd: t.cost_usd + (m.costUSD ?? 0),
        }),
        { input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0, cost_usd: 0 },
      )
    : null
  try {
    await fetch(new URL('/api/ai-usage', env('VOCUS_MCP_URL')!), {
      method: 'POST',
      headers: { authorization: `Bearer ${env('MCP_STUDIO_TOKEN')}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        feature: 'chat',
        user_email: run.user,
        session_id: run.sessionId,
        model: run.model,
        ok: !run.failure,
        error: run.failure ?? null,
        duration_ms: Math.round(run.durationMs),
        num_turns: run.result?.num_turns ?? null,
        totals,
        rate_limit: run.rateLimit ?? null,
      }),
      signal: AbortSignal.timeout(5_000),
    })
  } catch {
    // intentionally ignored
  }
}
