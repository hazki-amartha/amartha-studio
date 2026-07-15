# Input

Text field for user data entry. Supports labels, prefix/suffix, validation states, and helper text.

```tsx
import { Input } from '@funds/funds-lite'

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

## Rules

- Radius is always 8px — do NOT use pill or card radius on inputs
- Do NOT add icons unless they add meaning or enable an action
- Use `prefix="Rp"` for all Indonesian Rupiah amount fields
- Always show `helperText` in the appropriate state color when validation fails
