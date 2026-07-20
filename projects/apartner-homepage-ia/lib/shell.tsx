'use client'

// The three-tab shell. In the source draft a single <App> held the tab state and
// swapped page components in place; here each tab is a real screen, so the bar
// navigates with useFlow().go() and marks itself active from flow.current.

import { NavigationBar } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { KPI_PERIODS, buildKpi } from './data'
import { IconHouse, IconUsers } from './icons'
import { store, unreadCount, useApp } from './store'

export type TabId = 'home' | 'majelis' | 'kpi'

/**
 * Bottom tab bar. Sits inside the Screen primitive's padded content area, so it
 * bleeds back out to the frame edges with -mx-16, is pushed to the bottom with
 * mt-auto, and pins to the viewport bottom while content scrolls with sticky
 * (the Screen primitive has no bottomBar slot of its own). z-10 keeps it above
 * scrolling content but below sheets/modals (z-1000).
 */
export function TabBar({ active }: { active: TabId }) {
  const flow = useFlow()
  const s = useApp()
  const unread = unreadCount(s.notifs)
  const kpi = buildKpi(KPI_PERIODS[0])

  // Leaving a tab drops that tab's transient filters, matching the source's
  // switchTab, which reset the task filter and majelis sort on every tab change.
  function goTab(id: TabId) {
    if (id === active) return
    if (id !== 'home') store.resetFilter()
    if (id !== 'majelis') store.resetMajelisFilters()
    flow.go(id)
  }

  return (
    <div className="sticky bottom-0 z-10 -mx-16 mt-auto">
      <NavigationBar
        items={[
          {
            id: 'home',
            label: 'Beranda',
            icon: <IconHouse />,
            active: active === 'home',
            badge: unread > 0 ? unread : undefined,
            onClick: () => goTab('home'),
          },
          {
            id: 'majelis',
            label: 'Majelis',
            icon: <IconUsers />,
            active: active === 'majelis',
            onClick: () => goTab('majelis'),
          },
          {
            id: 'kpi',
            label: 'KPI',
            icon: (
              <span
                className={`rounded-full border px-8 py-2 text-12 font-bold ${
                  active === 'kpi' ? 'border-primary-500 text-primary-500' : 'border-default text-neutral-500'
                }`}
              >
                {kpi.metCount}/{kpi.totalParams}
              </span>
            ),
            active: active === 'kpi',
            onClick: () => goTab('kpi'),
          },
        ]}
      />
    </div>
  )
}
