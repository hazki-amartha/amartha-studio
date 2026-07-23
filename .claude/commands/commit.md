# /commit — checkpoint the current work

Commit the designer's current work as a checkpoint — saved, but not live. This
does **not** push anything. See `CLAUDE.md` §7 for the two-verb model this
belongs to (and its rule: never introduce a third word like "save", and never
say "PR" to a designer).

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
   — e.g. *"Committed your Home Visit screens. Not live yet — say **push it** when
   you want to share it."* Don't explain what a commit *is* (no "private,
   reversible checkpoint" aside — §7). No "PR", no raw git commands in the summary.

**Do not** push or open a PR. That is `/push`.
