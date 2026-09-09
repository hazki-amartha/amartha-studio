// =============================================================================
// Project resolution — turns a registry entry into the screen list the runtime
// actually runs. A project that `extends` a base gets the base's screens merged
// under its own: same-id screens are overridden, the rest are inherited. Every
// consumer of a project's screens (prototype view, flow view, page explorer,
// check:flows) goes through here so they agree on what a project contains.
// Internal runtime plumbing — not part of the frozen contract.
// =============================================================================

import type { ProjectConfig, ProjectModule, Registry, ScreenDef } from '@/platform/types'

export interface ResolvedProject {
  config: ProjectConfig
  /** Screens the runtime navigates over: `own` first, then `inherited`. */
  screens: ScreenDef[]
  /** Screens declared by the project itself, in declared order. */
  own: ScreenDef[]
  /** Base screens the project did not override. Empty without `extends`. */
  inherited: ScreenDef[]
  /** The base project's config, when `extends` names one that exists. */
  base?: ProjectConfig
  /** Base screen ids the project replaced with its own. */
  overrides: string[]
}

/** Merge a project with its base. Pure — exported so check:flows can validate
 *  the same merge the runtime performs. */
export function mergeProject(project: ProjectModule, base?: ProjectModule): ResolvedProject {
  const own = project.screens
  if (!base) return { config: project.config, screens: own, own, inherited: [], overrides: [] }

  const ownIds = new Set(own.map((s) => s.id))
  const overrides: string[] = []
  const inherited: ScreenDef[] = []
  for (const screen of base.screens) {
    if (ownIds.has(screen.id)) {
      overrides.push(screen.id)
      continue
    }
    // The extending project decides where the prototype opens — a base's
    // entry flag must not compete with it.
    inherited.push(screen.entry ? { ...screen, entry: false } : screen)
  }
  return {
    config: project.config,
    screens: [...own, ...inherited],
    own,
    inherited,
    base: base.config,
    overrides,
  }
}

/** Load a project and, when it extends one, its base. Unknown slug → null.
 *  A base that itself extends is loaded as-is (one level only); check:flows
 *  rejects the chain so it never reaches here in a green build. */
export async function resolveProject(
  registry: Registry,
  slug: string,
): Promise<ResolvedProject | null> {
  const load = registry[slug]
  if (!load) return null
  const project = await load()
  const baseSlug = project.config.extends
  const base = baseSlug ? await registry[baseSlug]?.() : undefined
  if (baseSlug && !base) {
    console.warn(`${slug}: extends "${baseSlug}", which is not in projects/registry.ts — running without it.`)
  }
  return mergeProject(project, base)
}
