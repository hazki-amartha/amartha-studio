// =============================================================================
// Where on a screen each of its arrows starts — the button that makes the move.
//
// The canvas renders every screen live, so the element is there to find. For
// each arrow, the first element (in reading order) whose click handler names
// the target screen: its own onClick, or a function handed to the component
// that drew it (`<Button onClick={() => go('modal-prepare')}>`). Handlers are
// read, never run — their source holds the screen id as a string literal. An
// arrow with a `label` also matches an element showing exactly that text.
//
// None found means the move isn't on the screen as the canvas shows it — it
// comes from another state, or a handler that works its target out at run
// time — and the arrow starts from the screen's edge instead.
//
// This reads React's own bookkeeping on DOM nodes (__reactProps$ /
// __reactFiber$). If a React upgrade moves it, nothing is found and every
// arrow starts from the edge again — never wrong, only plainer.
// =============================================================================

import type { FlowLink } from './layout'

/** A box inside a node, in canvas units from the node's top-left. */
export interface OriginBox {
  x: number
  y: number
  w: number
  h: number
}

/** For each target screen: the box its arrow starts from, or null for the node's edge. */
export type Origins = Record<string, OriginBox | null>

type Fiber = { type: unknown; memoizedProps?: Record<string, unknown>; return: Fiber | null }

const reactKey = (el: Element, prefix: string) => Object.keys(el).find((k) => k.startsWith(prefix))

/** The functions that run when `el` is clicked: its own, and those given to the
 *  components that rendered it as their outermost element. */
function handlers(el: Element): string[] {
  const out: string[] = []
  const propsKey = reactKey(el, '__reactProps$')
  const own = propsKey ? (el as unknown as Record<string, Record<string, unknown>>)[propsKey] : undefined
  if (typeof own?.onClick === 'function') out.push(String(own.onClick))
  const fiberKey = reactKey(el, '__reactFiber$')
  let f = fiberKey ? ((el as unknown as Record<string, Fiber>)[fiberKey]?.return ?? null) : null
  // Up through components only — the next DOM element up is its own candidate.
  while (f && typeof f.type !== 'string') {
    for (const v of Object.values(f.memoizedProps ?? {})) if (typeof v === 'function') out.push(String(v))
    f = f.return
  }
  return out
}

const literal = (id: string) => new RegExp(`(['"\`])${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1`)

/**
 * Find each link's origin inside `nodeEl` — the node's DOM box, drawn at
 * `zoom` — in canvas units relative to the node.
 */
export function findOrigins(nodeEl: HTMLElement, links: FlowLink[], zoom: number): Origins {
  const base = nodeEl.getBoundingClientRect()
  const box = (el: Element): OriginBox | null => {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.height === 0) return null
    return { x: (r.left - base.left) / zoom, y: (r.top - base.top) / zoom, w: r.width / zoom, h: r.height / zoom }
  }
  const all = Array.from(nodeEl.querySelectorAll('*'))
  const sources = new Map<Element, string[]>()
  const handled = (el: Element) => {
    if (!sources.has(el)) sources.set(el, handlers(el))
    return sources.get(el)!
  }

  const out: Origins = {}
  for (const link of links) {
    if (link.to in out && out[link.to]) continue
    const named = literal(link.to)
    const label = link.label?.trim().toLowerCase()
    let found: OriginBox | null = null
    for (const el of all) {
      const byHandler = handled(el).some((src) => named.test(src))
      const byLabel = Boolean(label) && el.children.length === 0 && el.textContent?.trim().toLowerCase() === label
      if (!byHandler && !byLabel) continue
      // A label names the text; the arrow starts from what you'd tap.
      found = box(byLabel && !byHandler ? (el.closest('button, a, [role="button"]') ?? el) : el)
      if (found) break
    }
    out[link.to] = found
  }
  return out
}
