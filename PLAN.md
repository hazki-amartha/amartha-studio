# Amartha Studio — Stack & Development Plan

> **Status:** approved plan, pre-implementation
> **Owner:** Hazki (hazki.hariowibowo@gmail.com)
> **Last updated:** 2026-07-15
> **Audience:** this document is written to be executed by multiple AI agents working in parallel. Section 7 defines the workstreams, ownership boundaries, and acceptance criteria. Section 5 pins the shared contracts — **no agent may change Section 5 interfaces without the owner's approval.**

---

## 1. Vision

Amartha Studio is an internal prototyping studio for the design team. It is a single
repository that every designer connects their own AI agent (Claude Code) to, in order to
create and iterate on high-fidelity, interactive prototypes built exclusively from the
team's design system (FunDS Lite, derived from the Figma design system).

### Problems it solves

| Today | With Amartha Studio |
|---|---|
| Designers work on separate machines and pass JSX/HTML files over Slack | One git repo is the shared machine; handoff = `git pull` |
| No unified design system across prototypes | A token-locked design system is the only vocabulary agents can use |
| Stakeholders receive screenshots or raw HTML files | Every project has a stable deployed URL, always showing the latest state |

### Product shape

- **Gallery** (`/`) — all projects, who owns them, status, thumbnail.
- **Prototype view** (`/p/<slug>`) — the interactive prototype.
  - On **mobile**: full-page, feels like the real app.
  - On **desktop**: device frame centered, with annotation notes beside it.
- **Flow view** (`/p/<slug>/flow`) — every screen of the project rendered live at
  reduced scale on a pannable canvas, with connection arrows from flow metadata.
- **System manifest** (`/system`) — browsable page of all tokens and components
  (absorbs the funds-lite manifest site). Documentation for humans, visual smoke
  test for design-system changes.
- **Sharing** — push to `main` → deploy → stable URL per project behind a simple
  shared password gate.

### Non-goals (v1)

- No user accounts / per-designer auth. One shared stakeholder password.
- No real backend or data persistence in prototypes — all state is client-side and mocked.
- No design-system consumption outside this repo (the `@mhazki/funds-lite` npm package
  is deprecated by this project; extraction can reopen later if real apps need it).
- No hard permission enforcement between designers — ownership is by convention +
  agent contract (see §6).

---

## 2. Key decisions (with rationale)

| # | Decision | Rationale |
|---|---|---|
| D1 | **Single repo, single Next.js app** | Git replaces Slack as transport; one deploy target; agents get full context. |
| D2 | **Design system lives in-repo** (`design-system/`), absorbed from funds-lite | funds-lite existed solely for AI prototyping; this tool is now that surface. One home, no publish cycle, no drift. Figma remains the upstream design truth. |
| D3 | **Next.js 14+ (App Router) + Tailwind CSS 3.4 + TypeScript** | Matches funds-lite's existing token-locked `tailwind.config.ts`, which uses the v3 "replace, don't extend" pattern. Do **not** upgrade to Tailwind v4 in v1 (CSS-first config would force a rewrite of the token lock). |
| D4 | **Token-locked Tailwind + lint enforcement** | The replaced theme scales already restrict named classes. Arbitrary values (`p-[13px]`, `text-[#abc]`) bypass any theme, so they are banned by ESLint (`eslint-plugin-tailwindcss` → `no-arbitrary-value`, error level) and by the agent contract. |
| D5 | **Ownership by convention, not permissions** | Designers have basic git fluency; their agents handle git. `CLAUDE.md` scopes agents to their own project folder. `design-system/` and `platform/` are strictly owner-gated (see §6). |
| D6 | **Direct commits to `main`** for project work | Prototypes are low-stakes; PR flow adds friction designers won't tolerate. Platform/design-system changes by agents during the build phase use branches (see §7.1). |
| D7 | **Deploy on push to `main`**, stable URLs, cookie-based password gate | Kills the screenshot workflow. Host: Vercel (first choice for Next.js) — Railway is the fallback; final call at WS-F kickoff. |
| D8 | **Explicit project registry file** (not filesystem magic) | An append-only `projects/registry.ts` keeps discovery simple, type-safe, and easy for agents to edit without touching the platform. |

---

