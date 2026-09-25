'use client'

// The two sheets that sit at the mouth of a majelis visit.
//
// They are one module, and used from two screens, because they are one
// QUESTION asked twice. The BP arrives at the balai and the group either
// gathered or it didn't; the gate asks that before the register opens, and the
// "Lewati" link in the register's top bar asks it again for the BP who opened
// the roster first and only then found the room empty. Two entry points, one
// pair of sheets — otherwise the skip on the schedule and the skip on the stage
// drift into two different confirmations of the same fact.
//
// Copy and order follow the BP APP 2026 Figma (Majelis Visit → Lewati).

import { useEffect, useState } from 'react'
import { BottomSheet, Button } from '@/design-system/components'
import { ArrowClockwise, Camera, ChevronRight, CloudSlash, MapPin, NotePencil } from '@/design-system/icons'
import { ChoiceList } from './ui'

// Why the visit is being skipped, per the Figma. "Lainnya" opens a free-text
// step — the one case where none of the tidy answers fit.
const SKIP_REASONS = [
  'Majelis sudah tidak kumpul lagi',
  'Jadwal majelis tidak cocok',
  'Terjadi bencana alam',
  'Lainnya',
]
const OTHER = 'Lainnya'

// What the shot carries with it. Fixed, like the rest of the prototype's clock.
const PHOTO_TAKEN_AT = 'Rabu 02/11/22, 11.02 WIB'
const PHOTO_COORDS = 'Lat -7.345678856434 Long 110.345465786797'

/**
 * The gate. Before the roster opens: can this visit be worked at all?
 *
 * A majelis where nobody came is not a register with 22 absences in it — it is
 * a visit that did not happen. Asking once, at the door, splits the two
 * outcomes before either costs the BP a single tap.
 */
export function VisitGateSheet({
  open,
  onClose,
  onWork,
  onSkip,
  title = 'Apakah tugas dapat dikerjakan?',
  description = 'Kerjakan tugas bila mitra ada yang hadir. Jika mitra tidak hadir semua, silahkan lewati tugas.',
  workLabel = 'Kerjakan tugas',
  skipLabel = 'Lewati tugas',
}: {
  open: boolean
  onClose: () => void
  onWork: () => void
  onSkip: () => void
  title?: string
  description?: string
  workLabel?: string
  skipLabel?: string
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} description={description}>
      <div className="flex flex-col gap-8 pt-8">
        <Button size="lg" className="w-full" onClick={onWork}>
          {workLabel}
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={onSkip}>
          {skipLabel}
        </Button>
      </div>
    </BottomSheet>
  )
}

type Step = 'form' | 'preview' | 'other'

