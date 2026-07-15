# Modal

Temporary dialog window displayed on top of main content. Has one visual state: open or closed.

```tsx
import { Modal } from '@funds/funds-lite'
import { Button } from '@funds/funds-lite'

<Modal
  open={isOpen}
  onClose={() => setOpen(false)}
  title="Konfirmasi Investasi"
  description="Apakah Anda yakin ingin melanjutkan investasi sebesar Rp 1.000.000?"
  primaryAction={<Button variant="primary">Ya, Lanjutkan</Button>}
  secondaryAction={<Button variant="ghost">Batal</Button>}
/>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | Controls visibility |
| `onClose` | `() => void` | — | Called when closed |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Modal width |
| `variant` | `'default' \| 'dialog'` | `'default'` | Layout variant |
| `intent` | `'success' \| 'warning' \| 'error' \| 'info'` | — | Icon color (dialog variant only) |
| `title` | `string` | — | Dialog heading |
| `description` | `string` | — | Body copy |
| `slot` | `ReactNode` | — | Custom content above description |
| `primaryAction` | `ReactNode` | — | Primary CTA (right-aligned) |
| `secondaryAction` | `ReactNode` | — | Secondary action (rendered first) |
| `hideClose` | `boolean` | `false` | Hides the X close button |

---

## Variants

| Variant | Layout |
|---------|--------|
| `default` | Title + description + optional slot + action row |
| `dialog` | Intent icon (colored SVG) + title + description + action row |

Dialog intents: `success` (green) · `warning` (orange) · `error` (red) · `info` (blue)

---

## Sizes

| Size | Width |
|------|-------|
| `sm` | 320px |
| `md` | 400px (default) |
| `lg` | 560px |

---

## Behavior

- Closes on: Escape key, overlay click, or close button
- Overlay: `rgba(17, 25, 40, 0.8)` backdrop
- Entrance animation: fade + scale up
- Surface: white, 12px radius, 16px padding

---

## Examples

```tsx
// Success dialog
<Modal
  open={open}
  onClose={close}
  variant="dialog"
  intent="success"
  title="Investasi Berhasil"
  description="Dana Anda telah berhasil diinvestasikan."
  primaryAction={<Button>Kembali ke Beranda</Button>}
/>

// With custom slot content
<Modal
  open={open}
  onClose={close}
  title="Detail Transaksi"
  slot={<TransactionSummary />}
  primaryAction={<Button>Konfirmasi</Button>}
  secondaryAction={<Button variant="outline">Batal</Button>}
/>
```

---

## Rules

- Use `dialog` variant for feedback states (success, error, warning, info) — do NOT build these manually
- Use `default` variant for content-heavy dialogs (forms, summaries, confirmations)
- Always provide both `primaryAction` and `onClose` — do NOT create a modal with no exit
- `hideClose` should only be used when the action buttons are the only intended exit paths
- Do NOT use modals for navigation or multi-step flows — use bottom sheets or separate screens
