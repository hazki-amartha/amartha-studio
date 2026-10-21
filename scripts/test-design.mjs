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
// At the end, the database-project save checks that need no server
// (platform/dbProjects/vocabulary.ts) — raw colours and fonts, and imports —
// and Chat's per-message note and command guard.
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
      `export { arrangeScreens } from './platform/design/arrangeScreens'`,
      `export { versionOf } from './platform/design/version'`,
      `export { tidyImports, restoreSemicolons } from './platform/design/tidy'`,
      `export { layoutOf, withLayout, SPACING } from './platform/design/layout'`,
      `export { spacingNames } from './platform/inspect/tokenMap'`,
      `export { propsFor, swapEdits, readPick, pickerUrl } from './platform/design/illustration'`,
      `export { artworkSrc, COMPONENT_PROPS } from './platform/design/componentProps'`,
      `export { NAV_ICONS, PRODUCT_LOGOS, SERVICE_ICONS, WORDMARKS } from './design-system/assets/names'`,
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
const {
  applyEdits,
  arrangeScreens,
  versionOf,
  tidyImports,
  layoutOf,
  withLayout,
  SPACING,
  spacingNames,
  propsFor,
  swapEdits,
  readPick,
  pickerUrl,
  artworkSrc,
  COMPONENT_PROPS,
  NAV_ICONS,
  PRODUCT_LOGOS,
  SERVICE_ICONS,
  WORDMARKS,
} = await import(pathToFileURL(outFile).href)
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
  assert.ok(files.length > 40, `expected the repo's screens, found ${files.length}`)

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

