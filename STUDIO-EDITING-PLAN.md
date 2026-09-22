# Editing from the studio — design mode and chat

Status: draft for discussion · Owner: Hazki · Merged 2026-09-16

Supersedes and replaces three documents:

- `CHAT-PLAN.md` (2026-09-14, rewritten 2026-09-16 with Spike A results) —
  prompting a prototype from the deployed studio.
- `DESIGN-MODE-PLAN.md` (2026-09-14) — direct manipulation replacing Edit mode.
- `HANDOVER-PLAN.md` Phase 4 (2026-07-24) — "direct manipulation, evaluate then
  maybe build", which DESIGN-MODE-PLAN already superseded.

**Why they are merged.** The first two were written the same day, separately,
and the separation cost real work: a later session re-derived an Onlook
evaluation and a direct-manipulation plan that `DESIGN-MODE-PLAN.md` already
contained, and briefly added a contradictory "phase 5" to `CHAT-PLAN.md`. The
two efforts also silently disagreed about identity and each specified their own
GitHub App. They are one system and belong in one document.

---

## The problem

A designer who wants to change a prototype hits one of two walls, depending on
what they want to change.

**Wall 1 — changing anything at all costs a Claude subscription.** Today the
only way to edit is Claude Code on a laptop, which is a per-seat licence plus a
CLI to install and authenticate before the first useful minute. The cost scales
with the team, and a designer who wants to change a label three times a month
cannot justify either.

This is *not* about editing from a phone. Everyone here works on a laptop and
will keep working on a laptop. It is about removing the account-and-subscription
prerequisite, so that opening the studio in a browser is the whole setup.

**Wall 2 — Edit mode can only change values, never structure.** `platform/edit/`
can swap a token class, a piece of text, or an enum prop on a FunDS component
and write it back to source. It cannot move, add, remove, or wrap anything. A
designer who wants a card above another card, a button inside a row, or one more
shortcut in a shortcut row still has to describe it to an agent and wait — for a
change they could make in Figma in two seconds. And it only works against the
dev server: a deployed build has no source files, so Edit mode degrades to
"record mode" for exactly the stakeholders and leads who review on the link.

Two limits in the current build cause wall 2, and both are structural:

1. **The write-back finds elements by appearance, not identity.** `/api/edit`
   locates a JSX element by its class list, tie-breaks on rendered text, and
   refuses on anything but exactly one match. That is the right guardrail for
   swapping `gap-12` for `gap-16`. It has no way to express "the second child of
   this stack", so no structural edit can be written safely.
2. **It only works on the dev server.** See above.

`amartha-web-artifact-builder` solved generation but not persistence: its
prototypes live per session and vanish. The studio is the persistent, shared
gallery. What it lacks is a way to edit from inside it.

## The shape of the answer — two halves of one system

| | **Design mode** | **Chat** |
|---|---|---|
| Interaction | drag, nudge, reorder, insert | describe it in words |
| Good at | layout, spacing, order, variants, copy | new screens, states, navigation, data, anything novel |
| Cannot do | anything outside the token/component vocabulary | nothing — but costs a turn and a wait |
| Needs an LLM | **no** | yes |
| Third parties | a GitHub App on this repo | Anthropic API key, sandbox, Supabase |

They are not alternatives. Design mode is narrower and much better at the
common case; chat is strictly more capable and slower. The same designer wants
both, usually in the same session — which is why "copy for agent" is an
affordance *inside* design mode (§ Vocabulary), and why they share a
verification gate, an ownership model and a git routine.

## Why design mode goes first

**Procurement asymmetry.** Design mode is pure code in a repo we own; its only
third party is a GitHub App installed on that same repo. Chat needs an Anthropic
API key, which needs a vendor contract, a budget and a spend cap — none of which
are in the team's control or on the team's timeline.

Be precise about where the gate actually sits: **the Anthropic API key is the
only thing behind it.** Vercel Sandbox is on the existing Vercel account and
needs no new vendor — Spike A booted one and ran a dev server in it today. That
matters for A4, because it means design mode may use a sandbox for previewing
without waiting on anything.

So the sequence is: **build everything that is unblocked, first.** The phase
table below puts the procurement gate in one place and everything before it is
startable today. This also happens to be the better product order — design mode
resolves wall 2 completely and resolves wall 1 for the majority of real change
requests, because most of them are layout and copy.

## Decisions

Decisions are **P**-numbered. **D** and **C** belong to the phase table
(§ Phases) and mean nothing here. The two series collided in the first draft of
this merge — "C3" was both *edit existing projects only* and *Chat push*, three
hundred lines apart — so a cross-reference landed a reader on the wrong thing.
Keep them apart.

| # | Decision | Why |
|---|----------|-----|
| P1 | **Source stays the truth.** No parallel JSON document | Design mode reads the rendered screen and writes TSX. What the agent wrote and what the designer moved are the same file |
| P2 | **Preview and persistence are independent** | Every edit renders as a DOM overlay on the client, instantly, with no compiler. Where the write goes — local disk, GitHub, nowhere — is a backend choice the panel never sees. This is the single decision that makes deployed design mode possible |
| P3 | **Closed vocabulary, closed outcomes** | The panel can only produce token classes, FunDS components with declared props, and stack operations. It is physically incapable of an off-system screen, so nothing it writes needs a review beyond CI |
| P4 | **Refuse, don't guess** | An edit the server cannot apply to exactly one place is refused with a reason and handed to the agent as text. A wrong-line write is worse than no write |
| P5 | **Layout is the designer's; behaviour is the agent's** | Anything outside the vocabulary becomes a "copy for agent" request from the same panel |
| P6 | **One team API key**, not a subscription per designer | The whole point of the chat half: one billed key replaces N seats, nobody installs or authenticates anything, and per-use cost is visible and cappable |
| P7 | **Agent SDK in a Vercel Sandbox** | Claude Code's own harness, so `CLAUDE.md` applies unchanged; Vercel is already the host, so no new vendor |
| P8 | **Edit existing projects only** | Chat lives on a project page; new projects still start locally |
| P9 | **Two verbs, unchanged** | Every chat turn is a commit on a session branch; "push" opens the change and lets it land. Vocabulary stays commit/push/live — identical to design mode's Apply/Push |
| P10 | **The branch is the durable state; the sandbox is a cache** | Sandboxes expire; a session must survive that without losing work |
| P11 | **Per-project monthly spend cap**, hard stop | A chat open to the team with no ceiling is an open bill |
| P12 | **One GitHub App** serves both halves | Resolved conflict — see below |
| P13 | **Identity arrives in two stages** | Resolved conflict — see below |

### Resolved conflict — identity (P13)

The two source documents disagreed:

- `DESIGN-MODE-PLAN` §4: the deployed studio has one shared password and no
  identity; design mode asks for the designer's name once, stores it in
  localStorage, and uses it for the branch name, the commit message and the
  ownership check.
- `CHAT-PLAN` C3/C4: the password gate is **removed** and replaced by Google
  sign-in on Vocus's Supabase project, with a `studio_role` column and a
  `display_name` used for the same ownership check.

**Resolution: staged, in that order.** Design mode ships on the localStorage
name prompt. This is honest about what it is — a courtesy check, not a security
boundary — and it is correct, because the real gate on a design-mode write is
the same one as on an agent's: the change is confined to `projects/<slug>/`, it
is a visible commit in the repo, and CI must pass. Nothing about the name
prompt makes a bad write possible that identity would have prevented.

Google sign-in arrives with the chat half, because chat is what actually
*needs* identity: it spends money per user and needs a per-project cap that
someone is accountable for. When it lands, `display_name` from `user_roles`
replaces the localStorage prompt and the prompt is deleted. Design mode gains
real identity for free and loses nothing in the meantime.

**Ownership check (both stages).** `project.config.owner` is a string *or an
array* (`['Chandra', 'Hazki', 'Patricia']` on seven projects today), so the
check is `[owner].flat().includes(name)`. Then:

- owner matches → silent.
- owner differs → refuse with "this is `<owner>`'s project"; offer record mode.
- `status: 'live'` → read-only for everyone but an admin; these document
  production (CLAUDE.md §2).
