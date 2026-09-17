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
const { stampSource, shouldStamp, versionOf: stampVersion } = require(join(root, 'platform/design/stamp.cjs'))

// Written inside the repo (gitignored) so Node resolves recast against
// ./node_modules, exactly as check-flows.mjs does for react.
const outFile = join(root, 'scripts', '.test-design-bundle.mjs')
await build({
  absWorkingDir: root,
  stdin: {
    contents: [
      `export { applyEdits } from './platform/design/applyEdits'`,
      `export { versionOf } from './platform/design/version'`,
      `export { tidyImports, restoreSemicolons } from './platform/design/tidy'`,
      `export { layoutOf, withLayout, SPACING } from './platform/design/layout'`,
      `export { spacingNames } from './platform/inspect/tokenMap'`,
    ].join('\n'),
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
const { applyEdits, versionOf, tidyImports, layoutOf, withLayout, SPACING, spacingNames } = await import(
  pathToFileURL(outFile).href
)
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
//
// recast reprints the ReturnStatement when JSX inside its parentheses changes,
// and its printer terminates statements with a semicolon this repo omits. D1a
// measured that as one extra line on a file's first edit; D2 removes it
// (tidy.ts, restoreSemicolons), because a reorder is supposed to be exactly
// two hunks and a stray `);` made it three.
const diffLines = (a, b) => {
  const x = a.split('\n')
  const y = b.split('\n')
  return Math.max(x.length, y.length) - x.filter((line, i) => line === y[i]).length
}

/** Changed regions between two files, by longest common subsequence of lines. */
const hunks = (a, b) => {
  const x = a.split('\n')
  const y = b.split('\n')
  const t = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0))
  for (let i = x.length - 1; i >= 0; i--) {
    for (let j = y.length - 1; j >= 0; j--) {
      t[i][j] = x[i] === y[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1])
    }
  }
  let i = 0
  let j = 0
  let count = 0
  let inGap = false
  while (i < x.length || j < y.length) {
    if (i < x.length && j < y.length && x[i] === y[j]) {
      inGap = false
      i++
      j++
      continue
    }
    if (!inGap) count++
    inGap = true
    if (j < y.length && (i === x.length || t[i][j + 1] >= t[i + 1][j])) j++
    else i++
  }
  return count
}

