// =============================================================================
// The error the device is showing in place of a screen, for Chat to pass on.
//
// ScreenErrorBoundary shows a screen that throws as a message where the screen
// would be — to the designer. The agent whose edit broke it never saw that: it
// reported the change done, and the designer had to describe the error back to
// it. Chat reads this when a message is sent (platform/chat/useLiveChat.ts), so
// the next turn starts from what is actually on screen.
// =============================================================================

let shown: { screen: string; message: string } | null = null

export function setScreenError(screen: string, message: string) {
  shown = { screen, message }
}

/** Only for the screen it was set for, so a boundary unmounting late can't
 *  wipe the error a newer screen is showing. */
export function clearScreenError(screen: string) {
  if (shown?.screen === screen) shown = null
}

/** The error `screen` is showing right now, if it is showing one. */
export function screenError(screen: string): string | null {
  return shown?.screen === screen ? shown.message : null
}
