'use client'

// The BM's NGMIS sidebar — the shared `AppShell`/`SideNav` (promoted from the
// NG-MIS shell into `@/design-system/components`, so it's used here, not
// copied — importing a shared component is ordinary Tier 1 project work). The
// nav LIST itself is copied from `projects/ngmis-bm-monitoring/lib/shell.tsx`
// (§1: a project never reaches into another project's folder), reordered so
// Branches lands open on POI creation — the screen this project is about —
// with FO monitoring right below it.

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
import { AppShell, SideNav, type AppNavItem, type Breadcrumb } from '@/design-system/components'
import { SidebarPromo } from './ui'

const NAV: AppNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Layout size={20} /> },
  { id: 'customer', label: 'Customer', icon: <Contact size={20} /> },
  { id: 'loans', label: 'Loans', icon: <Coins size={20} /> },
  { id: 'matchmaking', label: 'Matchmaking', icon: <Transfer size={20} /> },
  { id: 'accounting', label: 'Accounting', icon: <Calculator size={20} /> },
  {
    id: 'branches',
    label: 'Branches',
    icon: <Bank size={20} />,
    children: [
      { id: 'poi-creation', label: 'POI creation' },
      { id: 'fo-monitoring', label: 'FO monitoring' },
      { id: 'overview', label: 'Overview' },
      { id: 'activity', label: 'Activity' },
      { id: 'organization', label: 'Organization' },
      { id: 'majelis', label: 'Majelis' },
    ],
  },
  { id: 'transactions', label: 'Transactions', icon: <TransferArrow size={20} /> },
  { id: 'insurance', label: 'Insurance', icon: <Umbrella size={20} /> },
  { id: 'product-config', label: 'Product Config', icon: <Sliders size={20} /> },
]

const FOOTER_NAV: AppNavItem[] = [
  { id: 'report', label: 'Report', icon: <ChartLineUp size={20} /> },
  { id: 'settings', label: 'Settings', icon: <GearSix size={20} /> },
]

const USER = 'F'

export function BmShell({ breadcrumbs, children }: { breadcrumbs?: Breadcrumb[]; children: ReactNode }) {
  // Which nav item is lit is chrome, not flow — it stays local to the shell.
  // Starts on Branches ▸ POI creation, the screen this project is about.
  const [navId, setNavId] = useState('poi-creation')

  return (
    <AppShell
      user={USER}
      breadcrumbs={breadcrumbs}
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
