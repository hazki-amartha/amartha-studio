'use client'

// Majelis View — the screen the direction is named after.
//
// Reached from the Majelis tab, not from the schedule: a BP sent here by the
// day already knows the group and goes straight into stage 1, while a BP who
// opened the directory is looking something up and this is the answer.
//
// It is a ROSTER, not a dashboard and not yet a queue. Before the BP starts the
// pelayanan she wants one thing from this page: who is in this group and what
// state are they in. Each card is down to the two facts that answer that —
// tunggakan and DPD — plus the labels that change how she TALKS to a mitra:
// who the Ketua is, which product each one is on, and any arrangement already
// in place. The two group totals that used to head the page are gone; they were
// BM monitoring numbers on a page whose job is the list underneath them.
//
// Sorting is the only control. It exists because "who is behind?" and "who is
// this group, in order?" are both real questions and neither is a filter: a BP
// scanning for trouble still needs to see everyone, and hiding the current mitra
// would make the count at the top a lie. Default is by arrears, because the
// mitra worth reading about first are the ones who are behind.
//
// The page has no footer action. Starting a pelayanan and sending a majelis its
// reminder are BP work, done from the BP app — this is the BM's read-only view
// of the same group, so it ends at the roster.

import { useState } from 'react'
import { Badge, BottomSheet, NavigationHeader } from '@/design-system/components'
import { Sort } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { MAJELIS, type Mitra } from '../lib/data'
import { IconArrowRight, IconCalendar, IconChevronRight, IconUsers } from '../lib/icons'
import { MajelisCard } from '../lib/majelis-card'
import { DpdBadge, KetuaBadge, MitraCard } from '../lib/mitra-card'
import { openMajelisEntry, store, useApp } from '../lib/store'
import { AppScreen, EmptyState, OptionSheet, PinMark, ProductBadge, SearchField, SectionTitle, VisitTitle } from '../lib/ui'

type Sort = 'tunggakan' | 'nama'
type Sheet = 'edit' | 'sort' | null

const SORT_OPTIONS: { label: string; value: Sort }[] = [
  { label: 'Tunggakan terbanyak', value: 'tunggakan' },
  { label: 'Nama A–Z', value: 'nama' },
]

const sortLabel = (sort: Sort) =>
  SORT_OPTIONS.find((o) => o.value === sort)?.label ?? SORT_OPTIONS[0].label

