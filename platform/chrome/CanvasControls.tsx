'use client'

// =============================================================================
// Canvas controls — the buttons in the bottom corners of a project route's
// canvas. Bottom right: ViewSwitch (Prototype | Flow) and, on the prototype,
// FullScreenButton beside it. Bottom left: chrome/ZoomControl. What you do TO
// the prototype — Comment, Edit, Chat — sits in the page's top bar instead
// (TopBar), so the canvas keeps only what changes how you look at it.
//
// Positioned by the caller (`className`), because the canvas differs: the
// prototype's beside its device, the flow view's the whole content area.
// =============================================================================

import Link from 'next/link'
import { setBareMode } from '@/platform/runtime/presentBridge'
import { ExpandIcon } from './icons'
import { withKey } from './shortcuts'

const SEGMENT = 'flex h-full items-center rounded-6 px-8 text-12'

/** Full screen — beside the view switch. Only on the prototype: the flow view
 *  is a diagram, nothing to present bare. It sets a flag rather than
 *  navigating: remounting PrototypeView would reset the visit stack, dropping
 *  the viewer on the entry screen at exactly the moment they wanted to show
 *  something. */
export function FullScreenButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => setBareMode(true)}
      aria-label="Full screen"
      title={withKey('Full screen', 'fullscreen')}
      className={`flex size-32 flex-none items-center justify-center rounded-8 border border-default bg-neutral-white text-caption hover:bg-neutral-50 hover:text-default dark:border-ink-800 dark:bg-ink-900 dark:text-neutral-500 dark:hover:bg-ink-800 dark:hover:text-neutral-50 ${className ?? ''}`}
    >
      <ExpandIcon className="size-16" />
    </button>
  )
}

/** Prototype | Flow — the view you're in, and the way across to the other. */
export function ViewSwitch({ slug, isFlow = false, className }: { slug: string; isFlow?: boolean; className?: string }) {
  const views = [
    { label: 'Prototype', href: `/p/${slug}`, on: !isFlow, title: 'View the prototype' },
    { label: 'Flow', href: `/p/${slug}/flow`, on: isFlow, title: 'View the flow' },
  ]
  return (
    <nav
      aria-label="View"
      className={`flex h-32 flex-none items-stretch gap-2 rounded-8 border border-default bg-neutral-50 p-2 dark:border-ink-800 dark:bg-ink-900 ${className ?? ''}`}
    >
      {views.map((v) =>
        v.on ? (
          <span
            key={v.label}
            aria-current="page"
            className={`${SEGMENT} bg-neutral-white font-bold text-default shadow-sm dark:bg-ink-700 dark:text-neutral-50 dark:shadow-none`}
          >
            {v.label}
          </span>
        ) : (
          <Link
            key={v.label}
            href={v.href}
            title={v.title}
            className={`${SEGMENT} text-caption hover:text-default dark:text-neutral-500 dark:hover:text-neutral-50`}
          >
            {v.label}
          </Link>
        ),
      )}
    </nav>
  )
}
