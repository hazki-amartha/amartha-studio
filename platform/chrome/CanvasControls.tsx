'use client'

// =============================================================================
// Canvas controls — the buttons floating in the corners of a project route's
// canvas. Top right: Comment and Edit (and the flow view's badge). The rest
// are exported to sit in their own corners: ViewSwitch (Flow ⇄ Prototype) top
// left, FullScreenButton bottom right, and chrome/ZoomControl bottom left.
// They replace the top bar, which on a project route held little else and cost
// a 48px strip of canvas for it.
//
// Positioned by the caller (`className`), because the canvas differs: beside
// the right panel on the prototype, the whole content area on the flow view.
// =============================================================================

import Link from 'next/link'
import { setBareMode } from '@/platform/runtime/presentBridge'
import { CommentIcon, DeviceIcon, EditIcon, ExpandIcon, FlowIcon } from './icons'
import { withKey } from './shortcuts'

const ROUND =
  'flex size-40 flex-none items-center justify-center rounded-full border border-default bg-neutral-white text-caption shadow-sm hover:bg-neutral-50 hover:text-default dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-400 dark:shadow-none dark:hover:bg-ink-800 dark:hover:text-neutral-50'

/** A labelled button — Flow — the same height as the round ones. */
const PILL =
  'flex h-40 flex-none items-center gap-8 rounded-full border border-default bg-neutral-white px-16 text-14 font-bold text-default shadow-sm hover:bg-neutral-50 dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-50 dark:shadow-none dark:hover:bg-ink-800'

export function CanvasControls({
  slug,
  isFlow = false,
  status,
  onEdit,
  onComment,
  className,
}: {
  slug: string
  isFlow?: boolean
  /** Route-published extras (the flow canvas's badge), shown beside. */
  status?: React.ReactNode
  /** Given while the prototype isn't in Edit: opens the right panel, and clicks
   *  start selecting. Once it's open, the panel's ✕ is the way back. */
  onEdit?: () => void
  /** Given where a comment store is configured and Comment isn't open: opens
   *  the Comments panel, and clicks on the device drop pins. Like Edit, the
   *  panel's ✕ is the way back. */
  onComment?: () => void
  className?: string
}) {
  return (
    <div className={`flex items-center gap-8 ${className ?? ''}`}>
      {status}

      {onComment ? (
        <button
          type="button"
          onClick={onComment}
          title={withKey('Comment — click anywhere on the screen to leave feedback', 'comment')}
          className={PILL}
        >
          <CommentIcon className="size-16" />
          Comment
        </button>
      ) : null}
      {/* Last, at the corner, and inverted against the chrome (white on the
          dark shell, near-black on the light one): the one action here that
          starts work. Not brand purple — that is the prototype's colour, and
          the studio's own controls shouldn't read as part of the design. */}
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          title={withKey('Edit — click elements to select them', 'edit')}
          className="flex h-40 flex-none items-center gap-8 rounded-full bg-ink-900 px-16 text-14 font-bold text-neutral-white shadow-sm hover:bg-ink-800 dark:bg-neutral-white dark:text-ink-900 dark:shadow-none dark:hover:bg-neutral-200"
        >
          <EditIcon className="size-16" />
          Edit
        </button>
      ) : null}
    </div>
  )
}

/** Full screen — on its own in the canvas's bottom-right corner, apart from
 *  the controls up top. Only on the prototype: the flow view is a diagram,
 *  nothing to present bare. It sets a flag rather than navigating: remounting
 *  PrototypeView would reset the visit stack, dropping the viewer on the entry
 *  screen at exactly the moment they wanted to show something. */
export function FullScreenButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => setBareMode(true)}
      aria-label="Full screen"
      title={withKey('Full screen', 'fullscreen')}
      className={`${ROUND} ${className ?? ''}`}
    >
      <ExpandIcon className="size-20" />
    </button>
  )
}

/** Across to the flow diagram, or back from it. */
export function ViewSwitch({ slug, isFlow = false, className }: { slug: string; isFlow?: boolean; className?: string }) {
  return (
    <Link
      href={isFlow ? `/p/${slug}` : `/p/${slug}/flow`}
      title={isFlow ? 'View prototype' : 'View flow'}
      className={`${PILL} ${className ?? ''}`}
    >
      {isFlow ? <DeviceIcon className="size-16" /> : <FlowIcon className="size-16" />}
      {isFlow ? 'Prototype' : 'Flow'}
    </Link>
  )
}