export function MajelisScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)
  const [sort, setSort] = useState<Sort>('tunggakan')
  const [query, setQuery] = useState('')
  const [sheet, setSheet] = useState<Sheet>(null)

  const q = query.trim().toLowerCase()
  const members = MAJELIS.members
    .filter((m) => !q || m.name.toLowerCase().includes(q))
    .sort((a, b) =>
      sort === 'nama' ? a.name.localeCompare(b.name) : b.dpd - a.dpd || a.name.localeCompare(b.name),
    )

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          // The kumpulan SLOT rides in the subtitle — "kapan majelis ini?" is
          // asked every time this page is opened. The trailing control is now
          // EDIT rather than Info: the address moved into the page itself, so
          // the only thing left behind a toggle was the ability to change it.
          title={
            <VisitTitle
              title={group.name}
              when={`${group.day}, ${group.time} · ${MAJELIS.members.length} mitra`}
            />
          }
          // A word, not a pencil. The pencil had to carry a screen-reader label
          // to say what it edited, which is the tell that it was not saying it
          // to anyone else either.
          link="Edit"
          onLinkClick={() => setSheet('edit')}
          onBack={() => flow.go('majelis-list')}
        />
      }
    >
      {/* The group, in the same card the directory lists it with — including
          the BP whose book it is on. It replaced a one-line address strip:
          the BM arrives here from a filtered directory, and the card that
          answered "which of these is it" is the one she should still be
          reading once she has opened it. */}
      <MajelisCard entry={group} />

      {/* The route, kept as its own line. It is the one thing the card does not
          carry — the address on it is text, and what a BM standing outside
          needs from it is a way there. */}
      <div className="flex items-center gap-8 rounded-12 bg-neutral-white p-12 text-caption">
        <PinMark />
        <span className="min-w-0 flex-1 truncate text-12 text-default">{group.place}</span>
        <button
          type="button"
          className="flex shrink-0 items-center gap-4 text-12 font-bold text-link"
        >
          Rute
          <IconArrowRight size={16} />
        </button>
      </div>

      <div className="flex items-center gap-8">
        <SectionTitle>Daftar Mitra</SectionTitle>
        <span className="flex-1" />
        {/* It opens a sheet now rather than flipping between two orders on tap.
            A control that changes state when touched has to be tapped to be
            read, and on a roster of 22 that means re-sorting the list under the
            BP's thumb to find out what order it was already in. It names the
            current order and asks. */}
        <button
          type="button"
          onClick={() => setSheet('sort')}
          aria-label={`Urutkan — sekarang ${sortLabel(sort)}`}
          className="flex items-center gap-4 rounded-full border border-default bg-neutral-white px-12 py-4 text-12 font-bold text-default"
        >
          <Sort size={16} />
          {sort === 'tunggakan' ? 'Tunggakan' : 'Nama'}
        </button>
      </div>

      {/* By NAME only. The directory searches place as well, because a group is
          somewhere; a mitra is a person the BP is looking for by the name she
          is about to say out loud. */}
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Cari nama mitra"
        label="Cari mitra di majelis ini"
      />

      {q ? (
        <span className="text-12 text-caption">
          {members.length} dari {MAJELIS.members.length} mitra
        </span>
      ) : null}

      <div className="flex flex-col gap-8 pb-16">
        {members.length === 0 ? (
          <EmptyState title="Mitra tidak ditemukan" body="Coba nama atau ejaan lain." />
        ) : null}
        {members.map((mitra) => (
          <MitraCard
            key={mitra.id}
            mitra={mitra}
            // No amount on the card at all now. DPD already answers "who do I
            // deal with first", and a rupiah figure on a roster is a number the
            // BP reads but cannot act on — the one she negotiates against is
            // derived fresh on the collect page, from the ledger, at the moment
            // she needs it. Two places printing the same debt is how they end
            // up disagreeing.
            meta={null}
            titleBadge={mitra.id === MAJELIS.ketuaId ? <Badge intent="primary">KM</Badge> : null}
            labels={<MitraLabels mitra={mitra} />}
            trailing={<DpdBadge dpd={mitra.dpd} format="short" />}
            onOpen={() => {
              store.openMitraPage(mitra.id)
              flow.go('mitra')
            }}
          />
        ))}
      </div>

      <EditSheet open={sheet === 'edit'} onClose={() => setSheet(null)} />
      <OptionSheet
        open={sheet === 'sort'}
        title="Urutkan mitra"
        name="urutan-mitra"
        options={SORT_OPTIONS}
        value={sort}
        onPick={(v) => {
          setSort(v)
          setSheet(null)
        }}
        onClose={() => setSheet(null)}
      />
    </AppScreen>
  )
}

/**
 * The chips under her name. Three different KINDS of fact, and the order is the
 * order the BP needs them in: what she borrows on, then anything already agreed
 * about her arrears — because an arrangement is the one thing that changes what
 * the BP is allowed to ask for when she reaches the front of the queue.
 */
function MitraLabels({ mitra }: { mitra: Mitra }) {
  return (
    <>
      <KetuaBadge mitra={mitra} />
      <ProductBadge product={mitra.product} />
      {mitra.ptp ? <Badge intent="blue">Janji bayar {mitra.ptp}</Badge> : null}
      {mitra.keringanan ? <Badge intent="yellow">Dapat keringanan</Badge> : null}
    </>
  )
}

/**
 * What can be changed about a group, as three routes rather than one "Edit"
 * form. A majelis has no single record to open — its schedule lives with the
 * BP's week, its Ketua is a mitra, its location is a place — so a combined
 * form would be three unrelated fields sharing a Save button.
 *
 * All three are affordances only in this prototype; nothing here writes.
 */
function EditSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Ubah data majelis">
      <div className="flex flex-col gap-8">
        <EditRow
          icon={<IconCalendar size={20} />}
          title="Ubah jadwal kumpulan"
          subtitle="Hari dan jam pertemuan mingguan"
          onClick={onClose}
        />
        <EditRow
          icon={<IconUsers size={20} />}
          title="Ubah Ketua Majelis"
          subtitle="Pilih mitra lain sebagai KM"
          onClick={onClose}
        />
        {/* The only one of the three that changes another group as well as this
            one, which is why it says "pindahkan" rather than "hapus": a mitra
            does not leave a majelis, she arrives at a different one. */}
        <EditRow
          icon={<IconArrowRight size={20} />}
          title="Pindahkan anggota"
          subtitle="Pindahkan mitra ke majelis lain"
          onClick={onClose}
        />
      </div>
    </BottomSheet>
  )
}

function EditRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12 text-left"
    >
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-primary-50 text-primary-500">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-14 font-bold text-default">{title}</span>
        <span className="truncate text-12 text-caption">{subtitle}</span>
      </span>
      <span className="shrink-0 text-disabled">
        <IconChevronRight size={20} />
      </span>
    </button>
  )
}
