# Input

Text field for user data entry. Supports labels, prefix/suffix, validation states, and helper text.

```tsx
import { Input } from '@/design-system/components'

<Input label="Jumlah Investasi" prefix="Rp" placeholder="0" required />
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Field height |
| `state` | `'default' \| 'focus' \| 'valid' \| 'error'` | `'default'` | Validation state |
| `label` | `string` | — | Field label above input |
| `optionalText` | `string` | — | Text shown next to label (e.g. "Optional") |
| `required` | `boolean` | `false` | Shows red asterisk next to label |
| `description` | `string` | — | Descriptive text below label |
| `helperText` | `string` | — | Validation message below field |
| `placeholder` | `string` | — | Placeholder text |
| `prefix` | `ReactNode` | — | Static or clickable prefix element |
| `suffix` | `ReactNode` | — | Static or clickable suffix element |
| `prefixInteractive` | `boolean` | `false` | Makes prefix a button |
| `suffixInteractive` | `boolean` | `false` | Makes suffix a button |
| `prefixButtonProps` | `ButtonHTMLAttributes` | — | Props passed to prefix button |
| `suffixButtonProps` | `ButtonHTMLAttributes` | — | Props passed to suffix button |
| `disabled` | `boolean` | `false` | Disables the field |

---

## States

| State | Border | Focus Ring |
|-------|--------|------------|
| `default` | `--neutral-200` | — |
| `focus` | `--primary-500` | `--primary-50` 3px |
| `valid` | `--green-500` | — |
| `error` | `--red-500` | `--red-50` 3px |
| `disabled` | `--neutral-200` | — |

- `error` state: use `helperText` to display the error message in `--red-500`
- `valid` state: use `helperText` to display success confirmation in `--green-500`

---

## Examples

```tsx
// Currency amount with clickable prefix
<Input
  label="Jumlah"
  prefix="Rp"
  prefixInteractive
  prefixButtonProps={{ 'aria-label': 'Pilih mata uang' }}
  placeholder="0"
/>

// Error state
<Input
  label="Email"
  state="error"
  helperText="Format email tidak valid"
  value={email}
  onChange={handleChange}
/>

// Optional field with description
<Input
  label="Kode Referral"
  optionalText="Opsional"
  description="Masukkan kode referral jika ada"
  placeholder="Masukkan kode"
/>
```

---

## InputNominal — the large amount field

A separate component, not a size of `Input`. Use it when the screen is asking for
exactly ONE amount and everything else on it is confirmation — a payment sheet, a
top-up, a withdrawal. It is a tile: the label sits inside the 12px-radius border,
the figure is set at 24px/700, and the helper hangs under it.

```tsx
import { InputNominal } from '@/design-system/components'

<InputNominal
  label="Jumlah diterima"
  value={digits}                      // raw digits, no separators
  onValueChange={setDigits}           // non-digits stripped for you
  helperText="Sisa akan tercatat sebagai tunggakan"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `ReactNode` | — | Inside the border, above the figure |
| `value` | `string` | — | Raw digits; displayed grouped (`1250000` → `Rp1.250.000`) |
| `onValueChange` | `(digits: string) => void` | — | Receives digits only |
| `currency` | `string` | `'Rp'` | Printed before the figure, unseparated from it |
| `state` | `'default' \| 'error'` | `'default'` | Error turns the border and helper red |
| `helperText` | `ReactNode` | — | Under the figure |
| `disabled` | `boolean` | `false` | Neutral-50 fill, no trailing control |

- Trailing control: a pencil when idle (the value can be changed), a clear when
  focused with digits in it. Both are provided — do not add your own.
- Do NOT use `Input` with `prefix="Rp"` for this job; the affix's own border puts
  a seam between "Rp" and the number they are read as one word with.
- One per screen. A form with several amounts on it wants `Input prefix="Rp"`.

---

## Rules

- Radius is always 8px — do NOT use pill or card radius on inputs (`InputNominal` is the exception: it is a tile, 12px)
- Do NOT add icons unless they add meaning or enable an action
- Use `prefix="Rp"` for all Indonesian Rupiah amount fields
- Always show `helperText` in the appropriate state color when validation fails