- screens inherited via `extends` → locked; they are the base owner's. A later
  phase can offer "override this screen" (copy into the project) as a
  structural op.

Two designers on the same project is already off-contract, so a conflicting
branch is surfaced as "needs the agent", not resolved by the studio.

**Name audit — DONE (Spike B, 2026-09-16).** Display names must match what
projects already carry, and `owner` was free text, so nothing stopped one person
being spelled two ways — which is exactly what had happened. `ngmis-cash-
outstanding` and `ngmis-bm-monitoring-v2` moved from `Chandraditya Kusuma` to
`Chandra` (Hazki chose the spelling), and `scripts/check-flows.mjs` now
validates every project's `owner` against a canonical `OWNERS` list, so a third
spelling fails CI instead of silently locking someone out of their own project.

This was harmless while ownership was a convention read by humans. It stops
being harmless the moment anything reads the field automatically — which is
B2's `display_name` check, the first thing that ever will.

### Resolved conflict — the GitHub App (P12)

Both documents specified an App and named its env vars differently
(`STUDIO_GH_APP_*` vs `GITHUB_APP_*`). **One App, `STUDIO_GH_APP_*`**, since
design mode ships first and installs it. Scope: `contents:write` +
`pull_requests:write` + `checks:read` on this repository only, never exposed to the client.
Installation tokens expire hourly and are minted per operation — never a
long-lived token in env.

---

## Measured — Spike A, 2026-09-16

Run by a parallel session on 2026-09-16, before any code was written. It settles
questions in **both** halves, so it sits ahead of both parts. Three runs: two
trivial prompts, then a real design request (the `afin-linear` alternative
homepage now in the tree as `screens/home-b.tsx` — that file is Spike A run 3,
not a separate spike).

A throwaway script (not in this repo) booted a real Vercel Sandbox against this
checkout and ran the Agent SDK inside it. Everything below is measured, not
estimated, and is folded into the sections that follow.

| Question | Answer |
|---|---|
| Does `settingSources: ['project']` really load CLAUDE.md? | **Yes.** With all tools disabled the agent answered `#853291` — it could only know that from the contract being in its system prompt |
| Cold start (boot + clone + `npm ci` + SDK install) | **13–19s** |
| One turn: first text / full 6-step turn | **2.2s / 25s** |
| One *trivial* turn's cost (Opus, four file reads) | **$0.27** — see the correction below; do not plan with this number |
| Fixed cost to boot a session's context | **$0.16** (~26k tokens written to cache, paid again by every new sandbox) |
| `next build` | **36–51s** |
| Dev server in the sandbox: boot + first route compile | **12.6–17.1s**, returns a working `*.vercel.run` URL |

The agent also behaved well unprompted: asked to change a button that does not
exist on the entry screen, it read four files and said it would be guessing,
rather than inventing one.

**Correction — a real design request costs roughly 5× a trivial one.** A third
run gave the agent an actual design prompt (an alternative `afin-linear`
homepage contrasting individual and group rewards):

| Run | Cost | Turns | Wall clock |
|---|---|---|---|
| Real request, with a dev-server detour | **$1.71** | 34 | 10.0 min |
| Real request, instruction reworded, no detour | **$1.39** | 23 | 4.4 min |

So `CHAT_CAP_USD=50` is about **36 real requests per project per month**, not
the 150–180 the $0.27 figure implies. That is a different instrument: a
designer can spend a third of a month's budget in one afternoon, which is worth
deciding about deliberately (§ Open questions).

Quality on that run was good and is the reason this is a cost question rather
than a viability one: it read `CHEATSHEET.md` before building, produced no
arbitrary values, used only `font-bold`, wrote a correct `lazyScreen`
registration, kept exactly one entry screen, reused the project's own
`HomeShell` instead of reinventing chrome, and ran lint, `check:flows` and
`tsc --noEmit` without being asked.

**Read the two recompile numbers carefully.** The sub-second figure (0.98s) is
edit-to-visible on an **already-compiled** route — that, and only that, is the
chat iteration loop and the basis for A4's `sandbox` backend. The 10.3s figure
is the **first** compile of a brand-new route. Both are real; quoting the
second as the iteration cost, or the first as the cold cost, would be wrong.

Two findings about credentials:

- The Sandbox **control plane rejects an OIDC token from a laptop** (403). A
  deployed Function authenticates via OIDC natively, so this affects local
  tooling only — but the SDK does not read `VERCEL_TOKEN` from the environment
  either; credentials must be passed as `{ token, teamId, projectId }`.
- The **AI Gateway does not accept the OIDC token** — it wants its own
  `AI_GATEWAY_API_KEY`. Routing model spend through Vercel is still possible
  (one vendor, one invoice, no Anthropic account) but it is not free-by-identity
  the way it first appeared. P6 stands either way; the choice is one env var.

The Vercel scope is **Hobby** (`"plan": "hobby"` in the OIDC claims) and Sandbox
is available on it: 45-minute max session, 4 vCPUs, 10 concurrent. Hobby's terms
are non-commercial — a real question before the team relies on this, not before
it is prototyped.

## What exists

- `platform/inspect/` — element selection, `tree.ts`, `resolve.ts`,
  `tokenMap.ts` (the discrete value space), and `copyForAgent.ts`, which already
  produces the exact string an agent needs. Both halves consume it as-is.
- `platform/edit/` — `protocol.ts` (verified-replace wire shape), `applyDom.ts`
  (optimistic patch + re-pin across fast refresh), `editStore.ts`,
  `componentProps.ts`. Rebuilt and extended under `platform/design/` in D1.
- `platform/runtime/*Bridge.ts` — the module-store pattern the shell uses to
  flip a mode. Design and chat are two more.
- `platform/chrome/SidePanel.tsx` — the panel shell both columns already use.
- `platform/flow/` — pan/zoom canvas; the board in D6 is built on it.
- `projects/configs.ts` — metadata-only loader a server route can import without
  pulling in screens. Ownership checks read `config.owner` through it.
- `middleware.ts` + `app/unlock/` — the password gate. Kept through D5, removed
  in C1.
- `app/api/edit/route.ts` — dev-only write-back, 404 in production by design.
  Removed in D1, replaced by `applyEdits` + backends.
- `.github/workflows/ci.yml` — lint, build, check:flows as a required check.
  Still the only thing between a branch and `main`, for both halves.

---

## Part A — Design mode

Replaces Edit mode (`platform/edit/`, `app/api/edit/`).

### What "freely" means here

The Figma feature to copy is **auto layout**, not the pixel canvas. A screen is
stacks: each frame has a direction, a gap, padding and alignment; children are
ordered, not positioned. Dragging reorders within a stack or moves between
stacks. Every value is a token from the 4px grid.

Free x/y positioning is deliberately out. It would emit absolute positioning
with arbitrary values, which the token lock (`no-arbitrary-value`) rejects and
CLAUDE.md §2 forbids — and it is not how the shipped app is built. Auto layout
is also the part of Figma the team actually uses for mobile screens.

### A1. Source mapping (build step)

A webpack loader (`enforce: 'pre'`, scoped to `projects/**/*.tsx`) stamps every
JSX element with `data-src="<file>:<line>:<col>"` — the position of the
element's opening tag in the file the build read. Runs in **dev and production
builds alike**; the deployed studio needs it as much as the dev server does.

- Parse with `@babel/parser` (TSX), rewrite with `magic-string`. Never a Babel
  preset: that would disable SWC for the whole build.
- Only project files are stamped. `design-system/` and `platform/` never are,
  which is also what keeps component internals unselectable (§ Vocabulary).
- Cost: a few bytes per element in HTML; file paths visible in the DOM. Fine
  behind the gate.
- The existing `data-fds` attributes stay: they name the component; `data-src`
  names the node.

`platform/inspect/resolve.ts` and `tree.ts` start reading `data-src`. Layers
becomes an exact outline of the JSX rather than a heuristic one.

