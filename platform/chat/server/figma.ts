// =============================================================================
// Chat · Figma, read-only, for the chat on the deployed studio (./cloud.ts).
//
// Two tools on the in-process `studio` MCP server, so the agent still has no
// network of its own: the function calls Figma's REST API with the studio's
// Figma login (./figmaAuth.ts, scope file_content:read) and hands back text or
// a picture. The token stays in this process — never in the CLI's env — and the
// agent can only name a Figma link, never a URL of its own.
//
// It reads Figma as the account that signed in: any file that account can
// open, nothing else. With no Figma app configured the tools aren't offered.
// =============================================================================

import { tool } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'
import { parseFigmaUrl } from '../figmaLink'
import { figmaAccessToken, figmaAuthConfigured } from './figmaAuth'

const API = 'https://api.figma.com/v1'
const MAX_NODES = 400
const MAX_DEPTH = 12
// Claude takes images up to ~5 MB and 8000 px a side; stay well under both.
const MAX_IMAGE_BYTES = 3_500_000
const MAX_IMAGE_SIDE = 7000

export const FIGMA_TOOLS = ['mcp__studio__figma_design', 'mcp__studio__figma_screenshot']

export const figmaConfigured = figmaAuthConfigured

const call = async (pathAndQuery: string, stale: boolean) =>
  fetch(`${API}${pathAndQuery}`, { headers: { authorization: `Bearer ${await figmaAccessToken(stale)}` } })

// A refused token reads as 401/403 mentioning the token — not a missing file.
const tokenRefused = async (res: Response) =>
  res.status === 401 || (res.status === 403 && /token/i.test(await res.clone().text().catch(() => '')))

async function figma<T>(pathAndQuery: string): Promise<T> {
  let res = await call(pathAndQuery, false)
  // Refused: refresh the login once and try again.
  if (await tokenRefused(res)) res = await call(pathAndQuery, true)
  if (await tokenRefused(res)) {
    throw new Error('Figma refused the studio’s login — the owner signs in again at /api/chat/figma/connect.')
  }
  if (res.status === 403 || res.status === 404) {
    throw new Error('Figma says this file is missing or not shared with the studio’s Figma account.')
  }
  if (res.status === 429) throw new Error('Figma is rate-limiting the studio — try again in a minute.')
  if (!res.ok) throw new Error(`Figma answered ${res.status}.`)
  return (await res.json()) as T
}

// --- the layer outline -----------------------------------------------------------

type Paint = { type: string; visible?: boolean; color?: { r: number; g: number; b: number; a?: number }; opacity?: number }
type FigmaNode = {
  id: string
  name: string
  type: string
  visible?: boolean
  children?: FigmaNode[]
  absoluteBoundingBox?: { width: number; height: number } | null
  characters?: string
  style?: { fontFamily?: string; fontSize?: number; fontWeight?: number; lineHeightPx?: number }
  fills?: Paint[]
  strokes?: Paint[]
  cornerRadius?: number
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL'
  itemSpacing?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  componentId?: string
}

const hex = (p: Paint | undefined) => {
  if (!p || p.visible === false || p.type !== 'SOLID' || !p.color) return null
  const c = p.color
  const h = [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('')
  const a = (c.a ?? 1) * (p.opacity ?? 1)
  return `#${h.toUpperCase()}${a < 1 ? ` ${Math.round(a * 100)}%` : ''}`
}

function describe(n: FigmaNode, components: Record<string, { name: string }>): string {
  const bits: string[] = [`${n.type} "${n.name}"`]
  const box = n.absoluteBoundingBox
  if (box) bits.push(`${Math.round(box.width)}×${Math.round(box.height)}`)
  if (n.type === 'INSTANCE' && n.componentId && components[n.componentId]) bits.push(`of ${components[n.componentId].name}`)
  if (n.layoutMode && n.layoutMode !== 'NONE') {
    const pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft].map((v) => v ?? 0).join('/')
    bits.push(`auto-layout ${n.layoutMode.toLowerCase()} gap ${n.itemSpacing ?? 0} pad ${pad}`)
  }
  if (n.type === 'TEXT') {
    if (n.characters) bits.push(JSON.stringify(n.characters.slice(0, 200)))
    const s = n.style
    if (s) bits.push(`${s.fontFamily ?? ''} ${s.fontSize ?? ''}/${s.fontWeight ?? ''}`.trim())
  }
  const fill = hex(n.fills?.find((f) => f.visible !== false))
  if (fill) bits.push(`${n.type === 'TEXT' ? 'color' : 'fill'} ${fill}`)
  const stroke = hex(n.strokes?.find((f) => f.visible !== false))
  if (stroke) bits.push(`stroke ${stroke}`)
  if (n.cornerRadius) bits.push(`radius ${n.cornerRadius}`)
  return bits.join(' · ')
}

const linkTo = (fileKey: string, nodeId: string) => `https://www.figma.com/design/${fileKey}/?node-id=${nodeId.replace(/:/g, '-')}`

/** A page or a section holds whole screens: list them, each with its own link,
 *  so the agent opens the one it needs instead of reading everything. */
const isContainer = (n: FigmaNode) => n.type === 'CANVAS' || n.type === 'SECTION'

