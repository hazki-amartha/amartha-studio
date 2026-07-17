'use client'

// Step 2 of 3 — Tugas Tambahan.
//
// The home-visit read of the majelis offers step, for the one mitra. Same
// MitraCard, same pitch sheet, same self-closing loop: "Tawarkan" records what
// she SAID ("Tertarik" / "Tidak tertarik"), not merely that she was asked.
//
// For a delinquent the extra task is relief rather than growth — a longer tenor,
// not a new product — so it reads as a genuine part of the collection
// conversation. It stays skippable: many doorsteps have nothing to offer, and
// that empty state is a first-class outcome, not a gap.

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findHomeVisit } from '../lib/data'
import { IconCheck } from '../lib/icons'
import { MitraCard } from '../lib/mitra-card'
import { store, useApp, type OfferResult } from '../lib/store'
import { HOME_STEP_LABELS, StepBar } from '../lib/ui'

const RESULT_OPTIONS: { value: OfferResult; title: string; description: string }[] = [
  {
    value: 'tertarik',
    title: 'Tertarik',
    description: 'Mitra setuju, lanjut diproses setelah kunjungan',
  },
  {
    value: 'tidak',
    title: 'Tidak tertarik',
    description: 'Mitra menolak untuk saat ini',
  },
]

export function HomeOfferScreen() {
  const flow = useFlow()
  const s = useApp()
  const visit = findHomeVisit(s.openHome)
  const mitra = visit.mitra
  const offer = mitra.offer
  const result = s.offerResults[mitra.id]

  // Sheet state is deliberately local: it must not survive navigation.
  const [pitching, setPitching] = useState(false)
  const [draft, setDraft] = useState<OfferResult | null>(null)

  function openPitch() {
    setDraft(s.offerResults[mitra.id] ?? null)
    setPitching(true)
  }

  function savePitch() {
    if (!draft) return
    store.setOfferResult(mitra.id, draft)
    setPitching(false)
  }

  return (
    <Screen topBar={<NavigationHeader title="Home Visit" onBack={() => flow.back()} />}>
      <StepBar current={2} labels={HOME_STEP_LABELS} />

      {offer ? (
        <>
          <Card>
            <div className="flex items-center gap-12">
              <div className="flex flex-1 flex-col gap-2">
                <span className="text-12 text-caption">Bisa ditawari</span>
                <span className="text-24 font-bold text-default">{offer.label}</span>
              </div>
              <Badge intent="neutral">Opsional</Badge>
            </div>
          </Card>

          <MitraCard
            mitra={mitra}
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
                    <Button size="xs" variant="ghost" onClick={openPitch}>
                      Ubah
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={openPitch}>
                    Tawarkan
                  </Button>
                )}
              </div>
            }
          />
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
        <Button size="lg" className="w-full" onClick={() => flow.go('home-proof')}>
          {result || !offer ? 'Lanjut' : 'Lewati'}
        </Button>
      </div>

      {/* --- The outcome. One question, two answers, no free text. */}
      <BottomSheet
        open={pitching}
        onClose={() => setPitching(false)}
        title="Hasil tawaran"
        description={offer ? `${offer.label} · ${mitra.name}` : undefined}
        primaryAction={
          <Button className="w-full" disabled={!draft} onClick={savePitch}>
            Simpan
          </Button>
        }
        secondaryAction={
          <Button className="w-full" variant="ghost" onClick={() => setPitching(false)}>
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
