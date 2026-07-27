# Handover Plan — closing the gap from studio to Figma and dev

Status: draft for discussion · Owner: Fauziah · Written 2026-07-24

## The problem

Prototypes built in the studio are today a dead end at handover time:

1. **Studio → Figma.** The current route (Chrome plugin that copies the rendered
   page into Figma) produces frames with wrong sizes and unreadable text. It
   reconstructs from computed CSS, so it captures pixels, not design intent —
   fine for a quick redline, never dev-ready.
2. **Small edits are expensive.** Adjusting a padding or reordering a layer
   means describing the element to the agent in words and waiting for a round
   trip.
3. **Studio → dev.** The frontend team could use prototypes as a starting
   point, but they build on their own Storybook-based design system, not FunDS.
   There is no "dev mode" view that tells them spacing, colors, and type.

## The unfair advantage

Every prototype is composed from a **closed vocabulary**: FunDS components plus
a locked token set (4px spacing grid, named colors, two font weights, fixed
radii). Generic design-to-code tools are hard because a web page could be
anything; ours can't. Any tool we build may assume the answer is always one of
~40 tokens and ~166 icons. That makes several normally-hard features cheap, and
it drives the priority order below.

Guiding bet: **the preview link, made inspectable, is a better handoff artifact
than any exported Figma file.** It is interactive, exact, and never drifts from
what was designed.

---

## Phase 1 — Inspector overlay (build first)

One build that serves all three cases. A toggleable overlay in the prototype
player: click/hover any element to see —

- component name (e.g. `Button`, `Badge`) and key props
- token classes in use (`px-16`, `gap-12`, `text-primary-500`) with resolved
  values (16px, #853291)
- source location (`screens/stage-visit.tsx:41`)

**Serves case 2 (lite):** the designer stops describing elements in words.
"Change `gap-12` to `gap-16` on the card at `stage-visit.tsx:41`" is a one-shot
agent instruction — this collapses most of the edit round-trip cost.

**Serves case 3:** this *is* dev mode. A frontend dev hovers and reads the spec
off the real running screen — Figma dev mode without Figma.

**Weakens case 1:** if fine-tuning and handoff both work without Figma, the
export pressure drops.

- Complexity: **medium-low.** A `platform/` overlay plus a dev-build tweak to
  stamp source locations onto DOM nodes (React dev tooling supports this).
- Tier: **Tier 2** (platform) — needs Hazki's review.
- Constraint: read-only; works on the deployed preview, not just local dev.

## Phase 2 — Component & token mapping dictionary

A small JSON dictionary mapping FunDS names to the dev team's design-system
names (FunDS `Button` → their `AmarthaButton`; token → their token). The Phase 1
overlay gains a toggle to display names in *their* vocabulary.

This is the piece that actually bridges the two design systems — and it is a
data file, not an integration.

- Complexity: **low** (once Phase 1 exists). Needs one working session with the
  frontend team to fill in the mapping.
- Tier: Tier 2 (platform reads the dictionary); the dictionary itself is data.

## Phase 3 — "View source" per screen

A button in the player that shows the current screen's JSX. Screens are short,
token-based, and readable; for a frontend dev this is often the fastest spec of
all, and for the FunDS→Storybook translation it shows exact composition.

- Complexity: **very low.**
- Tier: Tier 2 (player chrome).

## Phase 4 — Direct manipulation (evaluate, then maybe build)

True live edit: select an element, nudge padding with a stepper that only
offers 4px-grid values, reorder siblings; a small dev-server endpoint writes
the class change back to the source file. Because every editable property is a
token class from a closed set, this is class swapping with guardrails — no
freeform CSS, no invalid states possible.

**First step: evaluate [Onlook](https://onlook.com) (open source)** — it does
visual editing of React + Tailwind with write-back to source. An afternoon's
evaluation may get 70% of this for free, or at least establish the interaction
model.

- Complexity: **medium** if built ourselves; reordering (JSX-level edits) is
  the fiddly part.
- Constraint: only works against a local dev server (it edits files) — not the
  deployed preview. Phase 1 + the agent may already make this unnecessary;
  decide after living with Phase 1 for a few weeks.

## Deprioritized — Figma export

Pixel-based converters (the current Chrome plugin approach) will keep
disappointing us; the lossiness is inherent to the method. The only version
worth building is a **component-mapping Figma plugin**: the studio serializes a
screen as a tree of `{component, props, tokens}` and a custom Figma plugin
rebuilds it by instantiating components from a published FunDS Figma library.

- Complexity: **high** — requires (a) a FunDS Figma library kept 1:1 with code,
  (b) a serializer in the platform, (c) the plugin itself; all three drift over
  time.
- Decision gate: only build if a concrete workflow genuinely requires
  *editable* Figma after Phases 1–3 ship. Name the workflow first.

## Nice-to-have — static spec export

Per-screen "export" rendering the screen at device width with an auto-generated
annotation sheet (spacing rails, color swatches used, type styles used). Token
usage is statically extractable from the code, so this is cheap. Good for decks
and async review.

- Complexity: **low-medium.** Do after Phase 3 if wanted.

## Nice-to-have — FunDS in the dev team's Storybook

Publish FunDS Lite components into the frontend team's Storybook so prototypes
read as compositions of things they can already see in their own tool.

- Complexity: **medium**, mostly coordination. Owned jointly with the dev team.

---

## Repo bloat / distribution

Designers currently clone the whole repo because building requires everything.
In order of cost:

1. **Discipline (free, do now):** no committed screenshots/videos/heavy assets;
   keep `design-system/raw` from growing.
2. **Shallow clone (nearly free, do now):** onboarding instructions say
   `git clone --depth 1` — history is usually the bloat, not the working tree.
3. **Split platform into an npm package (high — resist):** standard engineering
   answer, but adds a versioning/publishing loop that designers feel as
   friction on every design-system change.
4. **Hosted-agent model (medium-high — the long-term answer):** the agent runs
   in the cloud against the repo; designers only touch the deployed studio and
   never clone. Revisit once Phases 1–3 have landed.

## Sequence and decision points

| Step | What | Complexity | Gate |
|------|------|------------|------|
| 1 | Inspector overlay | medium-low | Hazki review (Tier 2) |
| 2 | Mapping dictionary | low | session with frontend team |
| 3 | View source button | very low | Hazki review (Tier 2) |
| 4 | Evaluate Onlook | afternoon | — |
| 5 | Direct manipulation | medium | only if Phase 1 + agent isn't enough |
| — | Figma plugin | high | only if a named workflow needs editable Figma |
