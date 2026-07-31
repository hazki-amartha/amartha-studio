'use client'

// The two sheets that sit at the mouth of a majelis visit.
//
// They are one module, and used from two screens, because they are one
// QUESTION asked twice. The BP arrives at the balai and the group either
// gathered or it didn't; the gate asks that before the register opens, and the
// "Skip" link in the register's top bar asks it again for the BP who opened the
// roster first and only then found the room empty. Two entry points, one pair of
// sheets — otherwise the skip on the schedule and the skip on the stage drift
// into two different confirmations of the same fact.

import { useEffect, useState } from 'react'
import { BottomSheet, Button } from '@/design-system/components'
import { Camera, ChecklistDocFill, ChatCircleQuestion } from '@/design-system/icons'
import { PinMark } from './ui'

/**
 * The gate. Before the roster opens: can this visit be worked at all?
 *
 * It exists because the answer changes what the whole screen is for. A majelis
 * where nobody came is not a register with 22 absences in it — it is a visit
 * that did not happen, and recording it as 22 individual "tidak hadir" marks
 * buries that fact in a list ops has to reconstruct. Asking once, at the door,
 * splits the two outcomes before either costs the BP a single tap.
 *
 * Stacked buttons, primary on top: these are not a confirm/cancel pair — both
 * are real ways forward, and the sheet cannot be dismissed into a third thing.
 */
export function VisitGateSheet({
  open,
  onClose,
  onWork,
  onSkip,
}: {
  open: boolean
  onClose: () => void
  onWork: () => void
  onSkip: () => void
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Apakah tugas dapat dikerjakan?"
      description="Kerjakan tugas bila mitra ada yang hadir. Jika mitra tidak hadir semua, silahkan lewati tugas."
      slot={<GateArt />}
      slotPosition="above"
    >
      <div className="flex flex-col gap-8 pt-8">
        <Button size="lg" className="w-full" onClick={onWork}>
          Kerjakan tugas
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={onSkip}>
          Lewati tugas
        </Button>
      </div>
    </BottomSheet>
  )
}

/**
 * The illustration slot, drawn from system parts rather than an image. The
 * prototype has no artwork pipeline, and a stock picture standing in for one is
 * the kind of realism that reads as finished when it isn't — so this is an
 * honest placeholder in the brand tint: the task, and the question being asked
 * about it.
 */
function GateArt() {
  return (
    <div className="flex items-center justify-center gap-8 rounded-12 bg-primary-50 py-48 text-primary-500">
      <ChecklistDocFill size={24} />
      <ChatCircleQuestion size={24} />
    </div>
  )
}

/**
 * Skipping the visit, with proof.
 *
 * A skip with nothing behind it is indistinguishable from a BP who went home,
 * so the confirm is gated on a photo. The location rides along with the shot
 * automatically and is read back under it — a photo proves she was there, the
 * geotag proves it was HERE, and asking for "record location" as a second
 * gesture bills her twice for a fact the camera already carried.
 *
 * The draft resets every time the sheet opens, so a cancelled skip leaves
 * nothing behind on the next group.
 */
export function SkipVisitSheet({
  open,
  place,
  onClose,
  onConfirm,
}: {
  open: boolean
  /** Where the shot was taken — the balai, read back off the geotag. */
  place: string
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
      title="Lewati Kunjungan Majelis"
      description="Jika majelis tidak hadir semua, silahkan lewati kunjungan majelis dan ambil foto sebagai bukti."
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
      {photo ? (
        <GeoProof place={place} onRetake={() => setPhoto(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setPhoto(true)}
          className="flex w-full flex-col items-center gap-4 rounded-8 border border-default bg-neutral-50 p-16 text-caption"
        >
          <Camera size={24} />
          <span className="text-14 text-default">Ambil Foto</span>
        </button>
      )}
    </BottomSheet>
  )
}

/**
 * The shot, once taken: the frame, where it was taken, when, and the raw
 * coordinates. The coordinates are shown in full rather than summarised because
 * they are the part of this record that gets ARGUED with later — a skip is read
 * by someone asking whether the BP was really at the balai, and "Cilandak" is
 * not an answer to that question.
 */
function GeoProof({ place, onRetake }: { place: string; onRetake: () => void }) {
  return (
    <div className="flex items-center gap-12 rounded-8 border border-default bg-neutral-white p-8">
      {/* The frame itself. No image asset in a prototype, so the same honest
          tinted tile the rest of the project uses for a photo it doesn't have. */}
      <span
        className="flex h-40 w-48 shrink-0 items-center justify-center rounded-4 bg-neutral-200 text-neutral-500"
        aria-label="Foto bukti"
      >
        <Camera size={20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-center gap-4 text-14 font-bold text-default">
          <span className="shrink-0 text-caption">
            <PinMark size={16} />
          </span>
          <span className="min-w-0 flex-1 truncate">{place}</span>
        </span>
        <span className="truncate text-12 text-caption">Rabu 02/11/22, 11.02 WIB</span>
        <span className="truncate text-12 text-caption">Lat -7.345678856434 Long 110.312...</span>
      </div>
      <button
        type="button"
        onClick={onRetake}
        className="shrink-0 self-start text-12 font-bold text-primary-500"
      >
        Ulangi
      </button>
    </div>
  )
}
