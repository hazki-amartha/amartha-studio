# /studio-memory — what Chat learned, into the studio memory

> **OWNER-GATED — run this only for the studio owner (Hazki).** It changes
> `design-system/guidelines/STUDIO-MEMORY.md`, which every Chat conversation
> reads. A designer's lesson belongs in their own prototype's `MEMORY.md`.

Chat saves what it learns about a prototype in that prototype's `MEMORY.md`
(CLAUDE.md §3). This routine finds the lessons that hold for **every** prototype
and, with the owner's say-so, adds them to the studio memory.

## 1. Gather

- The studio memory as it stands: `design-system/guidelines/STUDIO-MEMORY.md`.
- Every prototype's memory: `projects/*/MEMORY.md` and `projects/_db/*/MEMORY.md`
  (this laptop's live copies — `npm run dev` keeps them in step).
- Chat's conversations: `node scripts/chat-history.mjs` prints the live studio's
  last 30 days and this laptop's. `--days N`, `--source studio|laptop` and
  `--project <slug>` narrow it; write it to a file in your scratchpad and read
  that when it's long. Other designers' laptop chats aren't reachable — their
  lessons arrive through their prototypes' memories.

## 2. Pick what holds beyond one prototype

Keep a lesson only if it's true for more than one prototype: it appears in two or
more memories, it's a correction Chat needed more than once, it's a piece redrawn
again and again, or the designer stated it as a general rule. One prototype's
decisions stay in its own memory.

Check each against the repo before proposing it: what it names exists, it isn't
already in CLAUDE.md or the cheatsheet, and nothing in the studio memory says
otherwise — if something does, propose the update instead.

## 3. Propose, then write

Show the owner a short list: each line as it would read in the studio memory,
and where it came from (prototype or conversation, and date). Write only what they
keep, under the matching heading, one short line each. Prune lines that went
stale or moved into CLAUDE.md or the cheatsheet. Keep the file under ~80 lines:
every Chat conversation carries it.

## 4. Land it

It's shared work (Tier 2): `/commit`, then `/push` when the owner says so. It's
pending review until it lands; Chat reads the new version once it's live.

## Never

- Copy a conversation in whole, or anything personal, secret or outside the studio.
- Tidy another designer's prototype memory yourself — say which of its lines the
  studio memory now covers, and leave the edit to them or their Chat.
