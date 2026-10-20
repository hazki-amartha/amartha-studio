# Amartha Studio — Agent Contract

You are a designer's AI agent in **Amartha Studio**, a shared prototyping studio.
Every prototype is built **only** from the in-repo design system, FunDS Lite.
This file is your contract: follow it exactly, every session. The `*PLAN.md`
files at the root are build specs for the studio itself — don't read them for
project work.

When the designer says **commit** or **push** — in those words or as `/commit`,
`/push` — follow that command (`.claude/commands/commit.md`, `push.md`). Each
holds the whole routine behind its verb (§5) and how to report it (§7); read it
before running any git command.

---

## 1. Scope — two tiers, gated at the merge

Everything is editable; the gate is **where work lands**.

- **Tier 1 — project work:** `projects/<slug>/**`, plus one appended line each
  in `projects/registry.ts` and `projects/configs.ts`. Lands without review once
  CI is green, so §6 is its only gate.
- **Tier 2 — shared work:** `design-system/`, `platform/`, `app/`,
  `tailwind.config.ts`, `CLAUDE.md`, CI, config. Waits for the studio owner's
  review (`.github/CODEOWNERS` — never name them unprompted, §7). Keep it in
  its own commit, tell the designer first, since it costs them a review, and
  prefer a project-local component (§4) when only your prototype wants it.

`platform/types.ts` is **frozen** — the contract between every project and the
runtime. If you truly can't work around it, ask.

**Never edit another designer's `projects/<slug>/`.** Nothing enforces it —
`owner` is a display name — and project work lands unreviewed. Database projects
(§3b) are the exception: they don't live in git, and any studio editor may edit
any of them.

---

## 2. Vocabulary — build only from the design system

Compose screens **only** from `@/design-system/components` and
`@/platform/primitives`, and read **`design-system/guidelines/CHEATSHEET.md`**
before building — that one file holds every token, component signature, icon
and layout rule. Open a `guidelines/components/*.md` doc only when the cheatsheet
doesn't answer a question about a component you are using. Beside it,
`STUDIO-MEMORY.md` holds lessons from earlier prototypes; only the studio owner
changes it (`/studio-memory`).

**Never** hardcode colours, font sizes, spacing or radii, and never use Tailwind
arbitrary values (`p-[13px]`). If what you want isn't a token, you're off-system:
pick the nearest one. A screen's content goes inside `Screen` (`AppShell` on
desktop) — never hand-roll page padding.

**The live references document the shipped product** — they are not prototypes:
`amarthafin-live` (the AmarthaFin app), `apartner-sot` (the A-Partner field app)
and `ngmis-live` (the NG-MIS back office). That is what `status: 'live'` means,
and all it means (`'final'` is settled, not shipped). **Before building or
changing anything those apps already have — a homepage above all — open the
reference and match it.** For the AmarthaFin homepage that is the flat white
canvas (`<Screen canvas="white">`), the curved brand band, the Poket wallet
widget, the service shortcuts and the bottom nav. A prototype that redraws the
surrounding chrome hides the very change the designer is judging, however legal
its tokens.

Reuse a reference's whole screens with `extends` (§3). To reuse a piece inside
your own screen, copy it from the reference's `lib/` into yours — never import
across projects. A piece a second prototype also wants (the Poket widget is the
clearest) is a candidate for `design-system/components/`, which is Tier 2.

---

## 3. Structure — how a project is shaped

**Default to a click-through:** screens that `go()` to each other, with local
`useState` for anything that needn't survive navigation. No module store, no
`lib/demo.ts` seed data and no `states` unless the designer asks to *demonstrate
real behaviour* — a value carried across screens, an error, a day that already
happened. Build the click-through and offer the richer version instead of
assuming it.

**Nothing leaves the prototype.** No `wa.me` / `maps.google.com` / `tel:` /
`mailto:` links, no `window.open`, no `fetch`, no embedded map or video: they
throw the viewer out of the device mid-demo and can't be shown on a laptop at
all. Draw the affordance and `go()` to a screen that shows the result — a sent
message, a map placeholder, a call sheet. Wire the real thing only when the
designer asks for it in words, this session — "make it really open WhatsApp",
not just a WhatsApp button.

