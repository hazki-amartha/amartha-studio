'use client'

// The one majelis card, shared by the Majelis directory and the group's own
// page — the same way `MitraCard` is shared by the two mitra surfaces.
//
// It was the directory's private row. It is lifted out here because the BM's
// page has to carry the group's Business Partner too, and a second drawing of
// "what this majelis is" is exactly how the two surfaces end up disagreeing
// about which BP owns it.
//
// `onOpen` is what separates the two uses: in the directory the card is the
// tappable object in a list, on the group's page it is the header of the page
// you are already on, so it renders as a plain block.

import { Badge } from '@/design-system/components'
import { BpLine } from './bp'
import { shortfallOf, type MajelisEntry } from './schedule'
import { ProductBadge } from './ui'

/**
 * The two badges split on purpose. Lancar / N Mitra DPD is pinned top-right,
 * because it is what the BM skims a whole column for and it has to sit at the
 * same height on every row to be skimmable at all. The product and the BP stay
 * at the foot: they are what the group IS and who runs it, read once she has
 * stopped on it.
 */
export function MajelisCard({ entry, onOpen }: { entry: MajelisEntry; onOpen?: () => void }) {
  const draft = entry.status === 'draft'
  const short = shortfallOf(entry)

  const body = (
    <>
      <span className="flex items-start gap-8">
        <span className="min-w-0 flex-1 text-16 font-bold text-default">{entry.name}</span>
        <span className="flex shrink-0">
          <StatusBadge entry={entry} />
        </span>
      </span>
      <span className="line-clamp-2 text-14 font-regular text-default">{entry.place}</span>
      <span className="text-14 font-regular text-caption">
        {entry.day}, {entry.time} ·{' '}
        {draft ? `${entry.members} dari ${entry.members + short} mitra` : `${entry.members} mitra`}
      </span>
      <span className="flex flex-wrap items-center gap-4 pt-2">
        <ProductBadge product={entry.type} />
      </span>
      {/* Who carries the group, last on the card and as plain text — the same
          slot and the same styling the mitra card gives it, so the BP is read
          the same way whichever directory the BM is in. */}
      <BpLine bpId={entry.bpId} />
      {/* A draft's whole story is the gap. "Draft" alone says the group isn't
          running; it doesn't say she is four women away from disbursing it. */}
      {draft ? (
        <span className="text-12 font-bold text-orange-500">Kurang {short} mitra untuk aktif</span>
      ) : null}
    </>
  )

  const className = 'flex w-full flex-col gap-4 rounded-12 border border-default bg-neutral-white p-12 text-left'

  return onOpen ? (
    <button type="button" onClick={onOpen} className={`${className} active:bg-neutral-50`}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  )
}

/**
 * One badge, three states, in priority order. A draft cannot be menunggak —
 * nothing has been disbursed — so the three never contend for the slot.
 */
function StatusBadge({ entry }: { entry: MajelisEntry }) {
  if (entry.status === 'draft') return <Badge intent="yellow">Draft</Badge>
  if (entry.menunggak > 0) return <Badge intent="orange">{entry.menunggak} Mitra DPD</Badge>
  return <Badge intent="green">Lancar</Badge>
}
