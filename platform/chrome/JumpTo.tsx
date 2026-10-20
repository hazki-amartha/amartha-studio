'use client'

// =============================================================================
// Jump to — the ⌘K search. Type part of a project's name, or a section's, and
// Enter opens it: the quick way back to a project without hunting the gallery
// for it. The sidebar's "Jump to…" opens it too. Arrows move, Esc or a click
// outside closes.
// =============================================================================

import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { ProjectStatus } from '@/platform/types'
import { SearchIcon } from './icons'
import { SECTIONS } from './Sidebar'
import type { ProjectIndexEntry } from './loadProjectIndex'

const STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: 'Draft',
  'in-review': 'In review',
  final: 'Final',
  live: 'Live',
}

interface Target {
  key: string
  label: string
  detail: string
  href: string
}

export function JumpTo({ projects, onClose }: { projects: ProjectIndexEntry[]; onClose: () => void }) {
  const router = useRouter()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const list = useRef<HTMLUListElement>(null)

  // Projects first, newest first — the usual reason to be here — then the
  // sections.
  const targets = useMemo(() => {
    const all: Target[] = [
      ...projects.map((p) => ({ key: `p:${p.slug}`, label: p.name, detail: STATUS_LABEL[p.status], href: `/p/${p.slug}` })),
      ...SECTIONS.map((s) => ({ key: `s:${s.section}`, label: s.label, detail: 'Section', href: s.href })),
    ]
    const q = query.trim().toLowerCase()
    return q ? all.filter((t) => t.label.toLowerCase().includes(q) || t.href.toLowerCase().includes(q)) : all
  }, [projects, query])

  useEffect(() => setIndex(0), [query])
  useEffect(() => {
    list.current?.children[index]?.scrollIntoView({ block: 'nearest' })
  }, [index])

  const go = (t: Target) => {
    onClose()
    router.push(t.href)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(i + 1, targets.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (targets[index]) go(targets[index])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Jump to"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-16"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-560 flex-col overflow-hidden rounded-16 border border-default bg-neutral-white shadow-sm dark:border-ink-700 dark:bg-ink-900"
      >
        <div className="flex items-center gap-8 border-b border-default px-16 dark:border-ink-700">
          <SearchIcon className="size-16 flex-none text-caption dark:text-neutral-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to a project or section…"
            aria-label="Jump to"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={targets[index] ? `${listId}-${index}` : undefined}
            className="h-48 min-w-0 flex-1 bg-transparent text-14 text-default outline-none placeholder:text-placeholder dark:text-neutral-50 dark:placeholder:text-neutral-600"
          />
          <kbd className="flex-none rounded-4 border border-default px-4 font-sans text-10 text-caption dark:border-ink-700 dark:text-neutral-500">
            Esc
          </kbd>
        </div>
        <ul id={listId} ref={list} role="listbox" aria-label="Results" className="max-h-400 overflow-y-auto p-8">
          {targets.length === 0 ? (
            <li className="px-8 py-12 text-14 text-caption dark:text-neutral-400">Nothing matches “{query}”.</li>
          ) : (
            targets.map((t, i) => (
              <li
                key={t.key}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === index}
                onMouseMove={() => setIndex(i)}
                onClick={() => go(t)}
                className={`flex h-40 cursor-pointer items-center justify-between gap-12 rounded-8 px-8 text-14 ${
                  i === index ? 'bg-neutral-50 dark:bg-ink-800' : ''
                }`}
              >
                <span className="truncate font-bold text-default dark:text-neutral-50">{t.label}</span>
                <span className="flex-none text-12 text-caption dark:text-neutral-500">{t.detail}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
