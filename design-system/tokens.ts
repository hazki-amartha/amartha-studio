export const COLOR_SCALES: Record<string, { scale: string; hex: string }[]> = {
  Brand: [
    { scale: '50', hex: '#FEF3FF' },
    { scale: '200', hex: '#E5B8EF' },
    { scale: '300', hex: '#D68EE4' },
    { scale: '400', hex: '#A642B7' },
    { scale: '500', hex: '#853291' },
    { scale: '600', hex: '#732C7C' },
    { scale: '700', hex: '#612966' },
    { scale: '900', hex: '#3D1042' },
  ],
  Neutral: [
    { scale: 'white', hex: '#FFFFFF' },
    { scale: '50', hex: '#F9FAF8' },
    { scale: '200', hex: '#E5E7EB' },
    { scale: '400', hex: '#C6CAD0' },
    { scale: '500', hex: '#8E95A3' },
    { scale: '600', hex: '#6B7280' },
    { scale: '700', hex: '#525C6A' },
    { scale: '900', hex: '#111928' },
  ],
  Blue: [
    { scale: '50', hex: '#EDF7FF' },
    { scale: '200', hex: '#BCE0F7' },
    { scale: '400', hex: '#70B7E5' },
    { scale: '500', hex: '#056DCE' },
    { scale: '600', hex: '#0457A5' },
    { scale: '700', hex: '#03417C' },
    { scale: '800', hex: '#022C52' },
  ],
  Green: [
    { scale: '50', hex: '#E4FCEF' },
    { scale: '200', hex: '#A2EDC3' },
    { scale: '400', hex: '#4BDB98' },
    { scale: '500', hex: '#009C6A' },
    { scale: '600', hex: '#007D55' },
    { scale: '700', hex: '#005E40' },
    { scale: '800', hex: '#003E2A' },
  ],
  Orange: [
    { scale: '50', hex: '#FDF4E9' },
    { scale: '200', hex: '#FCDDAB' },
    { scale: '400', hex: '#FABF77' },
    { scale: '500', hex: '#F7941D' },
    { scale: '600', hex: '#E0771B' },
    { scale: '700', hex: '#AD540A' },
    { scale: '800', hex: '#70320D' },
  ],
  Red: [
    { scale: '50', hex: '#FFF4F3' },
    { scale: '200', hex: '#FFD9D6' },
    { scale: '400', hex: '#F3726D' },
    { scale: '500', hex: '#D73630' },
    { scale: '600', hex: '#AC2B26' },
    { scale: '700', hex: '#81201D' },
    { scale: '800', hex: '#4C0C0A' },
  ],
  Yellow: [
    { scale: '50', hex: '#FFFED9' },
    { scale: '200', hex: '#FFF4A9' },
    { scale: '400', hex: '#FCE677' },
    { scale: '500', hex: '#EAB20B' },
    { scale: '600', hex: '#C69608' },
    { scale: '700', hex: '#996F03' },
    { scale: '800', hex: '#6A4103' },
  ],
}

export const TYPE_SCALE = [
  { cls: 'text-24', spec: '24px / 700 / −0.02em', size: '24px', weight: 700, ls: '-0.02em', sample: 'Heading 24 — Hero title', uppercase: false },
  { cls: 'text-20', spec: '20px / 700 / −0.01em', size: '20px', weight: 700, ls: '-0.01em', sample: 'Heading 20 — Mobile page title', uppercase: false },
  { cls: 'text-18', spec: '18px / 500 / 0', size: '18px', weight: 500, ls: '0', sample: 'Body 18 — Primary reading size for dashboards.', uppercase: false },
  { cls: 'text-16', spec: '16px / 500 / 0', size: '16px', weight: 500, ls: '0', sample: 'Body 16 — Secondary paragraphs and descriptions.', uppercase: false },
  { cls: 'text-14', spec: '14px / 500 / 0', size: '14px', weight: 500, ls: '0', sample: 'Body 14 — Body text for mobile, compact data tables and labels.', uppercase: false },
  { cls: 'text-12', spec: '12px / 500 / 0', size: '12px', weight: 500, ls: '0', sample: 'Body 12 — Caption and helper text.', uppercase: false },
  { cls: 'text-10', spec: '10px / 500 / +0.06em', size: '10px', weight: 500, ls: '0.06em', sample: 'OVERLINE / MICRO LABEL', uppercase: true },
]

