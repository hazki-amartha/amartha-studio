// =============================================================================
// Edit · FunDS component prop vocabulary.
//
// Hand-maintained from the component sources (the unions in
// design-system/components/*.tsx are the truth; this map is their menu form).
// A component's internal styling is never editable per-instance — that would
// fork the design system one screen at a time — so the edit panel offers
// exactly these enumerated props instead.
//
// `attr` is the data-fds-* suffix the component renders (kebab-case), `prop`
// is the JSX attribute the source actually spells (camelCase) — the server
// rewrites source, so it needs the JSX spelling.
// =============================================================================

export interface EditableProp {
  /** JSX attribute name as written in source, e.g. `inputType`. */
  prop: string
  /** `data-fds-` attribute suffix as rendered, e.g. `input-type`. */
  attr: string
  values: string[]
}

export const COMPONENT_PROPS: Record<string, EditableProp[]> = {
  Button: [
    { prop: 'variant', attr: 'variant', values: ['primary', 'secondary', 'outline', 'ghost', 'danger'] },
    { prop: 'size', attr: 'size', values: ['xs', 'sm', 'md', 'lg', 'xl'] },
  ],
  Badge: [
    { prop: 'intent', attr: 'intent', values: ['primary', 'blue', 'green', 'orange', 'red', 'yellow', 'neutral'] },
    { prop: 'variant', attr: 'variant', values: ['solid', 'subtle', 'outline', 'inverted'] },
    { prop: 'size', attr: 'size', values: ['sm', 'md'] },
  ],
  Input: [
    { prop: 'size', attr: 'size', values: ['sm', 'md', 'lg'] },
    { prop: 'state', attr: 'state', values: ['default', 'focus', 'valid', 'error'] },
  ],
  Toggle: [{ prop: 'size', attr: 'size', values: ['sm', 'md'] }],
  Modal: [
    { prop: 'size', attr: 'size', values: ['sm', 'md', 'lg'] },
    { prop: 'variant', attr: 'variant', values: ['default', 'dialog'] },
    { prop: 'intent', attr: 'intent', values: ['success', 'warning', 'error', 'info'] },
  ],
  BottomSheet: [{ prop: 'size', attr: 'size', values: ['sm', 'md', 'fullscreen'] }],
  NavigationHeader: [{ prop: 'variant', attr: 'variant', values: ['light', 'dark'] }],
  SelectableCard: [
    { prop: 'size', attr: 'size', values: ['sm', 'md'] },
    { prop: 'inputType', attr: 'input-type', values: ['radio', 'checkbox'] },
  ],
}
