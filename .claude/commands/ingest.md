# /ingest — Component Ingestion

> **OWNER-GATED — do not run this command unless you are the design-system owner
> (Hazki).** It modifies `design-system/`, which is owner-gated. Project agents
> must never run it or edit `design-system/`; propose new components via a
> project's `NOTES.md` instead (see the missing-component protocol in `CLAUDE.md`).

Ingest a new component from a Figma-exported PDF guideline in `design-system/raw/`
and register it across the design system.

## Usage

```
/ingest [filename]
/ingest input nominal.pdf
/ingest          # lists unprocessed PDFs and asks which to process
```

## What this command does

Given a PDF spec in `design-system/raw/`, it:
1. Reads the PDF and extracts the component spec.
2. Creates the React component `.tsx` in `design-system/components/`.
3. Exports it from `design-system/components/index.ts`.
4. Adds its styles to `design-system/components/styles.css`.
5. Writes a guideline doc at `design-system/guidelines/components/<component>.md`
   and links it from `design-system/guidelines/GUIDELINES.md`.
6. Verifies the component appears on the `/system` manifest (it renders
   automatically from the components index + guideline doc — no manual manifest
   edit needed).

---

## Step-by-step instructions

### 0. Determine which PDF to process

- If `$ARGUMENTS` is provided, resolve the PDF at `design-system/raw/$ARGUMENTS`.
- If no argument, run `ls design-system/raw/`, then check which component names
  already exist in `design-system/components/index.ts`. Show the user the
  unprocessed PDFs and ask which to ingest.

### 1. Read and extract the spec

Use the `Read` tool on the PDF (Claude parses PDFs natively). Extract:

- **Component name** (PascalCase for file, kebab-case for guideline doc, human
  title for display)
- **Variants**, **sizes**, **states** (default, focus, error, disabled, …)
- **Token mapping** — which FunDS tokens map to which states/variants
- **React props** — every prop the component accepts
- **Shape / radius** (pill, 8px, 12px, …)
- **Typography** (font size + weight per part — 500 or 700 only)
- **Spacing** (padding, gap — must be on the FunDS scale)
- **Behavior / interaction notes**

### 2. Create the React component file

**Path:** `design-system/components/ComponentName.tsx`

Rules:
- Only FunDS Lite CSS custom properties (`var(--primary-500)`, …) — never raw hex.
- No Tailwind arbitrary values (`w-[x]`, `text-[#xxx]`).
- Use `className` patterns from existing components — **read `Button.tsx` and
  `Input.tsx` first** as reference.
- Named export: `export function ComponentName(...)`. Use `forwardRef` if it wraps
  a native element, matching existing component style.
- Put static token styles in `design-system/components/styles.css` — never inline
  style objects for design tokens.

### 3. Export from the components index

Add to `design-system/components/index.ts` (keep alphabetical grouping consistent
with the existing file):
```ts
export * from './ComponentName'
```

### 4. Write the guideline doc

**Path:** `design-system/guidelines/components/component-name.md`

Follow the format of existing docs (`card.md`, `button.md`): shape & token table,
React API code block, props table, Do / Don't list. Then add it to the Components
list in `design-system/guidelines/GUIDELINES.md`.

### 5. Verify manifest presence

The `/system` route (`app/system/`) renders every export of
`design-system/components/index.ts` and every token in `design-system/tokens.ts`
directly — so once steps 2–4 are done, the component appears there automatically.
Run `npm run dev`, open `/system`, and confirm the component and its guideline
render correctly. No manual manifest registration is required.

---

## Style constraints (always enforce)

- Spacing: only 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48px.
- Radius: 9999px (pill), 12px (card), 8px (input), 6px (chip).
- Weights: 500 or 700 only.
- Colors: only `var(--*)` tokens — never raw hex in component code.
- No emoji anywhere.

## Output

After completing all steps, report:
- Component created: `design-system/components/ComponentName.tsx`
- Files updated: each touch point (index, styles.css, guideline doc, GUIDELINES.md)
- Guideline doc path
- `/system` verification result
- Any decisions made (variants inferred from the PDF, props assumed)
