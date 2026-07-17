# /push — make the current work live

Take the designer's work all the way to a shareable, deploying state, and report
it in plain language. Here "push" means the **whole path to live** — not just a
raw `git push`, but push → PR → auto-merge → deploy. See `CLAUDE.md` §7 for the
two-verb model this belongs to.

Triggers: `/push`, "push it", "ship it", "make it live", "deploy it".

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
     *"Pushing — it'll be live in a minute or two."* It auto-merges once CI is
     green; nobody has to review it.
   - **Touches shared files** (anything owner-gated in `.github/CODEOWNERS`) →
     *"This changes shared studio files, so it's waiting on Hazki's review before
     it goes live — that's normal, not a failure."*
   - **Either way, give them the preview link** (see below). It works even while a
     review is pending, so "waiting on Hazki" never means "can't show anyone."

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

The preview is the Vercel deployment attached to the PR, ready as soon as the
build finishes — independent of whether the PR has merged. Pull it from the PR:

```bash
gh pr view --json statusCheckRollup \
  -q '.statusCheckRollup[] | select(.context=="Vercel") | .targetUrl'
```

If it isn't ready yet, tell them it'll appear in a minute or two rather than
making them wait while you poll.
