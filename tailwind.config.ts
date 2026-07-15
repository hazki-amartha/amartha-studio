// =============================================================================
// FunDS Design System — Tailwind Config (token-locked)
// This is the single source of truth for utility classes in the design system,
// the platform, and all prototypes. Agents may only use classes derived from
// these tokens — no arbitrary values like `w-[437px]` or `text-[#abc]`
// (enforced by eslint-plugin-tailwindcss `no-arbitrary-value`).
// Absorbed from funds-lite; scales REPLACE Tailwind defaults on purpose.
// =============================================================================

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './platform/**/*.{ts,tsx}',
    './design-system/**/*.{ts,tsx}',
    './projects/**/*.{ts,tsx}',
  ],
  theme: {
    // -------------------------------------------------------------------------
    // Replace (not extend) these scales so only design system values are valid
    // -------------------------------------------------------------------------

    spacing: {
      '0':  '0px',
      '2':  '0.125rem',   // 2px
      '4':  '0.25rem',    // 4px
      '8':  '0.5rem',     // 8px
      '12': '0.75rem',    // 12px
      '16': '1rem',       // 16px
      '20': '1.25rem',    // 20px
      '24': '1.5rem',     // 24px
      '32': '2rem',       // 32px
      '40': '2.5rem',     // 40px
      '48': '3rem',       // 48px
    },

    borderRadius: {
      'none': '0px',
      '2':    '0.125rem',
      '4':    '0.25rem',
      '6':    '0.375rem',
      '8':    '0.5rem',
      '10':   '0.625rem',
      '12':   '0.75rem',
      '16':   '1rem',
      '20':   '1.25rem',
      '24':   '1.5rem',
      '32':   '2rem',
      '40':   '2.5rem',
      'full': '9999px',
    },

    fontSize: {
      '10': ['10px', { lineHeight: '150%', letterSpacing: '0.06em' }],
      '12': ['12px', { lineHeight: '150%', letterSpacing: '0px' }],
      '14': ['14px', { lineHeight: '150%', letterSpacing: '0px' }],
      '16': ['16px', { lineHeight: '150%', letterSpacing: '0px' }],
      '18': ['18px', { lineHeight: '150%', letterSpacing: '0px' }],
      '20': ['20px', { lineHeight: '100%', letterSpacing: '-0.01em' }],
      '24': ['24px', { lineHeight: '100%', letterSpacing: '-0.02em' }],
    },

    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },

    fontWeight: {
      regular: '500',
      bold:    '700',
    },

    colors: {
      transparent: 'transparent',
      current:     'currentColor',

      // Primary (Purple)
      primary: {
        50:  '#FEF3FF',
        200: '#E5B8EF',
        300: '#D68EE4',
        400: '#A642B7',
        500: '#853291',
        600: '#732C7C',
        700: '#612966',
        900: '#3D1042',
      },

      // Neutral
      neutral: {
        50:    '#F9FAF8',
        200:   '#E5E7EB',
        400:   '#C6CAD0',
        500:   '#8E95A3',
        600:   '#6B7280',
        700:   '#525C6A',
        900:   '#111928',
        white: '#FFFFFF',
        black: '#000000',
      },

      // Saturated
      blue: {
        50:  '#EDF7FF',
        200: '#BCE0F7',
        400: '#70B7E5',
        500: '#056DCE',
        600: '#0457A5',
        700: '#03417C',
        800: '#022C52',
      },
      green: {
        50:  '#E4FCEF',
        200: '#A2EDC3',
        400: '#4BDB98',
        500: '#009C6A',
        600: '#007D55',
        700: '#005E40',
        800: '#003E2A',
      },
      orange: {
        50:  '#FDF4E9',
        200: '#FCDDAB',
        400: '#FABF77',
        500: '#F7941D',
        600: '#E0771B',
        700: '#AD540A',
        800: '#70320D',
      },
      red: {
        50:  '#FFF4F3',
        200: '#FFD9D6',
        400: '#F3726D',
        500: '#D73630',
        600: '#AC2B26',
        700: '#81201D',
        800: '#4C0C0A',
      },
      yellow: {
        50:  '#FFFED9',
        200: '#FFF4A9',
        400: '#FCE677',
        500: '#EAB20B',
        600: '#C69608',
        700: '#996F03',
        800: '#6A4103',
      },
    },

    extend: {
      // Semantic aliases — use these in components over raw color classes
      textColor: {
        'default':     '#111928', // neutral-900
        'caption':     '#6B7280', // neutral-600
        'disabled':    '#8E95A3', // neutral-500
        'placeholder': '#C6CAD0', // neutral-400
        'link':        '#853291', // primary-500
      },
      borderColor: {
        'default': '#E5E7EB', // neutral-200
        'light':   '#F9FAF8', // neutral-50
      },
      backgroundColor: {
        'overlay': 'rgba(17, 25, 40, 0.8)',
      },
    },
  },
  plugins: [],
}

export default config
