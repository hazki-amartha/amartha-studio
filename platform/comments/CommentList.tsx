'use client'

// =============================================================================
// Comments · the sidebar's list — the Notes tab, which now holds the project's
// review feedback under whatever notes the project itself declares. This
// screen's comments first, each one opening its pin; every other screen's open
// comments after, each one jumping there.
// =============================================================================

import { useFlow, useScreenJump } from '@/platform/runtime'
import type { ScreenDef } from '@/platform/types'
import { ago, initials } from './CommentLayer'
import type { Comment } from './protocol'
import { numberOf, openComment, setCommentMode, setShowResolved, useComments } from './store'

const ROW =
  'flex w-full gap-8 rounded-8 px-8 py-8 text-left hover:bg-neutral-50 dark:hover:bg-ink-800'

function Row({ comment, number, active, onClick }: { comment: Comment; number: number; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${ROW} ${active ? 'bg-neutral-50 dark:bg-ink-800' : ''}`}>
      <span
        className={`flex size-24 flex-none items-center justify-center rounded-full rounded-bl-none text-10 font-bold text-neutral-white ${comment.resolved ? 'bg-neutral-500' : 'bg-ink-900 dark:bg-ink-700'}`}
      >
        {initials(comment.author)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-baseline gap-4">
          <span className="truncate text-12 font-bold text-default dark:text-neutral-50">{comment.author}</span>
          <span className="flex-none text-12 text-caption dark:text-neutral-400">
            #{number} · {ago(comment.createdAt)}
          </span>
        </span>
        <span
          className={`line-clamp-2 text-12 ${comment.resolved ? 'text-disabled line-through' : 'text-caption dark:text-neutral-400'}`}
        >
          {comment.body}
        </span>
      </span>
    </button>
  )
}

export function CommentList({ screens, projectNotes }: { screens: ScreenDef[]; projectNotes?: string[] }) {
  const { current } = useFlow()
  const jump = useScreenJump()
  const { available, comments, openId, showResolved } = useComments()
  const active = screens.find((s) => s.id === current)
  const notes = active?.notes && active.notes.length > 0 ? active.notes : (projectNotes ?? [])

  const shown = (c: Comment) => showResolved || !c.resolved
  const here = comments.filter((c) => c.screenId === current && shown(c))
  const elsewhere = comments.filter((c) => c.screenId !== current && shown(c))
  const resolvedCount = comments.filter((c) => c.resolved).length
  const titleOf = (id: string) => screens.find((s) => s.id === id)?.title ?? id

  const open = (c: Comment) => {
    setCommentMode(true)
    if (c.screenId !== current) jump(c.screenId)
    openComment(c.id)
  }

  return (
    <>
      {active ? <h2 className="text-14 font-bold text-default dark:text-neutral-50">{active.title}</h2> : null}
      {notes.length > 0 ? (
        <ul className="flex flex-col gap-8">
          {notes.map((note, i) => (
            <li key={i} className="text-14 text-caption dark:text-neutral-400">
              {note}
            </li>
          ))}
        </ul>
      ) : null}

      {available ? (
        <>
          <div className="flex items-center justify-between pt-8">
            <span className="text-12 font-bold text-caption dark:text-neutral-400">Comments</span>
            {resolvedCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowResolved(!showResolved)}
                className="text-12 text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50"
              >
                {showResolved ? 'Hide resolved' : `Show resolved (${resolvedCount})`}
              </button>
            ) : null}
          </div>
          {here.length > 0 ? (
            <div className="-mx-8 flex flex-col">
              {here.map((c) => (
                <Row key={c.id} comment={c} number={numberOf(comments, c.id)} active={openId === c.id} onClick={() => open(c)} />
              ))}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCommentMode(true)}
              className="text-left text-12 text-caption hover:text-default dark:text-neutral-400 dark:hover:text-neutral-50"
            >
              No comments on this screen. Turn on Comment and click anywhere on it to add one.
            </button>
          )}
          {elsewhere.length > 0 ? (
            <>
              <span className="pt-8 text-12 font-bold text-caption dark:text-neutral-400">Other screens</span>
              <div className="-mx-8 flex flex-col">
                {elsewhere.map((c) => (
                  <div key={c.id} className="flex flex-col">
                    <span className="px-8 pt-4 text-10 text-caption dark:text-neutral-400">{titleOf(c.screenId)}</span>
                    <Row comment={c} number={numberOf(comments, c.id)} active={false} onClick={() => open(c)} />
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </>
      ) : notes.length === 0 ? (
        <p className="text-12 text-caption dark:text-neutral-400">No notes for this screen.</p>
      ) : null}
    </>
  )
}
