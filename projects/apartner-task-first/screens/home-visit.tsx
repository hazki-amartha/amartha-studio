'use client'

// Step 1 of 3 — Temui & Tagih.
//
// The single-mitra counterpart to the majelis collection queue. There is one
// card, not a list, so the top of the screen carries the "why now" — the place
// and the pre-reasoned reason line from the schedule — instead of a countdown.
//
// The card answers the same two questions as a majelis card, reusing the same
// controls:
//
//   Ditemui / Tidak di rumah  — the home-visit read of attendance. Whether the
//     BP even reached her is the first fact of any doorstep visit, and "not
//     home" is a real, recordable outcome, not a blank.
//   Bayar Lunas / Catatan     — identical to the majelis card. "Catatan" is the
//     one door to a partial payment, or to a no (with its reason and promise) —
//     and "not home" is logged there too, as a no with reason "Tidak ada di
//     rumah" and a date to come back.

import { useState } from 'react'
import {
  BottomSheet,
  Button,
  Card,
  Input,
  NavigationHeader,
  SelectableCard,
} from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findHomeVisit, findTask, rupiah } from '../lib/data'
import { IconCheck, IconPin, IconX } from '../lib/icons'
import { MitraCard } from '../lib/mitra-card'
import { paidOf, remainingOf, store, useApp } from '../lib/store'
import { HOME_STEP_LABELS, IconToggle, StepBar } from '../lib/ui'

// Doorstep-realistic reasons — "Tidak ada di rumah" leads, because on a home
// visit the most common not-paid outcome is simply not reaching her.
const REASONS = [
  'Tidak ada di rumah',
  'Usaha sedang sepi',
  'Ada kebutuhan mendesak',
  'Sakit / keluarga sakit',
  'Menolak bayar',
]

// A rough revisit / promise date negotiated at the door — "if any" must be
// expressible, same as the majelis sheet.
const PTP_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Besok, 22 Juli', value: '22 Juli' },
  { label: 'Lusa, 23 Juli', value: '23 Juli' },
  { label: 'Minggu depan, 28 Juli', value: '28 Juli' },
  { label: 'Tidak ada janji', value: null },
]

type CatatanMode = 'bayar' | 'tidak'

