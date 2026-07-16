# Bottom Sheet

Mobile sheet that slides up from the bottom. Always includes a grip handle. Use for contextual actions, selection, and summaries on mobile screens.

```tsx
import { BottomSheet } from '@/design-system/components'
import { Button } from '@/design-system/components'

<BottomSheet
  open={isOpen}
  onClose={() => setOpen(false)}
  title="Pilih Produk Investasi"
  description="Pilih produk yang sesuai dengan profil risiko Anda."
  primaryAction={<Button variant="primary">Pilih</Button>}
  secondaryAction={<Button variant="outline">Batal</Button>}
/>
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | — | Controls visibility |
| `onClose` | `() => void` | — | Called when closed |
| `size` | `'sm' \| 'md' \| 'fullscreen'` | `'sm'` | Sheet height/width |
| `title` | `string` | — | Sheet heading |
| `description` | `string` | — | Body copy |
| `slot` | `ReactNode` | — | Swappable visual block (image, chart, selection list) |
| `slotPosition` | `'above' \| 'below'` | `'above'` | Slot placement relative to text |
| `primaryAction` | `ReactNode` | — | Full-width primary CTA |
| `secondaryAction` | `ReactNode` | — | Full-width secondary action |
| `hideClose` | `boolean` | `false` | Hides the X close button |

---

## Sizes

| Size | Width | Use |
|------|-------|-----|
| `sm` | 420px max (mobile) | Use this 95% of the time |
| `md` | 560px (responsive) | Wider content / tablet-adjacent |
| `fullscreen` | 100vh, flat top radius | Full-page flows (e.g. detailed selection) |

---

## Behavior

- Closes on: Escape key, overlay click, or close button
- Overlay: `rgba(17, 25, 40, 0.8)` backdrop
- Grip handle: always present at top center
- Entrance animation: slide up from bottom
- Surface: white, 12px top radius (0px when fullscreen), 16px padding
- Actions: equal-width button row at the bottom

---

## Examples

```tsx
// Text-only sheet
<BottomSheet
  open={open}
  onClose={close}
  title="Syarat & Ketentuan"
  description="Dengan melanjutkan, Anda menyetujui syarat dan ketentuan berikut..."
  primaryAction={<Button>Setuju</Button>}
/>

// Sheet with visual slot above text
<BottomSheet
  open={open}
  onClose={close}
  slot={<IllustrationSuccess />}
  slotPosition="above"
  title="OTP Terkirim"
  description="Kode 6 digit telah dikirim ke +62 812 xxx xxxx"
  primaryAction={<Button>Masukkan OTP</Button>}
  secondaryAction={<Button variant="ghost">Kirim Ulang</Button>}
/>

// Fullscreen selection sheet
<BottomSheet
  open={open}
  onClose={close}
  size="fullscreen"
  title="Pilih Rekening Tujuan"
  slot={<BankAccountList />}
  primaryAction={<Button>Konfirmasi</Button>}
/>
```

---

## Rules

- Always use `sm` size unless content explicitly requires more width
- Pick by content, not by name: a **content-bearing confirmation** (order summary, amount + payment method, anything worth reviewing) belongs in a bottom sheet; a **simple yes/no** with nothing to review belongs in `Modal` with the `dialog` variant. If a designer asks for a "confirmation bottom sheet", give the sheet real summary content rather than a bare question
- Actions are always full-width and stacked in a row — do NOT place actions inline in the slot
- Use `slotPosition="below"` when the visual should appear after the text (e.g., a summary card below a description)