function outline(root: FigmaNode, components: Record<string, { name: string }>, fileKey: string): string {
  const lines: string[] = []
  let cut = false
  // A page lists its frames and sections only; a section, everything in it.
  const maxDepth = root.type === 'CANVAS' ? 1 : MAX_DEPTH
  const walk = (n: FigmaNode, depth: number, parent: FigmaNode | null) => {
    if (n.visible === false) return
    if (lines.length >= MAX_NODES) return void (cut = true)
    const link = parent && isContainer(parent) ? ` · ${linkTo(fileKey, n.id)}` : ''
    lines.push(`${'  '.repeat(depth)}${describe(n, components)}${link}`)
    // An instance's insides are the component's business — its name says enough.
    if (n.type === 'INSTANCE' || depth >= maxDepth) return
    for (const child of n.children ?? []) walk(child, depth + 1, n)
  }
  walk(root, 0, null)
  if (cut) lines.push(`… cut at ${MAX_NODES} layers — open one of the linked frames for the rest.`)
  else if (root.type === 'CANVAS') lines.push('This is a whole page — open one of the linked frames or sections for its details.')
  return lines.join('\n')
}

type NodesResponse = { nodes: Record<string, { document: FigmaNode; components: Record<string, { name: string }> } | null> }

// --- the tools ---------------------------------------------------------------------

const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] })
const failed = (err: unknown) => ({ ...text(err instanceof Error ? err.message : String(err)), isError: true })
const BAD_LINK = 'That is not a Figma link to a frame — it needs a figma.com/design/… link with a node-id (right-click the frame → Copy link to selection).'

export function figmaTools() {
  const url = { url: z.string().describe('A figma.com link to a frame, with ?node-id=…') }
  return [
    tool(
      'figma_design',
      'Read a Figma frame as a layer outline: names, sizes, auto-layout, text and its font, colours, radii and which components are used. Use it with figma_screenshot when the designer shares a Figma link; build from FunDS, mapping what you read to the nearest tokens and components.',
      url,
      async ({ url: link }) => {
        const ref = parseFigmaUrl(link)
        if (!ref) return { ...text(BAD_LINK), isError: true }
        try {
          const data = await figma<NodesResponse>(`/files/${ref.fileKey}/nodes?ids=${encodeURIComponent(ref.nodeId)}`)
          const node = data.nodes[ref.nodeId]
          if (!node) return { ...text('That frame isn’t in the file any more.'), isError: true }
          return text(outline(node.document, node.components ?? {}, ref.fileKey))
        } catch (err) {
          return failed(err)
        }
      },
    ),
    tool(
      'figma_screenshot',
      'See a Figma frame or section as a picture. Use it with figma_design when the designer shares a Figma link. A whole page can’t be pictured — it lists the page’s frames to pick from instead.',
      url,
      async ({ url: link }) => {
        const ref = parseFigmaUrl(link)
        if (!ref) return { ...text(BAD_LINK), isError: true }
        try {
          const data = await figma<NodesResponse>(`/files/${ref.fileKey}/nodes?ids=${encodeURIComponent(ref.nodeId)}&depth=1`)
          const node = data.nodes[ref.nodeId]?.document
          if (!node) return { ...text('That frame isn’t in the file any more.'), isError: true }
          if (node.type === 'CANVAS') return text(outline(node, {}, ref.fileKey).replace(/whole page — open/, 'whole page, which Figma can’t picture — screenshot'))
          // Big sections come out smaller, so the picture stays under Claude's limits.
          const side = Math.max(node.absoluteBoundingBox?.width ?? 0, node.absoluteBoundingBox?.height ?? 0)
          const top = side ? Math.min(2, MAX_IMAGE_SIDE / side) : 2
          for (const scale of [top, top / 2, top / 4]) {
            const shot = await figma<{ err: string | null; images: Record<string, string | null> }>(
              `/images/${ref.fileKey}?ids=${encodeURIComponent(ref.nodeId)}&format=png&scale=${scale.toFixed(3)}`,
            )
            const src = shot.images?.[ref.nodeId]
            if (!src) return { ...text('Figma couldn’t render that frame.'), isError: true }
            const png = Buffer.from(await (await fetch(src)).arrayBuffer())
            if (png.length > MAX_IMAGE_BYTES) continue
            return { content: [{ type: 'image' as const, data: png.toString('base64'), mimeType: 'image/png' }] }
          }
          return { ...text('That is too big to look at whole — link one of the frames inside it.'), isError: true }
        } catch (err) {
          return failed(err)
        }
      },
    ),
  ]
}

/** The name a pasted link's chip shows: the frame's, or "Page · …" / "Section · …". */
export async function figmaNodeName(link: string): Promise<string | null> {
  const ref = parseFigmaUrl(link)
  if (!ref) return null
  const data = await figma<NodesResponse>(`/files/${ref.fileKey}/nodes?ids=${encodeURIComponent(ref.nodeId)}&depth=1`)
  const node = data.nodes[ref.nodeId]?.document
  if (!node) return null
  return node.type === 'CANVAS' ? `Page · ${node.name}` : node.type === 'SECTION' ? `Section · ${node.name}` : node.name
}
