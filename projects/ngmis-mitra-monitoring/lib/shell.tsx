'use client'

// The NG-MIS chrome, as the live FO monitoring page draws it: a 40px header
// (menu, amartha, avatar), a white sidebar panel with Branches open, and the
// page itself as one bordered card — title and filters, tabs, then the body.
// Geometry is frame geometry, so widths are inline styles (the spacing scale
// stops at 48px).

import { useState, type ReactNode } from 'react'
import { Wordmark } from '@/design-system/assets'
import {
  Bank,
  Calculator,
  ChartLineUp,
  ChevronDown,
  ChevronUp,
  Coins,
  Contact,
  GearSix,
  Layout,
  Sliders,
  TransferArrow,
  Umbrella,
} from '@/design-system/icons'

const HEADER_H = 40
const SIDEBAR_W = 232
const NAV_ITEM_H = 40

interface Item {
  id: string
  label: string
  icon: ReactNode
  children?: { id: string; label: string }[]
}

const NAV: Item[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Layout size={20} /> },
  { id: 'customers', label: 'Customers', icon: <Contact size={20} />, children: [] },
  { id: 'loan', label: 'Loan', icon: <Coins size={20} />, children: [] },
  {
    id: 'branches',
    label: 'Branches',
    icon: <Bank size={20} />,
    children: [
      { id: 'fo-monitoring', label: 'FO monitoring' },
      { id: 'mitra-monitoring', label: 'Mitra monitoring' },
      { id: 'activity', label: 'Activity' },
      { id: 'organization', label: 'Organization' },
      { id: 'majelis', label: 'Majelis' },
    ],
  },
  { id: 'investments', label: 'Investments', icon: <ChartLineUp size={20} />, children: [] },
  { id: 'transactions', label: 'Transactions', icon: <TransferArrow size={20} />, children: [] },
  { id: 'accounting', label: 'Accounting', icon: <Calculator size={20} />, children: [] },
  { id: 'risk', label: 'Risk Management', icon: <Umbrella size={20} />, children: [] },
  { id: 'configurations', label: 'Configurations', icon: <Sliders size={20} />, children: [] },
  { id: 'reports', label: 'Reports', icon: <ChartLineUp size={20} />, children: [] },
  { id: 'settings', label: 'Settings', icon: <GearSix size={20} />, children: [] },
]

function Menu() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function BmShell({
  breadcrumbs,
  header,
  children,
}: {
  breadcrumbs?: { label: string; current?: boolean }[]
  /** Title + filters, then the tabs — the top of the page card. */
  header?: ReactNode
  /** The card's body, under the tabs. */
  children: ReactNode
}) {
  // Which item is lit is chrome, not flow, so it stays local. Branches opens
  // on FO monitoring — this page.
  const [navId, setNavId] = useState('fo-monitoring')
  const [open, setOpen] = useState<string | null>('branches')

  return (
    <div className="flex h-full flex-col bg-neutral-white">
      <header
        className="flex shrink-0 items-center justify-between border-b border-default bg-neutral-white px-16"
        style={{ height: HEADER_H }}
      >
        <span className="flex items-center gap-16">
          <span className="text-default">
            <Menu />
          </span>
          <Wordmark name="amartha" height={20} />
        </span>
        <span className="flex items-center gap-4 text-caption">
          <span className="flex size-24 items-center justify-center rounded-full bg-green-50 text-12 font-bold text-green-600">
            P
          </span>
          <ChevronDown size={16} />
        </span>
      </header>

      <div className="flex min-h-0 flex-1 bg-neutral-50">
        <nav
          className="m-8 flex shrink-0 flex-col justify-between overflow-y-auto rounded-12 bg-neutral-white p-8"
          style={{ width: SIDEBAR_W }}
        >
          <div className="flex flex-col pt-8">
            {NAV.map((item) => {
              const group = item.children !== undefined
              const isOpen = open === item.id
              const on = item.children?.some((c) => c.id === navId) ?? false
              return (
                <div key={item.id} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : item.id)}
                    className={`flex items-center gap-12 rounded-8 px-8 text-14 ${
                      on ? 'font-bold text-link' : 'font-regular text-default hover:bg-neutral-50'
                    }`}
                    style={{ height: NAV_ITEM_H }}
                  >
                    <span
                      className={
                        on
                          ? 'flex size-24 items-center justify-center rounded-8 bg-primary-500 text-neutral-white'
                          : 'text-caption'
                      }
                    >
                      {item.icon}
                    </span>
                    <span className="flex-1 truncate text-left">{item.label}</span>
                    {group ? (
                      <span className={on ? 'text-link' : 'text-caption'}>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    ) : null}
                  </button>
                  {isOpen
                    ? item.children?.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setNavId(c.id)}
                          className={`flex items-center rounded-8 pl-48 pr-8 text-left text-14 ${
                            navId === c.id ? 'font-bold text-link' : 'font-regular text-default hover:bg-neutral-50'
                          }`}
                          style={{ height: NAV_ITEM_H }}
                        >
                          {c.label}
                        </button>
                      ))
                    : null}
                </div>
              )
            })}
          </div>
          <span className="px-8 pb-8 text-12 font-bold text-link">Go to old version</span>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto pr-16">
          {breadcrumbs?.length ? (
            <div className="flex shrink-0 items-center gap-4 py-12 text-12">
              {breadcrumbs.map((b, i) => (
                <span key={b.label} className="flex items-center gap-4">
                  {i > 0 ? <span className="text-placeholder">/</span> : null}
                  <span className={b.current ? 'text-default' : 'text-link underline'}>{b.label}</span>
                </span>
              ))}
            </div>
          ) : null}
          <div className="mb-16 flex flex-col rounded-16 border border-default bg-neutral-white">
            <div className="px-16">{header}</div>
            <div className="border-t border-default" />
            <div className="flex flex-col px-16 pb-16 pt-16">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
