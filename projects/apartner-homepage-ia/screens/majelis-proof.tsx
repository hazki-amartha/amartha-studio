'use client'

// Majelis Visit — step 3 of 3: Bukti & Kirim.
//
// Recap of what the BP entered, then two captures — location and photo — that
// gate Submit. A photo alone proves she photographed something, not that she was
// at the majelis, so location sits beside it as an equal tile. The recap reads
// back entries (submission is final), and warns on work not DONE, never on money
// not collected: a recorded "tidak bayar" is finished, and nagging about it
// would train the BP to ignore the banner.

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rp } from '../lib/data'
import { IconCamera, IconCheck, IconPin } from '../lib/icons'
import {
  activeMembers,
  paidOf,
  paymentStatus,
  pendingMembers,
  selectedMajelis,
  store,
  useApp,
} from '../lib/store'
import { ProofTile, SectionTitle, StepBar } from '../lib/visit-ui'

export function MajelisProofScreen() {
  const flow = useFlow()
  const s = useApp()
  const g = selectedMajelis(s)
  const members = activeMembers(g.n)
  const task = s.tasks.find((t) => t.act === 'Kunjungan Majelis' && t.maj === g.n)

  const lunas = members.filter((m) => paymentStatus(s, m) === 'lunas')
  const pending = pendingMembers(s, members)
  const collected = members.reduce((sum, m) => sum + paidOf(s, m), 0)
  const hadir = members.filter((m) => s.attendance[m.n] === 'hadir').length
  const unmarked = members.filter((m) => !s.attendance[m.n]).length
  const tertarik = members.filter((m) => s.offerResults[m.n] === 'tertarik').length

  function submit() {
    if (task) store.finishTask(task.id)
    flow.go('home')
  }

  return (
    <Screen topBar={<NavigationHeader title={g.n} onBack={() => flow.back()} />}>
      <StepBar current={3} />

      <Card>
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Kehadiran</span>
            <span className="text-14 font-bold text-default">
              {hadir} dari {members.length} hadir
            </span>
          </div>
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Terkumpul</span>
            <span className="text-14 font-bold text-default">{rp(collected)}</span>
          </div>
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Lunas</span>
            <span className="text-14 font-bold text-default">
              {lunas.length} dari {members.length} mitra
            </span>
          </div>
          {tertarik > 0 ? (
            <div className="flex items-center gap-12">
              <span className="flex-1 text-12 text-caption">Tertarik tugas tambahan</span>
              <span className="text-14 font-bold text-default">{tertarik} mitra</span>
            </div>
          ) : null}
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
                <span className="flex-1 text-12 text-caption">{g.lokasi}</span>
                <span className="text-12 text-caption">±8 m</span>
              </div>
            ) : null}
            {s.photo ? (
              <div className="flex items-center gap-8">
                <span className="shrink-0 text-green-500">
                  <IconCheck size={16} />
                </span>
                <span className="flex-1 text-12 text-caption">
                  {g.n.toLowerCase().replace(/[^a-z]/g, '-')}.jpg
                </span>
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
          Selesaikan Kunjungan
        </Button>
      </div>
    </Screen>
  )
}
