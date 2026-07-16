// =============================================================================
// WS-A · Device status bar slot. The clock / signal / battery glyphs are
// hidden by design decision (2026-07-16) — the bar keeps its 32px height so
// screen content still clears the device notch area, framed and full-page.
// =============================================================================

export function StatusBar() {
  return <div className="h-32 shrink-0 bg-neutral-white" aria-hidden />
}
