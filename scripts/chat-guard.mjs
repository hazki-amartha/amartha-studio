#!/usr/bin/env node
// =============================================================================
// Chat · PreToolUse guard. The chat route (app/api/chat/route.ts) hands this to
// the claude CLI as a hook for every tool call, so each one is checked in code
// before it happens, not reported after. Prompt injection can talk the agent
// into anything; it cannot talk this script into anything.
//
//   Writes (Edit, Write, …) — only inside projects/<CHAT_SLUG>/, the project
//     the chat panel is open on.
//   Reads (Read, Glob, Grep) — only inside the repo, and never secrets: .env*,
//     .git, .claude, .vercel, keys. The editing password and the GitHub App key
//     live there, and a read secret is one Write away from a pushed file.
//   Bash — only the exact check commands below, no extra arguments. `lint --fix`
//     or `eslint -o <file>` would write files this guard never sees.
//
// Exit 2 = block (stderr is shown to the agent). Exit 0 = allow.
// =============================================================================

import path from 'node:path'

const slug = process.env.CHAT_SLUG
const root = process.env.CHAT_ROOT ?? process.cwd()

const WRITE_TOOLS = new Set(['Edit', 'MultiEdit', 'Write', 'NotebookEdit'])
const READ_TOOLS = new Set(['Read', 'Glob', 'Grep'])
const COMMANDS = new Set(['npm run lint', 'npm run check:flows', 'npx tsc --noEmit'])

// Path segments / basenames that are never readable from chat.
const SECRET_DIRS = new Set(['.git', '.claude', '.vercel', '.ssh', '.aws'])
const SECRET_FILE = /^\.env|\.(pem|key|p12|pfx)$|^id_(rsa|ed25519)/i

let raw = ''
for await (const chunk of process.stdin) raw += chunk

let event
try {
  event = JSON.parse(raw)
} catch {
  block('The studio could not read this action, so it was stopped.')
}

const tool = event.tool_name
const input = event.tool_input ?? {}
const refuse = (what) =>
  block(`${what} Tell the designer this is not something chat can do; do not try another way.`)

if (tool === 'Bash') {
  const command = String(input.command ?? '').trim()
  if (!COMMANDS.has(command)) {
    refuse(`Chat can only run these commands, exactly: ${[...COMMANDS].join(', ')}.`)
  }
  process.exit(0)
}

if (WRITE_TOOLS.has(tool)) {
  if (!slug) refuse('Chat has no project open, so no files can be changed.')
  const target = resolve(input.file_path ?? input.notebook_path)
  if (!target || !inside(target, path.join(root, 'projects', slug))) {
    refuse(`Chat can only change files inside projects/${slug}/; ${shown(target)} is outside it.`)
  }
  process.exit(0)
}

if (READ_TOOLS.has(tool)) {
  const target = resolve(input.file_path ?? input.path ?? '.')
  if (!inside(target, root)) refuse(`Chat can only read files inside the studio; ${shown(target)} is outside it.`)
  if (isSecret(target) || isSecret(String(input.glob ?? '')) || isSecret(String(input.pattern ?? ''), tool === 'Glob')) {
    refuse('That file holds studio secrets, so chat cannot read it.')
  }
  process.exit(0)
}

// Anything else the route didn't grant is already refused by the CLI.
process.exit(0)

function resolve(file) {
  return typeof file === 'string' ? path.resolve(root, file) : null
}

function inside(target, dir) {
  return target === dir || target.startsWith(dir + path.sep)
}

function shown(target) {
  return target ? path.relative(root, target) || target : 'that file'
}

/** A path, or a glob, that names a secret. Grep's `pattern` is a regex over
 *  contents, not a path, so it is only checked for Glob. */
function isSecret(p, check = true) {
  if (!check || !p) return false
  return p.split(/[\\/]/).some((part) => SECRET_DIRS.has(part) || SECRET_FILE.test(part))
}

function block(reason) {
  process.stderr.write(reason)
  process.exit(2)
}
