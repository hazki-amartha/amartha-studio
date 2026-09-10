'use client'

// The app's five destinations — the L0 surfaces this direction sits on top of.
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
import { Contact, File } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { CalendarDots, Majelis } from '@/design-system/icons'
import { store, useApp } from './store'

export type TabId = 'today' | 'majelis-list' | 'mitra-list' | 'sales' | 'profile'

/** The BP/BM indicator that replaces the profile icon — tap the tab to switch. */
function RoleBadge({ role }: { role: 'BP' | 'BM' }) {
  return (
    <span className="flex items-center justify-center rounded-8 border border-primary-500 px-8 py-2 text-12 font-bold text-primary-500">
      {role}
    </span>
  )
}

export function TabBar({ active, action }: { active: TabId; action?: ReactNode }) {
  const flow = useFlow()
  const { role } = useApp()

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Tugas', icon: <CalendarDots /> },
    { id: 'majelis-list', label: 'Majelis', icon: <Majelis /> },
    { id: 'mitra-list', label: 'Mitra', icon: <Contact /> },
    { id: 'sales', label: 'Sales', icon: <File /> },
    // The profile tab carries the BP/BM indicator and switches the view on tap.
    { id: 'profile', label: role === 'BM' ? 'BM' : 'BP', icon: <RoleBadge role={role} /> },
  ]

  return (
    // Pinned to the bottom of the scrollport, edge to edge — the Screen
    // primitive owns the 16px page padding, so the bar negates it.
    <div className="sticky bottom-0 -mx-16 mt-auto">
      {/* A floating action rides just above the nav, right-aligned. The row
          itself is click-through (pointer-events-none) so it never blocks the
          content scrolling behind the gap; only the button inside catches taps. */}
      {action ? (
        <div className="pointer-events-none flex justify-end px-16 pb-12">
          <span className="pointer-events-auto">{action}</span>
        </div>
      ) : null}
      <NavigationBar
        items={TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon,
          active: tab.id === active,
          // Sales navigates; the profile tab switches BP ↔ BM in place; the
          // other three are here because the bar is what the user sees under a
          // Sales page, not because they lead anywhere.
          onClick: () => {
            if (tab.id === 'profile') store.toggleRole()
            else if (tab.id !== active && tab.id === 'sales') flow.go(tab.id)
          },
        }))}
      />
    </div>
  )
}
