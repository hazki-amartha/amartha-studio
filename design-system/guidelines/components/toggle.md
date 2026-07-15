# Toggle

Binary on/off switch for a setting. Pill-shaped track with circular thumb. On state shows a check icon and primary-500 track.

```tsx
import { Toggle } from '@funds/funds-lite'

<Toggle size="sm" label="Ingat saya" helperText="Simpan login untuk sesi berikutnya." defaultChecked />
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md'` | `'sm'` | Track and thumb size |
| `label` | `string` | — | Label shown beside toggle |
| `helperText` | `string` | — | Supporting text below label |
| `checked` | `boolean` | — | Controlled checked state |
| `defaultChecked` | `boolean` | `false` | Initial checked state (uncontrolled) |
| `disabled` | `boolean` | `false` | Disables interaction |
| `onChange` | `(e) => void` | — | Change handler |

Accepts all native `<input type="checkbox">` attributes.

---

## States

| State | Track | Thumb |
|-------|-------|-------|
| Off | `--neutral-400` | `--neutral-white` |
| On | `--primary-500` | `--neutral-white` + check icon |
| Disabled (off) | `--neutral-200` | `--neutral-50` |
| Disabled (on) | `--neutral-200` | `--neutral-50` + dim check |

Focus ring: 2px white + 4px `--primary-200` around the track.

---

## Sizes

| Size | Track | Thumb |
|------|-------|-------|
| `sm` | 32×20px | 16×16px |
| `md` | 44×24px | 20×20px |

---

## Examples

```tsx
// Basic toggle
<Toggle label="Notifikasi" />

// Pre-checked with helper text
<Toggle
  size="md"
  label="Autodebet"
  helperText="Pembayaran akan otomatis dipotong dari Poket"
  defaultChecked
/>

// Controlled
<Toggle checked={isEnabled} onChange={(e) => setEnabled(e.target.checked)} label="Aktif" />
```

---

## Rules

- Use `sm` size in dense lists or settings; `md` for prominent settings or feature toggles
- Always provide a `label` so the toggle has accessible context
- Do NOT use a toggle where the outcome is not immediately applied — use a checkbox instead
