'use client'

// FunDS icons — the shared icon set. Generated from the Phosphor-based FunDS
// icon library; see temp-system-icons/NAMING-CONVENTION.md for the naming rules.
// Do NOT hand-roll icons in a project — import from here:
//   import { Coins, ArrowDown } from '@/design-system/icons'
//   <Coins className="text-primary-500" />   // 24px, inherits token color
//
// Every icon is a named, tree-shakeable export. size is clamped to the
// 16/20/24 grid; color comes from currentColor, so an icon inherits the text
// color of its container. Filled variants use the -fill suffix.

import type { ReactNode, SVGProps } from 'react'

export type IconSize = 16 | 20 | 24

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: IconSize
}

function base({ size = 24, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

/** arrow-clockwise */
export function ArrowClockwise(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M17.25 9.75H21.75V5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.6625 17.9999C16.4831 19.1127 15.002 19.8533 13.4041 20.1292C11.8063 20.4051 10.1625 20.204 8.67833 19.5511C7.1941 18.8981 5.9352 17.8222 5.05893 16.4579C4.18265 15.0936 3.72785 13.5013 3.75136 11.8799C3.77486 10.2586 4.27563 8.68013 5.19109 7.34177C6.10655 6.00341 7.3961 4.9645 8.89863 4.35485C10.4012 3.74519 12.05 3.59182 13.6392 3.91391C15.2284 4.23599 16.6875 5.01925 17.834 6.16581L21.75 9.74987" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** arrow-down */
export function ArrowDown(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M12 3.75L12 20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.25 13.5L12 20.25L18.75 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** arrow-left */
export function ArrowLeft(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M20.25 12L3.75 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 5.25L3.75 12L10.5 18.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** arrow-right */
export function ArrowRight(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M3.75 12L20.25 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.5 18.75L20.25 12L13.5 5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** arrow-up */
export function ArrowUp(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M12 20.25L12 3.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.75 10.5L12 3.75L5.25 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** arrows-clockwise */
export function ArrowsClockwise(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M15.75 9H20.25V4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.25 9.00013L17.5988 6.34888C16.0633 4.81353 13.9846 3.94539 11.8132 3.93276C9.64193 3.92012 7.55317 4.764 6 6.28138" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.25 15H3.75V19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.75 15L6.40125 17.6512C7.93666 19.1866 10.0154 20.0547 12.1868 20.0674C14.3581 20.08 16.4468 19.2361 18 17.7188" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** arrows-left-right */
export function ArrowsLeftRight(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M6 9.49951L21 9.49951L15 4.99951M18 14.4995L3 14.4995L9 18.9995" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** bank */
export function Bank(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <g>
      <path d="M10.9707 2.45117C11.6041 2.07115 12.3959 2.07115 13.0293 2.45117L20.9668 7.21387C22.2709 7.99659 21.7162 9.99959 20.1953 10H3.80469C2.2838 9.99958 1.72906 7.9966 3.0332 7.21387L10.9707 2.45117Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 10V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 10V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 10V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.9277 18L20.1025 18.0137C20.4452 18.0686 20.7428 18.2831 20.9033 18.5908L20.9717 18.752L21.4053 20.0518C21.6427 20.764 21.1121 21.5 20.3613 21.5H3.63867C2.8879 21.5 2.35731 20.764 2.59473 20.0518L3.02832 18.752L3.09668 18.5908C3.2839 18.2319 3.65795 18 4.07227 18H19.9277Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      </g>
    </>
  ) })
}

/** barcode-scan */
export function BarcodeScan(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M17.25 3.5H19C20.1046 3.5 21 4.39543 21 5.5V7.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.75 20.5H5C3.89543 20.5 3 19.6046 3 18.5V16.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 16.75V18.5C21 19.6046 20.1046 20.5 19 20.5H17.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 7.25V5.5C3 4.39543 3.89543 3.5 5 3.5H6.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 12L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </g>
    </>
  ) })
}

/** barcode */
export function Barcode(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M17.25 3.5H19C20.1046 3.5 21 4.39543 21 5.5V7.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.75 20.5H5C3.89543 20.5 3 19.6046 3 18.5V16.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 16.75V18.5C21 19.6046 20.1046 20.5 19 20.5H17.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 7.25V5.5C3 4.39543 3.89543 3.5 5 3.5H6.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 8.25V15.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.5 8.25V15.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.5 8.25V15.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 8.25V15.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** bell-slash */
export function BellSlash(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M4.5 3.75L19.5 20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 18C9 18.7956 9.31607 19.5587 9.87868 20.1213C10.4413 20.6839 11.2044 21 12 21C12.7956 21 13.5587 20.6839 14.1213 20.1213C14.6839 19.5587 15 18.7956 15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.66992 3.8776C9.69683 3.29519 10.8585 2.99229 12.0391 2.99914C13.2196 3.00599 14.3777 3.32234 15.3978 3.91663C16.4179 4.51092 17.2643 5.36235 17.8525 6.38596C18.4407 7.40956 18.7501 8.56953 18.7499 9.7501C18.7499 12.4782 19.2637 14.7714 19.7877 16.1064" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.4543 17.9998H4.49988C4.36861 17.999 4.23985 17.9637 4.12646 17.8976C4.01308 17.8314 3.91904 17.7367 3.85375 17.6228C3.78845 17.5089 3.7542 17.3799 3.7544 17.2486C3.75459 17.1174 3.78925 16.9884 3.85488 16.8748C4.4727 15.806 5.24988 13.107 5.24988 9.74977C5.24763 8.37353 5.66815 7.02981 6.45457 5.90039" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** bell */
export function Bell(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M9 18C9 18.7956 9.31607 19.5587 9.87868 20.1213C10.4413 20.6839 11.2044 21 12 21C12.7956 21 13.5587 20.6839 14.1213 20.1213C14.6839 19.5587 15 18.7956 15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.24988 9.75C5.24988 7.95979 5.96104 6.2429 7.22691 4.97703C8.49278 3.71116 10.2097 3 11.9999 3C13.7901 3 15.507 3.71116 16.7729 4.97703C18.0387 6.2429 18.7499 7.95979 18.7499 9.75C18.7499 13.1081 19.528 15.8063 20.1468 16.875C20.2125 16.9888 20.2471 17.1179 20.2472 17.2493C20.2474 17.3808 20.2129 17.5099 20.1474 17.6239C20.0819 17.7378 19.9876 17.8325 19.874 17.8985C19.7603 17.9645 19.6313 17.9995 19.4999 18H4.49988C4.36861 17.9992 4.23985 17.964 4.12646 17.8978C4.01308 17.8317 3.91904 17.7369 3.85375 17.6231C3.78845 17.5092 3.7542 17.3801 3.7544 17.2489C3.75459 17.1176 3.78925 16.9887 3.85488 16.875C4.4727 15.8063 5.24988 13.1072 5.24988 9.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** book-open */
export function BookOpen(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M2 4.76712C7.71429 3.31848 11.0476 6.266 12 7.92084V20.3784C8.66667 16.0922 3.90476 16.8899 2 17.3404V4.76712Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 4.76712C16.2857 3.31848 12.9524 6.266 12 7.92084V20.3784C15.3333 16.0922 20.0952 16.8899 22 17.3404V4.76712Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** book */
export function Book(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M16 21C16.93 21 17.395 21 17.7765 20.8978C18.8117 20.6204 19.6204 19.8117 19.8978 18.7765C20 18.395 20 17.93 20 17V7C20 6.07003 20 5.60504 19.8978 5.22354C19.6204 4.18827 18.8117 3.37962 17.7765 3.10222C17.395 3 16.93 3 16 3H8.8C7.11984 3 6.27976 3 5.63803 3.32698C5.07354 3.6146 4.6146 4.07354 4.32698 4.63803C4 5.27976 4 6.11984 4 7.8V16.2C4 17.8802 4 18.7202 4.32698 19.362C4.6146 19.9265 5.07354 20.3854 5.63803 20.673C6.27976 21 7.11984 21 8.8 21H16ZM16 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 11.5H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </g>
    </>
  ) })
}

/** bookmark */
export function Bookmark(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M16.4998 3H7.49439C5.83964 3 4.49737 4.33986 4.4944 5.99461L4.47242 18.2353C4.46924 20.008 6.60314 20.9083 7.87065 19.6689L11.9998 15.6316L16.0981 19.658C17.3631 20.9008 19.4998 20.0046 19.4998 18.2314V6C19.4998 4.34315 18.1566 3 16.4998 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M9.5 8H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </>
  ) })
}

/** calculator */
export function Calculator(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M3.75 6.25C3.75 4.04086 5.54086 2.25 7.75 2.25H16.25C18.4591 2.25 20.25 4.04086 20.25 6.25V17.75C20.25 19.9591 18.4591 21.75 16.25 21.75H7.75C5.54086 21.75 3.75 19.9591 3.75 17.75V6.25Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M16.5 7.5H7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.25 13.5C8.87132 13.5 9.375 12.9963 9.375 12.375C9.375 11.7537 8.87132 11.25 8.25 11.25C7.62868 11.25 7.125 11.7537 7.125 12.375C7.125 12.9963 7.62868 13.5 8.25 13.5Z" fill="currentColor"/>
      <path d="M12 13.5C12.6213 13.5 13.125 12.9963 13.125 12.375C13.125 11.7537 12.6213 11.25 12 11.25C11.3787 11.25 10.875 11.7537 10.875 12.375C10.875 12.9963 11.3787 13.5 12 13.5Z" fill="currentColor"/>
      <path d="M15.75 13.5C16.3713 13.5 16.875 12.9963 16.875 12.375C16.875 11.7537 16.3713 11.25 15.75 11.25C15.1287 11.25 14.625 11.7537 14.625 12.375C14.625 12.9963 15.1287 13.5 15.75 13.5Z" fill="currentColor"/>
      <path d="M8.25 17.25C8.87132 17.25 9.375 16.7463 9.375 16.125C9.375 15.5037 8.87132 15 8.25 15C7.62868 15 7.125 15.5037 7.125 16.125C7.125 16.7463 7.62868 17.25 8.25 17.25Z" fill="currentColor"/>
      <path d="M12 17.25C12.6213 17.25 13.125 16.7463 13.125 16.125C13.125 15.5037 12.6213 15 12 15C11.3787 15 10.875 15.5037 10.875 16.125C10.875 16.7463 11.3787 17.25 12 17.25Z" fill="currentColor"/>
      <path d="M15.75 17.25C16.3713 17.25 16.875 16.7463 16.875 16.125C16.875 15.5037 16.3713 15 15.75 15C15.1287 15 14.625 15.5037 14.625 16.125C14.625 16.7463 15.1287 17.25 15.75 17.25Z" fill="currentColor"/>
      </g>
    </>
  ) })
}

/** calendar-dots */
export function CalendarDots(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M16.5 1.25V4.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 1.25V4.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 8L22 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 14.125C12.7249 14.125 13.3125 13.5374 13.3125 12.8125C13.3125 12.0876 12.7249 11.5 12 11.5C11.2751 11.5 10.6875 12.0876 10.6875 12.8125C10.6875 13.5374 11.2751 14.125 12 14.125Z" fill="currentColor"/>
      <path d="M16.8125 14.125C17.5374 14.125 18.125 13.5374 18.125 12.8125C18.125 12.0876 17.5374 11.5 16.8125 11.5C16.0876 11.5 15.5 12.0876 15.5 12.8125C15.5 13.5374 16.0876 14.125 16.8125 14.125Z" fill="currentColor"/>
      <path d="M7.1875 18.5C7.91237 18.5 8.5 17.9124 8.5 17.1875C8.5 16.4626 7.91237 15.875 7.1875 15.875C6.46263 15.875 5.875 16.4626 5.875 17.1875C5.875 17.9124 6.46263 18.5 7.1875 18.5Z" fill="currentColor"/>
      <path d="M12 18.5C12.7249 18.5 13.3125 17.9124 13.3125 17.1875C13.3125 16.4626 12.7249 15.875 12 15.875C11.2751 15.875 10.6875 16.4626 10.6875 17.1875C10.6875 17.9124 11.2751 18.5 12 18.5Z" fill="currentColor"/>
      <path d="M16.8125 18.5C17.5374 18.5 18.125 17.9124 18.125 17.1875C18.125 16.4626 17.5374 15.875 16.8125 15.875C16.0876 15.875 15.5 16.4626 15.5 17.1875C15.5 17.9124 16.0876 18.5 16.8125 18.5Z" fill="currentColor"/>
      <rect x="2" y="3" width="20" height="19" rx="4" stroke="currentColor" strokeWidth="2"/>
      </g>
    </>
  ) })
}

/** calendar-fill */
export function CalendarFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M4 8.5H20V17.5C20 19.1569 18.6569 20.5 17 20.5H7C5.34315 20.5 4 19.1569 4 17.5V8.5Z" fill="currentColor"/>
      <path d="M3 7.5C3 5.29086 4.79086 3.5 7 3.5H17C19.2091 3.5 21 5.29086 21 7.5V17C21 19.2091 19.2091 21 17 21H7C4.79086 21 3 19.2091 3 17V7.5Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 2V4.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.5 2V4.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 14.5L11.5 16.5833L15.6667 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** camera */
