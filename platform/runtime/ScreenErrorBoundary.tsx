'use client'

// =============================================================================
// ScreenErrorBoundary — keeps a screen that throws inside the device.
//
// Without it, one screen failing to render took the whole studio page down to
// Next's white "Application error" screen, and only a full reload got it back.
// The commonest trigger is a save landing mid-edit: Chat writes one file at a
// time, so for a moment index.ts can name a screen the screen file doesn't
// export yet. A database project refetches on every save, so it hits that
// moment while the designer is watching.
//
// The error is shown where the screen would have been, and the boundary clears
// itself when the screen changes — a new save hands over a new component, a
// navigation a new id — so the next good save recovers on its own. "Try again"
// re-renders the same screen by hand.
// =============================================================================

import { Component, type ReactNode } from 'react'
import { clearScreenError, setScreenError } from './screenError'

interface Props {
  /** Clears a caught error when it changes — pass whatever identifies the
   *  screen being shown (its component, which a new save replaces). */
  resetKey: unknown
  /** Thumbnails have no room for a message or a button. */
  compact?: boolean
  /** The device's own boundary names its screen, so Chat can pass the error
   *  on to the agent (./screenError.ts). Thumbnails don't. */
  screen?: string
  children: ReactNode
}

interface State {
  error: Error | null
  resetKey: unknown
}

export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null
  }

  componentDidCatch(error: unknown) {
    if (this.props.screen) setScreenError(this.props.screen, error instanceof Error ? error.message : String(error))
  }

  componentDidUpdate(_: Props, prev: State) {
    if (prev.error && !this.state.error && this.props.screen) clearScreenError(this.props.screen)
  }

  componentWillUnmount() {
    if (this.props.screen) clearScreenError(this.props.screen)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    if (this.props.compact) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-neutral-50 p-16 text-center text-14 text-caption">
          This screen can’t be shown right now
        </div>
      )
    }

    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-12 bg-neutral-50 px-24 text-center">
        <p className="text-16 font-bold text-default">This screen couldn’t load</p>
        <p className="text-14 text-caption">
          Usually a save that landed halfway — it fixes itself on the next save.
        </p>
        <pre className="max-w-full whitespace-pre-wrap break-words rounded-8 bg-red-50 p-12 text-left text-12 text-red-500">
          {error.message}
        </pre>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="rounded-full bg-primary-500 px-16 py-8 text-14 font-bold text-neutral-white"
        >
          Try again
        </button>
      </div>
    )
  }
}
