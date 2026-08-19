'use client'

// Sales — the BP's selling surface, and for now a placeholder. It took the
// bottom-bar slot KPI used to hold (KPI moved into the Profil menu). The screen
// is deliberately blank until the concept for it is settled; all it carries is
// the tab bar, so the slot is reachable and the rest of the bar still works.

import { TopBar } from '@/platform/primitives'
import { AppScreen, EmptyState } from '../lib/ui'
import { TabBar } from '../lib/tabs'

export function SalesScreen() {
  return (
    <AppScreen topBar={<TopBar>Sales</TopBar>}>
      <EmptyState title="Segera hadir" body="Halaman Sales masih dalam penyusunan." />
      <TabBar active="sales" />
    </AppScreen>
  )
}
