# Amartha Studio

An internal prototyping studio for the design team. One shared git repository that
every designer connects their AI agent (Claude Code) to, in order to build and
iterate on high-fidelity, interactive prototypes — built **exclusively** from the
team's design system (FunDS Lite).

- **Gallery** (`/`) — every project, its owner, status, and a preview.
- **Prototype** (`/p/<slug>`) — the interactive prototype (full-page on mobile,
  device frame with annotation notes on desktop).
- **Flow** (`/p/<slug>/flow`) — every screen on one pannable canvas, wired by
  flow metadata.
- **System** (`/system`) — the browsable design-system reference.

Git replaces Slack as the transport: handoff is `git pull`. Sharing is a stable
deployed URL per project — no more screenshots.

## One-time setup

You need [Node.js](https://nodejs.org/) 18+, git, and the
[GitHub CLI](https://cli.github.com/) (`gh`).

```bash
git clone <this-repo-url>
cd amartha-studio
npm install
gh auth login        # once — this is what lets "push it" work
npm run dev          # open http://localhost:3000
```

Then point your AI agent (Claude Code) at this repo. The agent reads `CLAUDE.md`
automatically — that contract is what keeps every prototype on-system, and it
does all the git for you (see **Working with your agent** below). The one-time
`gh auth login` is the only git-ish thing you ever run yourself; after that,
"commit it" and "push it" are the whole workflow.

## Working with your agent

You don't edit code and **you don't need to know git** — you talk to your agent,
and it follows `CLAUDE.md`. Two words cover the whole workflow:

- **"Commit it"** — checkpoints your work so far. Private, safe, undoable. Say it
  as often as you like.
- **"Push it"** — makes your prototype live and hands you a link to share.

Everything else is a plain sentence:

- **Start:** *"Start a new project called `<name>` — I'm the owner. Copy the
  template and scaffold the first screen."*
- **Continue:** *"Keep working on `<slug>`: <what you want next>."*
- **Share a draft before it's finished:** *"Push it."* Every version gets a live
  preview link, so you can show work in progress without it being done.

Behind the scenes your agent does all the git for you. It works on a private copy
called a *branch* (like a Figma branch, so your drafts never touch anyone else's
work), and it runs `npm run lint`, `npm run build`, and `npm run check:flows`
before publishing. If you ever see a word like "branch," "commit," or "PR," you
can ignore it or just ask *"what does that mean here?"* — you never have to manage
any of it, and you **can't** break the live studio.

### How work lands

`main` is protected — everything goes through a pull request, and your agent opens
it for you. What happens then depends on what you touched:

| You changed | What happens |
|---|---|
| Only your own `projects/<slug>/` | Merges by itself once CI is green. No review, usually a minute or two. |
| `design-system/`, `platform/`, or config | Waits for Hazki to review. Normal, not a failure. |

Either way, **you get a preview link as soon as the build finishes** — even for a
change that's waiting on Hazki. So "waiting on review" never means "can't show
anyone"; you can share the live preview the whole time it waits.

Agents are allowed to *edit* the design system and platform — they just can't
*land* those edits alone. That's the whole gate: good ideas don't get blocked at
the keyboard, they get judged at the merge. See `.github/CODEOWNERS` for exactly
which paths need a review.

## How it's organized

| Path | What it is |
|------|-----------|
| `projects/<slug>/` | Your project — the only place your agent writes |
| `projects/_template/` | Copy this to start a new project |
| `projects/registry.ts` | Append-only list of all projects |
| `design-system/` | Components, tokens, guidelines (owner-gated — read-only to agents) |
| `platform/` | Runtime, device frame, flow canvas (owner-gated) |
| `CLAUDE.md` | The agent contract — the most important file |

Design-system changes are owner-gated **at the merge**: an agent may edit
`design-system/`, but the PR blocks until Hazki reviews it. The cheaper path is
still a project-local component plus a `NOTES.md` promotion proposal — the owner
promotes it upstream later, and uses `/ingest` to bring new components in from
Figma.

## Scripts

| Command | Does |
|---------|------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build (type-checks all screens) |
| `npm run lint` | ESLint incl. token-lock (no arbitrary Tailwind values) |
| `npm run check:flows` | Validates screen ids, single entry, and `flowsTo` targets |

<!-- WS-F: append the Deployment / Environment section below this line. -->
