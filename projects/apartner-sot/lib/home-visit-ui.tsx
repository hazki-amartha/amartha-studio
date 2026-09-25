'use client'

// Chrome shared by the three home-visit steps (Kunjungi, Tagih, Kirim bukti),
// per the BP APP 2026 Figma: the top bar — her name over "Home Visit • 10.00 -
// 10.30", with "Jadwal ulang" at its edge — and the sheet that link opens.
//
// "Jadwal ulang" is not always allowed. A home visit on a Friday cannot move
// (the week closes), and one already moved twice cannot move again; either way
// the link opens a sheet that says so, with one way out: back to the task.

import { BottomSheet, Button, NavigationHeader } from '@/design-system/components'
import { CalendarDots } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { openHomeMitra, openHomeTask, rescheduleCount, store, useApp, type AppState } from './store'
import { RescheduleSheet, VisitTitle } from './ui'

/** A home visit's slot: "Home Visit • 10.00 - 10.30" — half an hour from its start. */
export function homeWhen(time: string | undefined): string {
  if (!time) return 'Home Visit'
  const [h, m] = time.split('.').map(Number)
  const end = h * 60 + m + 30
  const pad = (n: number) => String(n).padStart(2, '0')
  return `Home Visit • ${time} - ${pad(Math.floor(end / 60))}.${pad(end % 60)}`
}

/**
 * Where the open home visit stands. A finished task reopened from Tugas is
 * still editable until it is sent; a sent one is read-only, for reference.
 */
export function homeTaskState(s: AppState): { done: boolean; sent: boolean } {
  return { done: s.doneTasks.includes(s.openHome), sent: s.sentTasks.includes(s.openHome) }
}

/** The most times a home visit may be moved. */
const MAX_RESCHEDULES = 2

export function HomeTopBar({ onReschedule }: { onReschedule: () => void }) {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)
  const task = openHomeTask(s)
  // A finished task can no longer be moved.
  const movable = !homeTaskState(s).done
  return (
    <NavigationHeader
      title={<VisitTitle title={mitra.name} when={homeWhen(task?.time)} />}
      onBack={() => flow.back()}
      link={movable ? 'Jadwal ulang' : undefined}
      onLinkClick={movable ? onReschedule : undefined}
    />
  )
}

/**
 * "Jadwalkan ulang tugas" — or, when the visit cannot move, the sheet that
 * says why. Moving the visit lands back on the schedule.
 */
export function HomeReschedule({ open, onClose }: { open: boolean; onClose: () => void }) {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)
  const count = rescheduleCount(s, s.openHome)
  const blocked = s.rescheduleFriday
    ? 'Tugas Home Visit di hari Jumat tidak bisa dijadwal ulang. Mohon kerjakan tugasnya.'
    : count >= MAX_RESCHEDULES
      ? `Tugas tidak bisa dijadwal ulang lebih dari ${MAX_RESCHEDULES} kali. Mohon kerjakan tugasnya.`
      : null

  if (blocked) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        hideClose
        // The Figma's illustration is not in the design system; a glyph tile
        // stands in for it.
        slot={
          <span className="flex h-120 w-full items-center justify-center rounded-16 bg-primary-50 text-primary-500">
            <CalendarDots size={24} />
          </span>
        }
        title="Tugas ini tidak bisa dijadwal ulang"
        description={blocked}
        primaryAction={
          <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
            Kembali
          </Button>
        }
      />
    )
  }

  return (
    <RescheduleSheet
      open={open}
      onClose={onClose}
      subject={mitra.name}
      description={`Kunjungi ${mitra.name} di waktu lain.`}
      onConfirm={(reason, date) => {
        store.rescheduleTask(s.openHome, reason, date)
        onClose()
        flow.go('today')
      }}
    />
  )
}
