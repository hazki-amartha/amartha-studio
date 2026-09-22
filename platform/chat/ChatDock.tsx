'use client'

// =============================================================================
// The chat panel docked on the right of the shell, and its top-bar button.
//
// Closing hides the panel; it does not unmount it. The conversation, the
// session it continues and any turn still running all survive a close, so
// "close and reopen" means exactly that. Only leaving for another project
// starts a fresh chat — a conversation about one prototype is no use in the next.
//
// Both render nothing until the server says chat can run here: on the dev
// server, with an editing password set. On a deployment there is no button.
// =============================================================================

import { useEffect, useState, useSyncExternalStore } from 'react'
import { ChatIcon } from '@/platform/chrome/icons'
import {
  getChat,
  getChatServerSnapshot,
  probeChat,
  setChatOpen,
  subscribeChat,
} from '@/platform/runtime/chatBridge'
import { LiveChatPanel } from './ChatPanel'

function useChat() {
  useEffect(probeChat, [])
  return useSyncExternalStore(subscribeChat, getChat, getChatServerSnapshot)
}

export function ChatButton() {
  const { open, available } = useChat()
  if (!available) return null

  return (
    <>
      <span aria-hidden className="h-20 w-px bg-neutral-200 dark:bg-ink-700" />
      <button
        type="button"
        onClick={() => setChatOpen(!open)}
        aria-pressed={open}
        title={open ? 'Close chat' : 'Chat — ask Claude for a change'}
        className={`flex h-32 shrink-0 items-center gap-4 rounded-full px-12 text-12 transition-colors ${
          open
            ? 'bg-primary-50 font-bold text-primary-500 dark:bg-ink-800 dark:text-neutral-50'
            : 'text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50'
        }`}
      >
        <ChatIcon className="size-16" />
        Chat
      </button>
    </>
  )
}

export function ChatDock({ slug, suppressed }: { slug: string; suppressed?: boolean }) {
  const { open, available } = useChat()
  // Mounted on first open, then kept: see the header comment.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    if (open) setMounted(true)
  }, [open])

  if (!available || !mounted) return null

  return (
    <aside
      aria-label="Chat"
      className={`${open && !suppressed ? 'hidden md:flex' : 'hidden'} w-360 shrink-0 flex-col border-l border-default dark:border-ink-700`}
    >
      <LiveChatPanel key={slug} slug={slug} onClose={() => setChatOpen(false)} />
    </aside>
  )
}
