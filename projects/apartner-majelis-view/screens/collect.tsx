'use client'

// Tagih Pembayaran — the collect page.
//
// The reference puts a "Total to Collect" breakdown at the top of this screen
// and then repeats the same total above the CTA. The top block is dropped here
// on the designer's call: it is the third time the BP has seen that breakdown in
// two taps (her card, then her page), and the only version that earns its place
// is the one that MOVES — the summary above the button, which re-answers "so
// what is left?" every time she touches an option.
//
// So the page is two things and nothing else: the choice, and its consequence.
//
// The consequence is pinned rather than placed. It sits inside the sticky footer
// with the button, because a "sisa setelah ini" that scrolled away from the
// action it qualifies would be a number the BP reads once and then commits
// blind. This is also why the amount field lives above it rather than beside it:
// as she types, the figure she is about to be held to updates in her eyeline.
//
// "Tidak Bayar" is the fourth option, and it is not in the reference at all.
// The reference's three choices are all payments, which leaves a mitra who hands
// over nothing with no way to be recorded — she simply stays in the queue, and
// the queue never reaches zero. A no with a reason and a date is a RESULT: the
// BP can close it and ops can chase it. Leaving it unrecorded is exactly what
// pushes DPD work onto a spreadsheet outside the app.

import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Input,
  NavigationHeader,
  SelectableCard,
} from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMitra, outstandingOf, rupiah } from '../lib/data'
import { paidOf, store, useApp } from '../lib/store'
import { Avatar, Chip, ChipGroup, SectionTitle, StickyBar } from '../lib/ui'

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

  // When she is current, "bayar penuh" and "minggu ini saja" collect the same
  // money. Showing both would be a choice with no difference behind it.
  const hasArrears = owed.total > owed.thisWeek

  const typed = Number(draft.replace(/\D/g, '')) || 0
  const amount = mode === 'penuh' ? owed.total : mode === 'minggu' ? owed.thisWeek : mode === 'lain' ? typed : 0
  const after = Math.max(0, owed.total - amount)

  const canSave = mode === 'tidak' ? reason !== null : amount > 0

  function save() {
    if (!canSave) return
    if (mode === 'tidak') {
      store.setNonPayment(mitra, { reason: reason as string, ptp: ptp ?? null })
      flow.go('collection')
      return
    }
    store.collect(mitra, amount)
    flow.go('collect-done')
  }

  return (
    <Screen topBar={<NavigationHeader title="Tagih Pembayaran" onBack={() => flow.back()} />}>
      {/* Who she is, compactly. She was chosen two screens ago and the BP should
          not have to trust the numbers below on memory alone. */}
      <Card>
        <div className="flex items-center gap-12">
          <Avatar name={mitra.name} size={32} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-14 font-bold text-default">{mitra.name}</span>
            <span className="truncate text-12 text-caption">Pinjaman {rupiah(mitra.loan)}</span>
          </div>
          {mitra.dpd > 0 ? (
            <Badge intent={mitra.dpd >= 30 ? 'red' : 'orange'}>Menunggak {mitra.dpd} hari</Badge>
          ) : (
            <Badge intent="green">Lancar</Badge>
          )}
        </div>
      </Card>

      <SectionTitle>Bagaimana Ibu membayar?</SectionTitle>

      <div className="flex flex-col gap-8">
        <SelectableCard
          name="mode-tagih"
          inputType="radio"
          title="Bayar penuh"
          description={rupiah(owed.total)}
          checked={mode === 'penuh'}
          onChange={() => setMode('penuh')}
        />
        {hasArrears ? (
          <SelectableCard
            name="mode-tagih"
            inputType="radio"
            title="Minggu ini saja"
            description={rupiah(owed.thisWeek)}
            checked={mode === 'minggu'}
            onChange={() => setMode('minggu')}
          />
        ) : null}
        <SelectableCard
          name="mode-tagih"
          inputType="radio"
          title="Jumlah lain"
          description="Masukkan nominal yang diterima"
          checked={mode === 'lain'}
          onChange={() => setMode('lain')}
        />
        <SelectableCard
          name="mode-tagih"
          inputType="radio"
          title="Tidak bayar"
          description="Catat alasan dan janji bayar"
          checked={mode === 'tidak'}
          onChange={() => setMode('tidak')}
        />
      </div>

      {mode === 'lain' ? (
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

      {mode === 'tidak' ? (
        <div className="flex flex-col gap-12 pb-16">
          <ChipGroup label="Alasan">
            {REASONS.map((option) => (
              <Chip key={option} selected={reason === option} onClick={() => setReason(option)}>
                {option}
              </Chip>
            ))}
          </ChipGroup>
          <ChipGroup label="Janji bayar">
            {PTP_OPTIONS.map((option) => (
              <Chip
                key={option.label}
                selected={ptp !== undefined && ptp === option.value}
                onClick={() => setPtp(option.value)}
              >
                {option.label}
              </Chip>
            ))}
          </ChipGroup>
        </div>
      ) : null}

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
