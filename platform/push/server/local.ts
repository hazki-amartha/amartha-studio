// =============================================================================
// Push · on the dev server. Sends a project's changes from this laptop live,
// through the studio's GitHub App — the same App the deployed link pushes
// with — without touching this checkout's branches.
//
// Several Claude sessions share this checkout, so Push never switches branch,
// commits or stashes here. It reads the working copy and builds the commit on
// GitHub instead:
//
//   what counts   files under projects/<slug>/ whose working copy differs from
//                 main — chat edits, saved Design edits, the designer's own
//                 agent's edits, committed or not. A file that already matches
//                 main isn't a change, so a push that has landed drops out of
//                 the count on its own.
//   what refuses  a file that main changed since this laptop last updated
//                 (base ≠ main). Sending the laptop's copy would quietly undo
//                 whoever changed it. Main holding what this laptop itself
//                 pushed doesn't count: a designer who keeps editing after a
//                 push lands must be able to push again before catching up.
//   what lands    one commit on a fresh branch from main's tip, opened and set
//                 to land itself once CI is green. Only projects/<slug>/ is in
//                 it, so it never waits on review.
//   afterwards    once it has landed, and only if this checkout is on main,
//                 the pushed files are staged as they went live and main is
//                 fast-forwarded — the laptop catches up without losing
//                 anything newer. If that can't be done cleanly nothing is
//                 left changed.
//
// The one push in flight per project is remembered in the git directory, so a
// dev-server restart doesn't forget it.
// =============================================================================

import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { GitHub, GitHubError, githubLocalConfig, kebab, type ChangeState } from '@/platform/design/github'
import { projectFacts, whyNot } from '@/platform/design/server/common'
import type { PushFile } from '../protocol'

const run = promisify(execFile)
const ROOT = process.cwd()

async function git(args: string[]): Promise<string> {
  const { stdout } = await run('git', args, { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, encoding: 'utf8' })
  return stdout
}

export interface InFlight {
  branch: string
  number: number
  /** Blob SHA each path went live with; null for a deletion. */
  files: Record<string, string | null>
  at: number
}

export interface LocalStatus {
  files: PushFile[]
  /** Paths main changed since this laptop last updated. */
  conflicts: string[]
}

// --- what counts ---------------------------------------------------------------

/** path → blob SHA for everything under `dir` at `rev`. */
async function tree(rev: string, dir: string): Promise<Map<string, { sha: string; mode: string }>> {
  const out = await git(['ls-tree', '-r', '-z', '--full-tree', rev, '--', dir])
  const map = new Map<string, { sha: string; mode: string }>()
  for (const row of out.split('\0').filter(Boolean)) {
    const tab = row.indexOf('\t')
    const [mode, , sha] = row.slice(0, tab).split(' ')
    map.set(row.slice(tab + 1), { sha, mode })
  }
  return map
}

/** Working-copy blob SHAs; a missing file maps to null. */
async function working(paths: string[]): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>()
  const present = paths.filter((p) => existsSync(path.join(ROOT, p)))
  for (const p of paths) map.set(p, null)
  if (present.length > 0) {
    const out = (await git(['hash-object', '--', ...present])).trim().split('\n')
    present.forEach((p, i) => map.set(p, out[i]))
  }
  return map
}

async function mainRef(): Promise<string> {
  try {
    return (await git(['rev-parse', '--verify', '-q', 'origin/main'])).trim()
  } catch {
    return (await git(['rev-parse', 'HEAD'])).trim()
  }
}

async function scan(slug: string): Promise<LocalStatus & { modes: Map<string, string> }> {
  const dir = `projects/${slug}/`
  const main = await mainRef()
  const base = (await git(['merge-base', 'HEAD', main])).trim()
  const ours = await landed(slug)

  const touched = new Set<string>()
  for (const out of [
    await git(['diff', '--name-only', '-z', '--no-renames', base, '--', dir]),
    await git(['ls-files', '--others', '--exclude-standard', '-z', '--', dir]),
  ]) {
    for (const p of out.split('\0').filter(Boolean)) touched.add(p)
  }

  const [atMain, atBase, now] = await Promise.all([tree(main, dir), tree(base, dir), working([...touched])])
  const files: PushFile[] = []
  const conflicts: string[] = []
  const modes = new Map<string, string>()
  for (const p of [...touched].sort()) {
    const w = now.get(p) ?? null
    const m = atMain.get(p)?.sha ?? null
    if (w === m) continue
    if ((atBase.get(p)?.sha ?? null) !== m && !(p in ours && ours[p] === m)) conflicts.push(p)
    files.push({ path: p, change: m === null ? 'added' : w === null ? 'deleted' : 'changed' })
    const mode = atMain.get(p)?.mode
    if (mode) modes.set(p, mode)
  }
  return { files, conflicts, modes }
}

