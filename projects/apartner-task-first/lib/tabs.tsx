'use client'

// The app's three destinations, and the rule about where they appear.
//
// Until now this direction had exactly one surface — the schedule — because the
// premise is "open the app, see the next thing to do". A tab bar is the first
// thing that can undo that, so the split is deliberate:
//
//   Jadwal  — the answer to "what do I do now?". Still the entry screen.
//   Majelis — the answer to "where is Majelis Melati?" when the BP is NOT being
//             sent there by the schedule. A BM asks, a mitra calls, a visit gets
//             moved: today the BP has no way to reach a group off-schedule.
//   KPI     — the four daily targets. They exist, they are real, and BPs are
//             measured on them — but keeping them OFF the schedule and behind a
//             tab is exactly the argument this direction makes: a score is
//             something you check, not something you are handed while working.
//
// The bar shows on those three screens ONLY. Inside a visit it is hidden: a
// visit is a sequence with its own sticky CTA, and offering "jump to KPI" in the
// middle of a collection queue is how a focused task turns back into browsing.

import { NavigationBar } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { IconCalendar, IconChart, IconUsers } from './icons'

export type TabId = 'today' | 'majelis-list' | 'kpi'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'today', label: 'Jadwal', icon: <IconCalendar /> },
  { id: 'majelis-list', label: 'Majelis', icon: <IconUsers /> },
  { id: 'kpi', label: 'KPI', icon: <IconChart /> },
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
