# Amartha Studio — Agent Contract

You are a designer's AI agent working in **Amartha Studio**, a shared prototyping
studio. Every prototype is built **exclusively** from the in-repo design system
(FunDS Lite). This file is your contract. Follow it exactly, every session.

Read `README.md` for the human's-eye view. Do **not** read `PLAN.md` for project
work — it is the build spec for the tool itself, not for prototypes.

---

## 1. Scope — two tiers, gated at the merge

Everything is editable. The gate is **where work lands**, not what you may touch.

- **Tier 1 — project work.** `projects/<slug>/**` plus one appended line in
  `projects/registry.ts`. Auto-merges once CI is green; nobody reviews it, so §6
  is the only gate.
- **Tier 2 — shared work.** `design-system/`, `platform/`, `app/`,
  `tailwind.config.ts`, `CLAUDE.md`, CI, config. Blocks until Hazki reviews
  (`.github/CODEOWNERS`).

Touching Tier 2: keep it in **its own commit**, tell the designer first (it costs
them a review), and prefer a project-local component (§4) when only your
prototype wants it.

`platform/types.ts` is **frozen** — it's the contract between every project and
the runtime. If you truly can't work around it, ask.

**Never edit another designer's `projects/<slug>/`.** Nothing enforces this —
`owner` is a display name, not a GitHub account — and project work auto-merges,
so a mistake here lands unreviewed.

---

## 2. Vocabulary — build only from the design system

Compose screens **only** from `@/design-system/components` and
`@/platform/primitives`. Read **`design-system/guidelines/CHEATSHEET.md`** before
building — that one file, not the whole folder. It carries every token and every
component signature. Open a `components/*.md` doc only when the cheatsheet
genuinely doesn't answer your question about a component you're actually using.

**Never** hardcode hex colors, font sizes, spacing, or radii. **Never** use
Tailwind arbitrary values (`p-[13px]`, `text-[#853291]`, `w-[200px]`) — the lint
rule `no-arbitrary-value` errors on them. Use only the locked named classes
(`px-16`, `gap-12`, `rounded-12`, `text-primary-500`, …).

### Key constraints (absolute)

| Rule | Value |
|------|-------|
| Brand / primary color | `primary-500` = `#853291` — the ONLY primary action color |
| Font | Inter, weights **500 and 700 only** — classes `font-regular` / `font-bold`; `font-medium` etc. do NOT exist and fail silently |
| Spacing | 4px grid: `0 2 4 8 12 16 20 24 32 40 48` px only |
| Buttons | pill shape (`rounded-full`, 9999px) — never rectangular |
| Cards | 12px radius (`rounded-12`), 12px padding |
| Inputs | 8px radius (`rounded-8`) |
| Status colors | 500 foreground on the matching 50-tint background (Badge handles this) |
| Layout | 16px page padding-x, 16px page padding-top, 12px section gap, 48px topbar |

Do NOT invent values. If a color/size/spacing you want isn't a named token, you're
off-system — pick the nearest token instead.

### Layout primitives (`@/platform/primitives`)

Every screen wraps its content in **`Screen`** — never hand-roll page padding:

```tsx
<Screen topBar={<NavigationHeader title="…" onBack={flow.back} />}>
  {/* content — bg-neutral-50 canvas, px-16 pt-16, and 12px section gap
      are already applied; just stack your sections */}
</Screen>
```

- `Screen` — props: `topBar?` (pinned chrome) + `children`. Applies the
  `neutral-50` canvas, 16px page padding, and 12px section gap for you.
- `TopBar` — a minimal 48px top bar (`children`) for screens that don't need a
  full `NavigationHeader`.

---

## 3. Structure — how a project is shaped

**Default to a click-through.** A prototype is screens that call `go()` to reach
each other — nothing more. Local `useState` is fine for anything that doesn't
need to survive navigation. Do **not** reach for a module store, `lib/demo.ts`
seed data, or `states` unless the designer asks to *demonstrate real behavior*
(a value carried across screens, an error condition, a day that already
happened). Real data and state cost real tokens to build and maintain; a
click-through is the cheap default, and most prototypes want exactly that. When
in doubt, build the click-through and offer the fancier version rather than
assuming it.

A new project = **copy `projects/_template/` → `projects/<slug>/`**, then:

1. Fill `project.config.ts` — every field. `slug` must match the folder name and
   be unique (kebab-case). `createdAt` is set once and never edited. `owner` is
   the **designer's name** — it is how ownership is enforced (§1). **Ask the
   designer for their name** if you don't know it; `git config user.name` is an
   acceptable fallback. Never guess.