export async function localStatus(slug: string): Promise<LocalStatus> {
  const { files, conflicts } = await scan(slug)
  return { files, conflicts }
}

// --- the push in flight --------------------------------------------------------

async function recordPath(slug: string, kind = ''): Promise<string> {
  const gitDir = (await git(['rev-parse', '--absolute-git-dir'])).trim()
  return path.join(gitDir, 'studio-push', `${slug}${kind}.json`)
}

/** What this laptop's pushes have landed, per path — see "what refuses". */
async function landed(slug: string): Promise<Record<string, string | null>> {
  try {
    return JSON.parse(await readFile(await recordPath(slug, '.landed'), 'utf8')) as Record<string, string | null>
  } catch {
    return {}
  }
}

/** Add a landed push's files; drop the ones this laptop has since caught up on. */
async function rememberLanded(slug: string, files: Record<string, string | null>) {
  const head = await tree('HEAD', `projects/${slug}/`)
  const all = { ...(await landed(slug)), ...files }
  const left = Object.fromEntries(Object.entries(all).filter(([p, sha]) => (head.get(p)?.sha ?? null) !== sha))
  const file = await recordPath(slug, '.landed')
  if (Object.keys(left).length === 0) return rm(file, { force: true })
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(left, null, 2))
}

export async function inFlight(slug: string): Promise<InFlight | null> {
  try {
    return JSON.parse(await readFile(await recordPath(slug), 'utf8')) as InFlight
  } catch {
    return null
  }
}

async function remember(slug: string, record: InFlight | null) {
  const file = await recordPath(slug)
  if (!record) return rm(file, { force: true })
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(record, null, 2))
}

export class PushRefused extends Error {}

async function github(): Promise<GitHub> {
  let origin: string | null = null
  try {
    origin = (await git(['remote', 'get-url', 'origin'])).trim()
  } catch {
    // No origin: only the STUDIO_GH_REPO_* names can say where to push.
  }
  const config = githubLocalConfig(origin)
  if (!config) {
    throw new PushRefused('Push needs the studio’s GitHub App on this laptop (STUDIO_GH_APP_* in .env.local).')
  }
  // `sha` is the build commit on a deployment; nothing here reads it.
  return new GitHub({ ...config, sha: '' })
}

/** Lint just what is going out — seconds, and it's what CI would refuse. */
async function lint(files: PushFile[]): Promise<string | null> {
  const code = files.filter((f) => f.change !== 'deleted' && /\.(tsx?|jsx?)$/.test(f.path)).map((f) => f.path)
  if (code.length === 0) return null
  try {
    await run('npx', ['eslint', '--quiet', '--', ...code], { cwd: ROOT, maxBuffer: 16 * 1024 * 1024 })
    return null
  } catch (err) {
    const out = String((err as { stdout?: string }).stdout ?? '')
    const problems = out
      .split('\n')
      .filter((l) => /^\s+\d+:\d+\s+error/.test(l))
      .slice(0, 3)
      .map((l) => l.trim().replace(/\s{2,}/g, ' '))
    return problems.length ? problems.join('\n') : 'The checks did not pass.'
  }
}

