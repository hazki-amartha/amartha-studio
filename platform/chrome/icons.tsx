// =============================================================================
// Chrome icons — inline SVG, currentColor, token-sized via className.
// Hand-drawn so the shell needs no icon-library dependency. Not part of FunDS;
// these dress the tool's own chrome, not prototype screens.
// =============================================================================

import type { ReactNode } from 'react'

type IconProps = { className?: string }

function icon(path: ReactNode) {
  return function Icon({ className }: IconProps) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {path}
      </svg>
    )
  }
}

// Projects — a grid of cards (the gallery of prototypes).
export const ProjectsIcon = icon(
  <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </>,
)

// Jump to — a magnifier, for the ⌘K search.
export const SearchIcon = icon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </>,
)

// FunDS — layered swatches (the design system).
export const FundsIcon = icon(
  <>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </>,
)

// Assets — a framed picture with a spark (the illustration generator).
export const AssetsIcon = icon(
  <>
    <rect x="3" y="5" width="18" height="15" rx="2" />
    <path d="M3 16l5-5 5 5" />
    <path d="M13 14l2-2 6 6" />
    <path d="M17 2v4M15 4h4" />
  </>,
)

// Share — an arrow out of a tray: the project sidebar's Share button.
export const ShareIcon = icon(
  <>
    <path d="M12 15V3M7 8l5-5 5 5" />
    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </>,
)

// A chain link — a share link, in the Share panel's list.
export const LinkIcon = icon(
  <>
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
  </>,
)

// Account — a person; signed out, it offers Google sign-in.
export const AccountIcon = icon(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>,
)

// Branches — a fork: the project and its branches, atop the sidebar.
export const BranchIcon = icon(
  <>
    <path d="M6 3v12" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </>,
)

// Panel toggle — fold the sidebar to its icon rail, and open it again.
export const PanelIcon = icon(
  <>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </>,
)

// Breadcrumb separator.
export const ChevronRightIcon = icon(<path d="M9 6l6 6-6 6" />)
export const ChevronLeftIcon = icon(<path d="M15 6l-6 6 6 6" />)
// A control that opens a menu — Chat's effort.
export const ChevronDownIcon = icon(<path d="M6 9l6 6 6-6" />)

// Mobile top nav — hamburger and its close state.
export const MenuIcon = icon(
  <>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </>,
)
export const CloseIcon = icon(
  <>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </>,
)

// Prototype view — a phone.
export const DeviceIcon = icon(
  <>
    <rect x="6" y="2" width="12" height="20" rx="2" />
    <path d="M11 18h2" />
  </>,
)

// Full screen — four arrows pushing out to the corners of the window.
export const ExpandIcon = icon(
  <>
    <path d="M9 3H3v6" />
    <path d="M15 3h6v6" />
    <path d="M9 21H3v-6" />
    <path d="M15 21h6v-6" />
  </>,
)

// Theme toggle — moon (in dark, offering light) and sun (in light, offering dark).
export const MoonIcon = icon(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />)
export const SunIcon = icon(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>,
)

