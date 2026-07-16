'use client'

// The three-tab shell. In the source draft a single <App> held the tab state and
// swapped page components in place; here each tab is a real screen, so the bar
// navigates with useFlow().go() and marks itself active from flow.current.

import { NavigationBar } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { IconChart, IconHouse, IconUsers } from './icons'
import { store, unreadCount, useApp } from './store'

export type TabId = 'home' | 'majelis' | 'kpi'

/**
 * Bottom tab bar. Sits inside the Screen primitive's padded content area, so it
 * bleeds back out to the frame edges with -mx-16 and is pushed to the bottom
 * with mt-auto (the Screen primitive has no bottomBar slot of its own).
 */
export function TabBar({ active }: { active: TabId }) {
  const flow = useFlow()
  const s = useApp()
  const unread = unreadCount(s.notifs)

  // Leaving a tab drops that tab's transient filters, matching the source's
  // switchTab, which reset the task filter and majelis sort on every tab change.
  function goTab(id: TabId) {
    if (id === active) return
    if (id !== 'home') store.resetFilter()
    if (id !== 'majelis') store.resetMajelisFilters()
    flow.go(id)
  }

  return (
    <div className="-mx-16 mt-auto">
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
            icon: <IconChart />,
            active: active === 'kpi',
            onClick: () => goTab('kpi'),
          },
        ]}
      />
    </div>
  )
}
