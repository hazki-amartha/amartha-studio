'use client'

// Step 3 of 3 — Bukti & Kirim.
//
// Proof of the majelis, then submit. TWO captures gate the submit button now —
// location and photo — because that is the actual rule in the field: an
// unproven visit is not a submitted one, and a photo on its own does not prove
// the BP was at the majelis, only that she photographed something. A disabled
// button with a reason under it is more honest than accepting the task and
// failing it later at sync.
//
// The recap above the camera is the one place this direction shows the BP a
// summary. It's earned here: submission is irreversible from the BP's side, and
// this is their last chance to catch "I forgot to mark Ibu Ani". It reads back
// what they entered — it is not a metric to interpret.

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMajelis, rupiah } from '../lib/data'
import { IconCamera, IconCheck, IconPin } from '../lib/icons'
import {
  paidOf,
  paymentStatus,
  pendingMembers,
  store,
  taskForMajelis,
  useApp,
} from '../lib/store'
import { ProofTile, SectionTitle, StepBar } from '../lib/ui'

export function MajelisProofScreen() {
  const flow = useFlow()
  const s = useApp()
  const majelis = findMajelis(s.openMajelis)
  const task = taskForMajelis(majelis.id)

  const lunas = majelis.members.filter((m) => paymentStatus(s, m) === 'lunas')
  const pending = pendingMembers(s, majelis.members)
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
              {lunas.length} dari {majelis.members.length} mitra
            </span>
          </div>
          {tertarik > 0 ? (
            <div className="flex items-center gap-12">
              <span className="flex-1 text-12 text-caption">Tertarik tugas tambahan</span>
              <span className="text-14 font-bold text-default">{tertarik} mitra</span>
            </div>
          ) : null}
          {/* Warn on work not DONE, not on money not collected — a mitra
              recorded as tidak bayar is finished, and nagging about her would
              train the BP to ignore the warning. */}
          {unmarked > 0 || pending.length > 0 ? (
            <div className="rounded-8 bg-orange-50 px-12 py-8 text-12 text-default">
              {pending.length > 0
                ? `${pending.length} mitra belum dicatat pembayarannya.`
                : `${unmarked} mitra belum ditandai kehadirannya.`}{' '}
              Kunjungan tetap bisa dikirim.
            </div>
          ) : null}
        </div>
      </Card>

      {/* --- Proof. Two equal tiles: location proves the BP was HERE, the photo
          proves what she found. Neither substitutes for the other, so neither
          gets to be the bigger control. */}
      <SectionTitle>Bukti kunjungan</SectionTitle>
      <div className="flex gap-8">
        <ProofTile
          done={s.geo}
          label="Rekam lokasi"
          doneLabel="Lokasi terekam"
          icon={<IconPin size={24} />}
          onClick={() => store.setGeo(!s.geo)}
        />
        <ProofTile
          done={s.photo}
          label="Ambil foto"
          doneLabel="Foto tersimpan"
          icon={<IconCamera size={24} />}
          onClick={() => store.setPhoto(!s.photo)}
        />
      </div>
      {s.geo || s.photo ? (
        <Card>
          <div className="flex flex-col gap-8">
            {s.geo ? (
              <div className="flex items-center gap-8">
                <span className="shrink-0 text-green-500">
                  <IconCheck size={16} />
                </span>
                <span className="flex-1 text-12 text-caption">Balai RW 04, Ciseeng</span>
                <span className="text-12 text-caption">±8 m</span>
              </div>
            ) : null}
            {s.photo ? (
              <div className="flex items-center gap-8">
                <span className="shrink-0 text-green-500">
                  <IconCheck size={16} />
                </span>
                <span className="flex-1 text-12 text-caption">majelis-mawar-21juli.jpg</span>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="sticky bottom-0 -mx-16 mt-auto flex flex-col gap-8 border-t border-default bg-neutral-white p-16">
        {!s.geo || !s.photo ? (
          <span className="text-center text-12 text-caption">
            Rekam lokasi &amp; ambil foto dulu untuk mengirim
          </span>
        ) : null}
        <Button size="lg" className="w-full" disabled={!s.geo || !s.photo} onClick={submit}>
          Selesaikan Tugas
        </Button>
      </div>
    </Screen>
  )
}
