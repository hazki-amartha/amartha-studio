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
// Two things soften it without dissolving the gate. The 15 who paid before the
// visit are seeded present, so the BP marks 7 rather than 22 — a mitra who
// settled this week is the safest available default for "she was here". And the
// cards are stripped to the identity plus the two pills: nothing on this screen
// asks about money, because money is the next stage's question and asking both
// at once is precisely what the split is here to avoid.

import { useState } from 'react'
import { Badge, Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MAJELIS } from '../lib/data'
import { majelisWhen } from '../lib/schedule'
import { IconCheck } from '../lib/icons'
import { DpdBadge, MitraCard } from '../lib/mitra-card'
import {
  attendanceComplete,
  markedCount,
  markedMembers,
  presentCount,
  store,
  unmarkedMembers,
  useApp,
  openMajelisEntry,
} from '../lib/store'
import {
  AttendancePill,
  Chip,
  ChipGroup,
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
const ABSENCE_REASONS = [
  'Sedang bekerja',
  'Sakit',
  'Ada urusan keluarga',
  'Diwakilkan (titip)',
  'Tanpa kabar',
]

export function AttendanceScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)

  // Which unmarked card is currently asking WHY she's absent. Marking "Tidak"
  // opens the reason picker in place rather than filing her away — she only
  // leaves the register once a reason is chosen, so the record can't close with
  // an unexplained absence in it. Local state, not the store: nothing has been
  // recorded yet, and navigating away should simply abandon the half-tap.
  const [asking, setAsking] = useState<string | null>(null)

  const total = MAJELIS.members.length
  const marked = markedCount(s)
  const present = presentCount(s)
  const complete = attendanceComplete(s)
  const left = total - marked
  const unmarked = unmarkedMembers(s)
  const done = markedMembers(s)

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

      {/* The count is of MARKED, not present. The stage's job is to finish the
          register, and a bar that filled up as people arrived would sit at 80%
          on a complete register with four absentees — reading as unfinished work
          when the work is done. */}
      <ProgressCard
        title="Sudah dicatat"
        value={`${marked}`}
        of={`${total} mitra`}
        percent={Math.round((marked / total) * 100)}
      />

      <SectionTitle>Belum Diabsen</SectionTitle>

      {/* Marking a mitra moves her DOWN, it does not file her away. The register
          is one continuous list sorted by what still needs doing: unmarked on
          top, marked below in the same card. A collapsed section hid the record
          the BP is being asked to vouch for behind a tap — and the register is
          the one artefact of this stage that gets read later by someone who was
          not in the room. What is left to do is still obvious from the top of
          the list; what has been recorded no longer has to be gone looking for. */}
      {unmarked.length > 0 ? (
        <div className="flex flex-col gap-8">
          {unmarked.map((mitra) => (
            <MitraCard
              key={mitra.id}
              mitra={mitra}
              meta={<span className="truncate text-12 text-caption">Minggu {mitra.week} dari {mitra.totalWeeks}</span>}
              trailing={<DpdBadge dpd={mitra.dpd} />}
              action={
                asking === mitra.id ? (
                  // "Tidak" was tapped; record WHY before she leaves the list.
                  // Picking a reason marks her absent in the same gesture.
                  <div className="flex flex-col gap-12">
                    <ChipGroup label={`Alasan tidak hadir — ${mitra.name}`}>
                      {ABSENCE_REASONS.map((reason) => (
                        <Chip
                          key={reason}
                          selected={false}
                          onClick={() => {
                            store.setAbsent(mitra.id, reason)
                            setAsking(null)
                          }}
                        >
                          {reason}
                        </Chip>
                      ))}
                    </ChipGroup>
                    <Button size="sm" variant="ghost" onClick={() => setAsking(null)}>
                      Batal
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-8">
                    <AttendancePill
                      selected={false}
                      tone="green"
                      label={`Hadir — ${mitra.name}`}
                      onClick={() => store.setAttendance(mitra.id, 'hadir')}
                    >
                      Hadir
                    </AttendancePill>
                    <AttendancePill
                      selected={false}
                      tone="red"
                      label={`Tidak hadir — ${mitra.name}`}
                      onClick={() => setAsking(mitra.id)}
                    >
                      Tidak
                    </AttendancePill>
                  </div>
                )
              }
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 rounded-12 bg-neutral-white py-24 text-center">
          <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
            <IconCheck size={24} />
          </span>
          <span className="text-20 font-bold text-default">Semua mitra sudah diabsen</span>
          <span className="text-12 text-caption">Lanjut ke penagihan.</span>
        </div>
      )}

      {/* Same card, same slots, one section lower. Only the action row differs:
          the two pills have been replaced by what was recorded plus the way to
          change it. "Ubah" returns her to the list above rather than toggling in
          place — a mis-tap is corrected by making the same choice again, not by
          learning a second, different control for the same fact. */}
      {done.length > 0 ? (
        <>
          <SectionTitle>Sudah Diabsen</SectionTitle>
          <div className="flex flex-col gap-8">
            {done.map((mitra) => {
              const hadir = s.attendance[mitra.id] === 'hadir'
              return (
                <MitraCard
                  key={mitra.id}
                  mitra={mitra}
                  meta={
                    <span className="truncate text-12 text-caption">
                      Minggu {mitra.week} dari {mitra.totalWeeks}
                    </span>
                  }
                  trailing={<DpdBadge dpd={mitra.dpd} />}
                  action={
                    <div className="flex items-center gap-8">
                      {hadir ? (
                        <Badge intent="green" leadingIcon={<IconCheck size={16} />}>
                          Hadir
                        </Badge>
                      ) : (
                        <Badge intent="red">Tidak hadir</Badge>
                      )}
                      <span className="min-w-0 flex-1 truncate text-12 text-caption">
                        {hadir ? '' : (s.absenceReasons[mitra.id] ?? '')}
                      </span>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => store.clearAttendance(mitra.id)}
                      >
                        Ubah
                      </Button>
                    </div>
                  }
                />
              )
            })}
          </div>
        </>
      ) : null}

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
        <Button size="lg" className="w-full" disabled={!complete} onClick={() => flow.go('collection')}>
          Simpan &amp; Lanjut
        </Button>
      </StickyBar>
    </Screen>
  )
}
