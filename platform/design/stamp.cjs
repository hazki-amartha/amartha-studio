// =============================================================================
// Design · the source-mapping loader.
//
// Stamps every JSX element in `projects/**/*.tsx` with
// `data-src="<file>:<line>:<col>"` — the position of its opening tag in the
// file the build read. That attribute is the whole unlock: it is what lets the
// studio address a specific JSX node from a DOM node, which is what `class`,
// `text` and `prop` edits verify against today and what structural edits (D2)
// will be impossible without.
//
// Why a webpack loader and not Babel: adding a Babel preset to a Next app
// switches the whole build off SWC and onto Babel, which is a large, silent
// performance regression for every file in the repo. A loader is a pre-pass on
// the files we name and leaves the compiler alone.
//
// Why not React's own `_debugSource`: react-dom does carry it on the fiber
// (via `jsx-dev-runtime`, and it is present on the react 18.3.1 this repo
// pins), which would mean no loader at all — but it exists only in DEVELOPMENT
// builds, and deployed design mode is the point of having this at all. React 19
// removed it outright. Recorded so it is not re-proposed.
//
// CommonJS because webpack loads loaders with `require`.
// =============================================================================

const { parse } = require('@babel/parser')
// magic-string is ESM-only from v1; Node's require(esm) hands back the module
// namespace, so the class is on `.default`. The fallback keeps this working if
// the dependency is ever pinned back to a CommonJS release.
const MagicStringModule = require('magic-string')
const MagicString = MagicStringModule.default || MagicStringModule
const path = require('path')

/** Repo-relative, POSIX-separated, so an address means the same thing on a
 *  laptop and in a Linux build container. */
function repoRelative(resourcePath, root) {
  return path.relative(root, resourcePath).split(path.sep).join('/')
}

/**
 * Stamp one file's source. Exported separately from the loader so it can be
 * tested, and run over the whole repo, without webpack in the room.
 *
 * Returns `null` when there is nothing to do or the file cannot be parsed —
 * see `shouldStamp` for why a parse failure is not an error.
 */
function stampSource(source, file) {
  let ast
  try {
    ast = parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    })
  } catch {
    // Best-effort, deliberately: a file this parser cannot read is left
    // unstamped and the build carries on. That screen is inspect-only until
    // someone looks at it. Failing the build instead would mean one unusual
    // piece of TSX takes the whole studio down — a much worse trade than one
    // screen temporarily losing design mode.
    return null
  }

  const out = new MagicString(source)
  let count = 0

  walk(ast, (node) => {
    if (node.type !== 'JSXOpeningElement') return
    // `<>…</>` has no opening element to stamp and no tag to carry an
    // attribute — JSXFragment is a different node type and never reaches here.
    if (!node.name) return
    // Idempotent: a file that somehow already carries stamps is left alone
    // rather than accumulating a second set.
    if (hasDataSrc(node)) return

    // The address is the position of the OPENING ELEMENT — the `<` — not of the
    // tag name one column to its right. applyEdits resolves an address against
    // `openingElement.loc.start`, so these two must name the same character;
    // using `node.name.loc` here put every address off by one and resolved
    // nothing. scripts/test-design.mjs asserts the round trip for this reason.
    const loc = node.loc
    if (!loc) return

    // Babel lines are 1-based and columns 0-based. `protocol.ts` documents the
    // same convention on the other side; they must not drift apart.
    const address = `${file}:${loc.start.line}:${loc.start.column}`
    out.appendLeft(node.name.end, ` data-src="${address}"`)
    count += 1
  })

  if (count === 0) return null
  return { code: out.toString(), map: out.generateMap({ hires: true, source: file }) }
}

function hasDataSrc(node) {
  return (node.attributes || []).some(
    (a) => a.type === 'JSXAttribute' && a.name && a.name.name === 'data-src',
  )
}

/** Plain recursive walk. The AST is one screen file; a visitor library would be
 *  a dependency for no benefit at this size. */
function walk(node, visit) {
  if (!node || typeof node.type !== 'string') return
  visit(node)
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue
    const child = node[key]
    if (Array.isArray(child)) {
      for (const c of child) if (c && typeof c.type === 'string') walk(c, visit)
    } else if (child && typeof child.type === 'string') {
      walk(child, visit)
    }
  }
}

/**
 * Which files get stamped: project screens only.
 *
 * `design-system/` and `platform/` are never stamped, and that is a product
 * decision as much as a scoping one — an unstamped node cannot be addressed,
 * so component internals are structurally unselectable in design mode. A
 * designer can change a Button's props; they cannot reach inside it and move
 * its icon. That is the closed vocabulary CLAUDE.md §2 asks for, enforced by
 * the absence of an address rather than by a rule someone has to remember.
 */
function shouldStamp(resourcePath, root) {
  if (!resourcePath.endsWith('.tsx')) return false
  const rel = repoRelative(resourcePath, root)
  return rel.startsWith('projects/') && !rel.startsWith('projects/_template/')
}

/**
 * The loader. webpack only — `next build`, and `next dev` WITHOUT `--turbo`,
 * which is why scripts/dev.mjs no longer passes it: Turbopack does not run
 * webpack loaders, so under it the dev server (the one place design mode can
 * write) rendered no `data-src` at all.
 *
 * Returns the string rather than calling `this.callback(code, map)`. The map
 * buys nothing: a stamp only inserts an attribute inside an opening tag, so
 * every line keeps its number and only columns inside that tag shift.
 */
function loader(source) {
  const root = (this.getOptions && this.getOptions().root) || this.rootContext
  if (!root || !shouldStamp(this.resourcePath, root)) return source

  const result = stampSource(source, repoRelative(this.resourcePath, root))
  return result ? result.code : source
}

module.exports = loader
module.exports.stampSource = stampSource
module.exports.shouldStamp = shouldStamp
module.exports.repoRelative = repoRelative