export function Camera(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M6 19.5H18C19.6569 19.5 21 18.1569 21 16.5V9C21 7.34315 19.6569 6 18 6H17.5704C16.9017 6 16.2772 5.6658 15.9063 5.1094L15.5937 4.6406C15.2228 4.0842 14.5983 3.75 13.9296 3.75H10.0704C9.40166 3.75 8.7772 4.0842 8.40627 4.6406L8.09373 5.1094C7.7228 5.6658 7.09834 6 6.42963 6H6C4.34315 6 3 7.34315 3 9V16.5C3 18.1569 4.34315 19.5 6 19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 15.75C13.864 15.75 15.375 14.239 15.375 12.375C15.375 10.511 13.864 9 12 9C10.136 9 8.625 10.511 8.625 12.375C8.625 14.239 10.136 15.75 12 15.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** cash-fill */
export function CashFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M22 16.8147C22 17.3692 21.6955 17.8867 21.1891 18.1126C14.0727 21.2878 10.4091 14.7247 3.51728 17.2663C2.80943 17.5273 2 17.0408 2 16.2864V7.1853C2 6.63077 2.30449 6.11334 2.81091 5.88739C9.92732 2.71222 13.5909 9.27535 20.4827 6.73374C21.1906 6.47269 22 6.95916 22 7.71361V16.8147Z" fill="currentColor" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 14.25C13.2426 14.25 14.25 13.2426 14.25 12C14.25 10.7574 13.2426 9.75 12 9.75C10.7574 9.75 9.75 10.7574 9.75 12C9.75 13.2426 10.7574 14.25 12 14.25Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** chart-line-up */
export function ChartLineUp(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M21 6.99707L12.5616 15.4971L8.53696 11.4971L3 17.0001M21 12.4971V6.99707H15.077" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** chat-circle-dots */
export function ChatCircleDots(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 13.125C12.6213 13.125 13.125 12.6213 13.125 12C13.125 11.3787 12.6213 10.875 12 10.875C11.3787 10.875 10.875 11.3787 10.875 12C10.875 12.6213 11.3787 13.125 12 13.125Z" fill="currentColor"/>
      <path d="M7.875 13.125C8.49632 13.125 9 12.6213 9 12C9 11.3787 8.49632 10.875 7.875 10.875C7.25368 10.875 6.75 11.3787 6.75 12C6.75 12.6213 7.25368 13.125 7.875 13.125Z" fill="currentColor"/>
      <path d="M16.125 13.125C16.7463 13.125 17.25 12.6213 17.25 12C17.25 11.3787 16.7463 10.875 16.125 10.875C15.5037 10.875 15 11.3787 15 12C15 12.6213 15.5037 13.125 16.125 13.125Z" fill="currentColor"/>
      <path d="M7.49356 19.7914C9.38406 20.8856 11.608 21.2549 13.7506 20.8304C15.8933 20.406 17.8084 19.2168 19.1391 17.4846C20.4697 15.7524 21.125 13.5954 20.9827 11.4157C20.8404 9.23605 19.9103 7.18253 18.3657 5.638C16.8212 4.09348 14.7677 3.16336 12.588 3.02108C10.4084 2.87879 8.25138 3.53405 6.51916 4.86468C4.78695 6.1953 3.59777 8.11048 3.17333 10.2531C2.74889 12.3958 3.11817 14.6197 4.21231 16.5102L3.0395 20.0118C2.99543 20.1439 2.98903 20.2857 3.02103 20.4213C3.05302 20.5569 3.12215 20.6808 3.22065 20.7794C3.31915 20.8779 3.44314 20.947 3.57871 20.979C3.71429 21.011 3.8561 21.0046 3.98825 20.9605L7.49356 19.7914Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** chat-circle-question */
export function ChatCircleQuestion(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M7.49356 19.7914C9.38406 20.8856 11.608 21.2549 13.7506 20.8304C15.8933 20.406 17.8084 19.2168 19.1391 17.4846C20.4697 15.7524 21.125 13.5954 20.9827 11.4157C20.8404 9.23605 19.9103 7.18253 18.3657 5.638C16.8212 4.09348 14.7677 3.16336 12.588 3.02108C10.4084 2.87879 8.25138 3.53405 6.51916 4.86468C4.78695 6.1953 3.59777 8.11048 3.17333 10.2531C2.74889 12.3958 3.11817 14.6197 4.21231 16.5102L3.0395 20.0118C2.99543 20.1439 2.98903 20.2857 3.02103 20.4213C3.05302 20.5569 3.12215 20.6808 3.22065 20.7794C3.31915 20.8779 3.44314 20.947 3.57871 20.979C3.71429 21.011 3.8561 21.0046 3.98825 20.9605L7.49356 19.7914Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 17.7998C12.6213 17.7998 13.125 17.2961 13.125 16.6748C13.125 16.0535 12.6213 15.5498 12 15.5498C11.3787 15.5498 10.875 16.0535 10.875 16.6748C10.875 17.2961 11.3787 17.7998 12 17.7998Z" fill="currentColor"/>
      <path d="M12 13.5C12 12.9752 12.4339 12.564 12.9382 12.4188C14.1354 12.0741 15 11.0875 15 9.9248C15 8.47543 13.6566 7.2998 12 7.2998C10.3434 7.2998 9 8.47543 9 9.9248V10.2998" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** chat-circle-slash */
export function ChatCircleSlash(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M4.5 3.75L19.5 20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.9286 16.2618C20.8119 14.6221 21.1648 12.7487 20.9386 10.8999C20.7124 9.0512 19.9181 7.31819 18.6654 5.93988C17.4127 4.56157 15.7632 3.60587 13.9444 3.20456C12.1256 2.80325 10.2271 2.97611 8.51074 3.69929" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.94585 5.34375C4.42457 6.72657 3.42257 8.58854 3.10652 10.6199C2.79046 12.6514 3.17941 14.7297 4.20866 16.5094L3.0396 20.0119C2.99553 20.144 2.98913 20.2858 3.02113 20.4214C3.05313 20.557 3.12225 20.681 3.22075 20.7795C3.31925 20.878 3.44324 20.9471 3.57882 20.9791C3.71439 21.0111 3.8562 21.0047 3.98835 20.9606L7.49366 19.7916C9.1468 20.7471 11.061 21.1521 12.9595 20.948C14.858 20.7439 16.6423 19.9413 18.0546 18.6562" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** chat-circle */
export function ChatCircle(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M7.49356 19.7914C9.38406 20.8856 11.608 21.2549 13.7506 20.8304C15.8933 20.406 17.8084 19.2168 19.1391 17.4846C20.4697 15.7524 21.125 13.5954 20.9827 11.4157C20.8404 9.23605 19.9103 7.18253 18.3657 5.638C16.8212 4.09348 14.7677 3.16336 12.588 3.02108C10.4084 2.87879 8.25138 3.53405 6.51916 4.86468C4.78695 6.1953 3.59777 8.11048 3.17333 10.2531C2.74889 12.3958 3.11817 14.6197 4.21231 16.5102L3.0395 20.0118C2.99543 20.1439 2.98903 20.2857 3.02103 20.4213C3.05302 20.5569 3.12215 20.6808 3.22065 20.7794C3.31915 20.8779 3.44314 20.947 3.57871 20.979C3.71429 21.011 3.8561 21.0046 3.98825 20.9605L7.49356 19.7914Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** chat-double */
export function ChatDouble(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M4.62871 15.4332L6.43559 13.9724C6.61355 13.8285 6.83546 13.75 7.0643 13.75H13.5C15.1569 13.75 16.5 12.4069 16.5 10.75V7C16.5 5.34315 15.1569 4 13.5 4H6C4.34315 4 3 5.34315 3 7V14.6556C3 15.4965 3.97479 15.9619 4.62871 15.4332Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 13.75V15.25C7.5 16.9069 8.84315 18.25 10.5 18.25H16.9357C17.1645 18.25 17.3865 18.3285 17.5644 18.4724L19.3713 19.9332C20.0252 20.4619 21 19.9965 21 19.1556V11.5C21 9.84315 19.6569 8.5 18 8.5L16.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** chat-text */
export function ChatText(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M3 9.25V20.3008C3 21.1424 3.9762 21.6076 4.62987 21.0775L6.94929 19.1966C7.30557 18.9077 7.75033 18.75 8.20903 18.75H17C19.2091 18.75 21 16.9591 21 14.75V9.25C21 7.04086 19.2091 5.25 17 5.25H7C4.79086 5.25 3 7.04086 3 9.25Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 10.5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 14H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** chats-circle-double */
export function ChatsCircleDouble(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M3.2072 14.9299C2.28997 13.2164 2.01917 11.2302 2.44417 9.33364C2.86918 7.43706 3.96168 5.75641 5.52246 4.59814C7.08324 3.43987 9.00833 2.88114 10.9467 3.02383C12.8851 3.16653 14.7076 4.00114 16.0819 5.37548C17.4563 6.74982 18.2909 8.57234 18.4336 10.5107C18.5763 12.4491 18.0175 14.3742 16.8593 15.9349C15.701 17.4957 14.0203 18.5882 12.1238 19.0132C10.2272 19.4382 8.24103 19.1674 6.52746 18.2502L3.40304 19.1686C3.24789 19.2142 3.08334 19.2171 2.92667 19.1771C2.77 19.1371 2.62698 19.0557 2.51265 18.9414C2.39831 18.827 2.31687 18.684 2.27689 18.5274C2.2369 18.3707 2.23984 18.2061 2.28541 18.051L3.2072 14.9299Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.75279 12.6042C7.41584 12.6042 7.95334 12.0667 7.95334 11.4037C7.95334 10.7406 7.41584 10.2031 6.75279 10.2031C6.08975 10.2031 5.55225 10.7406 5.55225 11.4037C5.55225 12.0667 6.08975 12.6042 6.75279 12.6042Z" fill="currentColor"/>
      <path d="M10.3544 12.6042C11.0174 12.6042 11.5549 12.0667 11.5549 11.4037C11.5549 10.7406 11.0174 10.2031 10.3544 10.2031C9.69131 10.2031 9.15381 10.7406 9.15381 11.4037C9.15381 12.0667 9.69131 12.6042 10.3544 12.6042Z" fill="currentColor"/>
      <path d="M13.9559 12.6042C14.619 12.6042 15.1565 12.0667 15.1565 11.4037C15.1565 10.7406 14.619 10.2031 13.9559 10.2031C13.2929 10.2031 12.7554 10.7406 12.7554 11.4037C12.7554 12.0667 13.2929 12.6042 13.9559 12.6042Z" fill="currentColor"/>
      <path d="M17.1174 6.4209C17.4813 6.57466 17.834 6.75713 18.1718 6.96721C19.2559 7.64145 20.1524 8.57832 20.7783 9.69109C21.4042 10.8039 21.7393 12.0565 21.7524 13.3332C21.7656 14.6098 21.4565 15.8692 20.8536 16.9946L21.7137 19.9205C21.7564 20.0658 21.7591 20.2199 21.7217 20.3666C21.6842 20.5133 21.608 20.6472 21.5009 20.7543C21.3938 20.8614 21.2599 20.9377 21.1132 20.9751C20.9665 21.0125 20.8124 21.0098 20.6671 20.9671L17.7443 20.1039C16.7789 20.6202 15.7132 20.9217 14.6203 20.9876C13.5274 21.0535 12.4332 20.8823 11.4126 20.4858C10.5815 20.1628 9.81518 19.6966 9.14795 19.1098" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** check-circle-fill */
export function CheckCircleFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 2.25C10.0716 2.25 8.18657 2.82183 6.58319 3.89317C4.97982 4.96452 3.73013 6.48726 2.99218 8.26884C2.25422 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7934 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.7473 9.41498 20.7192 6.93661 18.8913 5.10872C17.0634 3.28084 14.585 2.25273 12 2.25ZM16.2806 10.2806L11.0306 15.5306C10.961 15.6004 10.8783 15.6557 10.7872 15.6934C10.6962 15.7312 10.5986 15.7506 10.5 15.7506C10.4014 15.7506 10.3038 15.7312 10.2128 15.6934C10.1218 15.6557 10.039 15.6004 9.96938 15.5306L7.71938 13.2806C7.57865 13.1399 7.49959 12.949 7.49959 12.75C7.49959 12.551 7.57865 12.3601 7.71938 12.2194C7.86011 12.0786 8.05098 11.9996 8.25 11.9996C8.44903 11.9996 8.6399 12.0786 8.78063 12.2194L10.5 13.9397L15.2194 9.21937C15.2891 9.14969 15.3718 9.09442 15.4628 9.0567C15.5539 9.01899 15.6515 8.99958 15.75 8.99958C15.8485 8.99958 15.9461 9.01899 16.0372 9.0567C16.1282 9.09442 16.2109 9.14969 16.2806 9.21937C16.3503 9.28906 16.4056 9.37178 16.4433 9.46283C16.481 9.55387 16.5004 9.65145 16.5004 9.75C16.5004 9.84855 16.481 9.94613 16.4433 10.0372C16.4056 10.1282 16.3503 10.2109 16.2806 10.2806Z" fill="currentColor"/>
      <path d="M8 12.5L10.5 15L16 9.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** check-circle */
export function CheckCircle(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M21 5L11.9565 14L8.81982 10.8784" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.8136 3.84557C14.6557 3.30309 13.3632 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 11.662 20.9451 11 20.9451 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </>
  ) })
}

/** check */
export function Check(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M3.75 13.5L9 18.75L21 6.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** checklist-doc-fill */
export function ChecklistDocFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M20.8059 12.7005C21.238 12.3481 21.8749 12.3739 22.2776 12.7766C22.6803 13.1793 22.7061 13.8163 22.3538 14.2483L22.2776 14.3313L16.2776 20.3313C15.848 20.7609 15.1525 20.7609 14.7229 20.3313L11.7229 17.3313L11.6467 17.2483C11.2944 16.8163 11.3202 16.1793 11.7229 15.7766C12.1256 15.3739 12.7625 15.3481 13.1946 15.7005L13.2776 15.7766L15.5003 17.9993L20.7229 12.7766L20.8059 12.7005Z" fill="currentColor"/>
      <path d="M14 3.5C16.2091 3.5 18 5.29086 18 7.5V12.7578L15.5 15.2578L14.6211 14.3789L14.5098 14.2725C13.3321 13.2082 11.514 13.2439 10.3789 14.3789C9.24389 15.514 9.2082 17.3321 10.2725 18.5098L10.3789 18.6211L12.2578 20.5H7C4.79086 20.5 3 18.7091 3 16.5V7.5C3 5.29086 4.79086 3.5 7 3.5H14ZM6.5 9.5C5.94772 9.5 5.5 9.94771 5.5 10.5C5.5 11.0523 5.94772 11.5 6.5 11.5H10C10.5523 11.5 11 11.0523 11 10.5C11 9.94771 10.5523 9.5 10 9.5H6.5ZM6.5 6C5.94772 6 5.5 6.44772 5.5 7C5.5 7.55228 5.94772 8 6.5 8H12C12.5523 8 13 7.55228 13 7C13 6.44772 12.5523 6 12 6H6.5Z" fill="currentColor"/>
    </>
  ) })
}

/** chevron-double-down */
export function ChevronDoubleDown(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M19.5 12.75L12 20.25L4.5 12.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.5 5.25L12 12.75L4.5 5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** chevron-double-left */
export function ChevronDoubleLeft(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M11.25 19.5L3.75 12L11.25 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.75 19.5L11.25 12L18.75 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** chevron-double-right */
export function ChevronDoubleRight(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M12.75 4.5L20.25 12L12.75 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.25 4.5L12.75 12L5.25 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** chevron-double-up */
export function ChevronDoubleUp(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M4.5 11.25L12 3.75L19.5 11.25M4.5 18.75L12 11.25L19.5 18.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** chevron-down */
export function ChevronDown(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M19.5 9L12 16.5L4.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** chevron-left */
export function ChevronLeft(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M15 19.5L7.5 12L15 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** chevron-right */
export function ChevronRight(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M9 4.5L16.5 12L9 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** chevron-up-down */
export function ChevronUpDown(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M7.5 16.5L12 21L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 7.5L12 3L16.5 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** chevron-up */
export function ChevronUp(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M4.5 15L12 7.5L19.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** clip */
export function Clip(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M6.66854 15.9234L14.009 8.58297C14.79 7.80192 16.0564 7.80192 16.8374 8.58297C17.6185 9.36402 17.6185 10.6304 16.8374 11.4114L9.45487 18.7939C7.9904 20.2584 5.61604 20.2584 4.15157 18.7939C2.68711 17.3295 2.68711 14.9551 4.15157 13.4906L11.753 5.88923C13.9009 3.74135 17.3833 3.74135 19.5311 5.88923C21.679 8.03712 21.679 11.5195 19.5311 13.6674L13.9921 19.2064" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </>
  ) })
}

/** clipboard */
export function Clipboard(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M16 3.75H16.5C18.1569 3.75 19.5 5.09315 19.5 6.75V18C19.5 19.6569 18.1569 21 16.5 21H7.5C5.84315 21 4.5 19.6569 4.5 18V6.75C4.5 5.09315 5.84315 3.75 7.5 3.75H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.5 13L11.8 15L15.5 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="8" y="2" width="8" height="4" rx="2" stroke="currentColor" strokeWidth="2"/>
      </g>
    </>
  ) })
}

/** cloud-arrow-down */
export function CloudArrowDown(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M6.5 19C7.05228 19 7.5 18.5523 7.5 18C7.5 17.4477 7.05228 17 6.5 17V18V19ZM5.95968 8.73261L6.12369 9.71907C6.5237 9.65256 6.84394 9.35108 6.93445 8.95581L5.95968 8.73261ZM18.1742 9.62391L17.1769 9.69731C17.2125 10.1801 17.5888 10.5681 18.0702 10.6185L18.1742 9.62391ZM17.5 17C16.9477 17 16.5 17.4477 16.5 18C16.5 18.5523 16.9477 19 17.5 19V18V17ZM6.5 18V17C4.47696 17 3 15.4146 3 13.3333H2H1C1 16.4067 3.26319 19 6.5 19V18ZM22 13.8H21C21 15.5484 19.5481 17 17.7143 17V18V19C20.6144 19 23 16.6908 23 13.8H22ZM5.95968 8.73261L6.93445 8.95581C7.44993 6.70452 9.51206 5 12 5V4V3C8.58551 3 5.70988 5.3432 4.9849 8.50941L5.95968 8.73261ZM2 13.3333H3C3 11.5355 4.33552 10.0164 6.12369 9.71907L5.95968 8.73261L5.79567 7.74615C3.08797 8.19633 1 10.5124 1 13.3333H2ZM12 4V5C14.7564 5 16.985 7.08899 17.1769 9.69731L18.1742 9.62391L19.1715 9.5505C18.9007 5.87119 15.7775 3 12 3V4ZM18.1742 9.62391L18.0702 10.6185C19.7333 10.7924 21 12.1662 21 13.8H22H23C23 11.0992 20.9165 8.9052 18.2782 8.62933L18.1742 9.62391ZM17.7143 18V17H17.5V18V19H17.7143V18Z" fill="currentColor"/>
      <path d="M9 15.5L12 18.5L15 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 11V18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** cloud-arrow-up */
export function CloudArrowUp(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M6.5 19C7.05228 19 7.5 18.5523 7.5 18C7.5 17.4477 7.05228 17 6.5 17V18V19ZM5.95968 8.73261L6.12369 9.71907C6.5237 9.65256 6.84394 9.35108 6.93445 8.95581L5.95968 8.73261ZM18.1742 9.62391L17.1769 9.69731C17.2125 10.1801 17.5888 10.5681 18.0702 10.6185L18.1742 9.62391ZM17.5 17C16.9477 17 16.5 17.4477 16.5 18C16.5 18.5523 16.9477 19 17.5 19V18V17ZM6.5 18V17C4.47696 17 3 15.4146 3 13.3333H2H1C1 16.4067 3.26319 19 6.5 19V18ZM22 13.8H21C21 15.5484 19.5481 17 17.7143 17V18V19C20.6144 19 23 16.6908 23 13.8H22ZM5.95968 8.73261L6.93445 8.95581C7.44993 6.70452 9.51206 5 12 5V4V3C8.58551 3 5.70988 5.3432 4.9849 8.50941L5.95968 8.73261ZM2 13.3333H3C3 11.5355 4.33552 10.0164 6.12369 9.71907L5.95968 8.73261L5.79567 7.74615C3.08797 8.19633 1 10.5124 1 13.3333H2ZM12 4V5C14.7564 5 16.985 7.08899 17.1769 9.69731L18.1742 9.62391L19.1715 9.5505C18.9007 5.87119 15.7775 3 12 3V4ZM18.1742 9.62391L18.0702 10.6185C19.7333 10.7924 21 12.1662 21 13.8H22H23C23 11.0992 20.9165 8.9052 18.2782 8.62933L18.1742 9.62391ZM17.7143 18V17H17.5V18V19H17.7143V18Z" fill="currentColor"/>
      <path d="M15 14L12 11L9 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 18.5L12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** cloud-check */
export function CloudCheck(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M5.95968 8.73261L6.12369 9.71907C6.5237 9.65256 6.84394 9.35108 6.93445 8.95581L5.95968 8.73261ZM18.1742 9.62391L17.1769 9.69731C17.2125 10.1801 17.5888 10.5681 18.0702 10.6185L18.1742 9.62391ZM6.7619 18V17C4.66512 17 3 15.3394 3 13.3333H2H1C1 16.4819 3.59883 19 6.7619 19V18ZM22 13.8H21C21 15.5484 19.5481 17 17.7143 17V18V19C20.6144 19 23 16.6908 23 13.8H22ZM17.7143 18V17H6.7619V18V19H17.7143V18ZM5.95968 8.73261L6.93445 8.95581C7.44993 6.70452 9.51206 5 12 5V4V3C8.58551 3 5.70988 5.3432 4.9849 8.50941L5.95968 8.73261ZM2 13.3333H3C3 11.5355 4.33552 10.0164 6.12369 9.71907L5.95968 8.73261L5.79567 7.74615C3.08797 8.19633 1 10.5124 1 13.3333H2ZM12 4V5C14.7564 5 16.985 7.08899 17.1769 9.69731L18.1742 9.62391L19.1715 9.5505C18.9007 5.87119 15.7775 3 12 3V4ZM18.1742 9.62391L18.0702 10.6185C19.7333 10.7924 21 12.1662 21 13.8H22H23C23 11.0992 20.9165 8.9052 18.2782 8.62933L18.1742 9.62391Z" fill="currentColor"/>
      <path d="M8.49896 12.5562L10.9527 14.5821L14.7116 10.0292" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** cloud-lightning */
export function CloudLightning(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M5.95968 6.73261L6.12369 7.71907C6.5237 7.65256 6.84394 7.35108 6.93445 6.95581L5.95968 6.73261ZM18.1742 7.62391L17.1769 7.69731C17.2125 8.18012 17.5888 8.56814 18.0702 8.61848L18.1742 7.62391ZM6.7619 16V15C4.66512 15 3 13.3394 3 11.3333H2H1C1 14.4819 3.59883 17 6.7619 17V16ZM22 11.8H21C21 13.5484 19.5481 15 17.7143 15V16V17C20.6144 17 23 14.6908 23 11.8H22ZM17.7143 16V15H6.7619V16V17H17.7143V16ZM5.95968 6.73261L6.93445 6.95581C7.44993 4.70452 9.51206 3 12 3V2V1C8.58551 1 5.70988 3.3432 4.9849 6.50941L5.95968 6.73261ZM2 11.3333H3C3 9.53549 4.33552 8.01637 6.12369 7.71907L5.95968 6.73261L5.79567 5.74615C3.08797 6.19633 1 8.51238 1 11.3333H2ZM12 2V3C14.7564 3 16.985 5.08899 17.1769 7.69731L18.1742 7.62391L19.1715 7.5505C18.9007 3.87119 15.7775 1 12 1V2ZM18.1742 7.62391L18.0702 8.61848C19.7333 8.79238 21 10.1662 21 11.8H22H23C23 9.09917 20.9165 6.9052 18.2782 6.62933L18.1742 7.62391Z" fill="currentColor"/>
      <path d="M11.7 22L13.5 19H10.5L12.3 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** cloud-slash */
export function CloudSlash(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M5.95968 8.73261L6.12369 9.71907C6.5237 9.65256 6.84394 9.35108 6.93445 8.95581L5.95968 8.73261ZM18.1742 9.62391L17.1769 9.69731C17.2125 10.1801 17.5888 10.5681 18.0702 10.6185L18.1742 9.62391ZM19.9568 16.1388C19.5483 16.5105 19.5185 17.143 19.8902 17.5514C20.2619 17.9599 20.8944 17.9897 21.3028 17.618L20.6298 16.8784L19.9568 16.1388ZM9.68289 3.3752C9.15911 3.55034 8.87648 4.11692 9.05161 4.6407C9.22674 5.16448 9.79333 5.44712 10.3171 5.27198L10 4.32359L9.68289 3.3752ZM6.7619 18V17C4.66512 17 3 15.3394 3 13.3333H2H1C1 16.4819 3.59883 19 6.7619 19V18ZM2 13.3333H3C3 11.5355 4.33552 10.0164 6.12369 9.71907L5.95968 8.73261L5.79567 7.74615C3.08797 8.19633 1 10.5124 1 13.3333H2ZM12 4V5C14.7564 5 16.985 7.08899 17.1769 9.69731L18.1742 9.62391L19.1715 9.5505C18.9007 5.87119 15.7775 3 12 3V4ZM18.1742 9.62391L18.0702 10.6185C19.7333 10.7924 21 12.1662 21 13.8H22H23C23 11.0992 20.9165 8.9052 18.2782 8.62933L18.1742 9.62391ZM5.95968 8.73261L6.93445 8.95581C7.06464 8.38724 7.29307 7.85392 7.60252 7.37366L6.7619 6.83203L5.92129 6.29039C5.48924 6.96093 5.16816 7.70906 4.9849 8.50941L5.95968 8.73261ZM14 18V17H6.7619V18V19H14V18ZM22 13.8H21C21 14.7194 20.6028 15.5509 19.9568 16.1388L20.6298 16.8784L21.3028 17.618C22.3425 16.6719 23 15.3127 23 13.8H22ZM17 18V17H14V18V19H17V18ZM10 4.32359L10.3171 5.27198C10.8434 5.09601 11.4091 5 12 5V4V3C11.1912 3 10.4114 3.13162 9.68289 3.3752L10 4.32359Z" fill="currentColor"/>
      <path d="M4 4L19 20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** cloud-warning */
export function CloudWarning(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M5.95968 8.73261L6.12369 9.71907C6.5237 9.65256 6.84394 9.35108 6.93445 8.95581L5.95968 8.73261ZM18.1742 9.62391L17.1769 9.69731C17.2125 10.1801 17.5888 10.5681 18.0702 10.6185L18.1742 9.62391ZM6.7619 18V17C4.66512 17 3 15.3394 3 13.3333H2H1C1 16.4819 3.59883 19 6.7619 19V18ZM22 13.8H21C21 15.5484 19.5481 17 17.7143 17V18V19C20.6144 19 23 16.6908 23 13.8H22ZM17.7143 18V17H6.7619V18V19H17.7143V18ZM5.95968 8.73261L6.93445 8.95581C7.44993 6.70452 9.51206 5 12 5V4V3C8.58551 3 5.70988 5.3432 4.9849 8.50941L5.95968 8.73261ZM2 13.3333H3C3 11.5355 4.33552 10.0164 6.12369 9.71907L5.95968 8.73261L5.79567 7.74615C3.08797 8.19633 1 10.5124 1 13.3333H2ZM12 4V5C14.7564 5 16.985 7.08899 17.1769 9.69731L18.1742 9.62391L19.1715 9.5505C18.9007 5.87119 15.7775 3 12 3V4ZM18.1742 9.62391L18.0702 10.6185C19.7333 10.7924 21 12.1662 21 13.8H22H23C23 11.0992 20.9165 8.9052 18.2782 8.62933L18.1742 9.62391Z" fill="currentColor"/>
      <path d="M12 12V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 16C12.5523 16 13 15.5523 13 15C13 14.4477 12.5523 14 12 14C11.4477 14 11 14.4477 11 15C11 15.5523 11.4477 16 12 16Z" fill="currentColor"/>
    </>
  ) })
}

/** cloud-x */
export function CloudX(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M5.95968 8.73261L6.12369 9.71907C6.5237 9.65256 6.84394 9.35108 6.93445 8.95581L5.95968 8.73261ZM18.1742 9.62391L17.1769 9.69731C17.2125 10.1801 17.5888 10.5681 18.0702 10.6185L18.1742 9.62391ZM6.7619 18V17C4.66512 17 3 15.3394 3 13.3333H2H1C1 16.4819 3.59883 19 6.7619 19V18ZM22 13.8H21C21 15.5484 19.5481 17 17.7143 17V18V19C20.6144 19 23 16.6908 23 13.8H22ZM17.7143 18V17H6.7619V18V19H17.7143V18ZM5.95968 8.73261L6.93445 8.95581C7.44993 6.70452 9.51206 5 12 5V4V3C8.58551 3 5.70988 5.3432 4.9849 8.50941L5.95968 8.73261ZM2 13.3333H3C3 11.5355 4.33552 10.0164 6.12369 9.71907L5.95968 8.73261L5.79567 7.74615C3.08797 8.19633 1 10.5124 1 13.3333H2ZM12 4V5C14.7564 5 16.985 7.08899 17.1769 9.69731L18.1742 9.62391L19.1715 9.5505C18.9007 5.87119 15.7775 3 12 3V4ZM18.1742 9.62391L18.0702 10.6185C19.7333 10.7924 21 12.1662 21 13.8H22H23C23 11.0992 20.9165 8.9052 18.2782 8.62933L18.1742 9.62391Z" fill="currentColor"/>
      <path d="M14.5 9.5L9.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.5 9.5L14.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** cloud */
export function Cloud(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M5.95968 8.73261L6.12369 9.71907C6.5237 9.65256 6.84394 9.35108 6.93445 8.95581L5.95968 8.73261ZM18.1742 9.62391L17.1769 9.69731C17.2125 10.1801 17.5888 10.5681 18.0702 10.6185L18.1742 9.62391ZM6.7619 18V17C4.66512 17 3 15.3394 3 13.3333H2H1C1 16.4819 3.59883 19 6.7619 19V18ZM22 13.8H21C21 15.5484 19.5481 17 17.7143 17V18V19C20.6144 19 23 16.6908 23 13.8H22ZM17.7143 18V17H6.7619V18V19H17.7143V18ZM5.95968 8.73261L6.93445 8.95581C7.44993 6.70452 9.51206 5 12 5V4V3C8.58551 3 5.70988 5.3432 4.9849 8.50941L5.95968 8.73261ZM2 13.3333H3C3 11.5355 4.33552 10.0164 6.12369 9.71907L5.95968 8.73261L5.79567 7.74615C3.08797 8.19633 1 10.5124 1 13.3333H2ZM12 4V5C14.7564 5 16.985 7.08899 17.1769 9.69731L18.1742 9.62391L19.1715 9.5505C18.9007 5.87119 15.7775 3 12 3V4ZM18.1742 9.62391L18.0702 10.6185C19.7333 10.7924 21 12.1662 21 13.8H22H23C23 11.0992 20.9165 8.9052 18.2782 8.62933L18.1742 9.62391Z" fill="currentColor"/>
    </>
  ) })
}

/** coin-one-hand */
export function CoinOneHand(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M6 20H3C2.72386 20 2.5 19.7761 2.5 19.5V14.5C2.5 14.2239 2.72386 14 3 14H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.5 16.5L14.1875 15.9375M14.1875 15.9375L19.296 13.9649C20.0128 13.6881 20.8263 13.9078 21.3063 14.5078C21.9493 15.3116 21.7692 16.4931 20.9159 17.0688L17.3125 19.5L14.4491 21.16C13.522 21.6974 12.4181 21.8404 11.3847 21.5569L5.9375 20.0625V14L8.99414 12.7297C9.35904 12.5781 9.75029 12.5 10.1454 12.5H13.8438C14.2996 12.5 14.7368 12.6811 15.0591 13.0034C15.3814 13.3257 15.5625 13.7629 15.5625 14.2188C15.5625 14.6746 15.5 15.5 14.1875 15.9375Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.9209 10.8421V9.44065M14.9209 9.44065V8.90786V6.97363H16.2664C16.9476 6.97363 17.4999 7.52589 17.4999 8.20714C17.4999 8.88839 16.9476 9.44065 16.2664 9.44065H14.9209Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 9.36844V7.96702M10.5 7.96702V7.43422V5.5H11.8455C12.5267 5.5 13.079 6.05226 13.079 6.73351C13.079 7.41476 12.5267 7.96702 11.8455 7.96702H10.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.9867 9.36833L12.1606 7.96679" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.75469 13C6.96381 11.8662 6.5 10.4872 6.5 9C6.5 5.13401 9.63401 2 13.5 2C17.366 2 20.5 5.13401 20.5 9C20.5 11.1525 19.5285 13.078 18 14.3621" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </>
  ) })
}

/** coin-two-hands */
export function CoinTwoHands(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M13.1211 11.8421V10.4407M13.1211 10.4407V9.90786V7.97363H14.4665C15.1478 7.97363 15.7001 8.52589 15.7001 9.20714C15.7001 9.88839 15.1478 10.4407 14.4665 10.4407H13.1211Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.7002 10.3684V8.96702M8.7002 8.96702V8.43422V6.5H10.0456C10.7269 6.5 11.2792 7.05226 11.2792 7.73351C11.2792 8.41476 10.7269 8.96702 10.0456 8.96702H8.7002Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.1869 10.3683L10.3608 8.96679" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.76597 15.9342C6.79795 16.0037 6.83628 16.0761 6.88163 16.1516L8.21184 17.8458M6.88163 16.1516L6.76597 15.9342M6.76597 15.9342L4.91861 12.4604C4.64318 11.9425 3.99642 11.6329 3.32036 11.6955C2.41471 11.7793 1.78785 12.489 1.9616 13.2339L2.69538 16.3797L3.58319 19.1586C3.74391 19.6616 4.08447 20.112 4.55971 20.4501L6.29887 21.6875M6.76597 15.9342C6.41167 15.1643 6.83509 14.7569 7.09681 14.5389C7.38216 14.3013 7.76918 14.1678 8.17272 14.1678C8.57626 14.1678 8.96328 14.3013 9.24863 14.5389L11.0356 16.027C11.6137 16.5084 11.9384 17.1613 11.9384 17.842L11.9385 21.5772M17.0993 15.9342C17.0673 16.0037 17.029 16.0761 16.9836 16.1516L15.6534 17.8458M16.9836 16.1516L17.0993 15.9342M17.0993 15.9342L18.9466 12.4604C19.2221 11.9425 19.8688 11.6329 20.5449 11.6955C21.4505 11.7793 22.0774 12.489 21.9036 13.2339L21.1699 16.3797L20.282 19.1586C20.1213 19.6616 19.7808 20.112 19.3055 20.4501L17.5664 21.6875M17.0993 15.9342C17.4536 15.1643 17.0301 14.7569 16.7684 14.5389C16.4831 14.3013 16.0961 14.1678 15.6925 14.1678C15.289 14.1678 14.902 14.3013 14.6166 14.5389L12.8296 16.027C12.2516 16.5084 11.9268 17.1612 11.9268 17.842L11.9267 21.6875" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.19391 11.7586C4.06698 11.1927 4 10.6042 4 10C4 5.58172 7.58172 2 12 2C16.4183 2 20 5.58172 20 10C20 10.6042 19.933 11.1927 19.8061 11.7586" stroke="currentColor" strokeWidth="2"/>
    </>
  ) })
}

