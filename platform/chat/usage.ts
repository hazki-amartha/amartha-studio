'use client'

// =============================================================================
// Chat · how much of the Claude subscription is used — the 5-hour and weekly
// limits — shown in the chat footer in place of a $ figure, which means nothing
// on a subscription.
//
// Claude Code reports a `rate_limit_event` during a turn (both routes forward it
// as a `usage` event). Current builds carry both windows in `unifiedWindows`,
// utilization as a fraction and resetsAt in seconds; the top level names only
// the limit closest to binding, and its status. The last report is kept per
// browser tab. Usage is the account's, not a conversation's: New chat doesn't
// reset it.
// =============================================================================

import { useSyncExternalStore } from 'react'

export interface LimitReport {
  status: 'allowed' | 'allowed_warning' | 'rejected'
  /** 0–100. */
  percent: number | null
  /** Epoch ms. */
  resetsAt: number | null
}

export interface Usage {
  fiveHour: LimitReport | null
  weekly: LimitReport | null
}

/** What a route forwards: the CLI's rate_limit_info, untouched. */
export interface RateLimitInfo {
  status?: LimitReport['status']
  rateLimitType?: string
  utilization?: number
  resetsAt?: number
  unifiedWindows?: Record<string, { utilization?: number; resetsAt?: number } | undefined>
}

const KEY = 'studio-chat:usage'
const EMPTY: Usage = { fiveHour: null, weekly: null }
let usage: Usage = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function load() {
  if (loaded) return
  loaded = true
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) usage = { ...EMPTY, ...(JSON.parse(raw) as Usage) }
  } catch {}
}

/** Utilization arrives as a fraction or a percent depending on the CLI build. */
const percentOf = (u: number | undefined) => (typeof u !== 'number' ? null : Math.round(u <= 1 ? u * 100 : u))
/** resetsAt arrives in seconds or milliseconds. */
const msOf = (t: number | undefined) => (typeof t !== 'number' ? null : t < 1e12 ? t * 1000 : t)

export function reportUsage(info: RateLimitInfo) {
  load()
  const type = info.rateLimitType ?? ''
  // The named limit carries the status; the other window is 'allowed' unless
  // its own report says otherwise.
  const window = (key: 'five_hour' | 'seven_day', matches: boolean, prev: LimitReport | null): LimitReport | null => {
    const w = info.unifiedWindows?.[key]
    const status = matches ? (info.status ?? 'allowed') : 'allowed'
    if (w) return { status, percent: percentOf(w.utilization), resetsAt: msOf(w.resetsAt) }
    if (matches) return { status, percent: percentOf(info.utilization), resetsAt: msOf(info.resetsAt) }
    return prev
  }
  const next = {
    fiveHour: window('five_hour', type === 'five_hour', usage.fiveHour),
    weekly: window('seven_day', type.startsWith('seven_day'), usage.weekly),
  }
  if (next.fiveHour === usage.fiveHour && next.weekly === usage.weekly) return
  usage = next
  try {
    sessionStorage.setItem(KEY, JSON.stringify(usage))
  } catch {}
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useUsage(): Usage {
  return useSyncExternalStore(
    subscribe,
    () => {
      load()
      return usage
    },
    () => EMPTY,
  )
}
