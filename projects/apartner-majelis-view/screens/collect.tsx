'use client'

// Tagih Pembayaran — the collect page.
//
// The page opens on one card: who she is, and what she owes, in the same
// breakdown the mitra page and the doorstep card use. Three surfaces, one
// drawing of the same three facts — total, this week, arrears — because they are
// read at the same moment (before the BP asks for money) and two drawings of one
// number is how a prototype ends up arguing with itself in a review.
//
// Under it, the choice — and every follow-up a choice needs is drawn INSIDE the
// option that caused it. A reason field parked at the bottom of the page is a
// second question the BP has to connect back to the answer above it, and on a
// screen where three of four options carry a follow-up that connection is
// exactly what gets mis-made in a room of 22 women.
//
// What must be recorded before the button unlocks:
//   • a payment short of the bill carries WHY it was short
//   • a "tidak bayar" carries both the reason AND the janji bayar
// Both for the same reason as the register's absence reasons: a balance nobody
// wrote a reason against is a balance nobody can chase, and "janji bayar" is the
// only part of a refusal that says what happens next.
//
// The consequence is pinned rather than placed. "Sisa setelah ini" sits inside
// the sticky footer with the button, because a figure that scrolled away from
// the action it qualifies is a figure the BP reads once and then commits blind.

import { useState } from 'react'
import { Button, Input, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMitra, outstandingOf, rupiah } from '../lib/data'
import { paidOf, store, useApp } from '../lib/store'
import { DpdBadge, MitraCard, TagihanBreakdown } from '../lib/mitra-card'
import { ChoiceList, OptionCard, ProductBadge, SectionTitle, StickyBar } from '../lib/ui'

// Field-realistic reasons. Free text is deliberately absent: the BP is standing
// in front of her on a motorbike schedule, not writing a report — and a fixed
// list is the only version ops can count.
const REASONS = [
  'Usaha sedang sepi',
  'Ada kebutuhan mendesak',
  'Sakit / keluarga sakit',
  'Sedang tidak di tempat',
  'Menolak bayar',
]

// Why she handed over less than the bill. Same list minus "menolak bayar" —
// a woman who paid something did not refuse — plus the two answers that only
// make sense when money did change hands.
const SHORTFALL_REASONS = [
  'Usaha sedang sepi',
  'Ada kebutuhan mendesak',
  'Sakit / keluarga sakit',
  'Uang belum terkumpul semua',
  'Sisanya menyusul minggu ini',
]

// Discrete options rather than a date picker: a BP negotiates a rough date at
// the majelis, and "no promise at all" has to be expressible.
const PTP_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Besok, 22 Juli', value: '22 Juli' },
  { label: 'Lusa, 23 Juli', value: '23 Juli' },
  { label: 'Minggu depan, 28 Juli', value: '28 Juli' },
  { label: 'Tidak ada janji', value: null },
]

type Mode = 'penuh' | 'minggu' | 'lain' | 'tidak'

