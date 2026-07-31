'use client'

// Home visit, step 2 of 3 — Tagih.
//
// Who was met is already answered on Persiapan, and "nobody home" never reaches
// this step — a locked door has nothing to tagih, so that branch takes its note
// on Persiapan and skips straight to Bukti & Kirim. This page is only ever shown
// when the mitra or her PJ was there, so it opens straight on the money.
//
// Mitra and PJ take the SAME outcome controls. Whether the money came from her
// or from her husband does not change what gets recorded — the amount and the
// promise — so who handed it over is a tag, not a branch.
//
// Everything is ON THE PAGE, not in a sheet — the opposite of this direction's
// majelis collect step, and deliberately so. The majelis flow opens a full page
// per mitra because it is working a queue of 22 and the screen behind it has to
// stay scannable. A home visit is ONE mitra: there is no queue to protect, so
// the page can simply grow, and every answer writes straight to the record.
// There is no "Simpan" — with the options inline, what is on screen IS the
// record, and a save button would imply the page might not be keeping up.
//
// What is gone: the growth stage. A home visit happens BECAUSE a mitra is far
// behind, so there is nothing to upsell at that door.

import { useState } from 'react'
import { BottomSheet, Button, InputNominal, NavigationHeader } from '@/design-system/components'
import { Image as ImageIcon } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { outstandingOf, rupiah } from '../lib/data'
import { AngsuranCard, JanjiBayarCard } from '../lib/mitra-card'
import { DAYS } from '../lib/schedule'
import { openHomeMitra, openHomeTask, paidOf, store, useApp } from '../lib/store'
import {
  ChoiceList,
  HOME_STAGE_LABELS,
  PickRow,
  ProductBadge,
  ProofTile,
  SectionTitle,
  StageBar,
  StickyBar,
} from '../lib/ui'
import {
  DROPOUT_REASONS,
  PTP_OPTIONS,
  REASONS,
  SHORTFALL_REASONS,
  ptpLabelOf,
  ptpValueOf,
} from '../lib/collect-options'