/** coin */
export function Coin(props: IconProps) {
  return base({ ...props, children: (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
      <path d="M13.5 16.25V14.3481M13.5 14.3481V13.625V11H15.326C16.2505 11 17 11.7495 17 12.674C17 13.5986 16.2505 14.3481 15.326 14.3481H13.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 14.25V12.3481M7.5 12.3481V11.625V9H9.32596C10.2505 9 11 9.74949 11 10.674C11 11.5986 10.2505 12.3481 9.32596 12.3481H7.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.875 14.2497L9.75391 12.3476" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** coins */
export function Coins(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M9 11.25C13.1421 11.25 16.5 9.73896 16.5 7.875C16.5 6.01104 13.1421 4.5 9 4.5C4.85786 4.5 1.5 6.01104 1.5 7.875C1.5 9.73896 4.85786 11.25 9 11.25Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.5 7.875V11.625C1.5 13.4887 4.85812 15 9 15C13.1419 15 16.5 13.4887 16.5 11.625V7.875" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.5001 9.06738C19.9239 9.38051 22.5001 10.7418 22.5001 12.3749C22.5001 14.2386 19.142 15.7499 15.0001 15.7499C13.1626 15.7499 11.4789 15.4527 10.1748 14.9586" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 14.9325V16.125C7.5 17.9887 10.8581 19.5 15 19.5C19.1419 19.5 22.5 17.9887 22.5 16.125V12.375" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** contact */
export function Contact(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M14.1 3H10.9C8.65979 3 7.53969 3 6.68404 3.43597C5.93139 3.81947 5.31947 4.43139 4.93597 5.18404C4.5 6.03969 4.5 7.15979 4.5 9.4V14.6C4.5 16.8402 4.5 17.9603 4.93597 18.816C5.31947 19.5686 5.93139 20.1805 6.68404 20.564C7.53969 21 8.65979 21 10.9 21H14.1C16.3402 21 17.4603 21 18.316 20.564C19.0686 20.1805 19.6805 19.5686 20.064 18.816C20.5 17.9603 20.5 16.8402 20.5 14.6V9.4C20.5 7.15979 20.5 6.03969 20.064 5.18404C19.6805 4.43139 19.0686 3.81947 18.316 3.43597C17.4603 3 16.3402 3 14.1 3Z" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12.5" cy="10.5" r="2.5" stroke="currentColor" strokeWidth="2"/>
      <path d="M8.53516 16C9.20834 14.852 10.5211 14 12.4998 14C14.4786 14 15.7914 14.852 16.4645 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M4.5 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M4.5 8H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M4.5 16H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </>
  ) })
}

/** copy */
export function Copy(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M13.4 22H15.6C17.8402 22 18.9603 22 19.816 21.564C20.5686 21.1805 21.1805 20.5686 21.564 19.816C22 18.9603 22 17.8402 22 15.6V13.4C22 11.1598 22 10.0397 21.564 9.18404C21.1805 8.43139 20.5686 7.81947 19.816 7.43597C18.9603 7 17.8402 7 15.6 7H13.4C11.1598 7 10.0397 7 9.18404 7.43597C8.43139 7.81947 7.81947 8.43139 7.43597 9.18404C7 10.0397 7 11.1598 7 13.4V15.6C7 17.8402 7 18.9603 7.43597 19.816C7.81947 20.5686 8.43139 21.1805 9.18404 21.564C10.0397 22 11.1598 22 13.4 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.21875 17C6.01564 17 5.91408 17 5.82825 16.9963C3.75405 16.9072 2.09283 15.246 2.00369 13.1718C2 13.0859 2 12.9844 2 12.7813V8.4C2 6.15979 2 5.03968 2.43597 4.18404C2.81947 3.43139 3.43139 2.81947 4.18404 2.43597C5.03968 2 6.15979 2 8.4 2L13.25 2C15.3211 2 17 3.67893 17 5.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** credit-card */
export function CreditCard(props: IconProps) {
  return base({ ...props, children: (
    <>
      <rect x="1" y="1" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2"/>
      <rect x="1" y="5" width="20" height="3" fill="currentColor"/>
    </>
  ) })
}

/** cross-circle-fill */
export function CrossCircleFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor"/>
      <path d="M9 9L15 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M15 9L9 15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </>
  ) })
}

/** cross */
export function Cross(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M18.75 5.25L5.25 18.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.75 18.75L5.25 5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** crosshair */
export function Crosshair(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 21.75V18.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 20.25C16.5563 20.25 20.25 16.5563 20.25 12C20.25 7.44365 16.5563 3.75 12 3.75C7.44365 3.75 3.75 7.44365 3.75 12C3.75 16.5563 7.44365 20.25 12 20.25Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 2.25V5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.25 12H5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21.75 12H18.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** device-mobile-speaker */
export function DeviceMobileSpeaker(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M5.5 8.4C5.5 6.15979 5.5 5.03968 5.93597 4.18404C6.31947 3.43139 6.93139 2.81947 7.68404 2.43597C8.53968 2 9.65979 2 11.9 2H12.1C14.3402 2 15.4603 2 16.316 2.43597C17.0686 2.81947 17.6805 3.43139 18.064 4.18404C18.5 5.03968 18.5 6.15979 18.5 8.4V15.6C18.5 17.8402 18.5 18.9603 18.064 19.816C17.6805 20.5686 17.0686 21.1805 16.316 21.564C15.4603 22 14.3402 22 12.1 22H11.9C9.65979 22 8.53968 22 7.68404 21.564C6.93139 21.1805 6.31947 20.5686 5.93597 19.816C5.5 18.9603 5.5 17.8402 5.5 15.6V8.4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M14.5 18L9.5 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** device-mobile */
export function DeviceMobile(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M5.5 8.4C5.5 6.15979 5.5 5.03968 5.93597 4.18404C6.31947 3.43139 6.93139 2.81947 7.68404 2.43597C8.53968 2 9.65979 2 11.9 2H12.1C14.3402 2 15.4603 2 16.316 2.43597C17.0686 2.81947 17.6805 3.43139 18.064 4.18404C18.5 5.03968 18.5 6.15979 18.5 8.4V15.6C18.5 17.8402 18.5 18.9603 18.064 19.816C17.6805 20.5686 17.0686 21.1805 16.316 21.564C15.4603 22 14.3402 22 12.1 22H11.9C9.65979 22 8.53968 22 7.68404 21.564C6.93139 21.1805 6.31947 20.5686 5.93597 19.816C5.5 18.9603 5.5 17.8402 5.5 15.6V8.4Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M14.5 18.75L9.49998 18.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** donation */
export function Donation(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M12.2514 3.00015C11.0599 3.00015 10.0938 4.00131 10.0938 5.18729C10.0938 6.37326 10.7024 7.56522 14.2493 10L15.6589 9.08696C16.864 8.19843 18.4049 6.78554 18.4049 5.18729C18.4049 4.00131 17.4387 3.00015 16.2473 3.00015C15.8214 2.99515 15.4038 3.11737 15.0479 3.35116C14.6919 3.58495 14.4139 3.91966 14.2493 4.31243C14.0848 3.91966 13.8067 3.58495 13.4508 3.35116C13.0948 3.11737 12.6772 2.99515 12.2514 3.00015Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.5 15.5L12.4879 17.1599C13.3421 17.6345 14.4175 17.3738 14.9595 16.5607L15 16.5C15.5523 15.6716 15.3284 14.5523 14.5 14M14.5 14L12.0038 12.3359C11.6753 12.1169 11.2893 12 10.8944 12H4.5C3.11929 12 2 13.1193 2 14.5V15.6983C2 16.7744 2.68859 17.7297 3.70947 18.07L12.3615 20.9539C13.3758 21.2919 14.4934 21.0647 15.295 20.3573L20.9129 15.4004C21.7966 14.6207 21.8995 13.2793 21.145 12.374C20.4795 11.5754 19.3424 11.3587 18.4298 11.8564L14.5 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </>
  ) })
}

/** door */
export function Door(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M3 21L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.25 21V7C5.25 4.79086 7.04086 3 9.25 3H14.75C16.9591 3 18.75 4.79086 18.75 7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.625 13.5C15.2463 13.5 15.75 12.9963 15.75 12.375C15.75 11.7537 15.2463 11.25 14.625 11.25C14.0037 11.25 13.5 11.7537 13.5 12.375C13.5 12.9963 14.0037 13.5 14.625 13.5Z" fill="currentColor"/>
      </g>
    </>
  ) })
}

/** dots-three-outline */
export function DotsThreeOutline(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 14.25C13.2426 14.25 14.25 13.2426 14.25 12C14.25 10.7574 13.2426 9.75 12 9.75C10.7574 9.75 9.75 10.7574 9.75 12C9.75 13.2426 10.7574 14.25 12 14.25Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M4.5 14.25C5.74264 14.25 6.75 13.2426 6.75 12C6.75 10.7574 5.74264 9.75 4.5 9.75C3.25736 9.75 2.25 10.7574 2.25 12C2.25 13.2426 3.25736 14.25 4.5 14.25Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M19.5 14.25C20.7426 14.25 21.75 13.2426 21.75 12C21.75 10.7574 20.7426 9.75 19.5 9.75C18.2574 9.75 17.25 10.7574 17.25 12C17.25 13.2426 18.2574 14.25 19.5 14.25Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
      </g>
    </>
  ) })
}

/** dots-three-vertical */
export function DotsThreeVertical(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M9.75 12C9.75 13.2426 10.7574 14.25 12 14.25C13.2426 14.25 14.25 13.2426 14.25 12C14.25 10.7574 13.2426 9.75 12 9.75C10.7574 9.75 9.75 10.7574 9.75 12Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M9.75 4.5C9.75 5.74264 10.7574 6.75 12 6.75C13.2426 6.75 14.25 5.74264 14.25 4.5C14.25 3.25736 13.2426 2.25 12 2.25C10.7574 2.25 9.75 3.25736 9.75 4.5Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M9.75 19.5C9.75 20.7426 10.7574 21.75 12 21.75C13.2426 21.75 14.25 20.7426 14.25 19.5C14.25 18.2574 13.2426 17.25 12 17.25C10.7574 17.25 9.75 18.2574 9.75 19.5Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
    </>
  ) })
}

/** download-simple */
export function DownloadSimple(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 13.5V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.25 13.5V15.5C20.25 17.7091 18.4591 19.5 16.25 19.5H7.75C5.54086 19.5 3.75 17.7091 3.75 15.5V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.75 9.75L12 13.5L8.25 9.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** envelope */
export function Envelope(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M3 6.5L9.94013 13.0546C11.0963 14.1465 12.9037 14.1465 14.0599 13.0546L21 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2" y="4.5" width="20" height="15" rx="4" stroke="currentColor" strokeWidth="2"/>
      </g>
    </>
  ) })
}

