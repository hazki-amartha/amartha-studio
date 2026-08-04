'use client'

// Stage 1 of 3 — Kehadiran.
//
// This is the screen that makes this direction different from
// apartner-task-first, and it is the thing worth judging: attendance is asked
// FIRST, on its own, and collection does not open until every mitra has been
// marked. The reference is explicit about the order, and the argument for it is
// that a majelis register is a record with its own life — it is read later by
// people who were not in the room, and a half-marked one cannot be audited.
//
// The argument against it, which the prototype should let the designer feel
// rather than have described: the BP now passes the room twice. She marks 22
// people, then goes back to the top and collects from them. Whether that costs
// more than it buys is the question this screen exists to answer.
//
// The list is STATIC. One roster, one order, and answering a card never moves
// it: the card the BP just tapped is still under her thumb, and the woman she is
// standing in front of is where she was a second ago. The earlier design filed
// each answered mitra into a "Sudah Diabsen" section below, which meant the list
// re-sorted itself under the BP's hand on every tap — the one thing a register
// worked through in person cannot afford. What changes is the STATE of the card,
// not its place, and the same roster in the same order carries all three stages.

import { Button, NavigationHeader } from '@/design-system/components'
import { useState } from 'react'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { KumpulanCard } from '../lib/kumpulan-card'
import { MAJELIS, type Mitra } from '../lib/data'
import { majelisWhen, taskForMajelis } from '../lib/schedule'
import { DpdBadge, KetuaBadge, MitraCard } from '../lib/mitra-card'
import { SkipVisitSheet } from '../lib/visit-sheets'
import {
  attendanceComplete,
  presentCount,
  settledCount,
  store,
  useApp,
  openMajelisEntry,
} from '../lib/store'
import {
  AttendanceChoice,
  ChoiceList,
  ProductBadge,
  ReasonNote,
  RosterFilter,
  SectionTitle,
  StageBar,
  StickyBar,
  VisitTitle,
} from '../lib/ui'

// Why a mitra isn't at the majelis. A fixed list, not free text: the BP is
// running a register in a room, and the reasons a member misses a weekly
// meeting are few and known. Free text would slow the one gesture the stage
// repeats and give ops a column it can't sort.
//
// "Salah majelis" is the odd one out: it is not about the mitra at all, it is
// the roster being wrong. She is on this list because of a transfer nobody
// recorded, and marking her absent week after week hides a data fix behind an
// attendance figure — so it gets its own reason rather than landing in "tanpa
// kabar", where it is indistinguishable from a woman who simply didn't come.
//
// "Meninggal dunia" is the one absence that is not about this week. It ends the
// membership and hands the loan to a settlement process nobody in the room can
// run, so it cannot be logged as a sick day — and stage 2 has to know, which is
// why the reason travels onto her card there.
const ABSENCE_REASONS = [
  'Sedang bekerja',
  'Sakit',
  'Salah majelis',
  'Meninggal dunia',
  'Tanpa kabar',
]

type FilterId = 'semua' | 'sudah' | 'belum'

// The same three chips stage 2 carries, asking the same question of the same
// roster — only the verb changes, from tagih to dicatat.
const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'sudah', label: 'Tercatat' },
  { id: 'belum', label: 'Belum tercatat' },
]