/**
 * Skipping the visit, with proof — "Bukti foto ketidakhadiran".
 *
 * Photo first, then the reason, per the Figma. The shot opens a preview step
 * (the camera's "Gunakan foto ini?") before it lands on the sheet; "Lainnya"
 * opens a free-text step. Both are steps of this one sheet, so backing out of
 * either returns to the form with everything else still filled in.
 *
 * The confirm waits on both: a photo with no reason is proof of an empty balai
 * but not of why, and a reason with no photo is a claim nobody can check.
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
  onConfirm: (reason: string) => void
}) {
  const [step, setStep] = useState<Step>('form')
  const [photo, setPhoto] = useState(false)
  const [reason, setReason] = useState<string | null>(null)
  const [other, setOther] = useState('')
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (open) {
      setStep('form')
      setPhoto(false)
      setReason(null)
      setOther('')
      setDraft('')
    }
  }, [open])

  const ready = photo && reason !== null && (reason !== OTHER || other.trim() !== '')

  function pick(option: string) {
    setReason(option)
    if (option === OTHER && other.trim() === '') {
      setDraft('')
      setStep('other')
    }
  }

  if (step === 'preview') {
    return (
      <BottomSheet
        open={open}
        size="fullscreen"
        onClose={onClose}
        onBack={() => setStep('form')}
        secondaryAction={
          <Button variant="outline" size="lg" className="w-full" onClick={() => setPhoto(false)}>
            Foto Ulang
          </Button>
        }
        primaryAction={
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              setPhoto(true)
              setStep('form')
            }}
          >
            Ya, Gunakan Foto
          </Button>
        }
      >
        <div className="flex flex-col gap-16">
          <PhotoFrame place={place} />
          <div className="flex gap-8">
            <Button variant="outline" className="flex-1">
              <span className="flex items-center gap-8">
                <ArrowClockwise size={16} className="-scale-x-100" />
                Putar ke Kiri
              </span>
            </Button>
            <Button variant="outline" className="flex-1">
              <span className="flex items-center gap-8">
                <ArrowClockwise size={16} />
                Putar ke Kanan
              </span>
            </Button>
          </div>
          <div className="flex items-center gap-12 rounded-12 border border-default p-12">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-primary-50 text-primary-500">
              <MapPin size={20} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-14 font-bold text-default">Lokasi kumpulan</span>
              <span className="truncate text-12 text-caption">-7.345678856763, 110.345465786797</span>
            </span>
            <span className="shrink-0 text-caption">
              <ChevronRight size={20} />
            </span>
          </div>
          <p className="text-center text-14 text-default">
            Pastikan wajah jelas dan lokasi sudah sesuai. Gunakan foto ini?
          </p>
        </div>
      </BottomSheet>
    )
  }

  if (step === 'other') {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        onBack={() => {
          if (other.trim() === '') setReason(null)
          setStep('form')
        }}
        title="Alasan lainnya"
      >
        <div className="flex flex-col gap-16">
          <textarea
            autoFocus
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Masukkan alasan lainnya"
            aria-label="Alasan lainnya"
            className="w-full resize-none rounded-8 border border-default p-12 text-14 text-default outline-none focus:border-primary-500"
          />
          <Button
            size="lg"
            className="w-full"
            disabled={draft.trim() === ''}
            onClick={() => {
              setOther(draft.trim())
              setStep('form')
            }}
          >
            Lanjut
          </Button>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Bukti foto ketidakhadiran"
      description="Pastikan GPS aktif dan Anda berada di lokasi kumpulan, lalu ambil foto sebagai bukti tidak ada mitra yang hadir."
      secondaryAction={
        <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
          Batal
        </Button>
      }
      primaryAction={
        <Button
          size="lg"
          className="w-full"
          disabled={!ready}
          onClick={() => reason && onConfirm(reason === OTHER ? `${OTHER}: ${other}` : reason)}
        >
          Lewati Tugas
        </Button>
      }
    >
      <div className="flex flex-col gap-16">
        {photo ? (
          <GeoProof place={place} onOpen={() => setStep('preview')} />
        ) : (
          <button
            type="button"
            onClick={() => setStep('preview')}
            className="flex w-full flex-col items-center gap-4 rounded-12 border border-dashed border-default bg-neutral-50 p-16 text-default"
          >
            <Camera size={24} />
            <span className="text-12 text-caption">Ambil foto</span>
          </button>
        )}

        <div className="flex flex-col gap-4">
          <ChoiceList
            label="Alasan lewati majelis"
            options={SKIP_REASONS}
            value={reason ?? undefined}
            onPick={pick}
          />
          {reason === OTHER && other ? (
            <div className="flex items-start gap-8 pl-32">
              <span className="min-w-0 flex-1 break-words text-14 text-caption">{other}</span>
              <button
                type="button"
                aria-label="Ubah alasan lainnya"
                onClick={() => {
                  setDraft(other)
                  setStep('other')
                }}
                className="shrink-0 text-primary-500"
              >
                <NotePencil size={20} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </BottomSheet>
  )
}

/**
 * The frame in the camera preview. No image asset in a prototype, so the same
 * honest tinted tile the rest of the project uses — with the geotag stamp the
 * real camera burns into the shot along its foot.
 */
function PhotoFrame({ place }: { place: string }) {
  return (
    <div className="-mx-16 flex h-240 flex-col justify-between bg-neutral-200">
      <span className="flex flex-1 items-center justify-center text-neutral-500">
        <Camera size={24} />
      </span>
      <span className="flex flex-col gap-2 bg-overlay px-16 py-8 text-neutral-white">
        <span className="truncate text-14 font-bold">{place}</span>
        <span className="truncate text-12">{PHOTO_TAKEN_AT}</span>
        <span className="truncate text-12">{PHOTO_COORDS}</span>
      </span>
    </div>
  )
}

/**
 * The shot, once taken: the frame, where it was taken, when, and the raw
 * coordinates. Tapping it reopens the preview, where it can be retaken.
 */
function GeoProof({ place, onOpen }: { place: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-12 rounded-12 border border-default bg-neutral-white p-4 pr-12 text-left"
    >
      <span
        className="flex h-64 w-64 shrink-0 items-center justify-center rounded-8 bg-neutral-200 text-neutral-500"
        aria-label="Foto bukti"
      >
        <Camera size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="truncate text-14 font-bold text-default">{place}</span>
        <span className="truncate text-12 text-caption">{PHOTO_TAKEN_AT}</span>
        <span className="truncate text-12 text-caption">{PHOTO_COORDS}</span>
      </span>
      <span className="shrink-0 text-primary-500">
        <ChevronRight size={20} />
      </span>
    </button>
  )
}

/**
 * The connection dropped mid-visit. Per the Figma it is a sheet over the stage,
 * not an error page: the register behind it is still there, and "Coba Lagi" is
 * the only way forward. No illustration asset in the design system, so the
 * glyph stands in for the Figma's artwork.
 */
export function OfflineSheet({ open, onRetry }: { open: boolean; onRetry: () => void }) {
  return (
    <BottomSheet
      open={open}
      onClose={onRetry}
      slot={
        <span className="flex h-120 w-full items-center justify-center rounded-16 bg-primary-50 text-primary-500">
          <CloudSlash size={24} />
        </span>
      }
      title="Yah, internet Anda terputus"
      description="Pastikan koneksi Anda stabil, lalu coba lagi, ya."
      primaryAction={
        <Button size="lg" className="w-full" onClick={onRetry}>
          Coba Lagi
        </Button>
      }
    />
  )
}
