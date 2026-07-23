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
// What the page OFFERS depends on the day. On the group's kumpulan day the
// button starts the pelayanan; on any other day there is no visit to start, so
// it becomes the thing a BP actually does from her sofa on a Thursday — send
// the group its reminder.

import { useState } from 'react'
import { Badge, BottomSheet, Button, NavigationHeader } from '@/design-system/components'
import { PaperPlaneTilt, Sort, WhatsappLogo } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MAJELIS, type Mitra } from '../lib/data'
import { IconArrowRight, IconCalendar, IconChevronRight, IconPin, IconUsers } from '../lib/icons'
import { DpdBadge, MitraCard } from '../lib/mitra-card'
import { taskForMajelis } from '../lib/schedule'
import { openMajelisEntry, store, useApp } from '../lib/store'
import { PinMark, ProductBadge, SectionTitle, StickyBar, VisitTitle } from '../lib/ui'

type Sort = 'tunggakan' | 'nama'
type Sheet = 'edit' | 'reminder' | null

export function MajelisScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)
  const [sort, setSort] = useState<Sort>('tunggakan')
  const [sheet, setSheet] = useState<Sheet>(null)

  const members = [...MAJELIS.members].sort((a, b) =>
    sort === 'nama' ? a.name.localeCompare(b.name) : b.dpd - a.dpd || a.name.localeCompare(b.name),
  )

  // Whether the day's schedule actually sends her here. Everything about the
  // footer hangs off this one fact.
  const onSchedule = Boolean(taskForMajelis(group.id))

  return (
    <Screen
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
      {/* Where it meets, on one line, directly under the header. It is the
          question a BP asks on the way there, and the answer she needs from it
          is not the text — it is the route, which is why the line ends in a
          button rather than in a full stop. */}
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
        {/* A two-state toggle rather than a menu: there are exactly two useful
            orders, and a dropdown for two options is a menu that exists to look
            like a feature. It carries a SORT mark now — the chevron it used to
            wear is the universal "this opens a list of options", and this one
            opens nothing. */}
        <button
          type="button"
          onClick={() => setSort(sort === 'tunggakan' ? 'nama' : 'tunggakan')}
          aria-label={`Urutkan — sekarang ${sort === 'tunggakan' ? 'tunggakan' : 'nama'}`}
          className="flex items-center gap-4 rounded-full border border-default bg-neutral-white px-12 py-4 text-12 font-bold text-default"
        >
          <Sort size={16} />
          {sort === 'tunggakan' ? 'Tunggakan' : 'Nama'}
        </button>
      </div>

      <div className="flex flex-col gap-8 pb-16">
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

      <StickyBar>
        {onSchedule ? (
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              // No task id: this route didn't come from the schedule. Submitting
              // still ticks the day's row for this group — the work is the same
              // work, and only the way in differed.
              store.startVisit(s.openMajelis)
              flow.go('attendance')
            }}
          >
            Mulai Pelayanan
          </Button>
        ) : (
          <Button size="lg" className="w-full" onClick={() => setSheet('reminder')}>
            Kirim Pengingat
          </Button>
        )}
      </StickyBar>

      <EditSheet open={sheet === 'edit'} onClose={() => setSheet(null)} />
      <ReminderSheet
        open={sheet === 'reminder'}
        group={group}
        onClose={() => setSheet(null)}
      />
    </Screen>
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
        <EditRow
          icon={<IconPin size={20} />}
          title="Ubah lokasi kumpulan"
          subtitle="Alamat tempat majelis berkumpul"
          onClick={onClose}
        />
        {/* The only one of the four that changes another group as well as this
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

/**
 * The reminder, already written. This is the whole point of the sheet: a BP
 * reminding six groups a week does not compose six messages, she composes one
 * and retypes it badly — so the app hands her the sentence with this group's
 * day, time and place already in it, and the only decision left is send.
 *
 * It goes to the WhatsApp GROUP rather than to 22 numbers. That is where the
 * group already talks, and a reminder that arrives as 22 private messages is a
 * reminder the ketua can't reinforce.
 */
function ReminderSheet({
  open,
  group,
  onClose,
}: {
  open: boolean
  group: { name: string; day: string; time: string; place: string }
  onClose: () => void
}) {
  const message =
    `Assalamualaikum Ibu-ibu ${group.name} 🙏\n\n` +
    `Mengingatkan kumpulan ${group.day} pukul ${group.time} di ${group.place}. ` +
    `Mohon hadir tepat waktu dan siapkan angsuran minggu ini ya, Bu.\n\n` +
    `Terima kasih.`

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      size="md"
      title="Kirim pengingat kumpulan"
      description="Pesan dikirim ke grup WhatsApp majelis."
    >
      <div className="flex flex-col gap-12">
        <div className="flex items-center gap-8 rounded-8 bg-neutral-50 p-12">
          <span className="shrink-0 text-green-500">
            <WhatsappLogo size={20} />
          </span>
          <span className="min-w-0 flex-1 truncate text-12 font-bold text-default">
            Grup {group.name}
          </span>
        </div>

        {/* The message as a read-back, not a text field. A field invites an edit
            she did not come here to make, and the sentence is already correct. */}
        <p className="whitespace-pre-line rounded-12 border border-default bg-neutral-white p-12 text-12 text-default">
          {message}
        </p>

        <Button size="lg" className="w-full" onClick={onClose}>
          <span className="flex items-center justify-center gap-8">
            <PaperPlaneTilt size={20} />
            Kirim ke Grup WhatsApp
          </span>
        </Button>
      </div>
    </BottomSheet>
  )
}
