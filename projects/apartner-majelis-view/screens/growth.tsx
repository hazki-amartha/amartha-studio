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
// "Tidak Tertarik" and "Tertarik". It used to open a page (`offer`), which was
// right while the answer needed a screen's worth of questions; the reference
// asks exactly one follow-up per branch, and a whole screen for one radio group
// is a round trip out of the room. The follow-up is a sheet over the card, so
// the queue stays where the BP left it.
//
// The whole stage is skippable. It is a tail, and a tail that blocks the close
// of a visit has stopped being a tail.

import { useState } from 'react'
import { Badge, BottomSheet, Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { growthMembers, type Growth } from '../lib/data'
import { majelisWhen } from '../lib/schedule'
import { IconCamera, IconCheck } from '../lib/icons'
import { DpdBadge, KetuaBadge, MitraCard } from '../lib/mitra-card'
import { growthDoneCount, store, useApp, openMajelisEntry, type GrowthFollowUp } from '../lib/store'
import {
  ActionRow,
  ChoiceList,
  ProductBadge,
  ProofTile,
  SectionTitle,
  StageBar,
  StickyBar,
  VisitTitle,
} from '../lib/ui'

// Why she said no. Without a reason on file every "tidak tertarik" looks the
// same, and next week's BP can't tell a settled no from a "not right now".
const DECLINE_REASONS = [
  'Belum ada kebutuhan',
  'Mau diskusi dulu di rumah',
  'Sudah punya di tempat lain',
  'Tidak sesuai',
]

// What happened to the yes. Two answers, because there are only two: it was
// filed in the room, or it wasn't and the next kumpulan has to pick it up.
const FOLLOW_UPS: { value: GrowthFollowUp; label: string }[] = [
  { value: 'selesai', label: 'Sudah' },
  { value: 'lanjut', label: 'Belum, dilanjutkan di lain waktu' },
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

  const members = growthMembers()
  const done = growthDoneCount(s)

  // Which card is being answered, and on which branch. The draft lives beside
  // it rather than in the store: a cancelled sheet has to leave the card
  // exactly as it found it.
  const [sheet, setSheet] = useState<{ mitraId: string; answer: 'ya' | 'tidak' } | null>(null)
  const [reason, setReason] = useState<string | null>(null)
  const [followUp, setFollowUp] = useState<GrowthFollowUp | null>(null)
  const [proof, setProof] = useState(false)

  // Reopened from "Ubah", the sheet comes back holding what was recorded, so
  // correcting an answer is an edit rather than a re-entry.
  function open(mitraId: string, answer: 'ya' | 'tidak') {
    setReason(s.growthReasons[mitraId] ?? null)
    setFollowUp(s.growthFollowUps[mitraId] ?? null)
    setProof(s.growthProofs[mitraId] ?? false)
    setSheet({ mitraId, answer })
  }

  // Both branches gate on their one question. A yes with nothing after it is
  // the same dead end a no with no reason was; the screenshot stays optional,
  // because a celengan filed at a kumpulan of 22 is often photographed later.
  const canSave = sheet
    ? sheet.answer === 'ya'
      ? followUp !== null
      : reason !== null
    : false

  function save() {
    if (!sheet || !canSave) return
    store.setGrowthResult(
      sheet.mitraId,
      sheet.answer,
      reason ?? undefined,
      followUp ?? undefined,
      proof,
    )
    setSheet(null)
  }

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={group.name} when={majelisWhen(group)} />}
          onBack={() => flow.back()}
        />
      }
    >
      {/* Same flat white band as the stages before it, carrying the stage bar
          alone. It used to hold a "Sudah ditawarkan" progress block as well —
          the same count the sticky footer prints above the button ("N dari M
          sudah ditawarkan"), once at each end of the screen. The footer's is the
          one attached to the thing it qualifies. */}
      <div className="-mx-16 -mt-16 flex flex-col gap-12 border-b border-default bg-neutral-white px-16 pb-12 pt-16">
        <StageBar current={3} />
      </div>

      <SectionTitle>Tawarkan produk/layanan lanjutan</SectionTitle>

      <div className="flex flex-col gap-8 pb-16">
        {members.map((mitra) => {
          const growth = mitra.growth
          if (!growth) return null
          const result = s.growthResults[mitra.id]
          const reasonOnFile = s.growthReasons[mitra.id]
          const followUpOnFile = s.growthFollowUps[mitra.id]

          return (
            <MitraCard
              key={mitra.id}
              mitra={mitra}
              // Identical to stages 1 and 2. See attendance.tsx.
              meta={null}
              // See attendance.tsx — the product labels the card from the right
              // edge of the name row on all three stages.
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
                result === undefined ? (
                  <div className="flex flex-col gap-12">
                    <OfferPitch growth={growth} />
                    {/* Both answers as equal outline buttons, per the reference:
                        neither is the recommended one, and a filled "Tertarik"
                        beside an outlined "Tidak Tertarik" would be the app
                        putting its thumb on a conversation it isn't in. */}
                    <div className="flex gap-8 border-t border-default pt-12">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => open(mitra.id, 'tidak')}
                      >
                        Tidak Tertarik
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => open(mitra.id, 'ya')}
                      >
                        Tertarik
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Once answered the card is a RECORD, so it names what was put
                  // to her and how it landed.
                  <ActionRow
                    label={result === 'ya' ? growth.label : 'Tidak tertarik'}
                    value={result === 'ya' ? growth.done : (reasonOnFile ?? 'Tanpa alasan')}
                  >
                    <div className="flex items-center gap-8">
                      {/* A yes that was finished in the room and one that was
                          not are different states on this queue: the second is
                          work the next kumpulan inherits, and badging both
                          "Tertarik" hides it. */}
                      {result === 'ya' && followUpOnFile === 'lanjut' ? (
                        <Badge intent="orange">Lanjut kumpulan depan</Badge>
                      ) : result === 'ya' ? (
                        <Badge intent="green" leadingIcon={<IconCheck size={16} />}>
                          Selesai
                        </Badge>
                      ) : (
                        <Badge intent="neutral">Ditolak</Badge>
                      )}
                      {/* "Ubah" reopens the sheet that produced the answer, so a
                          recorded result is never trapped. */}
                      <Button size="xs" variant="ghost" onClick={() => open(mitra.id, result)}>
                        Ubah
                      </Button>
                    </div>
                  </ActionRow>
                )
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
          <div className="flex flex-col gap-12">
            <ChoiceList
              hideLabel
              label="Sudah diproses penawarannya?"
              options={FOLLOW_UPS.map((f) => f.label)}
              value={FOLLOW_UPS.find((f) => f.value === followUp)?.label}
              onPick={(label) =>
                setFollowUp(FOLLOW_UPS.find((f) => f.label === label)?.value ?? null)
              }
            />
            {/* The screenshot behind a yes that was filed on the spot — the same
                thing a Poket claim asks for, and asked for the same reason: ops
                reconciles the claim against a picture. Only on the branch that
                claims something was filed; there is nothing yet to photograph
                on one carried to the next kumpulan. */}
            {followUp === 'selesai' ? (
              <div className="flex flex-col gap-8">
                <span className="text-12 text-caption">Bukti sudah diproses</span>
                <div className="flex">
                  <ProofTile
                    done={proof}
                    label="Foto/upload bukti"
                    doneLabel="Bukti tersimpan"
                    icon={<IconCamera size={24} />}
                    onClick={() => setProof(!proof)}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <ChoiceList
            hideLabel
            label="Alasan tidak tertarik"
            options={DECLINE_REASONS}
            value={reason ?? undefined}
            onPick={setReason}
          />
        )}
      </BottomSheet>

      <StickyBar>
        <span className="text-center text-12 text-caption">
          {done} dari {members.length} sudah ditawarkan · langkah ini opsional
        </span>
        {/* Two ways off the stage, as the reference draws them: back to the
            collection she came from, or on to the bukti that closes the visit. */}
        <div className="flex gap-8">
          <Button size="lg" variant="outline" className="flex-1" onClick={() => flow.back()}>
            Kembali
          </Button>
          <Button size="lg" className="flex-1" onClick={() => flow.go('proof')}>
            Lanjut
          </Button>
        </div>
      </StickyBar>
    </Screen>
  )
}
