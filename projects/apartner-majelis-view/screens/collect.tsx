'use client'

// Tagih Pembayaran — the collect menu.
//
// The page is two levels, told apart by ground rather than by a rule. The top,
// on white, is who she is over what she owes — identity, history and bill read
// as one flat block. The bottom, on the lightest grey, is the choice: the ways
// she can pay. A GL mitra gets one more than a Modal one — the group can cover
// her under tanggung renteng, and a Modal loan has no group to cover it.
//
// Tapping an option opens a bottom sheet, not a page. The sheet carries ONLY the
// thing that option needs — a reason, a promise, an amount, or for a full
// payment nothing but a confirm — because the bill it is against is still right
// there on the page behind it. A page had to redraw who she was and what she
// owed just to ask one question; the sheet asks the question over the answer.
//
// What must be recorded before a sheet's button unlocks:
//   • a payment short of the bill carries WHY it was short AND a date for the rest
//   • a "tidak bayar" carries both the reason AND the janji bayar
// A balance nobody wrote a reason and a date against is a balance nobody can
// chase — the same unauditable gap whether she paid half or paid nothing.
//
// Those two facts are asked ONE AT A TIME, in two steps of the same sheet: the
// reason first, the promise second. They used to be stacked in one sheet, which
// put ten radio rows in front of a BP standing in a room and made "which of
// these did I already answer" a question she had to work out from the ticks.
// Step 2 gets a back arrow instead of a close, so a wrong reason costs one tap
// rather than the whole sheet.
//
// There are only THREE sheets behind the rows: an amount, a refusal, and the
// one-tap tanggung renteng confirm. The
// three paying rows — penuh, minggu ini, jumlah lain — all open the same sheet,
// prefilled to their own figure and editable from there, because they were never
// different transactions: they are the same "how much did she hand over", asked
// with a different starting guess. She hands over Rp450.000 against a Rp500.000
// bill and the BP does not have to back out of "bayar penuh" and start again in
// "jumlah lain"; she edits the figure in front of her. The shortfall reason and
// the janji bayar then follow from the AMOUNT rather than from which row was
// tapped, which is what they always meant.

import { useState } from 'react'
import { BottomSheet, Button, InputNominal, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMitra, outstandingOf, rupiah } from '../lib/data'
import { Image as ImageIcon } from '@/design-system/icons'
import { paidOf, paidViaPoket, store, useApp } from '../lib/store'
import { AngsuranCard, DpdBadge, KetuaBadge, MitraCard } from '../lib/mitra-card'
import { ChoiceList, ProductBadge, ProofTile, SectionTitle } from '../lib/ui'
import { IconChevronRight } from '../lib/icons'
import {
  PTP_OPTIONS,
  REASONS,
  SHORTFALL_REASONS,
  ptpLabelOf,
  ptpValueOf,
} from '../lib/collect-options'

/**
 * The three sheets: money changed hands, the GROUP covered her, or neither.
 *
 * `tanggung` is GL only — joint liability is what the G in GL is. On a Modal
 * loan the debt is hers alone, so offering the group as a payer would record a
 * settlement no group ever agreed to. Same rule, same wording, as the home
 * visit's Tagih step.
 *
 * `poket` is not a collection at all. She paid days ago through Poket and the
 * system has not caught up — which happens often enough that without a row for
 * it the BP either books it as cash she never received or leaves the mitra in
 * the queue owing money she has already handed over. Both are worse than a
 * claim with a screenshot behind it.
 *
 * It takes a TYPED amount, like a cash payment, and when that amount falls
 * short of the bill it asks the same two questions — the reason and the janji
 * bayar. A Poket payment is not automatically the whole thing: she pays what
 * she has, through the app, and the balance behind it is a balance like any
 * other. What differs is only where the money went and that a screenshot backs
 * it, not how much of the bill it closed.
 */
type Mode = 'bayar' | 'tidak' | 'tanggung' | 'poket'

