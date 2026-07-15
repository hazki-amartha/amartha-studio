# Components Overview — FunDS Lite

All components are exported from `@funds/funds-lite`. Import component CSS once at the app root:

```tsx
import '@funds/funds-lite/styles'
```

---

## Component Inventory

| Component | Import | Primary Use |
|-----------|--------|-------------|
| `Button` | `import { Button } from '@funds/funds-lite'` | Actions and CTAs |
| `Input` | `import { Input } from '@funds/funds-lite'` | Text fields, selects |
| `Badge` | `import { Badge } from '@funds/funds-lite'` | Status labels |
| `Toggle` | `import { Toggle } from '@funds/funds-lite'` | On/off settings |
| `SelectableCard` | `import { SelectableCard } from '@funds/funds-lite'` | Radio/checkbox cards |
| `Modal` | `import { Modal } from '@funds/funds-lite'` | Dialog overlays |
| `BottomSheet` | `import { BottomSheet } from '@funds/funds-lite'` | Mobile drawers |
| `NavigationBar` | `import { NavigationBar } from '@funds/funds-lite'` | Bottom tab bar |
| `NavigationHeader` | `import { NavigationHeader } from '@funds/funds-lite'` | Top app bar |

---

## Shared Rules

- **Shape:** Buttons and badges are ALWAYS pill-shaped (9999px radius). Cards are always 12px radius.
- **Font:** Inter only. Weight 500 (body) or 700 (headings, buttons, active states).
- **Primary color:** `--primary-500` (#853291) for every active state, primary button, and link.
- **Disabled state:** `--neutral-200` background, `--neutral-500` text, `cursor: not-allowed`.
- **Focus ring:** 2px white outline + 4px `--primary-200` glow on interactive elements.
- **Overlay:** `rgba(17, 25, 40, 0.8)` for modal and bottom sheet backdrops.

---

## Quick Examples

```tsx
// Primary CTA
<Button variant="primary" size="md">Lanjutkan</Button>

// Status badge
<Badge intent="green" variant="subtle">Funded</Badge>

// Amount input with currency prefix
<Input label="Jumlah" prefix="Rp" placeholder="0" />

// Toggle setting
<Toggle label="Ingat saya" defaultChecked />

// Selection card
<SelectableCard title="Tenor 12 Bulan" description="Rp 500rb/bulan" inputType="radio" name="tenor" />

// Confirmation modal
<Modal open={open} onClose={close} title="Konfirmasi" description="Lanjutkan investasi?" primaryAction={<Button>Ya</Button>} secondaryAction={<Button variant="ghost">Batal</Button>} />

// Bottom sheet
<BottomSheet open={open} onClose={close} title="Pilih Produk" primaryAction={<Button>Pilih</Button>} />

// Bottom nav
<NavigationBar items={[{ id: 'home', label: 'Beranda', icon: <HomeIcon />, active: true }]} />

// Top bar
<NavigationHeader title="Detail Investasi" onBack={() => router.back()} />
```