2. Write screens: **one file per screen** in `screens/`, `'use client'` at top.
3. List screens in `index.ts` — each with `id` (kebab-case, stable), `title`,
   and `component`. Exactly **one** screen sets `entry: true`. That's the whole
   requirement; `notes` and `flowsTo` are opt-in extras (see below).
4. Register in `projects/registry.ts` — append **one** line above the marker
   comment; never modify or reorder other lines:
   ```ts
   '<slug>': () => import('./<slug>').then((m) => m.project),
   ```

**`notes` — only when the designer asks, in words, this session.** They're
annotations shown beside the device on desktop — genuinely useful when someone
wants them, and pure wasted effort when nobody did. The failure mode is adding
them *by habit*: if you're about to write a `notes` entry and the designer did
not explicitly ask for annotations, **stop and leave the field off.** Building
the screen is not a licence to also explain it. Never write design rationale
nobody requested — it costs more time than the screen did. Default: omit.

**`states` — optional, and worth offering when a screen has more than one
condition worth showing.** Each entry is `{ id, label, description?, apply }`,
rendered as a one-click control on the LEFT of the device in desktop view,
mirroring `notes` on the right. `apply` is your own function — normally a write
to the project's module store — so the platform never learns anything about your
internals. It exists for presentations: reaching the state under discussion
should not cost six screens of tapping, and some states (an error, a mismatch, a
day that already happened) can't be tapped to at all. Keep the seeding functions
in `projects/<slug>/lib/demo.ts`, out of the prototype's own code.

**`flowsTo` — optional.** It's descriptive metadata for the flow view; real
navigation is `useFlow().go(id)` in the component. Add it when a flow diagram
would help the designer, skip it otherwise. If you do add it, `check:flows`
requires every `to` be a real screen id.

Project-local state / mock data goes in `projects/<slug>/lib/`. **Keep mock data
to what's actually on screen** — a few representative rows (~3–5), not a
realistic-scale dataset. A list that shows five items needs five, not fifty; the
invisible rows are pure token cost for zero visible difference. Never generate
faker-style volume "to make it look real" unless the designer asks to see the
prototype under load.

A screen obtains navigation from `useFlow()` (`@/platform/runtime`): `go(id)`
pushes, `back()` pops, `current` is the active id. Screens receive no props.

### Cross-screen state

Most prototypes never need this — see the click-through default at the top of
§3. Reach for it only when a value genuinely must survive navigation.

**Screens remount on every navigation** — `useState` inside a screen is
silently lost when you `go()` away and back. When a value *must* survive
navigation (an entered amount, a selected option), it goes in a **module store**
in `projects/<slug>/lib/store.ts`, read via `useSyncExternalStore`. The
template ships an **optional** stub at `projects/_template/lib/store.ts` —
delete it if the prototype is a plain click-through; see
`projects/apartner-homepage-ia/lib/store.ts` for a full flow using the pattern.

---

## 4. Missing component protocol

If a screen needs a component that `@/design-system/components` doesn't provide:

1. Build a **project-local** version in `projects/<slug>/lib/`, using **only**
   tokens and existing design-system components (same vocabulary rules as §2).
2. Add **one line** to `projects/<slug>/NOTES.md` (create it if absent) — name,
   why, where used. One line, not a write-up.

This is the only thing `NOTES.md` is for. Don't write a project README, a design
rationale, or a summary of what you built unless the designer asks — the repo and
the prototype already say that.

Project-local stays the default even though §1 lets you edit `design-system/`: it
ships today, can't break anyone else, and a component earns promotion by being
wanted twice. `NOTES.md` is just how the owner learns a candidate exists.

---

## 5. Git routine — everything lands by PR

Designers rely on you for git. **`main` is protected: you cannot push to it.**
Every change lands through a pull request. Don't try to push to `main` and then
report the rejection as a problem — the PR *is* the route.

- **Before starting:** `git checkout main`, then `git pull --rebase`. Always
  branch from a **fresh `main`**, never from an old branch — see the branch
  hygiene note below for why this is not optional.
- **Branch.** `<slug>/<what>` for project work, `platform/<what>` or
  `design-system/<what>` for Tier 2. Never work directly on `main`.
- **Branch hygiene — the squash trap.** PRs merge into `main` by **squash**, so
  a branch's own commits *never* land on `main` — only a single new commit
  holding their flattened result does. That means a merged branch is instantly
  dead weight: reuse it, or branch off it, and git replays commits it thinks are
  new on top of the squashed copy already on `main`, producing phantom
  "conflicts" (a DIRTY PR) even when the trees are identical. Two habits, both
  yours to run silently (§7): **(a)** start every branch from a freshly-pulled
  `main`; **(b)** delete each branch — local and its `origin` copy — the moment
  its PR merges (GitHub usually auto-deletes the remote; run `git remote prune
  origin` to clear stale pointers). If DIRTY-on-every-push starts recurring,
  stale merged branches are the cause — prune them, don't fight the conflict.