export async function push(slug: string, name: string): Promise<{ number: number; files: PushFile[] }> {
  const facts = await projectFacts(slug)
  if (!facts) throw new PushRefused('That is not a project I recognise.')
  const blocked = whyNot(facts, name)
  if (blocked) throw new PushRefused(blocked)

  const previous = await inFlight(slug)
  const gh = await github()
  if (previous) {
    const state = await gh.changeState(previous.branch)
    if (state === 'waiting') throw new PushRefused('Your last push is still on its way. Wait for it to go live first.')
    // A failed push is replaced by this one, not left lying open beside it.
    if (state === 'failed') await gh.closePull(previous.number)
    await remember(slug, null)
  }

  await git(['fetch', '--quiet', 'origin', 'main'])
  const { files, conflicts, modes } = await scan(slug)
  if (files.length === 0) throw new PushRefused('Nothing to push — this project already matches what’s live.')
  if (conflicts.length > 0) {
    const names = conflicts.map((p) => p.slice(`projects/${slug}/`.length))
    throw new PushRefused(
      `Someone changed ${names.join(', ')} since this laptop last updated, so pushing would undo their change. ` +
        'Ask your agent to bring the project up to date, then push again.',
    )
  }

  const problems = await lint(files)
  if (problems) throw new PushRefused(`The checks found a problem, so nothing was pushed:\n${problems}`)

  const parent = await gh.branchSha('main')
  if (parent !== (await mainRef())) throw new PushRefused('Something just went live. Push again in a moment.')

  const changes = await Promise.all(
    files.map(async (f) => ({
      path: f.path,
      mode: modes.get(f.path),
      content: f.change === 'deleted' ? null : await readFile(path.join(ROOT, f.path)),
    })),
  )
  const title = `[${slug}] Changes from the studio (${name})`
  const branch = `${slug}/studio-${kebab(name)}-${Date.now().toString(36)}`
  const blobs = await gh.commitFiles(branch, parent, changes, title)
  const pull = await gh.openPull(
    branch,
    title,
    [
      `Pushed by ${name} from the studio on their laptop, on top of main at ${parent.slice(0, 7)}.`,
      '',
      ...files.map((f) => `- ${f.change} \`${f.path}\``),
      '',
      `Only \`projects/${slug}/\` is touched; it lands on its own once CI is green.`,
    ].join('\n'),
  )
  await gh.autoMerge(pull, title)
  await remember(slug, { branch, number: pull.number, files: blobs, at: Date.now() })
  return { number: pull.number, files }
}

// --- afterwards ------------------------------------------------------------------

/**
 * Where the push in flight has got to. Once it has landed, catch this laptop
 * up and forget it; a closed one is forgotten; a failed one is kept so the
 * button can say so until it's pushed again.
 */
export async function check(slug: string): Promise<ChangeState | 'none'> {
  const record = await inFlight(slug)
  if (!record) return 'none'
  const state = await (await github()).changeState(record.branch)
  if (state === 'landed') {
    await catchUp(record).catch(() => undefined)
    await rememberLanded(slug, record.files)
    await remember(slug, null)
  } else if (state === 'closed' || state === 'none') {
    await remember(slug, null)
  }
  return state
}

/**
 * Bring this checkout to the main the push landed on — only on main, only for
 * files still exactly as they were pushed, and only as a fast-forward. Staging
 * those files first is what lets the fast-forward through: they already hold
 * what main now holds. Anything in the way and the staging is taken back, so
 * the working copy is exactly as it was.
 */
export async function catchUp(record: InFlight) {
  if ((await git(['branch', '--show-current'])).trim() !== 'main') return
  await git(['fetch', '--quiet', 'origin', 'main'])
  const now = await working(Object.keys(record.files))
  const same = Object.keys(record.files).filter((p) => now.get(p) === record.files[p])
  const written = same.filter((p) => record.files[p] !== null)
  const deleted = same.filter((p) => record.files[p] === null)
  if (written.length) await git(['add', '--', ...written])
  if (deleted.length) await git(['rm', '--cached', '--quiet', '--ignore-unmatch', '--', ...deleted])
  try {
    await git(['merge', '--ff-only', '--quiet', 'origin/main'])
  } finally {
    // Landed: these now match HEAD, so this is a no-op. Refused: it puts the
    // index back exactly as it was. Either way nothing is left staged.
    if (same.length) await git(['reset', '--quiet', '--', ...same]).catch(() => undefined)
  }
}

export function reasonOf(err: unknown): string {
  if (err instanceof PushRefused || err instanceof GitHubError) return err.message
  return 'Push didn’t work — GitHub or git didn’t answer. Try again in a moment.'
}
