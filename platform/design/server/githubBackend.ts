// =============================================================================
// Design · the `github` backend, behind the route (D4). See ../github.ts for
// the branch model; this is the request handling around it.
// =============================================================================

import { NextResponse } from 'next/server'
import { applyEdits } from '../applyEdits'
import { branchFor, GitHub, GitHubError, type GitHubConfig } from '../github'
import type { DesignPushRequest, DesignRequest, DesignResponse } from '../protocol'
import { versionOf } from '../version'
import { batchFile, iconNamesIn, projectFacts, refuse, whyNot } from './common'

type Fetch = typeof fetch

/** Icon names at the build commit, read once per deployment. */
const iconCache = new Map<string, Promise<Set<string>>>()
function iconNames(gh: GitHub): Promise<Set<string>> {
  const key = gh.config.sha
  let names = iconCache.get(key)
  if (!names) {
    names = gh
      .getFile('design-system/icons/index.tsx', key)
      .then((f) => iconNamesIn(f?.text ?? ''))
      .catch(() => new Set<string>())
    iconCache.set(key, names)
  }
  return names
}

function failed(err: unknown): NextResponse {
  if (err instanceof GitHubError) return refuse(err.message)
  return refuse('GitHub did not answer. Try again in a moment.')
}

export async function githubApply(
  body: DesignRequest,
  config: GitHubConfig,
  fetchImpl?: Fetch,
): Promise<NextResponse> {
  if (!Array.isArray(body.edits)) return refuse('That request could not be read.')
  const facts = await projectFacts(body.slug)
  if (!facts) return refuse('That is not a project I recognise.')
  const blocked = whyNot(facts, body.name)
  if (blocked) return refuse(blocked)

  const target = batchFile(body)
  if ('reason' in target) return refuse(target.reason)
  const { file } = target
  const gh = new GitHub(config, fetchImpl)

  try {
    // Always from the build's copy: the addresses on screen are positions in
    // exactly that file, and the list carries every edit made on it.
    const built = await gh.getFile(file, config.sha)
    if (!built) return refuse('That screen file could not be found in this version of the studio.')
    if (body.version && versionOf(built.text) !== body.version) {
      return refuse('A newer version of this screen is live. Refresh the page, then make the change again.')
    }

    const result = applyEdits(built.text, body.edits, { icons: await iconNames(gh) })
    if (!result.ok) return refuse(result.refused.reason)

    const branch = branchFor(body.slug, body.name!, config.sha)
    await gh.ensureBranch(branch, config.sha)
    const current = await gh.getFile(file, branch)
    if (!current) return refuse('That screen file is missing from the change branch.')

    if (current.text !== result.source) {
      const n = body.edits.length
      const message =
        n === 0
          ? `[${body.slug}] Design mode: undo changes to ${file.split('/').pop()} (${body.name})`
          : `[${body.slug}] Design mode: ${n} change${n === 1 ? '' : 's'} to ${file.split('/').pop()} (${body.name})`
      await gh.putFile(branch, file, result.source, current.sha, message)
    }

    return NextResponse.json({
      ok: true,
      file,
      version: versionOf(result.source),
    } satisfies DesignResponse)
  } catch (err) {
    return failed(err)
  }
}

export async function githubPush(
  body: DesignPushRequest,
  config: GitHubConfig,
  fetchImpl?: Fetch,
): Promise<NextResponse> {
  const facts = await projectFacts(body.slug)
  if (!facts) return refuse('That is not a project I recognise.')
  const blocked = whyNot(facts, body.name)
  if (blocked) return refuse(blocked)

  const gh = new GitHub(config, fetchImpl)
  const branch = branchFor(body.slug, body.name, config.sha)
  try {
    // Push never creates the branch: if nothing was applied there is nothing
    // to open.
    const existed = await gh.getFile(`projects/${body.slug}/project.config.ts`, branch)
    if (!existed) return refuse('Nothing has been applied yet, so there is nothing to push.')

    const pull = await gh.openPull(
      branch,
      `[${body.slug}] Design changes from the studio (${body.name})`,
      [
        `Made by ${body.name} in design mode on the deployed studio, against ${config.sha.slice(0, 7)}.`,
        '',
        `Only \`projects/${body.slug}/\` is touched; it lands on its own once CI is green.`,
      ].join('\n'),
    )
    await gh.autoMerge(pull)
    return NextResponse.json({ ok: true, pushed: true } satisfies DesignResponse)
  } catch (err) {
    return failed(err)
  }
}
