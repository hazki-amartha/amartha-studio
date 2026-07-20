'use client'

// Home Visit — step 2 of 2: Bukti & Kirim.
//
// Location + photo both gate submit, same as the majelis close — location
// arguably matters more here, since a home visit is the one that gets doubted.
// The recap reads back who was met and what she paid. It only warns if nothing
// was recorded at all: a properly-recorded "no" is finished work, not a nag.

import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rp } from '../lib/data'
import { IconCamera, IconCheck, IconPin } from '../lib/icons'
import {
  paidOf,
  paymentStatus,
  remainingOf,
  selectedMitra,
  store,
  useApp,
} from '../lib/store'
import { ProofTile, SectionTitle, StepBar, HOME_STEP_LABELS } from '../lib/visit-ui'

const MET_LABEL: Record<string, string> = {
  mitra: 'Mitra sendiri',
  pj: 'Keluarga / penanggung jawab',
  nobody: 'Tidak ada orang',
}

export function HomeProofScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = selectedMitra(s)

  const met = s.metWith[mitra.n]
  const status = paymentStatus(s, mitra)
  const refusal = s.nonPayments[mitra.n]
  const paid = paidOf(s, mitra)
  const nothingRecorded = !met || (status === 'belum' && met !== 'nobody')

  function submit() {
    if (s.hvTaskId) store.finishTask(s.hvTaskId)
    flow.go('home')
  }

  return (
    <Screen topBar={<NavigationHeader title={mitra.n} onBack={() => flow.back()} />}>
      <StepBar current={2} labels={HOME_STEP_LABELS} />

      <Card>
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Ditemui</span>
            <span className="text-14 font-bold text-default">
              {met ? MET_LABEL[met] : 'Belum dipilih'}
            </span>
          </div>
          <div className="flex items-center gap-12">
            <span className="flex-1 text-12 text-caption">Pembayaran</span>
            <span className="text-14 font-bold text-default">
              {status === 'lunas'
                ? `Lunas · ${rp(paid)}`
                : status === 'sebagian'
                  ? `Sebagian · ${rp(paid)}`
                  : status === 'tidak'
                    ? 'Tidak bayar'
                    : 'Belum dicatat'}
            </span>
          </div>
          {status === 'sebagian' ? (
            <div className="flex items-center gap-12">
              <span className="flex-1 text-12 text-caption">Sisa</span>
              <span className="text-14 font-bold text-default">
                {rp(remainingOf(s, mitra))}
                {refusal?.ptp ? ` · PTP ${refusal.ptp}` : ''}
              </span>
            </div>
          ) : null}
          {status === 'tidak' && refusal ? (
            <div className="flex items-center gap-12">
              <span className="flex-1 text-12 text-caption">Alasan</span>
              <span className="text-14 font-bold text-default">
                {refusal.reason}
                {refusal.ptp ? ` · ${refusal.ptp}` : ''}
              </span>
            </div>
          ) : null}
          {nothingRecorded ? (
            <div className="rounded-8 bg-orange-50 px-12 py-8 text-12 text-default">
              Belum ada hasil kunjungan yang dicatat. Kunjungan tetap bisa dikirim.
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
                <span className="flex-1 text-12 text-caption">Rumah {mitra.n}</span>
                <span className="text-12 text-caption">±6 m</span>
              </div>
            ) : null}
            {s.photo ? (
              <div className="flex items-center gap-8">
                <span className="shrink-0 text-green-500">
                  <IconCheck size={16} />
                </span>
                <span className="flex-1 text-12 text-caption">
                  {mitra.n.toLowerCase().replace(/[^a-z]/g, '-')}.jpg
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
