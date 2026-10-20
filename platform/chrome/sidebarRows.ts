// =============================================================================
// The sidebar's row and button styles, shared by everything drawn in it — the
// section switcher, a section's pages, a project's screens. The sidebar sits
// on the dark frame in either theme (Sidebar.tsx sets data-theme="dark" on
// it), so the `dark:` half is the one that shows; the light half keeps these
// readable anywhere else they're used.
// =============================================================================

const ROW = 'flex h-32 w-full min-w-0 flex-none items-center gap-8 rounded-8 px-8 text-left text-14'

export const ROW_IDLE = `${ROW} text-default hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50`
export const ROW_ACTIVE = `${ROW} bg-primary-50 font-bold text-link dark:bg-ink-800 dark:text-neutral-50`

/** A group's label above its rows. */
export const GROUP_LABEL = 'truncate px-8 pb-4 pt-16 text-12 text-caption dark:text-neutral-500'

/** The 32px icon buttons — collapse, back, Share, the theme. */
export const ICON_BUTTON =
  'flex size-32 flex-none items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-500 dark:hover:bg-ink-800 dark:hover:text-neutral-50'

/** The folded rail's 40px icon buttons. */
const RAIL = 'flex size-40 flex-none items-center justify-center rounded-8'
export const RAIL_IDLE = `${RAIL} text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-500 dark:hover:bg-ink-800 dark:hover:text-neutral-50`
export const RAIL_ACTIVE = `${RAIL} bg-primary-50 text-link dark:bg-ink-800 dark:text-neutral-50`
