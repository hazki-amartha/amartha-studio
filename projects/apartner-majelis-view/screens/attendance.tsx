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
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MAJELIS } from '../lib/data'
import { majelisWhen } from '../lib/schedule'
import { IconCheck, IconX } from '../lib/icons'
import { DpdBadge, MitraCard } from '../lib/mitra-card'
import {
  attendanceComplete,
  presentCount,
  settledCount,
  store,
  useApp,
  openMajelisEntry,
} from '../lib/store'
import {
  ChoiceList,
  ChoicePill,
  ChosenRow,
  ProductBadge,
  ProgressCard,
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
const ABSENCE_REASONS = [
  'Sedang bekerja',
  'Sakit',
  'Diwakilkan',
  'Salah majelis',
  'Tanpa kabar',
]

export function AttendanceScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)

  const total = MAJELIS.members.length
  const settled = settledCount(s)
  const present = presentCount(s)
  const complete = attendanceComplete(s)
  const left = total - settled

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={group.name} when={majelisWhen(group)} />}
          onBack={() => flow.back()}
        />
      }
    >
      <StageBar current={1} />

      {/* The count is of RECORDED, not present. The stage's job is to finish the
          register, and a bar that filled up as people arrived would sit at 80%
          on a complete register with four absentees — reading as unfinished work
          when the work is done. */}
      <ProgressCard
        title="Sudah dicatat"
        value={`${settled}`}
        of={`${total} mitra`}
        percent={Math.round((settled / total) * 100)}
      />

      <SectionTitle>Daftar Mitra</SectionTitle>

      <div className="flex flex-col gap-8 pb-16">
        {MAJELIS.members.map((mitra) => {
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
                  <ProductBadge product={mitra.product} />
                  <DpdBadge dpd={mitra.dpd} format="short" />
                </>
              }
              onOpen={() => {
                store.openMitraPage(mitra.id)
                flow.go('mitra')
              }}
              action={
                <div className="flex flex-col gap-12">
                  {/* No "Kehadiran" label. Two named pills on the one stage
                      whose whole subject is attendance say what they are, and
                      the label was a third word on a row that already had two —
                      dropping it gives both pills the full width of the card. */}
                  <div className="flex gap-8">
                    <ChoicePill
                      selected={mark === 'tidak'}
                      icon={<IconX size={16} />}
                      label={`Tidak hadir — ${mitra.name}`}
                      onClick={() => store.setAttendance(mitra.id, 'tidak')}
                    >
                      Tidak
                    </ChoicePill>
                    <ChoicePill
                      selected={mark === 'hadir'}
                      icon={<IconCheck size={16} />}
                      label={`Hadir — ${mitra.name}`}
                      onClick={() => store.setAttendance(mitra.id, 'hadir')}
                    >
                      Hadir
                    </ChoicePill>
                  </div>

                  {/* An absence carries its reason, and the card grows a second
                      row to take it rather than filing her somewhere else. Once
                      chosen it collapses to the answer — the record, not the
                      four things she could have said. */}
                  {mark === 'tidak' ? (
                    <div className="border-t border-default pt-12">
                      {reason ? (
                        <ChosenRow
                          label="Alasan tidak hadir"
                          value={reason}
                          onChange={() => store.clearAbsenceReason(mitra.id)}
                        />
                      ) : (
                        <ChoiceList
                          label="Alasan tidak hadir"
                          options={ABSENCE_REASONS}
                          onPick={(picked) => store.setAbsent(mitra.id, picked)}
                        />
                      )}
                    </div>
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
          Simpan &amp; Lanjut
        </Button>
      </StickyBar>
    </Screen>
  )
}
