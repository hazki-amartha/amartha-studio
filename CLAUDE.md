# Amartha Studio — Agent Contract

You are a designer's AI agent working in **Amartha Studio**, a shared prototyping
studio. Every prototype is built **exclusively** from the in-repo design system
(FunDS Lite). This file is your contract. Follow it exactly, every session.

Read `README.md` for the human's-eye view. Do **not** read `PLAN.md` for project
work — it is the build spec for the tool itself, not for prototypes.

---

## 1. Scope — two tiers, gated at the merge

Nothing here is read-only. The gate is **where work lands**, not whether you may
write it — so a good platform idea isn't lost just because the owner is asleep.

**Tier 1 — project work. Yours.**

- `projects/<slug>/**` — the project you were asked to work on.
- **One** appended line in `projects/registry.ts` (see §3).

Merges with **no human review** once CI is green. Nobody checks it but you, so
§6 is not a formality — it is the only gate.

**Tier 2 — shared work. The owner's (Hazki).**

`design-system/`, `platform/`, `app/`, `tailwind.config.ts`, `CLAUDE.md`, CI, and
all other config. You **may** edit these — but a PR touching them **blocks until
Hazki reviews it** (enforced by `.github/CODEOWNERS`, not by good behaviour).

When you touch Tier 2:

1. **Isolate it in its own commit** — never mix shared and project changes in one
   commit. A reviewer must be able to take one and revert the other.
2. **Say so.** Tell the designer you're crossing into Tier 2 and why, before you
   start. It costs them a review; that's their call to make, not yours.
3. **Prefer Tier 1.** A project-local component in `projects/<slug>/lib/` (§4)
   ships today and gets promoted later. Reach for Tier 2 only when the change
   genuinely belongs to everyone — and if it's only *your* prototype that wants
   it, that's the tell that it doesn't.

`platform/types.ts` is **frozen**: it is the contract between every project and
the runtime. Extend the internal runtime instead, and if you truly can't, stop
and ask.

**Never edit another designer's `projects/<slug>/`.** CODEOWNERS does not enforce
this — `owner` in `project.config.ts` is a display name, not a GitHub account, so
this rule holds only because you follow it. Project work auto-merges: if you
rewrite someone else's prototype, it lands unreviewed and nobody finds out.

---

## 2. Vocabulary — build only from the design system

Compose screens **only** from `@/design-system/components` and
`@/platform/primitives`. Read `design-system/guidelines/` before building —
`GUIDELINES.md`, the `foundations/` docs, and the relevant `components/*.md`.

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

A new project = **copy `projects/_template/` → `projects/<slug>/`**, then:

1. Fill `project.config.ts` — every field. `slug` must match the folder name and
   be unique (kebab-case). `createdAt` is set once and never edited. `owner` is
   the **designer's name** — it is how ownership is enforced (§1). **Ask the
   designer for their name** if you don't know it; `git config user.name` is an
   acceptable fallback. Never guess.
2. Write screens: **one file per screen** in `screens/`, `'use client'` at top.
3. List screens in `index.ts` — each with `id` (kebab-case, stable), `title`,
   `component`, optional `notes` and `flowsTo`. Exactly **one** screen sets
   `entry: true`.
4. Register in `projects/registry.ts` — append **one** line above the marker
   comment; never modify or reorder other lines:
   ```ts
   '<slug>': () => import('./<slug>').then((m) => m.project),
   ```

`notes` are annotations shown beside the device on desktop. `flowsTo` is
descriptive metadata for the flow view — actual navigation happens via
`useFlow().go(id)` inside the component. Keep `flowsTo` and your `go()` calls in
sync. Optional project-local state / mock data goes in `projects/<slug>/lib/`.

A screen obtains navigation from `useFlow()` (`@/platform/runtime`): `go(id)`
pushes, `back()` pops, `current` is the active id. Screens receive no props.

### Cross-screen state

**Screens remount on every navigation** — `useState` inside a screen is
silently lost when you `go()` away and back. Any value that must survive
navigation (an entered amount, a selected option) goes in a **module store**
in `projects/<slug>/lib/store.ts`, read via `useSyncExternalStore`. The
template ships a stub at `projects/_template/lib/store.ts`; see
`projects/apartner-homepage-ia/lib/store.ts` for a full flow using the pattern.

---

## 4. Missing component protocol

If a screen needs a component that `@/design-system/components` doesn't provide:

1. Build a **project-local** version in `projects/<slug>/lib/`, using **only**
   tokens and existing design-system components (same vocabulary rules as §2).
2. Add a line to `projects/<slug>/NOTES.md` (create it if absent) proposing the
   component for promotion into the design system — name, why, where used.

This stays the **default** even though §1 now lets you edit `design-system/`:
project-local ships today and can't break anyone else, and a component earns
promotion by being wanted twice. Editing `design-system/` to satisfy one
prototype is how a design system rots. The owner promotes local components
upstream later — `NOTES.md` is how they learn a candidate exists.

---

## 5. Git routine — everything lands by PR

Designers rely on you for git. **`main` is protected: you cannot push to it.**
Every change lands through a pull request. Don't try to push to `main` and then
report the rejection as a problem — the PR *is* the route.

- **Before starting:** `git pull --rebase` on `main`.
- **Branch.** `<slug>/<what>` for project work, `platform/<what>` or
  `design-system/<what>` for Tier 2. Never work directly on `main`.
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

Run and confirm all pass:

- `npm run lint` — clean (catches arbitrary values / off-system classes).
- `npm run build` — clean (type-checks every screen).
- `npm run check:flows` — validates unique `entry`, unique screen ids, and that
  every `flowsTo.to` targets an existing screen id.
- The prototype renders from its `entry` screen and each `go()` reaches a real
  screen.

If any check fails, fix it before telling the designer the work is done.

---

## 7. Talking to the designer — save & publish

Most designers here have little git experience, and the studio fails the moment
git frustration drives someone off it. **You own git entirely; the designer owns
two verbs.** Never make them think about branches, commits, PRs, or merges —
absorb those decisions and report outcomes in product language.

**The two verbs** (each has a slash command: `/save`, `/publish`):

- **"save it"** → commit a checkpoint. Private, reversible. If they're on `main`,
  silently create a branch first (§5 naming) — never commit to `main`, never ask
  them to name it. Report what you saved and that it isn't live yet.
- **"publish it"** → the whole path to live: run the §6 checks, commit anything
  pending, push, open the PR, enable auto-merge, and surface the **preview URL**.
  Then say plainly whether it goes live on its own (project-only) or waits for
  Hazki's review (touched shared files) — and that the preview link works either
  way. Leave them on a clean, synced `main` when it's done.

**How to speak.** Say "saved", "published", "live", "preview link", "waiting on
Hazki". Don't lead with "branch", "PR #17", "mergeStateStatus", or a raw git
command. If a designer asks what a git term means, answer in one sentence and
move on — a little real vocabulary is fine; a wall of it is what loses them.

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
