'use client'

// The app's five destinations — the L0 surfaces this direction sits on top of.
// Four of them are the Majelis View app itself: this project `extends` it, so
// the tabs land on its real screens rather than on stubs.
//
//   Jadwal  — what to do now. The entry screen, and where a pelayanan starts.
//   Majelis — every group the BP carries, reachable off-schedule. This is the
//             way IN to the Majelis View roster: a BM asks about a group, or a
//             visit moves, and the schedule is not the thing sending her there.
//   Mitra   — every borrower, across groups. The Majelis tab answers "who is in
//             this group"; this one answers "where is Ibu Rina", which is the
//             question you cannot ask a directory of groups.
//   Sales   — the BP's selling surface. Blank for now; KPI used to hold this
//             slot and has moved into Profil.
//   Profil  — her own record, and the settings nobody navigates to twice a day.
//
// Five is the ceiling, and this hits it. The two added here are both LOOK-UP
// surfaces, which is why they sit right of Majelis and left of nothing that
// starts work: the bar runs from what she does today to what she is.
//
// The bar shows on those five screens ONLY. Inside a pelayanan it is hidden: a
// visit is a three-stage sequence with its own sticky CTA, and offering "jump to
// Sales" mid-collection is how focused work turns back into browsing.

import type { ReactNode } from 'react'
import { NavigationBar } from '@/design-system/components'
// `Contact`, `File` and `User` come from the shared set rather than this
// project's local icons: a person-card, a document and a single silhouette are
// exactly the trio that separates a list of borrowers, the Sales pipeline (a
// stack of lead records the BP works through), and "me", and the local file has
// none of them.
import { Contact, File, User } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { CalendarDots, Majelis } from '@/design-system/icons'

export type TabId = 'today' | 'majelis-list' | 'mitra-list' | 'sales' | 'profile'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'today', label: 'Tugas', icon: <CalendarDots /> },
  { id: 'majelis-list', label: 'Majelis', icon: <Majelis /> },
  { id: 'mitra-list', label: 'Mitra', icon: <Contact /> },
  { id: 'sales', label: 'Sales', icon: <File /> },
  { id: 'profile', label: 'Profil', icon: <User /> },
]

export function TabBar({
  active,
  action,
  actionAlign = 'end',
}: {
  active: TabId
  action?: ReactNode
  /** Where the floating action sits above the nav — trailing by default. */
  actionAlign?: 'end' | 'center'
}) {
  const flow = useFlow()

  return (
    // Pinned to the bottom of the scrollport, edge to edge — the Screen
    // primitive owns the 16px page padding, so the bar negates it.
    <div className="sticky bottom-0 -mx-16 mt-auto">
      {/* A floating action rides just above the nav. The row itself is
          click-through (pointer-events-none) so it never blocks the content
          scrolling behind the gap; only the button inside catches taps. */}
      {action ? (
        <div
          className={`pointer-events-none flex px-16 pb-12 ${
            actionAlign === 'center' ? 'justify-center' : 'justify-end'
          }`}
        >
          <span className="pointer-events-auto">{action}</span>
        </div>
      ) : null}
      <NavigationBar
        items={TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon,
          active: tab.id === active,
          // Sales is the module built here; the other four resolve to the
          // Majelis View app this project extends (project.config `extends`),
          // so every tab leads somewhere real.
          onClick: () => {
            if (tab.id !== active) flow.go(tab.id)
          },
        }))}
      />
    </div>
  )
}