> **Built and measured — D1a, 2026-09-16.** `platform/design/stamp.cjs`, with
> 13 tests in `scripts/test-design.mjs` (`npm run test:design`). It stamps all
> 220 project `.tsx` files without a parse failure, is idempotent, and returns
> the source untouched on TSX it cannot read.
>
> One correction to the spec above: the address is the position of the
> **opening element** — the `<` — not of the tag name one column right of it.
> Stamping the name put every address off by one and resolved nothing, silently.
> A round-trip test (stamp a file, read an address back out, resolve it against
> the original source) is what caught it and is the single test worth keeping if
> only one could be.

> **Rejected alternative.** React 18's `_debugSource` (present on the fiber via
> `jsx-dev-runtime`, and confirmed present in this repo on react 18.3.1 / next
> 14.2.35) would give element positions with no loader at all. It is rejected
> for two reasons: it exists only in development builds, which forfeits deployed
> design mode — the entire point of A4 — and React 19 removed it. Noted so it is
> not re-proposed.

### A2. Edit protocol v2 — addressed by node, applied on the syntax tree

`protocol.ts` is replaced. Every edit addresses a node by `src` and carries
enough of the old state to verify:

| Edit | Shape | Verifies |
|------|-------|----------|
| `class` | `{ src, oldClass, newClass }` | node's className contains `oldClass` |
| `text` | `{ src, old, next }` | node's text child equals `old` |
| `prop` | `{ src, prop, old, next }` | node's attribute equals `old` (or absent) |
| `reorder` | `{ src, parentSrc, fromIndex, toIndex }` | node is child `fromIndex` of parent |
| `move` | `{ src, fromParentSrc, toParentSrc, toIndex }` | as above, across parents |
| `delete` | `{ src }` | node exists |
| `duplicate` | `{ src }` | node exists |
| `insert` | `{ parentSrc, index, component, props }` | parent exists; component is FunDS |
| `wrap` | `{ srcs[], direction }` | nodes are consecutive siblings |
| `unwrap` | `{ src }` | node is a single-child stack / anonymous `div` |
| `stack` | `{ src, direction?, gap?, padding?, align?, justify? }` | node is a container |

The server applies edits with **recast** (parse via `@babel/parser`, print
preserving formatting), so a design tweak is a one-line diff and a reorder is
two hunks — reviewable like anything the agent commits. `ts-morph` is rejected:
it reprints, and every tweak would become a noisy diff.

`applyEdits(source, edits): { source } | { refused: { edit, reason } }` is a
pure function with no I/O. Backends call it; tests cover it directly.

> **Built and measured — D1a, 2026-09-16.** `platform/design/applyEdits.ts`,
> implementing `class`, `text` and `prop`. Two findings:
>
> **The one-line diff is almost true.** Measured on a real screen: the *first*
> edit to a file costs **2 lines** — the change, plus one semicolon added to the
> `return (…)` that this repo's style omits, because recast reprints the
> ReturnStatement when JSX inside its parentheses changes. Every edit after that
> is a clean **1 line**. It is a one-off normalisation per file, not per-edit
> noise, and the test asserts all three cases. Re-measure at D2: a reorder is
> specified as two hunks and that has not been checked.
>
> **recast 0.24 requires `@babel/parser` 7.** On 8 its `babel-ts` parser throws
> `"pipelineOperator" requires "proposal" option` on the first file, surfacing as
> a misleading "could not be parsed". `package.json` pins `^7`; bumping it breaks
> every edit in design mode.

> **Built — D2, 2026-09-16.** `move`, `delete` and `duplicate`, with 35 tests
> in `npm run test:design`. Changes from the table above, and why:
>
> - **`reorder` and `move` are one edit, anchored to a neighbour** —
>   `{ src, to: { before | after | inside: src } }` instead of indices. An
>   index counts JSX children, which include whitespace text and `{cond && …}`
>   the client cannot see; a neighbour's address is something it has.
> - **Every batch carries the file's version.** The loader stamps
>   `data-src-v` (a short content hash) beside every `data-src`, and the
>   backend refuses a batch whose version is not the file's. Structural edits
>   shift line numbers, so an address from before any change to the file —
>   the agent's included — can name a different node after it.
> - **Values apply before structure.** A duplicate then carries its original's
>   restyle, which is what the overlay shows, and "restyle, then delete" is
>   not a refusal.
> - **Undo is a guarded snapshot, per Apply.** The D1 inverse edits cannot
>   express "move it back" — the node's new address is unknown until the
>   screen reloads. The backend keeps the pre-write file and restores it only
>   while the file is exactly what that write produced.
> - **Diffs measured.** A reorder is two hunks; a delete is one (two when it
>   leaves an import unused — the import is removed as text); a duplicate is
>   one, a byte copy of the original. recast's added `;` on a reprinted
>   `return (…)` is now put back, so a class edit is one line from the first
>   edit, not two.
> - **Refused:** a `.map()` row, anything behind a condition, the screen
>   root, a drop into itself, and a drop into anything that doesn't take
>   children (`vocabulary.ts` lists FunDS containers and leaves). Moves stay
>   within one file.
>
> The overlay (A3) hides the original and draws a clone, rather than moving
> React's nodes — moving them breaks the next re-render. It replays the
> staged list in order on every change and every React re-render, so it
> survives state changes and navigation back.

> **Built — D3, 2026-09-16.** `insert`, `wrap`, `unwrap` and `stack`; 52 tests
> in all. Changes from the table above:
>
> - **New elements are addressable within a batch** as `new:<id>`, the id
>   their insert or wrap chose. That is what lets a designer build a row and
>   fill it before anything is written — including on the deployed link,
>   where nothing is ever written from the panel. A new element is edited by
>   rewriting its staged definition, not by value edits against it.
> - **`wrap` takes a className**, not a direction: the panel's knobs edit a
>   new wrapper's classes in place, and the write side only checks they are
>   named utilities.
> - **`stack` carries whole layouts** (`old` → `next`), verified against the
>   literal className and rewritten family by family, new classes placed in
>   Tailwind's order so the lint rule stays quiet.
> - **Insert defaults are hand-maintained** in `platform/design/catalog.ts`
>   (the open question below): what a designer wants when a Button lands is
>   not what the component defaults to.
> - **Wrap emits a plain `div`** (the other open question): no new import,
>   and it reads like the markup the agent writes.
> - **Gate met.** A shortcut row — Row, four Stacks, an icon and a label in
>   each — was built in the panel with nothing written, its recorded list
>   applied to `hello-world`, and the result passed `tsc` and lint.
>
> The overlay draws an insert as static markup of the real component
> (`react-dom/server`, loaded on first use), not a React portal: a second
> root inside the one that owns the screen fought it on every re-render.

> **Built — D4, 2026-09-16, switched off until the App exists** (§ Setting up
> D4). What differs from A4 above:
>
> - **The branch carries the build SHA**:
>   `<slug>/design-<name>-<sha7>`, not `-<yyyymmdd>`. A same-day branch cut
>   from an earlier deployment would, once a file is rewritten on it, carry
>   every other file as it was then and quietly revert what landed since.
> - **Production deployments of `main` only**, and only behind the password
>   gate. A preview is refused by configuration, not by convention.
> - **Undo is "drop and re-apply"** as planned; a file whose list becomes
>   empty is put back to the deployed copy.
> - **After Push the list is kept and locked** until the next deployment
>   (new SHA) brings the change in, so the screen never flickers back to the
>   old state and a second Apply can't reopen a merged branch.
> - **The name prompt offers the project's owners** and nothing else; anyone
>   else collects. The name is a courtesy check, as P13 says.
> - **Tested** against an in-memory GitHub (unit) and a local fake GitHub
>   behind a gated production build (browser). Not yet against real GitHub.
> - **After Push the panel keeps asking** (every 30s, and at once after a
>   reload) where the change has got to. Merged → "it's landed"; a finished
>   check that failed, or the change closed unmerged → "Your push didn't go
>   live", the list unlocks, and Push is offered again. Reading checks needs
>   the App's **Checks: read**; without it the panel says "on its way" as
>   before, rather than erroring.