/** eye-closed */
export function EyeClosed(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M3 9.75C4.57594 11.7009 7.46531 14.25 12 14.25C16.5347 14.25 19.4241 11.7009 21 9.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 15.7499L18.8081 11.9146" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.0001 17.9998L14.3354 14.0107" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 17.9998L9.66469 14.0107" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 15.7499L5.19187 11.9146" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** eye-slash */
export function EyeSlash(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M4.5 3.75L19.5 20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.5227 14.7751C13.7867 15.4442 12.8151 15.7935 11.8216 15.7462C10.828 15.6989 9.89397 15.2589 9.22488 14.5229C8.55579 13.7869 8.20646 12.8153 8.25376 11.8218C8.30105 10.8282 8.74109 9.89419 9.47706 9.2251" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.7061 8.31641C13.5033 8.46908 14.2295 8.87632 14.7755 9.47696C15.3216 10.0776 15.658 10.8392 15.7342 11.6473" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.557 15.8531C21.6007 14.0231 22.4998 12 22.4998 12C22.4998 12 19.4998 5.25001 11.9998 5.25001C11.3503 5.24912 10.7019 5.3018 10.061 5.40751" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.9375 6.43115C3.11531 8.36615 1.5 11.9999 1.5 11.9999C1.5 11.9999 4.5 18.7499 12 18.7499C13.7574 18.7637 15.4927 18.3588 17.0625 17.5687" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** eye */
export function Eye(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 5.25C4.5 5.25 1.5 12 1.5 12C1.5 12 4.5 18.75 12 18.75C19.5 18.75 22.5 12 22.5 12C22.5 12 19.5 5.25 12 5.25Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** file-add */
export function FileAdd(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M8.5 21H15.5C17.7091 21 19.5 19.2091 19.5 17V10.1582C19.5 9.41288 19.2226 8.69423 18.7217 8.14227L14.9486 3.98405C14.3799 3.35738 13.5731 3 12.7269 3H8.5C6.29086 3 4.5 4.79086 4.5 7V17C4.5 19.2091 6.29086 21 8.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.5557 3.5V7C13.5557 8.10457 14.4511 9 15.5557 9H19.0557" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 13.5H15M12 10.5V16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </g>
    </>
  ) })
}

/** file-check */
export function FileCheck(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M8.5 21L15.5 21C17.7091 21 19.5 19.2091 19.5 17L19.5 9.73371C19.5 8.94335 19.1881 8.18491 18.6321 7.62321L14.9362 3.8895C14.3727 3.32027 13.605 3 12.8041 3L8.5 3C6.29086 3 4.5 4.79086 4.5 7L4.5 17C4.5 19.2091 6.29086 21 8.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.00727 13.9993L11.0189 16.011L15.0055 11.9999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 3L14 7C14 8.10457 14.8954 9 16 9L20 9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** file-doc */
export function FileDoc(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M8.5 21H15.5C17.7091 21 19.5 19.2091 19.5 17V9.49264C19.5 8.69699 19.1839 7.93393 18.6213 7.37132L15.1287 3.87868C14.5661 3.31607 13.803 3 13.0074 3H8.5C6.29086 3 4.5 4.79086 4.5 7V17C4.5 19.2091 6.29086 21 8.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.25 3.5V6.25C14.25 7.35457 15.1454 8.25 16.25 8.25H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 10C21.5523 10 22 10.4477 22 11V15C22 15.5523 21.5523 16 21 16H3C2.44772 16 2 15.5523 2 15V11C2 10.4477 2.44772 10 3 10H21ZM11.9404 11.1504C11.6631 11.1504 11.407 11.2001 11.1729 11.3008C10.9388 11.4015 10.7354 11.5408 10.5625 11.7178C10.3932 11.8913 10.2604 12.0894 10.1631 12.3115C10.0694 12.5337 10.0225 12.7681 10.0225 13.0146C10.0225 13.2542 10.0672 13.4872 10.1572 13.7129C10.2473 13.9349 10.3754 14.136 10.541 14.3164C10.7104 14.4935 10.91 14.6365 11.1406 14.7441C11.3748 14.8483 11.6366 14.9004 11.9248 14.9004C12.2021 14.9004 12.456 14.8497 12.6865 14.749C12.9207 14.6449 13.1239 14.5056 13.2969 14.332C13.4698 14.1549 13.6036 13.9556 13.6973 13.7334C13.7909 13.5112 13.8379 13.2768 13.8379 13.0303C13.8379 12.7976 13.7922 12.5699 13.7021 12.3477C13.6121 12.1221 13.4827 11.9187 13.3135 11.7383C13.1478 11.5579 12.9479 11.4157 12.7139 11.3115C12.4833 11.2039 12.2251 11.1504 11.9404 11.1504ZM16.0527 11.1504C15.7501 11.1504 15.479 11.2039 15.2412 11.3115C15.0036 11.4156 14.8023 11.5565 14.6367 11.7334C14.471 11.9105 14.3443 12.1084 14.2578 12.3271C14.1714 12.5423 14.128 12.7627 14.1279 12.9883C14.1279 13.2244 14.1736 13.4574 14.2637 13.6865C14.3573 13.9121 14.4867 14.1169 14.6523 14.3008C14.8216 14.4812 15.0216 14.6272 15.252 14.7383C15.4861 14.8459 15.7422 14.9003 16.0195 14.9004C16.2321 14.9004 16.4469 14.8668 16.6631 14.8008C16.8828 14.7313 17.0791 14.6323 17.252 14.5039C17.4248 14.3755 17.5493 14.2214 17.625 14.041L16.9004 13.6289C16.85 13.7503 16.7768 13.8494 16.6797 13.9258C16.586 13.9987 16.4828 14.0532 16.3711 14.0879C16.2595 14.1226 16.1491 14.1396 16.041 14.1396C15.8899 14.1396 15.751 14.1097 15.625 14.0508C15.4991 13.9883 15.3908 13.9048 15.3008 13.8008C15.2144 13.6967 15.1484 13.5767 15.1016 13.4414C15.0547 13.306 15.0312 13.1653 15.0312 13.0195C15.0313 12.8877 15.0503 12.7558 15.0898 12.624C15.1295 12.4921 15.1915 12.3723 15.2744 12.2646C15.3573 12.1571 15.4618 12.0722 15.5879 12.0098C15.7139 11.9439 15.8612 11.9102 16.0303 11.9102C16.1346 11.9102 16.243 11.9259 16.3545 11.957C16.4697 11.9848 16.5744 12.0356 16.668 12.1084C16.7653 12.1813 16.8427 12.2841 16.9004 12.416L17.582 11.957C17.4523 11.7175 17.2539 11.5233 16.9873 11.374C16.7244 11.2248 16.4128 11.1505 16.0527 11.1504ZM6.375 11.1709V14.8691H7.80762C8.19297 14.8691 8.52796 14.7924 8.8125 14.6396C9.10061 14.4869 9.32391 14.2717 9.48242 13.9941C9.64095 13.7164 9.7207 13.3896 9.7207 13.0146C9.7207 12.6744 9.64797 12.3656 9.50391 12.0879C9.35982 11.8067 9.14587 11.5841 8.86133 11.4209C8.58038 11.2543 8.22899 11.171 7.80762 11.1709H6.375ZM11.9297 11.9102C12.0881 11.9102 12.2304 11.9401 12.3564 11.999C12.4826 12.0581 12.5893 12.1414 12.6758 12.249C12.7622 12.3532 12.8269 12.4716 12.8701 12.6035C12.9133 12.7354 12.9355 12.8724 12.9355 13.0146C12.9355 13.1535 12.9133 13.2904 12.8701 13.4258C12.8305 13.5577 12.7693 13.6776 12.6865 13.7852C12.6037 13.8928 12.4992 13.9799 12.373 14.0459C12.2469 14.1084 12.099 14.1396 11.9297 14.1396C11.7676 14.1396 11.6231 14.1084 11.4971 14.0459C11.3711 13.9834 11.2651 13.8999 11.1787 13.7959C11.0958 13.6917 11.0325 13.5734 10.9893 13.4414C10.9461 13.3062 10.9248 13.1675 10.9248 13.0254C10.9248 12.8866 10.9448 12.751 10.9844 12.6191C11.0276 12.4839 11.0901 12.3638 11.1729 12.2598C11.2593 12.1522 11.3639 12.0664 11.4863 12.0039C11.6124 11.9414 11.7604 11.9102 11.9297 11.9102ZM7.80762 11.9209C8.02002 11.921 8.20229 11.9678 8.35352 12.0615C8.50467 12.1518 8.62001 12.2807 8.69922 12.4473C8.77835 12.6104 8.81738 12.7996 8.81738 13.0146C8.81738 13.2228 8.77838 13.412 8.69922 13.582C8.61998 13.7486 8.50477 13.8813 8.35352 13.9785C8.20589 14.0722 8.02362 14.1191 7.80762 14.1191H7.26172V11.9209H7.80762Z" fill="#0457A5"/>
      </g>
    </>
  ) })
}

/** file-download-pdf */
export function FileDownloadPdf(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M8.5 21H15.5C17.7091 21 19.5 19.2091 19.5 17V9.49264C19.5 8.69699 19.1839 7.93393 18.6213 7.37132L15.1287 3.87868C14.5661 3.31607 13.803 3 13.0074 3H8.5C6.29086 3 4.5 4.79086 4.5 7V17C4.5 19.2091 6.29086 21 8.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.25 3.5V6.25C14.25 7.35457 15.1454 8.25 16.25 8.25H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1 2C1 1.44772 1.44772 1 2 1H12C12.5523 1 13 1.44772 13 2V6C13 6.55228 12.5523 7 12 7H2C1.44772 7 1 6.55228 1 6V2Z" fill="#D73630"/>
      <path d="M2.33984 6.0002V2.4502H3.85484C4.02484 2.4502 4.17984 2.4852 4.31984 2.5552C4.46318 2.62186 4.58651 2.71353 4.68984 2.8302C4.79318 2.94353 4.87318 3.07186 4.92984 3.2152C4.98651 3.35853 5.01484 3.5052 5.01484 3.6552C5.01484 3.85853 4.96651 4.05186 4.86984 4.2352C4.77651 4.41853 4.64484 4.56853 4.47484 4.6852C4.30818 4.79853 4.10984 4.8552 3.87984 4.8552H3.15984V6.0002H2.33984ZM3.15984 4.1402H3.82984C3.89318 4.1402 3.95151 4.12186 4.00484 4.0852C4.05818 4.04853 4.10151 3.99353 4.13484 3.9202C4.16818 3.84686 4.18484 3.75686 4.18484 3.6502C4.18484 3.5402 4.16484 3.4502 4.12484 3.3802C4.08818 3.30686 4.03984 3.25353 3.97984 3.2202C3.92318 3.18686 3.86318 3.1702 3.79984 3.1702H3.15984V4.1402Z" fill="white"/>
      <path d="M5.45508 6.0002V2.4502H6.78008C7.17008 2.4502 7.49508 2.5302 7.75508 2.6902C8.01841 2.84686 8.21674 3.0602 8.35008 3.3302C8.48341 3.59686 8.55008 3.89353 8.55008 4.2202C8.55008 4.5802 8.47674 4.89353 8.33008 5.1602C8.18341 5.42686 7.97674 5.63353 7.71008 5.7802C7.44674 5.92686 7.13674 6.0002 6.78008 6.0002H5.45508ZM7.71508 4.2202C7.71508 4.01353 7.67841 3.83186 7.60508 3.6752C7.53174 3.5152 7.42508 3.39186 7.28508 3.3052C7.14508 3.2152 6.97674 3.1702 6.78008 3.1702H6.27508V5.2802H6.78008C6.98008 5.2802 7.14841 5.2352 7.28508 5.1452C7.42508 5.05186 7.53174 4.9252 7.60508 4.7652C7.67841 4.60186 7.71508 4.4202 7.71508 4.2202Z" fill="white"/>
      <path d="M9.03418 6.0002V2.4502H11.4442V3.1702H9.85418V3.9352H11.1642V4.6002H9.85418V6.0002H9.03418Z" fill="white"/>
      <path d="M10 17L14 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 12L12 14L14 12M12 14L12 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** file-fill */
export function FileFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M4 17.5L4 6.5C4 4.84315 5.34315 3.5 7 3.5L13.8359 3.5C14.7247 3.5 15.5677 3.89429 16.1377 4.57617L19.3018 8.36133C19.7527 8.90095 20 9.58189 20 10.2852L20 17.5C20 19.1569 18.6569 20.5 17 20.5L7 20.5C5.34315 20.5 4 19.1569 4 17.5Z" fill="currentColor" stroke="currentColor" strokeWidth="2"/>
      <path d="M21 8.5L18 8.5C15.7909 8.5 14 6.70914 14 4.5L14 2.5" stroke="#E5E5E5" strokeWidth="2"/>
      <path d="M7.5 15.5L14.5 15.5" stroke="#E5E5E5" strokeWidth="2" strokeLinecap="round"/>
      <path d="M7.5 12L11.5 12" stroke="#E5E5E5" strokeWidth="2" strokeLinecap="round"/>
    </>
  ) })
}

/** file-history */
export function FileHistory(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M20 13V9.4C20 7.15979 20 6.03968 19.564 5.18404C19.1805 4.43139 18.5686 3.81947 17.816 3.43597C16.9603 3 15.8402 3 13.6 3H10.4C8.15979 3 7.03968 3 6.18404 3.43597C5.43139 3.81947 4.81947 4.43139 4.43597 5.18404C4 6.03968 4 7.15979 4 9.4V14.6C4 16.8402 4 17.9603 4.43597 18.816C4.81947 19.5686 5.43139 20.1805 6.18404 20.564C7.03968 21 8.15979 21 10.4 21H14.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="17.5" cy="17.5" r="4.5" stroke="currentColor" strokeWidth="2"/>
      <path d="M17.5 15.5V17.5L18.5 18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 7.5H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 11H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </g>
    </>
  ) })
}

/** file-pdf */
export function FilePdf(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M8.5 21H15.5C17.7091 21 19.5 19.2091 19.5 17V9.49264C19.5 8.69699 19.1839 7.93393 18.6213 7.37132L15.1287 3.87868C14.5661 3.31607 13.803 3 13.0074 3H8.5C6.29086 3 4.5 4.79086 4.5 7V17C4.5 19.2091 6.29086 21 8.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.25 3.5V6.25C14.25 7.35457 15.1454 8.25 16.25 8.25H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 11C2 10.4477 2.44772 10 3 10H21C21.5523 10 22 10.4477 22 11V15C22 15.5523 21.5523 16 21 16H3C2.44772 16 2 15.5523 2 15V11Z" fill="#D73630"/>
      <path d="M7.5 14.763V11H9.1059C9.2861 11 9.4504 11.0371 9.5988 11.1113C9.75073 11.182 9.88147 11.2791 9.991 11.4028C10.1005 11.5229 10.1853 11.659 10.2454 11.8109C10.3055 11.9628 10.3355 12.1183 10.3355 12.2773C10.3355 12.4928 10.2843 12.6978 10.1818 12.8921C10.0829 13.0864 9.9433 13.2454 9.7631 13.3691C9.58643 13.4892 9.3762 13.5493 9.1324 13.5493H8.3692V14.763H7.5ZM8.3692 12.7914H9.0794C9.14653 12.7914 9.20837 12.772 9.2649 12.7331C9.32143 12.6942 9.36737 12.6359 9.4027 12.5582C9.43803 12.4805 9.4557 12.3851 9.4557 12.272C9.4557 12.1554 9.4345 12.06 9.3921 11.9858C9.35323 11.9081 9.302 11.8515 9.2384 11.8162C9.17833 11.7809 9.11473 11.7632 9.0476 11.7632H8.3692V12.7914Z" fill="white"/>
      <path d="M10.8021 14.763V11H12.2066C12.62 11 12.9645 11.0848 13.2401 11.2544C13.5193 11.4205 13.7295 11.6466 13.8708 11.9328C14.0122 12.2155 14.0828 12.5299 14.0828 12.8762C14.0828 13.2578 14.0051 13.5899 13.8496 13.8726C13.6942 14.1553 13.4751 14.3743 13.1924 14.5298C12.9133 14.6853 12.5847 14.763 12.2066 14.763H10.8021ZM13.1977 12.8762C13.1977 12.6571 13.1589 12.4646 13.0811 12.2985C13.0034 12.1289 12.8903 11.9982 12.7419 11.9063C12.5935 11.8109 12.4151 11.7632 12.2066 11.7632H11.6713V13.9998H12.2066C12.4186 13.9998 12.5971 13.9521 12.7419 13.8567C12.8903 13.7578 13.0034 13.6235 13.0811 13.4539C13.1589 13.2808 13.1977 13.0882 13.1977 12.8762Z" fill="white"/>
      <path d="M14.596 14.763V11H17.1506V11.7632H15.4652V12.5741H16.8538V13.279H15.4652V14.763H14.596Z" fill="white"/>
      </g>
    </>
  ) })
}

/** file */
export function File(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M8.5 21H15.5C17.7091 21 19.5 19.2091 19.5 17V9.49264C19.5 8.69699 19.1839 7.93393 18.6213 7.37132L15.1287 3.87868C14.5661 3.31607 13.803 3 13.0074 3H8.5C6.29086 3 4.5 4.79086 4.5 7V17C4.5 19.2091 6.29086 21 8.5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.25 3.5V6.25C14.25 7.35457 15.1454 8.25 16.25 8.25H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.5 11.5H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8.5 15H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </g>
    </>
  ) })
}