test('a move inside a nested container keeps its siblings’ indentation', () => {
  // recast re-indents a patched element by its own column, new line breaks
  // included: these used to land at 8 + 8 = 16 (the afin-linear limit card).
  const NESTED = `export function A() {
  return (
    <Screen>
      <div className="flex">
        <div className="a">
          <p className="x">
            {one}
          </p>
          <p className="y">Two</p>
        </div>
      </div>
    </Screen>
  )
}
`
  const at = addresses(NESTED)
  const out = ok(applyEdits(NESTED, [{ kind: 'move', src: at('p', 0), to: { after: at('p', 1) } }]))
  assert.ok(
    out.includes(`        <div className="a">
          <p className="y">Two</p>
          <p className="x">
            {one}
          </p>
        </div>`),
    out,
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
  assert.deepEqual(layoutOf(classes), {
    direction: 'col',
    gap: '12',
    align: null,
    justify: null,
    padX: '16',
    padY: null,
    clip: false,
    sizing: [],
  })
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

test('layout: padding is one p- when the axes agree, px-/py- when they don’t', () => {
  const none = { direction: 'col', gap: null, align: null, justify: null }
  assert.deepEqual(layoutOf(['p-12']).padX, '12')
  assert.deepEqual(layoutOf(['p-12', 'py-4']).padY, '4')
  assert.deepEqual(withLayout(['flex', 'flex-col', 'p-12'], { ...none, padX: '16' }), [
    'flex',
    'flex-col',
    'px-16',
    'py-12',
  ])
  assert.deepEqual(withLayout(['flex', 'flex-col', 'px-16', 'py-8'], { ...none, padY: '16' }), [
    'flex',
    'flex-col',
    'p-16',
  ])
  assert.deepEqual(withLayout(['flex', 'flex-col', 'p-12'], { ...none, padX: null, padY: null }), [
    'flex',
    'flex-col',
  ])
  // A side-specific class is someone's choice and is left alone.
  assert.deepEqual(withLayout(['flex', 'flex-col', 'pt-4'], { ...none, padX: '8' }), [
    'flex',
    'flex-col',
    'px-8',
    'pt-4',
  ])
  // Undefined leaves padding as it is — how an older staged edit reads.
  assert.deepEqual(withLayout(['flex', 'p-12'], { ...none, direction: 'row' }), ['flex', 'p-12'])
})

test('layout: clip content is overflow-hidden', () => {
  const none = { direction: null, gap: null, align: null, justify: null }
  assert.equal(layoutOf(['overflow-hidden']).clip, true)
  assert.deepEqual(withLayout(['rounded-12', 'bg-neutral-white'], { ...none, clip: true }), [
    'overflow-hidden',
    'rounded-12',
    'bg-neutral-white',
  ])
  assert.deepEqual(withLayout(['overflow-hidden', 'p-4'], { ...none, clip: false }), ['p-4'])
})

test('stack: writes padding and clip, and still accepts an edit that names neither', () => {
  const at = addresses(HOME)
  const out = ok(
    applyEdits(HOME, [
      {
        kind: 'stack',
        src: at('Card', 0),
        old: { direction: 'col', gap: '12', align: null, justify: null, padX: null, padY: null, clip: false },
        next: { direction: 'col', gap: '12', align: null, justify: null, padX: '16', padY: '16', clip: true },
      },
    ]),
  )
  assert.match(out, /<Card className="flex flex-col gap-12 overflow-hidden p-16">/)
})

test('layout: sizing classes are swapped as a set, in Tailwind order', () => {
  const none = { direction: null, gap: null, align: null, justify: null }
  assert.deepEqual(layoutOf(['flex-1', 'w-200', 'p-4', 'self-start', 'min-w-0']).sizing, [
    'flex-1',
    'w-200',
    'self-start',
  ])
  assert.deepEqual(withLayout(['flex', 'w-full', 'p-12'], { ...none, direction: 'row', sizing: ['h-120', 'w-320'] }), [
    'flex',
    'h-120',
    'w-320',
    'p-12',
  ])
  assert.deepEqual(withLayout(['flex-1', 'rounded-12'], { ...none, sizing: ['size-48'] }), ['size-48', 'rounded-12'])
  assert.deepEqual(withLayout(['size-48', 'rounded-12'], { ...none, sizing: [] }), ['rounded-12'])
  // The same classes in another order are not a change.
  assert.deepEqual(withLayout(['w-40', 'h-24'], { ...none, sizing: ['h-24', 'w-40'] }), ['w-40', 'h-24'])
})

test('stack: writes sizing, and refuses when the file’s sizing moved on', () => {
  const at = addresses(HOME)
  const base = { direction: 'col', gap: '12', align: null, justify: null }
  const out = ok(
    applyEdits(HOME, [{ kind: 'stack', src: at('Card', 0), old: { ...base, sizing: [] }, next: { ...base, sizing: ['w-full'] } }]),
  )
  assert.match(out, /<Card className="flex w-full flex-col gap-12">/)
  const stale = applyEdits(HOME, [
    { kind: 'stack', src: at('Card', 0), old: { ...base, sizing: ['w-200'] }, next: { ...base, sizing: [] } },
  ])
  assert.equal(stale.ok, false)
})

test('size scale: 4px from 52 to SIZE_MAX, and the panel agrees on the top', async () => {
  const src = await readFile(join(root, 'tailwind.config.ts'), 'utf8')
  const panel = await readFile(join(root, 'platform/design/sizing.ts'), 'utf8')
  const max = Number(/const SIZE_MAX = (\d+)/.exec(src)?.[1])
  assert.equal(max, Number(/export const SIZE_MAX = (\d+)/.exec(panel)?.[1]))
  assert.equal((max - 52) % 4, 0)
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
    alias: { 'next/server': 'next/server.js', 'next/headers': 'next/headers.js' },
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
//
// The project registry is a fixture too: a draft Hazki owns, and a live
// project. These tests were written against the real afin-linear, and went
// down unseen when it moved to the database (#494) — real projects come and go.

const FIXTURE_CONFIGS = `export const configs = {
  'afin-linear': async () => ({ slug: 'afin-linear', owner: 'Hazki', status: 'draft' }),
  'amarthafin-live': async () => ({ slug: 'amarthafin-live', owner: 'Hazki', status: 'live' }),
}`

const github = await (async () => {
  const file = join(root, 'scripts', '.test-design-github.mjs')
  await build({
    plugins: [
      {
        name: 'fixture-configs',
        setup(b) {
          b.onResolve({ filter: /^@\/projects\/configs$/ }, () => ({ path: 'configs', namespace: 'fixture' }))
          b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: FIXTURE_CONFIGS, loader: 'js' }))
        },
      },
    ],
    absWorkingDir: root,
    stdin: {
      contents: [
        `export { appJwt, branchFor, githubConfig, githubLocalConfig, kebab, GitHub } from './platform/design/github'`,
        `export { githubApply, githubCheck, githubPush } from './platform/design/server/githubBackend'`,
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
    alias: { 'next/server': 'next/server.js', 'next/headers': 'next/headers.js' },
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
  const headlines = []
  /** Check runs by commit, as the fake CI reports them. */
  const checks = new Map()
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
      const state = u.searchParams.get('state') ?? 'open'
      return json(
        200,
        pulls
          .filter((p) => `acme:${p.head}` === head && (state === 'all' || p.state === state))
          .reverse()
          .map((p) => ({
            number: p.number,
            node_id: p.nodeId,
            state: p.state,
            merged_at: p.mergedAt,
            head: { sha: `tip-of-${p.head.replaceAll('/', '_')}` },
          })),
      )
    }
    if (u.pathname === `${repo}/pulls` && method === 'POST') {
      const pr = { number: pulls.length + 1, nodeId: `PR_${pulls.length + 1}`, state: 'open', mergedAt: null, ...body }
      pulls.push(pr)
      return json(201, { number: pr.number, node_id: pr.nodeId })
    }
    const runs = u.pathname.match(/^\/repos\/acme\/studio\/commits\/([^/]+)\/check-runs$/)
    if (runs) {
      const list = checks.get(runs[1])
      return list === 'forbidden' ? json(403, {}) : json(200, { total_count: (list ?? []).length, check_runs: list ?? [] })
    }
    if (u.pathname === '/graphql') {
      merged.push(body.variables.id)
      headlines.push(body.variables.headline)
      return json(200, { data: {} })
    }
    return json(404, {})
  }
  return { fetchImpl, refs, pulls, calls, merged, headlines, checks }
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

/** A git project's home as the backend sees one: a shell holding a card whose
 *  component lives in the same file — afin-linear's, cut down. */
const AFIN_HOME = `'use client'

import { MoneyBag } from '@/design-system/icons'
import { HomeShell } from '../lib/ui'

export function HomeScreen() {
  return (
    <HomeShell>
      <LimitCard />
      <MoneyBag size={24} />
    </HomeShell>
  )
}

function LimitCard() {
  return <div className="rounded-16 bg-neutral-white p-12">Limit</div>
}
`

test('github: apply rebuilds from the build, commits to the branch, and undoes by re-applying', async () => {
  const rel = 'projects/afin-linear/screens/home.tsx'
  const source = AFIN_HOME
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
  // What lands on main is the change's title, not the branch's one commit.
  assert.deepEqual(gh.headlines, ['[afin-linear] Design changes from the studio (Hazki) (#1)'])
  const again = await call(github.githubPush, { slug: 'afin-linear', push: true, name: 'Hazki' }, CONFIG, gh.fetchImpl)
  assert.equal(again.ok, true)
  assert.equal(gh.pulls.length, 1, 'pushing twice reuses the open change')

  // Nothing applied under this name: nothing to push.
  const empty = fakeGitHub({ 'projects/afin-linear/project.config.ts': 'x' })
  const nothing = await call(github.githubPush, { slug: 'afin-linear', push: true, name: 'Hazki' }, CONFIG, empty.fetchImpl)
  assert.equal(nothing.ok, false)
})

test('github: after a push, the panel can tell landed from failed', async () => {
  const gh = fakeGitHub({ 'projects/afin-linear/project.config.ts': 'x' })
  const check = async () => {
    const res = await call(github.githubCheck, { slug: 'afin-linear', check: true, name: 'Hazki' }, CONFIG, gh.fetchImpl)
    assert.equal(res.ok, true, res.reason)
    return res.change
  }
  const tip = `tip-of-${github.branchFor('afin-linear', 'Hazki', BUILD).replaceAll('/', '_')}`

  assert.equal(await check(), 'none', 'nothing pushed yet')
  gh.pulls.push({ number: 1, nodeId: 'PR_1', head: github.branchFor('afin-linear', 'Hazki', BUILD), state: 'open', mergedAt: null })

  assert.equal(await check(), 'waiting', 'no checks reported yet')
  gh.checks.set(tip, [
    { status: 'in_progress', conclusion: null },
    { status: 'completed', conclusion: 'skipped' },
  ])
  assert.equal(await check(), 'waiting', 'still running, and a skipped check is not a failure')
  gh.checks.set(tip, [
    { status: 'completed', conclusion: 'success' },
    { status: 'completed', conclusion: 'failure' },
  ])
  assert.equal(await check(), 'failed')
  gh.checks.set(tip, 'forbidden')
  assert.equal(await check(), 'waiting', 'an App without Checks: read degrades to the old behaviour')

  gh.pulls[0].state = 'closed'
  assert.equal(await check(), 'closed')
  gh.pulls[0].mergedAt = '2026-09-18T00:00:00Z'
  assert.equal(await check(), 'landed')

  // A newer change from the same branch is the one that counts.
  gh.pulls.push({ number: 2, nodeId: 'PR_2', head: gh.pulls[0].head, state: 'open', mergedAt: null })
  gh.checks.set(tip, [])
  assert.equal(await check(), 'waiting')

  const stranger = await call(github.githubCheck, { slug: 'afin-linear', check: true, name: 'Someone' }, CONFIG, gh.fetchImpl)
  assert.equal(stranger.ok, false)
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

test('github: an editing password gates saving without gating the studio', async () => {
  const saved = { ...process.env }
  const get = async (cookie) =>
    (await github.GET(new Request('http://x/api/design?slug=afin-linear', { headers: cookie ? { cookie } : {} }))).json()
  const post = (body, cookie) =>
    github.POST(
      new Request('http://x/api/design', { method: 'POST', body: JSON.stringify(body), headers: cookie ? { cookie } : {} }),
    )
  try {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      STUDIO_GH_APP_ID: '1',
      STUDIO_GH_APP_PRIVATE_KEY: PEM,
      STUDIO_GH_APP_INSTALLATION_ID: '42',
      VERCEL_GIT_REPO_OWNER: 'acme',
      VERCEL_GIT_REPO_SLUG: 'studio',
      VERCEL_GIT_COMMIT_SHA: BUILD,
      STUDIO_EDIT_PASSWORD: 'let-me-edit',
    })
    delete process.env.SITE_PASSWORD

    const locked = await get()
    assert.equal(locked.backend, 'github', 'the editing password alone is a gate')
    assert.equal(locked.needsPassword, true)

    const push = { slug: 'afin-linear', push: true, name: 'Hazki' }
    const refused = await (await post(push)).json()
    assert.equal(refused.ok, false)
    assert.match(refused.reason, /editing password/)

    const wrong = await post({ slug: 'afin-linear', unlock: 'guess' })
    assert.equal((await wrong.json()).ok, false)
    assert.equal(wrong.headers.get('set-cookie'), null)

    const right = await post({ slug: 'afin-linear', unlock: 'let-me-edit' })
    assert.equal((await right.json()).ok, true)
    const cookie = right.headers.get('set-cookie').split(';')[0]
    assert.match(right.headers.get('set-cookie'), /HttpOnly/i)
    assert.equal((await get(cookie)).needsPassword, undefined, 'the cookie unlocks this browser')

    const forged = `db_design_edit=${Date.now() + 1e9}.${'0'.repeat(64)}`
    assert.equal((await get(forged)).needsPassword, true, 'a forged cookie does not')

    process.env.STUDIO_EDIT_PASSWORD = 'changed'
    assert.equal((await get(cookie)).needsPassword, true, 'changing the password signs everyone out')

    // The site password only gates the door now: saving still takes an editor
    // or the editing password.
    process.env.SITE_PASSWORD = 'site'
    assert.equal((await get()).needsPassword, true, 'behind the site gate, getting in is not enough')
    process.env.STUDIO_EDIT_PASSWORD = 'let-me-edit'
    assert.equal((await get(cookie)).needsPassword, undefined, 'the editing password still opens it')
  } finally {
    for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k]
    Object.assign(process.env, saved)
  }
})

// --- Push from a laptop (platform/push) ----------------------------------------

test('github: local config needs the App, and reads the repo from origin', () => {
  const env = { STUDIO_GH_APP_ID: '1', STUDIO_GH_APP_PRIVATE_KEY: 'k', STUDIO_GH_APP_INSTALLATION_ID: '42' }
  const c = github.githubLocalConfig('https://github.com/acme/studio.git', env)
  assert.equal(c.owner, 'acme')
  assert.equal(c.repo, 'studio')
  assert.equal(c.base, 'main')
  assert.equal(github.githubLocalConfig('git@github.com:acme/studio.git', env).repo, 'studio')
  assert.equal(github.githubLocalConfig('https://github.com/acme/studio.git', { ...env, STUDIO_GH_APP_ID: undefined }), null)
  assert.equal(github.githubLocalConfig(null, env), null)
})

test('github: commitFiles lands every file as ONE commit on top of the parent', async () => {
  const calls = []
  const made = { blobs: [], tree: null, commit: null, ref: null }
  const json = (status, body) => new Response(JSON.stringify(body ?? {}), { status })
  const fetchImpl = async (url, init = {}) => {
    const u = new URL(url)
    const method = init.method ?? 'GET'
    const body = init.body ? JSON.parse(init.body) : undefined
    calls.push(`${method} ${u.pathname}`)
    if (u.pathname.endsWith('/access_tokens')) return json(201, { token: 'inst-token' })
    const repo = '/repos/acme/studio'
    if (u.pathname === `${repo}/git/commits/main-tip` && method === 'GET') return json(200, { tree: { sha: 'main-tree' } })
    if (u.pathname === `${repo}/git/blobs`) {
      made.blobs.push(Buffer.from(body.content, 'base64').toString('utf8'))
      return json(201, { sha: `blob-${made.blobs.length}` })
    }
    if (u.pathname === `${repo}/git/trees`) return (made.tree = body), json(201, { sha: 'new-tree' })
    if (u.pathname === `${repo}/git/commits` && method === 'POST') return (made.commit = body), json(201, { sha: 'new-commit' })
    if (u.pathname === `${repo}/git/refs`) return (made.ref = body), json(201, {})
    return json(404, {})
  }
  const gh = new github.GitHub({ ...CONFIG, sha: '' }, fetchImpl)
  const blobs = await gh.commitFiles(
    'afin-linear/studio-hazki-x',
    'main-tip',
    [
      { path: 'projects/afin-linear/a.tsx', content: Buffer.from('A') },
      { path: 'projects/afin-linear/b.tsx', content: Buffer.from('B'), mode: '100755' },
      { path: 'projects/afin-linear/gone.tsx', content: null },
    ],
    '[afin-linear] Changes from the studio (Hazki)',
  )
  assert.deepEqual(made.blobs, ['A', 'B'])
  assert.equal(made.tree.base_tree, 'main-tree')
  assert.deepEqual(made.tree.tree, [
    { path: 'projects/afin-linear/a.tsx', mode: '100644', type: 'blob', sha: 'blob-1' },
    { path: 'projects/afin-linear/b.tsx', mode: '100755', type: 'blob', sha: 'blob-2' },
    // A deletion is a null SHA in the tree, not a blob.
    { path: 'projects/afin-linear/gone.tsx', mode: '100644', type: 'blob', sha: null },
  ])
  assert.deepEqual(made.commit, { message: '[afin-linear] Changes from the studio (Hazki)', tree: 'new-tree', parents: ['main-tip'] })
  assert.deepEqual(made.ref, { ref: 'refs/heads/afin-linear/studio-hazki-x', sha: 'new-commit' })
  assert.deepEqual(blobs, {
    'projects/afin-linear/a.tsx': 'blob-1',
    'projects/afin-linear/b.tsx': 'blob-2',
    'projects/afin-linear/gone.tsx': null,
  })
  assert.equal(calls.filter((c) => c === 'POST /repos/acme/studio/git/commits').length, 1)
})

// ------------------------------------------------- new project, inside an app
//
// What New Project copies when a project starts inside a live reference
// (platform/projects/server/startingFiles.ts): the start screen and what it
// imports — every file of it reachable, every import one a database project
// may make — and nothing else of the app.

const starts = await (async () => {
  const file = join(root, 'scripts', '.test-design-starts.mjs')
  await build({
    absWorkingDir: root,
    stdin: {
      contents: `export { startingFiles, entryOnly, importsOf } from './platform/projects/server/startingFiles'\nexport { LIVE_STARTS } from './platform/projects/protocol'\nexport { vocabularyProblems } from './platform/dbProjects/vocabulary'`,
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: file,
    packages: 'external',
    logLevel: 'silent',
  })
  const mod = await import(pathToFileURL(file).href)
  process.on('exit', () => rm(file, { force: true }).catch(() => {}))
  return mod
})()

test('new project: each live start is its reference’s platform and frame', async () => {
  for (const s of starts.LIVE_STARTS) {
    const config = await readFile(join(root, 'projects', s.id, 'project.config.ts'), 'utf8')
    assert.match(config, /status: 'live'/, s.id)
    assert.match(config, new RegExp(`platform: '${s.platform}'`), s.id)
    assert.match(config, new RegExp(`device: '${s.device}'`), s.id)
    assert.doesNotMatch(config, /extends:/, `${s.id} can't be a base if it extends`)
  }
})

test('new project: a live start copies its start screen and what that imports — nothing else', async () => {
  for (const s of starts.LIVE_STARTS) {
    const files = new Map((await starts.startingFiles(s.id)).map((f) => [f.path, f.content]))
    const index = files.get('index.ts')
    assert.equal((index.match(/lazyScreen\(/g) ?? []).length, 1, `${s.id}: one screen`)
    assert.match(index, /entry: true/, s.id)
    assert.ok(!files.has('project.config.ts'), `${s.id}: the project writes its own config`)
    assert.deepEqual([...files.keys()].filter((p) => p.startsWith('screens/')).length, 1, `${s.id}: one screen copied`)
    files.set('project.config.ts', '') // create.ts writes it
    for (const [path, source] of files) {
      if (!/\.tsx?$/.test(path)) continue
      for (const spec of starts.importsOf(source)) {
        if (!spec.startsWith('.')) continue
        const target = join(dirname(path), spec).replace(/^\.\//, '')
        if (target === 'project.config') continue
        assert.ok(['.tsx', '.ts', '/index.tsx', '/index.ts', ''].some((ext) => files.has(target + ext)), `${s.id}/${path} imports ${spec}`)
      }
      // As a laptop's New Project saves them: new files, through the save checks' imports and values.
      assert.deepEqual(starts.vocabularyProblems(path, source, '', files, root), [], `${s.id}/${path}`)
    }
  }
})

test('new project: the index keeps its own lines and only the entry screen', () => {
  const index = `import * as demo from './lib/demo'
const DAY = [{ id: 'a', label: 'A', apply: demo.a }]
export const project = {
  config,
  screens: [
    { id: 'today', title: 'Tugas', component: lazyScreen(() => import('./screens/today'), 'Today') },
    {
      title: 'Beranda',
      component: lazyScreen(() => import('./screens/home'), 'Home'),
      states: DAY,
      entry: true,
      id: 'home',
    },
    { id: 'profile', component: lazyScreen(() => import('./screens/profile'), 'Profile') },
  ],
}`
  const cut = starts.entryOnly(index)
  assert.match(cut, /const DAY = \[/)
  assert.match(cut, /import\('\.\/screens\/home'\)/)
  assert.doesNotMatch(cut, /screens\/today|screens\/profile/)
  assert.deepEqual(starts.importsOf(cut).sort(), ['./lib/demo', './screens/home'])
  assert.throws(() => starts.entryOnly(index.replace('entry: true,', '')), /no start screen/)
})

// ------------------------------------------ database-project save checks
//
// The raw-value and import checks a save runs (platform/dbProjects/
// vocabulary.ts). They read the host modules' real sources, so the export
// names below are this repo's own.

const vocabulary = await (async () => {
  const file = join(root, 'scripts', '.test-design-vocabulary.mjs')
  await build({
    absWorkingDir: root,
    stdin: {
      contents: `export { vocabularyProblems, exportsOf, HOST_MODULES } from './platform/dbProjects/vocabulary'`,
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: file,
    packages: 'external',
    logLevel: 'silent',
  })
  const mod = await import(pathToFileURL(file).href)
  process.on('exit', () => rm(file, { force: true }).catch(() => {}))
  return mod
})()

/** The save's problems for one changed file, `screens/home.tsx` by default. */
const saveProblems = (source, { file = 'screens/home.tsx', before = '', files = [] } = {}) =>
  vocabulary.vocabularyProblems(file, source, before, new Map([file, ...files].map((f) => [f, ''])), root)

test('save check: a raw colour is refused, naming the nearest token', () => {
  const [one, ...rest] = saveProblems(`export const A = () => <div style={{ background: '#22C55E' }} />`)
  assert.deepEqual(rest, [])
  assert.match(one, /`#22C55E` is a raw colour/)
  assert.match(one, /nearest: green-\d+/)
  // Inside a CSS value, and as an SVG attribute.
  assert.equal(saveProblems(`export const A = () => <div style={{ border: '1px solid #F4F0F9' }} />`).length, 1)
  assert.equal(saveProblems(`export const A = () => <circle fill="#fff" />`).length, 1)
  assert.equal(saveProblems(`export const A = 'rgba(17, 25, 40, 0.8)'`).length, 1)
})

test('save check: what only looks like a colour passes', () => {
  assert.deepEqual(saveProblems(`export const A = () => <p>{'Pinjaman #1234'}</p>`), [])
  assert.deepEqual(saveProblems(`export const A = () => <a href="#add">x</a>`), [])
  // An arbitrary class is the class check's to report, not a second error here.
  assert.deepEqual(saveProblems(`export const A = () => <div className="bg-[#853291]" />`), [])
  // A shadow's tint — FunDS's own Button casts a purple one, and there are no shadow tokens.
  assert.deepEqual(saveProblems(`export const A = () => <div style={{ boxShadow: '0 2px 3px 0 rgba(133,50,145,0.3)' }} />`), [])
  assert.deepEqual(saveProblems(`export const A = () => <div style={{ boxShadow: 'inset 0 0 0 1px #E5E7EB' }} />`), [])
})

test('save check: an old colour stays editable, and ds-exception lets one through', () => {
  const source = `export const A = () => <div style={{ color: '#EC4899' }} />`
  assert.deepEqual(saveProblems(source, { before: source }), [])
  assert.deepEqual(
    saveProblems(`export const A = () => (\n  // ds-exception: the designer asked for the signature pink\n  <div style={{ color: '#EC4899' }} />\n)`),
    [],
  )
})

test('save check: font values written into style are refused; computed ones are not', () => {
  const [one, ...rest] = saveProblems(`export const A = () => <p style={{ fontSize: '13px', width: '24px' }} />`)
  assert.deepEqual(rest, [])
  assert.match(one, /`style` sets fontSize/)
  assert.deepEqual(saveProblems(`export const A = ({ size }) => <p style={{ fontSize: size, width: \`\${size}%\` }} />`), [])
})

test('save check: imports must be reachable, real, and there', () => {
  assert.deepEqual(saveProblems(`import { Button } from '@/design-system/components'\nimport { Coins } from '@/design-system/icons'`), [])

  const [misspelt] = saveProblems(`import { WhatsApp } from '@/design-system/icons'`)
  assert.match(misspelt, /"@\/design-system\/icons" has no export `WhatsApp` — did you mean `WhatsappLogo`/)

  assert.match(saveProblems(`import clsx from 'clsx'`)[0], /can only import React, the design system and the studio runtime/)
  assert.match(saveProblems(`import { Row } from '../lib/ui'`)[0], /imports "\.\.\/lib\/ui", which isn’t a file in this project/)
  assert.deepEqual(saveProblems(`import { Row } from '../lib/ui'`, { files: ['lib/ui.tsx'] }), [])
  assert.match(saveProblems(`const S = () => import('./missing')`, { file: 'index.ts' })[0], /isn’t a file in this project/)
  // Erased by the compile, so never resolved.
  assert.deepEqual(saveProblems(`import type { Thing } from 'anything'`), [])
})

test('save check: exports are followed through export * — the components index', () => {
  const names = vocabulary.exportsOf(join(root, 'design-system/components/index.ts'))
  for (const name of ['Button', 'BottomSheet', 'NavigationHeader', 'AppShell', 'SideNav']) assert.ok(names.has(name), name)
})

test('save check: HOST_MODULES is exactly what the loader provides', async () => {
  const loader = await readFile(join(root, 'platform/dbProjects/loader.ts'), 'utf8')
  const block = loader.match(/const HOST: Record<string, unknown> = \{([\s\S]*?)\n\}/)[1]
  const keys = [...block.matchAll(/^\s*(?:'([^']+)'|([\w/-]+)):/gm)].map((m) => m[1] ?? m[2])
  assert.deepEqual([...keys].sort(), [...vocabulary.HOST_MODULES].sort())
})

// ------------------------------------------------------------------ chat
//
// The note at the top of each Chat message (platform/chat/server/turnNote.ts),
// against a throwaway project tree, and the command guard Chat's CLI runs
// before every tool call (scripts/chat-guard.mjs), as a real process.

const turnNotes = await (async () => {
  const file = join(root, 'scripts', '.test-design-chat.mjs')
  await build({
    absWorkingDir: root,
    stdin: {
      contents: [
        `export { turnNote, locateScreen, screenImport } from './platform/chat/server/turnNote'`,
        `export { withContract } from './platform/chat/server/contract'`,
        `export { readPrototype } from './platform/chat/server/otherPrototype'`,
        `export { parseDraftMeta, canSeeDraft, canActOnDraft, visibleTo } from './platform/dbProjects/draftMeta'`,
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
  })
  const mod = await import(pathToFileURL(file).href)
  process.on('exit', () => rm(file, { force: true }).catch(() => {}))
  return mod
})()

const chatTree = await (async () => {
  const { mkdtemp, mkdir, writeFile } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const dir = await mkdtemp(join(tmpdir(), 'studio-chat-'))
  const files = {
    'projects/_db/demo/project.config.ts': `export const config = { slug: 'demo', extends: 'base' }`,
    'projects/_db/demo/index.ts': `export const project = { screens: [
  { id: 'home', title: 'Home', entry: true, component: lazyScreen(() => import('./screens/home'), 'Home') },
  { component: lazyScreen(() => import('./screens/pay-sheet'), 'Pay'), title: 'Pay', id: 'pay' },
] }`,
    'projects/_db/demo/screens/home.tsx': '',
    'projects/_db/demo/screens/pay-sheet.tsx': '',
    'projects/base/index.ts': `export const project = { screens: [{ id: 'profile', component: lazyScreen(() => import('./screens/profile'), 'P') }] }`,
    'projects/base/screens/profile.tsx': '',
    'projects/_db/memo/MEMORY.md': '# Memory\n- 2026-10-20 — Copy stays in Bahasa.\n',
    'projects/_db/long/MEMORY.md': `- ${'a'.repeat(7000)}\n`,
    'projects/_db/demo-branch-ana/draft.json': '{"visibility":"private"}\n',
    'projects/_db/demo-branch-ana/screens/home.tsx': '',
    'projects/_db/demo-branch-bo/draft.json': '{"visibility":"team"}\n',
    'projects/_db/demo-branch-bo/screens/home.tsx': '',
    'CLAUDE.md': '# The contract\n',
    'design-system/guidelines/STUDIO-MEMORY.md': '# Studio memory\n- Copy a sticky bar from apartner-sot.\n',
  }
  for (const [rel, content] of Object.entries(files)) {
    await mkdir(dirname(join(dir, rel)), { recursive: true })
    await writeFile(join(dir, rel), content)
  }
  process.on('exit', () => rm(dir, { recursive: true, force: true }).catch(() => {}))
  return dir
})()

const note = (view, extra = {}) =>
  turnNotes.turnNote({ root: chatTree, slug: 'demo', folder: 'projects/_db/demo', db: true, draftOf: null, first: true, view, ...extra })

test('chat note: names the project, its folder and the open screen’s file', () => {
  const text = note({ screen: 'home' })
  assert.match(text, /^<studio-note>\n/)
  assert.match(text, /Project: `demo`, a database project\. Its files are in `projects\/_db\/demo\/`/)
  assert.match(text, /Viewing: screen `home`, in `projects\/_db\/demo\/screens\/home\.tsx`\./)
  // The id can come after the import in the entry.
  assert.match(note({ screen: 'pay' }), /screen `pay`, in `projects\/_db\/demo\/screens\/pay-sheet\.tsx`/)
})

test('chat note: an inherited screen points at its base, read-only', () => {
  assert.match(
    note({ screen: 'profile' }),
    /screen `profile`, inherited from `base` \(`projects\/base\/screens\/profile\.tsx`, read-only\)\. To change it, add a screen with the same id/,
  )
  assert.match(note({ screen: 'nowhere' }), /Viewing: screen `nowhere`\.\n/)
})

test('chat note: the device’s error goes with the screen, quoted and capped', () => {
  const text = note({ screen: 'home', screenError: 'Cannot read "x" of undefined\n' + 'a'.repeat(600) })
  const line = text.split('\n').find((l) => l.startsWith('The device shows an error'))
  assert.ok(line.includes('"Cannot read \\"x\\" of undefined\\n'))
  assert.ok(line.length < 480)
  // Nothing about a screen, or an error, that isn't a real screen id.
  assert.doesNotMatch(note({ screen: '../../etc', screenError: 'boom' }), /Viewing|error/)
  assert.doesNotMatch(note({ screen: { id: 'home' } }), /Viewing/)
})

test('chat note: a branch is explained once, then named', () => {
  assert.match(note({}, { draftOf: 'QRIS Merchant' }), /BRANCH of “QRIS Merchant”[\s\S]*Chat cannot push it\./)
  const later = note({}, { draftOf: 'QRIS Merchant', first: false })
  assert.match(later, /It is a branch of “QRIS Merchant”: saves reach the branch only\./)
  assert.doesNotMatch(later, /Chat cannot push it/)
})

test('chat note: a conversation’s first note brings the prototype’s memory and the date', () => {
  const memo = (extra = {}) => note({}, { slug: 'memo', folder: 'projects/_db/memo', ...extra })
  assert.match(
    memo(),
    /\nToday: \d{4}-\d{2}-\d{2}\.\n<\/studio-note>\n\n<prototype-memory file="projects\/_db\/memo\/MEMORY\.md">\n# Memory\n- 2026-10-20 — Copy stays in Bahasa\.\n<\/prototype-memory>$/,
  )
  // Later turns already have it.
  assert.doesNotMatch(memo({ first: false }), /prototype-memory|Today:/)
  // A prototype with no memory yet gets no block.
  assert.doesNotMatch(note({ screen: 'home' }), /prototype-memory/)
})

test('chat note: a long memory is cut, with a pointer to the file', () => {
  const text = note({}, { slug: 'long', folder: 'projects/_db/long' })
  assert.match(text, /\n… \(cut here — read the file for the rest\)\n<\/prototype-memory>$/)
  assert.ok(text.length < 6500)
})

test('chat contract: the studio memory follows CLAUDE.md in the system prompt', async () => {
  const prompt = turnNotes.withContract('Chat rules.', chatTree)
  assert.match(
    prompt,
    /^Chat rules\.\n[\s\S]*# The contract\n\n## The studio memory — design-system\/guidelines\/STUDIO-MEMORY\.md\n[\s\S]*\n# Studio memory\n- Copy a sticky bar from apartner-sot\.$/,
  )
  // No memory file, no section.
  const { mkdtemp, writeFile } = await import('node:fs/promises')
  const { tmpdir } = await import('node:os')
  const bare = await mkdtemp(join(tmpdir(), 'studio-contract-'))
  await writeFile(join(bare, 'CLAUDE.md'), '# The contract\n')
  assert.doesNotMatch(turnNotes.withContract('Chat rules.', bare), /studio memory/)
  await rm(bare, { recursive: true, force: true })
})

test('chat prototype: another one is found by name, memory first, and never a private branch', async () => {
  const configs = [
    { slug: 'checker-maker', name: 'Checker Maker', owner: 'Chandra' },
    { slug: 'checker-maker-branch-ana', name: 'Checker Maker · Ana', owner: 'Chandra', draft: { draftOf: 'checker-maker', createdBy: 'Ananda', visibility: 'private' } },
    { slug: 'checker-maker-branch-bo', name: 'Checker Maker · Bo tweak', owner: 'Chandra', draft: { draftOf: 'checker-maker', createdBy: 'Bo', visibility: 'team' } },
    { slug: 'old-thing', name: 'Old Thing', owner: 'Patricia', deleted: { deletedAt: '2026-10-01' } },
    { slug: 'ngmis-bm-bp-progress', name: 'NGMIS BM — BP Progress Board', owner: 'Hazki' },
    { slug: 'ngmis-cash-outstanding', name: 'NGMIS Cash Outstanding & Settlement', owner: 'Chandra' },
    { slug: 'vocus-field-officer-dashboard-2', name: 'Vocus - Field Officer Dashboard', owner: 'Ananda' },
  ]
  const files = {
    'checker-maker': new Map([
      ['MEMORY.md', { content: '# Memory\n- 2026-10-20 — Approvals need two checkers.\n' }],
      ['index.ts', { content: 'export const project = {}' }],
      ['screens/home.tsx', { content: 'export function Home() {}' }],
    ]),
    'ngmis-bm-bp-progress': new Map([['index.ts', { content: '' }]]),
    'checker-maker-branch-bo': new Map([['draft.json', { content: '{}' }], ['index.ts', { content: '' }]]),
  }
  const source = { configs: async () => configs, files: async (slug) => files[slug] ?? new Map() }
  const read = (project, extra = {}) =>
    turnNotes.readPrototype(source, { project, ...extra }, 'vocus-field-officer-dashboard-2')

  assert.match(
    await read('checker maker'),
    /^Checker Maker \(`checker-maker`\), by Chandra — read-only\.\n\nIts memory:\n# Memory\n- 2026-10-20 — Approvals need two checkers\.\n\nIts files: index\.ts, screens\/home\.tsx$/,
  )
  assert.match(await read('checker-maker', { file: './screens/home.tsx' }), /^Checker Maker · screens\/home\.tsx \(read-only\):\n\nexport function Home\(\) \{\}$/)
  assert.match(await read('checker-maker', { file: 'nope.tsx' }), /has no file nope\.tsx\. Its files: MEMORY\.md, index\.ts, screens\/home\.tsx\./)
  assert.match(await read('BP Progress'), /It has no memory yet\./)
  // A private branch, or a deleted project, is never found; a shared branch is,
  // and says whose — but on a tie the project itself wins.
  assert.match(await read('checker-maker-branch-ana'), /^No prototype in the studio database is called/)
  assert.match(await read('Checker Maker · Bo tweak'), /^Checker Maker · Bo tweak \(`checker-maker-branch-bo`\), a branch Bo shared with the team — read-only\.[\s\S]*Its files: index\.ts$/)
  assert.match(await read('checker'), /^Checker Maker \(`checker-maker`\), by Chandra/)
  assert.match(await read('Old Thing'), /^No prototype in the studio database is called/)
  // A vague name asks back; the chat's own prototype is already in its workspace.
  assert.match(await read('ngmis'), /^More than one prototype matches “ngmis”: NGMIS BM — BP Progress Board \(`ngmis-bm-bp-progress`\), NGMIS Cash/)
  assert.match(await read('Vocus - Field Officer Dashboard'), /is the prototype you are working on/)
})

const { spawnSync } = await import('node:child_process')

/** One tool call through the guard, as the CLI makes it. */
function guarded(
  tool,
  input,
  { commands = 'npm run check:project\nnpm run check:project -- demo', dir = 'projects/_db/demo', at = root } = {},
) {
  const run = spawnSync(process.execPath, [join(root, 'scripts', 'chat-guard.mjs')], {
    input: JSON.stringify({ tool_name: tool, tool_input: input }),
    env: { PATH: process.env.PATH, CHAT_SLUG: 'demo', CHAT_ROOT: at, CHAT_DIR: dir, CHAT_COMMANDS: commands },
    encoding: 'utf8',
  })
  const decision = run.stdout ? JSON.parse(run.stdout).hookSpecificOutput?.permissionDecision : undefined
  return { code: run.status, decision, reason: run.stderr }
}
const bash = (command, options) => guarded('Bash', { command }, options)

test('chat guard: the project’s check runs as CLAUDE.md writes it, with its output trimmed', () => {
  for (const command of [
    'npm run check:project',
    'npm run check:project -- demo',
    'npm run check:project 2>&1 | tail -n 40',
    'npm run check:project -- demo 2>&1 | tail -20',
    'npm run check:project | head',
  ]) {
    assert.deepEqual(bash(command), { code: 0, decision: 'allow', reason: '' }, command)
  }
  const git = { commands: 'npm run lint\nnpm run check:flows\nnpx tsc --noEmit', dir: 'projects/demo' }
  assert.equal(bash('npm run lint 2>&1 | tail -n 30 && npx tsc --noEmit', git).decision, 'allow')
})

test('chat guard: anything else is refused, with what to do instead', () => {
  for (const command of [
    'npm run lint', // a git project's check, in a database project's turn
    'npm run check:project -- someone-else',
    'npm run check:project; rm -rf projects',
    'npm run check:project && rm -rf projects',
    'npm run check:project | tail -5 .env.local',
    'npm run check:project > notes.txt',
    'npm run check:project\nrm -rf projects',
    'cd projects/_db/demo && ls',
  ]) {
    const { code, reason } = bash(command)
    assert.equal(code, 2, command)
    assert.match(reason, /can run only `npm run check:project` \(adding `2>&1 \| tail -n 40` is fine\)\. To look at files, use Read, Glob or Grep/)
    assert.doesNotMatch(reason, /do not try another way/)
  }
})

test('chat guard: writes stay in the project, and secrets stay unread', () => {
  assert.equal(guarded('Write', { file_path: join(root, 'projects/_db/demo/screens/home.tsx') }).code, 0)
  const outside = guarded('Edit', { file_path: join(root, 'platform/types.ts') })
  assert.equal(outside.code, 2)
  assert.match(outside.reason, /only change files inside projects\/_db\/demo\/; platform\/types\.ts is outside it/)
  assert.equal(guarded('Read', { file_path: join(root, '.env.local') }).code, 2)
  assert.equal(guarded('Read', { file_path: join(root, 'CLAUDE.md') }).code, 0)
})

test('chat guard: a private branch stays closed, unless it’s the chat’s own; a shared one opens', () => {
  const tree = { at: chatTree }
  const file = join(chatTree, 'projects/_db/demo-branch-ana/screens/home.tsx')
  const closed = guarded('Read', { file_path: file }, tree)
  assert.equal(closed.code, 2)
  assert.match(closed.reason, /a private branch: only its designer works on it/)
  assert.equal(guarded('Glob', { pattern: 'projects/_db/demo-branch-ana/**/*.tsx', path: chatTree }, tree).code, 2)
  assert.equal(guarded('Grep', { pattern: 'Home', path: join(chatTree, 'projects/_db/demo-branch-ana') }, tree).code, 2)
  // The branch the chat is on, a branch shared with the team, and every
  // other prototype open as usual.
  assert.equal(guarded('Read', { file_path: file }, { ...tree, dir: 'projects/_db/demo-branch-ana' }).code, 0)
  assert.equal(guarded('Read', { file_path: join(chatTree, 'projects/_db/demo-branch-bo/screens/home.tsx') }, tree).code, 0)
  assert.equal(guarded('Read', { file_path: join(chatTree, 'projects/_db/memo/MEMORY.md') }, tree).code, 0)
})

test('branches: private to its designer and admins until shared; only they act on it', () => {
  const { parseDraftMeta, canSeeDraft, canActOnDraft, visibleTo } = turnNotes
  const ana = { email: 'ana@amartha.com', displayName: 'Ana', label: 'Ana', role: 'editor' }
  const bo = { email: 'bo@amartha.com', displayName: 'Bo', label: 'Bo', role: 'editor' }
  const admin = { email: 'boss@amartha.com', displayName: 'Boss', label: 'Boss', role: 'admin' }
  const base = { draftOf: 'p', name: 'try', createdBy: 'Ana', createdAt: '2026-10-20', baseVersion: 1 }

  // Older branches: shared, known by name only.
  const old = parseDraftMeta(JSON.stringify(base))
  assert.equal(old.visibility, 'team')
  assert.equal(old.createdByEmail, null)
  assert.equal(canSeeDraft(old, null), true)
  assert.equal(canActOnDraft(old, ana), true)
  assert.equal(canActOnDraft(old, bo), false)

  const mine = parseDraftMeta(JSON.stringify({ ...base, createdByEmail: 'Ana@Amartha.com', visibility: 'private' }))
  assert.equal(mine.createdByEmail, 'ana@amartha.com')
  for (const [who, sees] of [[ana, true], [admin, true], [bo, false], [null, false]]) {
    assert.equal(canSeeDraft(mine, who), sees, who?.email ?? 'nobody')
  }
  // A renamed designer still owns it: the account decides, not the name.
  assert.equal(canSeeDraft(mine, { ...ana, displayName: 'Ana P.', label: 'Ana P.' }), true)
  assert.equal(canSeeDraft(mine, { ...bo, displayName: 'Ana', label: 'Ana' }), false)

  const shared = { ...mine, visibility: 'team' }
  assert.equal(canSeeDraft(shared, bo), true)
  assert.equal(canActOnDraft(shared, bo), false)
  assert.equal(canActOnDraft(shared, admin), true)

  const list = [{ slug: 'p' }, { slug: 'p-branch-try', draft: mine }, { slug: 'p-branch-team', draft: shared }]
  assert.deepEqual(visibleTo(list, bo).map((c) => c.slug), ['p', 'p-branch-team'])
  assert.deepEqual(visibleTo(list, ana).map((c) => c.slug), ['p', 'p-branch-try', 'p-branch-team'])
})

// ------------------------------------------------- Illustration swap (Edit)

const SHEET = `'use client'

import { BottomSheet } from '@/design-system/components'
import { Illustration } from '@/design-system/assets'

export function OfflineSheet() {
  return <BottomSheet slot={<Illustration generic="offline" />} title="Internet terputus" />
}
`

test('Illustration swap: a generic stand-in becomes a library illustration, written in place', () => {
  const at = srcOf(stampSource(SHEET, 'f.tsx').code, 'Illustration')
  const now = { name: null, generic: 'offline', tier: null }
  const changes = swapEdits(now, propsFor({ name: 'phone-cloud-cross', tier: 'spot' }, now))
  assert.deepEqual(changes, [
    { prop: 'generic', old: 'offline', next: null },
    { prop: 'name', old: null, next: 'phone-cloud-cross' },
  ])
  const result = applyEdits(SHEET, changes.map((c) => ({ kind: 'prop', src: at, ...c })))
  assert.ok(result.ok, result.ok ? '' : result.refused.reason)
  assert.match(result.source, /slot=\{<Illustration name="phone-cloud-cross" \/>\}/)
})

test('Illustration swap: a tier is written only when it isn’t Spot, or already was', () => {
  const spot = { name: 'hourglass', generic: null, tier: null }
  assert.deepEqual(swapEdits(spot, propsFor({ name: 'market-stall', tier: 'hero' }, spot)), [
    { prop: 'name', old: 'hourglass', next: 'market-stall' },
    { prop: 'tier', old: null, next: 'hero' },
  ])
  const hero = { name: 'market-stall', generic: null, tier: 'hero' }
  assert.deepEqual(swapEdits(hero, propsFor({ generic: 'empty', tier: 'spot' }, hero)), [
    { prop: 'generic', old: null, next: 'empty' },
    { prop: 'name', old: 'market-stall', next: null },
    { prop: 'tier', old: 'hero', next: null },
  ])
  const spelledOut = { name: 'hourglass', generic: null, tier: 'spot' }
  assert.deepEqual(swapEdits(spelledOut, propsFor({ name: 'magnifier', tier: 'spot' }, spelledOut)), [
    { prop: 'name', old: 'hourglass', next: 'magnifier' },
  ])
  assert.deepEqual(swapEdits(spot, propsFor({ name: 'hourglass', tier: 'spot' }, spot)), [])
})

test('Illustration swap: only a well-formed pick from the library counts', () => {
  const pick = { source: 'amartha-illustration', type: 'pick' }
  assert.deepEqual(readPick({ ...pick, name: 'hourglass', tier: 'spot' }), { ...pick, name: 'hourglass', tier: 'spot' })
  assert.deepEqual(readPick({ ...pick, generic: 'error', tier: 'spot' }), { ...pick, generic: 'error', tier: 'spot' })
  assert.deepEqual(readPick({ source: 'amartha-illustration', type: 'close' }), { source: 'amartha-illustration', type: 'close' })
  assert.equal(readPick({ ...pick, name: 'Hourglass"/><script>', tier: 'spot' }), null)
  assert.equal(readPick({ ...pick, name: 'hourglass', tier: 'banner' }), null)
  assert.equal(readPick({ ...pick, generic: 'error', tier: 'hero' }), null)
  assert.equal(readPick({ ...pick, generic: 'sleepy', tier: 'spot' }), null)
  assert.equal(readPick({ source: 'another-frame', type: 'pick', name: 'hourglass', tier: 'spot' }), null)
  assert.equal(readPick('pick'), null)
  assert.equal(pickerUrl({ name: null, generic: 'error', tier: null }), '/assets-app/pick?tier=spot&generic=error')
  assert.equal(pickerUrl({ name: 'market-stall', generic: null, tier: 'hero' }), '/assets-app/pick?tier=hero&name=market-stall')
})

// ------------------------------------------------ brand artwork menus (Edit)

test('brand artwork: every name has its file, and Edit offers exactly those names', async () => {
  const { existsSync } = await import('node:fs')
  const families = [
    ['ProductLogo', PRODUCT_LOGOS, (n) => [`logos/${n}.svg`]],
    ['Wordmark', WORDMARKS, (n) => [`wordmarks/${n}.svg`]],
    ['ServiceIcon', SERVICE_ICONS, (n) => [`services/${n}.svg`]],
    ['NavIcon', NAV_ICONS, (n) => [`nav/${n}.svg`, `nav/${n}-active.svg`]],
  ]
  for (const [component, names, files] of families) {
    const menu = COMPONENT_PROPS[component].find((p) => p.prop === 'name')
    assert.deepEqual(menu.values, [...names], component)
    assert.equal(menu.artwork, true, component)
    for (const name of names) {
      for (const file of files(name)) assert.ok(existsSync(join(root, 'public/funds', file)), `missing public/funds/${file}`)
    }
  }
})

test('brand artwork: a name change previews by pointing the image at the new file', () => {
  assert.equal(artworkSrc('/funds/services/pln.svg', 'pln', 'pulsa'), '/funds/services/pulsa.svg')
  assert.equal(artworkSrc('/funds/services/e-wallet.svg', 'e-wallet', 'kirim-uang'), '/funds/services/kirim-uang.svg')
  assert.equal(artworkSrc('/funds/nav/home-active.svg', 'home', 'scan'), '/funds/nav/scan-active.svg')
  assert.equal(artworkSrc('/funds/nav/home.svg', 'home', 'scan'), '/funds/nav/scan.svg')
  // Not the name it claims to be: leave it alone rather than guess.
  assert.equal(artworkSrc('/funds/services/pln.svg', 'pulsa', 'zakat'), '/funds/services/pln.svg')
})

test('brand artwork: switching a ServiceIcon writes its name in place', () => {
  const source = `export function Tiles() {\n  return <ServiceIcon name="pln" size={32} />\n}\n`
  const at = srcOf(stampSource(source, 'f.tsx').code, 'ServiceIcon')
  const result = applyEdits(source, [{ kind: 'prop', src: at, prop: 'name', old: 'pln', next: 'pulsa' }])
  assert.ok(result.ok, result.ok ? '' : result.refused.reason)
  assert.match(result.source, /<ServiceIcon name="pulsa" size=\{32\} \/>/)
})

// ------------------------------------------------- laptop tokens at the edge
//
// Middleware lets a request without a session through to the API only with a
// real laptop token (platform/auth/laptopEdge.ts). Checked against tokens made
// the way the deployed studio makes them (platform/auth/laptop.ts).

const laptopTokens = await (async () => {
  const file = join(root, 'scripts', '.test-design-laptop.mjs')
  await build({
    absWorkingDir: root,
    alias: { 'next/server': 'next/server.js', 'next/headers': 'next/headers.js' },
    stdin: {
      contents: [
        `export { createLaptopToken } from './platform/auth/laptop'`,
        `export { isLaptopToken } from './platform/auth/laptopEdge'`,
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
  })
  const mod = await import(pathToFileURL(file).href)
  process.on('exit', () => rm(file, { force: true }).catch(() => {}))
  return mod
})()

test('laptop token: only a real, unexpired Amartha token gets past middleware', async () => {
  const before = process.env.STUDIO_LAPTOP_SECRET
  process.env.STUDIO_LAPTOP_SECRET = 'test-secret'
  try {
    const { createLaptopToken, isLaptopToken } = laptopTokens
    const token = createLaptopToken('uid-1', 'Designer@Amartha.com')
    assert.equal(await isLaptopToken(token), true)
    const [payload, signature] = token.split('.')
    // Made up, edited, re-signed with another key, or expired: refused.
    assert.equal(await isLaptopToken('anything'), false)
    assert.equal(await isLaptopToken(`${payload}.${signature.slice(0, -2)}xx`), false)
    const forged = Buffer.from(JSON.stringify({ uid: 'uid-1', email: 'boss@amartha.com', exp: Date.now() + 1e9 })).toString('base64url')
    assert.equal(await isLaptopToken(`${forged}.${signature}`), false)
    assert.equal(await isLaptopToken(token, Date.now() + 91 * 86_400_000), false)
    assert.equal(await isLaptopToken(`${token}.extra`), false)
    process.env.STUDIO_LAPTOP_SECRET = 'another-secret'
    assert.equal(await isLaptopToken(token), false)
    // No secret on this deployment: nothing passes.
    delete process.env.STUDIO_LAPTOP_SECRET
    assert.equal(await isLaptopToken(token), false)
  } finally {
    if (before === undefined) delete process.env.STUDIO_LAPTOP_SECRET
    else process.env.STUDIO_LAPTOP_SECRET = before
  }
})

// --- the sidebar's drag and drop: index.ts's screen list ----------------------

const INDEX = `import { config } from './project.config'

export const project: ProjectModule = {
  config,
  screens: [
    // The start.
    {
      id: 'home',
      title: 'Home',
      component: lazyScreen(() => import('./screens/home'), 'HomeScreen'),
      entry: true,
    },
    {
      id: 'kyc',
      title: 'KYC',
      section: 'Onboarding',
      component: lazyScreen(() => import('./screens/kyc'), 'KycScreen'),
    },
    {
      id: 'done',
      title: 'Done',
      component: lazyScreen(() => import('./screens/done'), 'DoneScreen'),
    }
  ],
}
`
const SEEN = [{ id: 'home' }, { id: 'kyc', section: 'Onboarding' }, { id: 'done' }]

test('arrangeScreens moves entries verbatim and edits only section lines', () => {
  const next = [{ id: 'done', section: "Bank's KYC" }, { id: 'home' }, { id: 'kyc' }]
  const r = arrangeScreens(INDEX, SEEN, next)
  assert.equal(r.ok, true)
  const out = r.source
  // Order follows `next`; the comment travels with its entry.
  assert.ok(out.indexOf("id: 'done'") < out.indexOf('// The start.'))
  assert.ok(out.indexOf('// The start.') < out.indexOf("id: 'home'"))
  // A section is one quoted line under the title; a removed one is gone.
  assert.match(out, /title: 'Done',\n {6}section: 'Bank\\'s KYC',\n/)
  assert.doesNotMatch(out, /Onboarding/)
  // The entry that was last had no comma; moved up, it gets one.
  assert.match(out, /'DoneScreen'\),\n {4}\},\n/)
})

test('arrangeScreens round-trips back to the exact source', () => {
  const next = [{ id: 'kyc', section: 'Onboarding' }, { id: 'done', section: 'Onboarding' }, { id: 'home' }]
  const there = arrangeScreens(INDEX, SEEN, next)
  assert.equal(there.ok, true)
  const back = arrangeScreens(there.source, next, SEEN)
  assert.equal(back.ok, true)
  // Only the trailing comma the last entry gained remains.
  assert.equal(back.source, INDEX.replace("'DoneScreen'),\n    }\n", "'DoneScreen'),\n    },\n"))
})

test('arrangeScreens refuses a stale view, a changed set, or a list it cannot read', () => {
  assert.equal(arrangeScreens(INDEX, [{ id: 'home' }, { id: 'kyc' }, { id: 'done' }], SEEN).ok, false)
  assert.equal(arrangeScreens(INDEX, SEEN, [{ id: 'home' }, { id: 'kyc' }]).ok, false)
  assert.equal(arrangeScreens(INDEX, SEEN, [{ id: 'home' }, { id: 'kyc' }, { id: 'kyc' }]).ok, false)
  const spread = 'export const project = { config, screens: [...base, { id: "a", title: "A" }] }'
  assert.equal(arrangeScreens(spread, [{ id: 'a' }], [{ id: 'a', section: 'S' }]).ok, false)
  // Nothing to change is not a write.
  assert.deepEqual(arrangeScreens(INDEX, SEEN, SEEN), { ok: true, source: INDEX })
})