export function CollectScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const owed = outstandingOf(mitra)

  // When she is current, "bayar penuh" and "minggu ini saja" collect the same
  // money. Showing both would be a choice with no difference behind it.
  const hasArrears = owed.total > owed.thisWeek

  // Reopened from the recap's "Ubah", the sheet that produced the outcome comes
  // back open and prefilled — a refusal on the tidak sheet, any part-payment on
  // the jumlah-lain sheet, a full payment on the penuh sheet. A fresh "Tagih"
  // has no outcome yet, so it opens on the menu with every sheet closed.
  const existing = paidOf(s, mitra)
  const refusal = s.nonPayments[mitra.id]
  const settledByGroup = s.payMode[mitra.id] === 'tanggung' && existing > 0
  const settledViaPoket = paidViaPoket(s, mitra)
  const [sheet, setSheet] = useState<Mode | null>(
    refusal
      ? 'tidak'
      : settledByGroup
        ? 'tanggung'
        : settledViaPoket
          ? 'poket'
          : existing > 0
            ? 'bayar'
            : null,
  )
  // Every sheet opens on its first step, including a reopened one: the answer to
  // correct is usually the one given first.
  const [step, setStep] = useState<1 | 2>(1)

  // The amount, always. A reopened sheet comes back on what was collected; a
  // fresh one is seeded by the row that opened it.
  const [draft, setDraft] = useState(String(existing > 0 ? existing : ''))
  const [reason, setReason] = useState<string | null>(refusal?.reason ?? null)
  const [shortfall, setShortfall] = useState<string | null>(s.shortfallReasons[mitra.id] ?? null)
  const [ptp, setPtp] = useState<string | null | undefined>(
    refusal ? refusal.ptp : (s.partialPtp[mitra.id] ?? undefined),
  )
  // The screenshot. Held on the page rather than written straight to the store,
  // so backing out of the sheet leaves no half-recorded claim behind.
  const [proof, setProof] = useState(s.poketProof[mitra.id] ?? false)

  const typed = Number(draft.replace(/\D/g, '')) || 0
  // Short is a fact about the FIGURE, not about which row was tapped: anything
  // under the bill leaves a balance behind, whether the BP started from "bayar
  // penuh" and edited it down or typed it from scratch.
  const short = (sheet === 'bayar' || sheet === 'poket') && typed > 0 && typed < owed.total

  // A janji bayar is asked for on its own step, and only where a balance is
  // being left behind: a shortfall, or a refusal. That includes a SHORT Poket
  // payment — she paid Rp200.000 of a Rp650.000 bill through the app, and the
  // rest is a balance like any other. Tanggung renteng leaves none — the group
  // closed the whole bill.
  const hasPtpStep = sheet === 'tidak' || short

  // What step 1 has to carry before "Lanjut" (or, with no step 2, the save)
  // unlocks.
  const step1Done =
    sheet === 'tidak'
      ? reason !== null
      : sheet === 'bayar'
        ? typed > 0 && (!short || shortfall !== null)
        : sheet === 'poket'
          ? // Same rules as a cash payment — an amount, and a reason if it fell
            // short — plus the screenshot, which is what makes it more than one
            // person's word that a payment nobody's system has seen happened.
            typed > 0 && (!short || shortfall !== null) && proof
          : // Tanggung renteng has nothing to fill in: the amount is the whole
            // bill and the payer is the group. One tap is the whole record.
            sheet === 'tanggung'

  const onLastStep = !hasPtpStep || step === 2
  const canAdvance = step === 1 ? step1Done : ptp !== undefined
  const canSave = onLastStep && step1Done && (!hasPtpStep || ptp !== undefined)

  /**
   * `seed` is the figure the row that was tapped starts the field on — the full
   * bill, this week's instalment, or nothing at all for "jumlah lain". It is a
   * starting guess, not a commitment: the field is editable from there, which is
   * why the three rows no longer need three sheets.
   */
  function openSheet(mode: Mode, seed?: number) {
    setSheet(mode)
    setStep(1)
    if (mode === 'bayar' || mode === 'poket') setDraft(seed ? String(seed) : '')
  }

  function closeSheet() {
    setSheet(null)
    setStep(1)
  }

  function save() {
    if (!canSave || sheet === null) return
    if (sheet === 'tidak') {
      store.setPayMode(mitra.id, 'tidak')
      store.setNonPayment(mitra, { reason: reason as string, ptp: ptp ?? null })
    } else if (sheet === 'poket') {
      store.recordPoket(mitra, typed, short ? (shortfall as string) : undefined)
      store.setPartialPtp(mitra.id, short ? (ptp ?? null) : null)
      store.setPoketProof(mitra.id, true)
    } else if (sheet === 'tanggung') {
      // Settled in full, funded by the group rather than by her. The two facts
      // are recorded separately — the money on the ledger, the payer on the
      // mode — because the collection card has to be able to say which it was.
      store.setPayMode(mitra.id, 'tanggung')
      store.collect(mitra, owed.total)
      store.setPartialPtp(mitra.id, null)
    } else {
      store.setPayMode(mitra.id, short ? 'sebagian' : 'penuh')
      store.collect(mitra, typed, short ? (shortfall as string) : undefined)
      // The promise rides with a shortfall, and is cleared when there isn't one.
      store.setPartialPtp(mitra.id, short ? (ptp ?? null) : null)
    }
    flow.go('collection')
  }

  return (
    // A white canvas: the top block sits on it directly, and the options section
    // lays its own grey band over it to drop to the lower level.
    <Screen
      topBar={<NavigationHeader title="Tagih Pembayaran" onBack={() => flow.back()} />}
      className="bg-neutral-white"
    >
      {/* Who she is, what she has been paying, and what she owes — as one flat
          block, no cards. The week grid's grey fill carries the one edge that
          remains. */}
      <MitraCard
        mitra={mitra}
        flat
        meta={null}
        labels={
          <>
            <KetuaBadge mitra={mitra} />
            <ProductBadge product={mitra.product} />
            <DpdBadge dpd={mitra.dpd} format="short" />
          </>
        }
        onOpen={() => flow.go('mitra')}
      />

      <AngsuranCard mitra={mitra} flat />

      {/* The lower level. It bleeds to the page edges and fills the rest of the
          screen, so the grey reads as a floor the choice sits on rather than a
          tinted card floating in the middle of a white page. */}
      <div
        role="radiogroup"
        aria-label="Cara membayar"
        className="-mx-16 flex flex-1 flex-col gap-12 border-t border-default bg-neutral-50 px-16 pb-16 pt-16"
      >
        <SectionTitle>Bagaimana Ibu membayar?</SectionTitle>

        <div className="flex flex-col gap-8">
          {/* Three doors into ONE sheet. What differs is the figure the amount
              field opens on — the whole bill, this week only, or blank. */}
          <NavRow
            title="Bayar penuh"
            amount={rupiah(owed.total)}
            onOpen={() => openSheet('bayar', owed.total)}
          />

          {hasArrears ? (
            <NavRow
              title="Minggu ini saja"
              amount={rupiah(owed.thisWeek)}
              onOpen={() => openSheet('bayar', owed.thisWeek)}
            />
          ) : null}

          <NavRow title="Jumlah lain" onOpen={() => openSheet('bayar')} />

          {/* GL only. The group covering her arrears is a real outcome of a
              kumpulan — it is decided in the room, out loud, by the women
              sitting in it — and without a row for it the BP records the money
              as a payment from a mitra who did not make it. */}
          {mitra.product === 'GL' ? (
            <NavRow
              title="Tanggung renteng"
              amount={rupiah(owed.total)}
              onOpen={() => openSheet('tanggung')}
            />
          ) : null}

          {/* Not a payment she is taking — one she is CATCHING UP with. It sits
              with the paying rows because that is what it is to the mitra: her
              bill is settled. */}
          <NavRow
            title="Sudah bayar via Poket"
            amount={rupiah(owed.total)}
            onOpen={() => openSheet('poket', owed.total)}
          />

          <NavRow title="Tidak bayar" onOpen={() => openSheet('tidak')} />
        </div>
      </div>

      <BottomSheet
        open={sheet !== null}
        onClose={closeSheet}
        // Step 2 steps BACK rather than closing — the sheet keeps its own
        // history, so correcting the reason behind a promise is one tap.
        onBack={step === 2 ? () => setStep(1) : undefined}
        size="md"
        // The title names the QUESTION being asked, not the option that was
        // tapped: the bill and the choice are both still on the page behind it.
        // The amount step has none — it leads with the nominal tile, which is
        // its own heading.
        title={
          sheet === null
            ? undefined
            : step === 2
              ? 'Janji Bayar'
              : sheet === 'tidak'
                ? 'Alasan Tidak Bayar'
                : sheet === 'tanggung'
                  ? 'Tanggung Renteng'
                  : sheet === 'poket'
                    ? 'Sudah Bayar via Poket'
                    : undefined
        }
        primaryAction={
          <Button
            size="lg"
            className="w-full"
            disabled={!canAdvance}
            onClick={() => (onLastStep ? save() : setStep(2))}
          >
            {!onLastStep
              ? 'Lanjut'
              : sheet === 'tidak'
                ? 'Simpan Catatan'
                : sheet === 'tanggung'
                  ? 'Catat Tanggung Renteng'
                  : sheet === 'poket'
                    ? 'Catat Pembayaran'
                    : 'Terima Tunai'}
          </Button>
        }
      >
        {/* --- Step 1 ----------------------------------------------------- */}

        {/* The sheet leads with the amount, at the size the whole sheet is
            about, prefilled by the row that opened it and editable from there.
            The shortfall reason appears UNDER it the moment the figure lands
            short of the bill — asking why before there is a number to be short
            by is a question about nothing. */}
        {sheet === 'bayar' && step === 1 ? (
          <>
            <InputNominal
              label="Jumlah diterima"
              value={draft}
              onValueChange={setDraft}
              helperText={
                typed > owed.total
                  ? `Lebih ${rupiah(typed - owed.total)} dari total tagihan`
                  : typed === owed.total
                    ? 'Lunas — sama dengan total tagihan'
                    : typed === 0
                      ? 'Sisa akan tercatat sebagai tunggakan'
                      : `Sisa ${rupiah(owed.total - typed)} akan tercatat sebagai tunggakan`
              }
            />
            {short ? (
              <ChoiceList
                label="Alasan kurang bayar"
                options={SHORTFALL_REASONS}
                value={shortfall ?? undefined}
                onPick={setShortfall}
              />
            ) : null}
          </>
        ) : null}

        {/* Nothing to fill in — a read-back of what the one tap will record,
            the same card the home visit shows when this outcome is picked. */}
        {sheet === 'tanggung' ? (
          <div className="flex flex-col gap-4 rounded-12 bg-neutral-50 p-12">
            <span className="text-12 text-caption">Ditanggung kelompok</span>
            <span className="text-20 font-bold text-default">{rupiah(owed.total)}</span>
            <span className="text-12 text-caption">
              Tanggung renteng menutup seluruh tagihan {mitra.name} hari ini.
            </span>
          </div>
        ) : null}

        {/* What she is entering, and the one thing that backs it. No amount
            field: a Poket payment settled the bill, and letting the BP type a
            different figure would invite a number nobody's system agrees with. */}
        {sheet === 'poket' && step === 1 ? (
          <div className="flex flex-col gap-12">
            {/* The figure is TYPED, seeded with the full bill rather than fixed
                to it. A Poket payment is not always the whole thing — she pays
                what she has, through the app, days before the BP arrives — and
                a locked amount would make the BP record money that was never
                paid just to get the transaction on file. */}
            <InputNominal
              label="Jumlah dibayar"
              value={draft}
              onValueChange={setDraft}
              helperText={
                typed > owed.total
                  ? `Lebih ${rupiah(typed - owed.total)} dari total tagihan`
                  : typed === owed.total
                    ? 'Lunas — sama dengan total tagihan'
                    : typed === 0
                      ? 'Masukkan jumlah yang sudah dibayar'
                      : `Sisa ${rupiah(owed.total - typed)} akan tercatat sebagai tunggakan`
              }
            />

            {/* Short through Poket leaves the same balance a short cash payment
                does, so it carries the same two answers: why, and when. */}
            {short ? (
              <ChoiceList
                label="Alasan kurang bayar"
                options={SHORTFALL_REASONS}
                value={shortfall ?? undefined}
                onPick={setShortfall}
              />
            ) : null}

            <div className="flex flex-col gap-8">
              <span className="text-12 text-caption">Bukti transaksi</span>
              <div className="flex">
                <ProofTile
                  done={proof}
                  label="Unggah bukti"
                  doneLabel="Bukti terlampir"
                  icon={<ImageIcon size={24} />}
                  onClick={() => setProof(!proof)}
                />
              </div>
            </div>
          </div>
        ) : null}

        {sheet === 'tidak' && step === 1 ? (
          <ChoiceList
            hideLabel
            label="Alasan tidak bayar"
            options={REASONS}
            value={reason ?? undefined}
            onPick={setReason}
          />
        ) : null}

        {/* --- Step 2: the date the balance is chased on. ------------------ */}
        {step === 2 ? (
          <ChoiceList
            hideLabel
            label="Janji bayar"
            options={PTP_OPTIONS.map((o) => o.label)}
            value={ptpLabelOf(ptp)}
            onPick={(label) => setPtp(ptpValueOf(label))}
          />
        ) : null}
      </BottomSheet>
    </Screen>
  )
}

// A payment option: a full-width row that opens its sheet. White with a border
// so each row still reads as its own object against the grey floor.
function NavRow({
  title,
  amount,
  onOpen,
}: {
  title: string
  amount?: string
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-12 rounded-8 border border-default bg-neutral-white p-16 text-left"
    >
      <span className="min-w-0 flex-1 text-16 text-default">{title}</span>
      {amount ? <span className="shrink-0 text-16 font-bold text-default">{amount}</span> : null}
      <span className="shrink-0 text-disabled">
        <IconChevronRight size={20} />
      </span>
    </button>
  )
}
