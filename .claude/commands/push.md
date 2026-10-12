# /push — make the current work live

Take the designer's work all the way to a shareable, deploying state, and report
it in plain language. Here "push" means the **whole path to live** — not just a
raw `git push`, but push → PR → auto-merge → deploy. All of that machinery is
yours; the designer only ever hears "pushed", "live", "preview link", and — for
shared changes — "pending review". See `CLAUDE.md` §7 for the two-verb model
this belongs to (never say "PR" to a designer).

Triggers: `/push`, "push it", "ship it", "make it live", "deploy it".

## First: where is the work?

Database projects (`projects/_db/<slug>/`, `CLAUDE.md` §3b) never go through
git — skip everything below for them:

- **A database project** → it's already live: every save reached the link
  within seconds. Run `npm run check:project -- <slug>` and fix what it reports
  (a change that fails it is still only on this laptop), then tell them it's
  live and give the preview link, `http://localhost:4000/p/<slug>`. No commit,
  no push.
- **A draft** (its folder has a `draft.json`; `.studio-open.json` names it when
  it's what they have open) → "push it" means merge the draft into its project.
  Run `npm run check:project -- <draft-slug>` first, then:
  ```bash
  curl -s -X POST localhost:4000/api/db-projects/<draft-slug>/draft \
    -H 'content-type: application/json' -d '{"action":"push"}'
  ```
  On `ok: true` it's live on the project and the draft is gone — give the
  project's preview link. On a conflict, resolve the marked files in the draft
  (keep both designers' intent) and push again. They can also press **Push to
  <project>** at the foot of the draft's Edit panel — same thing.
- **Both git and database work pending** → do each its own way, and say so in
  one line.

Everything below is for git projects and shared files.

## What to do

1. **Verify first (`CLAUDE.md` §6).** Run `npm run lint`, `npm run build`, and
   `npm run check:flows`. If any fails, fix it — **never push broken work.** If
   you can't fix it, stop and explain the problem in plain language.

2. **Commit anything pending** exactly as `/commit` does: right tier, right branch
   (create one off `main` if the designer is on `main`), one tier per commit.

3. **Push** the branch to the remote.

4. **Open the PR and let it merge itself:**
   ```bash
   gh pr create --fill
   gh pr merge --auto --squash
   ```

5. **Tell them what will happen, in their terms:**
   - **Project-only** (only `projects/<slug>/`, maybe one registry line) →
     *"Pushed — it'll be live in a minute or two, here's the preview link."* It
     goes live on its own; nobody has to review it. Don't mention review, and
     don't say "PR".
   - **Touches shared files** (anything owner-gated in `.github/CODEOWNERS`) →
     *"Pushed — this changes shared studio files, so it's **pending review**
     before it goes live. The preview link works right now."* Never name the
     reviewer (`CLAUDE.md` §7).
   - **Either way, give them the preview link** (see below). It works even while
     review is pending, so "pending review" never means "can't show anyone."

6. **Leave them clean.** Once it has merged (or auto-merge is set on a project-only
   PR), return their checkout to a synced `main`:
   ```bash
   git checkout main && git pull
   ```
   so they're never stranded on a branch. If it's still waiting on review, say so
   and leave the branch in place — don't force the merge.

**Never** force-push, **never** switch to an admin account to get around a block,
and **never** touch another designer's `projects/<slug>/`. A block is the gate
working (`CLAUDE.md` §5) — report it plainly, don't route around it.

## Getting the preview link

Always a localhost link — never a `*.vercel.app` URL, which designers can't open
(`CLAUDE.md` §7):

```bash
npm run dev -- --warm /p/<slug>
```

Hand over the `Preview:` line it prints, and only once it appears.
