'use client'

// The BM's sidebar — kept out of the screen so the nav list is written once
// rather than repeated wherever the shell is drawn. The frame is the shared
// `AppShell`: the amartha lockup and the account chip ride in its 40px header,
// and the hamburger there collapses the sidebar to an icon rail.

import { useState, type ReactNode } from 'react'
import {
  Bank,
  Calculator,
  ChartLineUp,
  Contact,
  Coins,
  GearSix,
  Layout,
  LightningFill,
  Sliders,
  TransferArrow,
  Transfer,
  Umbrella,
} from '@/design-system/icons'
import { AppShell, SideNav, type AppNavItem } from '@/design-system/components'
import { SidebarPromo } from './ui'

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
]

const FOOTER_NAV: AppNavItem[] = [
  { id: 'report', label: 'Report', icon: <ChartLineUp size={20} /> },
  { id: 'settings', label: 'Settings', icon: <GearSix size={20} /> },
]

const USER = { name: 'John Doe', role: 'Finance', initial: 'F' }

export function BmShell({
  breadcrumbs,
  header,
  children,
}: {
  breadcrumbs?: { label: string; current?: boolean }[]
  header?: ReactNode
  children: ReactNode
}) {
  // Which nav item is lit is chrome, not flow: it never leaves the dashboard
  // section, so it stays local to the shell.
  const [navId, setNavId] = useState('dashboard')

  return (
    <AppShell
      user={USER.initial}
      breadcrumbs={breadcrumbs}
      header={header}
      sidebar={(collapsed) => (
        <SideNav
          items={[...NAV, ...FOOTER_NAV]}
          activeId={navId}
          collapsed={collapsed}
          onSelect={setNavId}
          footer={
            <SidebarPromo
              icon={<LightningFill size={16} />}
              title="We've updated our portal!"
              body="Back to the old version? click the button below."
              action="Go to old version"
              onAction={() => undefined}
            />
          }
        />
      )}
    >
      {children}
    </AppShell>
  )
}
