'use client'

// The BM's chrome, identical on every screen — so each screen renders
// `<BmShell>` rather than repeating the nav list. Copied and adapted from
// projects/ngmis-bm-monitoring (§1: never import across projects); the nav lands
// on "Branches", where a branch scorecard lives. The amartha lockup and the account
// chip live in the shared `AppShell`'s 40px header; the hamburger there
// collapses the sidebar to an icon rail (the `collapsed` flag it passes in).

import { useState, type ReactNode } from 'react'
import {
  Bank,
  Calculator,
  ChartLineUp,
  Contact,
  Coins,
  GearSix,
  Layout,
  Sliders,
  TransferArrow,
  Transfer,
  Umbrella,
} from '@/design-system/icons'
import { AppShell, SideNav, type AppNavItem } from '@/design-system/components'

const NAV: AppNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Layout size={20} /> },
  { id: 'customer', label: 'Customer', icon: <Contact size={20} /> },
  { id: 'loans', label: 'Loans', icon: <Coins size={20} /> },
  { id: 'matchmaking', label: 'Matchmaking', icon: <Transfer size={20} /> },
  { id: 'accounting', label: 'Accounting', icon: <Calculator size={20} /> },
  { id: 'branches', label: 'Branches', icon: <Bank size={20} /> },
  { id: 'transactions', label: 'Transactions', icon: <TransferArrow size={20} /> },
  { id: 'insurance', label: 'Insurance', icon: <Umbrella size={20} /> },
  { id: 'product-config', label: 'Product Config', icon: <Sliders size={20} /> },
  { id: 'report', label: 'Report', icon: <ChartLineUp size={20} /> },
  { id: 'settings', label: 'Settings', icon: <GearSix size={20} /> },
]

const USER = { name: 'Rina Marlina', role: 'Branch Manager', initial: 'R' }

export function BmShell({
  breadcrumbs,
  header,
  children,
}: {
  breadcrumbs?: { label: string; current?: boolean }[]
  header?: ReactNode
  children: ReactNode
}) {
  // Which nav item is lit is chrome, not flow: this surface lives under
  // Branches, so it stays local to the shell.
  const [navId, setNavId] = useState('branches')

  return (
    <AppShell
      breadcrumbs={breadcrumbs}
      header={header}
      user={USER.initial}
      sidebar={(collapsed) => (
        <SideNav items={NAV} activeId={navId} onSelect={setNavId} collapsed={collapsed} />
      )}
    >
      {children}
    </AppShell>
  )
}
