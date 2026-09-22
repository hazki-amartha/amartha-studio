'use client'

// =============================================================================
// The top bar's Chat button.
//
// Chat itself is the first tab of the prototype view's panel (see
// PrototypeView's EditPanel); this button is the way to it from anywhere on
// the prototype — in Prototype mode too, where the panel then shows Chat
// alone. Pressing it again puts the panel away. The conversation lives in
// useLiveChat's store, so none of that costs a word of it.
//
// Renders nothing until the server says chat can run here: on the dev server,
// with an editing password set. On a deployment there is no button.
// =============================================================================

import { useEffect, useSyncExternalStore } from 'react'
import { ChatIcon } from '@/platform/chrome/icons'
import {
  getChat,
  getChatServerSnapshot,
  probeChat,
  setChatOpen,
  subscribeChat,
} from '@/platform/runtime/chatBridge'

export function ChatButton() {
  useEffect(probeChat, [])
  const { open, available } = useSyncExternalStore(subscribeChat, getChat, getChatServerSnapshot)
  if (!available) return null

  return (
    <>
      <span aria-hidden className="h-20 w-px bg-neutral-200 dark:bg-ink-700" />
      <button
        type="button"
        onClick={() => setChatOpen(!open)}
        aria-pressed={open}
        title={open ? 'Hide chat' : 'Chat — ask Claude for a change'}
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
