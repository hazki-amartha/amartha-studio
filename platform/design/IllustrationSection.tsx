'use client'

// =============================================================================
// Design · the Illustration section: what an <Illustration> shows, and Swap.
// Swap opens the illustration library's picker in a dialog; the pick comes
// back as prop edits, staged like any other knob (illustration.ts).
//
// The picker is the library's own page, framed from this origin, so it brings
// its search, drafts and "make a version" with it, and the designer's sign-in:
// the studio and /assets-app share the session cookie.
// =============================================================================

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Image as ImageIcon } from '@/design-system/icons'
import { srcOf } from './applyDom'
import { Section, sentenceCase } from './DesignSections'
import { stagedProps } from './designStore'
import {
  illustrationProps,
  pickerUrl,
  propsFor,
  readPick,
  swapEdits,
  thumbnailUrl,
  type IllustrationPick,
  type IllustrationProps,
  type PropChange,
} from './illustration'

const TIER_LABELS: Record<string, string> = { spot: 'Spot', hero: 'Hero', splash: 'Splash' }

export function IllustrationSection({ el, onSwap }: { el: Element; onSwap: (changes: PropChange[]) => void }) {
  const [open, setOpen] = useState(false)
  const src = srcOf(el)
  const written = illustrationProps(el)
  // Staged edits aren't on screen until they're written, so the panel shows
  // what the element will be, not what it was.
  const staged = src ? stagedProps(src) : new Map<string, string | null>()
  const shown: IllustrationProps = {
    name: staged.has('name') ? (staged.get('name') ?? null) : written.name,
    generic: staged.has('generic') ? (staged.get('generic') ?? null) : written.generic,
    tier: staged.has('tier') ? (staged.get('tier') ?? null) : written.tier,
  }
  const waiting = staged.has('name') || staged.has('generic') || staged.has('tier')

  return (
    <Section title="Illustration">
      <div className="flex items-center gap-12">
        <Thumbnail url={thumbnailUrl(shown)} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-12 font-bold text-default dark:text-neutral-50">
            {shown.generic ? `Generic · ${sentenceCase(shown.generic)}` : (shown.name ?? 'None')}
          </span>
          <span className="text-10 text-caption dark:text-neutral-400">{TIER_LABELS[shown.tier ?? 'spot']}</span>
        </div>
        <button
          type="button"
          disabled={!src}
          onClick={() => setOpen(true)}
          className="rounded-full border border-default bg-neutral-white px-8 py-4 text-12 font-bold text-default hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-placeholder dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:hover:bg-ink-800 dark:disabled:text-neutral-600"
        >
          Swap
        </button>
      </div>
      {waiting ? (
        <span className="text-10 text-placeholder dark:text-neutral-600">Shows on screen once it’s saved.</span>
      ) : null}
      {open ? (
        <PickerDialog
          url={pickerUrl(shown)}
          onClose={() => setOpen(false)}
          onPick={(pick) => {
            setOpen(false)
            const changes = swapEdits(shown, propsFor(pick, shown))
            if (changes.length > 0) onSwap(changes)
          }}
        />
      ) : null}
    </Section>
  )
}

function Thumbnail({ url }: { url: string | null }) {
  // Kept per URL, like the component: a swapped-in name gets its own try.
  const [failed, setFailed] = useState<string | null>(null)
  return (
    <span className="flex size-56 shrink-0 items-center justify-center overflow-hidden rounded-8 border border-default bg-neutral-50 text-placeholder dark:border-ink-700 dark:bg-ink-950 dark:text-neutral-600">
      {url && failed !== url ? (
        // eslint-disable-next-line @next/next/no-img-element -- the library serves it resized
        <img src={url} alt="" className="size-full object-contain" onError={() => setFailed(url)} />
      ) : (
        <ImageIcon size={20} />
      )}
    </span>
  )
}

/**
 * The library's picker in a dialog. Escape and a click outside close it; keys
 * pressed inside the frame never reach this document, so the picker posts a
 * close of its own. Without ASSET_GENERATOR_URL the frame gets this studio's
 * 404, which the title gives away.
 */
function PickerDialog({
  url,
  onPick,
  onClose,
}: {
  url: string
  onPick: (pick: IllustrationPick) => void
  onClose: () => void
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [missing, setMissing] = useState(false)
  const handlers = useRef({ onPick, onClose })
  handlers.current = { onPick, onClose }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return
      const message = readPick(event.data)
      if (!message) return
      if (message.type === 'close') handlers.current.onClose()
      else handlers.current.onPick(message)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handlers.current.onClose()
    }
    window.addEventListener('message', onMessage)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Swap illustration"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-16"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full max-h-720 w-full max-w-960 flex-col overflow-hidden rounded-16 border border-default bg-neutral-white shadow-lg dark:border-ink-700 dark:bg-ink-900"
      >
        {missing ? (
          <div className="m-auto flex max-w-360 flex-col items-center gap-12 p-24 text-center">
            <span className="text-14 font-bold text-default dark:text-neutral-50">
              The illustration library isn’t connected
            </span>
            <span className="text-12 text-caption dark:text-neutral-400">
              This studio has no ASSET_GENERATOR_URL, so there’s no picker to open. Set it to the library’s
              deployment and restart the studio.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-default px-12 py-4 text-12 font-bold text-default hover:bg-neutral-50 dark:border-ink-700 dark:text-neutral-50 dark:hover:bg-ink-800"
            >
              Close
            </button>
          </div>
        ) : (
          <iframe
            ref={frame}
            src={url}
            title="Swap illustration"
            onLoad={() => {
              const title = frame.current?.contentDocument?.title ?? ''
              setMissing(!title.includes('Amartha Illustration'))
            }}
            className="block size-full border-0 bg-neutral-50 dark:bg-ink-950"
          />
        )}
      </div>
    </div>,
    document.body,
  )
}
