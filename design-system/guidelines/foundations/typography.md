# Typography — FunDS Lite

**Font family:** Inter (Google Fonts only)
**Weights:** 500 (body) and 700 (headings/buttons) — NO other weights permitted.

**Class names:** the Tailwind theme is *replaced*, not extended — only two
weight classes exist:

| Class | Weight | Use |
|-------|--------|-----|
| `font-regular` | 500 | Body (also the inherited default — usually no class needed) |
| `font-bold` | 700 | Headings, buttons, active states |

> ⚠️ **`font-medium` does NOT exist** (nor `font-semibold`, `font-normal`,
> etc.). Because `tailwindcss/no-custom-classname` is off, a stray
> `font-medium` fails silently — lint and build both stay green while the
> weight silently falls back. Use `font-regular` / `font-bold` only.

---

## Type Scale

| Class | Size | Weight | Letter Spacing | Line Height | Role |
|-------|------|--------|----------------|-------------|------|
| `text-24` | 24px | 700 | −0.02em | 100% | Page titles / primary headings |
| `text-20` | 20px | 700 | −0.01em | 100% | Section headings |
| `text-18` | 18px | 500 | 0 | 150% | Primary reading size (dashboards) |
| `text-16` | 16px | 500 | 0 | 150% | Secondary paragraphs and descriptions |
| `text-14` | 14px | 500 | 0 | 150% | Compact data tables and labels |
| `text-12` | 12px | 500 | 0 | 150% | Body / caption / helper text |
| `text-10` | 10px | 500 | +0.06em | 150% | Overline / micro labels (UPPERCASE only) |

> This table mirrors `tailwind.config.ts` (`fontSize`), which is the source of
> truth — if they ever disagree, trust the config and flag the doc.

---

## Usage Guide

### Headings
- Use `text-24 font-bold` for screen-level titles
- Use `text-20 font-bold` for major section headings
- Use `text-16 font-bold` for card-level headings or component labels

### Body Text
- Use `text-18` for primary reading content (dashboards, detail pages)
- Use `text-16` for standard paragraphs and descriptions
- Use `text-14` for compact data tables, form labels, and UI labels

### Supporting Text
- Use `text-12` for captions, helper text, badge labels, and metadata
- Use `text-10` for UPPERCASE micro labels and overlines only — always uppercase

---

## Rules

- Do NOT use font-weight 400, 600, or 800 — ONLY 500 and 700
- Do NOT use `font-medium` / `font-semibold` / `font-normal` — they do not exist; only `font-regular` and `font-bold`
- Do NOT use any font other than Inter
- Do NOT use font sizes not in the scale (e.g., 13px, 15px, 17px)
- `text-10` MUST always be rendered in UPPERCASE
- Buttons always use weight 700
- Navigation labels use weight 500 (active state: 700)