/** gear-six */
export function GearSix(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.192 19.3228C12.0664 19.3228 11.9398 19.3228 11.817 19.3228L8.81234 21C7.64265 20.6065 6.55772 19.9959 5.61453 19.2L5.60328 15.825C5.53672 15.72 5.4739 15.6141 5.41578 15.5053L2.42797 13.8038C2.19263 12.6134 2.19263 11.3885 2.42797 10.1981L5.41297 8.50125C5.4739 8.39344 5.53672 8.28656 5.60047 8.18156L5.61547 4.80656C6.55781 4.00842 7.64245 3.39548 8.81234 3L11.8123 4.67719C11.938 4.67719 12.0645 4.67719 12.1873 4.67719L15.1873 3C16.357 3.39346 17.442 4.00414 18.3852 4.8L18.3964 8.175C18.463 8.28 18.5258 8.38594 18.5839 8.49469L21.5698 10.1953C21.8052 11.3857 21.8052 12.6106 21.5698 13.8009L18.5848 15.4978C18.5239 15.6056 18.4611 15.7125 18.3973 15.8175L18.3823 19.1925C17.4406 19.9908 16.3566 20.604 15.1873 21L12.192 19.3228Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** hand-coins */
export function HandCoins(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M10.2443 15.4628L12.2033 15.8654C12.7229 15.9722 13.2636 15.8683 13.7065 15.5764C14.1494 15.2845 14.4583 14.8286 14.565 14.3091C14.6718 13.7895 14.5679 13.2488 14.276 12.8059C13.9841 12.363 13.5282 12.0541 13.0087 11.9473L10.0701 11.3433C9.48239 11.2225 8.57797 11.6492 8.57797 11.6492L2.25 14.2503L3.7499 20.25L6.42224 19.5819C6.63798 19.528 6.86302 19.5227 7.08105 19.5664L13.8254 20.9193C14.2907 21.0126 14.7728 20.8802 15.1252 20.5623L21.407 14.8952C21.6274 14.6963 21.7675 14.4236 21.8006 14.1285C21.9939 12.4084 20.0803 11.254 18.6489 12.2271L13.7465 15.5599M19.4998 9.75C19.4998 11.4069 18.1566 12.75 16.4998 12.75C14.8429 12.75 13.4998 11.4069 13.4998 9.75C13.4998 8.09315 14.8429 6.75 16.4998 6.75C18.1566 6.75 19.4998 8.09315 19.4998 9.75ZM8.39967 6C8.39967 7.65685 7.05652 9 5.39967 9C3.74281 9 2.39967 7.65685 2.39967 6C2.39967 4.34315 3.74281 3 5.39967 3C7.05652 3 8.39967 4.34315 8.39967 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** hand-heart-fill */
export function HandHeartFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M6 19H3C2.72386 19 2.5 18.7761 2.5 18.5V13.5C2.5 13.2239 2.72386 13 3 13H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.5 15.5L14.1875 14.9375M14.1875 14.9375L19.296 12.9649C20.0128 12.6881 20.8263 12.9078 21.3063 13.5078C21.9493 14.3116 21.7692 15.4931 20.9159 16.0688L17.3125 18.5L14.0868 20.37C13.3915 20.773 12.5636 20.8803 11.7885 20.6677L5.9375 19.0625V13L8.99414 11.7297C9.35904 11.5781 9.75029 11.5 10.1454 11.5H13.8438C14.2996 11.5 14.7368 11.6811 15.0591 12.0034C15.3814 12.3257 15.5625 12.7629 15.5625 13.2188C15.5625 13.6746 15.5 14.5 14.1875 14.9375Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.7776 13.5C18.7574 12.0403 21.2888 9.7191 21.2888 7.0934C21.2888 5.14501 19.7015 3.50024 17.7441 3.50024C17.0445 3.49203 16.3585 3.69283 15.7737 4.07691C15.1889 4.46099 14.7321 5.01087 14.4618 5.65614C14.1914 5.01087 13.7346 4.46099 13.1498 4.07691C12.5651 3.69283 11.879 3.49203 11.1794 3.50024C9.22204 3.50024 7.63477 5.14501 7.63477 7.0934C7.63477 8.40131 8.26357 9.58346 9.1376 10.6866L9.55657 11.2442" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** headphones */
export function Headphones(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M21 12H19.5C17.8431 12 16.5 13.3431 16.5 15V16.75C16.5 17.8546 17.3954 18.75 18.5 18.75H19C20.1046 18.75 21 17.8546 21 16.75V12ZM21 12C21 10.8181 20.7672 9.64778 20.3149 8.55585C19.8626 7.46392 19.1997 6.47177 18.364 5.63604C17.5282 4.80031 16.5361 4.13738 15.4442 3.68508C14.3522 3.23279 13.1819 3 12 3C10.8181 3 9.64778 3.23279 8.55585 3.68508C7.46392 4.13738 6.47177 4.80031 5.63604 5.63604C4.80031 6.47177 4.13738 7.46392 3.68508 8.55585C3.23279 9.64778 3 10.8181 3 12M3 12L3 16.75C3 17.8546 3.89543 18.75 5 18.75H5.5C6.60457 18.75 7.5 17.8546 7.5 16.75V15C7.5 13.3431 6.15685 12 4.5 12H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** headset */
export function Headset(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M21 11H19.5C17.8431 11 16.5 12.3431 16.5 14V15.75C16.5 16.8546 17.3954 17.75 18.5 17.75H19C20.1046 17.75 21 16.8546 21 15.75V11ZM21 11C21 9.8181 20.7672 8.64778 20.3149 7.55585C19.8626 6.46392 19.1997 5.47177 18.364 4.63604C17.5282 3.80031 16.5361 3.13738 15.4442 2.68508C14.3522 2.23279 13.1819 2 12 2C10.8181 2 9.64778 2.23279 8.55585 2.68508C7.46392 3.13738 6.47177 3.80031 5.63604 4.63604C4.80031 5.47177 4.13738 6.46392 3.68508 7.55585C3.23279 8.64778 3 9.8181 3 11M3 11L3 15.75C3 16.8546 3.89543 17.75 5 17.75H5.5C6.60457 17.75 7.5 16.8546 7.5 15.75V14C7.5 12.3431 6.15685 11 4.5 11H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <path d="M21 15V18.5C21 19.2956 20.6839 20.0587 20.1213 20.6213C19.5587 21.1839 18.7956 21.5 18 21.5H12.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** history */
export function History(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 7.5V12L15.75 14.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.75 9.75H3V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.3375 17.9999C7.51685 19.1127 8.99798 19.8533 10.5958 20.1292C12.1937 20.4051 13.8374 20.204 15.3217 19.5511C16.8059 18.8981 18.0648 17.8222 18.9411 16.4579C19.8173 15.0936 20.2721 13.5013 20.2486 11.8799C20.2251 10.2586 19.7244 8.68013 18.8089 7.34177C17.8934 6.00341 16.6039 4.9645 15.1014 4.35485C13.5988 3.74519 11.95 3.59182 10.3608 3.91391C8.77157 4.23599 7.31253 5.01925 6.16594 6.16581C5.0625 7.28331 4.15125 8.33706 3 9.74987" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** hourglass-low */
export function HourglassLow(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M7.6 8.7L10.8 11.1C11.5111 11.6333 12.4889 11.6333 13.2 11.1L16.4 8.7C17.4072 7.94458 18 6.75903 18 5.5V4C18 3.44772 17.5523 3 17 3H7C6.44772 3 6 3.44772 6 4V5.5C6 6.75903 6.59278 7.94458 7.6 8.7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.6 15.3L10.8 12.9C11.5111 12.3667 12.4889 12.3667 13.2 12.9L16.4 15.3C17.4072 16.0554 18 17.241 18 18.5V20C18 20.5523 17.5523 21 17 21H7C6.44772 21 6 20.5523 6 20V18.5C6 17.241 6.59278 16.0554 7.6 15.3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 20H17L15 18.875L13.696 18.06C13.0807 17.6755 12.7731 17.4832 12.4432 17.4082C12.1514 17.3419 11.8486 17.3419 11.5568 17.4082C11.2269 17.4832 10.9193 17.6755 10.304 18.06L9 18.875L7 20Z" fill="currentColor"/>
      <path d="M16.3822 7.92666L17 7C17 7 13.9526 8.5 12 8.5C10.0474 8.5 7 7 7 7L7.61777 7.92666C7.76045 8.14068 7.83179 8.24769 7.91536 8.34389C7.98959 8.42934 8.07094 8.50833 8.15853 8.58001C8.25715 8.66072 8.36621 8.72888 8.58433 8.86521L10.304 9.94C10.9193 10.3245 11.2269 10.5168 11.5568 10.5918C11.8486 10.6581 12.1514 10.6581 12.4432 10.5918C12.7731 10.5168 13.0807 10.3245 13.696 9.94L15.4157 8.86521L15.4157 8.86521C15.6338 8.72888 15.7429 8.66072 15.8415 8.58001C15.9291 8.50833 16.0104 8.42933 16.0846 8.34389C16.1682 8.24769 16.2395 8.14068 16.3822 7.92666L16.3822 7.92666Z" fill="currentColor"/>
      </g>
    </>
  ) })
}

/** hourglass */
export function Hourglass(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M7.6 8.7L10.8 11.1C11.5111 11.6333 12.4889 11.6333 13.2 11.1L16.4 8.7C17.4072 7.94458 18 6.75903 18 5.5V4C18 3.44772 17.5523 3 17 3H7C6.44772 3 6 3.44772 6 4V5.5C6 6.75903 6.59278 7.94458 7.6 8.7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.6 15.3L10.8 12.9C11.5111 12.3667 12.4889 12.3667 13.2 12.9L16.4 15.3C17.4072 16.0554 18 17.241 18 18.5V20C18 20.5523 17.5523 21 17 21H7C6.44772 21 6 20.5523 6 20V18.5C6 17.241 6.59278 16.0554 7.6 15.3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** house-fill */
export function HouseFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M19 20.5H15.5H8.71914H5C3.89543 20.5 3 19.6046 3 18.5V12.5902C3 11.8163 3.29911 11.0722 3.83483 10.5137L9.83483 4.25758C11.0157 3.02631 12.9843 3.0263 14.1652 4.25758L20.1652 10.5137C20.7009 11.0722 21 11.8163 21 12.5902V18.5C21 19.6046 20.1046 20.5 19 20.5Z" fill="currentColor"/>
      <path d="M8.71914 20.5V16.8904C8.71914 15.0179 10.2371 13.5 12.1096 13.5C13.9821 13.5 15.5 15.0179 15.5 16.8904V20.5M8.71914 20.5H5C3.89543 20.5 3 19.6046 3 18.5L3 12.5902C3 11.8163 3.29911 11.0722 3.83483 10.5137L9.83483 4.25758C11.0157 3.02631 12.9843 3.0263 14.1652 4.25758L20.1652 10.5137C20.7009 11.0722 21 11.8163 21 12.5902V18.5C21 19.6046 20.1046 20.5 19 20.5H15.5M8.71914 20.5H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 16V19C9 19.2761 9.22386 19.5 9.5 19.5H14.5C14.7761 19.5 15 19.2761 15 19V16C15 14.3431 13.6569 13 12 13C10.3431 13 9 14.3431 9 16Z" fill="white"/>
      </g>
    </>
  ) })
}

/** house */
export function House(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M8.71914 21.2157V16.1061C8.71914 14.2336 10.2371 12.7157 12.1096 12.7157C13.9821 12.7157 15.5 14.2336 15.5 16.1061V21.2157M8.71914 21.2157H5C3.89543 21.2157 3 20.3202 3 19.2157V11.8059C3 11.0319 3.29911 10.2879 3.83483 9.72934L9.83483 3.47326C11.0157 2.24199 12.9843 2.24199 14.1652 3.47326L20.1652 9.72934C20.7009 10.2879 21 11.0319 21 11.8059V19.2157C21 20.3202 20.1046 21.2157 19 21.2157H15.5M8.71914 21.2157H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** identification-badge */
export function IdentificationBadge(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M9 5.5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="3" y="2" width="18" height="20" rx="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 14.5C13.6569 14.5 15 13.1569 15 11.5C15 9.84315 13.6569 8.5 12 8.5C10.3431 8.5 9 9.84315 9 11.5C9 13.1569 10.3431 14.5 12 14.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.229 18C7.86614 15.9714 9.76128 14.5 12.0001 14.5C14.2389 14.5 16.1341 15.9714 16.7712 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </g>
    </>
  ) })
}

/** identification-card */
export function IdentificationCard(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M14.5 10.5H18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.5 13.5H18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 13C9.24264 13 10.25 11.9926 10.25 10.75C10.25 9.50736 9.24264 8.5 8 8.5C6.75736 8.5 5.75 9.50736 5.75 10.75C5.75 11.9926 6.75736 13 8 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 15.25C5.33281 13.9562 6.60219 13 8 13C9.39781 13 10.6681 13.9553 11 15.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2" y="4" width="20" height="16" rx="4" stroke="currentColor" strokeWidth="2"/>
      </g>
    </>
  ) })
}

/** image */
export function Image(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M14 10.5C15.1046 10.5 16 9.60457 16 8.5C16 7.39543 15.1046 6.5 14 6.5C12.8954 6.5 12 7.39543 12 8.5C12 9.60457 12.8954 10.5 14 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2" y="3" width="20" height="18" rx="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M2 16L5.21319 12.4947C6.42917 11.1682 8.53131 11.2032 9.70243 12.5695L16.5 20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12.8838 16.1641L14.2938 14.9304C15.5204 13.8571 17.3794 13.9595 18.4808 15.1609L21.455 18.4055" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </>
  ) })
}

/** janji-bayar */
export function JanjiBayar(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M0.996094 12.7274C0.996094 12.1751 1.4433 11.7103 1.98668 11.6116C3.89329 11.2651 7.11568 10.2607 8.32937 10.2607L13.3731 10.9657H16.1983C16.9589 10.9658 17.5756 11.5827 17.5758 12.3433C17.5758 13.1041 16.9591 13.7209 16.1983 13.7209H11.6063C11.0992 13.7209 10.6881 14.1323 10.6879 14.6393C10.6879 15.1465 11.0991 15.5577 11.6063 15.5577H16.1983C17.4417 15.5577 18.5193 14.8515 19.0536 13.8184C19.1777 13.5784 19.3613 13.3682 19.6074 13.2566L19.9857 13.085C21.2962 12.4897 22.8081 13.3356 22.9866 14.764C23.0469 15.246 22.8155 15.7176 22.3974 15.9649L14.9274 20.3792C13.702 21.1033 12.2097 21.2183 10.8879 20.6904L4.90718 17.677L2.09931 17.9684C1.50943 18.0297 0.996176 17.567 0.996156 16.9739C0.996136 16.3846 0.99615 15.8726 0.996094 15.6385V12.7274Z" fill="currentColor"/>
      <path d="M14.3676 2.7002C17.1572 2.7002 19.4187 4.96167 19.4187 7.75135C19.4187 8.6939 19.1597 9.57563 18.7102 10.3307C18.121 9.59811 17.2176 9.12895 16.2043 9.12894H13.5191L9.43748 8.50113C9.41509 8.49769 9.39262 8.4945 9.37022 8.49126C9.33477 8.24976 9.31641 8.0027 9.31641 7.75135C9.31641 4.96167 11.5779 2.7002 14.3676 2.7002Z" fill="currentColor"/>
    </>
  ) })
}

/** layout */
export function Layout(props: IconProps) {
  return base({ ...props, children: (
    <>
      <rect x="3" y="3" width="8" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
      <rect x="14" y="3" width="7" height="4" rx="2" stroke="currentColor" strokeWidth="2"/>
      <rect x="14" y="10" width="7" height="4" rx="2" stroke="currentColor" strokeWidth="2"/>
      <rect x="3" y="17" width="18" height="4" rx="2" stroke="currentColor" strokeWidth="2"/>
    </>
  ) })
}

/** lightbulb-filament */
export function LightbulbFilament(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 17.6998V12.939" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.13623 10.2188L11.9999 12.9392L14.8635 10.2188" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.24992 18.4603V19.5C8.24992 20.6046 9.14535 21.5 10.2499 21.5H13.7495C14.8541 21.5 15.7495 20.6046 15.7495 19.5L15.7495 18.4603L15.7495 17.1909C15.751 16.8564 15.8312 16.5267 15.984 16.2266C16.1369 15.9265 16.3584 15.6641 16.6317 15.4591C17.8708 14.5181 18.7721 13.2237 19.2076 11.7593C19.6432 10.295 19.591 8.73515 19.0583 7.30115C18.5257 5.86715 17.5396 4.6318 16.2401 3.77039C14.9407 2.90897 13.3937 2.46523 11.8188 2.50213C7.75494 2.5928 4.47762 5.86514 4.50012 9.79666C4.50566 10.8909 4.7675 11.9697 5.26596 12.952C5.76442 13.9343 6.48655 14.7945 7.37809 15.4682C7.64925 15.6723 7.86871 15.9336 8.01978 16.2321C8.17085 16.5307 8.24956 16.8586 8.24992 17.1909V18.4603ZM15.7495 18.4603H10.6044H9.5H8.24992" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** lightning-fill */
export function LightningFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M20.0486 11.7617L9.54862 23.0117C9.43735 23.1305 9.29048 23.2098 9.13016 23.2377C8.96985 23.2657 8.80479 23.2407 8.6599 23.1667C8.51501 23.0926 8.39814 22.9734 8.32694 22.827C8.25574 22.6807 8.23407 22.5152 8.26519 22.3555L9.63956 15.4808L4.23675 13.452C4.12072 13.4086 4.01724 13.3372 3.93557 13.244C3.8539 13.1508 3.79657 13.0389 3.76872 12.9182C3.74086 12.7975 3.74334 12.6718 3.77593 12.5522C3.80853 12.4327 3.87022 12.3231 3.9555 12.2333L14.4555 0.983274C14.5668 0.864526 14.7136 0.785191 14.874 0.75724C15.0343 0.729289 15.1993 0.75424 15.3442 0.828326C15.4891 0.902412 15.606 1.02161 15.6772 1.16794C15.7484 1.31428 15.7701 1.47979 15.7389 1.63952L14.3608 8.52171L19.7636 10.5476C19.8788 10.5913 19.9814 10.6627 20.0625 10.7555C20.1435 10.8483 20.2005 10.9596 20.2283 11.0796C20.2561 11.1996 20.2539 11.3246 20.2219 11.4436C20.1899 11.5626 20.1291 11.6718 20.0449 11.7617H20.0486Z" fill="currentColor"/>
      </g>
    </>
  ) })
}

/** link-break */
export function LinkBreak(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M18 11.2498L19.1512 10.1511C19.8343 9.44381 20.2123 8.49655 20.2038 7.51331C20.1952 6.53008 19.8008 5.58953 19.1056 4.89425C18.4103 4.19897 17.4697 3.80458 16.4865 3.79604C15.5033 3.7875 14.556 4.16548 13.8488 4.84857L12.75 5.99982" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.99982 12.75L4.84857 13.8488C4.16548 14.556 3.7875 15.5033 3.79604 16.4865C3.80458 17.4697 4.19897 18.4103 4.89425 19.1056C5.58953 19.8008 6.53008 20.1952 7.51331 20.2038C8.49655 20.2123 9.44381 19.8343 10.1511 19.1512L11.2498 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 15H20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.75 9H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 18V20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 3.75V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** link */
export function Link(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M13.2543 6.06377L14.2855 5.03252C14.6914 4.62654 15.1733 4.30449 15.7036 4.08477C16.234 3.86504 16.8024 3.75195 17.3765 3.75195C17.9505 3.75195 18.519 3.86504 19.0493 4.08477C19.5797 4.30449 20.0615 4.62654 20.4674 5.03252C20.8734 5.43838 21.1954 5.92025 21.4152 6.4506C21.6349 6.98095 21.748 7.54939 21.748 8.12346C21.748 8.69752 21.6349 9.26596 21.4152 9.79631C21.1954 10.3267 20.8734 10.8085 20.4674 11.2144L18.1818 13.5L17.2124 14.4694C16.8061 14.8758 16.3236 15.1981 15.7926 15.4178C15.2615 15.6376 14.6924 15.7505 14.1177 15.75C13.543 15.7496 12.974 15.6359 12.4433 15.4153C11.9126 15.1948 11.4306 14.8717 11.0249 14.4647C10.6049 14.0449 10.2752 13.5437 10.056 12.9919C9.83671 12.44 9.73256 11.8492 9.74991 11.2556" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.7457 17.9362L9.71448 18.9674C9.30814 19.3738 8.82565 19.6961 8.29463 19.9159C7.7636 20.1356 7.19446 20.2485 6.61976 20.2481C6.04506 20.2477 5.47609 20.1339 4.94539 19.9134C4.4147 19.6928 3.9327 19.3698 3.52698 18.9628C2.70947 18.1424 2.2509 17.0311 2.25195 15.873C2.25301 14.7148 2.7136 13.6044 3.5326 12.7856L6.7876 9.53057C7.19347 9.12458 7.67534 8.80253 8.20569 8.58281C8.73604 8.36309 9.30448 8.25 9.87854 8.25C10.4526 8.25 11.021 8.36309 11.5514 8.58281C12.0817 8.80253 12.5636 9.12458 12.9695 9.53057C13.3912 9.95034 13.7224 10.4521 13.9426 11.0048C14.1629 11.5576 14.2675 12.1496 14.2501 12.7443" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** lock-key-open */
export function LockKeyOpen(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 15.75C13.0355 15.75 13.875 14.9105 13.875 13.875C13.875 12.8395 13.0355 12 12 12C10.9645 12 10.125 12.8395 10.125 13.875C10.125 14.9105 10.9645 15.75 12 15.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 16V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.25 8.75V5.75C8.25 4.75544 8.64509 3.80161 9.34835 3.09835C10.0516 2.39509 11.0054 2 12 2C12.9946 2 13.9484 2.39509 14.6517 3.09835C15.0262 3.47295 15.3134 3.91864 15.5 4.40371C15.5743 4.59689 15.6327 4.79632 15.6742 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="4" y="9" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
      </g>
    </>
  ) })
}

/** lock-key */
export function LockKey(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 15.75C13.0355 15.75 13.875 14.9105 13.875 13.875C13.875 12.8395 13.0355 12 12 12C10.9645 12 10.125 12.8395 10.125 13.875C10.125 14.9105 10.9645 15.75 12 15.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 16V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.25 8.75V5.75C8.25 4.75544 8.64509 3.80161 9.34835 3.09835C10.0516 2.39509 11.0054 2 12 2C12.9946 2 13.9484 2.39509 14.6517 3.09835C15.3549 3.80161 15.75 4.75544 15.75 5.75V8.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="4" y="9" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="2"/>
      </g>
    </>
  ) })
}

