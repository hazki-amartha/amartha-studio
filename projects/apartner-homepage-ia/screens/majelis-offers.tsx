'use client'

// Majelis Visit — step 2 of 3: Tugas Tambahan.
//
// The same mitra list as step 1, rendered by the same card, with the two
// varying slots refilled: the status line becomes where she stands on what's
// offered, and the action row becomes the recommendation. Same faces, same
// shape, so the only thing to read is what changed.
//
// The action closes its own loop: "Tawarkan" opens a sheet to capture what the
// mitra SAID (Tertarik / Tidak tertarik), not merely that she was asked. Only
// mitra with a real recommendation are listed. The whole step is skippable.

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card, NavigationHeader, SelectableCard } from '@/design-system/components'
import { mitraLoanInfo, offersCelengan, type Mitra } from '../lib/data'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { IconCheck } from '../lib/icons'
import { activeMembers, selectedMajelis, store, useApp, type OfferResult } from '../lib/store'
import { SectionTitle, StatRows, StepBar, VisitMitraCard, VisitTitle } from '../lib/visit-ui'

interface Offer {
  label: string
  status: string
  done: string
}

/** The one recommendation worth surfacing during a kumpulan, if any. Renewal
 *  wins over a Celengan pitch — a loan about to close is the more time-bound. */
function offerFor(m: Mitra): Offer | null {
  if (mitraLoanInfo(m).nearRenewal) {
    return { label: 'Tawarkan pencairan ulang', status: 'Pinjaman hampir lunas', done: 'Renewal ditawarkan' }
  }
  if (offersCelengan(m)) {
    return { label: 'Tawarkan Top-up Celengan', status: 'Belum punya Celengan', done: 'Celengan ditawarkan' }
  }
  return null
}

const RESULT_OPTIONS: { value: OfferResult; title: string; description: string }[] = [
  { value: 'tertarik', title: 'Tertarik', description: 'Mitra setuju, lanjut diproses setelah kunjungan' },
  { value: 'tidak', title: 'Tidak tertarik', description: 'Mitra menolak untuk saat ini' },
]

export function MajelisOffersScreen() {
  const flow = useFlow()
  const s = useApp()
  const g = selectedMajelis(s)

  const [pitching, setPitching] = useState<Mitra | null>(null)
  const [draft, setDraft] = useState<OfferResult | null>(null)

  const withOffer = activeMembers(g.n)
    .map((m) => ({ m, offer: offerFor(m) }))
    .filter((x): x is { m: Mitra; offer: Offer } => x.offer !== null)

  const recorded = withOffer.filter((x) => s.offerResults[x.m.n]).length

  // One row per KIND of offer — how far each product got.
  const offerRows = Array.from(new Set(withOffer.map((x) => x.offer.label))).map((label) => {
    const group = withOffer.filter((x) => x.offer.label === label)
    const taken = group.filter((x) => s.offerResults[x.m.n] === 'tertarik').length
    return { label: group[0].offer.done, value: `${taken} dari ${group.length} mitra` }
  })

  function openPitch(mitra: Mitra) {
    setDraft(s.offerResults[mitra.n] ?? null)
    setPitching(mitra)
  }

  function savePitch() {
    if (!pitching || !draft) return
    store.setOfferResult(pitching.n, draft)
    setPitching(null)
  }

  const openMitra = (mitra: Mitra) => () => {
    store.set({ selMitra: mitra.n })
    flow.go('mitra-detail')
  }

  return (
    <Screen
      topBar={<NavigationHeader title={<VisitTitle title={g.n} when={g.day} />} onBack={() => flow.back()} />}
    >
      <StepBar current={2} />

      {withOffer.length > 0 ? (
        <>
          <StatRows rows={offerRows} />
          <SectionTitle>Daftar Mitra</SectionTitle>
          <div className="flex flex-col gap-8">
            {withOffer.map(({ m, offer }) => {
              const result = s.offerResults[m.n]
              return (
                <VisitMitraCard
                  key={m.n}
                  mitra={m}
                  onOpen={openMitra(m)}
                  status={offer.status}
                  action={
                    <div className="flex items-center gap-8">
                      <span className="min-w-0 flex-1 truncate text-12 font-bold text-default">
                        {offer.label}
                      </span>
                      {result ? (
                        <>
                          <Badge
                            intent={result === 'tertarik' ? 'green' : 'neutral'}
                            leadingIcon={result === 'tertarik' ? <IconCheck size={16} /> : undefined}
                          >
                            {result === 'tertarik' ? 'Tertarik' : 'Tidak tertarik'}
                          </Badge>
                          <Button size="xs" variant="ghost" onClick={() => openPitch(m)}>
                            Ubah
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => openPitch(m)}>
                          Tawarkan
                        </Button>
                      )}
                    </div>
                  }
                />
              )
            })}
          </div>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="text-20 font-bold text-default">Tidak ada tugas tambahan</span>
            <span className="text-12 text-caption">Lanjut untuk menutup kunjungan.</span>
          </div>
        </Card>
      )}

      <div className="sticky bottom-0 -mx-16 mt-auto border-t border-default bg-neutral-white p-16">
        <Button size="lg" className="w-full" onClick={() => flow.go('majelis-proof')}>
          {recorded > 0 || withOffer.length === 0 ? 'Lanjut' : 'Lewati'}
        </Button>
      </div>

      <BottomSheet
        open={pitching !== null}
        onClose={() => setPitching(null)}
        title="Hasil tawaran"
        description={pitching ? `${offerFor(pitching)?.label} · ${pitching.n}` : undefined}
        primaryAction={
          <Button className="w-full" disabled={!draft} onClick={savePitch}>
            Simpan
          </Button>
        }
        secondaryAction={
          <Button className="w-full" variant="ghost" onClick={() => setPitching(null)}>
            Batal
          </Button>
        }
      >
        <div className="flex flex-col gap-8">
          {RESULT_OPTIONS.map((option) => (
            <SelectableCard
              key={option.value}
              name="hasil-tawaran"
              inputType="radio"
              title={option.title}
              description={option.description}
              checked={draft === option.value}
              onChange={() => setDraft(option.value)}
            />
          ))}
        </div>
      </BottomSheet>
    </Screen>
  )
}
