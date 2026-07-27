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
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { outstandingOf, rupiah } from '../lib/data'
import { AngsuranCard, DpdBadge, JanjiBayarCard, MitraCard } from '../lib/mitra-card'
import { DAYS } from '../lib/schedule'
import { openHomeMitra, openHomeTask, paidOf, store, useApp } from '../lib/store'
import {
  ChoiceList,
  HOME_STAGE_LABELS,
  ProductBadge,
  SectionTitle,
  StageBar,
  StickyBar,
} from '../lib/ui'
import { IconChevronRight } from '../lib/icons'
import {
  PTP_OPTIONS,
  REASONS,
  SHORTFALL_REASONS,
  ptpLabelOf,
  ptpValueOf,
} from '../lib/collect-options'

// Why she is leaving the program. "Meninggal" and "pindah tanpa kabar" are the
// two that open a case ops has to pick up rather than a promise to chase — which
// is the whole reason a drop-out is its own outcome and not a heavier "tidak".
const DROPOUT_REASONS = [
  'Usaha bangkrut',
  'Pindah tanpa kabar',
  'Menolak melanjutkan',
  'Meninggal dunia',
]

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

  // The Lanjut gate: a picked outcome must be COMPLETE before the visit moves
  // on. Penuh and tanggung renteng settle on their own; the other three each
  // carry a follow-up the record isn't whole without.
  const outcomeDone =
    mode === 'penuh' || mode === 'tanggung'
      ? true
      : mode === 'sebagian'
        ? paid > 0
        : mode === 'tidak'
          ? Boolean(refusal?.reason)
          : mode === 'keluar'
            ? Boolean(dropReason)
            : false

  // --- The outcome, the same shape as the majelis collect page: a menu of rows,
  // each opening ONE stepped sheet. `bayar` covers Bayar Penuh (seeded with the
  // full bill) and Bayar Sebagian (seeded blank); tanggung, tidak and keluar are
  // their own. Answers live in local draft state and are written on save, so
  // closing a sheet abandons an unfinished outcome rather than half-recording it.
  type Sheet = 'bayar' | 'tanggung' | 'tidak' | 'keluar'
  const [sheet, setSheet] = useState<Sheet | null>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [draft, setDraft] = useState(String(paid > 0 ? paid : ''))
  const [reason, setReason] = useState<string | null>(refusal?.reason ?? null)
  const [shortReason, setShortReason] = useState<string | null>(s.shortfallReasons[mitra.id] ?? null)
  const [ptp, setPtp] = useState<string | null | undefined>(
    refusal ? refusal.ptp : (s.partialPtp[mitra.id] ?? undefined),
  )
  const [drop, setDrop] = useState<string | null>(dropReason ?? null)

  const typed = Number(draft.replace(/\D/g, '')) || 0
  // Short is a fact about the FIGURE, not which row was tapped: anything under
  // the bill leaves a balance, whether edited down from the full amount or typed.
  const short = sheet === 'bayar' && typed > 0 && typed < owed.total
  const hasPtpStep = sheet === 'tidak' || short
  const onLastStep = !hasPtpStep || step === 2

  const step1Done =
    sheet === 'bayar'
      ? typed > 0 && (!short || shortReason !== null)
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
  }

  return (
    <Screen
      className="bg-neutral-white"
      topBar={
        <NavigationHeader
          title={
            <span className="flex flex-col">
              <span className="text-16 font-bold text-default">{mitra.name}</span>
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

      {/* Who she is, what she has been paying, and what she owes — one flat block
          with no cards, the same as the majelis collect header. The week grid's
          grey fill carries the one edge that remains; the promise sits under it,
          also flat. */}
      <MitraCard
        mitra={mitra}
        flat
        meta={null}
        labels={
          <>
            <ProductBadge product={mitra.product} />
            <DpdBadge dpd={mitra.dpd} format="short" />
          </>
        }
        onOpen={() => {
          store.openMitraPage(mitra.id)
          flow.go('mitra')
        }}
      />

      <AngsuranCard mitra={mitra} flat />

      {/* A hairline sets the promise apart from the bill above it — the total
          and the janji are two facts, not one running block. */}
      <div className="border-t border-default" />

      <JanjiBayarCard mitra={mitra} date={DAYS[0].date} flat />

      {/* --- The outcome: a menu of rows on a grey floor, each opening the sheet
          — the same shape as the majelis collect page. The chosen row keeps a
          one-line recap of what was recorded. */}
      {met ? (
        <div
          role="radiogroup"
          aria-label="Pembayaran"
          className="-mx-16 flex flex-1 flex-col gap-12 border-t border-default bg-neutral-50 px-16 pb-16 pt-16"
        >
          <SectionTitle>Bagaimana Ibu membayar?</SectionTitle>
          <div className="flex flex-col gap-8">
            {/* Full payment needs no figure and no reason, so it records on the
                tap and lets the page Lanjut carry the visit on — the same instant
                path as "Mitra sendiri" on Persiapan. */}
            <PayRow
              title="Bayar Penuh"
              amount={rupiah(owed.total)}
              recap={mode === 'penuh' ? `Lunas · ${rupiah(paid)}` : null}
              instant
              onOpen={() => {
                store.collect(mitra, owed.total)
                store.setPayMode(mitra.id, 'penuh')
                store.clearDropOut(mitra.id)
              }}
            />
            <PayRow
              title="Bayar Sebagian"
              recap={
                mode === 'sebagian'
                  ? `${rupiah(paid)} diterima · sisa ${rupiah(Math.max(0, owed.total - paid))}`
                  : null
              }
              onOpen={() => openSheet('bayar', paid > 0 ? paid : undefined)}
            />
            <PayRow
              title="Tanggung Renteng"
              recap={mode === 'tanggung' ? `Ditanggung kelompok · ${rupiah(owed.total)}` : null}
              onOpen={() => openSheet('tanggung')}
            />
            <PayRow
              title="Tidak Bayar"
              recap={
                mode === 'tidak' && refusal?.reason
                  ? `${refusal.reason}${
                      refusal.ptp !== undefined && ptpLabelOf(refusal.ptp)
                        ? ` · ${ptpLabelOf(refusal.ptp)}`
                        : ''
                    }`
                  : null
              }
              onOpen={() => openSheet('tidak')}
            />
            <PayRow
              title="Drop Out"
              recap={mode === 'keluar' && dropReason ? dropReason : null}
              onOpen={() => openSheet('keluar')}
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
        <Button
          size="lg"
          className="w-full"
          disabled={!outcomeDone}
          onClick={() => flow.go('home-proof')}
        >
          Lanjut
        </Button>
      </StickyBar>
    </Screen>
  )
}

/**
 * One outcome, as a row that opens the sheet — the collect page's NavRow with a
 * recap line. The chosen outcome carries the brand tint and its one-line summary;
 * the rest stay plain, with the full-bill figure shown on Bayar Penuh until it
 * is recorded.
 */
function PayRow({
  title,
  amount,
  recap,
  instant,
  onOpen,
}: {
  title: string
  amount?: string
  recap?: string | null
  /** Records on the tap rather than opening a sheet — no chevron. */
  instant?: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex items-center gap-12 rounded-8 border p-16 text-left ${
        recap ? 'border-primary-500 bg-primary-50' : 'border-default bg-neutral-white'
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-16 text-default">{title}</span>
        {recap ? <span className="text-12 text-primary-500">{recap}</span> : null}
      </span>
      {amount && !recap ? (
        <span className="shrink-0 text-16 font-bold text-default">{amount}</span>
      ) : null}
      {!instant ? (
        <span className="shrink-0 text-disabled">
          <IconChevronRight size={20} />
        </span>
      ) : null}
    </button>
  )
}
