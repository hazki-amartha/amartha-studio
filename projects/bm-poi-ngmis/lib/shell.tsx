'use client'

// The BM's sidebar, identical on every NG-MIS BM screen — copied rather than
// imported from `projects/ngmis-bm-monitoring/lib/shell.tsx` and `lib/ui.tsx`
// (§1: a project never reaches into another project's folder). Trimmed to the
// pieces this project actually renders: the nav, the breadcrumb/heading shell,
// and the promo card. Lands on Branches ▸ POI creation.

import { useState, type ReactNode } from 'react'
import {
  Bank,
  Calculator,
  ChartLineUp,
  ChevronDown,
  ChevronUp,
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
import { Wordmark } from '@/design-system/assets'

const SIDEBAR_W = 216
const NAV_ITEM_H = 40

interface NavItem {
  id: string
  label: string
  icon: ReactNode
  children?: { id: string; label: string }[]
}

const NAV: NavItem[] = [
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

const FOOTER_NAV: NavItem[] = [
  { id: 'report', label: 'Report', icon: <ChartLineUp size={20} /> },
  { id: 'settings', label: 'Settings', icon: <GearSix size={20} /> },
]

const USER = { name: 'John Doe', role: 'Finance', initial: 'F' }

function NavButton({
  item,
  activeId,
  open,
  onToggle,
  onSelect,
}: {
  item: NavItem
  activeId: string
  open: boolean
  onToggle: () => void
  onSelect: (id: string) => void
}) {
  const hasChildren = !!item.children?.length
  const sectionActive = open || item.children?.some((c) => c.id === activeId)
  const active = item.id === activeId

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => (hasChildren ? onToggle() : onSelect(item.id))}
        aria-expanded={hasChildren ? open : undefined}
        className={`flex items-center gap-12 rounded-8 px-8 text-14 ${
          active
            ? 'font-bold text-link'
            : sectionActive
              ? 'bg-primary-50 font-bold text-link'
              : 'font-regular text-default hover:bg-neutral-50'
        }`}
        style={{ height: NAV_ITEM_H }}
      >
        <span
          className={`flex size-24 shrink-0 items-center justify-center rounded-8 ${
            sectionActive ? 'bg-primary-500 text-neutral-white' : 'text-caption'
          } ${active && !hasChildren ? 'text-link' : ''}`}
        >
          {item.icon}
        </span>
        <span className="flex-1 truncate text-left">{item.label}</span>
        {hasChildren ? (
          <span className="text-caption">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        ) : null}
      </button>

      {hasChildren && open ? (
        <div className="flex flex-col gap-2 py-4">
          {item.children?.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => onSelect(child.id)}
              className={`rounded-8 py-8 pl-48 pr-8 text-left text-14 ${
                child.id === activeId
                  ? 'bg-primary-50 font-bold text-link'
                  : 'font-regular text-default hover:bg-neutral-50'
              }`}
            >
              {child.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SidebarPromo() {
  return (
    <div className="flex flex-col items-center gap-8 rounded-12 bg-primary-50 p-12 text-center">
      <span className="flex size-32 items-center justify-center rounded-full bg-primary-500 text-neutral-white">
        <LightningFill size={16} />
      </span>
      <span className="text-12 font-bold text-default">We've updated our portal!</span>
      <span className="text-10 text-caption">Back to the old version? click the button below.</span>
      <button
        type="button"
        className="w-full rounded-full border border-primary-500 px-8 py-4 text-10 font-bold text-link"
      >
        Go to old version
      </button>
    </div>
  )
}

function SideNav({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(
    () => NAV.find((item) => item.children?.some((c) => c.id === activeId))?.id ?? null,
  )

  return (
    <nav
      className="flex shrink-0 flex-col border-r border-default bg-neutral-white"
      style={{ width: SIDEBAR_W }}
    >
      <div className="flex items-center px-16 py-20">
        <Wordmark name="amartha" height={24} />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-8">
        <div className="flex flex-col">
          {NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              activeId={activeId}
              open={item.id === openId}
              onToggle={() => setOpenId(item.id === openId ? null : item.id)}
              onSelect={onSelect}
            />
          ))}
        </div>

        <div className="flex flex-col gap-8 pb-8">
          <SidebarPromo />
          {FOOTER_NAV.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              activeId={activeId}
              open={item.id === openId}
              onToggle={() => setOpenId(item.id === openId ? null : item.id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-8 border-t border-default bg-neutral-50 px-16 py-12">
        <span className="flex size-24 shrink-0 items-center justify-center rounded-full bg-green-500 text-12 font-bold text-neutral-white">
          {USER.initial}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-12 font-bold text-default">{USER.name}</span>
          <span className="truncate text-10 text-caption">{USER.role}</span>
        </span>
      </div>
    </nav>
  )
}

export function Breadcrumbs({ items }: { items: { label: string; current?: boolean }[] }) {
  return (
    <div className="flex shrink-0 items-center gap-4 py-12 text-12">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-4">
          {i > 0 ? <span className="text-placeholder">/</span> : null}
          <span className={item.current ? 'text-caption' : 'text-default underline'}>
            {item.label}
          </span>
        </span>
      ))}
    </div>
  )
}

export function PageHeading({
  title,
  meta,
  actions,
}: {
  title: string
  meta?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-start justify-between gap-16 py-16">
      <div className="flex flex-col gap-4">
        <h1 className="text-24 font-bold text-default">{title}</h1>
        {meta ? <span className="text-12 text-caption">{meta}</span> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-8">{actions}</div> : null}
    </div>
  )
}

export function BmShell({
  breadcrumbs,
  children,
}: {
  breadcrumbs?: { label: string; current?: boolean }[]
  children: ReactNode
}) {
  // Which nav item is lit is chrome, not flow: it never leaves the dashboard
  // section, so it stays local to the shell. Starts on Branches ▸ POI
  // creation — the screen this project is about.
  const [navId, setNavId] = useState('poi-creation')

  return (
    <div className="relative flex h-full bg-neutral-white">
      <SideNav activeId={navId} onSelect={setNavId} />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-neutral-50">
        {breadcrumbs?.length ? (
          <div className="shrink-0 border-b border-default bg-neutral-white px-24">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col px-24 pb-24 pt-16">{children}</div>
      </div>
    </div>
  )
}
