'use client'

// Stage 3 of 3 — Penawaran.
//
// The cross-sell tail, and it comes last on purpose: money first, offers after.
// A BP who pitched a savings product before collecting would be asking a woman
// to open an account with the instalment she has not handed over yet.
//
// Only mitra with an actual recommendation appear — an offer for everyone is a
// list nobody reads — but they appear in the SAME order as the two stages
// before, in the same card, with the offer sitting exactly where the bill sat.
// Nothing re-sorts when a card is answered; the row simply states the result.
//
// The offer is now decided ON the card, per the reference: the sentence to say,
// the reason it is being said, and two buttons —
// "Belum Tertarik" and "Tertarik". It used to open a page (`offer`), which was
// right while the answer needed a screen's worth of questions; the reference
// asks exactly one follow-up per branch, and a whole screen for one radio group
// is a round trip out of the room. The follow-up is a sheet over the card, so
// the queue stays where the BP left it.
//
// Per the BP APP 2026 Figma, Lanjut waits until every offer has an answer;
// a majelis with no offers shows "Belum ada penawaran" and moves straight on.

import { useState } from 'react'
import { BottomSheet, Button, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { growthMembers, type Growth } from '../lib/data'
import { joinOther, reasonDone, splitOther } from '../lib/collect-options'
import { majelisWhen } from '../lib/schedule'
import { IconGift } from '../lib/icons'
import { DpdBadge, KetuaBadge, MitraCard } from '../lib/mitra-card'
import { growthDoneCount, store, useApp, openMajelisEntry, type GrowthFollowUp } from '../lib/store'
import { AppScreen, AttendanceChoice, ChoiceList, ProductBadge, ReasonNote, SectionTitle, StageBar, StickyBar, VisitTitle } from '../lib/ui'

// Why she said no. Without a reason on file every "tidak tertarik" looks the
// same, and next week's BP can't tell a settled no from a "not right now".
const DECLINE_REASONS = [
  'Belum ada kebutuhan',
  'Mau diskusi dulu di rumah',
  'Sudah punya di tempat lain',
  'Biaya admin terlalu mahal',
  'Lainnya',
]

// What happened to the yes. Two answers, because there are only two: it was
// filed in the room, or it wasn't and the next kumpulan has to pick it up.
const LANJUT_LABEL = 'Belum, akan dilanjutkan di lain waktu'
const FOLLOW_UPS: { value: GrowthFollowUp; label: string }[] = [
  { value: 'selesai', label: 'Sudah' },
  { value: 'lanjut', label: LANJUT_LABEL },
]

/**
 * The offer as it is put to her: the sentence to say, and the fact behind it.
 * The headline carries the figure — the card is where the offer is settled now,
 * and an amount that only appears after a tap is an amount the BP quotes from
 * memory.
 *
 * No product lockup above it. The headline already names the product in the
 * sentence the BP says out loud ("Tawarkan celengan."), so the artwork was the
 * same word twice, once as a picture.
 */
function OfferPitch({ growth }: { growth: Growth }) {
  const headline =
    growth.kind === 'celengan' ? `${growth.suggestion}.` : `${growth.suggestion} ${growth.value}.`
  return (
    <div className="flex flex-col gap-4">
      <span className="text-14 font-bold text-default">{headline}</span>
      <span className="text-12 text-caption">{growth.rationale}</span>
    </div>
  )
}

export function GrowthScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)

  const members = s.offersEmpty ? [] : growthMembers()
  const done = growthDoneCount(s)
  // Per the BP APP 2026 Figma, Lanjut waits until every offer has an answer —
  // except when there are no offers at all.
  const allAnswered = members.every((m) => s.growthResults[m.id] !== undefined)

  // Which card is being answered, and on which branch. The draft lives beside
  // it rather than in the store: a cancelled sheet has to leave the card
  // exactly as it found it.
  const [sheet, setSheet] = useState<{ mitraId: string; answer: 'ya' | 'tidak' } | null>(null)
  const [reason, setReason] = useState<string | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [followUp, setFollowUp] = useState<GrowthFollowUp | null>(null)
  const [why, setWhy] = useState('')

  // Reopened from the pencil, the sheet comes back holding what was recorded,
  // so correcting an answer is an edit rather than a re-entry.
  function open(mitraId: string, answer: 'ya' | 'tidak') {
    const onFile = s.growthReasons[mitraId]
    const sameBranch = s.growthResults[mitraId] === answer
    const split = splitOther(answer === 'tidak' && sameBranch ? onFile : undefined)
    setReason(split.pick)
    setReasonText(split.text)
    setFollowUp(sameBranch ? (s.growthFollowUps[mitraId] ?? null) : null)
    setWhy(answer === 'ya' && sameBranch ? (onFile ?? '') : '')
    setSheet({ mitraId, answer })
  }

  // A no needs its reason; a yes needs whether it was processed, and a "belum"
  // needs why — the next kumpulan picks it up from that sentence.
  const canSave = sheet
    ? sheet.answer === 'ya'
      ? followUp === 'selesai' || (followUp === 'lanjut' && why.trim() !== '')
      : reasonDone(reason, reasonText)
    : false

  function save() {
    if (!sheet || !canSave) return
    store.setGrowthResult(
      sheet.mitraId,
      sheet.answer,
      sheet.answer === 'tidak'
        ? (joinOther(reason, reasonText) ?? undefined)
        : followUp === 'lanjut'
          ? why.trim()
          : undefined,
      followUp ?? undefined,
    )
    setSheet(null)
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={group.name} when={majelisWhen(group)} />}
          onBack={() => flow.back()}
        />
      }
    >
      <div className="-mx-16 -mt-16 flex flex-col gap-12 rounded-b-16 border-b border-default bg-neutral-white px-16 pb-12 pt-16">
        <StageBar current={3} />
      </div>

      {members.length === 0 ? (
        // Nobody in this majelis qualifies. The Figma's illustration is not in
        // the design system, so a glyph tile stands in for it.
        <div className="flex flex-1 flex-col items-center gap-8 px-16 pt-24 text-center">
          <span className="mb-8 flex h-120 w-full items-center justify-center rounded-24 bg-primary-50 text-primary-500">
            <IconGift size={24} />
          </span>
          <span className="text-18 font-bold text-default">Belum ada penawaran</span>
          <span className="text-14 text-caption">
            Majelis belum memenuhi kriteria untuk dapat penawaran. Silakan lanjut ke tugas
            berikutnya.
          </span>
        </div>
      ) : (
        <SectionTitle>Tawarkan produk/layanan lanjutan</SectionTitle>
      )}

      <div className="flex flex-col gap-8 pb-16">
        {members.map((mitra) => {
          const growth = mitra.growth
          if (!growth) return null
          const result = s.growthResults[mitra.id]
          const reasonOnFile = s.growthReasons[mitra.id]
          const followUpOnFile = s.growthFollowUps[mitra.id]
          // An offer she accepted at an earlier visit that wasn't processed
          // then: the card asks whether it has been since, not the pitch again.
          const carried = s.growthCarried.includes(mitra.id)

          return (
            <MitraCard
              key={mitra.id}
              mitra={mitra}
              meta={null}
              titleBadge={<ProductBadge product={mitra.product} />}
              labels={
                <>
                  <KetuaBadge mitra={mitra} />
                  <DpdBadge dpd={mitra.dpd} format="short" />
                </>
              }
              onOpen={() => {
                store.openMitraPage(mitra.id)
                flow.go('mitra')
              }}
              action={
                <div className="flex flex-col gap-12">
                  <OfferPitch growth={growth} />
                  <div className="flex flex-col gap-8 border-t border-default pt-12">
                    <span className="text-14 text-default">
                      {carried
                        ? 'Apakah mitra sudah diproses penawarannya?'
                        : 'Apakah mitra tertarik dengan penawaran ini?'}
                    </span>
                    {carried ? (
                      <div className="flex gap-8">
                        <AttendanceChoice
                          tone="red"
                          selected={result === 'ya' && followUpOnFile === 'lanjut'}
                          answered={result !== undefined}
                          label={`Belum diproses — ${mitra.name}`}
                          onClick={() => store.setGrowthResult(mitra.id, 'ya', reasonOnFile, 'lanjut')}
                        >
                          Belum
                        </AttendanceChoice>
                        <AttendanceChoice
                          tone="green"
                          selected={result === 'ya' && followUpOnFile === 'selesai'}
                          answered={result !== undefined}
                          label={`Sudah diproses — ${mitra.name}`}
                          onClick={() => store.setGrowthResult(mitra.id, 'ya', undefined, 'selesai')}
                        >
                          Sudah
                        </AttendanceChoice>
                      </div>
                    ) : (
                      <div className="flex gap-8">
                        <AttendanceChoice
                          tone="red"
                          selected={result === 'tidak'}
                          answered={result !== undefined}
                          label={`Belum tertarik — ${mitra.name}`}
                          onClick={() => open(mitra.id, 'tidak')}
                        >
                          Belum Tertarik
                        </AttendanceChoice>
                        <AttendanceChoice
                          tone="green"
                          selected={result === 'ya'}
                          answered={result !== undefined}
                          label={`Tertarik — ${mitra.name}`}
                          onClick={() => open(mitra.id, 'ya')}
                        >
                          Tertarik
                        </AttendanceChoice>
                      </div>
                    )}
                    {/* What the answer left behind, as a note — per the Figma a
                        processed yes has none. */}
                    {!carried && result === 'tidak' ? (
                      <ReasonNote
                        label="Alasan:"
                        value={(reasonOnFile ?? '—').replace(/^Lainnya: /, 'Lainnya.\n')}
                        onEdit={() => open(mitra.id, 'tidak')}
                      />
                    ) : !carried && result === 'ya' && followUpOnFile === 'lanjut' ? (
                      <ReasonNote
                        label="Alasan:"
                        value={`${LANJUT_LABEL}.\n${reasonOnFile ?? ''}`.trim()}
                        onEdit={() => open(mitra.id, 'ya')}
                      />
                    ) : null}
                  </div>
                </div>
              }
            />
          )
        })}
      </div>

      {/* One question per branch, over the card that asked it. */}
      <BottomSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet?.answer === 'ya' ? 'Sudah diproses penawarannya?' : 'Alasan tidak tertarik'}
        secondaryAction={
          <Button size="lg" variant="outline" className="w-full" onClick={() => setSheet(null)}>
            Batal
          </Button>
        }
        primaryAction={
          <Button size="lg" className="w-full" disabled={!canSave} onClick={save}>
            Lanjut
          </Button>
        }
      >
        {sheet?.answer === 'ya' ? (
          <ChoiceList
            hideLabel
            label="Sudah diproses penawarannya?"
            options={FOLLOW_UPS.map((f) => f.label)}
            value={FOLLOW_UPS.find((f) => f.value === followUp)?.label}
            onPick={(label) =>
              setFollowUp(FOLLOW_UPS.find((f) => f.label === label)?.value ?? null)
            }
            other={{
              option: LANJUT_LABEL,
              text: why,
              onText: setWhy,
              placeholder: 'Jelaskan alasannya',
            }}
          />
        ) : (
          <ChoiceList
            hideLabel
            label="Alasan tidak tertarik"
            options={DECLINE_REASONS}
            value={reason ?? undefined}
            onPick={setReason}
            other={{ text: reasonText, onText: setReasonText, placeholder: 'Jelaskan alasannya' }}
          />
        )}
      </BottomSheet>

      <StickyBar>
        {/* Two ways off the stage: back to the collection she came from, or on
            to the bukti that closes the visit — once every offer is answered. */}
        <div className="flex gap-12">
          <Button size="lg" variant="outline" className="flex-1" onClick={() => flow.back()}>
            Kembali
          </Button>
          <Button
            size="lg"
            className="flex-1"
            disabled={!allAnswered}
            aria-label={allAnswered ? 'Lanjut' : `Lanjut — ${members.length - done} penawaran belum dijawab`}
            onClick={() => flow.go('proof')}
          >
            Lanjut
          </Button>
        </div>
      </StickyBar>
    </AppScreen>
  )
}