// Studio brand mark — the interlocking staircase glyph. Filled (not stroked),
// so it doesn't go through `icon()`; inherits colour from its container.
export function StudioMark({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 34 34"
      width="34"
      height="34"
      fill="currentColor"
      aria-hidden
    >
      <path d="M15 25C15 25.5667 15.1917 26.0417 15.575 26.425C15.9583 26.8083 16.4333 27 17 27H21C21.5833 27 22.0583 26.8083 22.425 26.425C22.8083 26.0417 23 25.5667 23 25V21C23 20.4167 22.8083 19.9417 22.425 19.575C22.0583 19.1917 21.5833 19 21 19H12.9C11.6333 19 11 18.3667 11 17.1V17C11 16.4167 10.8083 15.9417 10.425 15.575C10.0583 15.1917 9.58333 15 9 15H8.9C7.63333 15 7 14.3667 7 13.1V8.9C7 7.63333 7.63333 7 8.9 7H9C9.58333 7 10.0583 6.80833 10.425 6.425C10.8083 6.04167 11 5.56667 11 5V4.9C11 3.63333 11.6333 3 12.9 3H17.1C18.3667 3 19 3.63333 19 4.9V5C19 5.56667 19.1917 6.04167 19.575 6.425C19.9583 6.80833 20.4333 7 21 7C21.5833 7 22.0583 6.80833 22.425 6.425C22.8083 6.04167 23 5.56667 23 5V4.9C23 3.63333 23.6333 3 24.9 3H25.1C26.3667 3 27 3.63333 27 4.9V9C27 9.6 26.8167 10.0833 26.45 10.45C26.0833 10.8167 25.6 11 25 11H20.9C19.6333 11 19 10.3667 19 9.1V9C19 8.41667 18.8083 7.94167 18.425 7.575C18.0583 7.19167 17.5833 7 17 7H13C12.4333 7 11.9583 7.19167 11.575 7.575C11.1917 7.94167 11 8.41667 11 9V13C11 13.5667 11.1917 14.0417 11.575 14.425C11.9583 14.8083 12.4333 15 13 15H21.1C22.3667 15 23 15.6333 23 16.9V17C23 17.5667 23.1917 18.0417 23.575 18.425C23.9583 18.8083 24.4333 19 25 19H25.1C26.3667 19 27 19.6333 27 20.9V25.1C27 26.3667 26.3667 27 25.1 27H25C24.4333 27 23.9583 27.1917 23.575 27.575C23.1917 27.9417 23 28.4167 23 29V29.1C23 30.3667 22.3667 31 21.1 31H16.9C15.6333 31 15 30.3667 15 29.1V29C15 28.4167 14.8083 27.9417 14.425 27.575C14.0583 27.1917 13.5833 27 13 27C12.4333 27 11.9583 27.1917 11.575 27.575C11.1917 27.9417 11 28.4167 11 29V29.1C11 30.3667 10.3667 31 9.1 31H8.9C7.63333 31 7 30.3667 7 29.1V25C7 24.4 7.18333 23.9167 7.55 23.55C7.91667 23.1833 8.4 23 9 23H13.1C14.3667 23 15 23.6333 15 24.9V25Z" />
    </svg>
  )
}

// Flow view — connected nodes.
export const FlowIcon = icon(
  <>
    <rect x="3" y="3" width="7" height="6" rx="1.5" />
    <rect x="14" y="15" width="7" height="6" rx="1.5" />
    <rect x="3" y="15" width="7" height="6" rx="1.5" />
    <path d="M6.5 9v6" />
    <path d="M10 18h4" />
  </>,
)

// --- Layer kinds -------------------------------------------------------------
// Glyphs for the layers outline, drawn to be told apart at 12px in a dense
// list: one silhouette per kind rather than one detailed picture per element.

// Component — a FunDS component boundary. Filled, because it is the one kind
// that is a thing in itself rather than markup.
export const ComponentIcon = icon(
  <path d="M12 3l4 4-4 4-4-4 4-4z M12 13l4 4-4 4-4-4 4-4z" fill="currentColor" stroke="none" />,
)

// Frame — a container that lays other things out (Stack, Row, Grid, Section).
export const FrameIcon = icon(
  <>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M9 4v16M4 9h16" />
  </>,
)

// Text — the copy on screen.
export const TextIcon = icon(
  <>
    <path d="M5 6h14" />
    <path d="M12 6v13" />
    <path d="M9 19h6" />
  </>,
)

// Media — an image, an icon, anything drawn rather than laid out.
export const MediaIcon = icon(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 16l5-4 4 3 3-2 6 4" />
  </>,
)

// Attach — a paperclip: images and PDFs that go with a Chat message.
export const AttachIcon = icon(
  <path d="M20.5 11.5l-8.3 8.3a5 5 0 0 1-7-7l8.6-8.6a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4l7.9-7.9" />,
)

// Document — a page with a folded corner: an attached PDF.
export const DocumentIcon = icon(
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </>,
)

// List — a repeated set, where the outline's rows are siblings.
export const ListIcon = icon(
  <>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </>,
)

