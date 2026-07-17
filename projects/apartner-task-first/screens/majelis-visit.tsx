'use client'

// Step 1 of 3 — Kehadiran & Pembayaran.
//
// The collection queue: one count at the top that is a countdown to zero, and
// one card per mitra nobody has dealt with yet. The step's job is to RECORD an
// outcome for every mitra — not to make everyone lunas — so a card leaves the
// queue once it has an outcome of any kind, including "tidak bayar". Grouping on
// payment instead would strand a recorded refusal in the queue forever and the
// page could never finish.
//
// Each card answers two questions. Attendance is two circular icon buttons in
// the identity row — at 22 cards the words "Hadir"/"Tidak" would repeat 44 times
// for a question whose answer is a shape. Payment is three named outcomes:
//
//   Bayar Lunas  — the common case, so it costs ONE tap and no sheet.
//   Jumlah Lain  — a sheet with the amount, over or under; partial is normal.
//   Tidak Bayar  — a sheet for the reason and, if given, the promise to pay.
//
// "Tidak Bayar" being a first-class outcome is the point: a no with a reason and
// a date is a result the BP can close and ops can chase. Leaving it unrecorded
// is what pushes DPD work onto a Google Form.

import { useState } from 'react'
import {
  Badge,
  BottomSheet,
  Button,
  Card,
  Input,
  NavigationHeader,
  SelectableCard,
} from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMajelis, rupiah, type Mitra } from '../lib/data'
import { IconCheck, IconX } from '../lib/icons'
import { MitraCard } from '../lib/mitra-card'
import {
  paidOf,
  paymentStatus,
  pendingMembers,
  recordedMembers,
  remainingOf,
  store,
  useApp,
} from '../lib/store'
import { Collapsible, IconToggle, StepBar } from '../lib/ui'

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
// the majelis, and "if any" has to be expressible.
const PTP_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Besok, 22 Juli', value: '22 Juli' },
  { label: 'Lusa, 23 Juli', value: '23 Juli' },
  { label: 'Minggu depan, 28 Juli', value: '28 Juli' },
  { label: 'Tidak ada janji', value: null },
]

