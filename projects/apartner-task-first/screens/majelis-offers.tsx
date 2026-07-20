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
import { Chip, ChipGroup, InfoPill, SectionTitle, StatRows, StepBar, VisitTitle } from '../lib/ui'

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

/**
 * Why she said no — and whether that no has a shelf life.
 *
 * `soft: true` means the answer was about timing, not the product, so the offer
 * comes back. That is the whole reason this list exists: without it every no
 * looks identical, and next week's BP either re-pitches a mitra who has already
 * refused outright, or drops one who only said "not this week". Both are the
 * same bug — an outcome that closes nothing.
 */
const DECLINE_REASONS: { label: string; soft: boolean }[] = [
  { label: 'Belum butuh saat ini', soft: true },
  { label: 'Dana belum ada', soft: true },
  { label: 'Mau diskusi dulu di rumah', soft: true },
  { label: 'Sudah punya di tempat lain', soft: false },
  { label: 'Tidak berminat', soft: false },
]

// Two horizons, because a BP negotiates in weeks and the majelis meets weekly.
const RETRIGGER_OPTIONS: { label: string; value: string }[] = [
  { label: 'Minggu depan (28 Juli)', value: '28 Juli' },
  { label: '2 minggu lagi (4 Agustus)', value: '4 Agustus' },
]

const findReason = (label: string | null) => DECLINE_REASONS.find((r) => r.label === label)

export function MajelisOffersScreen() {
  const flow = useFlow()
  const s = useApp()
  const majelis = findMajelis(s.openMajelis)
  const task = taskForMajelis(majelis.id)

  // Sheet state is deliberately local: it must not survive navigation.
  const [pitching, setPitching] = useState<Mitra | null>(null)
  const [draft, setDraft] = useState<OfferResult | null>(null)
  const [reason, setReason] = useState<string | null>(null)
  const [retrigger, setRetrigger] = useState<string | null>(null)

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
    const decline = s.offerDeclines[mitra.id]
    setDraft(s.offerResults[mitra.id] ?? null)
    setReason(decline?.reason ?? null)
    setRetrigger(decline?.retrigger ?? null)
    setPitching(mitra)
  }

  /**
   * Picking a soft reason preselects next week. The BP should not have to
   * confirm the obvious follow-up to "belum butuh" — the common answer is
   * already there and the other horizon is one tap away. A hard reason drops
   * the date entirely: there is nothing to schedule.
   */
  function pickReason(label: string) {
    setReason(label)
    setRetrigger(findReason(label)?.soft ? RETRIGGER_OPTIONS[0].value : null)
  }

  const softNo = Boolean(findReason(reason)?.soft)
  // A no is only saved once it says why. "Tertarik" needs nothing extra.
  const canSave = draft === 'tertarik' || (draft === 'tidak' && Boolean(reason))

  function savePitch() {
    if (!pitching || !draft || !canSave) return
    store.setOfferResult(
      pitching.id,
      draft,
      draft === 'tidak' && reason ? { reason, retrigger: softNo ? retrigger : null } : undefined,
    )
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
              const decline = s.offerDeclines[mitra.id]
              // Once she has answered, the status line stops describing where
              // she stands on the product and starts carrying what she said —
              // the reason, and when the offer comes back. Recorded ≠ finished:
              // a soft no is an open item, and this is where it stays visible.
              const status = decline
                ? decline.retrigger
                  ? `${decline.reason} · tawarkan lagi ${decline.retrigger}`
                  : `${decline.reason} · tidak diulang`
                : mitra.offer?.status
              return (
                <MitraCard
                  key={mitra.id}
                  mitra={mitra}
                  onOpen={() => {
                    store.openMitraPage(mitra.id)
                    flow.go('mitra')
                  }}
                  // Step 2's subject: where she stands on the thing being offered.
                  status={status}
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
          <Button className="w-full" disabled={!canSave} onClick={savePitch}>
            Simpan
          </Button>
        }
        secondaryAction={
          <Button className="w-full" variant="ghost" onClick={() => setPitching(null)}>
            Batal
          </Button>
        }
      >
        <div className="flex flex-col gap-12">
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

          {/* A no closes its own loop: why, and — when the why is about timing —
              when to come back. Chips rather than SelectableCards for the same
              reason step 1 uses them: these are tags on an outcome, not the
              outcome itself, and five stacked cards would push Simpan off the
              sheet. */}
          {draft === 'tidak' ? (
            <>
              <ChipGroup label="Alasan">
                {DECLINE_REASONS.map((option) => (
                  <Chip
                    key={option.label}
                    selected={reason === option.label}
                    onClick={() => pickReason(option.label)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </ChipGroup>

              {softNo ? (
                <ChipGroup label="Tawarkan lagi">
                  {RETRIGGER_OPTIONS.map((option) => (
                    <Chip
                      key={option.value}
                      selected={retrigger === option.value}
                      onClick={() => setRetrigger(option.value)}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </ChipGroup>
              ) : reason ? (
                // The hard no, said out loud. Silence here would read as a
                // missing question rather than a settled answer.
                <span className="text-12 text-caption">
                  Tawaran ini tidak akan diulang untuk {pitching?.name}.
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      </BottomSheet>
    </Screen>
  )
}