export const SPACINGS = [
  { v: '0', px: '0px', r: '0' },
  { v: '4', px: '4px', r: '0.25rem' },
  { v: '8', px: '8px', r: '0.5rem' },
  { v: '12', px: '12px', r: '0.75rem' },
  { v: '16', px: '16px', r: '1rem' },
  { v: '20', px: '20px', r: '1.25rem' },
  { v: '32', px: '32px', r: '2rem' },
  { v: '48', px: '48px', r: '3rem' },
]

export const RADII = [
  { k: 'none', v: '0px' },
  { k: '2', v: '2px' },
  { k: '4', v: '4px' },
  { k: '6', v: '6px' },
  { k: '8', v: '8px' },
  { k: '12', v: '12px' },
  { k: '16', v: '16px' },
  { k: '20', v: '20px' },
  { k: '24', v: '24px' },
  { k: '32', v: '32px' },
  { k: '40', v: '40px' },
  { k: 'full', v: '∞' },
]

export const LAYOUT_PATTERNS = [
  {
    name: 'Mobile Screen',
    tokens: [
      { key: 'page-padding-x', value: '16px', note: 'horizontal edge margin for all screen content' },
      { key: 'page-padding-top', value: '16px', note: 'below topbar' },
      { key: 'section-gap', value: '12px', note: 'vertical gap between cards/sections' },
    ],
  },
  {
    name: 'Card',
    tokens: [
      { key: 'card-padding', value: '12px', note: 'internal card padding (not 20px)' },
      { key: 'card-gap', value: '8px', note: 'gap between cards' },
    ],
  },
  {
    name: 'Topbar',
    tokens: [
      { key: 'topbar-height', value: '48px', note: '' },
      { key: 'topbar-padding-x', value: '16px', note: '' },
    ],
  },
]

export const TOKENS = [
  { cat: 'Brand', key: 'primary-500', hex: '#853291', desc: 'Primary action — buttons, links, active states' },
  { cat: 'Brand', key: 'primary-600', hex: '#732C7C', desc: 'Hover / pressed state' },
  { cat: 'Brand', key: 'primary-50', hex: '#FEF3FF', desc: 'Tinted backgrounds, badge fills' },
  { cat: 'Semantic', key: 'text-default', hex: '#111928', desc: 'neutral-900 — primary readable text' },
  { cat: 'Semantic', key: 'text-caption', hex: '#6B7280', desc: 'neutral-600 — secondary / supporting text' },
  { cat: 'Semantic', key: 'text-disabled', hex: '#8E95A3', desc: 'neutral-500 — disabled labels' },
  { cat: 'Semantic', key: 'text-placeholder', hex: '#C6CAD0', desc: 'neutral-400 — input placeholder text' },
  { cat: 'Semantic', key: 'text-link', hex: '#853291', desc: 'primary-500 — clickable links' },
  { cat: 'Border', key: 'border-default', hex: '#E5E7EB', desc: 'neutral-200 — card and input borders' },
  { cat: 'Border', key: 'border-light', hex: '#F9FAF8', desc: 'neutral-50 — subtle dividers' },
  { cat: 'Status', key: 'blue-500', hex: '#056DCE', desc: 'Informational states' },
  { cat: 'Status', key: 'green-500', hex: '#009C6A', desc: 'Success / funded states' },
  { cat: 'Status', key: 'orange-500', hex: '#F7941D', desc: 'Warning / pending states' },
  { cat: 'Status', key: 'red-500', hex: '#D73630', desc: 'Error / overdue / danger states' },
]

export const NAV_SECTIONS = [
  'overview', 'colors', 'typography', 'spacing',
  'buttons', 'inputs', 'badges', 'cards',
  'toggles', 'selectable-cards', 'modals', 'bottom-sheets',
  'navigation-bars',
  'prompts', 'llms',
] as const
