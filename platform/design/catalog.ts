// =============================================================================
// Design · what the Insert panel can add (D3).
//
// Hand-maintained, like componentProps.ts: each entry is a FunDS component (or
// a token-classed layout element) with the defaults a designer wants when it
// lands — not the component's own code defaults, which are about safety, not
// about looking like something. Every value here is a literal the write side
// can emit and the lint rule accepts.
//
// Dependency-free: the panel lists it, the overlay previews from it, and the
// backend builds JSX from it. The backend accepts nothing that isn't here.
// =============================================================================

export const DS_COMPONENTS = '@/design-system/components'
export const DS_ICONS = '@/design-system/icons'

export interface CatalogChild {
  tag: string
  props: Record<string, string>
  text?: string
}

export interface CatalogItem {
  key: string
  label: string
  group: 'Layout' | 'Text' | 'Components' | 'Icons'
  /** The JSX name. For `icon`, the chosen icon's name replaces it. */
  tag: string
  /** Where the tag is imported from; null for an HTML element. */
  from: string | null
  /** Default props. Only these keys (plus `className`) may be set. */
  props: Record<string, string>
  /** Default text child. */
  text?: string
  /** Default element children — a Card has to hold something to type-check. */
  children?: CatalogChild[]
  /** Props edited as free text rather than picked from a list. */
  textProps?: string[]
}

export const CATALOG: CatalogItem[] = [
  {
    key: 'stack',
    label: 'Stack',
    group: 'Layout',
    tag: 'div',
    from: null,
    props: { className: 'flex flex-col gap-12' },
  },
  {
    key: 'row',
    label: 'Row',
    group: 'Layout',
    tag: 'div',
    from: null,
    props: { className: 'flex items-center gap-8' },
  },
  {
    key: 'card',
    label: 'Card',
    group: 'Layout',
    tag: 'Card',
    from: DS_COMPONENTS,
    props: { className: 'flex flex-col gap-8' },
    children: [{ tag: 'p', props: { className: 'text-14 text-default' }, text: 'Isi kartu' }],
  },
  {
    key: 'heading',
    label: 'Heading',
    group: 'Text',
    tag: 'p',
    from: null,
    props: { className: 'text-16 font-bold text-default' },
    text: 'Judul',
  },
  {
    key: 'text',
    label: 'Text',
    group: 'Text',
    tag: 'p',
    from: null,
    props: { className: 'text-14 text-caption' },
    text: 'Teks',
  },
  {
    key: 'button',
    label: 'Button',
    group: 'Components',
    tag: 'Button',
    from: DS_COMPONENTS,
    props: { variant: 'primary', size: 'md' },
    text: 'Tombol',
  },
  {
    key: 'badge',
    label: 'Badge',
    group: 'Components',
    tag: 'Badge',
    from: DS_COMPONENTS,
    props: { intent: 'primary', variant: 'subtle' },
    text: 'Label',
  },
  {
    key: 'list-row',
    label: 'List row',
    group: 'Components',
    tag: 'ListRow',
    from: DS_COMPONENTS,
    props: { title: 'Judul', description: 'Keterangan' },
    textProps: ['title', 'description'],
  },
  {
    key: 'selectable-card',
    label: 'Selectable card',
    group: 'Components',
    tag: 'SelectableCard',
    from: DS_COMPONENTS,
    props: { title: 'Pilihan', description: 'Keterangan' },
    textProps: ['title', 'description'],
  },
  {
    key: 'toggle',
    label: 'Toggle',
    group: 'Components',
    tag: 'Toggle',
    from: DS_COMPONENTS,
    props: { label: 'Aktifkan' },
    textProps: ['label'],
  },
  {
    key: 'input',
    label: 'Input',
    group: 'Components',
    tag: 'Input',
    from: DS_COMPONENTS,
    props: { label: 'Label', placeholder: 'Isi di sini' },
    textProps: ['label', 'placeholder'],
  },
  {
    key: 'icon',
    label: 'Icon',
    group: 'Icons',
    tag: 'Coins',
    from: DS_ICONS,
    props: { className: 'text-primary-500' },
  },
]

export function catalogItem(key: string): CatalogItem | undefined {
  return CATALOG.find((c) => c.key === key)
}

/** Text a designer may type: no markup, no expression braces, no quote that
 *  would end a JSX attribute. */
export function isPlainText(s: string): boolean {
  return s.length > 0 && s.length <= 200 && !/[<>{}"\\\n]/.test(s)
}

/** A class list the panel could have produced: named utilities only. */
export function isTokenClassList(s: string): boolean {
  return s.split(/\s+/).filter(Boolean).every((c) => /^[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)?$/.test(c))
}
