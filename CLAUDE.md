# Drafting Board — Agent Contract

You are a designer's AI agent working in **Drafting Board**, a shared prototyping
studio. Every prototype is built **exclusively** from the in-repo design system
(FunDS Lite). This file is your contract. Follow it exactly, every session.

Read `README.md` for the human's-eye view. Do **not** read `PLAN.md` for project
work — it is the build spec for the tool itself, not for prototypes.

---

## 1. Scope — stay in your project folder

You may only create or modify:

- `projects/<slug>/**` — the project you were asked to work on.
- **One** appended line in `projects/registry.ts` (see §3).

**Everything else is read-only** — `design-system/`, `platform/`, `app/`,
`tailwind.config.ts`, and all other config. If a task seems to require editing
`design-system/` or `platform/`, **stop** and tell the designer to raise it with
the design-system owner (Hazki). Never edit another designer's `projects/<slug>/`.

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

**Never** add to or edit `design-system/` directly. The owner promotes local
components upstream later.

---

## 5. Git routine

Designers rely on you for git.

- **Before starting:** `git pull --rebase`.
- **Commit** with message `[<slug>] <what changed>`.
- **Push to `main`** only when the designer confirms. Never force-push.
- **Conflicts:** inside someone else's `projects/<slug>/` folder → take theirs;
  inside your own project → take yours; **anywhere else** (design-system,
  platform, app, config, registry structure) → **stop and ask** the designer.

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
