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
// Each card answers two questions, and the card now spends its width on making
// both unmistakable rather than on saving taps:
//
//   Kehadiran — two named pills, "Hadir" / "Tidak". Circular ✗ / ✓ icons came
//     first and were denser, but a bare ✗ has no fixed meaning on a collection
//     card, and it sits next to a red DPD line that already means something bad.
//     Unselected stays a real third state: not yet marked ≠ marked absent.
//
//   Penagihan — ONE button, "Tagih", opening one sheet. It was two ("Bayar
//     Penuh" + "Lainnya") on the theory that the common case should cost one tap
//     and no sheet. What that actually bought was a card whose two buttons
//     competed at 390px, and a full payment recorded with no chance to correct
//     it. The sheet now opens with "Bayar Penuh" preselected and its amount
//     shown, so the happy case is open-then-Simpan — two taps, one of which is
//     a confirmation the BP previously never got.
//
// "Tidak Bayar" being a first-class outcome is still the point: a no with a
// reason and a date is a result the BP can close and ops can chase. Leaving it
// unrecorded is what pushes DPD work onto a Google Form.

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
import { IconCheck, IconInfo } from '../lib/icons'
import { MitraCard } from '../lib/mitra-card'
import {
  paidOf,
  paymentStatus,
  pendingMembers,
  recordedMembers,
  remainingOf,
  store,
  taskForMajelis,
  useApp,
} from '../lib/store'
import {
  AttendancePill,
  Chip,
  ChipGroup,
  Collapsible,
  InfoPill,
  SectionTitle,
  StatRows,
  StepBar,
  VisitTitle,
} from '../lib/ui'

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

/**
 * The three outcomes the Tagih sheet can record. Full payment now comes through
 * here too — it used to be a button on the card — which is what let the card
 * drop to one action. `penuh` is the default so the common case is
 * open-then-Simpan.
 */
type TagihMode = 'penuh' | 'sebagian' | 'tidak'