export function MajelisVisitScreen() {
  const flow = useFlow()
  const s = useApp()
  const majelis = findMajelis(s.openMajelis)

  // Sheet state is deliberately local: it must not survive navigation.
  const [amountFor, setAmountFor] = useState<Mitra | null>(null)
  const [draft, setDraft] = useState('')
  const [refusalFor, setRefusalFor] = useState<Mitra | null>(null)
  const [reason, setReason] = useState<string | null>(null)
  const [ptp, setPtp] = useState<string | null | undefined>(undefined)

  const pending = pendingMembers(s, majelis.members)
  const recorded = recordedMembers(s, majelis.members)
  // What's still to collect from the mitra nobody has dealt with yet — the work
  // left in THIS step, not the majelis's outstanding debt.
  const owed = pending.reduce((sum, m) => sum + remainingOf(s, m), 0)

  function openAmount(mitra: Mitra) {
    setDraft(String(remainingOf(s, mitra)))
    setAmountFor(mitra)
  }

  function saveAmount() {
    if (!amountFor) return
    const entered = Number(draft.replace(/\D/g, '')) || 0
    store.setPayment(amountFor.id, paidOf(s, amountFor) + entered)
    setAmountFor(null)
  }

  function openRefusal(mitra: Mitra) {
    const existing = s.nonPayments[mitra.id]
    setReason(existing?.reason ?? null)
    setPtp(existing ? existing.ptp : undefined)
    setRefusalFor(mitra)
  }

  function saveRefusal() {
    if (!refusalFor || !reason) return
    store.setNonPayment(refusalFor.id, { reason, ptp: ptp ?? null })
    setRefusalFor(null)
  }

  const entered = Number(draft.replace(/\D/g, '')) || 0
  const overpay = amountFor ? entered - remainingOf(s, amountFor) : 0

  return (
    <Screen topBar={<NavigationHeader title={majelis.name} onBack={() => flow.back()} />}>
      <StepBar current={1} />

      <Card>
        <div className="flex items-center gap-12">
          <div className="flex flex-1 flex-col gap-2">
            <span className="text-12 text-caption">Belum dicatat</span>
            <span className="text-24 font-bold text-default">
              {pending.length} dari {majelis.members.length} mitra
            </span>
          </div>
          <span className="text-16 font-bold text-default">{rupiah(owed)}</span>
        </div>
      </Card>

      {pending.length > 0 ? (
        <div className="flex flex-col gap-8">
          {pending.map((mitra) => {
            return (
              <MitraCard
                key={mitra.id}
                mitra={mitra}
                trailing={
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-10 font-bold uppercase text-caption">Kehadiran</span>
                    <div className="flex gap-4">
                      <IconToggle
                        selected={s.attendance[mitra.id] === 'tidak'}
                        tone="red"
                        label={`Tidak hadir — ${mitra.name}`}
                        onClick={() => store.setAttendance(mitra.id, 'tidak')}
                      >
                        <IconX size={16} />
                      </IconToggle>
                      <IconToggle
                        selected={s.attendance[mitra.id] === 'hadir'}
                        tone="green"
                        label={`Hadir — ${mitra.name}`}
                        onClick={() => store.setAttendance(mitra.id, 'hadir')}
                      >
                        <IconCheck size={16} />
                      </IconToggle>
                    </div>
                  </div>
                }
                action={
                  <div className="flex flex-col gap-8">
                    <div className="flex items-center gap-8">
                      <span className="flex-1 text-12 text-caption">Tagihan</span>
                      <span className="text-14 font-bold text-default">{rupiah(mitra.due)}</span>
                    </div>
                    {/* Buttons take their own row: at 390px, the label plus
                        three named actions overflows the card. Primary sits
                        last, where the thumb lands. */}
                    <div className="flex gap-4">
                      <Button
                        size="xs"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openRefusal(mitra)}
                      >
                        Tidak Bayar
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        className="flex-1"
                        onClick={() => openAmount(mitra)}
                      >
                        Jumlah Lain
                      </Button>
                      <Button
                        size="xs"
                        className="flex-1"
                        onClick={() => store.setPayment(mitra.id, mitra.due)}
                      >
                        Bayar Lunas
                      </Button>
                    </div>
                  </div>
                }
              />
            )
          })}
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
              <IconCheck size={24} />
            </span>
            <span className="text-20 font-bold text-default">Semua mitra sudah dicatat</span>
            <span className="text-12 text-caption">Lanjut ke tugas tambahan.</span>
          </div>
        </Card>
      )}

      {/* Recorded ≠ paid: a mitra who said no is done, and her card says what
          she said. "Ubah" reopens the sheet that produced the outcome, so
          leaving the queue never traps an entry. */}
      <Collapsible title="Sudah dicatat" hint={`${recorded.length} mitra`}>
        {recorded.map((mitra) => {
          const status = paymentStatus(s, mitra)
          const refusal = s.nonPayments[mitra.id]
          return (
            <div key={mitra.id} className="flex items-center gap-8">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-14 text-default">{mitra.name}</span>
                {status === 'tidak' ? (
                  <span className="truncate text-12 text-caption">
                    {refusal?.reason}
                    {refusal?.ptp ? ` · Janji ${refusal.ptp}` : ' · Tanpa janji'}
                  </span>
                ) : null}
              </div>
              {status === 'lunas' ? (
                <Badge intent="green" leadingIcon={<IconCheck size={16} />}>
                  {rupiah(paidOf(s, mitra))}
                </Badge>
              ) : status === 'sebagian' ? (
                <Badge intent="orange">Kurang {rupiah(remainingOf(s, mitra))}</Badge>
              ) : (
                <Badge intent="red">Tidak bayar</Badge>
              )}
              <Button
                size="xs"
                variant="ghost"
                onClick={() => (status === 'tidak' ? openRefusal(mitra) : openAmount(mitra))}
              >
                Ubah
              </Button>
            </div>
          )
        })}
      </Collapsible>

      <div className="sticky bottom-0 -mx-16 mt-auto border-t border-default bg-neutral-white p-16">
        <Button size="lg" className="w-full" onClick={() => flow.go('majelis-offers')}>
          Lanjut
        </Button>
      </div>

      {/* --- Jumlah Lain: over or under, both are real. */}
      <BottomSheet
        open={amountFor !== null}
        onClose={() => setAmountFor(null)}
        title="Jumlah lain"
        description={amountFor?.name}
        primaryAction={
          <Button className="w-full" onClick={saveAmount}>
            Simpan
          </Button>
        }
        secondaryAction={
          <Button className="w-full" variant="ghost" onClick={() => setAmountFor(null)}>
            Batal
          </Button>
        }
      >
        <div className="flex flex-col gap-12">
          <div className="flex items-center gap-12 rounded-8 bg-neutral-50 px-12 py-8">
            <span className="flex-1 text-12 text-caption">Sisa tagihan minggu ini</span>
            <span className="text-14 font-bold text-default">
              {amountFor ? rupiah(remainingOf(s, amountFor)) : ''}
            </span>
          </div>
          <Input
            label="Jumlah diterima"
            prefix="Rp"
            inputMode="numeric"
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
            helperText={
              overpay > 0
                ? `Lebih ${rupiah(overpay)} dari tagihan`
                : overpay < 0
                  ? `Bayar sebagian — kurang ${rupiah(-overpay)}`
                  : 'Lunas untuk minggu ini'
            }
            state={overpay < 0 ? 'default' : 'valid'}
          />
        </div>
      </BottomSheet>

      {/* --- Tidak Bayar: the reason, then the next action. */}
      <BottomSheet
        open={refusalFor !== null}
        onClose={() => setRefusalFor(null)}
        size="md"
        title="Tidak bayar"
        description={refusalFor?.name}
        primaryAction={
          <Button className="w-full" disabled={!reason} onClick={saveRefusal}>
            Simpan
          </Button>
        }
        secondaryAction={
          <Button className="w-full" variant="ghost" onClick={() => setRefusalFor(null)}>
            Batal
          </Button>
        }
      >
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-8">
            <span className="text-12 font-bold text-default">Alasan</span>
            {REASONS.map((option) => (
              <SelectableCard
                key={option}
                name="alasan-tidak-bayar"
                inputType="radio"
                title={option}
                checked={reason === option}
                onChange={() => setReason(option)}
              />
            ))}
          </div>
          <div className="flex flex-col gap-8">
            <span className="text-12 font-bold text-default">Janji bayar</span>
            {PTP_OPTIONS.map((option) => (
              <SelectableCard
                key={option.label}
                name="janji-bayar"
                inputType="radio"
                title={option.label}
                checked={ptp !== undefined && ptp === option.value}
                onChange={() => setPtp(option.value)}
              />
            ))}
          </div>
        </div>
      </BottomSheet>
    </Screen>
  )
}
