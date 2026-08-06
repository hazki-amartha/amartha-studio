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
//   KPI     — the seven monthly parameters, checked rather than handed over.
//   Profil  — her own record, and the settings nobody navigates to twice a day.
//
// Five is the ceiling, and this hits it. The two added here are both LOOK-UP
// surfaces, which is why they sit right of Majelis and left of nothing that
// starts work: the bar runs from what she does today to what she is.
//
// The bar shows on those five screens ONLY. Inside a pelayanan it is hidden: a
// visit is a three-stage sequence with its own sticky CTA, and offering "jump to
// KPI" mid-collection is how focused work turns back into browsing.

import { NavigationBar } from '@/design-system/components'
// `Contact` and `User` come from the shared set rather than this project's
// local icons: a person-card and a single silhouette are exactly the pair that
// separates "a list of borrowers" from "me", and the local file has neither.
import { Contact, User } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { IconCalendar, IconChart, IconUsers } from './icons'

export type TabId = 'today' | 'majelis-list' | 'mitra-list' | 'kpi' | 'profile'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'today', label: 'Tugas', icon: <IconCalendar /> },
  { id: 'majelis-list', label: 'Majelis', icon: <IconUsers /> },
  { id: 'mitra-list', label: 'Mitra', icon: <Contact /> },
  { id: 'kpi', label: 'KPI', icon: <IconChart /> },
  { id: 'profile', label: 'Profil', icon: <User /> },
]

export function TabBar({ active }: { active: TabId }) {
  const flow = useFlow()

  return (
    // Pinned to the bottom of the scrollport, edge to edge — the Screen
    // primitive owns the 16px page padding, so the bar negates it.
    <div className="sticky bottom-0 -mx-16 mt-auto">
      <NavigationBar
        items={TABS.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon,
          active: tab.id === active,
          onClick: () => {
            if (tab.id !== active) flow.go(tab.id)
          },
        }))}
      />
    </div>
  )
}
