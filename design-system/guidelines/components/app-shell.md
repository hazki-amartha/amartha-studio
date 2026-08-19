# App Shell

**Desktop only.** The NG-MIS back-office frame: a 40px header across the top and
a 232px sidebar down the left, both persistent across navigation, with a
scrolling content column beside them. A desktop project uses `AppShell`
**instead of** `Screen` — `Screen` is mobile-shaped (32px status strip, 48px top
bar, 16px page padding) and pins one bar only.

```tsx
import { AppShell, SideNav, type AppNavItem } from '@/design-system/components'

const NAV: AppNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Layout size={20} /> },
  {
    id: 'loan',
    label: 'Loan',
    icon: <Coins size={20} />,
    children: [{ id: 'loan-repayment', label: 'Repayment' }],
  },
  { id: 'branches', label: 'Branches', icon: <Bank size={20} /> },
]

<AppShell
  user="P"
  breadcrumbs={[{ label: 'Home' }, { label: 'Branches', current: true }]}
  header={<PageHeading title="Monitoring BP" />}
  sidebar={(collapsed) => (
    <SideNav items={NAV} activeId={navId} collapsed={collapsed} onSelect={setNavId} />
  )}
>
  {/* content */}
</AppShell>
```

---

## Props

### `AppShellProps`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sidebar` | `(collapsed: boolean) => ReactNode` | — | The sidebar, as a function of the collapse flag the header owns |
| `user` | `string` | — | The initial shown in the header's account chip |
| `breadcrumbs` | `Breadcrumb[]` | — | `{ label, current?, onClick? }` |
| `header` | `ReactNode` | — | Full-bleed white block: page title, filter row, tabs. Passing one moves the breadcrumbs inside it |
| `canvas` | `'tinted' \| 'white'` | `'tinted'` | `tinted` is the neutral-50 back-office canvas |
| `contentClassName` | `string` | `px-24 pb-24 pt-16` | Padding for the content column only — the chrome above is fixed |

### `SideNavProps`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `AppNavItem[]` | — | `{ id, label, icon, children? }` — `children` makes it a group |
| `activeId` | `string` | — | Which row is lit; a group lights when a child is active |
| `collapsed` | `boolean` | — | Icon-only rail. Comes from `AppShell`, never your own state |
| `onSelect` | `(id: string) => void` | — | Row press |
| `footer` | `ReactNode` | — | Pinned below the nav, hidden while collapsed |

---

## Geometry

Measured off the shipped NG-MIS frame (Figma node 28640-12376, 1440×900). These
are frame geometry, like a device bezel — not spacing tokens, and not open to
taste:

| Part | Size |
|------|------|
| Header | 40px tall, 16px gutters |
| Sidebar | 232px, 8px padding |
| Sidebar rail (collapsed) | 56px |
| Nav row | 40px tall, 8px radius |
| Sub-item indent | 48px |
| Account chip | 24px circle, `green-50` on `green-600` |

---

## Rules

- **`AppShell` owns the collapse flag.** The header hamburger toggles it and
  hands it to your `sidebar` function. Never keep your own `collapsed` state.
- **Groups expand in place**, pushing the list down. One open at a time — the
  shipped sidebar never opens a flyout.
- **Do NOT rebuild this frame per project.** Five NG-MIS prototypes did, drifted
  into three different headers, and that drift is why it lives here.
- **Do NOT change the geometry to suit a screen.** A different frame is a
  proposed change to the product; say so out loud rather than shipping it inside
  a prototype about something else.
- `projects/ngmis-live/` is the reference implementation — the desktop
  counterpart to `amarthafin-live`. Read it before changing chrome.
