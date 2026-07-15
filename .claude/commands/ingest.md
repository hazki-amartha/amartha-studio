# /ingest — Component Ingestion

> **Owner-gated:** only the design-system owner (Hazki) may run this command —
> it modifies `design-system/`, which project agents must never touch.
>
> **WS-0 note:** paths below are updated for drafting-board. Steps marked
> `[WS-E]` referenced the retired funds-lite manifest site (`specs.ts`,
> `llms.txt`, manifest `page.tsx`) and must be reworked by WS-E against the
> `/system` route once WS-C lands.

Ingest a new component from a PDF guideline in `design-system/raw/` and register it across the design system.

## Usage

```
/ingest [filename]
/ingest input nominal.pdf
/ingest          # lists unprocessed PDFs and asks which to process
```

## What this skill does

Given a PDF spec in `design-system/raw/`, this skill:
1. Reads the PDF and extracts the component spec
2. Creates the React component TSX file in `design-system/components/`
3. Registers it in the components index
4. Adds its styles to `design-system/components/styles.css`
5. Writes a guideline doc at `design-system/guidelines/components/<component>.md`
6. `[WS-E]` Adds the component to the `/system` manifest route

---

## Step-by-step instructions

### 0. Determine which PDF to process

- If `$ARGUMENTS` is provided, resolve the PDF at `design-system/raw/$ARGUMENTS`
- If no argument, run `ls design-system/raw/` and list the files. Then check which component names are already in `design-system/components/index.ts`. Show the user the unprocessed PDFs and ask which to ingest.

### 1. Read and extract the spec

Use the `Read` tool on the PDF file (Claude can parse PDFs natively). Extract:

- **Component name** (PascalCase for file, kebab-case for guideline doc, human title for display)
- **Variants** (list all)
- **Sizes** (list all)
- **States** (default, focus, error, disabled, etc.)
- **Token mapping** (which FunDS tokens map to which states/variants)
- **React props** (all props the component accepts)
- **Shape/radius** (pill, 8px, 12px, etc.)
- **Typography** (font size and weight per part)
- **Spacing** (padding, gap values — must be from the FunDS scale)
- **Behavior / interaction notes**

### 2. Create the React component file

**Path:** `design-system/components/ComponentName.tsx`

Rules:
- Only use FunDS Lite CSS custom properties (`var(--primary-500)`, etc.) — never raw hex
- No Tailwind arbitrary values (`w-[x]`, `text-[#xxx]`)
- Use `className` patterns from existing components (see `Button.tsx`, `Input.tsx`)
- Export as named export: `export function ComponentName(...)`
- Follow the exact same code style as existing components (TypeScript, type for props, forwardRef if it wraps a native element)
- Add styles to `design-system/components/styles.css` — never use inline style objects for static design tokens

Read `design-system/components/Button.tsx` and `design-system/components/Input.tsx` as reference before writing the component.

### 3. Export from components index

Add to `design-system/components/index.ts` (keep alphabetical order):
```ts
export * from './ComponentName'
```

### 4. Write the guideline doc

**Path:** `design-system/guidelines/components/component-name.md`

Follow the format of the existing docs (see `card.md`, `button.md`): shape & token
table, React API code block, props table, Do / Don't list. Add the doc to the
index list in `design-system/guidelines/GUIDELINES.md`.

### 5. `[WS-E]` Register in the /system manifest

The funds-lite manifest steps (NAV_SECTIONS, specs.ts, llms.txt, manifest page
sections) are retired. WS-E replaces this step with instructions for the
`/system` route (`app/system/`) once WS-C defines its structure. Until then,
note in your final report that the manifest entry is pending.

---

## Style constraints (always enforce)

- Spacing: only 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48px
- Radius: 9999px (pill), 12px (card), 8px (input), 6px (chip)
- Weights: 500 or 700 only
- Colors: only `var(--*)` tokens — never raw hex in component code
- No emoji anywhere

## Output

After completing all steps, report:
- Component created: `design-system/components/ComponentName.tsx`
- Files updated: list each touch point
- Guideline doc path
- Any decisions made (e.g. variants inferred from PDF, props assumed)