export function HomeVisitScreen() {
  const flow = useFlow()
  const s = useApp()
  const visit = findHomeVisit(s.openHome)
  const mitra = visit.mitra
  const task = findTask(visit.id)

  // Sheet state is deliberately local: it must not survive navigation.
  const [catatanOpen, setCatatanOpen] = useState(false)
  const [mode, setMode] = useState<CatatanMode>('bayar')
  const [draft, setDraft] = useState('')
  const [reason, setReason] = useState<string | null>(null)
  const [ptp, setPtp] = useState<string | null | undefined>(undefined)

  function openCatatan() {
    const refusal = s.nonPayments[mitra.id]
    setMode(refusal ? 'tidak' : 'bayar')
    setDraft(String(remainingOf(s, mitra)))
    setReason(refusal?.reason ?? null)
    setPtp(refusal ? refusal.ptp : undefined)
    setCatatanOpen(true)
  }

  function saveCatatan() {
    if (mode === 'tidak') {
      if (!reason) return
      store.setNonPayment(mitra.id, { reason, ptp: ptp ?? null })
    } else {
      const entered = Number(draft.replace(/\D/g, '')) || 0
      store.setPayment(mitra.id, paidOf(s, mitra) + entered)
    }
    setCatatanOpen(false)
  }

  const entered = Number(draft.replace(/\D/g, '')) || 0
  const overpay = entered - remainingOf(s, mitra)

  return (
    <Screen topBar={<NavigationHeader title="Home Visit" onBack={() => flow.back()} />}>
      <StepBar current={1} labels={HOME_STEP_LABELS} />

      {/* Why this visit is on the schedule — place plus the pre-reasoned line,
          handed to the BP rather than derived from a dashboard. */}
      <Card>
        <div className="flex flex-col gap-8">
          <span className="flex items-center gap-4 text-12 text-caption">
            <IconPin size={16} />
            {task?.place}
          </span>
          <div className="rounded-8 bg-neutral-50 px-12 py-8 text-12 text-default">
            {task?.reason}
          </div>
        </div>
      </Card>

      <MitraCard
        mitra={mitra}
        onOpen={() => {
          store.openMitraPage(mitra.id)
          flow.go('mitra')
        }}
        trailing={
          <div className="flex gap-8">
            <IconToggle
              selected={s.attendance[mitra.id] === 'tidak'}
              tone="red"
              label={`Tidak di rumah — ${mitra.name}`}
              onClick={() => store.setAttendance(mitra.id, 'tidak')}
            >
              <IconX size={16} />
            </IconToggle>
            <IconToggle
              selected={s.attendance[mitra.id] === 'hadir'}
              tone="green"
              label={`Ditemui — ${mitra.name}`}
              onClick={() => store.setAttendance(mitra.id, 'hadir')}
            >
              <IconCheck size={16} />
            </IconToggle>
          </div>
        }
        action={
          // Identical row to the majelis card: bill left, one-tap Lunas and the
          // Catatan door right, both pinned to the 32px rhythm.
          <div className="flex items-center gap-8">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-12 text-caption">Tagihan</span>
              <span className="truncate text-18 font-bold text-default">{rupiah(mitra.due)}</span>
            </div>
            <Button size="sm" variant="outline" className="h-32" onClick={openCatatan}>
              Catatan
            </Button>
            <Button size="sm" className="h-32" onClick={() => store.setPayment(mitra.id, mitra.due)}>
              Lunas
            </Button>
          </div>
        }
      />

      <div className="sticky bottom-0 -mx-16 mt-auto border-t border-default bg-neutral-white p-16">
        <Button size="lg" className="w-full" onClick={() => flow.go('home-offer')}>
          Lanjut
        </Button>
      </div>

      {/* --- Catatan: the same sheet as the majelis card. Mode first, because
          "she paid some" and "she paid nothing" ask different questions. */}
      <BottomSheet
        open={catatanOpen}
        onClose={() => setCatatanOpen(false)}
        size="md"
        title="Catatan"
        description={mitra.name}
        primaryAction={
          <Button className="w-full" disabled={mode === 'tidak' && !reason} onClick={saveCatatan}>
            Simpan
          </Button>
        }
        secondaryAction={
          <Button className="w-full" variant="ghost" onClick={() => setCatatanOpen(false)}>
            Batal
          </Button>
        }
      >
        <div className="flex flex-col gap-12">
          <div className="flex gap-8">
            <Button
              size="sm"
              className="flex-1"
              variant={mode === 'bayar' ? 'primary' : 'outline'}
              onClick={() => setMode('bayar')}
            >
              Bayar sebagian
            </Button>
            <Button
              size="sm"
              className="flex-1"
              variant={mode === 'tidak' ? 'primary' : 'outline'}
              onClick={() => setMode('tidak')}
            >
              Tidak bayar
            </Button>
          </div>

          {mode === 'bayar' ? (
            <>
              <div className="flex items-center gap-12 rounded-8 bg-neutral-50 px-12 py-8">
                <span className="flex-1 text-12 text-caption">Sisa tagihan</span>
                <span className="text-14 font-bold text-default">
                  {rupiah(remainingOf(s, mitra))}
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
                      : 'Lunas untuk tagihan ini'
                }
                state={overpay < 0 ? 'default' : 'valid'}
              />
            </>
          ) : (
            <>
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
                <span className="text-12 font-bold text-default">Janji bayar / kunjungan ulang</span>
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
            </>
          )}
        </div>
      </BottomSheet>
    </Screen>
  )
}
