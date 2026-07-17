'use client'

// Step 3 of 3 — Foto & Kirim.
//
// Proof of the majelis, then submit. The photo gates the submit button, because
// that is the actual rule in the field — an unproven visit is not a submitted
// one — and a disabled button with a reason under it is more honest than
// accepting the task and failing it later at sync.
//
// The recap above the camera is the one place this direction shows the BP a
// summary. It's earned here: submission is irreversible from the BP's side, and
// this is their last chance to catch "I forgot to mark Ibu Ani". It reads back
// what they entered — it is not a metric to interpret.

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMajelis, rupiah } from '../lib/data'
import { IconCamera, IconCheck } from '../lib/icons'
import { outstandingMembers, paidOf, settledMembers, store, taskForMajelis, useApp } from '../lib/store'
import { StepBar } from '../lib/ui'

export function MajelisProofScreen() {
  const flow = useFlow()
  const s = useApp()
  const majelis = findMajelis(s.openMajelis)
  const task = taskForMajelis(majelis.id)

  const settled = settledMembers(s, majelis.members)
  const outstanding = outstandingMembers(s, majelis.members)
  const collected = majelis.members.reduce((sum, m) => sum + paidOf(s, m), 0)
  const hadir = majelis.members.filter((m) => s.attendance[m.id] === 'hadir').length
  const unmarked = majelis.members.filter((m) => !s.attendance[m.id]).length
  // Only "tertarik" is worth reading back — it is the one that creates follow-up
  // work. A pitch that landed on "tidak" is closed, not pending.
  const tertarik = majelis.members.filter((m) => s.offerResults[m.id] === 'tertarik').length

  function submit() {
    if (task) store.finishTask(task.id)
    flow.go('today')
  }

  return (
    <Screen topBar={<NavigationHeader title={majelis.name} onBack={() => flow.back()} />}>
      <StepBar current={3} />

      {/* --- Read-back of what the BP entered, not a dashboard. */}
      <Card>
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Kehadiran</span>
            <span className="text-14 font-bold text-default">
              {hadir} dari {majelis.members.length} hadir
            </span>
          </div>
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Terkumpul</span>
            <span className="text-14 font-bold text-default">{rupiah(collected)}</span>
          </div>
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Lunas</span>
            <span className="text-14 font-bold text-default">
              {settled.length} dari {majelis.members.length} mitra
            </span>
          </div>
          {tertarik > 0 ? (
            <div className="flex items-center gap-12">
              <span className="flex-1 text-12 text-caption">Tertarik tugas tambahan</span>
              <span className="text-14 font-bold text-default">{tertarik} mitra</span>
            </div>
          ) : null}
          {unmarked > 0 || outstanding.length > 0 ? (
            <div className="rounded-8 bg-orange-50 px-12 py-8 text-12 text-default">
              {unmarked > 0
                ? `${unmarked} mitra belum ditandai kehadirannya.`
                : `${outstanding.length} mitra belum lunas.`}{' '}
              Kunjungan tetap bisa dikirim.
            </div>
          ) : null}
        </div>
      </Card>

      {/* --- Proof. */}
      <span className="text-14 font-bold text-default">Foto majelis</span>
      {s.photo ? (
        <Card>
          <div className="flex items-center gap-12">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-green-50 text-green-500">
              <IconCheck size={24} />
            </span>
            <div className="flex flex-1 flex-col">
              <span className="text-14 font-bold text-default">Foto tersimpan</span>
              <span className="text-12 text-caption">majelis-mawar-21juli.jpg</span>
            </div>
            <Button size="xs" variant="ghost" onClick={() => store.setPhoto(false)}>
              Ambil ulang
            </Button>
          </div>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => store.setPhoto(true)}
          className="flex flex-col items-center gap-8 rounded-12 border border-default bg-neutral-white p-24 text-center"
        >
          <span className="flex h-48 w-48 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <IconCamera size={24} />
          </span>
          <span className="text-14 font-bold text-default">Ambil foto majelis</span>
          <span className="text-12 text-caption">Bukti kunjungan, wajib sebelum kirim</span>
        </button>
      )}

      <div className="sticky bottom-0 -mx-16 mt-auto flex flex-col gap-8 border-t border-default bg-neutral-white p-16">
        {!s.photo ? (
          <span className="text-center text-12 text-caption">Ambil foto dulu untuk mengirim</span>
        ) : null}
        <Button size="lg" className="w-full" disabled={!s.photo} onClick={submit}>
          Selesaikan Tugas
        </Button>
      </div>
    </Screen>
  )
}