/** logo-modal */
export function LogoModal(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M11.146 7.19143C11.6089 7.19143 12.0718 7.1884 12.5347 7.19219C13.0232 7.19673 13.3142 7.4694 13.3625 7.95717C13.459 8.93498 13.5954 9.91279 13.5404 10.8974C13.4907 11.7806 13.3972 12.6622 13.3029 13.5423C13.2539 14.0043 13.3776 14.3292 13.7244 14.5019C14.1827 14.7299 14.7391 14.4512 14.8047 13.9407C14.9796 12.591 15.1523 11.2405 15.0867 9.87416C15.0784 9.69617 15.1455 9.55227 15.3113 9.4788C15.4734 9.40684 15.6084 9.46365 15.7328 9.58635C16.0894 9.93854 16.366 10.3475 16.6171 10.7778C16.8576 11.1905 17.3393 11.3587 17.7404 11.1761C18.1528 10.9883 18.3202 10.5089 18.0925 10.1165C17.7095 9.45835 17.2971 8.81985 16.7716 8.26316C16.6359 8.11925 16.6133 7.9549 16.7038 7.80569C16.7897 7.66481 16.8945 7.64057 17.1147 7.6951C18.3443 7.9958 19.3719 8.65398 20.2962 9.49849C20.7033 9.87038 21.0847 10.2642 21.3908 10.7262C21.8477 11.4147 22.0784 12.1729 22.0799 13C22.0829 14.5193 21.7791 15.9736 21.0991 17.3331C19.8928 19.7447 17.9756 21.3337 15.4305 22.1638C13.8397 22.6819 12.2075 22.7986 10.5512 22.5956C8.75989 22.3759 7.11563 21.7692 5.6719 20.6725C3.6552 19.1418 2.46026 17.1082 2.04863 14.6087C1.94308 13.9679 1.89031 13.3211 1.93705 12.672C2.00339 11.751 2.36225 10.9467 2.96764 10.2604C3.76602 9.35534 4.67373 8.58279 5.78348 8.0829C6.62483 7.70344 7.51746 7.49742 8.42742 7.39366C9.32985 7.29065 10.2383 7.23687 11.1437 7.16113L11.1468 7.19143H11.146Z" fill="currentColor"/>
      <path d="M7.23104 2.46457C7.87564 2.48818 8.42501 2.70904 8.92678 3.03652C9.21696 3.2254 9.56306 3.19265 9.77541 2.83851C10.1026 2.29245 10.5394 1.84768 11.1409 1.61616C12.0802 1.25517 12.9243 1.46003 13.6482 2.14166C13.8742 2.35414 14.0608 2.61308 14.2399 2.86973C14.4561 3.1797 14.6964 3.24748 15.0258 3.05099C15.4354 2.80652 15.8616 2.60013 16.3339 2.5095C16.7133 2.43639 17.0858 2.44781 17.4395 2.62298C17.8725 2.83699 18.0614 3.2193 17.9715 3.69758C17.8619 4.27867 17.5543 4.76228 17.2211 5.23218C17.1115 5.38679 16.9944 5.53606 16.8727 5.68076C16.6022 6.00215 16.2546 6.11029 15.8442 6.06003C14.4629 5.89172 13.08 5.70894 11.6865 5.76149C10.68 5.79957 9.67717 5.91685 8.67212 5.99529C8.357 6.01967 8.03735 6.06384 7.72601 6.0349C7.54994 6.01814 7.34591 5.90847 7.22273 5.77596C6.73381 5.25046 6.32423 4.66556 6.09148 3.9748C6.05068 3.85295 6.02121 3.72271 6.01063 3.59401C5.96302 3.01139 6.31516 2.59937 6.94313 2.49503C7.04893 2.47752 7.15699 2.47218 7.2318 2.46533L7.23104 2.46457Z" fill="currentColor"/>
    </>
  ) })
}

