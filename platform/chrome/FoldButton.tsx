'use client'

// =============================================================================
// FoldButton — folds the sidebar to its rail, or opens it again. It lives in
// the page card, at the left end of its top bar, whether the sidebar is open or
// folded — one place to reach for it, never in the sidebar it folds.
// =============================================================================

import { PanelIcon } from './icons'
import { ICON_BUTTON } from './sidebarRows'

export function FoldButton({ folded, onClick }: { folded: boolean; onClick: () => void }) {
  const label = folded ? 'Show sidebar' : 'Hide sidebar'
  return (
    <button type="button" onClick={onClick} aria-label={label} title={`${label} · [`} className={ICON_BUTTON}>
      <PanelIcon className="size-16" />
    </button>
  )
}
