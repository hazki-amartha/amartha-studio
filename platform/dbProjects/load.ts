'use client'

// =============================================================================
// DB projects · fetch a database project and resolve it against its base — the
// one way the prototype view (./DbPrototype.tsx) and the flow view
// (platform/flow/FlowCanvas.tsx) load one, so both see the same screens.
//
// Loaded on demand by both: the linker pulls in the whole design system and
// icon set, which a git project's page must not pay for.
// =============================================================================

import { mergeProject, type ResolvedProject } from '@/platform/runtime/resolveProject'
import type { ProjectModule } from '@/platform/types'
import type { DbProjectBuild, DbProjectResponse } from './protocol'
import { linkDbProject } from './loader'

export async function fetchDbProject(slug: string): Promise<DbProjectResponse> {
  const res = await fetch(`/api/db-projects/${slug}`, { cache: 'no-store' })
  return (await res.json()) as DbProjectResponse
}

/**
 * Link a build and merge it with its base, exactly as the runtime merges a git
 * project with one. The base is either another database project — sent along
 * in the same response (`build.base`), so a share link that opens this project
 * opens its base too — or a git project from the registry.
 */
export async function resolveDbProject(build: DbProjectBuild): Promise<{ own: ProjectModule; resolved: ResolvedProject }> {
  const own = linkDbProject(build)
  const baseSlug = own.config.extends
  let base: ProjectModule | undefined
  if (build.base) {
    base = linkDbProject(build.base)
    injectCss(build.base.slug, build.base.css)
  } else if (baseSlug) {
    base = await import('@/projects/registry').then(({ registry }) => registry[baseSlug]?.())
  }
  injectCss(build.slug, build.css)
  return { own, resolved: mergeProject(own, base) }
}

/**
 * Add the project's CSS — only the rules the studio's own stylesheet lacks.
 *
 * The generated sheet repeats every utility the project names, and most of
 * those (`hidden`, `bg-neutral-50`) the studio already has. Appended after the
 * studio's CSS, a repeat moves that utility to the end of the cascade and beats
 * variants it used to lose to: `hidden` overrode the shell's `md:flex` and hid
 * the nav rail and sidebar. So only rules for classes new to this page go in.
 */
function injectCss(slug: string, css: string) {
  const id = `db-project-css-${slug}`
  let el = document.getElementById(id) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.appendChild(el)
  }

  const existing = new Set<string>()
  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.ownerNode === el) continue
    try {
      collectKeys(sheet.cssRules, '', existing)
    } catch {
      // A cross-origin sheet (fonts) can't be read, and holds no utilities.
    }
  }

  const generated = new CSSStyleSheet()
  generated.replaceSync(css)
  const kept: string[] = []
  for (const rule of Array.from(generated.cssRules)) {
    const keys = new Set<string>()
    collectKeys([rule] as unknown as CSSRuleList, '', keys)
    if (!keys.size || Array.from(keys).some((k) => !existing.has(k))) kept.push(rule.cssText)
  }
  el.textContent = kept.join('\n')
}

/** A key per style rule — its selector, prefixed by any enclosing @media. */
function collectKeys(rules: CSSRuleList, scope: string, into: Set<string>) {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) into.add(`${scope}${rule.selectorText}`)
    else if (rule instanceof CSSMediaRule) collectKeys(rule.cssRules, `${scope}@media ${rule.conditionText}|`, into)
    else if ('cssRules' in rule) collectKeys((rule as CSSGroupingRule).cssRules, scope, into)
  }
}