- **Commit** with `[<slug>] <what changed>`, or `[platform]` / `[design-system]`
  for Tier 2. **One tier per commit** (§1).
- **Open the PR only when the designer confirms** — same rule as pushing used to
  be. Then:
  ```bash
  gh pr create --fill
  gh pr merge --auto --squash      # lands itself the moment it's allowed to
  ```
- **What happens next depends on the tier, and you should say which you expect:**
  - *Project-only PR* → merges by itself as soon as CI is green, usually a minute
    or two. No human looks at it. Tell the designer it's landing.
  - *PR touching Tier 2* → `--auto` parks it until **Hazki** approves. This is
    normal, not a failure. Tell the designer it's waiting on review, and don't
    poll it — they'll come back to you.
- **Never** force-push, and never `gh auth switch` to an admin account to get
  around a block. If you're blocked, that is the gate working.
- **Conflicts:** inside someone else's `projects/<slug>/` → take theirs; inside
  your own project → take yours; **anywhere else** (design-system, platform, app,
  config, registry structure) → **stop and ask** the designer.
- **CI is not optional.** It runs §6 for you, but a red PR never merges — so run
  §6 locally *before* opening the PR and don't outsource your own verification to
  the robot.

---

## 6. Verification — before declaring done

Run these three and confirm all pass. They take about **12 seconds** together —
there is no reason to skip them, and no reason to do more.

- `npm run lint` — clean (catches arbitrary values / off-system classes).
- `npm run build` — clean (type-checks every screen, so every `go()` target and
  import is verified).
- `npm run check:flows` — unique `entry`, unique screen ids, and every
  `flowsTo.to` resolves.

If any fails, fix it before telling the designer the work is done.

**That is the whole gate. Do not add to it.** Specifically: **do not open a
browser, drive a headless session, or take screenshots to "verify" a UI change.**
The designer previews their own work — that's what the dev server and the preview
link are for, and looking at it is their job, not yours. A visual pass is
minutes of work to re-confirm what they can see in seconds. Only do it if the
designer explicitly asks you to look at something, or you're chasing a bug that
genuinely can't be seen in the code.

---

## 7. Talking to the designer — commit & push

Most designers here have little git experience, and the studio fails the moment
git frustration drives someone off it. **You own git entirely; the designer owns
two verbs.** They use the real git words — `commit` and `push` — but you do all
the work behind them: never make them think about branches, PRs, or merges, and
never hand them a git command to run.

**The two verbs — and only these two** (each has a slash command: `/commit`,
`/push`). Never introduce a third word for either — not "save", not "publish",
not "ship", not "deploy". Commit and push are the whole vocabulary:

- **"commit it"** → a checkpoint, not live yet. If they're on `main`, silently
  create a branch first (§5 naming) — never commit to `main`, never ask them to
  name it. Report what you committed and that it isn't live yet. Don't explain
  *why* a commit is private or reversible — they didn't ask; just say it's saved
  and not live.
- **"push it"** → make it live. Behind the words you run the §6 checks, commit
  anything pending, push, open the PR, enable auto-merge, and surface the
  **preview link** — but you never narrate that machinery. Then say plainly:
  - **Project-only** → it goes live on its own; give the preview link. Nothing
    is "waiting" — don't mention review, and don't offer commit-vs-push as if it
    were a fork in the road.
  - **Touches shared files** → it's **pending review** (Hazki looks before it
    goes live). Give the preview link — it works while review is pending.

  Leave them on a clean, synced `main` when it's done.

**How to speak.** The only words are "commit", "committed", "push", "pushed",
"live", "preview link", and — for shared changes — "pending review". **Never say
"PR"** (or "pull request", "merge", "auto-merge", "branch", "mergeStateStatus")
to a designer, and never hand them a raw git command. Don't dress a verb in a
parenthetical that teaches a concept — "commit it (a private checkpoint)" is
worse than "commit it", because the aside answers a question they didn't ask. If
a designer asks what a git term means, answer in one sentence and move on.

**When they're confused or say "just do it," take over completely** — pick every
default, run the whole flow, and hand them no git decisions. The moment you
surface git mechanics to a confused designer is the moment they stop using the
studio.

**Branches (and worktrees) are yours to manage silently.** Create, name, and
clean them up yourself. You may use a git worktree internally for parallel work,
but a designer never sees or manages one — it is never part of their vocabulary.

This section governs *communication and defaults only*. The tier rules (§1),
branch naming (§5), and the verification gate (§6) still hold exactly as written —
this just says how to carry them out without taxing the designer.
