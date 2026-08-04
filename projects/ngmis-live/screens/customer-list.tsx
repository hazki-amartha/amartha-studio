'use client'

// The shipped NG-MIS customer list — the shell reference. Rebuilt from the FunDS
// component library frame (Figma node 28640-12376, 1440×900): 40px header,
// 232px sidebar with in-place group expansion, breadcrumbs, tabs, a toolbar,
// the data table, and pagination.
//
// Everything the viewer can touch is local state: this documents a screen that
// already ships, so there is nowhere else to navigate to.

import { useMemo, useState } from 'react'
import { Button } from '@/design-system/components'
import {
  Bank,
  Calculator,
  Contact,
  GearSix,
  Layout,
  MonitorChart,
  ShieldCheck,
  TransferArrow,
  TrendUp,
  Users,
} from '@/design-system/icons'
import {
  CONTROL_H,
  DataTable,
  MisShell,
  Pagination,
  SideNav,
  Tabs,
  TableCard,
  Toolbar,
  type NavItem,
  type SortDir,
} from '../lib/ui'
import { COLUMNS, ROWS } from '../lib/data'

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Layout size={20} /> },
  { id: 'customers', label: 'Customers', icon: <Contact size={20} /> },
  {
    id: 'loan',
    label: 'Loan',
    icon: <Users size={20} />,
    children: [
      { id: 'loan-applications', label: 'Applications' },
      { id: 'loan-disbursement', label: 'Disbursement' },
      { id: 'loan-repayment', label: 'Repayment' },
    ],
  },
  { id: 'branches', label: 'Branches', icon: <Bank size={20} /> },
  { id: 'investments', label: 'Investments', icon: <TrendUp size={20} /> },
  { id: 'transactions', label: 'Transactions', icon: <TransferArrow size={20} /> },
  { id: 'accounting', label: 'Accounting', icon: <Calculator size={20} /> },
  { id: 'risk', label: 'Risk Management', icon: <ShieldCheck size={20} /> },
  { id: 'configurations', label: 'Configurations', icon: <GearSix size={20} /> },
  { id: 'reports', label: 'Reports', icon: <MonitorChart size={20} /> },
  { id: 'settings', label: 'Settings', icon: <GearSix size={20} /> },
]

const TABS = [
  { id: 'all', label: 'All Customers' },
  { id: 'institutional', label: 'Institutional' },
]

export function CustomerListScreen() {
  const [collapsed, setCollapsed] = useState(false)
  const [navId, setNavId] = useState('loan-repayment')
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [sort, setSort] = useState<{ columnId: string; dir: SortDir } | null>(null)

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const matched = q
      ? ROWS.filter((r) =>
          Object.values(r.cells).some((c) =>
            [String(c.title), ...(c.lines ?? []), c.status?.label ?? '']
              .join(' ')
              .toLowerCase()
              .includes(q),
          ),
        )
      : ROWS
    if (!sort) return matched
    const key = sort.columnId
    return [...matched].sort((a, b) => {
      const av = String(a.cells[key]?.status?.label ?? a.cells[key]?.title ?? '')
      const bv = String(b.cells[key]?.status?.label ?? b.cells[key]?.title ?? '')
      return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [search, sort])

  return (
    <MisShell
      user="P"
      onToggleSidebar={() => setCollapsed((v) => !v)}
      sidebar={
        <SideNav
          items={NAV}
          activeId={navId}
          collapsed={collapsed}
          onSelect={setNavId}
          footer={
            <button type="button" className="text-12 font-bold text-link">
              Go to old version
            </button>
          }
        />
      }
      breadcrumbs={[{ label: 'Home' }, { label: 'User Settings' }, { label: 'User accounts', current: true }]}
    >
      <Tabs items={TABS} activeId={tab} onChange={setTab} />
      <div className="flex min-h-0 flex-1 flex-col py-16">
        <TableCard>
          <Toolbar
            search={search}
            onSearchChange={setSearch}
            onFilter={() => undefined}
            action={
              // Same height as the search field and the filter — see CONTROL_H.
              <Button size="sm" onClick={() => undefined} style={{ height: CONTROL_H }}>
                Action Button
              </Button>
            }
          />
          <DataTable
            columns={COLUMNS}
            rows={rows}
            selected={selected}
            onSelectedChange={setSelected}
            sort={sort}
            onSortChange={(columnId) =>
              setSort((prev) =>
                prev?.columnId === columnId
                  ? { columnId, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                  : { columnId, dir: 'asc' },
              )
            }
          />
          <Pagination page={1} pageCount={1} total={rows.length} onPageChange={() => undefined} />
        </TableCard>
      </div>
    </MisShell>
  )
}
