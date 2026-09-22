// =============================================================================
// Design · the `github` backend (D4) — design mode on the deployed link.
//
// A deployment has no files to write, so Apply commits instead: to a branch
// named for the project, the designer and the deployment, through the studio's
// GitHub App. Push opens the change and lets it land itself once CI is green,
// exactly as a designer's agent does from a laptop.
//
// The branch is a PURE FUNCTION of the build and the edit list (plan § A4):
//
//   branch  <slug>/design-<name>-<build sha, 7>
//   file    applyEdits(file @ build sha, every edit made on this deployment)
//
// Every Apply re-sends the whole list for the file, and the file is rebuilt
// from the build's copy, so there is no drift between presses and undo is
// "drop the entry and apply again". The build SHA is in the branch name
// because a branch cut from an older deployment would, once this file is
// rewritten on it, carry every OTHER file as it was then — and quietly revert
// whatever landed on main since.
//
// Credentials never leave the server. The App's key signs a JWT, the JWT buys
// an installation token, and the token lives for one request.
//
// No dependency beyond `fetch` and `node:crypto`; `fetch` is injectable so the
// tests can stand in for GitHub.
// =============================================================================

import { createSign } from 'crypto'

export interface GitHubConfig {
  appId: string
  privateKey: string
  installationId: string
  owner: string
  repo: string
  /** The commit this deployment was built from. */
  sha: string
  /** The branch changes land on. */
  base: string
  /** GitHub's API root — overridable for GitHub Enterprise, and for testing. */
  api?: string
}

/**
 * The App's configuration, or null when this deployment has none — in which
 * case design mode on the link stays in Collect mode, as before D4.
 *
 * The repo and build commit come from Vercel's own system variables; the
 * `STUDIO_GH_*` names override them for anywhere else.
 *
 * Only a deployment of the base branch qualifies. A preview built from a
 * feature branch has a build commit main doesn't have: a change branch cut
 * from it would carry that feature's other files into the change, and land
 * them with it.
 */
export function githubConfig(env: NodeJS.ProcessEnv = process.env): GitHubConfig | null {
  const appId = env.STUDIO_GH_APP_ID
  const key = env.STUDIO_GH_APP_PRIVATE_KEY
  const installationId = env.STUDIO_GH_APP_INSTALLATION_ID
  const owner = env.STUDIO_GH_REPO_OWNER ?? env.VERCEL_GIT_REPO_OWNER
  const repo = env.STUDIO_GH_REPO_SLUG ?? env.VERCEL_GIT_REPO_SLUG
  const sha = env.STUDIO_GH_BUILD_SHA ?? env.VERCEL_GIT_COMMIT_SHA
  if (!appId || !key || !installationId || !owner || !repo || !sha) return null
  const base = env.STUDIO_GH_BASE_BRANCH ?? 'main'
  if (env.VERCEL_ENV && env.VERCEL_ENV !== 'production') return null
  if (env.VERCEL_GIT_COMMIT_REF && env.VERCEL_GIT_COMMIT_REF !== base) return null
  return {
    appId,
    // Vercel stores a multi-line PEM fine, but a key pasted as one line with
    // literal `\n` is the common way it arrives; accept both.
    privateKey: key.includes('\\n') ? key.replace(/\\n/g, '\n') : key,
    installationId,
    owner,
    repo,
    sha,
    base,
    api: env.STUDIO_GH_API_URL,
  }
}

/**
 * The App's configuration for Push on the dev server, or null without it.
 *
 * Same App, same variables, but no build commit: a laptop's changes are cut
 * from main's tip at the moment of pushing, not from a deployment. The repo
 * comes from `origin` when the `STUDIO_GH_REPO_*` names aren't set.
 */