/** magnifying-glass-minus */
export function MagnifyingGlassMinus(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M7.5 10.5H13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.8032 15.8032L20.9998 20.9998" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** magnifying-glass-plus */
export function MagnifyingGlassPlus(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M7.5 10.5H13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.8032 15.8032L20.9998 20.9998" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 7.5V13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** magnifying-glass */
export function MagnifyingGlass(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.8032 15.8032L20.9998 20.9998" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** majelis */
export function Majelis(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M18 11.25C18.8734 11.2493 19.7349 11.4524 20.516 11.843C21.2972 12.2335 21.9765 12.8009 22.5 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.5 13.5C2.0235 12.8009 2.70281 12.2335 3.48398 11.843C4.26514 11.4524 5.12663 11.2493 6 11.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 17.25C14.0711 17.25 15.75 15.5711 15.75 13.5C15.75 11.4289 14.0711 9.75 12 9.75C9.92893 9.75 8.25 11.4289 8.25 13.5C8.25 15.5711 9.92893 17.25 12 17.25Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.75 20.25C7.2884 19.3364 8.0559 18.579 8.97665 18.0529C9.8974 17.5267 10.9395 17.25 12 17.25C13.0605 17.25 14.1026 17.5267 15.0233 18.0529C15.9441 18.579 16.7116 19.3364 17.25 20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.0938 7.5C15.234 6.95678 15.5238 6.46377 15.9302 6.07697C16.3366 5.69017 16.8433 5.42508 17.3927 5.31179C17.9422 5.19851 18.5125 5.24158 19.0387 5.43611C19.5649 5.63064 20.0261 5.96883 20.3697 6.41229C20.7134 6.85574 20.9258 7.38668 20.9829 7.9448C21.04 8.50293 20.9394 9.06587 20.6926 9.56971C20.4458 10.0735 20.0627 10.4981 19.5867 10.7951C19.1108 11.0921 18.561 11.2497 18 11.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.99995 11.25C5.43892 11.2497 4.8892 11.0921 4.41324 10.7951C3.93727 10.4981 3.55413 10.0735 3.30733 9.56971C3.06053 9.06587 2.95996 8.50293 3.01703 7.9448C3.07411 7.38668 3.28655 6.85574 3.63022 6.41229C3.9739 5.96883 4.43504 5.63064 4.96127 5.43611C5.4875 5.24158 6.05774 5.19851 6.60722 5.31179C7.1567 5.42508 7.6634 5.69017 8.06979 6.07697C8.47617 6.46377 8.76594 6.95678 8.9062 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** map-pin */
export function MapPin(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 12.75C13.6569 12.75 15 11.4069 15 9.75C15 8.09315 13.6569 6.75 12 6.75C10.3431 6.75 9 8.09315 9 9.75C9 11.4069 10.3431 12.75 12 12.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.5 9.75C19.5 15.3758 14.2902 19.9597 12.5548 21.3305C12.225 21.591 11.775 21.591 11.4452 21.3305C9.70985 19.9597 4.5 15.3758 4.5 9.75C4.5 7.76088 5.29018 5.85322 6.6967 4.4467C8.10322 3.04018 10.0109 2.25 12 2.25C13.9891 2.25 15.8968 3.04018 17.3033 4.4467C18.7098 5.85322 19.5 7.76088 19.5 9.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** medal */
export function Medal(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M18 2H6C5.72386 2 5.5 2.22386 5.5 2.5V5.5L12 8L18.5 5.5V2.5C18.5 2.22386 18.2761 2 18 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="12" cy="15" r="7" stroke="currentColor" strokeWidth="2"/>
      <path d="M11.2808 11.3567C11.5366 10.7014 12.4635 10.7014 12.7193 11.3567L13.3755 13.0355C13.3912 13.0756 13.4284 13.103 13.4714 13.1055L15.2719 13.2101C15.9739 13.2512 16.2599 14.1328 15.7158 14.5785L14.3216 15.7217C14.2882 15.7491 14.274 15.7932 14.2849 15.8349L14.7418 17.5794C14.9085 18.2171 14.2597 18.7358 13.6901 18.4855L13.577 18.4252L12.0599 17.4511C12.0236 17.4279 11.9765 17.4279 11.9403 17.4511L10.4231 18.4252L10.31 18.4855C9.7404 18.736 9.0915 18.2172 9.25833 17.5794L9.7152 15.8349C9.72335 15.8037 9.71751 15.7713 9.70011 15.7454L9.67856 15.7217L8.28426 14.5785C7.7401 14.1327 8.02603 13.251 8.7282 13.2101L9.43828 13.168L10.5287 13.1055C10.5716 13.1029 10.609 13.0756 10.6246 13.0355L11.2808 11.3567Z" fill="currentColor"/>
    </>
  ) })
}

/** megaphone */
export function Megaphone(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M10 7.5V18.8128C9.99993 18.9362 9.96943 19.0576 9.91121 19.1663C9.853 19.2751 9.76886 19.3678 9.66625 19.4363L8.635 20.1234C8.53497 20.1901 8.42037 20.2318 8.30087 20.2449C8.18137 20.2581 8.06046 20.2423 7.94833 20.1989C7.83621 20.1555 7.73616 20.0858 7.65661 19.9957C7.57706 19.9055 7.52035 19.7976 7.49125 19.6809L6.25 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21.25 18.7499C21.25 18.8927 21.2091 19.0325 21.1323 19.153C21.0555 19.2734 20.946 19.3694 20.8165 19.4297C20.687 19.4899 20.543 19.512 20.4014 19.4932C20.2598 19.4744 20.1265 19.4156 20.0172 19.3236C15.1047 15.2024 10 14.9999 10 14.9999H6.25C5.25544 14.9999 4.30161 14.6048 3.59835 13.9015C2.89509 13.1983 2.5 12.2444 2.5 11.2499C2.5 10.2553 2.89509 9.30147 3.59835 8.59821C4.30161 7.89495 5.25544 7.49986 6.25 7.49986H10C10 7.49986 15.1047 7.29736 20.0172 3.17705C20.1264 3.08515 20.2596 3.02634 20.4011 3.00752C20.5426 2.9887 20.6866 3.01066 20.816 3.07081C20.9455 3.13096 21.0551 3.22681 21.132 3.3471C21.2088 3.46739 21.2498 3.60711 21.25 3.74986V18.7499Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** minus */
export function Minus(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M3.75 12H20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** money-bag */
export function MoneyBag(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M13.6714 18.7505V17.1109M13.6714 17.1109V16.4875V14.2246H15.2455C16.0425 14.2246 16.6886 14.8707 16.6886 15.6677C16.6886 16.4648 16.0425 17.1109 15.2455 17.1109H13.6714Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.49902 17.0259V15.3863M8.49902 15.3863V14.7629V12.5H10.0731C10.8702 12.5 11.5163 13.1461 11.5163 13.9431C11.5163 14.7402 10.8702 15.3863 10.0731 15.3863H8.49902Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.4084 17.0264L10.4419 15.3867" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.99894 16.5C3.5799 12.2969 7.49894 9 8.99894 8C9.49894 8.5 9.99894 9 11.9989 9C13.9989 9 14.9989 8.5 15.4989 8C16.9989 9.33333 21.0689 12.5 20.4989 16.5C19.929 20.5 16.4989 22 12.4989 22C8.49894 22 4.41798 20.7031 3.99894 16.5Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M14.4988 4L13.7085 2.77507C13.2543 2.07099 12.3446 1.81884 11.5927 2.1886C10.7467 2.60461 10.4203 3.64338 10.8763 4.46852L11.9988 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8.99902 8L7.72263 5.44721C7.39018 4.78231 7.87368 4 8.61706 4H10.999" stroke="currentColor" strokeWidth="2"/>
      <path d="M15.499 8L16.7754 5.44721C17.1079 4.78231 16.6244 4 15.881 4H14.499" stroke="currentColor" strokeWidth="2"/>
    </>
  ) })
}

/** monitor-chart */
export function MonitorChart(props: IconProps) {
  return base({ ...props, children: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M7 20.5H17M8 12.5L11.5 9.5L13.5 11.5L16.5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** note-pencil-paper */
export function NotePencilPaper(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12.5 14.5L9.39598 14.9434C9.19799 14.9717 9.02828 14.802 9.05657 14.604L9.5 11.5L16.5858 4.41421C17.3668 3.63317 18.6332 3.63316 19.4142 4.41421L19.5858 4.58579C20.3668 5.36683 20.3668 6.63316 19.5858 7.41421L12.5 14.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.5 5.5L18.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 12V13.6C20 15.8402 20 16.9603 19.564 17.816C19.1805 18.5686 18.5686 19.1805 17.816 19.564C16.9603 20 15.8402 20 13.6 20H10.4C8.15979 20 7.03968 20 6.18404 19.564C5.43139 19.1805 4.81947 18.5686 4.43597 17.816C4 16.9603 4 15.8402 4 13.6V10.4C4 8.15979 4 7.03968 4.43597 6.18404C4.81947 5.43139 5.43139 4.81947 6.18404 4.43597C7.03968 4 8.15979 4 10.4 4L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** note-pencil */
export function NotePencil(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M9.84991 16.6865L5.33887 17.3393L6.01677 12.8534L14.9949 3.92351C16.0516 2.87248 17.7609 2.87943 18.8091 3.93902C19.8512 4.99249 19.8465 6.68987 18.7987 7.73766L9.84991 16.6865Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.0884 5.479L17.2827 8.67329" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.5 21H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </g>
    </>
  ) })
}

/** paper-plane-tilt */
export function PaperPlaneTilt(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M14.9712 9.08757L10.4161 13.6427M10.4161 13.6427L14.0915 21.0521C14.7599 22.3996 16.7321 22.2172 17.1092 20.773L21.2886 4.76503C21.6023 3.56351 20.4953 2.4565 19.2938 2.7702L3.28591 6.94963C1.84163 7.32671 1.65924 9.29892 3.00682 9.96737L10.4161 13.6427Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** pen */
export function Pen(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M9.49999 19.2524C8.83332 19.9191 6.29274 21.4343 4.99999 19.7524C2.88431 16.9998 9.61508 14.4998 7.49999 11.7524C6.11968 9.95943 3.16666 11.7524 2 12.7524" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20.3442 7.48519L21.0506 6.42704C21.8129 5.29559 21.6345 4.15516 20.6233 3.46486C19.6062 2.77056 18.491 3.07345 17.7215 4.2096L11.5441 13.483L11.3435 17.3658L14.8641 15.6944L20.3442 7.48519ZM20.3442 7.48519L21.152 8.72308C21.5896 9.39354 21.5851 10.2603 21.1407 10.9263L19.6357 13.1815M17.1815 5.21613L20.0513 7.19589" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** phone-call */
export function PhoneCall(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M8.47098 5.42491L9.47558 7.44647C9.80535 8.11007 9.74118 8.90162 9.30882 9.50344L7.89243 11.4749C7.82027 11.5825 7.77723 11.7071 7.76754 11.8364C7.75785 11.9658 7.78185 12.0955 7.83718 12.2127C8.60414 13.8126 10.2233 15.4615 11.8087 16.2407C11.9246 16.2966 12.0529 16.3213 12.1811 16.3124C12.3093 16.3035 12.433 16.2612 12.5401 16.1898L14.5213 14.7622C15.1261 14.3263 15.9233 14.263 16.5893 14.5981L18.593 15.6061C19.7346 16.1804 20.4486 17.4594 19.8452 18.5859C19.6112 19.0226 19.3229 19.4162 18.9877 19.7111C17.2674 21.4609 12.3436 23.4679 6.41052 17.4983C0.477406 11.5287 2.59002 6.6932 4.38797 5.02162C4.67613 4.69005 5.05904 4.40411 5.48428 4.17088C6.61103 3.5529 7.89908 4.27409 8.47098 5.42491Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 3C15.6819 3.4429 17.2161 4.32427 18.4459 5.55409C19.6757 6.78391 20.5571 8.31811 21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 7C15.065 7.5525 16.4475 8.935 17 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** phone */
export function Phone(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M9.47098 4.42491L10.4756 6.44647C10.8054 7.11007 10.7412 7.90162 10.3088 8.50344L8.89243 10.4749C8.82027 10.5825 8.77723 10.7071 8.76754 10.8364C8.75785 10.9658 8.78185 11.0955 8.83718 11.2127C9.60414 12.8126 11.2233 14.4615 12.8087 15.2407C12.9246 15.2966 13.0529 15.3213 13.1811 15.3124C13.3093 15.3035 13.433 15.2612 13.5401 15.1898L15.5213 13.7622C16.1261 13.3263 16.9233 13.263 17.5893 13.5981L19.593 14.6061C20.7346 15.1804 21.4486 16.4594 20.8452 17.5859C20.6112 18.0226 20.3229 18.4162 19.9877 18.7111C18.2674 20.4609 13.3436 22.4679 7.41052 16.4983C1.47741 10.5287 3.59002 5.6932 5.38797 4.02162C5.67613 3.69005 6.05904 3.40411 6.48428 3.17088C7.61103 2.5529 8.89908 3.27409 9.47098 4.42491Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** plant */
export function Plant(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12.9879 14.0117C9.99543 9.02329 13.9854 4.03579 22.4651 4.53454C22.9686 13.0142 17.9764 17.0042 12.9879 14.0117ZM12.9879 14.0117L13.0076 13.992C12.4503 14.5492 12.0083 15.2107 11.7066 15.9388C11.405 16.6668 11.2498 17.4471 11.2498 18.2352V20.9999M8.29386 15.0439C10.4314 11.4814 7.58136 7.91891 1.52418 8.27423C1.16793 14.3314 4.73136 17.1814 8.29386 15.0439ZM8.29386 15.0439L11.2498 17.9999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** plus */
export function Plus(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M3.75 12H20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 3.75V20.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** profile */
export function Profile(props: IconProps) {
  return base({ ...props, children: (
    <>
      <circle cx="12" cy="6" r="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 13C7.73097 13 5.27495 14.9706 4.03808 17.1799C2.9589 19.1075 4.79086 21 7 21H17C19.2091 21 21.0411 19.1075 19.9619 17.1799C18.725 14.9706 16.269 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </>
  ) })
}

/** prohibit */
export function Prohibit(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M18.3637 18.3637L5.63623 5.63623" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
      </g>
    </>
  ) })
}

/** qr-code */
export function QrCode(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M9.6875 4H4.8125C4.36377 4 4 4.35817 4 4.8V9.6C4 10.0418 4.36377 10.4 4.8125 10.4H9.6875C10.1362 10.4 10.5 10.0418 10.5 9.6V4.8C10.5 4.35817 10.1362 4 9.6875 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.6 13.6001H4.8C4.35817 13.6001 4 13.9583 4 14.4001V19.2001C4 19.6419 4.35817 20.0001 4.8 20.0001H9.6C10.0418 20.0001 10.4 19.6419 10.4 19.2001V14.4001C10.4 13.9583 10.0418 13.6001 9.6 13.6001Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.2001 4H14.4001C13.9583 4 13.6001 4.35817 13.6001 4.8V9.6C13.6001 10.0418 13.9583 10.4 14.4001 10.4H19.2001C19.6419 10.4 20.0001 10.0418 20.0001 9.6V4.8C20.0001 4.35817 19.6419 4 19.2001 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.6001 13.6001V16.8001" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.6001 20.0002H16.8001V15.2002" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.7998 15.2002H19.9998" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 18.3999V19.9999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** refresh-doc-fill */
export function RefreshDocFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M14 3.5C16.2091 3.5 18 5.29086 18 7.5V10.0723C17.6733 10.0255 17.3396 10 17 10C13.134 10 10 13.134 10 17C10 18.2754 10.3426 19.4702 10.9385 20.5H7C4.79086 20.5 3 18.7091 3 16.5V7.5C3 5.29086 4.79086 3.5 7 3.5H14ZM6.5 9.5C5.94772 9.5 5.5 9.94772 5.5 10.5C5.5 11.0523 5.94772 11.5 6.5 11.5H10C10.5523 11.5 11 11.0523 11 10.5C11 9.94772 10.5523 9.5 10 9.5H6.5ZM6.5 6C5.94772 6 5.5 6.44772 5.5 7C5.5 7.55228 5.94772 8 6.5 8H12C12.5523 8 13 7.55228 13 7C13 6.44772 12.5523 6 12 6H6.5Z" fill="currentColor"/>
      <path d="M23.832 16.8165C23.5709 16.537 23.1388 16.4849 22.8397 16.7407C22.5596 16.9823 22.2795 17.2239 21.9947 17.4654C22.1751 15.4759 21.1638 13.4342 19.1319 12.4726C17.285 11.5962 15.0252 11.961 13.5534 13.3821C11.2271 15.6275 11.5974 19.3034 14.1042 21.0846C14.9017 21.6483 15.8085 21.9467 16.7201 21.9988C17.2566 22.0272 17.6791 21.5393 17.5889 21.0088V20.9898C17.4987 20.4687 17.0904 20.0519 16.5682 19.9808C15.97 19.8956 15.3908 19.6255 14.9065 19.1613C14.0092 18.2944 13.7386 16.9207 14.2561 15.7885C15.0679 14.0074 17.2423 13.4863 18.7568 14.5616C19.7253 15.2485 20.1573 16.4043 19.9722 17.5033C19.6731 17.1575 19.374 16.8117 19.0749 16.4612C18.8328 16.1817 18.358 16.1249 18.0826 16.3854C17.8025 16.6459 17.7503 17.077 18.0067 17.3754C18.6713 18.1476 19.3408 18.9197 20.0054 19.6919L20.1858 19.9003C20.2855 20.014 20.4232 20.0898 20.5704 20.1229C20.7888 20.1845 21.0309 20.1466 21.2161 19.9856C22.0611 19.2608 22.9109 18.5313 23.756 17.8065C24.0361 17.5649 24.0931 17.0912 23.832 16.8165Z" fill="currentColor"/>
    </>
  ) })
}

/** rp-doc */
export function RpDoc(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M14.25 3.5L14.25 6.25002C14.25 7.35459 15.1454 8.25002 16.25 8.25002H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 11V7C5 4.79086 6.79086 3 9 3H13.9216C14.452 3 14.9607 3.21071 15.3358 3.58579L19.4142 7.66421C19.7893 8.03929 20 8.54799 20 9.07843V19.5C20 20.8807 18.8807 22 17.5 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 21.75V19.8481M10.5 19.8481V19.125V16.5H12.326C13.2505 16.5 14 17.2495 14 18.174C14 19.0986 13.2505 19.8481 12.326 19.8481H10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.5 19.75V17.8481M4.5 17.8481V17.125V14.5H6.32596C7.25051 14.5 8 15.2495 8 16.174C8 17.0986 7.25051 17.8481 6.32596 17.8481H4.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.87503 19.7497L6.75391 17.8476" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** rp-history */
export function RpHistory(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M17.25 9.75H21.75V5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.1724 15.75V14.1104M13.1724 14.1104V13.4871V11.2241H14.7465C15.5435 11.2241 16.1896 11.8702 16.1896 12.6673C16.1896 13.4643 15.5435 14.1104 14.7465 14.1104H13.1724Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 14.0259V12.3863M8 12.3863V11.7629V9.5H9.57411C10.3711 9.5 11.0172 10.1461 11.0172 10.9431C11.0172 11.7402 10.3711 12.3863 9.5741 12.3863H8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.9094 14.0264L9.94287 12.3867" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.6625 17.9999C16.4831 19.1127 15.002 19.8533 13.4041 20.1292C11.8063 20.4051 10.1625 20.204 8.67833 19.5511C7.1941 18.8981 5.9352 17.8222 5.05893 16.4579C4.18265 15.0936 3.72785 13.5013 3.75136 11.8799C3.77486 10.2586 4.27563 8.68013 5.19109 7.34177C6.10655 6.00341 7.3961 4.9645 8.89863 4.35485C10.4012 3.74519 12.05 3.59182 13.6392 3.91391C15.2284 4.23599 16.6875 5.01925 17.834 6.16581L21.75 9.74987" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** rp-transfer */
export function RpTransfer(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M16.5999 8.89984L20.5999 8.89984L20.5999 4.89984M20.5631 8.82685L17.7591 6.0228C16.1352 4.39897 13.9366 3.4808 11.6402 3.46743C9.3437 3.45407 7.13457 4.34659 5.49188 5.95141M3.1123 19.1726L3.11231 15.1726L7.11231 15.1726M3.11231 15.1726L5.91636 17.9766C7.54025 19.6004 9.73884 20.5186 12.0353 20.532C14.3317 20.5453 16.5409 19.6528 18.1836 18.048" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.1724 15.2261V13.5865M13.1724 13.5865V12.9631V10.7002H14.7465C15.5435 10.7002 16.1896 11.3463 16.1896 12.1433C16.1896 12.9404 15.5435 13.5865 14.7465 13.5865H13.1724Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 13.0259V11.3863M8 11.3863V10.7629V8.5H9.57411C10.3711 8.5 11.0172 9.14611 11.0172 9.94314C11.0172 10.7402 10.3711 11.3863 9.5741 11.3863H8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.9094 13.0259L9.94287 11.3862" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** scan-fill */
export function ScanFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M17.25 3.5H18C19.6569 3.5 21 4.84315 21 6.5V7.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.75 20.5H6C4.34315 20.5 3 19.1569 3 17.5V16.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 16.75V17.5C21 19.1569 19.6569 20.5 18 20.5H17.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 7.25V6.5C3 4.84315 4.34315 3.5 6 3.5H6.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 12L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor"/>
      </g>
    </>
  ) })
}

/** scroll */
export function Scroll(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M4.5498 16.5V6C4.5498 5.40326 4.78686 4.83097 5.20881 4.40901C5.63077 3.98705 6.20307 3.75 6.7998 3.75H19.5498" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.5 8.5H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.5 12H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.0498 20.25C15.6465 20.25 16.2188 20.0129 16.6408 19.591C17.0628 19.169 17.2998 18.5967 17.2998 18V7.5M15.0498 20.25C14.4531 20.25 13.8808 20.0129 13.4588 19.591C13.0369 19.169 12.7998 18.5967 12.7998 18C12.7998 17.0625 13.5498 16.5 13.5498 16.5H3.0498C3.0498 16.5 2.2998 17.0625 2.2998 18C2.2998 18.5967 2.53686 19.169 2.95881 19.591C3.38077 20.0129 3.95307 20.25 4.5498 20.25H15.0498ZM17.2998 7.5V6C17.2998 5.40326 17.5369 4.83097 17.9588 4.40901C18.3808 3.98705 18.9531 3.75 19.5498 3.75C20.1465 3.75 20.7188 3.98705 21.1408 4.40901C21.5628 4.83097 21.7998 5.40326 21.7998 6C21.7998 6.9375 21.0498 7.5 21.0498 7.5H17.2998Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** share-network */
export function ShareNetwork(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.5 21.75C18.1569 21.75 19.5 20.4069 19.5 18.75C19.5 17.0931 18.1569 15.75 16.5 15.75C14.8431 15.75 13.5 17.0931 13.5 18.75C13.5 20.4069 14.8431 21.75 16.5 21.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.5 8.25C18.1569 8.25 19.5 6.90685 19.5 5.25C19.5 3.59315 18.1569 2.25 16.5 2.25C14.8431 2.25 13.5 3.59315 13.5 5.25C13.5 6.90685 14.8431 8.25 16.5 8.25Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.9773 6.87207L8.52295 10.3783" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.52295 13.6221L13.9773 17.1283" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** shield-check-fill */
export function ShieldCheckFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M17.6003 5.46275V9.27896C17.6003 14.7149 12.8648 17.4242 10.8945 18.3162C10.3533 18.5612 9.74702 18.5612 9.20585 18.3162C7.23554 17.4242 2.5 14.7149 2.5 9.27896V5.46275C2.5 3.91068 3.47919 2.52335 4.98946 2.1656C6.40845 1.82948 8.25677 1.5 10.0502 1.5C11.8436 1.5 13.6919 1.82948 15.1109 2.1656C16.6212 2.52335 17.6003 3.91068 17.6003 5.46275Z" fill="currentColor"/>
      <path d="M7 9.5684L9.26025 11.8334L13.7242 7.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** shield-check */
export function ShieldCheck(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M20.5 6.83006V11C20.5 16.9397 15.3255 19.9002 13.1726 20.8749C12.5812 21.1427 11.9188 21.1427 11.3274 20.8749C9.17448 19.9002 4 16.9397 4 11V6.83006C4 5.13413 5.06995 3.61821 6.72021 3.2273C8.27073 2.86002 10.2904 2.5 12.25 2.5C14.2096 2.5 16.2293 2.86002 17.7798 3.2273C19.4301 3.61821 20.5 5.13413 20.5 6.83006Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 11L11.25 13.25L16 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** sign-in */
export function SignIn(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M2.25 12H12.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 8.25L12.75 12L9 15.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.75 3.75H14.75C16.9591 3.75 18.75 5.54086 18.75 7.75V16.25C18.75 18.4591 16.9591 20.25 14.75 20.25H12.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** sign-out */
export function SignOut(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M10.5 3.75H8.5C6.29086 3.75 4.5 5.54086 4.5 7.75V16.25C4.5 18.4591 6.29086 20.25 8.5 20.25H10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.25 8.25L21 12L17.25 15.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** sliders */
export function Sliders(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M15 18.75C15 17.5074 13.9926 16.5 12.75 16.5C11.5074 16.5 10.5 17.5074 10.5 18.75C10.5 19.9926 11.5074 21 12.75 21C13.9926 21 15 19.9926 15 18.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 12C10.5 10.7574 9.49264 9.75 8.25 9.75C7.00736 9.75 6 10.7574 6 12C6 13.2426 7.00736 14.25 8.25 14.25C9.49264 14.25 10.5 13.2426 10.5 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 5.25C18 4.00736 16.9926 3 15.75 3C14.5074 3 13.5 4.00736 13.5 5.25C13.5 6.49264 14.5074 7.5 15.75 7.5C16.9926 7.5 18 6.49264 18 5.25Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.75 18.75L10.5 18.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.75 5.25L13.5 5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.75 12L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 18.75L20.25 18.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 5.25L20.25 5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.5 12L20.25 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** sort */
export function Sort(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M4.5 12H11.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.5 6H17.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4.5 18H9.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.5 15.75L17.25 19.5L21 15.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.25 19.5V10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** speaker-simple-high */
export function SpeakerSimpleHigh(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M5.75 15.75H7.25L12.3861 19.7447C13.0429 20.2556 14 19.7875 14 18.9554V5.04464C14 4.21249 13.0429 3.7444 12.3861 4.25529L7.25 8.25H5.75C3.67893 8.25 2 9.92893 2 12C2 14.0711 3.67893 15.75 5.75 15.75Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.6265 7C21.4965 8.50597 21.9513 10.2159 21.9443 11.9551C21.9373 13.6943 21.4688 15.4005 20.5867 16.8994" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.3398 9.10742C18.4019 10.9626 18.394 12.9177 17.3171 14.7642" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** star-fill */
export function StarFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path fillRule="evenodd" clipRule="evenodd" d="M18.8151 8.09844H15.6562C15.3377 8.09844 15.0558 7.88907 14.9617 7.58199L14.0317 4.54885C13.3988 2.48372 10.4989 2.48372 9.86533 4.54885L8.93539 7.58199C8.84122 7.88907 8.55939 8.09844 8.24087 8.09844H5.18445C3.0836 8.09844 2.19797 10.7994 3.88544 12.0612L6.61088 14.0991C6.86292 14.2875 6.96679 14.6184 6.86708 14.9192L5.85266 17.99C5.17407 20.0433 7.53874 21.7441 9.24491 20.4306L11.5078 18.6886C11.7681 18.4883 12.1296 18.4883 12.39 18.6886L14.7934 20.5388C16.4802 21.8376 18.8269 20.1877 18.2002 18.1435L17.2066 14.9038C17.1165 14.6107 17.2176 14.2917 17.46 14.1054L20.139 12.0431C21.796 10.7673 20.9014 8.09914 18.8158 8.09914L18.8151 8.09844Z" fill="currentColor"/>
    </>
  ) })
}

/** star */
export function Star(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path fillRule="evenodd" clipRule="evenodd" d="M18.8151 8.09844H15.6562C15.3377 8.09844 15.0558 7.88907 14.9617 7.58199L14.0317 4.54885C13.3988 2.48372 10.4989 2.48372 9.86533 4.54885L8.93539 7.58199C8.84122 7.88907 8.55939 8.09844 8.24087 8.09844H5.18445C3.0836 8.09844 2.19797 10.7994 3.88544 12.0612L6.61088 14.0991C6.86292 14.2875 6.96679 14.6184 6.86708 14.9192L5.85266 17.99C5.17407 20.0433 7.53874 21.7441 9.24491 20.4306L11.5078 18.6886C11.7681 18.4883 12.1296 18.4883 12.39 18.6886L14.7934 20.5388C16.4802 21.8376 18.8269 20.1877 18.2002 18.1435L17.2066 14.9038C17.1165 14.6107 17.2176 14.2917 17.46 14.1054L20.139 12.0431C21.796 10.7673 20.9014 8.09914 18.8158 8.09914L18.8151 8.09844Z" stroke="currentColor" strokeWidth="2"/>
    </>
  ) })
}

/** storefront */
export function Storefront(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M19.4999 13.1445L19.3277 16.45C19.2442 18.0506 19.2025 18.8509 18.8644 19.4587C18.5668 19.9937 18.1126 20.4248 17.5628 20.6942C16.9383 21.0002 16.1369 21.0002 14.5342 21.0002H9.50119C7.9101 21.0002 7.11456 21.0002 6.4927 20.6973C5.94526 20.4307 5.4919 20.0038 5.19289 19.4734C4.85322 18.8708 4.80543 18.0767 4.70985 16.4885L4.52441 13.4071" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 9L20.1631 6.07089C19.9254 5.23895 19.8066 4.82299 19.5639 4.51423C19.3498 4.24171 19.0685 4.02953 18.7476 3.89847C18.3841 3.75 17.9515 3.75 17.0862 3.75H6.89993C6.03103 3.75 5.59659 3.75 5.23199 3.89947C4.91019 4.03139 4.62836 4.24495 4.41431 4.51906C4.17179 4.82964 4.05427 5.24789 3.81923 6.08439L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 9V10.5C9 11.2956 8.68393 12.0587 8.12132 12.6213C7.55871 13.1839 6.79565 13.5 6 13.5C5.20435 13.5 4.44129 13.1839 3.87868 12.6213C3.31607 12.0587 3 11.2956 3 10.5V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 9V10.5C15 11.2956 14.6839 12.0587 14.1213 12.6213C13.5587 13.1839 12.7956 13.5 12 13.5C11.2044 13.5 10.4413 13.1839 9.87868 12.6213C9.31607 12.0587 9 11.2956 9 10.5V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 9V10.5C21 11.2956 20.6839 12.0587 20.1213 12.6213C19.5587 13.1839 18.7956 13.5 18 13.5C17.2044 13.5 16.4413 13.1839 15.8787 12.6213C15.3161 12.0587 15 11.2956 15 10.5V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** telegram-logo-fill */
export function TelegramLogoFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M12.0003 23.0005C18.0755 23.0005 23.0005 18.0755 23.0005 12.0003C23.0005 5.92498 18.0755 1 12.0003 1C5.92498 1 1 5.92498 1 12.0003C1 18.0755 5.92498 23.0005 12.0003 23.0005Z" fill="currentColor"/>
      <path d="M16.2975 14.5072C16.2285 14.9248 16.1596 15.3425 16.0917 15.7601C16.027 16.156 15.9627 16.5524 15.8995 16.9483C15.8829 17.0524 15.8498 17.1514 15.8073 17.2467C15.6394 17.624 15.3419 17.7794 14.9383 17.6976C14.5434 17.6178 14.1906 17.439 13.8584 17.2198C13.1972 16.783 12.5371 16.3446 11.88 15.9021C11.4235 15.5948 10.9727 15.2792 10.5458 14.9305C10.4727 14.8709 10.4058 14.8067 10.3514 14.7295C10.2089 14.5253 10.2058 14.3056 10.3437 14.0973C10.4017 14.0097 10.4753 13.9356 10.553 13.8646C10.6629 13.7652 10.7779 13.6708 10.8748 13.5574C10.9054 13.5346 10.9385 13.5144 10.9665 13.4884C11.9521 12.5687 12.9335 11.6448 13.8859 10.6908C13.9957 10.581 14.0869 10.4577 14.1543 10.3178C14.1755 10.2737 14.1963 10.2271 14.2061 10.1794C14.2362 10.0343 14.1709 9.96851 14.0258 9.99545C13.9387 10.0115 13.8569 10.0426 13.7766 10.0799C13.5511 10.1841 13.3408 10.3141 13.1351 10.4525C12.0987 11.1489 11.0624 11.8448 10.0276 12.5443C9.86436 12.6547 9.69181 12.7532 9.54257 12.8837C9.27105 13.0413 9.01196 13.219 8.76013 13.4045C8.39638 13.6719 7.99376 13.7128 7.56679 13.662C7.19785 13.618 6.85171 13.4864 6.50091 13.3765C6.03922 13.232 5.58167 13.0739 5.12102 12.9257C5.02153 12.8936 4.94536 12.8376 4.88577 12.7547C4.78939 12.6205 4.78835 12.4785 4.88369 12.3417C4.95468 12.2402 5.05469 12.1713 5.15781 12.107C5.35057 11.9868 5.56405 11.9117 5.77236 11.8256C6.33146 11.594 6.89109 11.3645 7.45071 11.1334C7.49061 11.1168 7.52896 11.095 7.56782 11.0753C7.87665 10.9748 8.17097 10.8375 8.47048 10.7142C9.97162 10.0975 11.4728 9.47935 12.9718 8.85807C13.5289 8.62696 14.0807 8.38239 14.6378 8.15076C15.1627 7.93261 15.6907 7.7212 16.2187 7.51134C16.3944 7.44139 16.5804 7.41911 16.77 7.43154C17.0483 7.44968 17.226 7.62171 17.2535 7.90152C17.2742 8.1176 17.2431 8.33109 17.212 8.54302C17.0483 9.65812 16.8825 10.7727 16.7104 11.8868C16.5778 12.7449 16.4353 13.6019 16.2975 14.4595C16.2949 14.4756 16.2985 14.4921 16.299 14.5087L16.2975 14.5072Z" fill="white"/>
    </>
  ) })
}