**Batches are atomic.** The client stages edits (as Edit mode does today) and
sends the whole list. Targets are resolved against the source first, then edits
are applied in order on the live AST — recast's node objects stay valid as the
tree mutates, so a delete does not invalidate the address of the node after it.
One refusal refuses the batch.

### A3. Overlay renderer (client)

`applyDom.ts` grows from "swap a class" into a small overlay engine that can
show every edit above without a rebuild:

- class / text / prop — as today (prop repaint via `componentProps.ts`).
- reorder / move / delete / duplicate — DOM node moves and clones.
- insert — a React portal rendering the real FunDS component with default props
  into a placeholder element.
- wrap / unwrap / stack — synthetic `div` with the token classes the write would
  produce.

The overlay is keyed by `data-src` and **re-applied on mutation** (Layers
already rebuilds on a debounced `MutationObserver`), so a state change or a
navigation-and-back does not lose it. In dev, a successful write triggers fast
refresh, the screen re-renders from the new source, and the overlay for those
edits is dropped because the source now shows the same thing.

`.map()` lists: N elements share one `data-src`. The overlay applies to all N
and the panel says so ("applies to 4 items") — that is the instance model a
designer already knows from Figma, and it is honest about what the write does.

### A4. Backends — where Apply goes

One interface, three implementations, chosen by environment:

