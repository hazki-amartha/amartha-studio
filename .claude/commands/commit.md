# /commit — checkpoint the current work

Commit the designer's current work as a checkpoint — saved, but not live. This
does **not** push anything. See `CLAUDE.md` §7 for the two-verb model this
belongs to (and its rule: never introduce a third word like "save", and never
say "PR" to a designer).

Triggers: `/commit`, "commit it", "commit my work", "checkpoint this".

## What to do

0. **Database projects and their branches have nothing to commit** (`CLAUDE.md`
   §3b). Their files live in `projects/_db/`, which git ignores, and every save is
   already kept — on the project's link, or a branch's. If that's the only work,
   run `npm run check:project -- <slug>`, fix what it reports, and tell them it's
   saved (live on the project, or on the branch until they say **push it**).
   Don't create a git branch or a commit for it. Commit only the git work below.

1. **Check where the changes landed.** Run `git status`. Edit mode's **Save** and
   the studio's Chat write the working copy too; that is the designer's own work
   and rides along without comment — don't quiz them about it. But a change
   inside **another designer's** `projects/<slug>/`, or inside a `status: 'live'`
   project (production documentation), is almost always a stray test: surface it
   and ask instead of committing it.

2. **Group the changes by tier (`CLAUDE.md` §1)**:
   - **Project work** — files under a single `projects/<slug>/`, plus at most its
     appended lines in `projects/registry.ts` and `projects/configs.ts`.
   - **Shared / Tier 2** — anything else: `design-system/`, `platform/`, `app/`,
     `tailwind.config.ts`, `CLAUDE.md`, CI, other config.

   Keep the two in **separate commits** — never mix tiers in one commit.

3. **Verify (`CLAUDE.md` §6):** `npm run lint`, `npm run build`,
   `npm run check:flows`. Nothing broken is ever checkpointed — fix a red one
   first.

4. **Make sure there is a branch.** If the designer is on `main`, silently create
   one off it first — `<slug>/<short-what>` for project work, `platform/<what>` or
   `design-system/<what>` for shared. **Never commit to `main`, and never ask the
   designer to name a branch** — you pick it.

   Never reuse a branch whose work has already landed, or branch off one. Work
   lands on `main` squashed into a single new commit, so an old branch's own
   commits replay as phantom conflicts on top of it. Delete a branch, local and
   remote, once its work has landed — `gh pr list --head <branch> --state merged`
   tells you it has; `git remote prune origin` clears stale pointers. Conflicts
   on every push mean stale branches — prune them, don't fight the conflict.

5. **Commit.** Stage and commit with `[<slug>] <what changed>` (or `[platform]` /
   `[design-system]` for shared). Write the message yourself from the diff unless
   the designer gave one.

6. **Report in plain language.** Say what you committed and that it isn't live yet
   — e.g. *"Committed your Home Visit screens. Not live yet — say **push it** when
   you want to share it."* Don't explain what a commit *is* (no "private,
   reversible checkpoint" aside — §7). No "PR", no raw git commands in the summary.

**Do not** push or open a PR. That is `/push`.
