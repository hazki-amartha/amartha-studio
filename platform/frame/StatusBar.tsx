// =============================================================================
// WS-A · Minimal device status bar (time + signal / wifi / battery glyphs).
// Part of the running app viewport, shown both framed (desktop) and full-page.
// =============================================================================

export function StatusBar() {
  return (
    <div className="flex h-32 shrink-0 items-center justify-between bg-neutral-white px-16 text-12 font-bold text-default">
      <span>9:41</span>
      <span className="flex items-center gap-4" aria-hidden>
        {/* signal */}
        <svg viewBox="0 0 16 12" width="16" height="12" fill="currentColor">
          <rect x="1" y="9" width="2" height="2" />
          <rect x="5" y="6" width="2" height="5" />
          <rect x="9" y="3" width="2" height="8" />
          <rect x="13" y="0" width="2" height="11" />
        </svg>
        {/* wifi */}
        <svg viewBox="0 0 16 12" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 5a10 10 0 0114 0M3.5 7.5a6 6 0 019 0M6 10a2 2 0 014 0" />
        </svg>
        {/* battery */}
        <svg viewBox="0 0 24 12" width="24" height="12">
          <rect x="0.5" y="0.5" width="20" height="11" rx="2" fill="none" stroke="currentColor" />
          <rect x="2" y="2" width="17" height="8" rx="1" fill="currentColor" />
          <rect x="21" y="4" width="2" height="4" rx="0.5" fill="currentColor" />
        </svg>
      </span>
    </div>
  )
}
