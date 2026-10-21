// =============================================================================
// BrandAssets — the Assets section's Brand page: every piece of FunDS brand
// artwork (design-system/assets), and the line that puts it in a prototype.
//
// Read-only on purpose. The artwork ships with the design system as files in
// public/funds/, so a change reaches every prototype and goes through the
// design system's review. In a prototype, Edit's Component section switches a
// selected piece to another of its family by name.
// =============================================================================

'use client'

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  NAV_ICONS,
  NavIcon,
  PRODUCT_LOGOS,
  ProductLogo,
  SERVICE_ICONS,
  ServiceIcon,
  WORDMARKS,
  Wordmark,
} from '@/design-system/assets'
import { Check, Copy, MagnifyingGlass } from '@/design-system/icons'

interface Piece {
  name: string
  /** What a prototype writes for it. */
  code: string
  art: ReactNode
}

interface Family {
  id: string
  title: string
  description: string
  /** Tile grid, sized to the artwork's shape. */
  grid: string
  pieces: Piece[]
}

const FAMILIES: Family[] = [
  {
    id: 'services',
    title: 'Service icons',
    description: 'The PPOB and service tiles, 48px square.',
    grid: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8',
    pieces: SERVICE_ICONS.map((name) => ({
      name,
      code: `<ServiceIcon name="${name}" />`,
      art: <ServiceIcon name={name} size={48} />,
    })),
  },
  {
    id: 'logos',
    title: 'Product logos',
    description: 'A product’s mark without its name, 56px square. Pair it with a label.',
    grid: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6',
    pieces: PRODUCT_LOGOS.map((name) => ({
      name,
      code: `<ProductLogo name="${name}" />`,
      art: <ProductLogo name={name} size={56} />,
    })),
  },
  {
    id: 'wordmarks',
    title: 'Wordmarks',
    description: 'Mark and name as one lockup, sized by height. It says its own name, so never add a label.',
    grid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    pieces: WORDMARKS.map((name) => ({
      name,
      code: `<Wordmark name="${name}" height={20} />`,
      art: <Wordmark name={name} height={24} className="max-w-full" />,
    })),
  },
  {
    id: 'nav',
    title: 'Navigation icons',
    description: 'The bottom bar’s own artwork. The selected look is drawn in, so it takes active rather than a colour.',
    grid: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6',
    pieces: NAV_ICONS.map((name) => ({
      name,
      code: `<NavIcon name="${name}" />`,
      art: (
        <span className="flex items-center gap-12">
          <NavIcon name={name} size={24} />
          <NavIcon name={name} size={24} active />
        </span>
      ),
    })),
  },
]

const TOTAL = FAMILIES.reduce((n, f) => n + f.pieces.length, 0)

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copy = useCallback((value: string) => {
    const done = () => {
      setCopied(value)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(null), 1200)
    }
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).then(done, done)
    else done()
  }, [])
  return { copied, copy }
}

export function BrandAssets() {
  const [query, setQuery] = useState('')
  const { copied, copy } = useCopy()

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return FAMILIES.map((family) => ({
      ...family,
      pieces: q ? family.pieces.filter((p) => p.name.includes(q)) : family.pieces,
    })).filter((family) => family.pieces.length > 0)
  }, [query])

  return (
    <div className="size-full overflow-y-auto">
      <div className="mx-auto flex max-w-1152 flex-col gap-24 p-24">
        <header className="flex flex-wrap items-end justify-between gap-16">
          <div className="flex max-w-720 flex-col gap-8">
            <h1 className="text-24 font-bold text-default dark:text-neutral-50">Brand</h1>
            <p className="text-14 text-caption dark:text-neutral-400">
              FunDS’s own artwork. Click a piece to copy the line that puts it in a prototype. It ships with the
              design system, so a change reaches every prototype. In a prototype, select one in Edit to switch
              it.
            </p>
          </div>
          <label className="flex h-40 w-full max-w-320 items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 dark:border-ink-700 dark:bg-ink-900">
            <MagnifyingGlass size={16} className="flex-none text-caption dark:text-neutral-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${TOTAL} pieces`}
              aria-label="Search the brand artwork"
              className="min-w-0 flex-1 bg-transparent text-14 text-default outline-none placeholder:text-placeholder dark:text-neutral-50 dark:placeholder:text-neutral-600"
            />
          </label>
        </header>

        {shown.length === 0 ? (
          <p className="text-14 text-caption dark:text-neutral-400">Nothing is called “{query.trim()}”.</p>
        ) : null}

        {shown.map((family) => (
          <section
            key={family.id}
            className="flex flex-col gap-16 rounded-16 border border-default bg-neutral-white p-20 dark:border-ink-700 dark:bg-ink-900"
          >
            <div className="flex flex-col gap-4">
              <h2 className="text-16 font-bold text-default dark:text-neutral-50">{family.title}</h2>
              <p className="text-14 text-caption dark:text-neutral-400">{family.description}</p>
            </div>
            <div className={`grid gap-8 ${family.grid}`}>
              {family.pieces.map((piece) => {
                const isCopied = copied === piece.code
                return (
                  <button
                    key={piece.name}
                    type="button"
                    onClick={() => copy(piece.code)}
                    title={piece.code}
                    className={
                      isCopied
                        ? 'flex flex-col gap-8 rounded-8 border border-primary-500 bg-primary-50 p-8 text-left dark:bg-ink-800'
                        : 'flex flex-col gap-8 rounded-8 border border-default p-8 text-left hover:border-primary-500 dark:border-ink-700 dark:hover:border-primary-400'
                    }
                  >
                    {/* White in either theme: the artwork is drawn for the app's light screens. */}
                    <span className="flex h-80 w-full items-center justify-center rounded-6 bg-neutral-white">
                      {piece.art}
                    </span>
                    <span className="flex min-w-0 items-center gap-4 text-12">
                      {isCopied ? (
                        <Check size={16} className="flex-none text-link" />
                      ) : (
                        <Copy size={16} className="flex-none text-caption dark:text-neutral-500" />
                      )}
                      <span className="truncate text-default dark:text-neutral-50">
                        {isCopied ? 'Copied' : piece.name}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