## 3. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js ≥14, App Router, static-friendly | No server data needs in v1; prefer static rendering |
| Language | TypeScript, `strict: true` | |
| Styling | Tailwind CSS **3.4.x** with funds-lite's replaced theme | Copy `tailwind.config.ts` from funds-lite verbatim, adjust `content` globs |
| Design system | `design-system/` (in-repo), absorbed from funds-lite `src/funds-lite/` | Components import their own CSS (`styles.css`) as funds-lite does |
| Font | Inter, weights **500 and 700 only** (via `next/font`) | System rule: never 400/600/800 |
| Lint | ESLint + `eslint-plugin-tailwindcss` (`no-arbitrary-value`: error) | CI-blocking |
| Animation | CSS transitions first; `framer-motion` allowed for screen transitions in the platform runtime only | Keep project screens dependency-light |
| Flow canvas | Hand-rolled pan/zoom (CSS transform) + SVG edges | No heavy graph library in v1; `reactflow` only if hand-rolled proves painful |
| Hosting | Vercel (decide finally at WS-F) | Push-to-main deploys |
| Auth | Next.js middleware + signed cookie, password from `env` | One shared stakeholder password |

---

## 4. Repository architecture

```
amartha-studio/
├── PLAN.md                        ← this document
├── CLAUDE.md                      ← the agent contract (§6) — most important file
├── package.json
├── tailwind.config.ts             ← token-locked, from funds-lite (WS-0)
├── middleware.ts                  ← password gate (WS-F)
│
├── design-system/                 ← OWNER-GATED. The FunDS Lite design system.
│   ├── tokens.ts                  ← color scales, type scale, spacing, radii, layout patterns
│   ├── components/                ← Button, Input, Badge, Toggle, SelectableCard,
│   │   │                            Modal, BottomSheet, NavigationBar, NavigationHeader
│   │   │                            + additions: Card, ListRow, ... (see WS-0 backlog)
│   │   ├── index.ts               ← barrel export; also imports styles.css
│   │   └── styles.css             ← component-owned CSS
│   ├── guidelines/                ← per-component + foundations markdown (agent-readable)
│   │   ├── GUIDELINES.md          ← overview + key constraints table
│   │   ├── foundations/           ← colors.md, typography.md, spacing.md
│   │   └── components/            ← one .md per component (API + do/don't)
│   └── raw/                       ← Figma-exported spec PDFs awaiting ingestion
│
├── platform/                      ← OWNER-GATED. Built once; designers never touch.
│   ├── types.ts                   ← §5 contracts (frozen interfaces)
│   ├── runtime/                   ← PrototypeProvider, useFlow(), screen navigation
│   ├── frame/                     ← DeviceFrame, StatusBar, annotation panel
│   ├── flow/                      ← flow canvas, edge rendering
│   └── primitives/                ← Screen, TopBar wrappers using layout tokens
│
├── app/
│   ├── layout.tsx                 ← Inter font, globals
│   ├── page.tsx                   ← project gallery
│   ├── system/page.tsx            ← design-system manifest
│   └── p/[slug]/
│       ├── page.tsx               ← prototype view
│       └── flow/page.tsx          ← flow view
│
├── projects/                      ← DESIGNER-OWNED. One folder per project.
│   ├── registry.ts                ← append-only list of all projects
│   ├── _template/                 ← copied to start a new project
│   │   ├── project.config.ts
│   │   ├── index.ts
│   │   └── screens/example.tsx
│   └── <slug>/
│       ├── project.config.ts      ← ProjectConfig (§5)
│       ├── index.ts               ← exports config + screens array
│       ├── screens/               ← one file per screen
│       └── lib/                   ← project-local state/mock data (optional)
│
└── .claude/
    └── commands/ingest.md         ← Figma PDF → component workflow (ported from funds-lite)
```

**Ownership rules** (enforced by `CLAUDE.md`, §6):

