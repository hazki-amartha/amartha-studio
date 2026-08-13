import { useState, type ReactNode } from 'react'
import { Wordmark } from '../assets'
import { ChevronDown, ChevronUp } from '../icons'

// =============================================================================
// The desktop back-office chrome — the NG-MIS shell, promoted.
//
// FunDS Lite is a mobile system, so `Screen` pins one 48px bar and nothing
// else. A back-office tool needs persistent chrome on two axes: a header across
// the top AND a sidebar down the left, both surviving navigation. Five NG-MIS
// prototypes each hand-rolled that, and drifted into three different frames —
// 40px header, no header, 52px header — which is what promoted it here.
//
// The geometry is `projects/ngmis-live/` exactly: the shipped NG-MIS frame
// (Figma node 28640-12376, "Expanded (default state)", 1440×900). A prototype
// that wants a different frame is proposing a change to the product, and should
// say so — it does not get one by accident.
//
// Fixed pixel widths live in CSS rather than the spacing scale: they are frame
// geometry, the same category as a device bezel, and the scale stops at 48px.
// =============================================================================

/**
 * A sidebar row. `children` makes it a group: sub-items expand in place and
 * push the rest of the list down, which is what the shipped sidebar does — it
 * never opens a flyout.
 */
export type AppNavItem = {
  id: string
  label: string
  icon: ReactNode
  children?: { id: string; label: string }[]
}

export type Breadcrumb = {
  label: string
  /** Renders as plain caption text rather than a link — normally the last one. */
  current?: boolean
  onClick?: () => void
}

/** The hamburger. Genuinely absent from the 166-icon set, and only ever drawn
 *  by this header, so it stays private rather than growing the icon module. */
function MenuGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export type AppHeaderProps = {
  /** Toggles the sidebar between full width and the icon rail. */
  onToggleSidebar: () => void
  /** The signed-in initial in the account chip. */
  user: string
}

/** The 40px top bar: hamburger and amartha lockup left, account chip right. */
export function AppHeader({ onToggleSidebar, user }: AppHeaderProps) {
  return (
    <header className="ds-appshell-header" data-fds="AppHeader">
      <div className="ds-appshell-brand">
        <button type="button" onClick={onToggleSidebar} aria-label="Toggle menu" className="ds-appshell-menu">
          <MenuGlyph />
        </button>
        <Wordmark name="amartha" height={20} />
      </div>
      <button type="button" className="ds-appshell-account">
        <span className="ds-appshell-avatar">{user}</span>
        <ChevronDown size={16} />
      </button>
    </header>
  )
}

export type SideNavProps = {
  items: AppNavItem[]
  activeId: string
  /** Icon-only rail. `AppShell` passes this in from the header hamburger. */
  collapsed: boolean
  onSelect: (id: string) => void
  /** Pinned to the bottom, hidden while collapsed — the "go to old version"
   *  link, a promo card, whatever the product puts below the nav. */
  footer?: ReactNode
}

/** The 232px sidebar; 56px as a rail. One group open at a time. */
export function SideNav({ items, activeId, collapsed, onSelect, footer }: SideNavProps) {
  // The shipped shell opens the group holding the active item, and keeps a
  // single group open — opening one closes the last.
  const [openGroup, setOpenGroup] = useState<string | null>(
    () => items.find((i) => i.children?.some((c) => c.id === activeId))?.id ?? null,
  )

  return (
    <nav
      className={['ds-sidenav', collapsed ? 'ds-sidenav-collapsed' : ''].filter(Boolean).join(' ')}
      data-fds="SideNav"
    >
      <div className="ds-sidenav-list">
        {items.map((item) => {
          const group = (item.children?.length ?? 0) > 0
          const open = openGroup === item.id
          const on = activeId === item.id || (group && item.children!.some((c) => c.id === activeId))
          return (
            <div key={item.id} className="ds-sidenav-group">
              <button
                type="button"
                onClick={() => (group ? setOpenGroup(open ? null : item.id) : onSelect(item.id))}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={['ds-sidenav-item', on ? 'ds-sidenav-item-active' : ''].filter(Boolean).join(' ')}
              >
                <span className="ds-sidenav-icon">{item.icon}</span>
                {collapsed ? null : (
                  <>
                    <span className="ds-sidenav-label">{item.label}</span>
                    {group ? (
                      <span className="ds-sidenav-icon">
                        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    ) : null}
                  </>
                )}
              </button>
              {group && open && !collapsed
                ? item.children!.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => onSelect(child.id)}
                      className={[
                        'ds-sidenav-sub',
                        activeId === child.id ? 'ds-sidenav-sub-active' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {child.label}
                    </button>
                  ))
                : null}
            </div>
          )
        })}
      </div>
      {collapsed || !footer ? null : <div className="ds-sidenav-footer">{footer}</div>}
    </nav>
  )
}

export type AppShellProps = {
  /**
   * The sidebar, as a function of the collapsed flag — the header hamburger
   * owns that state, so the nav has to be told rather than ask.
   */
  sidebar: (collapsed: boolean) => ReactNode
  /** The signed-in initial, shown in the header's account chip. */
  user: string
  breadcrumbs?: Breadcrumb[]
  /**
   * A full-bleed white block below the breadcrumbs: page title, filter row,
   * tabs. Passing one moves the breadcrumbs inside it, which is how the
   * shipped screens with a page header are drawn; omitting it leaves the
   * breadcrumbs sitting in the content column.
   */
  header?: ReactNode
  /** `tinted` is the neutral-50 back-office canvas; `white` is a flat page. */
  canvas?: 'tinted' | 'white'
  /** Padding for the content column itself — chrome above is fixed. */
  contentClassName?: string
  children: ReactNode
}

/**
 * The whole 1440×900 frame: header across the top, sidebar down the left, and
 * a scrolling content column. This is the desktop counterpart to `Screen` — a
 * desktop project uses it INSTEAD of Screen, which is mobile-shaped (32px
 * status strip, 48px top bar, 16px page padding, 12px section gap).
 */
export function AppShell({
  sidebar,
  user,
  breadcrumbs,
  header,
  canvas = 'tinted',
  contentClassName = 'px-24 pb-24 pt-16',
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const crumbs = breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : null

  return (
    <div className="ds-appshell" data-fds="AppShell">
      <AppHeader onToggleSidebar={() => setCollapsed((c) => !c)} user={user} />
      <div className="ds-appshell-body">
        {sidebar(collapsed)}
        <div
          className={['ds-appshell-content', canvas === 'tinted' ? 'ds-appshell-content-tinted' : '']
            .filter(Boolean)
            .join(' ')}
        >
          {header ? (
            <div className="ds-appshell-pageheader">
              {crumbs}
              {header}
            </div>
          ) : (
            crumbs
          )}
          <div className={['ds-appshell-main', contentClassName].filter(Boolean).join(' ')}>{children}</div>
        </div>
      </div>
    </div>
  )
}

/** The `Home / Branches / …` trail. Exported because a screen occasionally
 *  draws one outside the shell. */
export function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  return (
    <div className="ds-crumbs" data-fds="Breadcrumbs">
      {items.map((item, i) => (
        <span key={item.label} className="ds-crumbs-item">
          {i > 0 ? <span className="ds-crumbs-sep">/</span> : null}
          {item.onClick && !item.current ? (
            <button type="button" onClick={item.onClick} className="ds-crumbs-link">
              {item.label}
            </button>
          ) : (
            <span className={item.current ? 'ds-crumbs-current' : 'ds-crumbs-link'}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}
