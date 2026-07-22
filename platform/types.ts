// =============================================================================
// Amartha Studio — shared contracts. This file IS the contract: the types
// below define what a project exports and what the runtime provides.
// FROZEN: changes to this file require the owner's sign-off and a notice to
// all active workstreams. Extend privately or request a contract change.
// =============================================================================

import type { ComponentType } from 'react'

/** Device presentation for the prototype view. v1 ships 'mobile' only;
 *  the enum exists so desktop prototypes don't need a contract change. */
export type DeviceKind = 'mobile' | 'desktop'

export type ProjectStatus = 'draft' | 'in-review' | 'final'

/** Product the prototype belongs to. Add a member here (Tier 2) to onboard a
 *  new platform; omit the field entirely for studio-internal work. */
export type Platform = 'APartner' | 'AFIN' | 'NGMIS'

export interface ProjectConfig {
  /** URL slug, kebab-case, unique across the repo. */
  slug: string
  /** Feature or initiative name — the platform (below) carries the product. */
  name: string
  /** Product this prototype belongs to. Omit for studio-internal work. */
  platform?: Platform
  /** Designer(s) who own this — one name or several. Ownership (§1) is
   *  checked against these by convention. */
  owner: string | string[]
  /** One-paragraph description for the gallery card. */
  description: string
  device: DeviceKind
  status: ProjectStatus
  /** ISO date, set at creation, never edited. */
  createdAt: string
  /** ISO date of the last meaningful change. Omit until the first edit;
   *  the gallery falls back to createdAt when it's absent. */
  updatedAt?: string
  /** Optional annotations shown project-wide in the desktop prototype view. */
  notes?: string[]
}

export interface FlowEdge {
  /** Target screen id within the same project. */
  to: string
  /** Optional edge label, e.g. "on submit", "tap card". */
  label?: string
}

/**
 * A condition worth showing a screen in, offered as a one-click control beside
 * the device in desktop prototype view.
 *
 * It exists for the presentation, not for the prototype: explaining a concept to
 * stakeholders should not require tapping through six screens of setup to reach
 * the state being discussed, and some states (an error, a mismatch, a day that
 * has already happened) cannot be reached by tapping at all.
 *
 * The platform stays ignorant of what a state IS: it renders `label` and calls
 * `apply`. Everything behind that — seeding a module store, clearing it — is the
 * project's own code, so this adds no coupling between the runtime and a
 * project's internals.
 */
export interface ScreenState {
  /** Unique within the screen. */
  id: string
  /** Short name for the control, e.g. "Sudah 3 pelayanan". */
  label: string
  /** One line on what the state contains, shown under the label. */
  description?: string
  /** Puts the project into this state. Called on click; must be idempotent. */
  apply: () => void
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
  /** States this screen can be put into from the desktop prototype view,
   *  mirroring `notes` on the opposite side of the device. Omit when the
   *  screen only has one condition worth showing. */
  states?: ScreenState[]
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