| Path | Who may edit |
|---|---|
| `projects/<slug>/**` | The project's `owner` (their agent) only |
| `projects/registry.ts` | Anyone — **append-only** (add your project line; never modify others') |
| `design-system/**`, `platform/**`, `app/**`, config files | Owner (Hazki) only; agents propose changes instead |

---

## 5. Shared contracts — FROZEN

These interfaces are the integration surface between all workstreams. They live in
`platform/types.ts`. WS-0 lands them; after that, **any change requires the owner's
sign-off and a notice to all active agents.** If a workstream needs more than this,
it extends privately or requests a contract change — it does not unilaterally edit.

```ts
// platform/types.ts

import type { ComponentType } from 'react'

/** Device presentation for the prototype view. v1 ships 'mobile' only;
 *  the enum exists so desktop prototypes don't need a contract change. */
export type DeviceKind = 'mobile' | 'desktop'

export type ProjectStatus = 'draft' | 'in-review' | 'final'

export interface ProjectConfig {
  /** URL slug, kebab-case, unique across the repo. */
  slug: string
  /** Display name shown in the gallery and prototype chrome. */
  name: string
  /** Designer's name — ownership is checked against this by convention. */
  owner: string
  /** One-paragraph description for the gallery card. */
  description: string
  device: DeviceKind
  status: ProjectStatus
  /** ISO date, set at creation, never edited. */
  createdAt: string
  /** Optional annotations shown project-wide in the desktop prototype view. */
  notes?: string[]
}

export interface FlowEdge {
  /** Target screen id within the same project. */
  to: string
  /** Optional edge label, e.g. "on submit", "tap card". */
  label?: string
}

export interface ScreenDef {
  /** Unique within the project, kebab-case, stable (used in flow edges). */
  id: string
  title: string
  /** The screen component. Rendered inside the platform's Screen chrome.
   *  Receives no props; obtains navigation via useFlow(). */
  component: ComponentType
  /** Exactly one screen per project sets entry: true. */
  entry?: boolean
  /** Annotations shown beside the device in desktop prototype view
   *  while this screen is active. */
  notes?: string[]
  /** Outgoing edges rendered in flow view. Purely descriptive metadata —
   *  actual navigation happens via useFlow().go(id) inside the component. */
  flowsTo?: FlowEdge[]
}

export interface ProjectModule {
  config: ProjectConfig
  screens: ScreenDef[]
}

/** projects/registry.ts exports this. Append-only. */
export type Registry = Record<string /* slug */, () => Promise<ProjectModule>>
```

```ts
// Runtime contract — implemented by WS-A, consumed by every screen.
// platform/runtime/useFlow.ts

export interface FlowApi {
  /** Navigate to a screen by id (push). */
  go(id: string): void
  /** Go back one screen in the visit stack. */
  back(): void
  /** Currently active screen id. */
  current: string
}
export declare function useFlow(): FlowApi
```

```ts
// projects/registry.ts — the append-only pattern every agent follows:

import type { Registry } from '@/platform/types'

export const registry: Registry = {
  'sample-topup': () => import('./sample-topup').then(m => m.project),
  // <append new projects above this line — one line per project>
}
```

**Screen authoring contract** (what a project screen looks like):

```tsx
// projects/<slug>/screens/amount.tsx
'use client'
import { Button, Input, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'

export function AmountScreen() {
  const flow = useFlow()
  return (
    <Screen topBar={<NavigationHeader title="Top Up" onBack={flow.back} />}>
      <Input prefix="Rp" placeholder="0" />
      <Button onClick={() => flow.go('confirm')}>Continue</Button>
    </Screen>
  )
}
```

---

## 6. The agent contract (`CLAUDE.md`) — requirements

`CLAUDE.md` is the product's most important file: the tool succeeds or fails on whether
a designer's agent, cold, produces on-system output. WS-E writes it. It must cover:

1. **Scope rule** — "You may only create/modify files under `projects/<slug>/` for the
   project you were asked to work on, plus your one append line in
   `projects/registry.ts`. Everything else is read-only. If a task seems to require
   editing `design-system/` or `platform/`, stop and tell the designer to raise it
   with the owner."
2. **Vocabulary rule** — compose screens only from `design-system/components` and
   `platform/primitives`. Never hardcode hex colors, font sizes, spacing, or radii.
   Never use Tailwind arbitrary values. Read `design-system/guidelines/` before
   building; the key-constraints table (brand purple `primary-500 #853291`, Inter
   500/700 only, 4px spacing grid, pill buttons, 12px card radius, status color =
   500 foreground on 50 tint) is absolute.
3. **Structure rule** — new project = copy `projects/_template/`, fill
   `project.config.ts`, register in `registry.ts`. One file per screen. Screens
   registered with `id`, `title`, `notes`, `flowsTo`; exactly one `entry`.
4. **Missing-component protocol** — if a screen needs a component that doesn't exist,
   build a *project-local* version in `projects/<slug>/lib/` using only tokens, and
   add a line to the project's `NOTES.md` proposing it for promotion into the design
   system. Never add to `design-system/` directly.
5. **Git routine** — designers rely on their agent for git: `git pull --rebase` before
   starting; commit with message `[<slug>] <what changed>`; push to `main` when the
   designer confirms. Never force-push. If a pull conflicts inside someone else's
   project folder, take theirs; inside your own, take yours; anywhere else, stop and ask.
6. **Verification routine** — before declaring done: `npm run lint && npm run build`
   pass; the prototype renders from its entry screen; every `flowsTo` target id exists
   (the platform's `npm run check:flows` script validates this — WS-0 builds it).

---

## 7. Development plan & multi-agent orchestration

### 7.1 Ground rules for build-phase agents

- **Branching (build phase only):** WS-0 lands directly on `main`. Every subsequent
  workstream works on branch `ws/<id>-<short-name>` and merges to `main` via PR so
  parallel work doesn't collide. (After launch, designer project work commits straight
  to `main` per D6 — the branch rule is for building the tool itself.)
- **File ownership is exclusive:** each workstream may only create/edit files in its
  "Owns" list. Shared files (`package.json`, `app/layout.tsx`, `platform/types.ts`)
  belong to WS-0; needing a change there = request to the orchestrator, not an edit.
- **Contracts are frozen** (§5). Build against them even where a neighbor workstream
  isn't merged yet — that's what makes parallelism safe.
- **Definition of done** for every workstream: its acceptance criteria pass, `npm run
  lint` and `npm run build` are clean, and no files outside its ownership were touched.
- **Stubs over waiting:** if WS-A needs the registry before the sample project exists,
  it codes against `projects/_template` and the `sample-topup` stub WS-0 provides.

### 7.2 Dependency graph

```
WS-0 (foundation — sequential, blocks everything)
 ├──► WS-A  Prototype runtime & device frame ─┐
 ├──► WS-B  Flow view                          ├──► WS-G  Acid test & polish
 ├──► WS-C  System manifest (/system)          │
 ├──► WS-D  Gallery homepage                   │
 ├──► WS-E  Agent contract & templates ────────┘
 └──► WS-F  Deploy & password gate  (independent; needs WS-0 only)
```

WS-A…WS-F are mutually parallel. WS-G starts when A, B, D, E are merged (C and F can
trail it but must land before external sharing).

### 7.3 Workstreams

---

#### WS-0 · Foundation & design-system absorption  — *sequential, first*

**Goal:** a building repo with the design system in place and all contracts frozen.

**Owns:** everything (it creates the skeleton). On completion, ownership fragments
per the table in §4.

**Tasks:**
1. `git init`; create GitHub repo; initial commit of `PLAN.md`.
2. Scaffold Next.js (App Router, TS strict) + Tailwind 3.4. Copy funds-lite's
   `tailwind.config.ts` verbatim (adjust `content` globs to
   `./app/**`, `./platform/**`, `./design-system/**`, `./projects/**`).
3. Absorb funds-lite from `../funds-lite/`:
   - `src/funds-lite/tokens.ts` → `design-system/tokens.ts`
   - `src/funds-lite/components/*` → `design-system/components/`
   - `package/guidelines/**` → `design-system/guidelines/` (fix internal links)
   - `raw/*.pdf` → `design-system/raw/`
   - `.claude/commands/ingest.md` → `.claude/commands/ingest.md` (path updates only;
     WS-E finishes it)
   - **Do NOT copy** `reference/` (contains credentials — `npm_recovery_codes.txt`),
     `package/dist/`, or any lockfiles.
4. Add missing base components needed by the platform work: `Card` (12px radius,
   12px padding, `border-default`) and `ListRow`. Follow existing component style
   (own CSS in `styles.css`, guideline .md per component).
5. Create `platform/types.ts` with §5 contracts, exactly.
6. Create `projects/registry.ts`, `projects/_template/`, and a minimal
   `projects/sample-topup/` stub (2 placeholder screens, valid config) so downstream
   workstreams have something real to render.
7. ESLint with `eslint-plugin-tailwindcss` (`no-arbitrary-value`: error).
8. `npm run check:flows` script — validates every `flowsTo.to` and unique `entry`
   across the registry; fails CI on violation.
9. Inter via `next/font` (weights 500, 700), globals, placeholder `app/page.tsx`.

**Acceptance:** `npm run dev` renders the placeholder home; `lint`, `build`,
`check:flows` all pass; all §5 types compile; sample project stub importable
through the registry.

---

#### WS-A · Prototype runtime & device frame

**Goal:** the heart of the tool — `/p/<slug>` renders an interactive prototype.

**Owns:** `platform/runtime/**`, `platform/frame/**`, `platform/primitives/**`,
`app/p/[slug]/page.tsx`.

**Tasks:**
1. `PrototypeProvider` + `useFlow()` implementing the §5 runtime contract: screen
   stack, `go`/`back`, entry-screen start, optional slide transition between screens.
2. `Screen` and `TopBar` primitives that apply the layout tokens (16px page padding-x,
   16px padding-top, 12px section gap, 48px topbar height).
3. `DeviceFrame`: 390×844 viewport, rounded bezel, minimal status bar.
4. Responsive presentation: `< md` → prototype full-page (no frame); `≥ md` → frame
   centered on `neutral-50` background, project name + owner above, annotation panel
   beside the device showing active screen's `notes` (falls back to project `notes`).
5. Deep-linking: `/p/<slug>?screen=<id>` starts at that screen (used by flow view).

**Acceptance:** sample project runs full-flow on mobile and desktop; navigation
`go`/`back` works with the stack behaving correctly; annotations switch with the
active screen; unknown slug → friendly 404.

---

#### WS-B · Flow view

**Goal:** `/p/<slug>/flow` shows the whole flow at a glance.

**Owns:** `platform/flow/**`, `app/p/[slug]/flow/page.tsx`.

**Tasks:**
1. Render every screen of the project live at ~25% scale (CSS transform; wrap in a
   non-interactive overlay so hover/click don't trigger prototype behavior).
2. Auto-layout: BFS layering from the `entry` screen → columns left-to-right;
   unreached screens in a trailing column.
3. SVG edges from `flowsTo` with optional labels; light hover highlight.
4. Pan (drag) and zoom (wheel/pinch) on the canvas.
5. Clicking a screen opens `/p/<slug>?screen=<id>`.

**Acceptance:** sample project's screens all visible with correct arrows; pan/zoom
smooth; screen click deep-links into prototype view; degrades gracefully when a
project has no `flowsTo` metadata (grid fallback).

---

#### WS-C · System manifest

**Goal:** `/system` — the browsable design-system reference (absorbs the funds-lite
manifest site's purpose).

**Owns:** `app/system/**`.

**Tasks:**
1. Render token sections straight from `design-system/tokens.ts` (single source):
   color scales (copyable hex/class), type scale specimens, spacing/radius visual
   guide, layout patterns, semantic tokens table.
2. Live component gallery: each component in its main variants/states with a code
   snippet of the canonical usage.
3. Section scroll-nav sidebar (desktop) matching funds-lite's `NAV_SECTIONS` order.
4. Link each component to its guideline .md content (render the markdown inline or
   collapsible).

**Acceptance:** every export of `tokens.ts` and every component in
`design-system/components/index.ts` appears; hex/class copy works; page is itself
built on-system (dogfoods tokens).

---

#### WS-D · Gallery homepage

**Goal:** `/` — the front door.

**Owns:** `app/page.tsx` (takes over WS-0's placeholder), `app/opengraph-image` if desired.

**Tasks:**
1. Read the registry; card per project: name, owner, status badge (Badge component:
   draft=orange, in-review=blue, final=green — 500 on 50-tint rule), description,
   created date, links to prototype + flow views.
2. Mini-preview on the card: entry screen rendered scaled (reuse WS-B's scaled-screen
   technique) — acceptable fallback for v1: styled placeholder.
3. Sort: most recent first. Header links to `/system`.

**Acceptance:** sample project appears with correct metadata and working links;
layout on-system; empty registry renders a helpful "start your first project" state.

---

#### WS-E · Agent contract, templates & ingestion

**Goal:** the designer-facing (agent-facing) developer experience.

**Owns:** `CLAUDE.md`, `projects/_template/**`, `.claude/commands/ingest.md`,
`README.md`.

**Tasks:**
1. Write `CLAUDE.md` implementing all six requirement groups in §6. Keep it under
   ~200 lines — it's read by an agent on every session; density over prose.
2. Polish `projects/_template/` so "copy, rename, fill config" is the entire setup;
   template screens demonstrate: Screen primitive, two components, `useFlow().go`,
   `notes`, `flowsTo`.
3. Finish porting `/ingest`: drop a Figma-exported PDF in `design-system/raw/` →
   command guides an owner-run agent through creating the component + guideline doc +
   manifest presence. (Owner-gated: the command must state it may only be run by the
   design-system owner.)
4. `README.md` for humans: what this is, one-time setup (clone, `npm i`, `npm run
   dev`), and the three sentences a designer types to their agent to start/continue/
   hand off a project.

**Acceptance:** reviewed against §6 checklist item-by-item; template compiles and
registers cleanly when copied to a scratch slug; README setup verified from a clean
clone.

---

#### WS-F · Deploy & password gate

**Goal:** stable shareable URLs.

**Owns:** `middleware.ts`, `app/unlock/**`, deploy configuration, `.env.example`.

**Tasks:**
1. Decide host (default Vercel; Railway fallback) and wire push-to-main deploys.
2. Password gate: middleware checks a signed cookie; `/unlock` page (on-system: Input +
   Button) sets it; password from `SITE_PASSWORD` env; cookie valid 30 days; static
   assets and `/unlock` excluded from the check.
3. `.env.example` + deployment notes appended to `README.md` (coordinate the append
   with WS-E — single trailing section, or hand the text to WS-E).
4. Custom domain if available (e.g. `studio.<team-domain>`), else platform URL.

**Acceptance:** production URL live; wrong/no password → `/unlock`; correct password →
30-day access across all routes; a push to `main` visibly deploys.

---

#### WS-G · Acid test & integration polish  — *after A, B, D, E merge*

**Goal:** prove the loop end-to-end the way a real designer will use it.

**Owns:** `projects/<acid-slug>/**` + filing issues (not fixing other workstreams' code directly).

**Tasks:**
1. In a fresh session, with **only** `CLAUDE.md` as instructions (this PLAN.md
   explicitly off-limits), build a realistic 5–8 screen prototype — suggested:
   an Amartha-flavored flow such as *Celengan top-up* (amount entry → method →
   confirmation bottom-sheet → success) with badges, list rows, and a modal.
2. Record every point of friction: missing guideline, ambiguous contract line,
   missing component, layout token gap.
3. File each friction point as a GitHub issue tagged to the responsible workstream;
   loop with the owner on contract-level gaps.
4. Verify the full designer journey: clone → agent session → build → push → deployed
   URL → flow view correct → stakeholder opens link on phone.

**Acceptance:** the acid-test project ships to production without any human editing
code by hand, and the friction list has been triaged into fixes or accepted cuts.

---

### 7.4 Suggested orchestration sequence

1. **Session 1 (sequential):** run WS-0 to completion on `main`.
2. **Sessions 2–7 (parallel):** launch WS-A…WS-F as parallel agents, each on its
   `ws/*` branch with its section of this document as the brief plus read access to
   the whole repo. Merge order as they finish; WS-D rebases after WS-B if it reuses
   the scaled-screen technique.
3. **Session 8:** WS-G acid test → triage → fix round (route fixes to the owning
   workstream's files, any agent may execute them post-merge with owner approval).
4. **Launch:** onboard the first real designer; their first project is the true test.
   Deprecate `@mhazki/funds-lite` on npm once the team has switched.

### 7.5 Post-v1 backlog (not scheduled)

- Flow-edge auto-extraction from `useFlow().go()` call sites (keeps `flowsTo` honest).
- Per-project share links with view-only tokens instead of one global password.
- Screen thumbnails captured at build time for gallery cards.
- Dark mode tokens (requires Figma upstream definition first).
- Desktop-device prototypes (`DeviceKind 'desktop'` is already in the contract).
- Component promotion workflow: project-local component → design-system PR, semi-automated.

---

## 8. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Agents drift off-system despite the contract | Token-locked Tailwind + lint error on arbitrary values + `check:flows` in CI; WS-G acid test hardens `CLAUDE.md` before real use |
| Two designers edit the same file on `main` | Ownership scoping in `CLAUDE.md` + git routine (pull-rebase first, conflict protocol §6.5) |
| `registry.ts` merge conflicts (everyone appends) | One line per project, append-above-marker convention → conflicts are trivial and the routine resolves them |
| Design system gaps stall designers | Missing-component protocol (§6.4) unblocks locally, promotion path catches up |
| funds-lite manifest/np package linger as a second source of truth | Absorb in WS-0, deprecate the npm package at launch, archive the funds-lite folder |
| Secrets leakage from absorbed material | WS-0 explicitly excludes `reference/`; owner moves `npm_recovery_codes.txt` to a password manager and deletes it (action item, outside this repo) |

---

## 9. Decision log

| Date | Decision |
|---|---|
| 2026-07-15 | Single-repo prototyping studio; concept approved |
| 2026-07-15 | Stack: Next.js + Tailwind 3.4 (token-locked) + TS strict |
| 2026-07-15 | Design system maintained in-repo; funds-lite absorbed and to be retired; Figma remains upstream design truth |
| 2026-07-15 | Sharing: deploy-on-main, stable URLs, shared password gate |
| 2026-07-15 | Ownership by convention + agent contract; direct-to-main for project work |