test('a class edit costs exactly one line, every time', () => {
  const swap = (source, from, to) => {
    const stamped = stampSource(source, 'f.tsx').code
    const result = applyEdits(source, [
      { kind: 'class', src: srcOf(stamped, 'Card'), oldClass: from, newClass: to },
    ])
    assert.ok(result.ok, result.ok ? '' : result.refused.reason)
    return result.source
  }

  const once = swap(SCREEN, 'gap-12', 'gap-16')
  assert.equal(diffLines(SCREEN, once), 1, 'first edit: the class and nothing else')
  assert.equal(SCREEN.split('\n').length, once.split('\n').length, 'no lines added or removed')

  const twice = swap(once, 'gap-16', 'gap-20')
  assert.equal(diffLines(once, twice), 1, 'second edit must be a clean one-line diff')
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

// ------------------------------------------------------------ versions (D2)

test('the loader and the backend agree on a file version', () => {
  const stamped = stampSource(SCREEN, 'f.tsx').code
  const m = stamped.match(/data-src-v="([0-9a-f]+)"/)
  assert.ok(m, 'no version stamp')
  assert.equal(m[1], versionOf(SCREEN))
  assert.equal(stampVersion(SCREEN), versionOf(SCREEN))
  assert.notEqual(versionOf(SCREEN), versionOf(SCREEN + ' '))
})

// ------------------------------------------------------------ structure (D2)

const HOME = `'use client'

import { Badge, Button, Card } from '@/design-system/components'
import { Screen } from '@/platform/primitives'

export function HomeScreen({ show, rows }: { show: boolean; rows: string[] }) {
  return (
    <Screen>
      <Card className="flex flex-col gap-12">
        <span className="text-14">One</span>
        <span className="text-14">Two</span>
      </Card>
      <Card className="gap-8">
        <Button variant="primary" onClick={() => go('x')}>
          Three
        </Button>
      </Card>
      {show && <p className="text-12">Conditional</p>}
      <ul>
        {rows.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <Badge intent="green">New</Badge>
      <div className="h-8" />
    </Screen>
  )
}
`

/** Every stamped address in a source, by tag and occurrence: `at('Card', 1)`. */
const addresses = (source) => {
  const stamped = stampSource(source, 'f.tsx').code
  const found = {}
  for (const m of stamped.matchAll(/<([A-Za-z.]+) data-src="([^"]+)"/g)) {
    ;(found[m[1]] ??= []).push(m[2])
  }
  return (tag, i = 0) => {
    const src = found[tag]?.[i]
    assert.ok(src, `no <${tag}> #${i}`)
    return src
  }
}

const ok = (result) => {
  assert.ok(result.ok, result.ok ? '' : result.refused.reason)
  return result.source
}

test('reorder: moving a card below its sibling is two hunks, nothing else', () => {
  const at = addresses(HOME)
  const out = ok(applyEdits(HOME, [{ kind: 'move', src: at('Card', 0), to: { after: at('Card', 1) } }]))
  assert.equal(hunks(HOME, out), 2)
  assert.ok(out.indexOf('Three') < out.indexOf('One'), 'cards swapped')
  assert.equal(out.split('\n').length, HOME.split('\n').length)
})

test('reorder with before: lands directly above the anchor', () => {
  const at = addresses(HOME)
  const out = ok(applyEdits(HOME, [{ kind: 'move', src: at('Badge'), to: { before: at('Card', 0) } }]))
  assert.match(out, /<Screen>\n      <Badge intent="green">New<\/Badge>\n      <Card className="flex/)
  assert.equal(hunks(HOME, out), 2)
})

test('move into another container re-indents to the new depth', () => {
  const at = addresses(HOME)
  const out = ok(applyEdits(HOME, [{ kind: 'move', src: at('Card', 1), to: { inside: at('Card', 0) } }]))
  assert.match(
    out,
    /        <span className="text-14">Two<\/span>\n        <Card className="gap-8">\n          <Button variant="primary"/,
  )
})

test('move out of a container, next to an element in the parent', () => {
  const at = addresses(HOME)
  const out = ok(applyEdits(HOME, [{ kind: 'move', src: at('span', 0), to: { after: at('Card', 1) } }]))
  assert.match(out, /      <\/Card>\n      <span className="text-14">One<\/span>\n      \{show/)
  assert.match(out, /gap-12">\n        <span className="text-14">Two<\/span>/)
})

test('move into an empty, self-closing element opens it', () => {
  const at = addresses(HOME)
  const out = ok(applyEdits(HOME, [{ kind: 'move', src: at('Badge'), to: { inside: at('div') } }]))
  assert.match(out, /      <div className="h-8">\n        <Badge intent="green">New<\/Badge>\n      <\/div>/)
})

test('refuses to move into something that cannot hold children', () => {
  const at = addresses(HOME)
  const into = applyEdits(HOME, [{ kind: 'move', src: at('Badge'), to: { inside: at('Button') } }])
  assert.equal(into.ok, false)
  assert.match(into.refused.reason, /can’t hold/)
})

test('refuses to move an element into itself', () => {
  const at = addresses(HOME)
  const self = applyEdits(HOME, [{ kind: 'move', src: at('Card', 0), to: { inside: at('Card', 0) } }])
  assert.equal(self.ok, false)
  const child = applyEdits(HOME, [{ kind: 'move', src: at('Card', 0), to: { before: at('span', 1) } }])
  assert.equal(child.ok, false)
  assert.match(child.refused.reason, /into itself/)
})

test('refuses list rows, conditional elements and the screen root', () => {
  const at = addresses(HOME)
  for (const src of [at('li'), at('p'), at('Screen')]) {
    for (const edit of [
      { kind: 'delete', src },
      { kind: 'duplicate', src },
      { kind: 'move', src, to: { before: at('Badge') } },
    ]) {
      const r = applyEdits(HOME, [edit])
      assert.equal(r.ok, false, `${edit.kind} ${src} should be refused`)
      assert.match(r.refused.reason, /directly in the layout/)
    }
  }
  // …and refuses them as anchors to sit beside.
  const beside = applyEdits(HOME, [{ kind: 'move', src: at('Badge'), to: { after: at('li') } }])
  assert.equal(beside.ok, false)
})

test('delete removes the element and the line it was on', () => {
  const at = addresses(HOME)
  const out = ok(applyEdits(HOME, [{ kind: 'delete', src: at('span', 1) }]))
  assert.doesNotMatch(out, /Two/)
  assert.equal(out.split('\n').length, HOME.split('\n').length - 1)
  assert.equal(hunks(HOME, out), 1)
})

test('delete drops an import it left unused, and only that', () => {
  const at = addresses(HOME)
  const out = ok(applyEdits(HOME, [{ kind: 'delete', src: at('Badge') }]))
  assert.match(out, /^import \{ Button, Card \} from '@\/design-system\/components'$/m)
  assert.equal(hunks(HOME, out), 2, 'the import line and the element')

  // A component still used elsewhere keeps its import.
  const oneCard = ok(applyEdits(HOME, [{ kind: 'delete', src: at('Card', 0) }]))
  assert.match(oneCard, /import \{ Badge, Button, Card \}/)

  // An import that was unused BEFORE the edit is not the panel's to remove.
  const lazy = HOME.replace("import { Screen }", "import { Unused } from 'x'\nimport { Screen }")
  const lazyOut = ok(applyEdits(lazy, [{ kind: 'delete', src: addresses(lazy)('Badge') }]))
  assert.match(lazyOut, /import \{ Unused \} from 'x'/)
})

test('deleting the last use of a whole import removes the line', () => {
  const src = `import { Card } from '@/design-system/components'
import { Screen } from '@/platform/primitives'

export function A() {
  return (
    <main>
      <Screen>x</Screen>
      <Card>y</Card>
    </main>
  )
}
`
  const out = ok(applyEdits(src, [{ kind: 'delete', src: addresses(src)('Screen') }]))
  assert.doesNotMatch(out, /primitives/)
  assert.match(out, /^import \{ Card \} from '@\/design-system\/components'\n\nexport function A/)
})

test('duplicate inserts an exact copy right after the original', () => {
  const at = addresses(HOME)
  const out = ok(applyEdits(HOME, [{ kind: 'duplicate', src: at('Card', 1) }]))
  const block = `      <Card className="gap-8">
        <Button variant="primary" onClick={() => go('x')}>
          Three
        </Button>
      </Card>
`
  assert.ok(out.includes(block + block), out)
  assert.equal(hunks(HOME, out), 1)
})

test('a batch resolves every address against the file as loaded', () => {
  const at = addresses(HOME)
  // Delete the first card, then edit the second by its ORIGINAL address — its
  // line moved up, but the address the designer saw still names it.
  const out = ok(
    applyEdits(HOME, [
      { kind: 'delete', src: at('Card', 0) },
      { kind: 'class', src: at('Card', 1), oldClass: 'gap-8', newClass: 'gap-16' },
      { kind: 'duplicate', src: at('Badge') },
      { kind: 'move', src: at('div'), to: { before: at('Card', 1) } },
    ]),
  )
  assert.match(out, /<Screen>\n      <div className="h-8" \/>\n      <Card className="gap-16">/)
  assert.equal(out.match(/<Badge intent="green">New<\/Badge>/g).length, 2)
})

test('values apply before structure, so "restyle, then delete" is fine', () => {
  const at = addresses(HOME)
  const out = ok(
    applyEdits(HOME, [
      { kind: 'delete', src: at('Card', 1) },
      { kind: 'class', src: at('Card', 1), oldClass: 'gap-8', newClass: 'gap-16' },
    ]),
  )
  assert.doesNotMatch(out, /Three/)
})

test('one bad edit anywhere refuses the whole batch', () => {
  const at = addresses(HOME)
  const r = applyEdits(HOME, [
    { kind: 'move', src: at('Badge'), to: { before: at('Card', 0) } },
    { kind: 'delete', src: at('li') },
  ])
  assert.equal(r.ok, false)
  assert.equal(r.refused.edit.kind, 'delete')
})

test('a duplicate carries the value edits made to its original', () => {
  const at = addresses(HOME)
  const out = ok(
    applyEdits(HOME, [
      { kind: 'duplicate', src: at('Badge') },
      { kind: 'prop', src: at('Badge'), prop: 'intent', old: 'green', next: 'red' },
    ]),
  )
  assert.equal(out.match(/<Badge intent="red">New<\/Badge>/g).length, 2)
})

test('a moved node can still be edited and moved again in the same batch', () => {
  const at = addresses(HOME)
  const out = ok(
    applyEdits(HOME, [
      { kind: 'move', src: at('Badge'), to: { inside: at('Card', 0) } },
      { kind: 'prop', src: at('Badge'), prop: 'intent', old: 'green', next: 'red' },
      { kind: 'move', src: at('Badge'), to: { before: at('span', 0) } },
    ]),
  )
  assert.match(out, /gap-12">\n        <Badge intent="red">New<\/Badge>\n        <span className="text-14">One/)
})

test('tidyImports adds a needed name to an existing import, or a new line', () => {
  const into = tidyImports(HOME, HOME, [{ name: 'ListRow', from: '@/design-system/components' }])
  assert.match(into, /import \{ Badge, Button, Card, ListRow \} from '@\/design-system\/components'/)
  const fresh = tidyImports(HOME, HOME, [{ name: 'TopBar', from: '@/platform/primitives' }])
  assert.match(fresh, /import \{ Screen, TopBar \} from '@\/platform\/primitives'/)
  const line = tidyImports(HOME, HOME, [{ name: 'Coins', from: '@/design-system/icons' }])
  assert.match(line, /import \{ Screen \} from '@\/platform\/primitives'\nimport \{ Coins \} from '@\/design-system\/icons'\n/)
  const already = tidyImports(HOME, HOME, [{ name: 'Card', from: '@/design-system/components' }])
  assert.equal(already, HOME)
})

// ------------------------------------------------- every real screen in repo

test('structural edits leave every real screen parseable', async () => {
  const { glob } = await import('node:fs/promises')
  const { parse } = require('@babel/parser')
  const failures = []
  let tried = 0
  for await (const rel of glob('projects/**/*.tsx', { cwd: root })) {
    if (!shouldStamp(join(root, rel), root)) continue
    const source = await readFile(join(root, rel), 'utf8')
    const stamped = stampSource(source, rel)
    if (!stamped) continue
    const srcs = [...stamped.code.matchAll(/data-src="([^"]+)"/g)].map((m) => m[1])
    // A handful per file keeps this fast while still hitting every shape the
    // repo actually uses.
    for (const src of srcs.slice(1, 6)) {
      for (const edit of [{ kind: 'duplicate', src }, { kind: 'delete', src }]) {
        const r = applyEdits(source, [edit])
        if (!r.ok) continue
        tried++
        try {
          parse(r.source, { sourceType: 'module', plugins: ['typescript', 'jsx'] })
        } catch (e) {
          failures.push(`${edit.kind} ${src}: ${e.message}`)
        }
      }
    }
  }
  assert.ok(tried > 200, `only ${tried} edits were applicable`)
  assert.deepEqual(failures, [])
})

// ------------------------------------------------------------ stacks & insert (D3)

const ICONS = new Set(['Coins', 'ArrowDown'])
const withIcons = (source, edits) => applyEdits(source, edits, { icons: ICONS })

test('layout: the spacing scale matches the inspector’s', () => {
  assert.deepEqual(SPACING, spacingNames)
})

test('layout: reads and rewrites the four stack families in place', () => {
  const classes = ['flex', 'flex-col', 'gap-12', 'px-16']
  assert.deepEqual(layoutOf(classes), { direction: 'col', gap: '12', align: null, justify: null })
  assert.deepEqual(
    withLayout(classes, { direction: 'row', gap: '8', align: 'center', justify: 'between' }),
    ['flex', 'items-center', 'justify-between', 'gap-8', 'px-16'],
  )
  assert.deepEqual(withLayout(['p-12'], { direction: 'col', gap: null, align: null, justify: null }), [
    'flex',
    'flex-col',
    'p-12',
  ])
  // Added in Tailwind's order, so the lint rule has nothing to say.
  assert.deepEqual(
    withLayout(['mt-4', 'w-full', 'rounded-12', 'bg-neutral-white'], {
      direction: 'row',
      gap: '12',
      align: 'center',
      justify: null,
    }),
    ['mt-4', 'flex', 'w-full', 'items-center', 'gap-12', 'rounded-12', 'bg-neutral-white'],
  )
  assert.deepEqual(withLayout(['flex', 'gap-4'], { direction: null, gap: null, align: null, justify: null }), [])
  // gap-x is not the uniform gap, and is left alone.
  assert.equal(layoutOf(['flex', 'gap-x-4']).gap, null)
})

test('stack: sets direction, gap and alignment on the addressed element', () => {
  const at = addresses(HOME)
  const out = ok(
    applyEdits(HOME, [
      {
        kind: 'stack',
        src: at('Card', 0),
        old: { direction: 'col', gap: '12', align: null, justify: null },
        next: { direction: 'row', gap: '8', align: 'center', justify: null },
      },
    ]),
  )
  assert.match(out, /<Card className="flex items-center gap-8">/)
  assert.equal(hunks(HOME, out), 1)
})

test('stack: refuses a stale layout and a computed className', () => {
  const at = addresses(HOME)
  const stale = applyEdits(HOME, [
    {
      kind: 'stack',
      src: at('Card', 0),
      old: { direction: 'row', gap: '12', align: null, justify: null },
      next: { direction: 'col', gap: '12', align: null, justify: null },
    },
  ])
  assert.equal(stale.ok, false)
  assert.match(stale.refused.reason, /layout has changed/)
})

test('stack: an element with no className gets one', () => {
  const at = addresses(HOME)
  const out = ok(
    applyEdits(HOME, [
      {
        kind: 'stack',
        src: at('ul'),
        old: { direction: null, gap: null, align: null, justify: null },
        next: { direction: 'col', gap: '8', align: null, justify: null },
      },
    ]),
  )
  assert.match(out, /<ul className="flex flex-col gap-8">/)
})

test('insert: a Button after a card, on its own line, with its import', () => {
  const at = addresses(HOME)
  const out = ok(
    withIcons(HOME, [
      { kind: 'insert', id: 'a1', item: 'button', to: { after: at('Card', 1) }, props: { variant: 'primary', size: 'md' } },
    ]),
  )
  assert.match(out, /      <\/Card>\n      <Button variant="primary" size="md">Tombol<\/Button>\n      \{show/)
  // Button was already imported; nothing else changes.
  assert.equal(hunks(HOME, out), 1)
})

test('insert: adds the import it needs, to the right module', () => {
  const at = addresses(HOME)
  const out = ok(
    withIcons(HOME, [
      { kind: 'insert', id: 'a1', item: 'list-row', to: { inside: at('Card', 0) }, props: { title: 'Saldo', description: 'Hari ini' } },
      { kind: 'insert', id: 'a2', item: 'icon', icon: 'Coins', to: { before: at('Badge') }, props: { className: 'text-primary-500' } },
    ]),
  )
  assert.match(out, /import \{ Badge, Button, Card, ListRow \} from '@\/design-system\/components'/)
  assert.match(out, /import \{ Screen \} from '@\/platform\/primitives'\nimport \{ Coins \} from '@\/design-system\/icons'\n/)
  assert.match(out, /        <span className="text-14">Two<\/span>\n        <ListRow title="Saldo" description="Hari ini" \/>\n      <\/Card>/)
  assert.match(out, /      <Coins className="text-primary-500" \/>\n      <Badge/)
})

test('insert: builds a row and fills it in one batch', () => {
  const at = addresses(HOME)
  const out = ok(
    withIcons(HOME, [
      { kind: 'insert', id: 'row', item: 'row', to: { before: at('Card', 0) }, props: { className: 'flex items-center gap-8' } },
      { kind: 'insert', id: 'b', item: 'button', to: { inside: 'new:row' }, props: { variant: 'secondary' }, text: 'Bayar' },
      { kind: 'insert', id: 'i', item: 'icon', icon: 'Coins', to: { before: 'new:b' }, props: {} },
      { kind: 'insert', id: 'c', item: 'text', to: { after: 'new:b' }, props: { className: 'text-12 text-caption' }, text: 'Lunas' },
    ]),
  )
  assert.ok(
    out.includes(`    <Screen>
      <div className="flex items-center gap-8">
        <Coins />
        <Button variant="secondary">Bayar</Button>
        <p className="text-12 text-caption">Lunas</p>
      </div>
      <Card className="flex flex-col gap-12">`),
    out,
  )
})

test('insert: a Card arrives holding a line of text, framed', () => {
  const at = addresses(HOME)
  const out = ok(withIcons(HOME, [{ kind: 'insert', id: 'k', item: 'card', to: { after: at('Badge') }, props: { className: 'flex flex-col gap-8' } }]))
  assert.ok(
    out.includes(`      <Card className="flex flex-col gap-8">
        <p className="text-14 text-default">Isi kartu</p>
      </Card>
      <div className="h-8" />`),
    out,
  )
})

test('insert: refuses anything the panel could not have produced', () => {
  const at = addresses(HOME)
  const place = { after: at('Badge') }
  const cases = [
    { kind: 'insert', id: 'x', item: 'marquee', to: place, props: {} },
    { kind: 'insert', id: 'x', item: 'button', to: place, props: { onClick: 'alert(1)' } },
    { kind: 'insert', id: 'x', item: 'button', to: place, props: { variant: 'huge' } },
    { kind: 'insert', id: 'x', item: 'stack', to: place, props: { className: 'p-[13px]' } },
    { kind: 'insert', id: 'x', item: 'text', to: place, props: {}, text: '{secret}' },
    { kind: 'insert', id: 'x', item: 'list-row', to: place, props: { title: 'a" onClick="x' } },
    { kind: 'insert', id: 'x', item: 'icon', icon: 'NotAnIcon', to: place, props: {} },
    { kind: 'insert', id: 'X!', item: 'text', to: place, props: {} },
    { kind: 'insert', id: 'x', item: 'text', to: { inside: at('Button') }, props: {} },
    { kind: 'insert', id: 'x', item: 'text', to: { inside: 'new:nope' }, props: {} },
  ]
  for (const edit of cases) {
    const r = withIcons(HOME, [edit])
    assert.equal(r.ok, false, JSON.stringify(edit))
  }
})

test('wrap: consecutive siblings go into a stack, re-indented', () => {
  const at = addresses(HOME)
  const out = ok(
    applyEdits(HOME, [{ kind: 'wrap', id: 'w', srcs: [at('Card', 0), at('Card', 1)], className: 'flex flex-col gap-12' }]),
  )
  assert.ok(
    out.includes(`    <Screen>
      <div className="flex flex-col gap-12">
        <Card className="flex flex-col gap-12">
          <span className="text-14">One</span>
          <span className="text-14">Two</span>
        </Card>
        <Card className="gap-8">
          <Button variant="primary" onClick={() => go('x')}>
            Three
          </Button>
        </Card>
      </div>
      {show &&`),
    out,
  )
})

test('wrap: a single element, then something inserted into the new stack', () => {
  const at = addresses(HOME)
  const out = ok(
    withIcons(HOME, [
      { kind: 'wrap', id: 'w', srcs: [at('Badge')], className: 'flex items-center gap-8' },
      { kind: 'insert', id: 't', item: 'text', to: { inside: 'new:w' }, props: {}, text: 'Baru' },
    ]),
  )
  assert.ok(
    out.includes(`      <div className="flex items-center gap-8">
        <Badge intent="green">New</Badge>
        <p>Baru</p>
      </div>`),
    out,
  )
})

test('wrap: refuses elements that are not side by side', () => {
  const at = addresses(HOME)
  for (const srcs of [
    [at('Card', 0), at('Badge')],
    [at('Card', 1), at('Card', 0)],
    [at('Card', 0), at('span', 0)],
    [at('li')],
  ]) {
    const r = applyEdits(HOME, [{ kind: 'wrap', id: 'w', srcs, className: 'flex' }])
    assert.equal(r.ok, false, srcs.join(' '))
  }
})

test('unwrap: a plain stack gives its children to its parent', () => {
  const src = `export function A() {
  return (
    <main>
      <div className="flex flex-col gap-8">
        <p>One</p>
        <p>Two</p>
      </div>
      <p>Three</p>
    </main>
  )
}
`
  const out = ok(applyEdits(src, [{ kind: 'unwrap', src: addresses(src)('div') }]))
  assert.equal(
    out,
    `export function A() {
  return (
    <main>
      <p>One</p>
      <p>Two</p>
      <p>Three</p>
    </main>
  )
}
`,
  )
})

test('unwrap: refuses anything that is more than a layout wrapper', () => {
  const at = addresses(HOME)
  assert.equal(applyEdits(HOME, [{ kind: 'unwrap', src: at('Card', 0) }]).ok, false)
  const clicky = `export function A() {
  return (
    <main>
      <div className="flex" onClick={go}>
        <p>One</p>
      </div>
    </main>
  )
}
`
  assert.equal(applyEdits(clicky, [{ kind: 'unwrap', src: addresses(clicky)('div') }]).ok, false)
})

test('wrap and unwrap round-trip to the original file', () => {
  const at = addresses(HOME)
  const wrapped = ok(applyEdits(HOME, [{ kind: 'wrap', id: 'w', srcs: [at('Card', 0), at('Card', 1)], className: 'flex' }]))
  const back = ok(applyEdits(wrapped, [{ kind: 'unwrap', src: addresses(wrapped)('div', 0) }]))
  assert.equal(back, HOME)
})

test('stack edits and inserts leave every real screen parseable', async () => {
  const { glob } = await import('node:fs/promises')
  const { parse } = require('@babel/parser')
  const failures = []
  let tried = 0
  for await (const rel of glob('projects/**/*.tsx', { cwd: root })) {
    if (!shouldStamp(join(root, rel), root)) continue
    const source = await readFile(join(root, rel), 'utf8')
    const stamped = stampSource(source, rel)
    if (!stamped) continue
    const srcs = [...stamped.code.matchAll(/data-src="([^"]+)"/g)].map((m) => m[1])
    for (const src of srcs.slice(1, 4)) {
      for (const edits of [
        [{ kind: 'wrap', id: 'w', srcs: [src], className: 'flex flex-col gap-8' }],
        [{ kind: 'insert', id: 'n', item: 'button', to: { after: src }, props: {} }],
        [{ kind: 'insert', id: 'n', item: 'icon', icon: 'Coins', to: { before: src }, props: {} }],
      ]) {
        const r = withIcons(source, edits)
        if (!r.ok) continue
        tried++
        try {
          parse(r.source, { sourceType: 'module', plugins: ['typescript', 'jsx'] })
        } catch (e) {
          failures.push(`${edits[0].kind} ${src}: ${e.message}`)
        }
      }
    }
  }
  assert.ok(tried > 200, `only ${tried} edits were applicable`)
  assert.deepEqual(failures, [])
})

// ------------------------------------------------------- the fs backend (D2)
//
// The route itself, bundled and called in-process against a throwaway project
// folder: version check, atomic write, and guarded undo. Run with the working
// directory switched to that folder, because the route resolves projects from
// `process.cwd()` exactly as it does under `next dev`.

test('the dev route writes, refuses stale versions, and undoes', async () => {
  const { mkdtemp, mkdir, writeFile } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const routeFile = join(root, 'scripts', '.test-design-route.mjs')
  await build({
    absWorkingDir: root,
    entryPoints: [join(root, 'app/api/design/route.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: routeFile,
    packages: 'external',
    logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"development"' },
    // next ships no `exports` map, so Node's ESM resolver needs the extension.
    alias: { 'next/server': 'next/server.js' },
  })
  const { POST } = await import(pathToFileURL(routeFile).href)

  const dir = await mkdtemp(join(tmpdir(), 'design-route-'))
  const rel = 'projects/demo/screens/home.tsx'
  await mkdir(join(dir, 'projects/demo/screens'), { recursive: true })
  await writeFile(join(dir, rel), HOME)
  // The route reads icon names from the icon module's source.
  await mkdir(join(dir, 'design-system/icons'), { recursive: true })
  await writeFile(join(dir, 'design-system/icons/index.tsx'), 'export function Coins(p) {}\nexport function Bell(p) {}\n')

  const cwd = process.cwd()
  process.chdir(dir)
  try {
    const at = (tag, i = 0) => addresses(HOME)(tag, i).replace(/^f\.tsx/, rel)
    const call = async (body) => (await POST(new Request('http://x/api/design', { method: 'POST', body: JSON.stringify(body) }))).json()
    const version = versionOf(HOME)

    const stale = await call({ slug: 'demo', screenId: 'home', version: 'deadbeef00', edits: [{ kind: 'delete', src: at('Badge') }] })
    assert.equal(stale.ok, false)
    assert.match(stale.reason, /changed since it loaded/)

    const outside = await call({ slug: 'demo', screenId: 'home', version, edits: [{ kind: 'delete', src: 'projects/other/screens/home.tsx:1:0' }] })
    assert.equal(outside.ok, false)

    const moved = await call({
      slug: 'demo',
      screenId: 'home',
      version,
      edits: [{ kind: 'move', src: at('Card', 0), to: { after: at('Card', 1) } }],
    })
    assert.equal(moved.ok, true, moved.reason)
    const written = await readFile(join(dir, rel), 'utf8')
    assert.equal(moved.version, versionOf(written))
    assert.ok(written.indexOf('Three') < written.indexOf('One'))

    // The same addresses against the new file: refused by version, not misapplied.
    const again = await call({ slug: 'demo', screenId: 'home', version, edits: [{ kind: 'delete', src: at('Badge') }] })
    assert.equal(again.ok, false)

    const undone = await call({ slug: 'demo', undo: moved.undo })
    assert.equal(undone.ok, true, undone.reason)
    assert.equal(await readFile(join(dir, rel), 'utf8'), HOME)
    assert.equal(undone.version, version)

    // An undo token is spent once, and refuses once the file has moved on.
    const twice = await call({ slug: 'demo', undo: moved.undo })
    assert.equal(twice.ok, false)

    const second = await call({ slug: 'demo', screenId: 'home', version, edits: [{ kind: 'delete', src: at('Badge') }] })
    assert.equal(second.ok, true)
    await writeFile(join(dir, rel), HOME + '\n// someone else\n')
    const blocked = await call({ slug: 'demo', undo: second.undo })
    assert.equal(blocked.ok, false)
    assert.match(blocked.reason, /overwrite newer work/)

    const wrongProject = await call({ slug: 'other', undo: second.undo })
    assert.equal(wrongProject.ok, false)

    // D3 through the route: a new row, filled, anchored only by `new:` after
    // the first edit — and an icon the module really exports, not one it doesn't.
    await writeFile(join(dir, rel), HOME)
    const built = await call({
      slug: 'demo',
      screenId: 'home',
      version,
      edits: [
        { kind: 'insert', id: 'r', item: 'row', to: { after: at('Badge') }, props: { className: 'flex items-center gap-8' } },
        { kind: 'insert', id: 'i', item: 'icon', icon: 'Bell', to: { inside: 'new:r' }, props: {} },
        { kind: 'insert', id: 't', item: 'text', to: { inside: 'new:r' }, props: {}, text: 'Pengingat' },
      ],
    })
    assert.equal(built.ok, true, built.reason)
    const row = await readFile(join(dir, rel), 'utf8')
    assert.match(row, /import \{ Bell \} from '@\/design-system\/icons'/)
    assert.match(row, /<div className="flex items-center gap-8">\n        <Bell \/>\n        <p>Pengingat<\/p>\n      <\/div>/)

    const fake = await call({
      slug: 'demo',
      screenId: 'home',
      version: versionOf(row),
      edits: [{ kind: 'insert', id: 'x', item: 'icon', icon: 'Skull', to: { after: 'projects/demo/screens/home.tsx:1:0' }, props: {} }],
    })
    assert.equal(fake.ok, false)

    const orphan = await call({
      slug: 'demo',
      screenId: 'home',
      version: versionOf(row),
      edits: [{ kind: 'insert', id: 'x', item: 'text', to: { inside: 'new:r' }, props: {} }],
    })
    assert.equal(orphan.ok, false, 'a new: reference alone names no file')
  } finally {
    process.chdir(cwd)
    await rm(routeFile, { force: true })
    await rm(dir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------- the github backend (D4)
//
// No App exists to test against, so this is GitHub as the backend uses it,
// in memory: installation tokens (checked against the App's public key),
// contents, refs, pulls and the auto-merge mutation.

const github = await (async () => {
  const file = join(root, 'scripts', '.test-design-github.mjs')
  await build({
    absWorkingDir: root,
    stdin: {
      contents: [
        `export { appJwt, branchFor, githubConfig, kebab, GitHub } from './platform/design/github'`,
        `export { githubApply, githubPush } from './platform/design/server/githubBackend'`,
        `export { GET, POST } from './app/api/design/route'`,
      ].join('\n'),
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: file,
    packages: 'external',
    logLevel: 'silent',
    alias: { 'next/server': 'next/server.js' },
  })
  const mod = await import(pathToFileURL(file).href)
  process.on('exit', () => rm(file, { force: true }).catch(() => {}))
  return mod
})()

const { generateKeyPairSync, createVerify, createHash } = await import('node:crypto')
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 })
const PEM = keys.privateKey.export({ type: 'pkcs1', format: 'pem' })
const BUILD = 'abc1234def5678abc1234def5678abc1234def56'

function fakeGitHub(files) {
  const blob = (text) => createHash('sha1').update(text).digest('hex')
  const refs = new Map([[BUILD, new Map(Object.entries(files))]])
  const pulls = []
  const calls = []
  const merged = []
  const json = (status, body) => new Response(body === undefined ? '' : JSON.stringify(body), { status })

  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url)
    const method = init.method ?? 'GET'
    const body = init.body ? JSON.parse(init.body) : undefined
    calls.push(`${method} ${u.pathname}`)

    if (u.pathname === '/app/installations/42/access_tokens') {
      const jwt = init.headers.authorization.replace('Bearer ', '')
      const [h, p, sig] = jwt.split('.')
      const ok = createVerify('RSA-SHA256').update(`${h}.${p}`).verify(keys.publicKey, Buffer.from(sig, 'base64url'))
      return ok ? json(201, { token: 'inst-token' }) : json(401, {})
    }
    if (init.headers.authorization !== 'Bearer inst-token') return json(401, {})

    const repo = '/repos/acme/studio'
    if (u.pathname.startsWith(`${repo}/contents/`)) {
      const path = decodeURIComponent(u.pathname.slice(`${repo}/contents/`.length))
      if (method === 'GET') {
        const tree = refs.get(u.searchParams.get('ref'))
        const text = tree?.get(path)
        if (text === undefined) return json(404, {})
        return json(200, { content: Buffer.from(text).toString('base64'), encoding: 'base64', sha: blob(text) })
      }
      if (method === 'PUT') {
        const tree = refs.get(body.branch)
        if (!tree) return json(404, {})
        if (blob(tree.get(path)) !== body.sha) return json(409, {})
        tree.set(path, Buffer.from(body.content, 'base64').toString('utf8'))
        return json(200, {})
      }
    }
    if (u.pathname.startsWith(`${repo}/git/ref/heads/`)) {
      const branch = decodeURIComponent(u.pathname.slice(`${repo}/git/ref/heads/`.length))
      return refs.has(branch) ? json(200, {}) : json(404, {})
    }
    if (u.pathname === `${repo}/git/refs` && method === 'POST') {
      const branch = body.ref.replace('refs/heads/', '')
      refs.set(branch, new Map(refs.get(body.sha)))
      return json(201, {})
    }
    if (u.pathname === `${repo}/pulls` && method === 'GET') {
      const head = u.searchParams.get('head')
      return json(200, pulls.filter((p) => `acme:${p.head}` === head).map((p) => ({ number: p.number, node_id: p.nodeId })))
    }
    if (u.pathname === `${repo}/pulls` && method === 'POST') {
      const pr = { number: pulls.length + 1, nodeId: `PR_${pulls.length + 1}`, ...body }
      pulls.push(pr)
      return json(201, { number: pr.number, node_id: pr.nodeId })
    }
    if (u.pathname === '/graphql') {
      merged.push(body.variables.id)
      return json(200, { data: {} })
    }
    return json(404, {})
  }
  return { fetchImpl, refs, pulls, calls, merged }
}

const CONFIG = {
  appId: '1',
  privateKey: PEM,
  installationId: '42',
  owner: 'acme',
  repo: 'studio',
  sha: BUILD,
  base: 'main',
}

test('github: the App JWT is RS256 over the App id, short-lived', () => {
  const jwt = github.appJwt('123', PEM, 1_700_000_000_000)
  const [h, p, sig] = jwt.split('.')
  assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url')), { alg: 'RS256', typ: 'JWT' })
  const claims = JSON.parse(Buffer.from(p, 'base64url'))
  assert.equal(claims.iss, '123')
  assert.ok(claims.exp - claims.iat <= 600)
  assert.ok(createVerify('RSA-SHA256').update(`${h}.${p}`).verify(keys.publicKey, Buffer.from(sig, 'base64url')))
})

test('github: configuration comes from env, or not at all', () => {
  const env = {
    STUDIO_GH_APP_ID: '1',
    STUDIO_GH_APP_PRIVATE_KEY: '-----BEGIN KEY-----\\nabc\\n-----END KEY-----',
    STUDIO_GH_APP_INSTALLATION_ID: '42',
    VERCEL_GIT_REPO_OWNER: 'acme',
    VERCEL_GIT_REPO_SLUG: 'studio',
    VERCEL_GIT_COMMIT_SHA: BUILD,
  }
  const c = github.githubConfig(env)
  assert.equal(c.privateKey, '-----BEGIN KEY-----\nabc\n-----END KEY-----')
  assert.equal(c.base, 'main')
  assert.equal(github.githubConfig({ ...env, STUDIO_GH_APP_ID: undefined }), null)
  // Only a deployment of the base branch: never a preview of a feature branch.
  assert.ok(github.githubConfig({ ...env, VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'main' }))
  assert.equal(github.githubConfig({ ...env, VERCEL_ENV: 'preview' }), null)
  assert.equal(github.githubConfig({ ...env, VERCEL_GIT_COMMIT_REF: 'afin-linear/home' }), null)
  assert.equal(github.githubConfig({ ...env, VERCEL_GIT_COMMIT_SHA: undefined }), null)
})

test('github: the branch is a function of project, name and build', () => {
  assert.equal(github.branchFor('afin-linear', 'Hazki Hariowibowo', BUILD), 'afin-linear/design-hazki-hariowibowo-abc1234')
  assert.equal(github.kebab('  Rébecca / O’Neil '), 'rebecca-o-neil')
  assert.equal(github.kebab('***'), 'designer')
})

const call = async (handler, ...args) => (await handler(...args)).json()

test('github: apply rebuilds from the build, commits to the branch, and undoes by re-applying', async () => {
  const rel = 'projects/afin-linear/screens/home.tsx'
  const source = await readFile(join(root, rel), 'utf8')
  const icons = await readFile(join(root, 'design-system/icons/index.tsx'), 'utf8')
  const gh = fakeGitHub({
    [rel]: source,
    'design-system/icons/index.tsx': icons,
    'projects/afin-linear/project.config.ts': 'x',
  })
  const stamped = stampSource(source, rel).code
  const srcs = [...stamped.matchAll(/<([A-Za-z]+) data-src="([^"]+)"/g)]
  const shell = srcs.find((m) => m[1] === 'HomeShell')[2]
  const limit = srcs.find((m) => m[1] === 'LimitCard')[2]
  const version = versionOf(source)
  const branch = 'afin-linear/design-hazki-abc1234'
  const req = (edits, extra = {}) => ({ slug: 'afin-linear', screenId: 'home', version, name: 'Hazki', edits, ...extra })

  // Not an owner, and not a live project.
  const stranger = await call(github.githubApply, req([{ kind: 'delete', src: limit }], { name: 'Someone' }), CONFIG, gh.fetchImpl)
  assert.equal(stranger.ok, false)
  assert.match(stranger.reason, /Hazki/)
  const live = await call(
    github.githubApply,
    { slug: 'amarthafin-live', screenId: 'home', name: 'Hazki', edits: [] , file: 'projects/amarthafin-live/screens/home.tsx' },
    CONFIG,
    gh.fetchImpl,
  )
  assert.equal(live.ok, false)
  assert.match(live.reason, /production/)
  assert.equal(gh.refs.has(branch), false, 'nothing refused may create a branch')

  // A stale screen is refused.
  const stale = await call(github.githubApply, req([{ kind: 'delete', src: limit }], { version: 'nope' }), CONFIG, gh.fetchImpl)
  assert.equal(stale.ok, false)
  assert.match(stale.reason, /newer version/)

  // First apply: branch cut from the build, file rewritten.
  const one = [{ kind: 'insert', id: 'b', item: 'icon', icon: 'Coins', to: { before: limit }, props: {} }]
  const first = await call(github.githubApply, req(one), CONFIG, gh.fetchImpl)
  assert.equal(first.ok, true, first.reason)
  const afterOne = gh.refs.get(branch).get(rel)
  assert.equal(afterOne, applyEdits(source, one, { icons: new Set(['Coins']) }).source)
  assert.equal(first.version, versionOf(afterOne))

  // Second apply re-sends the whole list; the file is rebuilt from the BUILD,
  // not stacked on the branch — no edit is applied twice.
  const two = [...one, { kind: 'move', src: limit, to: { inside: shell } }]
  const second = await call(github.githubApply, req(two), CONFIG, gh.fetchImpl)
  assert.equal(second.ok, true, second.reason)
  assert.equal(gh.refs.get(branch).get(rel), applyEdits(source, two, { icons: new Set(['Coins']) }).source)
  assert.equal(gh.refs.get(branch).get(rel).match(/<Coins/g).length, 1)

  // Undo everything: an empty list for the file puts the deployed copy back.
  const reset = await call(github.githubApply, req([], { file: rel }), CONFIG, gh.fetchImpl)
  assert.equal(reset.ok, true, reset.reason)
  assert.equal(gh.refs.get(branch).get(rel), source)

  // A refused edit writes nothing.
  const before = gh.refs.get(branch).get(rel)
  const bad = await call(github.githubApply, req([{ kind: 'delete', src: `${rel}:999:0` }]), CONFIG, gh.fetchImpl)
  assert.equal(bad.ok, false)
  assert.equal(gh.refs.get(branch).get(rel), before)

  // Push opens one change from the branch and sets it to land itself.
  await call(github.githubApply, req(one), CONFIG, gh.fetchImpl)
  const pushed = await call(github.githubPush, { slug: 'afin-linear', push: true, name: 'Hazki' }, CONFIG, gh.fetchImpl)
  assert.equal(pushed.ok, true, pushed.reason)
  assert.equal(gh.pulls.length, 1)
  assert.equal(gh.pulls[0].head, branch)
  assert.equal(gh.pulls[0].base, 'main')
  assert.match(gh.pulls[0].title, /^\[afin-linear\] /)
  assert.deepEqual(gh.merged, ['PR_1'])
  const again = await call(github.githubPush, { slug: 'afin-linear', push: true, name: 'Hazki' }, CONFIG, gh.fetchImpl)
  assert.equal(again.ok, true)
  assert.equal(gh.pulls.length, 1, 'pushing twice reuses the open change')

  // Nothing applied under this name: nothing to push.
  const empty = fakeGitHub({ 'projects/afin-linear/project.config.ts': 'x' })
  const nothing = await call(github.githubPush, { slug: 'afin-linear', push: true, name: 'Hazki' }, CONFIG, empty.fetchImpl)
  assert.equal(nothing.ok, false)
})

test('github: the route only offers the backend behind the password gate', async () => {
  const saved = { ...process.env }
  const status = async () => (await github.GET(new Request('http://x/api/design?slug=afin-linear'))).json()
  try {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      STUDIO_GH_APP_ID: '1',
      STUDIO_GH_APP_PRIVATE_KEY: PEM,
      STUDIO_GH_APP_INSTALLATION_ID: '42',
      VERCEL_GIT_REPO_OWNER: 'acme',
      VERCEL_GIT_REPO_SLUG: 'studio',
      VERCEL_GIT_COMMIT_SHA: BUILD,
    })
    delete process.env.SITE_PASSWORD
    const open = await status()
    assert.equal(open.backend, 'record', 'no gate, no writes')
    assert.deepEqual(open.owners, ['Hazki'])
    const refused = await github.POST(new Request('http://x/api/design', { method: 'POST', body: '{}' }))
    assert.equal(refused.status, 404)

    process.env.SITE_PASSWORD = 'secret'
    const gated = await status()
    assert.equal(gated.backend, 'github')
    assert.equal(gated.sha, BUILD)

    const live = await (await github.GET(new Request('http://x/api/design?slug=amarthafin-live'))).json()
    assert.match(live.locked, /production/)

    delete process.env.STUDIO_GH_APP_ID
    assert.equal((await status()).backend, 'record')
  } finally {
    for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k]
    Object.assign(process.env, saved)
  }
})
