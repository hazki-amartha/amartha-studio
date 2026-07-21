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
  Collapsible,
  ProgressCard,
  SectionTitle,
  StageBar,
  StickyBar,
  VisitTitle,
} from '../lib/ui'

export function AttendanceScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)

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

      {/* Marking a mitra files her away, exactly as recording an outcome drains
          her from the penagihan queue. Same gesture, same reward: what is left
          on screen is what is left to do, and a register of 22 becomes a list
          of 7 the moment the pre-paid are seeded in. */}
      {unmarked.length > 0 ? (
        <div className="flex flex-col gap-8">
          {unmarked.map((mitra) => (
            <MitraCard
              key={mitra.id}
              mitra={mitra}
              meta={<span className="truncate text-12 text-caption">Minggu {mitra.week} dari {mitra.totalWeeks}</span>}
              trailing={<DpdBadge dpd={mitra.dpd} />}
              action={
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
                    onClick={() => store.setAttendance(mitra.id, 'tidak')}
                  >
                    Tidak
                  </AttendancePill>
                </div>
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

      {/* "Ubah" returns her to the list above rather than toggling in place: a
          mis-tap is corrected by making the same choice again, not by learning a
          second, different control for the same fact. */}
      <Collapsible title="Sudah diabsen" hint={`${done.length} mitra`}>
        {done.map((mitra) => (
          <div key={mitra.id} className="flex items-center gap-8">
            <span className="min-w-0 flex-1 truncate text-14 text-default">{mitra.name}</span>
            {s.attendance[mitra.id] === 'hadir' ? (
              <Badge intent="green" leadingIcon={<IconCheck size={16} />}>
                Hadir
              </Badge>
            ) : (
              <Badge intent="red">Tidak hadir</Badge>
            )}
            <Button size="xs" variant="ghost" onClick={() => store.clearAttendance(mitra.id)}>
              Ubah
            </Button>
          </div>
        ))}
      </Collapsible>

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
