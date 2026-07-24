'use client'

// Closing — the end of the day, and the only task that is not a visit.
//
// It is a two-item checklist over one CTA, because closing the day is exactly
// two obligations and nothing else:
//
// 1. EVERY TASK DONE. The day's visits have to be finished before the day can be
//    closed — a closing submitted with a pelayanan still open is a day reported
//    as over while there is still cash uncollected. So the check counts the
//    day's stops and, when any are still open, names them: X dari Y, then the
//    list, so the BP knows what to go back to rather than just that she cannot
//    close yet.
//
// 2. TITIP BAYAR SETTLED. Every rupiah she collected is money she is holding for
//    the company — a titipan she has to hand back by transferring it to the
//    branch VA. The check shows what is still owed and where it goes; once she
//    has transferred it she marks it settled, self-reported exactly as it is in
//    the field, where the app cannot see a bank transfer either. Depositing is
//    gated behind the tasks being done: you settle the bag once, at the end.
//
// The submit CTA unlocks only when both are true. There is no amount to type —
// the figure is derived from the day's collections, the same lines the pelayanan
// and doorsteps recorded — so closing is a confirmation, not data entry.

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { DEPOSIT, TASKS } from '../lib/schedule'
import { IconCheck } from '../lib/icons'
import { store, unsettledTotal, useApp } from '../lib/store'
import { SectionTitle, StickyBar } from '../lib/ui'

export function DepositScreen() {
  const flow = useFlow()
  const s = useApp()

  // --- Check 1: every task on the day except this closing itself. ---------
  // Every task on the day is a visit now — closing left the list.
  const dayTasks = TASKS
  const doneIds = new Set(s.doneTasks)
  const pending = dayTasks.filter((t) => !doneIds.has(t.id))
  const doneCount = dayTasks.length - pending.length
  const allDone = pending.length === 0

  // --- Check 2: the titipan tunai she has to hand back to the branch. -----
  //
  // What is STILL in her bag, not everything the day banked: she may have put
  // money down twice already from the schedule, and a closing check that
  // ignored those would ask her to settle cash she is no longer carrying.
  const toDeposit = unsettledTotal(s)
  // Settled means the bag is empty. There is no separate flag to tick — the
  // settlement screen is what empties it, and a check that could be marked done
  // without one is a check that can disagree with the ledger behind it.
  const depositSettled = toDeposit === 0

  const ready = allDone && depositSettled

  // --- Submitted. Deliberately not "Selesai": she has handed over cash and
  // cannot prove it landed. The branch confirms, and that is tomorrow.
  if (s.depositDone) {
    return (
      <Screen topBar={<NavigationHeader title="Closing" hideBack />}>
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
              <IconCheck size={24} />
            </span>
            <span className="text-20 font-bold text-default">Hari ditutup</span>
            {toDeposit > 0 ? (
              <span className="text-24 font-bold text-default">{rupiah(toDeposit)}</span>
            ) : null}
            <span className="text-12 text-caption">
              {toDeposit > 0
                ? 'Setoran sedang diverifikasi cabang. Kamu akan dapat notifikasi begitu masuk.'
                : 'Tidak ada titipan tunai hari ini. Semua tugas selesai.'}
            </span>
          </div>
        </Card>

        <StickyBar>
          <Button
            size="lg"
            className="w-full"
            onClick={() => flow.go('today')}
          >
            Selesai
          </Button>
        </StickyBar>
      </Screen>
    )
  }

  return (
    <Screen topBar={<NavigationHeader title="Closing" onBack={() => flow.back()} />}>
      <SectionTitle>Sebelum tutup hari</SectionTitle>

      {/* --- Check 1: tasks done. ----------------------------------------- */}
      <Card>
        <div className="flex items-start gap-12">
          <StatusIcon done={allDone} />
          <div className="flex min-w-0 flex-1 flex-col gap-8">
            <div className="flex items-center gap-8">
              <span className="flex-1 text-14 font-bold text-default">Tugas hari ini</span>
              <span className={`text-12 font-bold ${allDone ? 'text-green-500' : 'text-caption'}`}>
                {doneCount} dari {dayTasks.length} selesai
              </span>
            </div>
            {allDone ? (
              <span className="text-12 text-caption">Semua tugas hari ini sudah selesai.</span>
            ) : (
              <>
                <span className="text-12 text-caption">
                  Selesaikan dulu sebelum menutup hari:
                </span>
                <div className="flex flex-col gap-8 border-t border-default pt-8">
                  {pending.map((t) => (
                    <div key={t.id} className="flex items-center gap-8">
                      <span className="w-40 shrink-0 text-12 font-bold text-default">{t.time}</span>
                      <span className="min-w-0 flex-1 truncate text-12 text-default">{t.title}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* --- Check 2: titip bayar settled. -------------------------------- */}
      <Card>
        <div className="flex items-start gap-12">
          <StatusIcon done={depositSettled} />
          <div className="flex min-w-0 flex-1 flex-col gap-8">
            <span className="text-14 font-bold text-default">Titip bayar</span>

            {depositSettled ? (
              <span className="text-12 text-caption">
                {toDeposit > 0
                  ? `Titipan tunai ${rupiah(toDeposit)} sudah disetor ke VA cabang.`
                  : 'Tidak ada titipan tunai untuk disetor hari ini.'}
              </span>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-12 text-caption">Belum disetor</span>
                  <span className="text-24 font-bold text-default">{rupiah(toDeposit)}</span>
                </div>

                {/* The VA is no longer printed here. Each settlement gets its
                    OWN account number, so a fixed one on this card would be the
                    wrong number as often as the right one — the settlement
                    screen issues it along with the breakdown and the proof. */}
                <span className="text-10 text-disabled">Batas setor {DEPOSIT.due}</span>

                {allDone ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      store.openSettlement()
                      flow.go('settlement')
                    }}
                  >
                    Setor Sekarang
                  </Button>
                ) : (
                  <span className="text-12 text-caption">
                    Selesaikan semua tugas dulu, lalu setor titipan sekaligus.
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      <StickyBar>
        {!ready ? (
          <span className="text-center text-12 font-bold text-orange-500">
            {!allDone ? 'Masih ada tugas yang belum selesai' : 'Setor titipan tunai dulu'}
          </span>
        ) : null}
        <Button size="lg" className="w-full" disabled={!ready} onClick={() => store.submitDeposit()}>
          Selesaikan Closing
        </Button>
      </StickyBar>
    </Screen>
  )
}

/**
 * The check/pending marker for a checklist row. Done is the system's settled
 * pairing — a tick on a green tint; pending is a dotted ring, the same "still
 * open" mark the week strip uses for a due-but-unanswered instalment.
 */
function StatusIcon({ done }: { done: boolean }) {
  return done ? (
    <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-500">
      <IconCheck size={20} />
    </span>
  ) : (
    <span className="h-32 w-32 shrink-0 rounded-full border border-dotted border-neutral-400 bg-neutral-white" />
  )
}