export function HomeVisitScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)
  const task = openHomeTask(s)

  const met = s.metWith[mitra.id]
  const refusal = s.nonPayments[mitra.id]
  const paid = paidOf(s, mitra)
  const owed = outstandingOf(mitra)

  const mode = s.payMode[mitra.id]
  const dropReason = s.dropOut[mitra.id]

  // --- The outcome, the same shape as the majelis collect page: a radio list
  // over ONE stepped sheet. `bayar` covers Lunas (seeded with the full bill) and
  // Bayar Sebagian (seeded blank); tanggung, tidak and keluar are their own.
  // Answers live in local draft state and are written on save, so closing a
  // sheet abandons an unfinished outcome rather than half-recording it.
  type Sheet = 'bayar' | 'poket' | 'tanggung' | 'tidak' | 'keluar'
  type Pick = 'lunas' | 'sebagian' | 'poket' | 'tanggung' | 'tidak' | 'keluar'

  // What is already on file, read back as the row that produced it.
  const recorded: Pick | null =
    mode === 'penuh'
      ? 'lunas'
      : mode === 'sebagian' || mode === 'poket' || mode === 'tanggung' || mode === 'tidak'
        ? mode
        : mode === 'keluar'
          ? 'keluar'
          : null
  const [pick, setPick] = useState<Pick | null>(recorded)
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [draft, setDraft] = useState(String(paid > 0 ? paid : ''))
  const [reason, setReason] = useState<string | null>(refusal?.reason ?? null)
  const [shortReason, setShortReason] = useState<string | null>(s.shortfallReasons[mitra.id] ?? null)
  const [ptp, setPtp] = useState<string | null | undefined>(
    refusal ? refusal.ptp : (s.partialPtp[mitra.id] ?? undefined),
  )
  const [drop, setDrop] = useState<string | null>(dropReason ?? null)
  // The Poket screenshot, held locally and written on save like every other
  // answer in this sheet.
  const [proofDraft, setProofDraft] = useState(Boolean(s.poketProof[mitra.id]))

  const typed = Number(draft.replace(/\D/g, '')) || 0
  // Short is a fact about the FIGURE, not which row was tapped: anything under
  // the bill leaves a balance, whether it was cash taken short or a Poket
  // payment that never covered it.
  const short = (sheet === 'bayar' || sheet === 'poket') && typed > 0 && typed < owed.total
  const hasPtpStep = sheet === 'tidak' || short
  const onLastStep = !hasPtpStep || step === 2

  const step1Done =
    sheet === 'bayar'
      ? typed > 0 && (!short || shortReason !== null)
      : sheet === 'poket'
        ? typed > 0 && proofDraft && (!short || shortReason !== null)
        : sheet === 'tidak'
          ? reason !== null
          : sheet === 'keluar'
            ? drop !== null
            : sheet === 'tanggung'
              ? true
              : false
  const canAdvance = step === 1 ? step1Done : ptp !== undefined
  const canSave = onLastStep && step1Done && (!hasPtpStep || ptp !== undefined)

  function openSheet(next: Sheet, seed?: number) {
    setSheet(next)
    setStep(1)
    if (next === 'bayar') setDraft(seed !== undefined ? String(seed) : '')
    // Poket opens on the full bill — she pays what she has through the app, and
    // a blank field would make the BP type money that was never paid.
    if (next === 'poket') {
      setDraft(seed !== undefined ? String(seed) : String(owed.total))
      setProofDraft(Boolean(s.poketProof[mitra.id]))
    }
  }
  function closeSheet() {
    setSheet(null)
    setStep(1)
  }

  function save() {
    if (!canSave || sheet === null) return
    if (sheet === 'bayar') {
      store.collect(mitra, typed, short ? (shortReason as string) : undefined)
      store.setPartialPtp(mitra.id, short ? (ptp ?? null) : null)
      store.setPayMode(mitra.id, typed >= owed.total ? 'penuh' : 'sebagian')
      store.clearDropOut(mitra.id)
    } else if (sheet === 'poket') {
      store.recordPoket(mitra, typed, short ? (shortReason as string) : undefined)
      store.setPoketProof(mitra.id, proofDraft)
      store.setPartialPtp(mitra.id, short ? (ptp ?? null) : null)
      store.clearDropOut(mitra.id)
    } else if (sheet === 'tanggung') {
      store.collect(mitra, owed.total)
      store.setPayMode(mitra.id, 'tanggung')
      store.clearDropOut(mitra.id)
    } else if (sheet === 'tidak') {
      store.setNonPayment(mitra, { reason: reason as string, ptp: ptp ?? null })
      store.setPayMode(mitra.id, 'tidak')
      store.clearDropOut(mitra.id)
    } else if (sheet === 'keluar') {
      store.setDropOut(mitra, drop as string)
      store.setPayMode(mitra.id, 'keluar')
    }
    closeSheet()
    // The sheet carries the visit on rather than dropping the BP back on a page
    // whose only remaining button says the same thing she just said.
    flow.go('home-proof')
  }

  /**
   * Lanjut. A "Lunas" needs nothing else said about it — the figure is the bill,
   * the payer is her, and there is no reason or promise behind a settled
   * account — so it records straight from the page. Every other pick has one
   * question left, and that question is the sheet.
   */
  function confirmPick() {
    if (pick === null) return
    if (pick === 'lunas') {
      store.collect(mitra, owed.total)
      store.setPartialPtp(mitra.id, null)
      store.setPayMode(mitra.id, 'penuh')
      store.clearDropOut(mitra.id)
      flow.go('home-proof')
      return
    }
    if (pick === 'sebagian') openSheet('bayar', paid > 0 ? paid : undefined)
    else if (pick === 'poket') openSheet('poket', paid > 0 ? paid : undefined)
    else openSheet(pick)
  }

  return (
    <Screen
      className="bg-neutral-white"
      topBar={
        <NavigationHeader
          title={
            <span className="flex min-w-0 flex-col">
              <span className="flex min-w-0 items-center gap-8">
                <span className="min-w-0 truncate text-16 font-bold text-default">
                  {mitra.name}
                </span>
                <span className="shrink-0">
                  <ProductBadge product={mitra.product} />
                </span>
              </span>
              <span className="text-12 font-regular text-caption">
                Home visit · Selasa, {task?.time ?? '—'}
              </span>
            </span>
          }
          onBack={() => flow.back()}
        />
      }
    >
      <StageBar current={2} labels={HOME_STAGE_LABELS} />

      {/* The top bar already carries who she is, so this page opens straight on
          what she has been paying and what she owes — the week grid and the bill
          as one flat block. "Lihat semua" opens her mitra page, where the full
          ledger lives; it seeds the mitra that page reads before navigating. */}
      <AngsuranCard
        mitra={mitra}
        flat
        onSeeAll={() => {
          store.openMitraPage(mitra.id)
          flow.go('mitra')
        }}
      />

      {/* A hairline sets the promise apart from the bill above it — the total
          and the janji are two facts, not one running block. */}
      <div className="border-t border-default" />

      <JanjiBayarCard mitra={mitra} date={DAYS[0].date} flat />

      {/* --- The outcome, on a grey floor: the same radio list, the same words
          and the same Kembali/Lanjut footer as the majelis collect page. One
          question asked one way, whether she is standing in a balai or at a
          door. The picked row keeps a one-line recap of what was recorded. */}
      {met ? (
        <div
          role="radiogroup"
          aria-label="Berapa yang dibayar"
          className="-mx-16 flex flex-1 flex-col gap-12 border-t border-default bg-neutral-50 px-16 pb-16 pt-16"
        >
          <SectionTitle>Berapa yang dibayar?</SectionTitle>
          <div className="flex flex-col gap-8">
            <PickRow
              title="Lunas"
              description={rupiah(owed.total)}
              detail={mode === 'penuh' ? `Diterima ${rupiah(paid)}` : null}
              selected={pick === 'lunas'}
              onSelect={() => setPick('lunas')}
            />
            <PickRow
              title="Bayar sebagian"
              detail={
                mode === 'sebagian'
                  ? `${rupiah(paid)} diterima · sisa ${rupiah(Math.max(0, owed.total - paid))}`
                  : null
              }
              selected={pick === 'sebagian'}
              onSelect={() => setPick('sebagian')}
            />
            {/* Not a payment she is taking — one she is catching up with: the
                mitra paid through Poket days ago and the system has not updated,
                which happens often enough that without this row the BP either
                books cash she never received or leaves her owing money she has
                already handed over. */}
            <PickRow
              title="Bayar via Poket"
              detail={
                mode === 'poket' && paid > 0
                  ? `Via Poket · ${rupiah(paid)}${
                      paid < owed.total ? ` · sisa ${rupiah(owed.total - paid)}` : ''
                    }`
                  : null
              }
              selected={pick === 'poket'}
              onSelect={() => setPick('poket')}
            />
            {/* GL only: joint liability is what the G in GL is. A Modal loan is
                hers alone, so offering the group as a payer on her door would
                record a settlement no group ever agreed to. */}
            {mitra.product === 'GL' ? (
              <PickRow
                title="Tanggung renteng"
                detail={mode === 'tanggung' ? `Ditanggung kelompok · ${rupiah(owed.total)}` : null}
                selected={pick === 'tanggung'}
                onSelect={() => setPick('tanggung')}
              />
            ) : null}
            <PickRow
              title="Tidak bayar"
              detail={
                mode === 'tidak' && refusal?.reason
                  ? `${refusal.reason}${
                      refusal.ptp !== undefined && ptpLabelOf(refusal.ptp)
                        ? ` · ${ptpLabelOf(refusal.ptp)}`
                        : ''
                    }`
                  : null
              }
              selected={pick === 'tidak'}
              onSelect={() => setPick('tidak')}
            />
            <PickRow
              title="Berhenti"
              detail={mode === 'keluar' && dropReason ? dropReason : null}
              selected={pick === 'keluar'}
              onSelect={() => setPick('keluar')}
            />
          </div>
        </div>
      ) : null}

      {/* The follow-up sheet — amount then janji for a payment, reason then janji
          for a refusal, a reason for a drop-out, a confirmation for tanggung. */}
      <BottomSheet
        open={sheet !== null}
        onClose={closeSheet}
        onBack={step === 2 ? () => setStep(1) : undefined}
        size="md"
        title={
          sheet === null
            ? undefined
            : step === 2
              ? 'Janji Bayar'
              : sheet === 'tidak'
                ? 'Alasan Tidak Bayar'
                : sheet === 'keluar'
                  ? 'Alasan Drop Out'
                  : sheet === 'tanggung'
                    ? 'Tanggung Renteng'
                    : sheet === 'poket'
                      ? 'Sudah Bayar via Poket'
                      : undefined
        }
        primaryAction={
          // The sheet carries the Lanjut: a middle step advances to the janji,
          // the last step records the outcome and moves straight to Bukti & Kirim
          // — no trip back to the page for a second button.
          <Button
            size="lg"
            className="w-full"
            disabled={!canAdvance}
            onClick={() => {
              if (!onLastStep) {
                setStep(2)
                return
              }
              save()
              flow.go('home-proof')
            }}
          >
            Lanjut
          </Button>
        }
      >
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
                value={shortReason ?? undefined}
                onPick={setShortReason}
              />
            ) : null}
          </>
        ) : null}

        {sheet === 'poket' && step === 1 ? (
          <div className="flex flex-col gap-16">
            <InputNominal
              label="Jumlah dibayar via Poket"
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
            <div className="flex flex-col gap-8">
              <SectionTitle>Bukti pembayaran</SectionTitle>
              <div className="flex">
                <ProofTile
                  done={proofDraft}
                  label="Unggah bukti"
                  doneLabel="Bukti terlampir"
                  icon={<ImageIcon size={24} />}
                  onClick={() => setProofDraft((v) => !v)}
                />
              </div>
              <span className="text-12 text-caption">
                Pembayaran sudah masuk tapi belum tercatat di sistem.
              </span>
            </div>
            {short ? (
              <ChoiceList
                label="Alasan kurang bayar"
                options={SHORTFALL_REASONS}
                value={shortReason ?? undefined}
                onPick={setShortReason}
              />
            ) : null}
          </div>
        ) : null}

        {sheet === 'tanggung' ? (
          <div className="flex flex-col gap-4">
            <span className="text-12 text-caption">Ditanggung kelompok</span>
            <span className="text-24 font-bold text-default">{rupiah(owed.total)}</span>
            <span className="text-14 text-caption">
              Tanggung renteng menutup seluruh tagihan {mitra.name} hari ini.
            </span>
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

        {sheet === 'keluar' ? (
          <ChoiceList
            hideLabel
            label="Alasan drop out"
            options={DROPOUT_REASONS}
            value={drop ?? undefined}
            onPick={setDrop}
          />
        ) : null}

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

      <StickyBar>
        <div className="flex gap-12">
          <Button size="lg" variant="secondary" className="flex-1" onClick={() => flow.back()}>
            Kembali
          </Button>
          <Button size="lg" className="flex-1" disabled={pick === null} onClick={confirmPick}>
            Lanjut
          </Button>
        </div>
      </StickyBar>
    </Screen>
  )
}