// Edit — a pencil: pick an element, tweak its tokens.
export const EditIcon = icon(
  <>
    <path d="M17 3.5a2.5 2.5 0 0 1 3.5 3.5L8 19.5 3 21l1.5-5L17 3.5z" />
    <path d="M14.5 6l3.5 3.5" />
  </>,
)

// AI Chat — a rounded message bubble with lines of text: ask Claude for a change.
export const ChatIcon = icon(
  <>
    <path d="M6 4h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-6l-4 3.5V17H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" />
    <path d="M8 9h8M8 12.5h5" />
  </>,
)

// Inspect — a marquee with a cursor in it: pick an element, read its spec.
export const InspectIcon = icon(
  <>
    <path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8" />
    <path d="M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8" />
    <path d="M3 16v2.5A2.5 2.5 0 0 0 5.5 21H8" />
    <path d="M11 11l7 2.6-3 1.2-1.2 3z" />
  </>,
)

// A pointer arrow — the selection chip in chat: "this is what you clicked".
export const CursorIcon = icon(<path d="M5 3l14 7-6 2-2 6z" />)

// Figma's mark, outlined — a Figma link attached to a chat message.
export const FigmaIcon = icon(
  <>
    <path d="M12 2H8.5a3.5 3.5 0 0 0 0 7H12z" />
    <path d="M12 2h3.5a3.5 3.5 0 0 1 0 7H12z" />
    <path d="M12 9H8.5a3.5 3.5 0 0 0 0 7H12z" />
    <circle cx="15.5" cy="12.5" r="3.5" />
    <path d="M8.5 16a3.5 3.5 0 1 0 3.5 3.5V16z" />
  </>,
)

// Trash — deletes something, after asking.
export const TrashIcon = icon(
  <>
    <path d="M4 7h16" />
    <path d="M9 7V4.5h6V7" />
    <path d="M6 7l1 13h10l1-13" />
  </>,
)

// Stop — a square: stops the chat turn that is running.
export const StopIcon = icon(<rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />)

// A branch's privacy: locked while only its designer sees it, open once it's
// shared with the team.
export const LockIcon = icon(
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
  </>,
)
export const LockOpenIcon = icon(
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7.5a4 4 0 0 1 7.8-1.3" />
  </>,
)

// --- Panel tabs --------------------------------------------------------------

// CSS — angle brackets: read the element's computed styles.
export const CodeIcon = icon(<path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />)

// Screens — two pages, one behind the other.
export const ScreensIcon = icon(
  <>
    <rect x="7" y="3" width="12" height="15" rx="2" />
    <path d="M5 7v11a3 3 0 0 0 3 3h8" />
  </>,
)

// Layers — stacked sheets.
export const LayersIcon = icon(
  <>
    <path d="M12 3l9 5-9 5-9-5 9-5z" />
    <path d="M3 13l9 5 9-5" />
  </>,
)

// Notes — a page with lines.
export const NotesIcon = icon(
  <>
    <rect x="5" y="3" width="14" height="18" rx="2" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </>,
)

/** A clock turning back — a project's save history. */
export const HistoryIcon = icon(
  <>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 2" />
  </>,
)

// Zoom — the canvas's zoom steps.
export const PlusIcon = icon(<path d="M12 5v14M5 12h14" />)
export const MinusIcon = icon(<path d="M5 12h14" />)

// Comment — a pin-shaped bubble with a plus: drop review feedback on a spot.
export const CommentIcon = icon(
  <>
    <path d="M12 21H4.5A1.5 1.5 0 0 1 3 19.5V12a9 9 0 1 1 9 9z" />
    <path d="M12 8.5v7M8.5 12h7" />
  </>,
)

// Resolve — a tick in a circle.
export const CheckCircleIcon = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.5 2.5L16 9.5" />
  </>,
)
// The chosen item in a menu.
export const CheckIcon = icon(<path d="M5 12.5l4.5 4.5L19 7.5" />)

// A comment's own actions — edit, delete — behind three dots.
export const MoreIcon = icon(
  <>
    <circle cx="5" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="19" cy="12" r="1" fill="currentColor" />
  </>,
)
