// =============================================================================
// Design · what a staged insert looks like, before it exists (D3).
//
// The overlay draws an inserted component as static markup: the real FunDS
// component, rendered to HTML with the props the insert carries. Static is
// enough — design mode swallows every click on the prototype — and it avoids
// mounting a second React root inside the one that owns the screen.
//
// Rendering needs react-dom/server and the component modules, so the first
// preview loads them; until then the insert is drawn as an empty slot and the
// overlay redraws when the markup is ready.
// =============================================================================

import { createElement, type ComponentType, type ReactNode } from 'react'
import { catalogItem } from './catalog'
import type { InsertEdit } from './protocol'

type Modules = {
  render: (node: ReactNode) => string
  components: Record<string, unknown>
  icons: Record<string, unknown>
}

let modules: Promise<Modules> | null = null

function load(): Promise<Modules> {
  modules ??= Promise.all([
    import('react-dom/server'),
    import('@/design-system/components'),
    import('@/design-system/icons'),
  ]).then(([server, components, icons]) => ({
    render: server.renderToStaticMarkup,
    components: components as Record<string, unknown>,
    icons: icons as Record<string, unknown>,
  }))
  return modules
}

/** Every icon the Insert panel can offer, by name. */
export async function iconModule(): Promise<Record<string, ComponentType<{ className?: string }>>> {
  const { icons } = await load()
  const out: Record<string, ComponentType<{ className?: string }>> = {}
  for (const [name, value] of Object.entries(icons)) {
    if (/^[A-Z]/.test(name) && typeof value === 'function') {
      out[name] = value as ComponentType<{ className?: string }>
    }
  }
  return out
}

const cache = new Map<string, string>()
const keyOf = (edit: InsertEdit) => JSON.stringify([edit.item, edit.icon, edit.props, edit.text])

/** The markup for an insert, if it has been rendered. */
export function previewOf(edit: InsertEdit): string | undefined {
  return cache.get(keyOf(edit))
}

/**
 * Render an insert's markup, then call `ready`. Cheap to call repeatedly: an
 * insert already rendered, or rendering, is not rendered again.
 */
const pending = new Set<string>()
export function ensurePreview(edit: InsertEdit, ready: () => void): void {
  const key = keyOf(edit)
  if (cache.has(key) || pending.has(key)) return
  pending.add(key)
  void load()
    .then(({ render, components, icons }) => {
      const item = catalogItem(edit.item)
      if (!item) return
      const source = item.from === null ? null : item.key === 'icon' ? icons : components
      const type = source ? (source[item.key === 'icon' ? (edit.icon ?? item.tag) : item.tag] as ComponentType) : item.tag
      if (!type) return
      const kids = item.children?.map((c, i) => createElement(c.tag, { key: i, ...c.props }, c.text))
      const body = kids ?? (item.text !== undefined ? (edit.text ?? item.text) : undefined)
      cache.set(key, render(createElement(type, { ...edit.props }, body)))
    })
    .catch(() => {
      // No preview is a blank slot, not a broken panel.
    })
    .finally(() => {
      pending.delete(key)
      ready()
    })
}