export function MajelisVisitScreen() {
  const flow = useFlow()
  const s = useApp()
  const majelis = findMajelis(s.openMajelis)

  // Sheet state is deliberately local: it must not survive navigation.
  const [catatanFor, setCatatanFor] = useState<Mitra | null>(null)
  const [mode, setMode] = useState<TagihMode>('penuh')
  const [draft, setDraft] = useState('')
  const [reason, setReason] = useState<string | null>(null)
  const [ptp, setPtp] = useState<string | null | undefined>(undefined)

  const pending = pendingMembers(s, majelis.members)
  const recorded = recordedMembers(s, majelis.members)
  const total = majelis.members.length
  const marked = majelis.members.filter((m) => s.attendance[m.id]).length
  const billed = majelis.members.reduce((sum, m) => sum + paidOf(s, m), 0)
  const billable = majelis.members.reduce((sum, m) => sum + m.due, 0)
  const task = taskForMajelis(majelis.id)

  // Reopened from "Ubah", the sheet comes back up on the mode that PRODUCED the
  // outcome, holding the amount already on file — so correcting an entry is an
  // edit, not a re-entry from scratch.
  function openTagih(mitra: Mitra) {
    const refusal = s.nonPayments[mitra.id]
    const paid = paidOf(s, mitra)
    setMode(refusal ? 'tidak' : paid > 0 && paid < mitra.due ? 'sebagian' : 'penuh')
    setDraft(String(paid > 0 ? paid : mitra.due))
    setReason(refusal?.reason ?? null)
    setPtp(refusal ? refusal.ptp : undefined)
    setCatatanFor(mitra)
  }

  function saveTagih() {
    if (!catatanFor) return
    if (mode === 'tidak') {
      if (!reason) return
      store.setNonPayment(catatanFor.id, { reason, ptp: ptp ?? null })
    } else if (mode === 'penuh') {
      store.setPayment(catatanFor.id, catatanFor.due)
    } else {
      // The amount actually received, not an increment — so reopening the sheet
      // to fix a typo corrects the figure instead of adding to it.
      store.setPayment(catatanFor.id, Number(draft.replace(/\D/g, '')) || 0)
    }
    setCatatanFor(null)
  }

  const entered = Number(draft.replace(/\D/g, '')) || 0
  const shortfall = catatanFor ? catatanFor.due - entered : 0

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={majelis.name} when={`Selasa, ${task?.time ?? '—'}`} />}
          onBack={() => flow.back()}
          link={
            <InfoPill>
              <IconInfo size={16} />
              Info
            </InfoPill>
          }
          onLinkClick={() => flow.go('majelis-info')}
        />
      }
    >
      <StepBar current={1} />

      {/* The visit's status, quiet: two label/value rows, not a hero number.
          The subject of this screen is the mitra list — a 24px count above it
          competed with the queue it was meant to be summarising. */}
      <StatRows
        rows={[
          { label: 'Kehadiran', value: `${marked} dari ${total} mitra` },
          {
            label: 'Penagihan',
            value: `${recorded.length} dari ${total} mitra`,
            detail: `${rupiah(billed)} dari ${rupiah(billable)}`,
          },
        ]}
      />

      <SectionTitle>Daftar Mitra</SectionTitle>

      {pending.length > 0 ? (
        <div className="flex flex-col gap-8">
          {pending.map((mitra) => {
            return (
              <MitraCard
                key={mitra.id}
                mitra={mitra}
                onOpen={() => {
                  store.openMitraPage(mitra.id)
                  flow.go('mitra')
                }}
                trailing={
                  <div className="flex gap-8">
                    <AttendancePill
                      selected={s.attendance[mitra.id] === 'hadir'}
                      tone="green"
                      label={`Hadir — ${mitra.name}`}
                      onClick={() => store.setAttendance(mitra.id, 'hadir')}
                    >
                      Hadir
                    </AttendancePill>
                    <AttendancePill
                      selected={s.attendance[mitra.id] === 'tidak'}
                      tone="red"
                      label={`Tidak hadir — ${mitra.name}`}
                      onClick={() => store.setAttendance(mitra.id, 'tidak')}
                    >
                      Tidak
                    </AttendancePill>
                  </div>
                }
                action={
                  // Bill left, ONE action right. The second button ("Bayar
                  // Penuh") moved into the sheet as its default mode: two
                  // buttons competed for the same row at 390px, and the whole
                  // outcome set now lives in one place instead of being split
                  // between the card and a sheet called "Lainnya".
                  <div className="flex items-center gap-8">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-12 text-caption">Tagihan</span>
                      <span className="truncate text-18 font-bold text-default">
                        {rupiah(mitra.due)}
                      </span>
                    </div>
                    {/* h-40 pins the button to the avatar/pill rhythm. FunDS
                        button sizes step 28 (xs) → 36 (sm), so neither lands on
                        40 — see NOTES.md. h-40 is a token class, not an
                        arbitrary value. */}
                    <Button size="sm" className="h-40 px-24" onClick={() => openTagih(mitra)}>
                      Tagih
                    </Button>
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
      <Collapsible title="Sudah ditagih" hint={`${recorded.length} mitra`}>
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
              <Button size="xs" variant="ghost" onClick={() => openTagih(mitra)}>
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

      {/* --- Tagih: the one door to every payment outcome, full payment now
          included. Mode comes first because the three need different questions
          and the BP knows which she is before the sheet opens — and "Bayar
          Penuh" is preselected because it is what happens most, so the sheet
          opens already answered and "Simpan" is the next tap.

          The mode list stays SelectableCard while the reason and janji-bayar
          lists became chips. That split is deliberate: mode carries the amount
          as a second line and everything below depends on it, so it should not
          look like the same weight as a reason tag — and the two lists it
          replaced were nine stacked cards that pushed Simpan off the sheet. */}
      <BottomSheet
        open={catatanFor !== null}
        onClose={() => setCatatanFor(null)}
        size="md"
        title="Tagih"
        description={catatanFor?.name}
        primaryAction={
          <Button className="w-full" disabled={mode === 'tidak' && !reason} onClick={saveTagih}>
            Simpan
          </Button>
        }
        secondaryAction={
          <Button className="w-full" variant="ghost" onClick={() => setCatatanFor(null)}>
            Batal
          </Button>
        }
      >
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-8">
            <SelectableCard
              name="mode-tagih"
              inputType="radio"
              title="Bayar Penuh"
              description={catatanFor ? rupiah(catatanFor.due) : undefined}
              checked={mode === 'penuh'}
              onChange={() => setMode('penuh')}
            />
            <SelectableCard
              name="mode-tagih"
              inputType="radio"
              title="Bayar Sebagian"
              checked={mode === 'sebagian'}
              onChange={() => setMode('sebagian')}
            />
            <SelectableCard
              name="mode-tagih"
              inputType="radio"
              title="Tidak Bayar"
              checked={mode === 'tidak'}
              onChange={() => setMode('tidak')}
            />
          </div>

          {mode === 'sebagian' ? (
            <Input
              label="Jumlah diterima"
              prefix="Rp"
              inputMode="numeric"
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
              helperText={
                shortfall > 0
                  ? `Kurang ${rupiah(shortfall)} dari tagihan`
                  : shortfall < 0
                    ? `Lebih ${rupiah(-shortfall)} dari tagihan`
                    : 'Sama dengan tagihan penuh'
              }
              state={shortfall > 0 ? 'default' : 'valid'}
            />
          ) : null}

          {mode === 'tidak' ? (
            <>
              <ChipGroup label="Alasan">
                {REASONS.map((option) => (
                  <Chip
                    key={option}
                    selected={reason === option}
                    onClick={() => setReason(option)}
                  >
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
            </>
          ) : null}
        </div>
      </BottomSheet>
    </Screen>
  )
}
