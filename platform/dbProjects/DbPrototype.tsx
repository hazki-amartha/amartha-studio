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
import { createClient } from '@supabase/supabase-js'
import { PrototypeView } from '@/platform/frame'
import { supabaseEnv } from '@/platform/auth/env'
import type { ProjectModule } from '@/platform/types'
import { linkDbProject } from './loader'
import { SAVED_EVENT, savedChannel, type DbProjectResponse } from './protocol'

interface Props {
  slug: string
  initialScreenId?: string
  initialBare?: boolean
}

export function DbPrototype({ slug, initialScreenId, initialBare }: Props) {
  const [project, setProject] = useState<ProjectModule | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const version = useRef<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/db-projects/${slug}`, { cache: 'no-store' })
      const build = (await res.json()) as DbProjectResponse
      if (!build.ok) return setProblem(build.error)
      if (build.version === version.current) return
      const next = linkDbProject(build)
      version.current = build.version
      injectCss(slug, build.css)
      setProject(next)
      setProblem(build.errors.length ? build.errors.map((e) => `${e.path}: ${e.message}`).join('\n') : null)
    } catch (e) {
      setProblem(e instanceof Error ? e.message : String(e))
    }
  }, [slug])

  useEffect(() => {
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)

    const env = supabaseEnv()
    const client = env ? createClient(env.url, env.anonKey, { auth: { persistSession: false } }) : null
    const channel = client?.channel(savedChannel(slug)).on('broadcast', { event: SAVED_EVENT }, () => refresh()).subscribe()

    return () => {
      window.removeEventListener('focus', onFocus)
      if (channel) client?.removeChannel(channel)
    }
  }, [slug, refresh])

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
      {problem ? (
        <pre className="fixed bottom-16 left-16 z-50 max-w-screen-sm whitespace-pre-wrap rounded-12 bg-red-50 p-12 text-12 text-red-500">
          {problem}
        </pre>
      ) : null}
    </>
  )
}

function injectCss(slug: string, css: string) {
  const id = `db-project-css-${slug}`
  let el = document.getElementById(id) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = css
}
