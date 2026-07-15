# Setup — @funds/funds-lite

## Installation

```bash
npm install @funds/funds-lite
```

## Import Components and Styles

```tsx
// Import component CSS once at the app root (e.g. _app.tsx or layout.tsx)
import '@funds/funds-lite/styles'

// Import individual components
import { Button, Badge, Input, Toggle } from '@funds/funds-lite'
import { SelectableCard, Modal, BottomSheet } from '@funds/funds-lite'
import { NavigationBar, NavigationHeader } from '@funds/funds-lite'

// Import design tokens (TypeScript)
import { COLOR_SCALES, TYPE_SCALE, SPACINGS, TOKENS } from '@funds/funds-lite'
```

## CSS Variables

Paste these into your global CSS (`:root`) to enable all token references:

```css
:root {
  /* Brand */
  --primary-50:  #FEF3FF;
  --primary-200: #E5B8EF;
  --primary-300: #D68EE4;
  --primary-400: #A642B7;
  --primary-500: #853291;
  --primary-600: #732C7C;
  --primary-700: #612966;
  --primary-900: #3D1042;

  /* Neutral */
  --neutral-white: #FFFFFF;
  --neutral-50:    #F9FAF8;
  --neutral-200:   #E5E7EB;
  --neutral-400:   #C6CAD0;
  --neutral-500:   #8E95A3;
  --neutral-600:   #6B7280;
  --neutral-700:   #525C6A;
  --neutral-900:   #111928;

  /* Status */
  --blue-50:     #EDF7FF;  --blue-500:    #056DCE;  --blue-600:    #0457A5;
  --green-50:    #E4FCEF;  --green-500:   #009C6A;  --green-600:   #007D55;
  --orange-50:   #FDF4E9;  --orange-500:  #F7941D;  --orange-700:  #AD540A;
  --red-50:      #FFF4F3;  --red-500:     #D73630;  --red-600:     #AC2B26;
  --yellow-50:   #FFFED9;  --yellow-500:  #EAB20B;  --yellow-700:  #996F03;

  /* Typography */
  --font: 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* Layout */
  --page-padding-x:   16px;
  --page-padding-top: 16px;
  --section-gap:      12px;
  --card-padding:     12px;
  --card-gap:         8px;
  --topbar-height:    48px;
  --topbar-padding-x: 16px;
}
```

## Tailwind Config (Optional)

If using Tailwind CSS, add the FunDS token scale to your config:

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    spacing: {
      '0': '0px', '2': '2px', '4': '4px', '8': '8px',
      '12': '12px', '16': '16px', '20': '20px', '24': '24px',
      '32': '32px', '40': '40px', '48': '48px',
    },
    borderRadius: {
      none: '0px', '2': '2px', '4': '4px', '6': '6px',
      '8': '8px', '12': '12px', '16': '16px', '20': '20px',
      '24': '24px', '32': '32px', '40': '40px', full: '9999px',
    },
    fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
    fontWeight: { medium: '500', bold: '700' },
    fontSize: {
      '10': ['10px', { lineHeight: '1', letterSpacing: '0.06em' }],
      '12': ['12px', { lineHeight: '1.5', letterSpacing: '0' }],
      '14': ['14px', { lineHeight: '1.5', letterSpacing: '0' }],
      '16': ['16px', { lineHeight: '1.5', letterSpacing: '0' }],
      '18': ['18px', { lineHeight: '1.5', letterSpacing: '0' }],
      '20': ['20px', { lineHeight: '1', letterSpacing: '-0.01em' }],
      '24': ['24px', { lineHeight: '1', letterSpacing: '-0.02em' }],
    },
    extend: {
      colors: {
        primary: {
          50: '#FEF3FF', 200: '#E5B8EF', 300: '#D68EE4', 400: '#A642B7',
          500: '#853291', 600: '#732C7C', 700: '#612966', 900: '#3D1042',
        },
        neutral: {
          white: '#FFFFFF', 50: '#F9FAF8', 200: '#E5E7EB', 400: '#C6CAD0',
          500: '#8E95A3', 600: '#6B7280', 700: '#525C6A', 900: '#111928',
        },
      },
    },
  },
} satisfies Config
```

## Guardrails

- Do NOT use arbitrary Tailwind values: `w-[437px]`, `text-[#abc]`
- Do NOT invent hex values not listed in the token set
- Do NOT use font-weight 400, 600, or 800
- Do NOT use spacing values outside: 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48px
- Do NOT use any font other than Inter