export function githubLocalConfig(
  origin: string | null,
  env: NodeJS.ProcessEnv = process.env,
): Omit<GitHubConfig, 'sha'> | null {
  const appId = env.STUDIO_GH_APP_ID
  const key = env.STUDIO_GH_APP_PRIVATE_KEY
  const installationId = env.STUDIO_GH_APP_INSTALLATION_ID
  const fromOrigin = origin?.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/)
  const owner = env.STUDIO_GH_REPO_OWNER ?? fromOrigin?.[1]
  const repo = env.STUDIO_GH_REPO_SLUG ?? fromOrigin?.[2]
  if (!appId || !key || !installationId || !owner || !repo) return null
  return {
    appId,
    privateKey: key.includes('\\n') ? key.replace(/\\n/g, '\n') : key,
    installationId,
    owner,
    repo,
    base: env.STUDIO_GH_BASE_BRANCH ?? 'main',
    api: env.STUDIO_GH_API_URL,
  }
}

/** One file in a multi-file commit: new contents, or null to delete it. */
export interface TreeChange {
  path: string
  /** File bytes; null deletes the path. */
  content: Buffer | null
  /** Git file mode; ordinary files are 100644. */
  mode?: string
}

const b64url = (input: string | Buffer) =>
  Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

/** The App's own short-lived JWT (RS256), as GitHub specifies it. */
export function appJwt(appId: string, privateKey: string, nowMs = Date.now()): string {
  const now = Math.floor(nowMs / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  // Backdated a minute for clock drift; GitHub caps the lifetime at ten.
  const payload = b64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }))
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${payload}`)
  return `${header}.${payload}.${b64url(signer.sign(privateKey))}`
}

/** `Hazki Hariowibowo` → `hazki-hariowibowo`, for a branch name. */
export function kebab(name: string): string {
  return (
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'designer'
  )
}

export function branchFor(slug: string, name: string, sha: string): string {
  return `${slug}/design-${kebab(name)}-${sha.slice(0, 7)}`
}

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

type Fetch = typeof fetch

/** See `GitHub.changeState`. */
export type ChangeState = 'none' | 'waiting' | 'failed' | 'landed' | 'closed'

/** Check conclusions that stop a change landing. `neutral` and `skipped` don't. */
const FAILED = new Set(['failure', 'timed_out', 'cancelled', 'action_required', 'startup_failure', 'stale'])

export class GitHub {
  private token: string | null = null
  private readonly api: string

  constructor(
    readonly config: GitHubConfig,
    private readonly fetchImpl: Fetch = fetch,
  ) {
    this.api = (config.api ?? 'https://api.github.com').replace(/\/+$/, '')
  }

  private async installationToken(): Promise<string> {
    if (this.token) return this.token
    const res = await this.fetchImpl(
      `${this.api}/app/installations/${this.config.installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          accept: 'application/vnd.github+json',
          authorization: `Bearer ${appJwt(this.config.appId, this.config.privateKey)}`,
          'x-github-api-version': '2022-11-28',
        },
      },
    )
    if (!res.ok) throw new GitHubError('The studio could not sign in to GitHub.', res.status)
    const body = (await res.json()) as { token: string }
    this.token = body.token
    return body.token
  }

  private async call<T>(method: string, path: string, body?: unknown): Promise<{ status: number; data: T | null }> {
    const token = await this.installationToken()
    const res = await this.fetchImpl(`${this.api}${path}`, {
      method,
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'x-github-api-version': '2022-11-28',
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    const data = text ? (JSON.parse(text) as T) : null
    return { status: res.status, data }
  }

  private repoPath(rest: string) {
    return `/repos/${this.config.owner}/${this.config.repo}${rest}`
  }

  /** A file's text and blob SHA at `ref`, or null when it isn't there. */
  async getFile(path: string, ref: string): Promise<{ text: string; sha: string } | null> {
    const { status, data } = await this.call<{ content: string; encoding: string; sha: string }>(
      'GET',
      this.repoPath(`/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`),
    )
    if (status === 404) return null
    if (status !== 200 || !data) throw new GitHubError('That screen could not be read from GitHub.', status)
    return { text: Buffer.from(data.content, 'base64').toString('utf8'), sha: data.sha }
  }

  /** Create `branch` at `sha` unless it exists. Returns whether it existed. */
  async ensureBranch(branch: string, sha: string): Promise<boolean> {
    const found = await this.call('GET', this.repoPath(`/git/ref/heads/${encodePath(branch)}`))
    if (found.status === 200) return true
    if (found.status !== 404) throw new GitHubError('The studio could not check its branch.', found.status)
    const made = await this.call('POST', this.repoPath('/git/refs'), { ref: `refs/heads/${branch}`, sha })
    if (made.status !== 201) throw new GitHubError('The studio could not start a branch for this change.', made.status)
    return false
  }

  /** Commit `text` as `path` on `branch`. `blobSha` is the file's current blob there. */
  async putFile(branch: string, path: string, text: string, blobSha: string, message: string): Promise<void> {
    const { status } = await this.call('PUT', this.repoPath(`/contents/${encodePath(path)}`), {
      message,
      content: Buffer.from(text, 'utf8').toString('base64'),
      branch,
      sha: blobSha,
    })
    if (status !== 200 && status !== 201) {
      throw new GitHubError(
        status === 409 ? 'Someone else changed this at the same moment — apply again.' : 'The change could not be saved to GitHub.',
        status,
      )
    }
  }

  /** The commit a branch points at. */
  async branchSha(branch: string): Promise<string> {
    const { status, data } = await this.call<{ object: { sha: string } }>(
      'GET',
      this.repoPath(`/git/ref/heads/${encodePath(branch)}`),
    )
    if (status !== 200 || !data) throw new GitHubError('The studio could not read main from GitHub.', status)
    return data.object.sha
  }

  /**
   * Commit several files at once on top of `parent`, and start `branch` at the
   * result — one commit, however many files, so a push can't half-land.
   * Returns each written path's blob SHA (git's own hash of the contents).
   */
  async commitFiles(
    branch: string,
    parent: string,
    changes: TreeChange[],
    message: string,
  ): Promise<Record<string, string | null>> {
    const parentCommit = await this.call<{ tree: { sha: string } }>('GET', this.repoPath(`/git/commits/${parent}`))
    if (parentCommit.status !== 200 || !parentCommit.data) {
      throw new GitHubError('The studio could not read main from GitHub.', parentCommit.status)
    }

    const blobs: Record<string, string | null> = {}
    const tree: { path: string; mode: string; type: 'blob'; sha: string | null }[] = []
    for (const change of changes) {
      let sha: string | null = null
      if (change.content) {
        const blob = await this.call<{ sha: string }>('POST', this.repoPath('/git/blobs'), {
          content: change.content.toString('base64'),
          encoding: 'base64',
        })
        if (blob.status !== 201 || !blob.data) throw new GitHubError('A file could not be sent to GitHub.', blob.status)
        sha = blob.data.sha
      }
      blobs[change.path] = sha
      tree.push({ path: change.path, mode: change.mode ?? '100644', type: 'blob', sha })
    }

    const made = await this.call<{ sha: string }>('POST', this.repoPath('/git/trees'), {
      base_tree: parentCommit.data.tree.sha,
      tree,
    })
    if (made.status !== 201 || !made.data) throw new GitHubError('The change could not be put together on GitHub.', made.status)

    const commit = await this.call<{ sha: string }>('POST', this.repoPath('/git/commits'), {
      message,
      tree: made.data.sha,
      parents: [parent],
    })
    if (commit.status !== 201 || !commit.data) throw new GitHubError('The change could not be committed on GitHub.', commit.status)

    const ref = await this.call('POST', this.repoPath('/git/refs'), { ref: `refs/heads/${branch}`, sha: commit.data.sha })
    if (ref.status !== 201) throw new GitHubError('The studio could not start a branch for this change.', ref.status)
    return blobs
  }

  /** Close a change without landing it — a failed push being replaced. */
  async closePull(number: number): Promise<void> {
    await this.call('PATCH', this.repoPath(`/pulls/${number}`), { state: 'closed' })
  }

  /** The open pull request from `branch`, if there is one. */
  async openPullFor(branch: string): Promise<{ number: number; nodeId: string } | null> {
    const { status, data } = await this.call<{ number: number; node_id: string }[]>(
      'GET',
      this.repoPath(`/pulls?state=open&head=${encodeURIComponent(`${this.config.owner}:${branch}`)}`),
    )
    if (status !== 200 || !data) throw new GitHubError('The studio could not check for an open change.', status)
    return data[0] ? { number: data[0].number, nodeId: data[0].node_id } : null
  }

  async openPull(branch: string, title: string, body: string): Promise<{ number: number; nodeId: string }> {
    const existing = await this.openPullFor(branch)
    if (existing) return existing
    const { status, data } = await this.call<{ number: number; node_id: string }>('POST', this.repoPath('/pulls'), {
      title,
      body,
      head: branch,
      base: this.config.base,
    })
    if (status !== 201 || !data) throw new GitHubError('The change could not be opened.', status)
    return { number: data.number, nodeId: data.node_id }
  }

  /**
   * Where the change from `branch` has got to since Push — what the panel asks
   * while it says "on its way", so a change that fails CI doesn't sit there
   * claiming to be on its way for ever.
   *
   * The newest change from the branch decides: merged → `landed`, closed
   * unmerged → `closed`, open with a finished check that didn't pass →
   * `failed`, otherwise `waiting`. Checks need the App's "Checks: read"; an App
   * without it reads as `waiting`, which is what the panel said before this
   * existed, rather than as an error.
   */
  async changeState(branch: string): Promise<ChangeState> {
    const pulls = await this.call<{ state: string; merged_at: string | null; head: { sha: string } }[]>(
      'GET',
      this.repoPath(`/pulls?state=all&head=${encodeURIComponent(`${this.config.owner}:${branch}`)}`),
    )
    if (pulls.status !== 200 || !pulls.data) throw new GitHubError('The studio could not check on your push.', pulls.status)
    const pull = pulls.data[0]
    if (!pull) return 'none'
    if (pull.merged_at) return 'landed'
    if (pull.state !== 'open') return 'closed'

    const checks = await this.call<{ check_runs: { status: string; conclusion: string | null }[] }>(
      'GET',
      this.repoPath(`/commits/${pull.head.sha}/check-runs?per_page=100`),
    )
    if (checks.status !== 200 || !checks.data) return 'waiting'
    const failed = checks.data.check_runs.some(
      (run) => run.status === 'completed' && FAILED.has(run.conclusion ?? ''),
    )
    return failed ? 'failed' : 'waiting'
  }

  /**
   * Let it land itself once CI is green — `gh pr merge --auto --squash`.
   * GitHub refuses when the PR can already merge ("clean status"); that is a
   * success here, and the merge is done directly instead.
   *
   * `title` is what lands on main. Left to GitHub, a squash of a one-commit
   * branch takes that commit's message instead of the change's title.
   */
  async autoMerge(pull: { number: number; nodeId: string }, title: string): Promise<void> {
    const headline = `${title} (#${pull.number})`
    const { status, data } = await this.call<{ errors?: { message: string }[] }>('POST', '/graphql', {
      query:
        'mutation($id: ID!, $headline: String!) { enablePullRequestAutoMerge(input: { pullRequestId: $id, mergeMethod: SQUASH, commitHeadline: $headline }) { clientMutationId } }',
      variables: { id: pull.nodeId, headline },
    })
    const errors = data?.errors ?? []
    if (status === 200 && errors.length === 0) return
    if (errors.some((e) => /clean status/i.test(e.message))) {
      const merged = await this.call('PUT', this.repoPath(`/pulls/${pull.number}/merge`), {
        merge_method: 'squash',
        commit_title: headline,
      })
      if (merged.status === 200) return
    }
    throw new GitHubError('The change was opened but could not be set to go live on its own.', status)
  }
}

const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/')
