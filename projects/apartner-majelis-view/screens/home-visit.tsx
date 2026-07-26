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
// The bill and her standing promise sit flat on white up top; the payment
// outcome is the one selection, on a grey panel below. Picking "Bayar sebagian"
// or "Tidak bayar" opens the follow-up in a bottom sheet — the amount and the
// janji, or the reason and the janji — the same move Persiapan makes, so the
// page stays a clean choice rather than growing a form under each option. Bayar
// Penuh needs no follow-up. The chosen row carries a one-line recap.
//
// What is gone: the growth stage. A home visit happens BECAUSE a mitra is far
// behind, so there is nothing to upsell at that door.

import { useState } from 'react'
import { BottomSheet, Button, Input, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { outstandingOf, rupiah } from '../lib/data'
import { AngsuranCard, JanjiBayarCard } from '../lib/mitra-card'
import { DAYS } from '../lib/schedule'
import { openHomeMitra, openHomeTask, paidOf, store, useApp } from '../lib/store'
import { HOME_STAGE_LABELS, SectionTitle, SelectList, StageBar, StickyBar } from '../lib/ui'

type PayMode = 'penuh' | 'sebagian' | 'tidak'

const MODES: { value: PayMode; title: string; description: string }[] = [
  { value: 'penuh', title: 'Bayar Penuh', description: 'Terima seluruh tagihan' },
  { value: 'sebagian', title: 'Bayar Sebagian', description: 'Terima sebagian, sisanya dijanjikan' },
  { value: 'tidak', title: 'Tidak Bayar', description: 'Catat alasan dan janji bayar' },
]

// Why she can't pay, when someone was reached.
const PAY_REASONS = [
  'Usaha sedang sepi',
  'Ada kebutuhan mendesak',
  'Sakit / keluarga sakit',
  'Menolak bayar',
]

const PTP_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Besok, 22 Juli', value: '22 Juli' },
  { label: 'Lusa, 23 Juli', value: '23 Juli' },
  { label: 'Minggu depan, 28 Juli', value: '28 Juli' },
  { label: 'Tidak ada janji', value: null },
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
  const shortfall = owed.total - paid

  // The follow-up opens in a sheet the moment she picks sebagian or tidak.
  const [sheetOpen, setSheetOpen] = useState(false)

  const ptpLabel = (v: string | null | undefined) =>
    v === undefined ? null : (PTP_OPTIONS.find((o) => o.value === v)?.label ?? null)

  function pick(next: PayMode) {
    store.setPayMode(mitra.id, next)
    if (next === 'penuh') store.collect(mitra, owed.total)
    if (next === 'tidak') store.setNonPayment(mitra, { reason: refusal?.reason ?? '', ptp: null })
    // Bayar Penuh is complete on its own; the other two need the sheet.
    setSheetOpen(next !== 'penuh')
  }

  function pickReason(value: string) {
    store.setNonPayment(mitra, { reason: value, ptp: refusal?.ptp ?? null })
  }

  function pickPtp(value: string | null) {
    store.setNonPayment(mitra, { reason: refusal?.reason ?? '', ptp: value })
  }

  // The one-line recap printed on the chosen row.
  function summaryFor(m: PayMode): string | null {
    if (m !== mode) return null
    if (m === 'penuh') return `Lunas · ${rupiah(owed.total)}`
    if (m === 'sebagian') {
      if (paid <= 0) return null
      return shortfall > 0
        ? `${rupiah(paid)} diterima · sisa ${rupiah(shortfall)}`
        : `${rupiah(paid)} diterima`
    }
    if (!refusal?.reason) return null
    const rev = ptpLabel(refusal.ptp)
    return rev ? `${refusal.reason} · ${rev}` : refusal.reason
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

      {/* The bill and the promise she is being held to — one flat info block on
          white, a hairline between them, cards saved for the selection below. */}
      <div className="flex flex-col gap-12">
        <AngsuranCard mitra={mitra} flat />
        <div className="border-t border-default" />
        <JanjiBayarCard mitra={mitra} date={DAYS[0].date} flat />
      </div>

      {/* --- The outcome: one selection on a grey panel that bleeds to the edges
          and grows to fill. Picking sebagian or tidak opens the follow-up in a
          sheet; the chosen row keeps a one-line recap. */}
      {met ? (
        <section className="-mx-16 flex flex-1 flex-col gap-8 bg-neutral-50 px-16 py-16">
          <SectionTitle>Pembayaran</SectionTitle>
          <div className="flex flex-col gap-8">
            {MODES.map((m) => {
              const selected = mode === m.value
              const summary = summaryFor(m.value)
              return (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => pick(m.value)}
                  className={`rounded-12 border p-16 text-left ${
                    selected ? 'border-primary-500 bg-primary-50' : 'border-default bg-neutral-white'
                  }`}
                >
                  <div className="text-14 font-bold text-default">{m.title}</div>
                  <div className="mt-2 text-12 text-caption">
                    {m.value === 'penuh' ? rupiah(owed.total) : m.description}
                  </div>
                  {summary ? (
                    <div className="mt-8 border-t border-primary-200 pt-8 text-12 text-primary-500">
                      {summary}
                    </div>
                  ) : null}
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!met} onClick={() => flow.go('home-proof')}>
          Lanjut
        </Button>
      </StickyBar>

      {/* --- The follow-up, in a sheet. Sebagian asks the amount and a date for
          the balance; tidak asks why and when she promises to. --------------- */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={mode === 'sebagian' ? 'Bayar sebagian' : 'Tidak bayar'}
      >
        <div className="flex flex-col gap-16">
          {mode === 'sebagian' ? (
            <>
              <Input
                label="Jumlah diterima"
                prefix="Rp"
                inputMode="numeric"
                value={paid > 0 ? String(paid) : ''}
                onChange={(e) =>
                  store.collect(mitra, Number(e.target.value.replace(/\D/g, '')) || 0)
                }
                helperText={
                  paid === 0
                    ? 'Masukkan jumlah yang diterima'
                    : shortfall > 0
                      ? `Sisa ${rupiah(shortfall)} — buat janji bayar untuk sisanya.`
                      : shortfall < 0
                        ? `Lebih ${rupiah(-shortfall)} dari tagihan`
                        : 'Sama dengan tagihan penuh'
                }
                state={paid > 0 && shortfall <= 0 ? 'valid' : 'default'}
              />

              {paid > 0 && shortfall > 0 ? (
                <SelectList
                  label="Janji bayar sisanya"
                  items={PTP_OPTIONS.map((option) => ({
                    key: option.label,
                    label: option.label,
                    selected:
                      s.partialPtp[mitra.id] !== undefined &&
                      s.partialPtp[mitra.id] === option.value,
                    onClick: () => store.setPartialPtp(mitra.id, option.value),
                  }))}
                />
              ) : null}
            </>
          ) : null}

          {mode === 'tidak' ? (
            <>
              <SelectList
                label="Alasan belum bayar"
                items={PAY_REASONS.map((option) => ({
                  key: option,
                  label: option,
                  selected: refusal?.reason === option,
                  onClick: () => pickReason(option),
                }))}
              />

              {refusal?.reason ? (
                <SelectList
                  label="Janji bayar"
                  items={PTP_OPTIONS.map((option) => ({
                    key: option.label,
                    label: option.label,
                    selected: refusal.ptp === option.value,
                    onClick: () => pickPtp(option.value),
                  }))}
                />
              ) : null}
            </>
          ) : null}

          <Button size="lg" className="w-full" onClick={() => setSheetOpen(false)}>
            Simpan
          </Button>
        </div>
      </BottomSheet>
    </Screen>
  )
}
