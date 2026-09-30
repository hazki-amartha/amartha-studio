'use client'

// =============================================================================
// DB projects · /db/<slug> — the prototype view, fed from the database.
//
// Fetches the compiled project, links it (./loader.ts), and hands the screens
// to the same PrototypeView /p/<slug> uses. A save anywhere announces itself on
// a Supabase Realtime broadcast channel; every open viewer refetches and the
// device updates in place — the visit stack survives, the screen remounts.
//
// A save that fails to compile or run keeps the last good version on screen
// and says what broke, so a typo never blanks a link someone is presenting.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { PrototypeView } from '@/platform/frame'
import { supabaseEnv } from '@/platform/auth/env'
import { mergeProject } from '@/platform/runtime/resolveProject'
import type { ProjectConfig, ScreenDef } from '@/platform/types'
import { publishDbIndexEntry, setActiveDbProject } from './active'
import { SAVED_EVENT, savedChannel, type DbProjectResponse } from './protocol'

interface Props {
  slug: string
  /** Who is looking, as others see it in "Also here" — null stays anonymous. */
  viewer?: string | null
  initialScreenId?: string
  initialBare?: boolean
}

export function DbPrototype({ slug, viewer, initialScreenId, initialBare }: Props) {
  const [project, setProject] = useState<{ config: ProjectConfig; screens: ScreenDef[] } | null>(null)
  // Before anything renders: Edit mode and Chat decide where to write by this.
  setActiveDbProject(slug)
  const [problem, setProblem] = useState<string | null>(null)
  const [others, setOthers] = useState<string[]>([])
  const version = useRef<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/db-projects/${slug}`, { cache: 'no-store' })
      const build = (await res.json()) as DbProjectResponse
      if (!build.ok) return setProblem(build.error)
      if (build.version === version.current) return
      // Loaded here, not at the top: the linker pulls in the whole design
      // system and icon set, which a git project's page must not pay for.
      const { linkDbProject } = await import('./loader')
      const own = linkDbProject(build)
      // `extends`: the base is a git project (the live references stay in git),
      // merged exactly as the runtime merges a git project with its base.
      const baseSlug = own.config.extends
      const base = baseSlug
        ? await import('@/projects/registry').then(({ registry }) => registry[baseSlug]?.())
        : undefined
      const resolved = mergeProject(own, base)
      version.current = build.version
      injectCss(slug, build.css)
      setProject({ config: own.config, screens: resolved.screens })
      const brief = (s: ScreenDef) => ({ id: s.id, title: s.title })
      publishDbIndexEntry({
        slug,
        name: own.config.name,
        status: own.config.status,
        createdAt: own.config.createdAt,
        screens: resolved.own.map(brief),
        inherited: resolved.base ? { from: resolved.base.name, screens: resolved.inherited.map(brief) } : undefined,
      })
      setProblem(build.errors.length ? build.errors.map((e) => `${e.path}: ${e.message}`).join('\n') : null)
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e))
    }
  }, [slug])

  useEffect(() => {
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)

    // Live updates: every save broadcasts on the project's channel. The client
    // is loaded on demand, like the linker, to keep it off git projects' pages.
    let stop: (() => void) | null = null
    let alive = true
    const env = supabaseEnv()
    if (env) {
      void import('@supabase/supabase-js').then(({ createClient }) => {
        if (!alive) return
        const client = createClient(env.url, env.anonKey, { auth: { persistSession: false } })
        // Presence on the same channel: who else has this project open, so two
        // designers see each other before their edits meet.
        const me = Math.random().toString(36).slice(2)
        const channel = client.channel(savedChannel(slug), { config: { presence: { key: me } } })
        channel
          .on('broadcast', { event: SAVED_EVENT }, () => refresh())
          .on('presence', { event: 'sync' }, () => {
            const names = Object.entries(channel.presenceState<{ name: string | null }>())
              .filter(([key]) => key !== me)
              .flatMap(([, metas]) => metas.map((m) => m.name ?? 'Someone'))
            setOthers([...new Set(names)])
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') void channel.track({ name: viewer ?? null })
          })
        stop = () => void client.removeChannel(channel)
      })
    }

    return () => {
      window.removeEventListener('focus', onFocus)
      alive = false
      stop?.()
      setActiveDbProject(null)
      publishDbIndexEntry(null)
    }
  }, [slug, refresh, viewer])

  if (!project) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-50 px-16 text-center text-14 text-caption dark:bg-ink-950 dark:text-neutral-400">
        {problem ?? 'Loading from the database…'}
      </div>
    )
  }

  return (
    <>
      <PrototypeView
        key={initialScreenId ?? 'entry'}
        config={project.config}
        screens={project.screens}
        initialScreenId={initialScreenId}
        initialBare={initialBare}
      />
      {others.length ? (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center">
          <span className="rounded-full border border-default bg-neutral-white px-12 py-4 text-12 text-default dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-50">
            Also here: {others.join(', ')}
          </span>
        </div>
      ) : null}
      {problem ? (
        <pre className="fixed bottom-16 left-16 z-50 max-w-screen-sm whitespace-pre-wrap rounded-12 bg-red-50 p-12 text-12 text-red-500">
          {problem}
        </pre>
      ) : null}
    </>
  )
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
