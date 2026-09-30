#!/usr/bin/env node
// =============================================================================
// check:project — would the Chat agent's edits to a database project pass the
// checks a save must pass (platform/dbProjects/checks.ts)? Asks the dev server,
// which holds the checks, about the local copy in projects/_db/<slug>/.
//
//   npm run check:project -- <slug>   from a terminal
//   npm run check:project             in a Chat turn (the route sets CHAT_SLUG)
//
// exit 0 = the local changes will save
// =============================================================================

const slug = process.argv[2] ?? process.env.CHAT_SLUG
if (!slug) {
  console.error('Usage: npm run check:project -- <slug>')
  process.exit(1)
}

let body
try {
  const res = await fetch(`http://127.0.0.1:4000/api/db-projects/${encodeURIComponent(slug)}/check`)
  body = await res.json()
} catch {
  console.error('check:project could not reach the dev server on port 4000.')
  process.exit(1)
}

if (!body.db) {
  console.log(`${slug} lives in git — use npm run lint and npm run check:flows instead.`)
  process.exit(0)
}
if (body.problems.length) {
  console.error(`check:project — ${body.problems.length} problem(s); the studio will not save these changes:`)
  for (const p of body.problems) console.error(`  ✗ ${p}`)
  process.exit(1)
}
console.log(`check:project — OK${body.changed.length ? ` (${body.changed.length} changed file(s) will save)` : ''}`)