export function CollectScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const owed = outstandingOf(mitra)

  // Reopened from "Ubah", the page comes back on the mode that PRODUCED the
  // outcome, holding the amount already on file — so correcting an entry is an
  // edit, not a re-entry from scratch.
  const existing = paidOf(s, mitra)
  const refusal = s.nonPayments[mitra.id]
  const [mode, setMode] = useState<Mode>(
    refusal ? 'tidak' : existing > 0 && existing < owed.total ? 'lain' : 'penuh',
  )
  const [draft, setDraft] = useState(String(existing > 0 ? existing : ''))
  const [reason, setReason] = useState<string | null>(refusal?.reason ?? null)
  const [ptp, setPtp] = useState<string | null | undefined>(refusal ? refusal.ptp : undefined)
  const [shortfall, setShortfall] = useState<string | null>(s.shortfallReasons[mitra.id] ?? null)

  // When she is current, "bayar penuh" and "minggu ini saja" collect the same
  // money. Showing both would be a choice with no difference behind it.
  const hasArrears = owed.total > owed.thisWeek

  const typed = Number(draft.replace(/\D/g, '')) || 0
  const amount =
    mode === 'penuh' ? owed.total : mode === 'minggu' ? owed.thisWeek : mode === 'lain' ? typed : 0
  const after = Math.max(0, owed.total - amount)

  // A payment that leaves a balance needs its reason; a payment that clears the
  // bill does not. `mode === 'minggu'` on a mitra with arrears is always short.
  const short = amount > 0 && amount < owed.total
  const canSave =
    mode === 'tidak'
      ? reason !== null && ptp !== undefined
      : amount > 0 && (!short || shortfall !== null)

  function save() {
    if (!canSave) return
    if (mode === 'tidak') {
      store.setNonPayment(mitra, { reason: reason as string, ptp: ptp ?? null })
      flow.go('collection')
      return
    }
    store.collect(mitra, amount, short ? (shortfall as string) : undefined)
    flow.go('collect-done')
  }

  const ptpLabel = PTP_OPTIONS.find((o) => ptp !== undefined && o.value === ptp)?.label

  return (
    <Screen topBar={<NavigationHeader title="Tagih Pembayaran" onBack={() => flow.back()} />}>
      {/* Who she is and what she owes, as one card. The identity block is the
          same one the stage lists use, so the woman on this page is visibly the
          woman whose card was tapped. */}
      <MitraCard
        mitra={mitra}
        meta={null}
        labels={
          <>
            <ProductBadge product={mitra.product} />
            <DpdBadge dpd={mitra.dpd} format="short" />
          </>
        }
        onOpen={() => flow.go('mitra')}
        action={<TagihanBreakdown mitra={mitra} bare />}
      />

      <SectionTitle>Bagaimana Ibu membayar?</SectionTitle>

      <div role="radiogroup" aria-label="Cara membayar" className="flex flex-col gap-8 pb-16">
        <OptionCard
          selected={mode === 'penuh'}
          title="Bayar penuh"
          description={rupiah(owed.total)}
          onSelect={() => setMode('penuh')}
        />

        {hasArrears ? (
          <OptionCard
            selected={mode === 'minggu'}
            title="Minggu ini saja"
            description={rupiah(owed.thisWeek)}
            onSelect={() => setMode('minggu')}
          >
            {/* Paying this week only on a mitra with arrears IS paying short,
                so the same question follows it as follows a smaller amount. */}
            <ChoiceList
              label={`Alasan kurang bayar — sisa ${rupiah(owed.total - owed.thisWeek)}`}
              options={SHORTFALL_REASONS}
              value={shortfall ?? undefined}
              onPick={setShortfall}
            />
          </OptionCard>
        ) : null}

        <OptionCard
          selected={mode === 'lain'}
          title="Jumlah lain"
          description="Masukkan nominal yang diterima"
          onSelect={() => setMode('lain')}
        >
          <Input
            label="Jumlah diterima"
            prefix="Rp"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
            helperText={
              typed > owed.total
                ? `Lebih ${rupiah(typed - owed.total)} dari total tagihan`
                : typed === owed.total
                  ? 'Sama dengan total tagihan'
                  : 'Sisa akan tercatat sebagai tunggakan'
            }
            state={typed > 0 && typed >= owed.total ? 'valid' : 'default'}
          />
          {/* Only once there is a shortfall to explain — asking why she paid
              less before she has typed anything is a question about nothing. */}
          {mode === 'lain' && short ? (
            <ChoiceList
              label={`Alasan kurang bayar — sisa ${rupiah(owed.total - typed)}`}
              options={SHORTFALL_REASONS}
              value={shortfall ?? undefined}
              onPick={setShortfall}
            />
          ) : null}
        </OptionCard>

        <OptionCard
          selected={mode === 'tidak'}
          title="Tidak bayar"
          description="Catat alasan dan janji bayar"
          onSelect={() => setMode('tidak')}
        >
          <ChoiceList
            label="Alasan tidak bayar"
            options={REASONS}
            value={reason ?? undefined}
            onPick={setReason}
          />
          {/* Both halves are required. A refusal with no reason is uncountable;
              a refusal with no date is unchaseable — and "Tidak ada janji" is a
              real answer, which is why it is on the list rather than implied by
              skipping the question. */}
          <ChoiceList
            label="Janji bayar"
            options={PTP_OPTIONS.map((o) => o.label)}
            value={ptpLabel}
            onPick={(picked) =>
              setPtp(PTP_OPTIONS.find((o) => o.label === picked)?.value ?? null)
            }
          />
        </OptionCard>
      </div>

      {/* --- The consequence, pinned to the action that causes it. ---------- */}
      <StickyBar>
        <div className="flex items-center gap-12">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-caption">Total tagihan</span>
            <span className="truncate text-16 font-bold text-default">{rupiah(owed.total)}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-end">
            <span className="text-12 text-caption">Sisa setelah ini</span>
            <span
              className={`truncate text-16 font-bold ${after === 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {rupiah(after)}
            </span>
          </div>
        </div>
        <Button size="lg" className="w-full" disabled={!canSave} onClick={save}>
          {mode === 'tidak' ? 'Simpan Catatan' : 'Terima Tunai'}
        </Button>
      </StickyBar>
    </Screen>
  )
}
