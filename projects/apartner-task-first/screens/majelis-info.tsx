'use client'

// The majelis status page, opened by the "Info" pill in the visit header.
//
// It exists so the VISIT doesn't have to carry this. Step 1's job is to record
// an outcome per mitra; the moment it also has to answer "when does this group
// meet?", "who is the ketua?", "how did they do last week?", the queue stops
// being a queue. So the reference material moves one tap away, behind a control
// that is clearly not part of the flow — and the step keeps its single job.
//
// Same rule as the mitra page: this is the group's record, not its dashboard,
// and it is reached deliberately rather than pushed at the BP mid-collection.
//
// It now carries the FULL roster with each mitra's outstanding and weekly
// instalment — the pair the homepage-IA majelis card shows. That is real risk
// for a page in this direction, because a 22-row wall of balances is exactly how
// a task-first app turns back into a dashboard. Two things hold it in place,
// both borrowed from the mitra page:
//
//   ORDER — "Mitra menunggak" stays above, because those are the rows where the
//     number changes what the BP does. The full roster sits underneath and
//     COLLAPSED: it answers a question the BP already has ("berapa sisa pinjaman
//     Bu Eni?"), it does not brief her on arrival.
//   DESTINATION — every row opens her mitra page. These rows are a directory
//     into the record, not a substitute for it, so nothing here needs to grow
//     into the full picture.

import { Badge, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMajelis, findMajelisEntry, rupiah, type Mitra } from '../lib/data'
import { IconChevronRight, IconPin, IconUsers } from '../lib/icons'
import { profileOf } from '../lib/profile'
import { paymentStatus, recordedMembers, store, useApp } from '../lib/store'
import { Avatar, Collapsible, SectionTitle, StatRows } from '../lib/ui'

export function MajelisInfoScreen() {
  const flow = useFlow()
  const s = useApp()

  /**
   * One mitra, with the two numbers a BP gets asked about: what is still owed
   * across the cycle, and what one week of it costs. Rendered identically in
   * the menunggak list and the full roster — the section a row sits in is what
   * says "act on this" or "look this up", so the row itself never has to.
   */
  function MitraRow({ mitra }: { mitra: Mitra }) {
    const profile = profileOf(mitra)
    return (
      <button
        type="button"
        onClick={() => {
          store.openMitraPage(mitra.id)
          flow.go('mitra')
        }}
        className="flex w-full flex-col gap-8 rounded-12 bg-neutral-white p-12 text-left active:bg-neutral-50"
      >
        <div className="flex items-center gap-12">
          <Avatar name={mitra.name} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-14 font-bold text-default">{mitra.name}</span>
            <span className="text-12 text-caption">
              Minggu {profile.week} dari {profile.cycle}
            </span>
          </div>
          {mitra.dpd > 0 ? (
            <Badge intent={mitra.dpd >= 30 ? 'red' : 'orange'}>{mitra.dpd} hari</Badge>
          ) : (
            <Badge intent="green">Lancar</Badge>
          )}
          <span className="shrink-0 text-disabled">
            <IconChevronRight size={20} />
          </span>
        </div>
        <div className="flex gap-8">
          <div className="flex flex-1 flex-col rounded-8 bg-neutral-50 px-12 py-8">
            <span className="text-10 text-caption">Sisa pinjaman</span>
            <span className="text-12 font-bold text-default">{rupiah(profile.outstanding)}</span>
          </div>
          <div className="flex flex-1 flex-col rounded-8 bg-neutral-50 px-12 py-8">
            <span className="text-10 text-caption">Angsuran / minggu</span>
            <span className="text-12 font-bold text-default">{rupiah(mitra.due)}</span>
          </div>
        </div>
      </button>
    )
  }

  const majelis = findMajelis(s.openMajelis)
  const entry = findMajelisEntry(s.openMajelis)

  const recorded = recordedMembers(s, majelis.members)
  const menunggak = majelis.members.filter((m) => m.dpd > 0)
  const billable = majelis.members.reduce((sum, m) => sum + m.due, 0)
  // The ketua is the first member of the roster — this prototype has no flag
  // for it, and inventing one would imply data the direction hasn't earned.
  const ketua = majelis.members[0]

  return (
    <Screen topBar={<NavigationHeader title="Info Majelis" onBack={() => flow.back()} />}>
      <Card>
        <div className="flex items-center gap-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-primary-50 text-primary-500">
            <IconUsers size={20} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-18 font-bold text-default">{entry.name}</span>
            <span className="flex items-center gap-4 text-12 text-caption">
              <IconPin size={16} />
              <span className="truncate">{entry.place}</span>
            </span>
          </div>
        </div>
      </Card>

      <SectionTitle>Jadwal &amp; anggota</SectionTitle>
      <StatRows
        rows={[
          { label: 'Pelayanan rutin', value: `${entry.day}, ${entry.time}` },
          { label: 'Jumlah anggota', value: `${majelis.members.length} mitra` },
          { label: 'Tagihan per minggu', value: rupiah(billable) },
        ]}
      />

      <SectionTitle>Ketua majelis</SectionTitle>
      <Card>
        <div className="flex items-center gap-12">
          <Avatar name={ketua.name} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-14 font-bold text-default">{ketua.name}</span>
            <span className="text-12 text-caption">Ketua · sejak siklus ini</span>
          </div>
          <Badge intent="primary">Ketua</Badge>
        </div>
      </Card>

      {/* The one thing here that is about TODAY rather than about the group.
          It reads back the visit's progress — it does not nag: the visit's own
          step 3 is where an incomplete collection gets flagged. */}
      <SectionTitle>Kunjungan hari ini</SectionTitle>
      <StatRows
        rows={[
          {
            label: 'Sudah ditagih',
            value: `${recorded.length} dari ${majelis.members.length} mitra`,
          },
          {
            label: 'Lunas',
            value: `${majelis.members.filter((m) => paymentStatus(s, m) === 'lunas').length} mitra`,
          },
          { label: 'Sedang menunggak', value: `${menunggak.length} mitra` },
        ]}
      />

      {/* The rows worth acting on, above and open. */}
      {menunggak.length > 0 ? (
        <>
          <SectionTitle>Mitra menunggak</SectionTitle>
          <div className="flex flex-col gap-8">
            {menunggak.map((mitra) => (
              <MitraRow key={mitra.id} mitra={mitra} />
            ))}
          </div>
        </>
      ) : null}

      {/* The rows worth looking up, below and closed. Menunggak first inside it
          too, so the ordering agrees with the section above rather than
          re-sorting the same people by a different rule. */}
      <Collapsible title="Semua mitra" hint={`${majelis.members.length} mitra`}>
        {[...majelis.members]
          .sort((a, b) => b.dpd - a.dpd)
          .map((mitra) => (
            <MitraRow key={mitra.id} mitra={mitra} />
          ))}
      </Collapsible>

      <div className="pb-16" />
    </Screen>
  )
}
