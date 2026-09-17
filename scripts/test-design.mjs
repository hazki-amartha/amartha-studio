#!/usr/bin/env node
// Tests for design mode's two foundations (STUDIO-EDITING-PLAN.md, D1a):
//   - platform/design/stamp.cjs     — the source-mapping loader
//   - platform/design/applyEdits.ts — the syntax-tree write-back
//
// The load-bearing test is `round trip`: it stamps a file, reads an address
// back out of the stamped output, and applies an edit addressed that way to the
// ORIGINAL source. If the loader and the parser ever disagreed about how a
// position is spelled — 0- vs 1-based columns, the tag name vs the `<` — every
// edit in design mode would land on the wrong line, and that test is what
// catches it.
//
// Bundles the TypeScript with esbuild so it runs in plain Node, the same way
// scripts/check-flows.mjs does.

import { build } from 'esbuild'
import { rm, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import test from 'node:test'
import assert from 'node:assert/strict'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const { stampSource, shouldStamp } = require(join(root, 'platform/design/stamp.cjs'))

// Written inside the repo (gitignored) so Node resolves recast against
// ./node_modules, exactly as check-flows.mjs does for react.
const outFile = join(root, 'scripts', '.test-design-bundle.mjs')
await build({
  absWorkingDir: root,
  stdin: {
    contents: `export { applyEdits } from './platform/design/applyEdits'`,
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: outFile,
  packages: 'external',
  logLevel: 'silent',
})
const { applyEdits } = await import(pathToFileURL(outFile).href)
process.on('exit', () => {
  rm(outFile, { force: true }).catch(() => {})
})

const SCREEN = `'use client'

import { Card } from '@/design-system/components'

export function HomeScreen() {
  return (
    <Card className="flex flex-col gap-12" radius="16">
      <span className="text-14 text-caption">Total</span>
    </Card>
  )
}
`

const srcOf = (stamped, tag) => {
  const re = new RegExp(`<${tag}\\s+data-src="([^"]+)"`)
  const m = stamped.match(re)
  assert.ok(m, `no stamp found on <${tag}>`)
  return m[1]
}

// ---------------------------------------------------------------- the loader

test('stamps every JSX element with its own position', () => {
  const { code } = stampSource(SCREEN, 'projects/x/screens/home.tsx')
  assert.match(code, /<Card data-src="projects\/x\/screens\/home\.tsx:7:4"/)
  assert.match(code, /<span data-src="projects\/x\/screens\/home\.tsx:8:6"/)
})

test('is idempotent — stamping stamped output changes nothing', () => {
  const once = stampSource(SCREEN, 'f.tsx').code
  assert.equal(stampSource(once, 'f.tsx'), null)
})

test('returns null rather than throwing on TSX it cannot parse', () => {
  // A parse failure must leave the build alone: one unusual file should cost
  // that screen design mode, not take the whole studio down.
  assert.equal(stampSource('export function A() { return <div ', 'f.tsx'), null)
})

test('stamps only project files', () => {
  assert.equal(shouldStamp(join(root, 'projects/x/screens/home.tsx'), root), true)
  assert.equal(shouldStamp(join(root, 'design-system/components/Button.tsx'), root), false)
  assert.equal(shouldStamp(join(root, 'platform/primitives/index.tsx'), root), false)
  assert.equal(shouldStamp(join(root, 'projects/registry.ts'), root), false)
})

// ------------------------------------------------------------ the write-back

test('round trip: an address from the loader resolves in the parser', () => {
  const stamped = stampSource(SCREEN, 'projects/x/screens/home.tsx').code
  const result = applyEdits(SCREEN, [
    { kind: 'class', src: srcOf(stamped, 'span'), oldClass: 'text-14', newClass: 'text-16' },
  ])
  assert.ok(result.ok, result.ok ? '' : result.refused.reason)
  assert.match(result.source, /<span className="text-16 text-caption">/)
  // The Card's own className must be untouched — proof the address picked one node.
  assert.match(result.source, /className="flex flex-col gap-12"/)
})

// The whole reviewability argument for recast rests on the diff staying small.
// What it actually does, measured here rather than assumed:
//
//   first edit to a screen  → 2 lines: the change, plus ONE semicolon added to
//                             the `return (…)` that the repo's style omits
//   every edit after that   → 1 line
//
// recast reprints the ReturnStatement when JSX inside its parentheses changes,
// and its printer terminates statements with a semicolon. That is a one-off
// normalisation per file, not per-edit noise: once the semicolon is there it
// stays, and the file is clean from then on. Worth knowing before D2, when a
// reorder is supposed to be two hunks.
const diffLines = (a, b) => {
  const x = a.split('\n')
  const y = b.split('\n')
  return Math.max(x.length, y.length) - x.filter((line, i) => line === y[i]).length
}

test('a class edit costs one line, plus a one-off semicolon the first time', () => {
  const swap = (source, from, to) => {
    const stamped = stampSource(source, 'f.tsx').code
    const result = applyEdits(source, [
      { kind: 'class', src: srcOf(stamped, 'Card'), oldClass: from, newClass: to },
    ])
    assert.ok(result.ok, result.ok ? '' : result.refused.reason)
    return result.source
  }

  const once = swap(SCREEN, 'gap-12', 'gap-16')
  assert.equal(diffLines(SCREEN, once), 2, 'first edit: the class, plus the semicolon')
  assert.equal(SCREEN.split('\n').length, once.split('\n').length, 'no lines added or removed')

  const twice = swap(once, 'gap-16', 'gap-20')
  assert.equal(diffLines(once, twice), 1, 'second edit must be a clean one-line diff')

  const thrice = swap(twice, 'gap-20', 'gap-24')
  assert.equal(diffLines(twice, thrice), 1, 'and every edit after')
})

test('refuses a stale class rather than guessing', () => {
  const stamped = stampSource(SCREEN, 'f.tsx').code
  const result = applyEdits(SCREEN, [
    { kind: 'class', src: srcOf(stamped, 'Card'), oldClass: 'gap-99', newClass: 'gap-16' },
  ])
  assert.equal(result.ok, false)
  assert.match(result.refused.reason, /no longer contains/)
})

test('refuses a computed className', () => {
  const dynamic = `export function A({ on }: { on: boolean }) {
  return <div className={on ? 'gap-12' : 'gap-8'}>x</div>
}
`
  const stamped = stampSource(dynamic, 'f.tsx').code
  const result = applyEdits(dynamic, [
    { kind: 'class', src: srcOf(stamped, 'div'), oldClass: 'gap-12', newClass: 'gap-16' },
  ])
  assert.equal(result.ok, false)
  assert.match(result.refused.reason, /computed/)
})

test('refuses an address that no longer exists', () => {
  const result = applyEdits(SCREEN, [
    { kind: 'class', src: 'f.tsx:99:0', oldClass: 'gap-12', newClass: 'gap-16' },
  ])
  assert.equal(result.ok, false)
  assert.match(result.refused.reason, /no longer where it was/)
})

test('edits text', () => {
  const stamped = stampSource(SCREEN, 'f.tsx').code
  const result = applyEdits(SCREEN, [
    { kind: 'text', src: srcOf(stamped, 'span'), old: 'Total', next: 'Jumlah' },
  ])
  assert.ok(result.ok, result.ok ? '' : result.refused.reason)
  assert.match(result.source, />Jumlah</)
})

test('changes a prop, and adds one that was absent', () => {
  const stamped = stampSource(SCREEN, 'f.tsx').code
  const card = srcOf(stamped, 'Card')

  const changed = applyEdits(SCREEN, [{ kind: 'prop', src: card, prop: 'radius', old: '16', next: '20' }])
  assert.ok(changed.ok, changed.ok ? '' : changed.refused.reason)
  assert.match(changed.source, /radius="20"/)

  const added = applyEdits(SCREEN, [{ kind: 'prop', src: card, prop: 'tone', old: null, next: 'muted' }])
  assert.ok(added.ok, added.ok ? '' : added.refused.reason)
  assert.match(added.source, /tone="muted"/)

  // Adding one that is already there is a refusal, not a silent overwrite.
  const dup = applyEdits(SCREEN, [{ kind: 'prop', src: card, prop: 'radius', old: null, next: '20' }])
  assert.equal(dup.ok, false)
})

test('removes a prop, which is what makes undoing an added one possible', () => {
  // next:null is the inverse of old:null. Without it, adding a prop would be
  // the one edit in the protocol that could not be undone.
  const stamped = stampSource(SCREEN, 'f.tsx').code
  const card = srcOf(stamped, 'Card')

  const removed = applyEdits(SCREEN, [
    { kind: 'prop', src: card, prop: 'radius', old: '16', next: null },
  ])
  assert.ok(removed.ok, removed.ok ? '' : removed.refused.reason)
  assert.doesNotMatch(removed.source, /radius=/)

  // Still verified: removing a prop whose value has moved on is refused.
  const stale = applyEdits(SCREEN, [
    { kind: 'prop', src: card, prop: 'radius', old: '99', next: null },
  ])
  assert.equal(stale.ok, false)

  // Add then remove is a round trip back to the original source.
  const added = applyEdits(SCREEN, [
    { kind: 'prop', src: card, prop: 'tone', old: null, next: 'muted' },
  ])
  assert.ok(added.ok)
  const back = applyEdits(added.source, [
    { kind: 'prop', src: srcOf(stampSource(added.source, 'f.tsx').code, 'Card'), prop: 'tone', old: 'muted', next: null },
  ])
  assert.ok(back.ok, back.ok ? '' : back.refused.reason)
  assert.doesNotMatch(back.source, /tone=/)
})

test('a batch is atomic — one refusal leaves the source untouched', () => {
  const stamped = stampSource(SCREEN, 'f.tsx').code
  const result = applyEdits(SCREEN, [
    { kind: 'class', src: srcOf(stamped, 'Card'), oldClass: 'gap-12', newClass: 'gap-16' },
    { kind: 'class', src: srcOf(stamped, 'span'), oldClass: 'text-99', newClass: 'text-16' },
  ])
  assert.equal(result.ok, false)
  assert.equal(result.refused.edit.oldClass, 'text-99')
})

// ------------------------------------------------- every real screen in repo

test('stamps every project screen in the repo', async () => {
  const { glob } = await import('node:fs/promises')
  const files = []
  for await (const f of glob('projects/**/*.tsx', { cwd: root })) files.push(f)
  assert.ok(files.length > 100, `expected the repo's screens, found ${files.length}`)

  const failed = []
  for (const rel of files) {
    if (!shouldStamp(join(root, rel), root)) continue
    const source = await readFile(join(root, rel), 'utf8')
    if (stampSource(source, rel) === null && /<[A-Za-z]/.test(source)) failed.push(rel)
  }
  assert.deepEqual(failed, [], `files with JSX that could not be stamped:\n${failed.join('\n')}`)
})
