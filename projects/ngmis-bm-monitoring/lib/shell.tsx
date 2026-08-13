'use client'

// The BM's sidebar — kept out of the screen so the nav list and the user row
// are written once rather than repeated wherever the shell is drawn.

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
import { MisShell, SideNav, SidebarPromo, type NavItem } from './ui'

const NAV: NavItem[] = [
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

const FOOTER_NAV: NavItem[] = [
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
    <MisShell
      breadcrumbs={breadcrumbs}
      header={header}
      sidebar={
        <SideNav
          items={NAV}
          footerItems={FOOTER_NAV}
          activeId={navId}
          onSelect={setNavId}
          user={USER}
          promo={
            <SidebarPromo
              icon={<LightningFill size={16} />}
              title="We've updated our portal!"
              body="Back to the old version? click the button below."
              action="Go to old version"
              onAction={() => undefined}
            />
          }
        />
      }
    >
      {children}
    </MisShell>
  )
}
