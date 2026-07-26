'use client'

// Tagih Pembayaran — the collect menu.
//
// The page is two levels, told apart by ground rather than by a rule. The top,
// on white, is who she is over what she owes — identity, history and bill read
// as one flat block. The bottom, on the lightest grey, is the choice: the four
// ways she can pay.
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

import { useState } from 'react'
import { BottomSheet, Button, Input, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMitra, outstandingOf, rupiah } from '../lib/data'
import { paidOf, store, useApp } from '../lib/store'
import { AngsuranCard, DpdBadge, MitraCard } from '../lib/mitra-card'
import { ChoiceList, ProductBadge, SectionTitle } from '../lib/ui'
import { IconChevronRight } from '../lib/icons'
import {
  PTP_OPTIONS,
  REASONS,
  SHORTFALL_REASONS,
  ptpLabelOf,
  ptpValueOf,
} from '../lib/collect-options'

type Mode = 'penuh' | 'cicil' | 'lain' | 'tidak'

const TITLES: Record<Mode, string> = {
  penuh: 'Bayar Penuh',
  cicil: 'Bayar Minggu Ini',
  lain: 'Jumlah Lain',
  tidak: 'Tidak Bayar',
}

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
  const [sheet, setSheet] = useState<Mode | null>(
    refusal ? 'tidak' : existing >= owed.total && existing > 0 ? 'penuh' : existing > 0 ? 'lain' : null,
  )

  const [draft, setDraft] = useState(String(existing > 0 && existing < owed.total ? existing : ''))
  const [reason, setReason] = useState<string | null>(refusal?.reason ?? null)
  const [shortfall, setShortfall] = useState<string | null>(s.shortfallReasons[mitra.id] ?? null)
  const [ptp, setPtp] = useState<string | null | undefined>(
    refusal ? refusal.ptp : (s.partialPtp[mitra.id] ?? undefined),
  )

  const typed = Number(draft.replace(/\D/g, '')) || 0
  // A "jumlah lain" is short when it lands under the bill; "minggu ini saja" on a
  // mitra with arrears is always short by the arrears.
  const short = sheet === 'lain' ? typed > 0 && typed < owed.total : sheet === 'cicil'

  const canSave =
    sheet === 'penuh'
      ? true
      : sheet === 'tidak'
        ? reason !== null && ptp !== undefined
        : sheet === 'cicil'
          ? shortfall !== null && ptp !== undefined
          : sheet === 'lain'
            ? typed > 0 && (!short || (shortfall !== null && ptp !== undefined))
            : false

  function save() {
    if (!canSave || sheet === null) return
    if (sheet === 'tidak') {
      store.setNonPayment(mitra, { reason: reason as string, ptp: ptp ?? null })
    } else {
      const amount = sheet === 'penuh' ? owed.total : sheet === 'cicil' ? owed.thisWeek : typed
      store.collect(mitra, amount, short ? (shortfall as string) : undefined)
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
          <NavRow title="Bayar penuh" amount={rupiah(owed.total)} onOpen={() => setSheet('penuh')} />

          {hasArrears ? (
            <NavRow
              title="Minggu ini saja"
              amount={rupiah(owed.thisWeek)}
              onOpen={() => setSheet('cicil')}
            />
          ) : null}

          <NavRow title="Jumlah lain" onOpen={() => setSheet('lain')} />
          <NavRow title="Tidak bayar" onOpen={() => setSheet('tidak')} />
        </div>
      </div>

      <BottomSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        size={sheet === 'penuh' ? 'sm' : 'md'}
        title={sheet ? TITLES[sheet] : undefined}
        description={
          sheet === 'penuh' ? 'Terima seluruh tagihan Ibu secara tunai.' : undefined
        }
        primaryAction={
          <Button size="lg" className="w-full" disabled={!canSave} onClick={save}>
            {sheet === 'tidak' ? 'Simpan Catatan' : 'Terima Tunai'}
          </Button>
        }
      >
        {sheet === 'lain' ? (
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
        ) : null}

        {/* The two questions a shortfall cannot be recorded without, shown for a
            part-payment (cicil, or a short jumlah lain) — asking them before an
            amount is even typed would be a question about nothing. */}
        {sheet === 'cicil' || (sheet === 'lain' && short) ? (
          <>
            <ChoiceList
              label="Alasan kurang bayar"
              options={SHORTFALL_REASONS}
              value={shortfall ?? undefined}
              onPick={setShortfall}
            />
            <ChoiceList
              label="Janji bayar sisanya"
              options={PTP_OPTIONS.map((o) => o.label)}
              value={ptpLabelOf(ptp)}
              onPick={(label) => setPtp(ptpValueOf(label))}
            />
          </>
        ) : null}

        {sheet === 'tidak' ? (
          <>
            <ChoiceList
              label="Alasan tidak bayar"
              options={REASONS}
              value={reason ?? undefined}
              onPick={setReason}
            />
            <ChoiceList
              label="Janji bayar"
              options={PTP_OPTIONS.map((o) => o.label)}
              value={ptpLabelOf(ptp)}
              onPick={(label) => setPtp(ptpValueOf(label))}
            />
          </>
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
