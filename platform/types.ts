// =============================================================================
// Drafting Board — shared contracts. This file IS the contract: the types
// below define what a project exports and what the runtime provides.
// FROZEN: changes to this file require the owner's sign-off and a notice to
// all active workstreams. Extend privately or request a contract change.
// =============================================================================

import type { ComponentType } from 'react'

/** Device presentation for the prototype view. v1 ships 'mobile' only;
 *  the enum exists so desktop prototypes don't need a contract change. */
export type DeviceKind = 'mobile' | 'desktop'

export type ProjectStatus = 'draft' | 'in-review' | 'final'

export interface ProjectConfig {
  /** URL slug, kebab-case, unique across the repo. */
  slug: string
  /** Display name shown in the gallery and prototype chrome. */
  name: string
  /** Designer's name — ownership is checked against this by convention. */
  owner: string
  /** One-paragraph description for the gallery card. */
  description: string
  device: DeviceKind
  status: ProjectStatus
  /** ISO date, set at creation, never edited. */
  createdAt: string
  /** Optional annotations shown project-wide in the desktop prototype view. */
  notes?: string[]
}

export interface FlowEdge {
  /** Target screen id within the same project. */
  to: string
  /** Optional edge label, e.g. "on submit", "tap card". */
  label?: string
}

export interface ScreenDef {
  /** Unique within the project, kebab-case, stable (used in flow edges). */
  id: string
  title: string
  /** The screen component. Rendered inside the platform's Screen chrome.
   *  Receives no props; obtains navigation via useFlow(). */
  component: ComponentType
  /** Exactly one screen per project sets entry: true. */
  entry?: boolean
  /** Annotations shown beside the device in desktop prototype view
   *  while this screen is active. */
  notes?: string[]
  /** Outgoing edges rendered in flow view. Purely descriptive metadata —
   *  actual navigation happens via useFlow().go(id) inside the component. */
  flowsTo?: FlowEdge[]
}

export interface ProjectModule {
  config: ProjectConfig
  screens: ScreenDef[]
}

/** projects/registry.ts exports this. Append-only. */
export type Registry = Record<string /* slug */, () => Promise<ProjectModule>>

/** Runtime navigation API — implemented in platform/runtime (WS-A),
 *  consumed by every project screen via useFlow(). */
export interface FlowApi {
  /** Navigate to a screen by id (push). */
  go(id: string): void
  /** Go back one screen in the visit stack. */
  back(): void
  /** Currently active screen id. */
  current: string
}