| Backend | When | Apply does | Commit / push |
|---------|------|------------|---------------|
| `fs` | dev server | writes the file; fast refresh | the designer's agent, as today |
| `github` | deployed, App configured | commits to a branch via the GitHub API | Push opens the PR with auto-merge, from the panel |
| `record` | deployed, no App configured | nothing; list persists in localStorage | copy the list for an agent (today's behaviour) |

**The GitHub backend.** The App from P12; a server route (`app/api/design/`) runs
on the Node runtime with the same `applyEdits`.

The deployed build knows the commit it was built from (`VERCEL_GIT_COMMIT_SHA`),
and every `data-src` position is valid against exactly that commit. So the
branch is defined as a **pure function of the build SHA and the edit list**:

```
branch <slug>/design-<name>-<yyyymmdd>
file   = applyEdits(source @ buildSHA, allEditsThisDeploy)
```

Each Apply re-sends the full list for this deploy and the server rewrites the
file on the branch from the build SHA — no line drift between batches, no
position bookkeeping, and undo is "remove the entry and re-apply". The client
already persists its list keyed by SHA (record mode does exactly this); when a
new deploy lands, the SHA changes, the list resets, and the overlay drops
because the source now renders the edited state.

"Push" from the panel: open the PR + auto-merge with the App token.
Project-only files, CI green → merges itself, Vercel redeploys in ~3 minutes. In
between, the overlay keeps showing the edited state. The designer sees no gap,
and the vocabulary is unchanged: commit, push, live, pending review.

> **A later fourth backend — `sandbox`.** Spike A measured `next dev` inside a
> Vercel Sandbox at **12.6–17.1s to a working `*.vercel.run` URL, then ~instant
> per edit by hot reload**, against 36–51s for `next build` before a
> deployment's queue and upload. That is the difference between a gesture that
> feels live and one that waits a minute, and it settles the open question about
> whether a drag can afford to go through a commit loop: it can, if the commit
> lands in a sandbox rather than a deploy.
>
> It is **not** in D4, deliberately. The `github` backend needs no sandbox
> plumbing at all, so it ships first and unblocked. A `sandbox` backend reuses
> whatever C2 builds and can arrive any time after — it does not cross the
> procurement gate, because a sandbox running `next dev` is not an LLM.
>
> **It must pass `SITE_PASSWORD` into the sandbox env.** See § Sandbox previews
> are public by default — a requirement of the backend, not a hardening step to
> do later.

### Sandbox previews are public by default — close the gate

This applies to **both halves**: to A4's `sandbox` backend and to C2's route.

`sandbox.domain(port)` returns a **public, unauthenticated HTTPS URL** with
nothing in front of it, and the hostnames are short (`sb-361aa8lp6005.vercel.run`,
`sb-23v9w07xrn6e.vercel.run`, both observed in Spike A). The studio is
password-gated today by `middleware.ts` for a reason: these prototypes are
unreleased Amartha product design — majelis flows, pencairan, agent dashboards.
A sandbox preview serves that whole studio to anyone holding the URL.

This is a **regression of an existing control**, not a new risk to note and
accept, and it is one line to prevent. The sandbox runs the studio's own Next
app, so `middleware.ts` runs inside it too — but `isGateConfigured()` is
`Boolean(process.env.SITE_PASSWORD)`, so with no password set the gate disables
itself and serves every route open. (That default is correct for local dev and
for Vercel previews, which sit behind Vercel's own auth. A `*.vercel.run` URL
does not.)

**Requirement:** `SITE_PASSWORD` is passed in the `env` at `Sandbox.create`, in
every backend that exposes a port. The preview then inherits exactly the gate
the deployed studio has today — same password, same behaviour, nothing new
built. `SITE_SESSION_SECRET` is optional and may be passed too.

**After C1 the keys change, the mechanism does not.** C1 deletes `app/unlock/`
and `SITE_PASSWORD`, so from then on what the sandbox must inherit is the
Supabase trio (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`) instead. Same rule either way — *whatever gates the
deployed studio must be passed into any sandbox that exposes a port* — and C1
must not land without updating the `Sandbox.create` env alongside it, or the
gate silently disables itself again.

Written here as spec rather than left in § Risks, because a risk row is easy to
ship past.

### A5. Panels

Design mode takes both columns, exactly the layout Edit + Layers occupy now:

- **Left — Layers.** Now an exact JSX outline. Drag to reorder and move; `⌫`
  deletes, `⌘D` duplicates. Multi-select consecutive siblings → wrap.
- **Right — Inspector.** Edit mode's panel with a Stack section (direction, gap,
  padding, align, justify — every knob a token stepper) and an Insert section:
  FunDS components with defaults, click to insert after the selection or drag
  into the canvas. `componentProps.ts` already holds the prop menus; it gains a
  `defaults` entry per component.
- **Canvas.** Selection handles, drop indicators between siblings, and gap
  handles on stacks that step through the 4px grid. Reorder by drag on the
  device as well as in Layers.
- **Footer.** Pending list, Apply, Undo, Copy for agent, and — deployed — Push.

Inspect mode stays as the engineer-facing read-only view. States stay on the
left when design mode is off.

### Vocabulary — what design mode can and cannot do

| Can | Cannot (→ copy for agent, or chat) |
|-----|---------------------------|
| Token classes: spacing, radius, colour, type scale | Any value not in the token map |
| Text | Text computed from data |
| Declared FunDS props | Component internals — never selectable; they aren't stamped |
| Reorder / move / delete / duplicate / wrap / unwrap | Anything inside a conditional the source doesn't render right now |
| Insert a FunDS component with defaults | A component FunDS doesn't have (CLAUDE.md §4 → project-local, by the agent) |
| Stack direction, gap, padding, alignment | Absolute position, size in px, new state, navigation, data |

The right-hand column is exactly the case chat exists for. Once Part B ships,
"copy for agent" becomes "ask chat", in the same panel.

---

## Part B — Chat

A chat panel on `/p/<slug>`, visible to the project's owner. They select an
element on the screen, type what they want, and an agent edits the project. The
result appears as a preview. When they're happy they say **push**, and it goes
live the same way every other change does.

The agent is **the same agent the designer would run locally**: Claude Code as a
library (the Agent SDK), reading the repo's `CLAUDE.md`, in a sandbox holding a
checkout. Nothing about the contract, the design system, or the verification
gate is re-implemented; the studio supplies the sandbox, the identity and the
git routine.

### B1. Architecture

```
browser  /p/<slug>  ChatPanel
   │  POST /api/chat  (SSE)
   ▼
Next.js route (Node, Fluid)
   │  auth · role · ownership · cap
   │  get-or-create sandbox for (slug, designer)
   ▼
Vercel Sandbox  ── repo checkout on branch chat/<slug>/<designer>
   │  next dev on an exposed port  ──────────────► preview URL, hot-reloaded
   │  node scripts/chat-agent.mjs  ← Agent SDK, reads CLAUDE.md
   │  stdout: stream-json  ──────────────────────► relayed to browser
   │  then: git add projects/<slug> · commit · push
   ▼
GitHub (App token) ──► branch holds the work (durability, not preview)
```

### B2. Identity and roles — copied from Vocus

`amartha-vocus` (sibling repo) already solved this for the same people: Supabase
Auth with Google (`signInWithOAuth({ provider: 'google', queryParams: { hd:
'amartha.com' } })`), a `public.user_roles` table keyed by email with `role IN
('viewer','editor','admin')`, an `EDITOR_EMAILS` env fallback, a
`requireAdmin()` route helper, and a Settings → Users page.

The studio **joins the same Supabase project**, so one Google login and one user
list serve both tools. Copied: `lib/auth.ts`, `lib/auth-server.ts`,
`lib/api-auth.ts`, the Supabase client helpers, `middleware.ts` (matcher
adapted: `_vercel` stays excluded so analytics beacons aren't redirected),
`app/login`, `app/auth/callback`, and the Users manager under `/settings`.
`app/unlock/`, `SITE_PASSWORD` and `SITE_SESSION_SECRET` are removed. Local dev
with no Supabase env behaves like today's `isGateConfigured()`: gate off, chat
hidden.

Roles are per tool, so `user_roles` gains a `studio_role` column (same enum)
beside Vocus's `role`; each tool's Users page edits its own column.

| `studio_role` | Who | Can |
|---------------|-----|-----|
| `viewer` | default for any signed-in `@amartha.com` account | everything the studio shows today |
| `editor` | designers | design mode and chat on projects they own |
| `admin` | studio owner | any project; reset a cap; manage users |

`user_roles` also gains `display_name` — the value matched against
`project.config.owner`, replacing design mode's localStorage prompt (P13).

> **Open — carried from CHAT-PLAN.** Sharing Vocus's Supabase project couples
> two tools' auth at the database level to save provisioning a second project.
> Only the auth schema is shared, the studio never reads Vocus tables, and
> `studio_role` is its own column — but this is worth a deliberate decision
> before C1 starts, not a default.

### B3. The route — `app/api/chat/route.ts`

Node runtime, streaming SSE. Per request:

1. **Gate** — session → role → ownership → cap → **credential** (in that order;
   each failure is a distinct message the panel can show). The credential check
   is one cheap call, and it is not optional: the Agent SDK retries a bad key
   for **three minutes** before surfacing anything, which in a chat panel is
   indistinguishable from a hang.
2. **Sandbox** — look up the session's sandbox id in KV. If alive, reuse. If
   not: `Sandbox.create` from the repo with an App installation token, passing
   **`SITE_PASSWORD` in the sandbox env** so the exposed preview is gated (§
   Sandbox previews are public by default — required, not optional); if the
   session branch exists on origin, check it out, else branch from fresh `main`.
   `npm ci`. Set `git config user.name/email` to the designer. Store the id.
3. **Prompt** — the element context (if any), the message, and — on push — the
   push instruction.
4. **Run** — `sandbox.runCommand('node', ['scripts/chat-agent.mjs', …])` with
   streaming stdout; forward each line as an SSE event. The request's
   `AbortSignal` kills the command: closing the tab stops the spend.
5. **Land the turn** — `git status --porcelain`: anything outside
   `projects/<slug>/` is reset and reported ("the agent tried to change a shared
   file; not saved"). Then `git add projects/<slug>`, commit `[<slug>] <first
   line of the message>`, `git push -u origin`.

   > **The flat reset is safe because of P8, not because confinement is proven
   > in general.** Measured once, on a real design request that added a screen
   > to `afin-linear`: the agent touched `index.ts`, `NOTES.md` and the new
   > screen file, all inside `projects/afin-linear/`, and never went near
   > `registry.ts` or `configs.ts`. That is evidence for the *edit* case only.
   > **Creating a project** must append one line each to `projects/registry.ts`
   > and `projects/configs.ts` — both outside the folder — and a flat reset
   > would strip them and leave a project that does not load. P8 ("edit existing
   > projects only") is what keeps that case from arising; design mode does not
   > create projects either. **Creating a project stays a local Claude Code
   > job.** If P8 is ever relaxed, this reset must be revisited first.
6. **Preview** — the sandbox is already serving it. `next dev` starts once per
   session on an exposed port; `sandbox.domain(port)` is the link, and every
   later turn hot-reloads into the page the designer already has open.
   Measured: 13s to first compile, then ~instant per edit, against 36–51s for
   `next build` *before* a deployment's queue and upload. A deploy-per-turn
   preview would put 1–2 minutes between a designer's sentence and seeing it —
   and design mode's gestures (Part A) could not live with that at all, which is
   why the same mechanism is the natural fourth backend for A4.
7. **Spend** — add the SDK result's `total_cost_usd` to the project's monthly
   total in KV; include running total and cap in the `done` event.

`maxDuration` is set to the plan's ceiling (Fluid allows 800 s on Pro). If a
turn overruns, the agent process keeps running in the sandbox; the panel
reconnects with the sandbox id and tails the log rather than losing the turn.

### B4. The runner — `scripts/chat-agent.mjs`

Lives in the repo so it is cloned with it and versioned with the contract. Runs
inside the sandbox on `@anthropic-ai/claude-agent-sdk` (a devDependency, so
`npm ci` installs it):

```js
query({
  prompt,
  options: {
    model: 'claude-opus-5',
    cwd: '/repo',
    settingSources: ['project'],        // ← without this CLAUDE.md is NOT loaded
    permissionMode: 'acceptEdits',
    allowedTools: ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'Bash'],
    // ↑ SEE THE WARNING BELOW BEFORE COPYING THIS LINE.
    maxTurns: 40,
    systemPrompt: { type: 'preset', preset: 'claude_code', append: STUDIO_APPEND },
  },
})
```

> **A bare tool name in `allowedTools` silently disables `canUseTool`.** Spike A
> wired a permission callback to hard-block the agent from starting a dev
> server, and the SDK warned:
>
> ```
> CLAUDE_SDK_CAN_USE_TOOL_SHADOWED: canUseTool will not be invoked for: Read,
> Edit, Write, Glob, Grep, Bash. Bare allowedTools entries auto-approve the whole
> tool before the callback is consulted. To gate every tool call, use a PreToolUse
> hook; or remove the bare names from allowedTools so they fall through.
> ```
>
> The denial count was 0 and nothing failed — the run only behaved because the
> *instruction* had also been reworded. Anyone implementing the config above
> would wire a callback, never see it fire, and not notice. Use a **PreToolUse
> hook** returning `permissionDecision: 'deny'` instead. That hook is written but
> **not yet proven by a run**; it is the recommended mechanism, not a verified
> one.

`STUDIO_APPEND` is the only contract text the studio adds, and it exists to stop
the agent running CLAUDE.md §5 itself:

> You are running inside the studio chat for project `<slug>` on behalf of
> `<displayName>`. Edit only `projects/<slug>/`. You are already on the correct
> branch: do **not** checkout, branch, commit, push, or open a pull request —
> the studio does that after each turn. A dev server is already running and
> serving the preview; do not start, stop, or restart one. Run `npm run lint`
> after edits that touch classes; run the full gate only when asked to push.

Everything else — FunDS-only vocabulary, no arbitrary values, click-through
default, no `notes` unless asked — comes from `CLAUDE.md` exactly as it does
locally. A change to the contract changes the chat agent on its next session.

**`STUDIO_APPEND` is advisory, not a control.** Measured: it lost outright to
`CLAUDE.md` on the dev-server instruction — §7 tells the agent to start a dev
server, the append told it not to, and the append lost, burning ~6 minutes and
~$1. An appended instruction does not outrank a loaded contract. Anything the
studio actually *requires* has to be enforced in code (a PreToolUse hook, or the
post-turn reset in B3 step 5), not asked for in prose.

Output is the SDK's stream-json: assistant text goes to the panel as it arrives,
tool events become a status line ("editing home.tsx", "running lint"), the
`result` message carries cost.

### B5. Verbs

Identical to design mode's, which is the point:

- **Every turn = commit.** Committed and pushed to `chat/<slug>/<designer>`
  for durability; the preview updates by hot reload, not by the push. The panel
  says "saved — not live".
- **Undo the last turn.** `git reset --hard HEAD~1` on the session branch, and
  the preview follows. This is the most-needed control for someone who does not
  use git, it is trivial on a session branch, and it belongs in C2 — not beside
  the revert-a-push flow in C3.
- **Push** — the panel's Push button (or the word). The turn's prompt asks the
  agent to run the full gate (`lint`, `build`, `check:flows`) and fix what it
  finds. Then the route, through the App: open the change against `main`, enable
  auto-merge, report "pushed — it goes live on its own". CI is still the gate;
  the sandbox run just means failures are fixed in the chat rather than
  discovered in CI. After merge the branch is deleted and the session ends.
- **Conflict** — if `main` moved and the change can't merge, the panel offers
  "bring it up to date", which is a turn asking the agent to rebase.
- **Undo the last push** — a revert opened through the App.

One session branch per (project, designer). Co-owners get their own; two people
editing the same project meet only at merge, which is where they meet today.

### B6. Sandbox lifetime and spend

Sandboxes have a bounded timeout. Because every turn is pushed, an expired
sandbox costs only a re-clone: the route creates a fresh one on the existing
branch and continues. The KV entry is `(slug, designer) → sandboxId, branch,
createdAt`; a stale id is replaced. Nothing a designer did is ever only in a
sandbox.

Cold start is 13–19s, so an expired sandbox is barely an event — no prebuilt
image or snapshot is needed. The real cost of a fresh one is **$0.16 of context
re-cached**, not time. Cheap enough that P10 holds, but it is the reason to
prefer resuming a session over discarding it.

Two turns must never run on one sandbox at once. Turns are slow enough that a
designer will send a second message while the first is working, and two agents
editing one checkout race each other's commits. One lock per session.

**Spend — measured: $1.39–$1.71 for one real design request** (23–34 turns),
plus a one-off **$0.16** per session to cache the contract and repo context. A
trivial turn is $0.27, which is the number to quote for a label tweak and the
wrong one to budget with. So `CHAT_CAP_USD=50` buys roughly **36 real requests
per project per month**. Sonnet would cut that several-fold and is plausibly
right for label-and-copy work; the model belongs in config, not in a constant.

A monthly per-project cap is a billing guardrail, not a runaway guard — runaway
happens inside one session, so add a per-session ceiling beside it. And a
per-*project* cap lets one designer spend the budget out from under co-owners:
seven projects here have three owners each.

KV keyed `spend:<slug>:<yyyy-mm>`, incremented per turn from the SDK's cost.
`CHAT_CAP_USD` (per project per month, default 50). At 80% the panel warns with
the number; at 100% the route refuses and names who can reset it. Admins reset
through `/api/chat/cap`. The KV store is provisioned from the Vercel Marketplace
(Vercel KV itself no longer exists); the route needs only `get`, `set`,
`incrbyfloat`.

### B7. The panel — `platform/chat/`

> **Changed 2026-09-22 — chat is not a mode.** It is a **Chat** button on the
> top bar, beside the mode switch, that opens and closes a panel docked on the
> right of the shell (`ChatDock.tsx`, state in `platform/runtime/chatBridge.ts`).
> It stays open across Prototype · Design · Inspect · Flow, and closing it hides
> rather than unmounts, so the conversation and a running turn survive. The
> element hand-off is Inspect's **Ask chat about this** button, which attaches
> the `copyForAgent` string as a chip in the composer. The reference for this
> interaction is **Airship** (github.com/0xnyn/airship): a local CLI agent
> driven from a visual editor, with an element selected and a prompt beside it.
>
> Until there is an API key, `app/api/chat` runs the **`claude` CLI on the dev
> server's own laptop** (the owner's subscription login) instead of a sandbox,
> behind design mode's editing password. The paragraph below is the original
> design, kept for the parts that still hold.

`ChatPanel.tsx` takes the right column in a **Chat** mode of the shell's
segmented switch (Prototype · Inspect · Design · Chat · Flow), wired through a
`chatBridge.ts` like the others. It renders only for an owner or an admin. The
pick layer from Inspect is on: clicking an element attaches its context chip to
the composer, and the chip is the `copyForAgent` string.

Top to bottom: transcript (assistant text, tool status lines), the preview card
(the sandbox's own URL, plus a "still working" state while a turn runs), the
composer with the element chip, and a footer with Push, spend so far, Undo last
turn, and "saved — not live" / "pushed".

The panel is responsive — on a narrow viewport it becomes a sheet over the
prototype — but the target is the desktop browser. Nobody is expected to
prototype from a phone.

---

## Part E — One shell: selection, tabs, and Push (decided 2026-09-22)

After living with chat beside Design and Inspect, and a second look at Airship
(github.com/0xnyn/airship), the owner decided:

- **Design and Inspect merge into one mode.** Selecting is the mode; what you
  do with the selection is a tab. Top bar: **Prototype · Edit · Flow**. The
  right panel's tabs: **Chat · Edit · CSS** (CSS is today's Inspect panel;
  Layers stays on the left). On the link, where nothing saves, it opens on CSS.
  They already share one picker and one pinned element (`useInspectState`), so
  this is mostly joining the two panels — and deleting the copied crumbs,
  empty state, `resolveTarget` calls and `measure` geometry.
- **Chat becomes the panel's first tab**, not a separate dock. It uses the
  shared selection as a removable chip (Airship) instead of its own Pick layer.
  In Prototype, with nothing selected, the panel shows only Chat.
- **One Push, at the foot of Edit mode's panel**, under whichever tab shows.
  Pushing is the project's, not a tab's or a selection's: whatever made the
  change — chat, Edit-tab edits, the designer's own agent — it goes live from
  there. (First built in the top bar; moved into the panel, and the top bar's
  Chat button removed, on the owner's call the same day.)
- **Keep our pick rule** (nearest authored element) and token-locked edits.
  Don't copy Airship's free resize handles or its per-turn Commit/Push buttons.

### E1. Push from the dev server — `platform/push/`, `app/api/push`

Through the studio's GitHub App, like the link — so it needs the three
`STUDIO_GH_APP_*` values in the laptop's `.env.local` too. It never switches
branch or commits in the checkout (several sessions share it); it reads the
working copy and builds one commit on GitHub from main's tip.

- **What counts:** files in `projects/<slug>/` whose working copy differs from
  main, committed locally or not. A landed push drops out by itself.
- **Refused:** a file main changed since this laptop last updated (merge-base ≠
  main), unless main holds what this laptop itself pushed; ESLint errors in the
  files going out. Build and flows are CI's, and a red CI shows as "Push failed".
- **Afterwards:** once landed, and only on `main`, the pushed files — if still
  exactly as pushed — are staged and main is fast-forwarded. Anything in the
  way and the index is put back untouched.
- Behind the editing password; the name is checked against the project's
  owners (`whyNot`), same as the link. Unsaved Design edits are saved first.
- The link keeps its Push in the Design panel until E2 rebuilds that panel.

### E2–E3. One Edit mode, Chat as its first tab (built 2026-09-22)

Top bar Prototype · Edit · Flow, and nothing else for the project. Edit mode's
right panel is Chat · Edit · CSS with the Push bar under all three; Prototype
mode has no chat. Chat is about Edit mode's pinned element — a chip
with an ✕ that deselects — so its own Pick layer and the attachment state are
gone. The conversation lives in a module store (`useLiveChat`), so it and a
running turn survive mode switches, tab flips, minimizing and full screen; New
chat starts over. The separate right-hand dock from #369 is gone.

Chat sits in the same 264px column as every other panel, which is narrower
than the old 360px dock — widening the columns pushes the phone off-centre or
off small laptops. Revisit if it reads cramped.

### Order

E1 Push → E2 merge modes (Chat · Edit · CSS tabs) → E3 chat uses the shared
selection → E4 hand edits as chips in the composer, Apply = Send → E5 transcript
(tool rows with results, per-file diffs), per-turn undo from the chat guard's
PreToolUse hook, New chat → E6 picking polish (50ms ascend delay, parent and
sibling outlines, marquee, shortcut sheet). Each is its own reviewed change.

## Phases

Each phase is one reviewed Tier 2 change and leaves the studio working.

| # | Phase | Delivers | Gate / done when | Blocked by |
|---|-------|----------|------------------|------------|
| D1 | **Foundation** | source-mapping loader; `applyEdits` on recast with class/text/prop; `fs` + `record` backends; Edit mode rebuilt on it and renamed **Design**; `platform/edit/`, `/api/edit` removed; CLAUDE.md §7 "Edit-mode tweaks" → "Design-mode tweaks" | lint/build/check:flows green; every current Edit-mode action still works | — |
| D2 | **Structure** | reorder / move / delete / duplicate in Layers and on canvas; overlay for structural edits; batch atomicity | drag a card above another and Apply → one two-hunk diff | D1 |
| D3 | **Stacks & insert** | wrap / unwrap / stack knobs; Insert panel with defaults; gap handles | build a shortcut row from nothing without the agent | D1 |
| D4 | **Deployed design** | GitHub App backend; name prompt + ownership check + name audit; Push from the panel; SHA-keyed list | a stakeholder edits a live link, pushes, and sees it land | D1 (**not** D2–D3) |
| — | **— procurement gate —** | Anthropic API key: contract, budget, cap | — | everything above ships without it |
| C1 | **Identity** | Supabase + Google sign-in copied from Vocus; `studio_role` + `display_name`; Users page; password gate removed; design mode's name prompt replaced | every current user opens the studio with their Google account; a non-editor never sees a chat affordance | D4 (for the ownership check it replaces) |
| C2 | **Chat MVP** | sandbox, runner, per-turn commit+push, **sandbox-served preview**, **undo last turn**, per-session lock, credential pre-check, cap | a designer with no Claude subscription and nothing installed changes a button label from the browser and opens the preview | C1 + key |
| C3 | **Chat push** | full gate in sandbox, PR + auto-merge via App, conflict and revert flows | a chat-made change lands on `main` without anyone opening a terminal | C2 |
| C4 | **Chat polish** | tool-status lines, in-panel preview frame, session resume after sandbox expiry, spend on the gallery | — | C3 |
| D6 | **Board** | pan/zoom board of all screens, editable in place; built on `platform/flow` | — | D3 |
| E1 | **Push from the laptop** | top-bar Push on the dev server through the GitHub App (§ E1) | a chat edit goes live from the studio without a terminal | D4 |
| E2 | **One Edit mode** | Design + Inspect merged; Chat · Edit · CSS tabs | every Design and Inspect action works from the one mode | E1 |
| E3 | **Chat on the selection** | Chat tab uses the pinned element; conversation store; New chat | ask about an element without a separate pick | E2 |
| E4–E6 | **Chat polish** | § Part E order; the link's Push moves to the top bar | — | E3 |

**Everything through D4 is unblocked and startable today.** The first thing that
needs a signature is the Anthropic key at C2 — Vercel Sandbox is not behind that
gate (§ Measured). D4 can move ahead of D2–D3 if the deployed case matters more
than structural edits; nothing in it depends on them. C1 ships alone and is
worth having regardless of the rest.

**Hobby terms.** The Vercel scope is currently Hobby, whose terms are
non-commercial. Sandbox works on it (45-min sessions, 4 vCPUs, 10 concurrent),
which is fine for prototyping either half — but it is a real question before the
team relies on this, and it applies to A4's `sandbox` backend as much as to
C2.

## What is removed

- `platform/edit/` (EditPanel, editStore, applyDom, protocol, componentProps →
  moved and extended under `platform/design/`).
- `app/api/edit/route.ts` and its text-matching search.
- `platform/runtime/editBridge.ts` → `designBridge.ts`.
- The "Edit" entry in the shell mode switch → "Design".
- CLAUDE.md §7 "Edit-mode tweaks", rewritten for design mode. Its three rules
  (ride commit/push silently; check where tweaks landed; Apply is not a third
  verb) all still hold, and extend unchanged to chat.
- `app/unlock/`, `SITE_PASSWORD`, `SITE_SESSION_SECRET` — at C1, not before.

## Contract changes (Tier 2, own commit)

- CLAUDE.md §7: "Edit-mode tweaks" → "Design-mode tweaks" (D1); four lines
  saying the studio chat is another agent bound by this file, the studio manages
  git for it, designers reach it from the project page, and commit/push mean the
  same thing there (C2).
- `platform/types.ts` is untouched — `owner` keeps its shape.
- `README.md` deploy section: Google OAuth env vars replace `SITE_PASSWORD` (C1).

## Setting up D4 — the GitHub App

D4 is built and switched off until these exist. In order:

1. **Create the App** (GitHub → Settings → Developer settings → GitHub Apps →
   New). No webhook. Repository permissions: **Contents: read & write**,
   **Pull requests: read & write**, **Checks: read** (so the panel can tell a
   push that failed CI), Metadata: read. Nothing else.
2. **Generate a private key** on the App's page, and note its **App ID**.
3. **Install it** on `amartha-studio` only. The installation's URL ends in its
   **installation ID**.
4. **Repo settings**: "Allow auto-merge" on (it already is — `gh pr merge
   --auto` relies on it). The App's changes touch only `projects/<slug>/`, so
   CODEOWNERS asks for no review and CI is the only gate, as for an agent's.
5. **Vercel → Environment Variables, Production only**: `STUDIO_GH_APP_ID`,
   `STUDIO_GH_APP_PRIVATE_KEY` (the PEM; pasting it on one line with `\n` is
   fine), `STUDIO_GH_APP_INSTALLATION_ID`, and a gate — **`STUDIO_EDIT_PASSWORD`**
   (anyone may view; saving asks for it once per browser) or `SITE_PASSWORD`
   (the whole studio is gated). Keep "Automatically expose System Environment
   Variables" on. Redeploy.
6. **Check**: open a project you own on the production link, turn on Design,
   enter the editing password, pick your name, make one change, Apply, Push. A change from the App should
   appear and land itself once CI is green.

Why production only: a preview's build commit may not be on `main`, and a
change branch cut from it would carry that preview's other files into the
change. `githubConfig()` refuses previews and any deployment not built from
the base branch, whatever is configured.

## Env vars

```
# D4 — Production: all three, or design mode on the link stays Collect.
# E1 — also in a laptop's .env.local for the top bar's Push (repo from origin).
STUDIO_GH_APP_ID / STUDIO_GH_APP_PRIVATE_KEY / STUDIO_GH_APP_INSTALLATION_ID
# Read from Vercel's system variables; set these only to override them.
#   STUDIO_GH_REPO_OWNER / STUDIO_GH_REPO_SLUG   (VERCEL_GIT_REPO_OWNER / _SLUG)
#   STUDIO_GH_BUILD_SHA                          (VERCEL_GIT_COMMIT_SHA)
#   STUDIO_GH_BASE_BRANCH=main
#   STUDIO_GH_API_URL                            (GitHub Enterprise, tests)
# Also required, one of: STUDIO_EDIT_PASSWORD (saving only — the studio stays
# open to view) or SITE_PASSWORD (the whole studio). No gate, no backend.
# As of 2026-09-18 production has NO SITE_PASSWORD: several teams read the
# link and it stays open, so D4 runs on STUDIO_EDIT_PASSWORD. Note that the
# chat sandbox's preview gating (§ Sandbox previews are public by default)
# assumes SITE_PASSWORD — revisit before C2.

# C1
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
EDITOR_EMAILS=hazki@amartha.com,…            # fallback only, as in Vocus

# C2
ANTHROPIC_API_KEY                            # team key — or AI_GATEWAY_API_KEY instead
VERCEL_TOKEN / VERCEL_PROJECT_ID / VERCEL_TEAM_ID   # Sandbox control plane
CHAT_CAP_USD=50
KV_*                                         # from the marketplace store
```

Two credential findings from Spike A, both worth knowing before C2 starts:

- The Sandbox SDK does **not** read `VERCEL_TOKEN` from the environment —
  credentials are passed explicitly as `{ token, teamId, projectId }`. And the
  control plane **rejects a Vercel OIDC token presented from a laptop** (403);
  a deployed Function authenticates via OIDC natively, so this is a
  local-tooling constraint only.
- The AI Gateway does **not** accept the OIDC token either; it wants its own
  `AI_GATEWAY_API_KEY`. Routing model spend through Vercel stays possible (one
  vendor, one invoice, no Anthropic account) but it is not free-by-identity the
  way it first appeared.

`VERCEL_AUTOMATION_BYPASS_SECRET` is **not** needed: the preview is the
sandbox's own `*.vercel.run` URL, not a protected branch deployment. That URL is
public, so the studio's existing `SITE_PASSWORD` is passed *into* the sandbox
env instead — see § Sandbox previews are public by default.

App installation tokens expire hourly; the route mints one per sandbox creation
and per push — never a long-lived token in env.

## Onlook, revisited

`HANDOVER-PLAN` Phase 4 asked to evaluate Onlook first. Evaluated twice, same
conclusion both times — recorded here so it is not evaluated a third time.

Its interaction model (select → inspector → drag in layers) is what A5 copies.
Its editing engine is not usable: **no notion of a token lock, and it emits
arbitrary Tailwind values freely**, which `no-arbitrary-value` rejects and
CLAUDE.md §2 forbids. The constraint is the studio's product; a tool built to
not have one cannot be given one cheaply.

Two corrections to the earlier evaluation, for the record:

- It is no longer "a local desktop app". It is a hosted multi-tenant web app
  (Supabase + CodeSandbox SDK + OpenRouter + Morph/Relace + Freestyle), Apache
  2.0, self-hostable via Bun + Docker. This does not change the verdict.
- **Forking it was considered and rejected** (2026-09-16). Beyond the token
  lock: upstream has shipped no feature since 2026-02-27 (everything after is a
  README change or a CVE patch; last release v0.2.32, July 2025) with 380 open
  issues, so a fork means owning a dormant 3-app / 24-package monorepo. And the
  studio's 85k lines of `projects/` do not survive it — Onlook has no shared
  registry and no `extends`, so each project would become an isolated container.
  Only ~16k lines here are the tool; the rest is the asset.

Nothing in Onlook is depended on. Its parser was considered for A1 and rejected
in favour of our own loader, which must run in production builds.

## Risks

| Risk | Mitigation |
|------|------------|
| Webpack loader breaks on TSX the parser can't read | Stamping is best-effort per file: parse failure → file unstamped, build unaffected, that screen is inspect-only |
| Turbopack (if ever enabled) skips webpack loaders | Loader is webpack-only; `npm run dev` stays on webpack until Turbopack has an equivalent hook |
| recast reformats a file it reprints | Only touched nodes are reprinted; CI diff size is the check — a D1 acceptance test asserts one-line diffs for class edits |
| Overlay drifts from what the write would produce | Every overlay op is a preview of a specific edit; a D2 test renders source-after-edit and diffs the DOM against the overlay for each op |
| GitHub App credentials in env | `contents:write` + `pull_requests:write` + `checks:read` on this one repo; never exposed to the client; tokens minted per operation |
| Deployed edits to another designer's project | Name check + owner refusal + `live` read-only; and the change is still gated by CI and visible in the repo |
| Designers trust the overlay before push lands | The panel says "saved, not live" until the new deploy's SHA arrives — same wording as chat |
| ~~Agent ignores the contract in the sandbox~~ | **Closed by Spike A** — verified end to end with tools disabled. Keep the runner's startup check on `CLAUDE.md` as a regression guard |
| Agent edits outside the project | post-turn `git status` reset + report; the PR still goes through CI and CODEOWNERS for shared paths. Measured once for the edit case (B3 step 5); **unproven for project creation**, which C3 keeps out of scope |
| A permission callback that never fires | bare names in `allowedTools` shadow `canUseTool` silently (B4). Use a PreToolUse hook — and assert in the runner's startup check that the gate actually fires, since the failure mode is silence |
| Treating `STUDIO_APPEND` as enforcement | it is advisory and lost to `CLAUDE.md` in a measured run; anything required is enforced in code |
| ~~Cold sandbox per turn~~ | **Measured at 13–19s** — a non-issue. One sandbox per session, KV-tracked; re-clone on expiry costs seconds plus $0.16 of re-cached context |
| Two turns racing on one sandbox | per-session lock; the panel shows "still working" rather than accepting a second message |
| A bad credential reads as a hang | pre-flight check in the gate — the SDK itself takes three minutes to report one |
| Route timeout mid-turn | runner keeps going in the sandbox; panel reconnects by id |
| The sandbox's `*.vercel.run` preview URL is public by default | **Closed in spec, not accepted:** `SITE_PASSWORD` is passed into the sandbox env so `middleware.ts` gates the preview exactly as it gates the deployed studio. See § Sandbox previews are public by default. Without it this is a straight regression of an existing control |
| Cost runaway | hard monthly cap per project, abort on tab close, `maxTurns` |
| Stale display names | name audit is part of D4, not C1 — it gates the first ownership check, whichever half ships it |
| One designer spends a co-owned project's whole cap | seven projects here have three owners each; add a per-session ceiling beside the monthly per-project cap |
| Hobby's non-commercial terms | fine while prototyping; a real question before the team relies on either half |
| Sharing Vocus's Supabase couples the two tools | only the auth schema is shared; the studio never reads Vocus tables; `studio_role` is its own column. Still an open decision — see B2 |
| The two halves drift apart again | this document. Neither `CHAT-PLAN.md` nor `DESIGN-MODE-PLAN.md` is maintained after the merge |

## Open questions

**Answered by Spike A**

- ~~Cap default~~ — but the answer changed the question. A real design request
  is **$1.39–$1.71**, so $50 is ~36 requests per project per month, not 150–180.
  Still open: **is a per-project monthly cap the right instrument at all?** One
  designer can spend a third of a month in an afternoon, and seven projects here
  have three owners each. A per-session ceiling is needed beside it regardless.
- ~~Name audit~~ — done, Spike B. See § Resolved conflict — identity.
- ~~Does a gesture need a faster write path than a commit loop?~~ — largely
  settled: a sandbox dev server hot-reloads in ~a second, so the write path
  *can* be the sandbox (see A4's fourth backend). What remains is whether a drag
  batches into one commit on release or writes per gesture — confirm once either
  A4 or C2 shows real round-trip latency.

**Open**

- **Supabase coupling (B2)** — second project vs sharing Vocus's. Decide before C1.
- **Which model?** Opus was measured at $1.39–$1.71 per real request. Sonnet is several times
  cheaper and probably enough for the tweaks this feature exists for. Make it
  configurable and try both on a real request.
- **Where does model spend get billed** — Anthropic directly, or through the
  Vercel AI Gateway? Same per-token price, one env var apart: one invoice versus
  one fewer key to create.
- **Hobby's non-commercial terms** — fine for a prototype, a question before the
  team relies on it. Applies to A4's `sandbox` backend as much as to C2.
- ~~Insert defaults~~ — hand-maintained, in `platform/design/catalog.ts` (D3).
- ~~`wrap`: bare `div` or a `Stack` primitive~~ — a bare `div` with token
  classes (D3). A primitive stays possible later; nothing depends on it.
- Board (D6): edit every screen in place, or select a screen to open it in the
  device frame? The former is Figma; the latter is much simpler.
- Should admins chat on *any* project, or only unlock caps? Full access is
  simplest and matches the studio-owner role in CODEOWNERS.
- Preview inside the chat panel (iframe) vs a new tab: the sandbox's own URL
  makes the iframe straightforward; decide after seeing C2 in a desktop
  browser.
