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
import { ChatLoader, useLoaderVisible } from '@/platform/chat/ChatLoader'
import { STUDIO_DB_ANON_KEY, STUDIO_DB_URL } from './public'
import type { ProjectConfig, ScreenDef } from '@/platform/types'
import { briefScreen } from '@/platform/chrome/screenIndex'
import { publishDbIndexEntry, setActiveDbProject } from './active'
import { PresenceAvatars } from './PresenceAvatars'
import { SAVED_EVENT, savedChannel } from './protocol'

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
  const loaderVisible = useLoaderVisible(!project && !problem)
  const [others, setOthers] = useState<string[]>([])
  const version = useRef<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      // Loaded here, not at the top: the linker pulls in the whole design
      // system and icon set, which a git project's page must not pay for.
      const { fetchDbProject, resolveDbProject } = await import('./load')
      const build = await fetchDbProject(slug)
      if (!build.ok) return setProblem(build.error)
      if (build.version === version.current) return
      const { own, resolved } = await resolveDbProject(build)
      version.current = build.version
      setProject({ config: own.config, screens: resolved.screens })
      publishDbIndexEntry({
        slug,
        name: own.config.name,
        status: own.config.status,
        createdAt: own.config.createdAt,
        screens: resolved.own.map(briefScreen),
        inherited: resolved.base ? { from: resolved.base.name, screens: resolved.inherited.map(briefScreen) } : undefined,
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
    {
      void import('@supabase/supabase-js').then(({ createClient }) => {
        if (!alive) return
        const client = createClient(STUDIO_DB_URL, STUDIO_DB_ANON_KEY, { auth: { persistSession: false } })
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
              // Your own other tabs are not someone else.
              .filter((name) => !viewer || name !== viewer)
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
    // The same Vocus mark as Chat's; a quick load shows the empty canvas
    // instead of a flash of loader.
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-neutral-50 px-16 text-center text-14 text-caption dark:bg-ink-950 dark:text-neutral-400">
        {problem ?? (loaderVisible ? <ChatLoader label="Loading project…" /> : null)}
      </div>
    )
  }

  return (
    <>
      {/* Not keyed by the deep link — see app/p/[slug]/page.tsx. */}
      <PrototypeView
        config={project.config}
        screens={project.screens}
        initialScreenId={initialScreenId}
        initialBare={initialBare}
        presence={<PresenceAvatars names={others} />}
      />
      {problem ? (
        <pre className="fixed bottom-16 left-16 z-50 max-w-screen-sm whitespace-pre-wrap rounded-12 bg-red-50 p-12 text-12 text-red-500">
          {problem}
        </pre>
      ) : null}
    </>
  )
}
