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

import { BottomSheet, Button, NavigationHeader } from '@/design-system/components'
import { useEffect, useState } from 'react'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { KumpulanCard } from '../lib/kumpulan-card'
import { MAJELIS } from '../lib/data'
import { majelisWhen, taskForMajelis, type MajelisEntry } from '../lib/schedule'
import { IconCamera, IconCheck, IconX } from '../lib/icons'
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
  PinMark,
  ProductBadge,
  ProofTile,
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

export function AttendanceScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)
  const [skipping, setSkipping] = useState(false)

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

      {/* Skipping the whole visit from step 1: the kumpulan didn't gather, so
          there is nothing to record — but a skip with nothing behind it is
          indistinguishable from a BP who just went home. The photo + location
          are the proof she was there, which is what makes the skip auditable. */}
      <SkipSheet open={skipping} group={group} onClose={() => setSkipping(false)} onConfirm={skip} />
    </Screen>
  )
}

/**
 * Skip a majelis visit with proof. A bottom sheet rather than a screen: it is a
 * meta-action on the TASK, reached from the top bar, and the whole interaction
 * is two captures and a confirm.
 *
 * Just a photo, the same as the home visit's Bukti & Kirim step — the location
 * rides along with it automatically, read back under the tile once the shot is
 * taken. A photo proves she was there, the geotag proves it was HERE, and asking
 * her to tap "record location" separately is a second gesture for a fact the
 * camera already carries. The draft is local and resets on open, so a cancelled
 * skip leaves nothing behind on the next group.
 */
function SkipSheet({
  open,
  group,
  onClose,
  onConfirm,
}: {
  open: boolean
  group: MajelisEntry
  onClose: () => void
  onConfirm: () => void
}) {
  const [photo, setPhoto] = useState(false)

  useEffect(() => {
    if (open) setPhoto(false)
  }, [open])

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Lewati kunjungan majelis"
      description={`Ambil foto sebagai bukti sebelum melewati kunjungan ${group.name}. Lokasi terekam otomatis.`}
      secondaryAction={
        <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
          Batal
        </Button>
      }
      primaryAction={
        <Button size="lg" className="w-full" disabled={!photo} onClick={onConfirm}>
          Lewati Kunjungan
        </Button>
      }
    >
      <div className="flex flex-col gap-12">
        <div className="flex">
          <ProofTile
            done={photo}
            label="Ambil Foto"
            doneLabel="Foto tersimpan"
            icon={<IconCamera size={24} />}
            onClick={() => setPhoto(!photo)}
          />
        </div>

        {/* The geotag the photo carried, read back — the location is recorded
            with the shot, not tapped for separately. */}
        {photo ? (
          <div className="flex items-center gap-8 rounded-12 bg-neutral-50 p-12">
            <span className="shrink-0 text-caption">
              <PinMark size={16} />
            </span>
            <span className="flex-1 text-12 text-caption">{group.place}</span>
            <span className="shrink-0 text-12 text-caption">±8 m</span>
          </div>
        ) : (
          <span className="text-12 text-caption">Ambil foto dulu untuk melewati kunjungan</span>
        )}
      </div>
    </BottomSheet>
  )
}