export function AttendanceScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)
  const [skipping, setSkipping] = useState(false)

  const [filter, setFilter] = useState<FilterId>('semua')

  // Recorded, not present: a mitra marked "tidak hadir" has been answered, and
  // the stage's job is to finish the register, not to fill the room.
  const isMarked = (mitra: Mitra) => Boolean(s.attendance[mitra.id])
  const countOf = (id: FilterId) =>
    id === 'semua'
      ? MAJELIS.members.length
      : MAJELIS.members.filter((m) => (id === 'sudah' ? isMarked(m) : !isMarked(m))).length
  const visible = MAJELIS.members.filter((m) =>
    filter === 'semua' ? true : filter === 'sudah' ? isMarked(m) : !isMarked(m),
  )

  const total = MAJELIS.members.length
  const settled = settledCount(s)
  const present = presentCount(s)
  const complete = attendanceComplete(s)
  const left = total - settled

  // The task this visit belongs to — carried in from the schedule, or recovered
  // from the group when the roster opened it. Skipping records against it.
  const taskId = s.activeTask ?? taskForMajelis(group.id)?.id ?? null

  function skip() {
    if (taskId) store.skipVisit(taskId)
    setSkipping(false)
    flow.go('today')
  }

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={group.name} when={majelisWhen(group)} />}
          onBack={() => flow.back()}
          link="Skip"
          onLinkClick={() => setSkipping(true)}
        />
      }
    >
      {/* Stage bar over where she is standing, as one flat white band running
          the full width, with the roster below on the grey canvas.
          
          The band used to carry a "Sudah dicatat" progress bar here. It said the
          same thing as the sticky footer's "N mitra belum dicatat" — twice on one
          screen, once at each end — and the footer's version is the one attached
          to the button it gates. What replaces it is the thing the stage HAD no
          room for: the balai's address and the KM, which used to arrive in a
          sheet before the roster and be re-openable from an info button up here.
          Both pieces of chrome are gone; the two facts stayed. */}
      <div className="-mx-16 -mt-16 flex flex-col gap-12 border-b border-default bg-neutral-white px-16 pb-12 pt-16">
        <StageBar current={1} />

        <div className="border-t border-default pt-12">
          <KumpulanCard entry={group} />
        </div>
      </div>

      {/* "Catat semua" — the whole group turned up, said once. The common case
          at a healthy majelis is a full room, and 22 taps to record it is 22
          chances to mis-tap on the one stage that gates everything after it. It
          only fills the BLANKS: an absence already recorded, with its reason
          attached, is an answer, and a bulk control that overwrote one would
          make the register unsafe to use. */}
      <div className="flex items-center gap-8">
        <SectionTitle>Daftar Mitra</SectionTitle>
        <span className="flex-1" />
        {settled < total ? (
          <button
            type="button"
            onClick={() => store.markAllPresent()}
            className="shrink-0 text-12 font-bold text-primary-500"
          >
            Catat semua
          </button>
        ) : null}
      </div>

      {/* "Who is left" — the same question, the same chips, as stage 2. */}
      <RosterFilter
        value={filter}
        onPick={setFilter}
        options={FILTERS.map((f) => ({ ...f, count: countOf(f.id) }))}
      />

      <div className="flex flex-col gap-8 pb-16">
        {visible.length === 0 ? (
          <p className="py-16 text-center text-12 text-caption">
            Tidak ada mitra di filter ini.
          </p>
        ) : null}
        {visible.map((mitra) => {
          const mark = s.attendance[mitra.id]
          const reason = s.absenceReasons[mitra.id]
          return (
            <MitraCard
              key={mitra.id}
              mitra={mitra}
              // The identity block is identical on all three stages: her face,
              // her name, her product and her bucket. Nothing stage-specific
              // gets in there, so the BP re-reads nothing as she moves between
              // stages — only the row under the rule changes.
              meta={null}
              labels={
                <>
                  {/* Her product leads the label row under her name, where the
                      rest of her standing facts already are — one row of chips
                      to scan rather than one chip level with the name and the
                      others below it. */}
                  <ProductBadge product={mitra.product} />
                  <KetuaBadge mitra={mitra} />
                  <DpdBadge dpd={mitra.dpd} format="short" />
                </>
              }
              onOpen={() => {
                store.openMitraPage(mitra.id)
                flow.go('mitra')
              }}
              action={
                <div className="flex flex-col gap-8">
                  {/* No "Kehadiran" label. Two named cells on the one stage
                      whose whole subject is attendance say what they are, and
                      the label was a third word on a row that already had two —
                      dropping it gives both the full width of the card. */}
                  <div className="flex gap-8">
                    <AttendanceChoice
                      tone="red"
                      selected={mark === 'tidak'}
                      answered={Boolean(mark)}
                      label={`Tidak hadir — ${mitra.name}`}
                      onClick={() => store.setAttendance(mitra.id, 'tidak')}
                    >
                      Tidak hadir
                    </AttendanceChoice>
                    <AttendanceChoice
                      tone="green"
                      selected={mark === 'hadir'}
                      answered={Boolean(mark)}
                      label={`Hadir — ${mitra.name}`}
                      onClick={() => store.setAttendance(mitra.id, 'hadir')}
                    >
                      Hadir
                    </AttendanceChoice>
                  </div>

                  {/* An absence carries its reason, and the card grows a second
                      row to take it rather than filing her somewhere else. Once
                      chosen it collapses to the answer — the record, not the
                      five things she could have said. */}
                  {mark === 'tidak' ? (
                    reason ? (
                      <ReasonNote
                        label="Alasan:"
                        value={reason}
                        onEdit={() => store.clearAbsenceReason(mitra.id)}
                      />
                    ) : (
                      <div className="pt-4">
                        <ChoiceList
                          label="Alasan tidak hadir"
                          options={ABSENCE_REASONS}
                          onPick={(picked) => store.setAbsent(mitra.id, picked)}
                        />
                      </div>
                    )
                  ) : null}
                </div>
              }
            />
          )
        })}
      </div>

      <StickyBar>
        {/* The gate says what is missing, not just that something is. A disabled
            button with no reason attached is the most common way a blocking step
            becomes a support ticket. */}
        {complete ? (
          <span className="text-center text-12 text-caption">
            {present} hadir · {total - present} tidak hadir
          </span>
        ) : (
          <span className="text-center text-12 font-bold text-orange-500">
            {left} mitra belum dicatat kehadirannya
          </span>
        )}
        <Button
          size="lg"
          className="w-full"
          disabled={!complete}
          onClick={() => flow.go('collection')}
        >
          Lanjut
        </Button>
      </StickyBar>

      {/* Skipping the whole visit from step 1: the kumpulan didn't gather, so
          there is nothing to record — but a skip with nothing behind it is
          indistinguishable from a BP who just went home. The photo + location
          are the proof she was there, which is what makes the skip auditable. */}
      <SkipVisitSheet
        open={skipping}
        place={group.place}
        onClose={() => setSkipping(false)}
        onConfirm={skip}
      />
    </Screen>
  )
}
