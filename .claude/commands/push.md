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
- **A branch** (its folder has a `draft.json` — the code still says draft;
  `.studio-open.json` names it when it's what they have open) → "push it" means
  merge the branch into its project. Run `npm run check:project -- <branch-slug>`
  first, then:
  ```bash
  curl -s -X POST localhost:4000/api/db-projects/<branch-slug>/draft \
    -H 'content-type: application/json' -d '{"action":"push"}'
  ```
  Lines changed on only one side merge on their own. On `ok: true` it's live on
  the project, and the branch and its laptop folder are gone — give the
  project's preview link. A push that conflicts lands nothing: the branch
  catches up with the project instead and the clashing files get `<<<<<<< yours`
  / `>>>>>>> theirs` markers — resolve them in the branch (keep both designers'
  intent) and push again. They can also press **Push** at the foot of the
  branch's Edit panel — same thing.
- **Both git and database work pending** → do each its own way, and say so in
  one line.

Everything below is for git projects and shared files.

## What to do

1. **Verify first (`CLAUDE.md` §6).** Run `npm run lint`, `npm run build`, and
   `npm run check:flows`. If any fails, fix it — **never push broken work.** CI
   runs the same checks, but a red one never lands, so don't leave your own
   verification to it. If you can't fix it, stop and explain the problem in
   plain language.

2. **Commit anything pending** exactly as `/commit` does: right tier, right branch
   (create one off `main` if the designer is on `main`), one tier per commit. The
   checks you just ran count as its verify step.

3. **Push** the branch to the remote. `main` itself is protected — a push to it
   is refused by design, so never try it and then report the refusal as a
   problem.

4. **Open the PR and let it merge itself:**
   ```bash
   gh pr create --fill
   gh pr merge --auto --squash
   ```

5. **Tell them what will happen, in their terms:**
   - **Project-only** (only `projects/<slug>/`, maybe its registry lines) →
     *"Pushed — it'll be live in a minute or two, here's the preview link."* It
     goes live on its own once CI is green; nobody has to review it. Don't
     mention review, don't say "PR", and don't offer commit-vs-push as if it
     were a choice.
   - **Touches shared files** (anything owner-gated in `.github/CODEOWNERS`) →
     *"Pushed — this changes shared studio files, so it's **pending review**
     before it goes live. The preview link works right now."* The wait is
     normal, not a failure — don't poll it; they'll come back to you. Never
     name the reviewer (`CLAUDE.md` §7); if asked who, answer once.
   - **Either way, give them the preview link** (see below). It works even while
     review is pending, so "pending review" never means "can't show anyone."

6. **Leave them clean — once it has landed.** The preview link serves this
   checkout, so stay on the branch until the work is on `main`: a project-only
   change lands a minute or two after auto-merge is set (`gh pr checks --watch`),
   and only then do you return to a synced `main` —
   ```bash
   git checkout main && git pull
   ```
   — and delete the branch, local and remote (`/commit` step 4 says why).
   Deleting the remote branch any earlier closes the change unlanded. If it's
   pending review, say so and leave the branch in place — don't force the merge.

**Never** force-push, **never** switch to an admin account to get around a block,
and **never** touch another designer's `projects/<slug>/`. A block is the gate
working (`CLAUDE.md` §5) — report it plainly, don't route around it.

**Owners can push without you.** Edit mode's panel has its own **Push**, for the
project's own files: from the deployed link it lands on `main` as
`[<slug>] Design changes from the studio (<name>)`; on the dev server it goes
through the studio's GitHub App as `[<slug>] Changes from the studio (<name>)`
and fast-forwards this checkout when it's on `main`. That's the designer's own
work arriving on `main` — pull before you start, as always.

## Getting the preview link

Always `http://localhost:4000/p/<slug>` — never a `*.vercel.app` deployment or
preview URL. Those are auth-gated behind a Vercel account with team access,
which designers here don't have, so they'd see a login wall instead of their
prototype. You still call it the "preview link".

```bash
npm run dev -- --warm /p/<slug>
```

Run it in the background and hand over the `Preview:` line it prints, only once
that line appears — never from memory, or from the "already running" line
before it. Next compiles routes on demand, so a link given the moment the server
spawns can sit blank for tens of seconds; `--warm` holds the link back until
that page has answered.

There is one server, always on port 4000. `npm run dev` is idempotent and
self-healing: it reuses a server only if it answers HTTP *and* was started from
this checkout, and replaces a crashed, hung or foreign one. So run it whenever
you need the link, and never run `next dev` directly: two dev servers on one
folder overwrite each other's `.next` output, so the open page goes stale after
an edit (it looks exactly like broken hot reload), and bare `next dev` drifts to
another port, leaving the designer's tab on a server that's gone.

Never restart the server as a matter of course — hot reload works, and an edit
shows up on refresh. A preview that is genuinely stuck: `npm run dev:restart`
(stops the old process, then starts one; it never leaves two), or
`npm run dev -- --fresh` to clear `.next` first.
