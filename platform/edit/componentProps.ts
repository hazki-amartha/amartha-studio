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
//
// `classes` maps each value to the `ds-*` class the component puts on itself
// for it, which is what lets a prop change repaint immediately instead of
// waiting for the file write. An empty string is a real entry, not a gap: it
// means that value is the component's default and adds no class. A prop with
// no `classes` map at all cannot be previewed (its effect isn't a class), and
// the panel says so rather than looking broken.
//
// `base` is the class the component stamps on the node it styles. It is needed
// because `data-fds` is not always on that node — Input and Toggle stamp the
// outermost wrapper when they render a labelled field, so the size class lives
// one or two levels in.
// =============================================================================

export interface EditableProp {
  /** JSX attribute name as written in source, e.g. `inputType`. */
  prop: string
  /** `data-fds-` attribute suffix as rendered, e.g. `input-type`. */
  attr: string
  values: string[]
  /** value → the `ds-*` class it produces; '' where the value is the default. */
  classes?: Record<string, string>
}

/** The class each component puts on the node carrying its own styling. */
export const COMPONENT_BASE: Record<string, string> = {
  Button: 'ds-btn',
  Badge: 'ds-badge',
  Card: 'ds-card',
  Input: 'ds-inp',
  Toggle: 'ds-toggle',
  Modal: 'ds-modal',
  BottomSheet: 'ds-sheet',
  NavigationHeader: 'ds-navhdr',
  SelectableCard: 'ds-selcard',
}

export const COMPONENT_PROPS: Record<string, EditableProp[]> = {
  Button: [
    {
      prop: 'variant',
      attr: 'variant',
      values: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
      classes: {
        primary: 'ds-btn-primary',
        secondary: 'ds-btn-secondary',
        outline: 'ds-btn-outline',
        ghost: 'ds-btn-ghost',
        danger: 'ds-btn-danger',
      },
    },
    {
      prop: 'size',
      attr: 'size',
      values: ['xs', 'sm', 'md', 'lg', 'xl'],
      classes: { xs: 'ds-btn-xs', sm: 'ds-btn-sm', md: '', lg: 'ds-btn-lg', xl: 'ds-btn-xl' },
    },
  ],
  Badge: [
    {
      prop: 'intent',
      attr: 'intent',
      values: ['primary', 'blue', 'green', 'orange', 'red', 'yellow', 'neutral'],
      classes: {
        primary: 'ds-badge-primary',
        blue: 'ds-badge-blue',
        green: 'ds-badge-green',
        orange: 'ds-badge-orange',
        red: 'ds-badge-red',
        yellow: 'ds-badge-yellow',
        neutral: 'ds-badge-neutral',
      },
    },
    {
      prop: 'variant',
      attr: 'variant',
      values: ['solid', 'subtle', 'outline', 'inverted'],
      classes: {
        solid: 'ds-badge-solid',
        subtle: '',
        outline: 'ds-badge-outline',
        inverted: 'ds-badge-inverted',
      },
    },
    {
      prop: 'size',
      attr: 'size',
      values: ['sm', 'md'],
      classes: { sm: '', md: 'ds-badge-md' },
    },
  ],
  Card: [
    {
      prop: 'radius',
      attr: 'radius',
      values: ['8', '12', '16', '20', '24'],
      classes: {
        '8': 'ds-card-r8',
        '12': 'ds-card-r12',
        '16': '',
        '20': 'ds-card-r20',
        '24': 'ds-card-r24',
      },
    },
  ],
  Input: [
    {
      prop: 'size',
      attr: 'size',
      values: ['sm', 'md', 'lg'],
      classes: { sm: 'ds-inp-sm', md: '', lg: 'ds-inp-lg' },
    },
    {
      prop: 'state',
      attr: 'state',
      values: ['default', 'focus', 'valid', 'error'],
      classes: {
        default: '',
        focus: 'ds-inp-focus',
        valid: 'ds-inp-valid',
        error: 'ds-inp-error',
      },
    },
  ],
  Toggle: [
    {
      prop: 'size',
      attr: 'size',
      values: ['sm', 'md'],
      classes: { sm: '', md: 'ds-toggle-md' },
    },
  ],
  Modal: [
    {
      prop: 'size',
      attr: 'size',
      values: ['sm', 'md', 'lg'],
      classes: { sm: 'ds-modal-sm', md: '', lg: 'ds-modal-lg' },
    },
    {
      prop: 'variant',
      attr: 'variant',
      values: ['default', 'dialog'],
      classes: { default: '', dialog: 'ds-modal-dialog' },
    },
    // Intent swaps an icon rather than a class on the dialog, so it lands with
    // the file write.
    { prop: 'intent', attr: 'intent', values: ['success', 'warning', 'error', 'info'] },
  ],
  BottomSheet: [
    {
      prop: 'size',
      attr: 'size',
      values: ['sm', 'md', 'fullscreen'],
      classes: { sm: '', md: 'ds-sheet-md', fullscreen: 'ds-sheet-fullscreen' },
    },
  ],
  NavigationHeader: [
    {
      prop: 'variant',
      attr: 'variant',
      values: ['light', 'dark'],
      classes: { light: '', dark: 'ds-navhdr-dark' },
    },
  ],
  SelectableCard: [
    {
      prop: 'size',
      attr: 'size',
      values: ['sm', 'md'],
      classes: { sm: '', md: 'ds-selcard-md' },
    },
    // radio vs checkbox is the input's `type`, not a class.
    { prop: 'inputType', attr: 'input-type', values: ['radio', 'checkbox'] },
  ],
}