**A new git project** is a copy of `projects/_template/` at `projects/<slug>/`
(the gallery's New Project button makes a database project instead — §3b):

1. `project.config.ts`, every field. `slug` is the folder name — unique,
   kebab-case. `createdAt` is set once. `owner` is the **designer's name**: ask
   (`git config user.name` as a fallback), never guess.
2. One file per screen in `screens/`, with `'use client'` at the top.
3. `index.ts` lists each screen — `id` (kebab-case, stable), `title`,
   `component` — with exactly **one** `entry: true`. `component` is always
   `lazyScreen(() => import('./screens/home'), 'HomeScreen')` with the import
   written inline: a top-level import loads every screen into every studio page.
4. One line in each of the two maps, above the marker comment, touching no
   other line — `npm run check:flows` catches a missed one:
   ```ts
   // projects/registry.ts — the full module, for client code
   '<slug>': () => import('./<slug>').then((m) => m.project),
   // projects/configs.ts — metadata only, for server code
   '<slug>': () => import('./<slug>/project.config').then((m) => m.config),
   ```

**Opt-in extras, all off by default:**

- `notes` (annotations beside the device) — **only when the designer asks for
  them in words, this session.** Never add them, or any design rationale, by
  habit.
- `states` (one-click setups beside the device: `{ id, label, description?,
  apply }`) — worth offering when a screen has conditions you can't tap to.
  `apply` writes the module store; seeding lives in `lib/demo.ts`.
- `flowsTo` (flow-view metadata) — every `to` must be a real screen id.

**Mock data** — plain constants in `lib/` — covers what's on screen: ~3–5 rows,
never faker-scale volume unless the designer asks to see the prototype under load.

**Memory** — a project's `MEMORY.md` is what its designers have settled with
Chat: decisions, copy rules, corrections, one dated line each, shared by everyone
on the project. Read it before changing the project, and add a line when the
designer settles something that should outlast the conversation.

**Navigation** is `useFlow()` from `@/platform/runtime`: `go(id)`, `back()`,
`current`. Screens take no props and **remount on every navigation**, so a
value that must survive a `go()` goes in a module store, `lib/store.ts` read with
`useSyncExternalStore` (the template's stub shows the pattern — delete it in a
click-through).

### Extending a base project

`extends: '<slug>'` in `project.config.ts` merges the base's screens under the
project's own. The same id **replaces** the base screen, every other one is
inherited, and `go(id)` works across both — so a project holds only its feature
and still behaves like the whole app. Prefer a `status: 'live'` base.

- One level only: a base can't extend.
- A reused id is an override — read the list `check:flows` prints.
- A base's screen ids are a contract: renaming one breaks every extender.
- Inheritance is live; to freeze a base screen, override it.
- The project needs exactly one `entry` of its own; the base's is ignored.
- Never edit the base to fix your feature — override the screen, or ask its owner.
- New Project's **Inside AmarthaFin / A-Partner / NG-MIS** starts a project this
  way: the app's start screen, and what it imports, copied in as the project's
  own; everything else inherited. To change another base screen, override it —
  copy that screen and only the files it needs that the project lacks.

---

## 3b. Database projects — shared and live, no git

**How to tell:** `projects/_db/<slug>/` exists. Every project the gallery's New
Project button makes is one, and it has **one shared copy, which is live**: a
save shows on the link, for everyone, within seconds. The folder is this
laptop's copy, kept in step by the live sync `npm run dev` starts. A
`projects/<slug>/` beside it is a stale git copy — never edit or create one.
§2–§4 apply as usual; their `projects/<slug>/` paths are
`projects/_db/<slug>/` here.

**Which copy:** read `.studio-open.json` at the repo root before editing — it
names what the designer has open: `slug`, `folder`, and `draftOf` when that's a
**branch**. A branch open → edit the branch's folder. The note names another
project, or is missing → ask "your branch or the main project?". Never default
to the main project while a branch is open.

**Editing:**

- Each file you save goes live a moment later **if** the project passes the save
  checks; a refused save waits on this laptop. Others save too, so **re-read a
  file before you edit it.**
- A file you both changed is merged for you. Where you both changed the same
  lines, it gets `<<<<<<< yours` / `>>>>>>> theirs` markers and waits until you
  resolve them — keep both designers' intent.
- **Before you say you're done,** run `npm run check:project -- <slug>` and fix
  everything it reports. It type-checks too, which a save doesn't.
- Saving needs the laptop signed in once, at
  `http://localhost:4000/auth/laptop/start`, with the designer's Amartha Google
  account. Never ask for keys or `.env.local`.

**No git.** Never commit, push or open anything for `projects/_db/`: "commit it"
means it's already saved, "push it" means it's already live. A **branch** is the
one exception — `/push` merges it into its project.

**Branches** are the studio's own word, so say it freely — never a git branch. A
designer starts one from the branch button atop the sidebar, beside Share: a
database project at `/p/<slug>-branch-<name>` (older ones say `-draft-`) with a
`draft.json` you never edit, kept off the project's link until it's pushed.

**Done in the studio, not by hand:** undo across saves is the right panel's
**History** (the clock beside its ✕). Deleting is the gallery card's **⋯ →
Delete project** (owner or admin; restorable for 30 days) — never touch
`deleted.json` or delete files to "delete" a project. Moving a git project into
the database is the owner's `npm run db:sync -- <slug>`.

---

## 4. Missing component protocol

**Icons are never missing.** Import them by name from `@/design-system/icons`
(names in the cheatsheet) — never hand-roll an icon or add a project-local
`icons.tsx`. A glyph the set truly lacks is a project-local one-off, below.

**Illustrations are never missing either.** Use `<Illustration>` from
`@/design-system/assets`: the library name the designer gives you, or a
`generic` state until the right one exists (cheatsheet). Never add an image
file, a data URI or a tinted stand-in panel for artwork.

When `@/design-system/components` lacks something a screen needs:

1. Build it **project-local** in `projects/<slug>/lib/`, from tokens and
   design-system components only (§2).
2. Add **one line** to `projects/<slug>/NOTES.md` — name, why, where it's used.

That line is all `NOTES.md` is for: no README, rationale or summary unless the
designer asks. Project-local stays the default even though §1 lets you edit the
design system — it ships today, can't break anyone else, and a component earns
promotion by being wanted twice.

---

## 5. Git routine — everything lands by PR

`main` is protected: every change lands through a pull request, opened only
when the designer says push. The full routine — branch names, one tier per
commit, the squash trap, what to expect per tier — is in `/commit` and `/push`.
What holds everywhere:

- Start git work — before you edit anything — from a freshly pulled `main`
  (`git checkout main && git pull --rebase`), and never commit to `main`.
- Never force-push, and never switch to an admin account to get past a block —
  a block is the gate working.
- Conflicts: in another designer's project take theirs, in your own take yours,
  and two appended registry lines keep both. **Anywhere else, stop and ask** —
  about the change, in plain words ("your version of the header, or the one
  that just landed?"), never as a git question.

---

## 6. Verification — at commit and push, not per tweak

Before any commit or push of git work: `npm run lint`, `npm run build` (locally
it builds into `.next-build`, never the `.next` the dev server runs from) and
`npm run check:flows`, all clean. A database project's gate is `check:project`
(§3b). Fix anything red before you tell the designer the work landed.

**Not between those moments.** While the designer iterates on the preview, hot
reload already shows breakage on the screen under discussion, and a ~40-second
build per one-line tweak is the studio's biggest per-iteration cost. At most run
`npm run lint` after editing classes.

**That is the whole gate.** Don't open a browser, drive a headless session or
take screenshots to "verify" a UI change — the designer previews their own work.
Look only when they ask, or for a bug the code can't show.

---

## 7. Talking to the designer — commit & push

Most designers here have little git experience, and the studio fails the moment
git frustration drives someone off it. **You own git; they own two verbs** —
"commit" (a checkpoint, not live) and "push" (make it live) — and `/commit`,
`/push` carry each out end to end.

- **The only words:** commit, committed, push, pushed, live, preview link, and —
  for shared changes — pending review. Never another word for either verb
  ("save", "publish", "ship", "deploy"). Never "PR", "pull request", "merge",
  "auto-merge" or a git "branch", never a raw git command, never an aside
  explaining a concept. Asked what a git term means: one sentence, then move on.
- **Never name the reviewer** — say "pending review"; if asked who, answer once.
- **Confused, or "just do it"?** Take over completely: pick every default, run
  the whole flow, hand them no git decisions. Branches and worktrees are yours
  to manage silently.
- **Edit mode and Chat write the same files you do.** That's the designer's own
  work, and it rides commit and push (`/commit` checks where it landed). In a
  git project the panel's **Save** writes the working copy only — not a third
  verb, and not live until they push. (In a database project every save is
  live — §3b.)

**The preview link is always `http://localhost:4000/p/<slug>`** — never a
`*.vercel.app` URL, which sits behind a Vercel login designers don't have. Run
`npm run dev -- --warm /p/<slug>` in the background and hand over the `Preview:`
line it prints, once it appears. It's idempotent — it reuses a healthy server
from this checkout and replaces a broken one — so run it whenever you need the
link. Never run `next dev` directly, and never restart by habit; a stuck preview
is `npm run dev:restart`.
