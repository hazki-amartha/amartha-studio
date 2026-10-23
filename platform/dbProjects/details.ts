// =============================================================================
// DB projects · rename a project, or change who owns it (./detailsMeta.ts says
// what crosses the wire).
//
// Server-only. Who may: the project's owner or a studio admin — the same people
// who may delete it (./trash.ts). Both live in project.config.ts, so the change
// is a rewrite of its `name:` and `owner:` lines, checked by running the result
// before it's saved. The slug never changes: links to the project keep working.
//
// A laptop holds no database key, so it passes the request on to the deployed
// studio as the designer signed in here; the studio decides.
// =============================================================================

import { knownNames } from '@/platform/auth/profiles'
import { remote } from './remote'
import { configOf, createAdminClient, forgetDbConfigs, listDbConfigs, readDbFiles, saveDbFiles } from './server'
import { owns, type Deleter } from './trash'
import { NAME_MAX, type DetailsChange, type DetailsResult } from './detailsMeta'

const CONFIG = 'project.config.ts'
const same = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase()
const tidy = (s: string) => s.trim().replace(/\s+/g, ' ')

/** A single-quoted TS string literal, as the configs are written. */
const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** `source` with the value of its top-level `key:` replaced by `literal`, or null if it has none. */
function setValue(source: string, key: string, literal: string): string | null {
  const value = new RegExp(`^(\\s*${key}\\s*:\\s*)(?:'(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*"|\\[[^\\]]*\\])`, 'm')
  return value.test(source) ? source.replace(value, (_, head: string) => `${head}${literal}`) : null
}

/** Rename `slug` and/or change its owners, as `who`. On a laptop, passed on to the studio. */
export async function editDetails(slug: string, change: DetailsChange, who: Deleter | null): Promise<DetailsResult> {
  if (!createAdminClient()) {
    const result = await remote<DetailsResult>(`/api/db-projects/${encodeURIComponent(slug)}/details`, {
      method: 'POST',
      body: JSON.stringify(change),
      write: true,
    })
    if (result.ok) forgetDbConfigs()
    return result
  }
  if (!who) return { ok: false, reason: 'Sign in as a studio editor first.' }

  const self = (await listDbConfigs()).find((c) => c.slug === slug)
  if (!self) return { ok: false, reason: 'That project isn’t in the studio.' }
  if (self.draft) return { ok: false, reason: 'A branch takes its project’s name and owners.' }
  if (self.deleted) return { ok: false, reason: 'Restore the project first.' }
  if (!owns(who, self)) return { ok: false, reason: 'Only the project’s owner or a studio admin can do that.' }

  let source = (await readDbFiles(slug)).get(CONFIG)
  if (!source) return { ok: false, reason: 'That project has no settings to change.' }

  const name = change.name === undefined ? self.name : tidy(change.name)
  if (!name) return { ok: false, reason: 'Give the project a name.' }
  if (name.length > NAME_MAX) return { ok: false, reason: `Keep the name under ${NAME_MAX} characters.` }

  let owners = [self.owner].flat()
  if (change.owners !== undefined) {
    // Only names the studio knows — the save checks hold an owner to them, and
    // a typo would leave a project nobody can manage. Spelled as the roster has it.
    const roster = [...(await knownNames()), ...owners]
    const picked: string[] = []
    for (const wanted of change.owners) {
      const known = roster.find((n) => same(n, wanted))
      if (!known) return { ok: false, reason: `The studio doesn’t know anyone called “${tidy(wanted)}”.` }
      if (!picked.some((p) => same(p, known))) picked.push(known)
    }
    if (!picked.length) return { ok: false, reason: 'A project needs at least one owner.' }
    owners = picked
  }

  if (name !== self.name) {
    const next = setValue(source, 'name', q(name))
    if (!next) return { ok: false, reason: 'The project’s settings couldn’t be changed here — ask Chat to do it.' }
    source = next
  }
  if (change.owners !== undefined) {
    const literal = owners.length === 1 ? q(owners[0]) : `[${owners.map(q).join(', ')}]`
    const next = setValue(source, 'owner', literal)
    if (!next) return { ok: false, reason: 'The project’s settings couldn’t be changed here — ask Chat to do it.' }
    source = next
  }

  // Run what's about to be saved: it must still be this project, with exactly what was asked.
  const result = configOf(slug, source)
  const resultOwners = result ? [result.owner].flat() : []
  if (!result || result.name !== name || resultOwners.join('\n') !== owners.join('\n')) {
    return { ok: false, reason: 'The project’s settings couldn’t be changed here — ask Chat to do it.' }
  }

  await saveDbFiles(slug, [{ path: CONFIG, content: source }], who.name)
  return { ok: true }
}
