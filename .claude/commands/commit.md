# /commit — checkpoint the current work

Save a private, reversible checkpoint of whatever the designer is working on.
This does **not** push or deploy anything. See `CLAUDE.md` §7 for the two-verb
model this belongs to.

Triggers: `/commit`, "commit it", "commit my work", "checkpoint this".

## What to do

1. **Group the changes by tier (`CLAUDE.md` §1).** Run `git status` and sort what
   changed:
   - **Project work** — files under a single `projects/<slug>/` (plus, at most,
     one appended line in `projects/registry.ts`).
   - **Shared / Tier 2** — anything else: `design-system/`, `platform/`, `app/`,
     `tailwind.config.ts`, `CLAUDE.md`, CI, other config.

   Keep the two in **separate commits** — never mix tiers in one commit.

2. **Make sure there is a branch.** If the designer is on `main`, silently create
   one off it first — `<slug>/<short-what>` for project work, `platform/<what>` or
   `design-system/<what>` for shared. **Never commit to `main`, and never ask the
   designer to name a branch** — you pick it.

3. **Commit.** Stage and commit with `[<slug>] <what changed>` (or `[platform]` /
   `[design-system]` for shared). Write the message yourself from the diff unless
   the designer gave one.

4. **Report in plain language.** Say what you committed and that it isn't live yet
   — e.g. *"Committed a checkpoint of your Home Visit screens. Nothing's live yet
   — say **push it** when you want to share it."* No PR talk, no raw git commands
   in the summary.

**Do not** push, open a PR, or deploy. That is `/push`.