/** telegram-logo */
export function TelegramLogo(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M7.50024 12.6439L15.9621 20.0624C16.0596 20.1484 16.1777 20.2076 16.305 20.2341C16.4322 20.2607 16.5642 20.2537 16.6879 20.2139C16.8117 20.1742 16.9229 20.1029 17.0108 20.0071C17.0987 19.9113 17.1602 19.7944 17.1893 19.6677L21.0002 3.11425C21.004 3.09765 21.0031 3.08035 20.9977 3.06421C20.9924 3.04807 20.9827 3.03369 20.9698 3.02261C20.9569 3.01153 20.9412 3.00417 20.9245 3.00132C20.9077 2.99848 20.8905 3.00024 20.8746 3.00644L1.87524 10.4418C1.7573 10.4871 1.65726 10.5696 1.59014 10.6767C1.52303 10.7838 1.49246 10.9097 1.50302 11.0357C1.51359 11.1616 1.56472 11.2807 1.64874 11.3751C1.73276 11.4695 1.84513 11.5341 1.96899 11.5593L7.50024 12.6439Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 12.6439L20.9447 3.0083" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.6597 16.2919L8.79 19.2694C8.68631 19.3769 8.55285 19.4511 8.40673 19.4823C8.26061 19.5135 8.10849 19.5004 7.96989 19.4446C7.83128 19.3888 7.7125 19.2929 7.62878 19.1691C7.54507 19.0453 7.50022 18.8994 7.5 18.75V12.644" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** transaction-history-fill */
export function TransactionHistoryFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M16.4199 3.03093L15.9781 3.92806V3.92806L16.4199 3.03093ZM20.9735 16.4199L20.0764 15.9781V15.9781L20.9735 16.4199ZM7.58458 20.9735L8.02635 20.0764V20.0764L7.58458 20.9735ZM3.92806 8.02635C4.17204 7.53087 3.96817 6.93143 3.4727 6.68745C2.97723 6.44347 2.37778 6.64734 2.1338 7.14281L3.03093 7.58458L3.92806 8.02635ZM16.4199 3.03093L15.9781 3.92806C20.4374 6.12389 22.2722 11.5189 20.0764 15.9781L20.9735 16.4199L21.8707 16.8617C24.5545 11.4115 22.3118 4.81759 16.8617 2.1338L16.4199 3.03093ZM20.9735 16.4199L20.0764 15.9781C17.8806 20.4374 12.4856 22.2722 8.02635 20.0764L7.58458 20.9735L7.14281 21.8707C12.593 24.5545 19.1869 22.3118 21.8707 16.8617L20.9735 16.4199ZM7.58458 20.9735L8.02635 20.0764C3.5671 17.8806 1.73224 12.4856 3.92806 8.02635L3.03093 7.58458L2.1338 7.14281C-0.549983 12.593 1.69263 19.1869 7.14281 21.8707L7.58458 20.9735ZM5.85598 4.11116L6.46989 4.90053C9.107 2.84961 12.7835 2.35498 15.9781 3.92806L16.4199 3.03093L16.8617 2.1338C12.9542 0.209688 8.46057 0.818698 5.24207 3.32178L5.85598 4.11116Z" fill="currentColor"/>
      <circle cx="11.834" cy="12" r="6.5" fill="currentColor"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M11.9637 14.0209H10.4185L9.25962 12.3927H8.77349V14.0209H7.36719V9H9.79351C11.0609 9 11.7206 9.82512 11.7206 10.7292C11.7364 11.0637 11.6417 11.3939 11.4516 11.668C11.2615 11.9421 10.9866 12.1445 10.6703 12.2434L11.9724 13.9375L11.9637 14.0209ZM8.77349 10.1367V11.3393H9.80652C9.88062 11.3416 9.95433 11.3278 10.0227 11.2989C10.0912 11.2701 10.1527 11.2267 10.2032 11.1719C10.2538 11.1171 10.2922 11.052 10.3158 10.9809C10.3395 10.9099 10.3478 10.8345 10.3404 10.76C10.3482 10.6821 10.34 10.6034 10.3162 10.5288C10.2924 10.4543 10.2536 10.3856 10.2022 10.327C10.1508 10.2685 10.0879 10.2213 10.0176 10.1886C9.94722 10.1558 9.87094 10.1382 9.79351 10.1367H8.77349Z" fill="white"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M13.9687 15.5H12.6666V10.4791H13.8298L13.8863 10.8609C14.0358 10.7063 14.2171 10.5868 14.4174 10.511C14.6176 10.4352 14.832 10.4048 15.0452 10.422C16.0738 10.4878 16.6468 11.1418 16.6468 12.261C16.6668 12.498 16.6375 12.7366 16.5608 12.9614C16.4841 13.1863 16.3616 13.3924 16.2013 13.5664C16.041 13.7405 15.8465 13.8787 15.6301 13.9721C15.4138 14.0655 15.1805 14.112 14.9453 14.1087C14.7657 14.1229 14.5852 14.0964 14.417 14.0311C14.2488 13.9658 14.0971 13.8634 13.9731 13.7313L13.9687 15.5ZM15.3446 12.2522C15.3543 12.1552 15.3439 12.0571 15.3142 11.9643C15.2845 11.8715 15.2361 11.7859 15.1721 11.7129C15.1081 11.64 15.0298 11.5812 14.9422 11.5403C14.8547 11.4994 14.7596 11.4773 14.6632 11.4754C14.5684 11.4759 14.4747 11.4957 14.3877 11.5335C14.3006 11.5714 14.2219 11.6265 14.1563 11.6957C14.0907 11.7649 14.0396 11.8467 14.0058 11.9362C13.9721 12.0258 13.9566 12.1213 13.96 12.2171C13.9492 12.3182 13.9592 12.4204 13.9893 12.5174C14.0194 12.6144 14.0691 12.704 14.1351 12.7807C14.2012 12.8573 14.2822 12.9194 14.373 12.9629C14.4639 13.0064 14.5627 13.0304 14.6632 13.0334C14.7598 13.0309 14.8549 13.0082 14.9425 12.9669C15.0301 12.9255 15.1083 12.8663 15.1723 12.793C15.2362 12.7197 15.2846 12.6338 15.3142 12.5408C15.3439 12.4477 15.3542 12.3495 15.3446 12.2522Z" fill="white"/>
      <path d="M4.99985 2.01567L5.01562 5.01562L8.01558 4.99985" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** transfer-arrow */
export function TransferArrow(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M7.5 13V8L5.19277 7.9725C4.74938 7.96721 4.53178 7.4302 4.84642 7.11775L9.63075 2.36669C9.83225 2.16659 10.1598 2.17427 10.3516 2.38361L14.732 7.16214C15.0259 7.48284 14.7984 8 14.3634 8H12V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.5 11L16.5 16L18.8072 16.0275C19.2506 16.0328 19.4682 16.5698 19.1536 16.8823L14.3693 21.6333C14.1678 21.8334 13.8402 21.8257 13.6484 21.6164L9.26804 16.8379C8.97407 16.5172 9.20157 16 9.63662 16L12 16L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** transfer */
export function Transfer(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M14.5 6V21L19 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.5 18L9.5 3L5 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** trash */
export function Trash(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M20.25 5.25H3.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.75 9.75V15.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.25 9.75V15.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.75 5.25V16.25C18.75 18.4591 16.9591 20.25 14.75 20.25H9.25C7.04086 20.25 5.25 18.4591 5.25 16.25V5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15.75 5.25V3.75C15.75 3.35218 15.592 2.97064 15.3107 2.68934C15.0294 2.40804 14.6478 2.25 14.25 2.25H9.75C9.35218 2.25 8.97064 2.40804 8.68934 2.68934C8.40804 2.97064 8.25 3.35218 8.25 3.75V5.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** trend-down */
export function TrendDown(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M21 17L12.5616 8.5L8.53696 12.5L3 6.99694M21 11.5V17H15.077" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** trend-up */
export function TrendUp(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M21 6.99707L12.5616 15.4971L8.53696 11.4971L3 17.0001M21 12.4971V6.99707H15.077" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** triangle-down-fill */
export function TriangleDownFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M11.5843 18.299L9.06103 14.5848C8.88418 14.3231 9.11267 14 9.47676 14L14.5232 14C14.8873 14 15.1158 14.3231 14.939 14.5848L12.4157 18.299C12.234 18.567 11.766 18.567 11.5843 18.299Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** triangle-down */
export function TriangleDown(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M13.1914 18.8896C12.5557 19.7284 11.2285 19.6684 10.6914 18.71L4.54395 7.73242C3.98456 6.73264 4.70774 5.5 5.85352 5.5L18.1465 5.5C19.2925 5.5 20.016 6.73353 19.4561 7.7334L13.3086 18.71L13.1914 18.8896Z" stroke="currentColor" strokeWidth="2"/>
    </>
  ) })
}

/** triangle-left */
export function TriangleLeft(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M5.11035 13.1914C4.27156 12.5557 4.33156 11.2285 5.29004 10.6914L16.2676 4.54394C17.2674 3.98456 18.5 4.70773 18.5 5.85352L18.5 18.1465C18.5 19.2925 17.2665 20.016 16.2666 19.4561L5.29004 13.3086L5.11035 13.1914Z" stroke="currentColor" strokeWidth="2"/>
    </>
  ) })
}

/** triangle-right */
export function TriangleRight(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M18.8896 10.8086C19.7284 11.4443 19.6684 12.7715 18.71 13.3086L7.73242 19.4561C6.73264 20.0154 5.5 19.2923 5.5 18.1465L5.5 5.85352C5.5 4.70754 6.73353 3.98402 7.7334 4.54395L18.71 10.6914L18.8896 10.8086Z" stroke="currentColor" strokeWidth="2"/>
    </>
  ) })
}

/** triangle-up-down */
export function TriangleUpDown(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M12.4157 5.70103L14.939 9.41524C15.1158 9.67693 14.8873 10 14.5232 10H9.47676C9.11267 10 8.88418 9.67693 9.06103 9.41524L11.5843 5.70103C11.766 5.43299 12.234 5.43299 12.4157 5.70103Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11.5843 18.299L9.06103 14.5848C8.88418 14.3231 9.11267 14 9.47676 14L14.5232 14C14.8873 14 15.1158 14.3231 14.939 14.5848L12.4157 18.299C12.234 18.567 11.766 18.567 11.5843 18.299Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** triangle-up-fill */
export function TriangleUpFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M12.4157 5.70104L14.939 9.41525C15.1158 9.67693 14.8873 10 14.5232 10L9.47676 10C9.11267 10 8.88418 9.67693 9.06103 9.41525L11.5843 5.70104C11.766 5.43299 12.234 5.43299 12.4157 5.70104Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** triangle-up */
export function TriangleUp(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M10.8086 5.11035C11.4443 4.27156 12.7715 4.33156 13.3086 5.29004L19.4561 16.2676C20.0154 17.2674 19.2923 18.5 18.1465 18.5H5.85352C4.70754 18.5 3.98402 17.2665 4.54395 16.2666L10.6914 5.29004L10.8086 5.11035Z" stroke="currentColor" strokeWidth="2"/>
    </>
  ) })
}

/** umbrella */
export function Umbrella(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 3C7.50617 3 3.70467 5.96421 2.44408 10.044C1.95496 11.6271 3.34315 13 5 13H19C20.6569 13 22.045 11.6271 21.5559 10.044C20.2953 5.96421 16.4938 3 12 3Z" stroke="currentColor" strokeWidth="2"/>
      <path d="M16.5 18.75C16.5 19.3467 16.2629 19.919 15.841 20.341C15.419 20.7629 14.8467 21 14.25 21C13.6533 21 13.081 20.7629 12.659 20.341C12.2371 19.919 12 19.3467 12 18.75V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.25 12.75C8.25 6 12 3 12 3C12 3 15.75 6 15.75 12.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** user */
export function User(props: IconProps) {
  return base({ ...props, children: (
    <>
      <ellipse cx="11.9473" cy="7.98106" rx="4.97266" ry="4.98106" stroke="currentColor" strokeWidth="2"/>
      <path d="M2.4375 19.9998C3.68478 15.9248 7.4707 12.9619 11.9475 12.9619C16.4006 12.9619 20.1702 15.8937 21.4375 19.9354" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </>
  ) })
}

/** users */
export function Users(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M1.19971 18.7501C1.93049 17.6265 2.93034 16.7032 4.10848 16.064C5.28663 15.4249 6.60576 15.0901 7.94611 15.0901C9.28646 15.0901 10.6056 15.4249 11.7837 16.064C12.9619 16.7032 13.9617 17.6265 14.6925 18.7501M22.7402 18.7501C22.0097 17.6265 21.0098 16.7032 19.8316 16.0644C18.6533 15.4255 17.3341 15.0913 15.9938 15.092C16.6942 15.0914 17.3859 14.9361 18.0192 14.6373C18.6526 14.3384 19.2121 13.9033 19.6578 13.3631C20.1036 12.8229 20.4245 12.1909 20.5976 11.5123C20.7708 10.8337 20.7919 10.1252 20.6595 9.43752C20.5271 8.74981 20.2444 8.09982 19.8317 7.53402C19.419 6.96821 18.8864 6.50055 18.272 6.16446C17.6575 5.82836 16.9764 5.63212 16.2774 5.58976C15.5783 5.5474 14.8785 5.65997 14.228 5.91943M12.7016 10.3366C12.7016 12.9629 10.5725 15.092 7.94607 15.092C5.31968 15.092 3.19057 12.9629 3.19057 10.3366C3.19057 7.71016 5.31968 5.58105 7.94607 5.58105C10.5725 5.58105 12.7016 7.71016 12.7016 10.3366Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** video-camera */
export function VideoCamera(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M10.75 6H8C6.13623 6 5.20435 6 4.46927 6.30448C3.48915 6.71046 2.71046 7.48915 2.30448 8.46927C2 9.20435 2 10.1362 2 12C2 13.8638 2 14.7956 2.30448 15.5307C2.71046 16.5108 3.48915 17.2895 4.46927 17.6955C5.20435 18 6.13623 18 8 18H10.75C12.6138 18 13.5456 18 14.2807 17.6955C15.2608 17.2895 16.0395 16.5108 16.4455 15.5307C16.75 14.7956 16.75 13.8638 16.75 12C16.75 10.1362 16.75 9.20435 16.4455 8.46927C16.0395 7.48915 15.2608 6.71046 14.2807 6.30448C13.5456 6 12.6138 6 10.75 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.75 9.5L20.5039 7.35494C21.1705 6.97399 22 7.45536 22 8.22318V15.7768C22 16.5446 21.1705 17.026 20.5039 16.6451L16.75 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** voucher */
export function Voucher(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M17 5H7C4.79086 5 3 6.79086 3 9V9.5L3.05972 9.51493C4.20003 9.80001 5 10.8246 5 12C5 13.1754 4.20003 14.2 3.05972 14.4851L3 14.5V15C3 17.2091 4.79086 19 7 19H17C19.2091 19 21 17.2091 21 15V9C21 6.79086 19.2091 5 17 5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M15.5 9.2002L9.5 15.2002" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="10" cy="9.2002" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="15.5" cy="14.7002" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M23 18.5C23 20.9853 20.9853 23 18.5 23C16.0147 23 14 20.9853 14 18.5C14 16.0147 16.0147 14 18.5 14C20.9853 14 23 16.0147 23 18.5Z" fill="#007D55"/>
      <path d="M16.5 18.5L17.25 19.25L18 20L20.5 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}

/** wallet */
export function Wallet(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M9 20H17.5C19.7091 20 21.5 18.2091 21.5 16V11.2C21.5 8.99087 19.7091 7.2 17.5 7.2H16M16 7.2V6.5C16 4.84315 14.6569 3.5 13 3.5H4.35C3.32827 3.5 2.5 4.32827 2.5 5.35C2.5 6.37173 3.32827 7.2 4.35 7.2H16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 15C17.8284 15 18.5 14.3284 18.5 13.5C18.5 12.6716 17.8284 12 17 12C16.1716 12 15.5 12.6716 15.5 13.5C15.5 14.3284 16.1716 15 17 15Z" fill="currentColor"/>
      <path d="M2.5 5.5V16C2.5 18.2091 4.29086 20 6.5 20H9.5" stroke="currentColor" strokeWidth="2"/>
    </>
  ) })
}

/** warning-circle */
export function WarningCircle(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10"/>
      <path d="M12 18C12.6213 18 13.125 17.4963 13.125 16.875C13.125 16.2537 12.6213 15.75 12 15.75C11.3787 15.75 10.875 16.2537 10.875 16.875C10.875 17.4963 11.3787 18 12 18Z" fill="currentColor"/>
      <path d="M12 14V12.75C13.6566 12.75 15 11.5744 15 10.125C15 8.67562 13.6566 7.5 12 7.5C10.3434 7.5 9 8.67562 9 10.125V10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** warning-fill */
export function WarningFill(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M9.98759 5.57338L3.09641 14.9166C1.62322 16.9135 3.04746 19.7326 5.52888 19.7326H18.6799C20.9508 19.7326 22.287 17.1827 20.9949 15.318L14.2848 5.63701C13.2521 4.14914 11.0643 4.11488 9.98759 5.57338Z" fill="currentColor"/>
      <path d="M11.3089 16.9287C11.118 16.7476 11.025 16.5175 11.025 16.2435C11.025 15.9694 11.118 15.7442 11.3089 15.5582C11.4998 15.3723 11.7445 15.2842 12.0381 15.2842C12.3318 15.2842 12.5618 15.3772 12.7527 15.5582C12.9387 15.7393 13.0317 15.9694 13.0317 16.2435C13.0317 16.5175 12.9387 16.7427 12.7527 16.9287C12.5667 17.1097 12.3269 17.2027 12.0381 17.2027C11.7494 17.2027 11.4998 17.1097 11.3089 16.9287ZM12.0088 7.81056C12.7185 7.81056 13.2715 8.42235 13.203 9.12713L12.7498 13.5005C12.7302 13.8969 12.3856 14.2505 11.9892 14.2505C11.5928 14.2505 11.2694 13.8969 11.2498 13.5005L10.8097 9.11734C10.7461 8.41256 11.2991 7.80566 12.0039 7.80566L12.0088 7.81056Z" fill="white"/>
    </>
  ) })
}

/** warning */
export function Warning(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M10.2539 4.07422C11.0171 2.70841 12.9828 2.7084 13.7461 4.07422L21.542 18.0244C22.2867 19.3574 21.3228 20.9998 19.7959 21H4.2041C2.67718 20.9998 1.71332 19.3574 2.45801 18.0244L10.2539 4.07422Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 13.5V9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 18C12.6213 18 13.125 17.4963 13.125 16.875C13.125 16.2537 12.6213 15.75 12 15.75C11.3787 15.75 10.875 16.2537 10.875 16.875C10.875 17.4963 11.3787 18 12 18Z" fill="currentColor"/>
      </g>
    </>
  ) })
}

/** whatsapp-logo */
export function WhatsappLogo(props: IconProps) {
  return base({ ...props, children: (
    <>
      <g>
      <path d="M7 9.85714C7 9.09938 7.30102 8.37266 7.83684 7.83684C8.22568 7.44799 8.71507 7.1828 9.2439 7.06658C9.61384 6.98527 9.96414 7.214 10.1335 7.55279L11.0261 9.33794C11.1866 9.65899 11.1628 10.0414 10.9636 10.3401L10.1857 11.5063C10.6221 12.5489 11.4511 13.3779 12.4937 13.8143L13.6599 13.0364C13.9586 12.8372 14.341 12.8134 14.6621 12.9739L16.4472 13.8665C16.786 14.0359 17.0147 14.3862 16.9334 14.7561C16.8172 15.2849 16.552 15.7743 16.1632 16.1632C15.6273 16.699 14.9006 17 14.1429 17C12.2485 17 10.4316 16.2475 9.09209 14.9079C7.75255 13.5684 7 11.7515 7 9.85714Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.49356 19.7914C9.38406 20.8856 11.608 21.2549 13.7506 20.8304C15.8933 20.406 17.8084 19.2168 19.1391 17.4846C20.4697 15.7524 21.125 13.5954 20.9827 11.4157C20.8404 9.23605 19.9103 7.18253 18.3657 5.638C16.8212 4.09348 14.7677 3.16336 12.588 3.02108C10.4084 2.87879 8.25138 3.53405 6.51916 4.86468C4.78695 6.1953 3.59777 8.11048 3.17333 10.2531C2.74889 12.3958 3.11817 14.6197 4.21231 16.5102L3.0395 20.0118C2.99543 20.1439 2.98903 20.2857 3.02103 20.4213C3.05302 20.5569 3.12215 20.6808 3.22065 20.7794C3.31915 20.8779 3.44314 20.947 3.57871 20.979C3.71429 21.011 3.8561 21.0046 3.98825 20.9605L7.49356 19.7914Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </>
  ) })
}

/** withdraw */
export function Withdraw(props: IconProps) {
  return base({ ...props, children: (
    <>
      <path d="M13.1724 13.2505V11.6109M13.1724 11.6109V10.9875V8.72461H14.7465C15.5435 8.72461 16.1896 9.37072 16.1896 10.1677C16.1896 10.9648 15.5435 11.6109 14.7465 11.6109H13.1724Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 11.5259V9.88627M8 9.88627V9.26293V7H9.57411C10.3711 7 11.0172 7.64611 11.0172 8.44314C11.0172 9.24016 10.3711 9.88627 9.5741 9.88627H8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.9094 11.5264L9.94287 9.88671" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8.5 15.5H6C3.79086 15.5 2 13.7091 2 11.5V8C2 5.79086 3.79086 4 6 4H18C20.2091 4 22 5.79086 22 8V11.5C22 13.7091 20.2091 15.5 18 15.5H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9.5 19.5L12 22L14.5 19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 22V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </>
  ) })
}
