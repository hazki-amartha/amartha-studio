'use client'

// Step 2 of 3 — Tugas Tambahan.
//
// The same mitra list as step 1, rendered by the same MitraCard, with the two
// slots that carry the step's subject refilled: the status line becomes where
// she stands on what's being offered ("Belum pernah menabung"), and the action
// row becomes the recommendation. Same faces, same shape, so the only thing to
// read is what changed.
//
// The action closes its own loop. "Tawarkan" does not mark the offer delivered
// and stop — that records only that the BP spoke, which nobody downstream can
// act on. It opens a sheet to capture what the mitra SAID, so the row resolves
// to an answer ("Tertarik" / "Tidak tertarik") rather than to "asked".
//
// Cross-sell is nice-to-have, so the sequence carries the priority rather than
// the visual weight: this step comes after collection, is capped at one action
// per mitra, and is skippable.

import { useState } from 'react'
import {
  Badge,
  BottomSheet,
  Button,
  Card,
  NavigationHeader,
  SelectableCard,
} from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMajelis, type Mitra } from '../lib/data'
import { IconCheck, IconInfo } from '../lib/icons'
import { MitraCard } from '../lib/mitra-card'
import { store, taskForMajelis, useApp, type OfferResult } from '../lib/store'
import { InfoPill, SectionTitle, StatRows, StepBar, VisitTitle } from '../lib/ui'

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

export function MajelisOffersScreen() {
  const flow = useFlow()
  const s = useApp()
  const majelis = findMajelis(s.openMajelis)
  const task = taskForMajelis(majelis.id)

  // Sheet state is deliberately local: it must not survive navigation.
  const [pitching, setPitching] = useState<Mitra | null>(null)
  const [draft, setDraft] = useState<OfferResult | null>(null)

  const recommended = majelis.members.filter((m) => m.offer)
  const recorded = recommended.filter((m) => s.offerResults[m.id]).length

  // One row per KIND of offer, not one row per mitra: the BP wants to know how
  // far each product got, and a per-mitra list is what the cards below already
  // are. Order follows first appearance in the roster so it never reshuffles.
  const offerRows = recommended
    .map((m) => m.offer!)
    .filter((offer, i, all) => all.findIndex((o) => o.label === offer.label) === i)
    .map((offer) => {
      const withOffer = recommended.filter((m) => m.offer?.label === offer.label)
      const taken = withOffer.filter((m) => s.offerResults[m.id] === 'tertarik').length
      return {
        label: offer.done,
        value: `${taken} dari ${withOffer.length} mitra`,
      }
    })

  function openPitch(mitra: Mitra) {
    setDraft(s.offerResults[mitra.id] ?? null)
    setPitching(mitra)
  }

  function savePitch() {
    if (!pitching || !draft) return
    store.setOfferResult(pitching.id, draft)
    setPitching(null)
  }

  return (
    // Same header as step 1 — title, slot, and the Info pill in the same place.
    // The steps share a shell so the only thing that changes between them is
    // the list, which is the whole design of this flow.
    <Screen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={majelis.name} when={`Selasa, ${task?.time ?? '—'}`} />}
          onBack={() => flow.back()}
          link={
            <InfoPill>
              <IconInfo size={16} />
              Info
            </InfoPill>
          }
          onLinkClick={() => flow.go('majelis-info')}
        />
      }
    >
      <StepBar current={2} />

      {recommended.length > 0 ? (
        <>
          {/* The same StatRows card step 1 uses, so the two steps read as one
              screen with its list swapped. One row per offer, counted by what
              the mitra DID ("Sudah menabung") rather than by what the BP said —
              same rule as step 1's "Sudah ditagih". */}
          <StatRows rows={offerRows} />

          <SectionTitle>Daftar Mitra</SectionTitle>

          <div className="flex flex-col gap-8">
            {recommended.map((mitra) => {
              const result = s.offerResults[mitra.id]
              return (
                <MitraCard
                  key={mitra.id}
                  mitra={mitra}
                  onOpen={() => {
                    store.openMitraPage(mitra.id)
                    flow.go('mitra')
                  }}
                  // Step 2's subject: where she stands on the thing being offered.
                  status={mitra.offer?.status}
                  action={
                    // Same row shape as step 1: subject left, action right.
                    <div className="flex items-center gap-8">
                      <span className="min-w-0 flex-1 truncate text-12 font-bold text-default">
                        {mitra.offer?.label}
                      </span>
                      {result ? (
                        <>
                          <Badge
                            intent={result === 'tertarik' ? 'green' : 'neutral'}
                            leadingIcon={result === 'tertarik' ? <IconCheck size={16} /> : undefined}
                          >
                            {result === 'tertarik' ? 'Tertarik' : 'Tidak tertarik'}
                          </Badge>
                          <Button size="xs" variant="ghost" onClick={() => openPitch(mitra)}>
                            Ubah
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => openPitch(mitra)}>
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
          {recorded > 0 || recommended.length === 0 ? 'Lanjut' : 'Lewati'}
        </Button>
      </div>

      {/* --- The outcome. One question, two answers, no free text: the BP is
          standing in front of her, not writing a report. */}
      <BottomSheet
        open={pitching !== null}
        onClose={() => setPitching(null)}
        title="Hasil tawaran"
        description={pitching ? `${pitching.offer?.label} · ${pitching.name}` : undefined}
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
