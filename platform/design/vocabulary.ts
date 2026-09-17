// =============================================================================
// Design · the structural vocabulary shared by the write side and the panel.
//
// Kept in its own dependency-free module because both sides need it and only
// one of them may pull in recast: structure.ts (server) decides whether a JSX
// element can hold children, and the drag layer (client) decides where a drop
// can land. They must agree, or the panel offers drops the write refuses.
// =============================================================================

/**
 * FunDS and primitive components that render their `children` as a body other
 * elements can be dropped into. Hand-maintained from the cheatsheet: Button and
 * Badge take children too, but as a label, and a card dropped into a button is
 * not a layout anyone meant. Modal and BottomSheet take content through `slot`,
 * which is a prop, not children.
 */
export const CONTAINER_COMPONENTS: readonly string[] = ['Card', 'Screen', 'TopBar']

/** Design-system components that take children only as content, or not at all. */
export const LEAF_COMPONENTS: readonly string[] = [
  'Button', 'Badge', 'ListRow', 'Input', 'InputNominal', 'Toggle', 'SelectableCard',
  'OfferCard', 'Modal', 'BottomSheet', 'NavigationBar', 'NavigationHeader', 'AppShell',
]

/** HTML elements that cannot sensibly take child elements. */
export const VOID_TAGS: readonly string[] = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'source', 'track', 'wbr', 'textarea', 'select', 'option', 'svg', 'path',
]
