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

| # | Decision | Why |
|---|----------|-----|
| D1 | **Source stays the truth.** No parallel JSON document | Design mode reads the rendered screen and writes TSX. What the agent wrote and what the designer moved are the same file |
| D2 | **Preview and persistence are independent** | Every edit renders as a DOM overlay on the client, instantly, with no compiler. Where the write goes — local disk, GitHub, nowhere — is a backend choice the panel never sees. This is the single decision that makes deployed design mode possible |
| D3 | **Closed vocabulary, closed outcomes** | The panel can only produce token classes, FunDS components with declared props, and stack operations. It is physically incapable of an off-system screen, so nothing it writes needs a review beyond CI |
| D4 | **Refuse, don't guess** | An edit the server cannot apply to exactly one place is refused with a reason and handed to the agent as text. A wrong-line write is worse than no write |
| D5 | **Layout is the designer's; behaviour is the agent's** | Anything outside the vocabulary becomes a "copy for agent" request from the same panel |
| C1 | **One team API key**, not a subscription per designer | The whole point of the chat half: one billed key replaces N seats, nobody installs or authenticates anything, and per-use cost is visible and cappable |
| C2 | **Agent SDK in a Vercel Sandbox** | Claude Code's own harness, so `CLAUDE.md` applies unchanged; Vercel is already the host, so no new vendor |
| C3 | **Edit existing projects only** | Chat lives on a project page; new projects still start locally |
| C4 | **Two verbs, unchanged** | Every chat turn is a commit on a session branch; "push" opens the change and lets it land. Vocabulary stays commit/push/live — identical to design mode's Apply/Push |
| C5 | **The branch is the durable state; the sandbox is a cache** | Sandboxes expire; a session must survive that without losing work |
| C6 | **Per-project monthly spend cap**, hard stop | A chat open to the team with no ceiling is an open bill |
| M1 | **One GitHub App** serves both halves | Resolved conflict — see below |
| M2 | **Identity arrives in two stages** | Resolved conflict — see below |

### Resolved conflict — identity (M2)

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

**Name audit — a prerequisite for both stages.** Display names must match what
projects already carry. The six distinct owner values today are `Hazki`,
`Chandra`, `Chandraditya Kusuma`, `Patricia`, `Nugraha`, `Yori` — `Chandra` and
`Chandraditya Kusuma` must become one spelling before any ownership check is
enforced.

### Resolved conflict — the GitHub App (M1)

Both documents specified an App and named its env vars differently
(`STUDIO_GH_APP_*` vs `GITHUB_APP_*`). **One App, `STUDIO_GH_APP_*`**, since
design mode ships first and installs it. Scope: `contents:write` +
`pull_requests:write` on this repository only, never exposed to the client.
Installation tokens expire hourly and are minted per operation — never a
long-lived token in env.

---

## Measured — Spike A, 2026-09-16

Run by a parallel session on 2026-09-16, before any code was written. It settles
questions in **both** halves, so it sits ahead of both parts.

A throwaway script (not in this repo) booted a real Vercel Sandbox against this
checkout and ran the Agent SDK inside it. Everything below is measured, not
estimated, and is folded into the sections that follow.

| Question | Answer |
|---|---|
| Does `settingSources: ['project']` really load CLAUDE.md? | **Yes.** With all tools disabled the agent answered `#853291` — it could only know that from the contract being in its system prompt |
| Cold start (boot + clone + `npm ci` + SDK install) | **13–19s** |
| One turn: first text / full 6-step turn | **2.2s / 25s** |
| One turn's cost (Opus, four file reads) | **$0.27** |
| Fixed cost to boot a session's context | **$0.16** (~26k tokens written to cache, paid again by every new sandbox) |
| `next build` | **36–51s** |
| Dev server in the sandbox: boot + first route compile | **12.6–17.1s**, returns a working `*.vercel.run` URL |

The agent also behaved well unprompted: asked to change a button that does not
exist on the entry screen, it read four files and said it would be guessing,
rather than inventing one.

Two findings about credentials:

- The Sandbox **control plane rejects an OIDC token from a laptop** (403). A
  deployed Function authenticates via OIDC natively, so this affects local
  tooling only — but the SDK does not read `VERCEL_TOKEN` from the environment
  either; credentials must be passed as `{ token, teamId, projectId }`.
- The **AI Gateway does not accept the OIDC token** — it wants its own
  `AI_GATEWAY_API_KEY`. Routing model spend through Vercel is still possible
  (one vendor, one invoice, no Anthropic account) but it is not free-by-identity
  the way it first appeared. C1 stands either way; the choice is one env var.

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

**The GitHub backend.** The App from M1; a server route (`app/api/design/`) runs
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
`project.config.owner`, replacing design mode's localStorage prompt (M2).

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
    maxTurns: 40,
    systemPrompt: { type: 'preset', preset: 'claude_code', append: STUDIO_APPEND },
  },
})
```

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
re-cached**, not time. Cheap enough that C5 holds, but it is the reason to
prefer resuming a session over discarding it.

Two turns must never run on one sandbox at once. Turns are slow enough that a
designer will send a second message while the first is working, and two agents
editing one checkout race each other's commits. One lock per session.

**Spend — measured: $0.27 for one Opus turn** (six steps, four file reads), plus
a one-off **$0.16** per session to cache the contract and repo context. So
`CHAT_CAP_USD=50` buys roughly **150–180 turns per project per month** — no
longer a guess. Sonnet would cut that several-fold and is plausibly right for
label-and-copy tweaks; the model belongs in config, not in a constant.

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

## Env vars

```
# D4
STUDIO_GH_APP_ID / STUDIO_GH_APP_PRIVATE_KEY / STUDIO_GH_APP_INSTALLATION_ID

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
| GitHub App credentials in env | `contents:write` + `pull_requests:write` on this one repo; never exposed to the client; tokens minted per operation |
| Deployed edits to another designer's project | Name check + owner refusal + `live` read-only; and the change is still gated by CI and visible in the repo |
| Designers trust the overlay before push lands | The panel says "saved, not live" until the new deploy's SHA arrives — same wording as chat |
| ~~Agent ignores the contract in the sandbox~~ | **Closed by Spike A** — verified end to end with tools disabled. Keep the runner's startup check on `CLAUDE.md` as a regression guard |
| Agent edits outside the project | post-turn `git status` reset + report; the PR still goes through CI and CODEOWNERS for shared paths |
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

- ~~Cap default~~ — $0.27/turn, so $50 ≈ 150–180 turns. Keep 50 and watch it.
- ~~Does a gesture need a faster write path than a commit loop?~~ — largely
  settled: a sandbox dev server hot-reloads in ~a second, so the write path
  *can* be the sandbox (see A4's fourth backend). What remains is whether a drag
  batches into one commit on release or writes per gesture — confirm once either
  A4 or C2 shows real round-trip latency.

**Open**

- **Supabase coupling (B2)** — second project vs sharing Vocus's. Decide before C1.
- **Which model?** Opus was measured at $0.27/turn. Sonnet is several times
  cheaper and probably enough for the tweaks this feature exists for. Make it
  configurable and try both on a real request.
- **Where does model spend get billed** — Anthropic directly, or through the
  Vercel AI Gateway? Same per-token price, one env var apart: one invoice versus
  one fewer key to create.
- **Hobby's non-commercial terms** — fine for a prototype, a question before the
  team relies on it. Applies to A4's `sandbox` backend as much as to C2.
- Insert defaults: per component, hand-maintained in `componentProps.ts` or
  derived from each component's `defaultProps`?
- Should `wrap` emit a bare `div` with token classes or a `Stack` primitive in
  `@/platform/primitives`? A primitive is cleaner to write and to read back, but
  adding it is its own Tier 2 change.
- Board (D6): edit every screen in place, or select a screen to open it in the
  device frame? The former is Figma; the latter is much simpler.
- Should admins chat on *any* project, or only unlock caps? Full access is
  simplest and matches the studio-owner role in CODEOWNERS.
- Preview inside the chat panel (iframe) vs a new tab: the sandbox's own URL
  makes the iframe straightforward; decide after seeing C2 in a desktop
  browser.
