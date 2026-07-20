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
import { IconCheck, IconInfo, IconX } from '../lib/icons'
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
  Collapsible,
  IconToggle,
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

/** The two things "Catatan" can record. Full payment never comes through here —
 *  that is the "Lunas" button, at one tap. */
type CatatanMode = 'bayar' | 'tidak'

export function MajelisVisitScreen() {
  const flow = useFlow()
  const s = useApp()
  const majelis = findMajelis(s.openMajelis)

  // Sheet state is deliberately local: it must not survive navigation.
  const [catatanFor, setCatatanFor] = useState<Mitra | null>(null)
  const [mode, setMode] = useState<CatatanMode>('bayar')
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

  function openCatatan(mitra: Mitra) {
    const refusal = s.nonPayments[mitra.id]
    setMode(refusal ? 'tidak' : 'bayar')
    setDraft(String(remainingOf(s, mitra)))
    setReason(refusal?.reason ?? null)
    setPtp(refusal ? refusal.ptp : undefined)
    setCatatanFor(mitra)
  }

  function saveCatatan() {
    if (!catatanFor) return
    if (mode === 'tidak') {
      if (!reason) return
      store.setNonPayment(catatanFor.id, { reason, ptp: ptp ?? null })
    } else {
      const entered = Number(draft.replace(/\D/g, '')) || 0
      store.setPayment(catatanFor.id, paidOf(s, catatanFor) + entered)
    }
    setCatatanFor(null)
  }

  const entered = Number(draft.replace(/\D/g, '')) || 0
  const overpay = catatanFor ? entered - remainingOf(s, catatanFor) : 0

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
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-8">
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
                  // Bill left, actions right — one row, everything 40px tall.
                  // Two buttons instead of three: "Bayar Penuh" is the common
                  // case at one tap, and "Lainnya" is the one door to every
                  // other outcome (part payment, or a no with its reason).
                  <div className="flex items-center gap-8">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-12 text-caption">Tagihan</span>
                      <span className="truncate text-18 font-bold text-default">
                        {rupiah(mitra.due)}
                      </span>
                    </div>
                    {/* h-40 pins both buttons to the avatar/toggle rhythm.
                        FunDS button sizes step 28 (xs) → 36 (sm), so neither
                        lands on 40 — see NOTES.md. h-40 is a token class, not
                        an arbitrary value. */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-40"
                      onClick={() => openCatatan(mitra)}
                    >
                      Lainnya
                    </Button>
                    <Button
                      size="sm"
                      className="h-40"
                      onClick={() => store.setPayment(mitra.id, mitra.due)}
                    >
                      Bayar Penuh
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
              <Button size="xs" variant="ghost" onClick={() => openCatatan(mitra)}>
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

      {/* --- Catatan: the one door to every outcome that isn't a clean full
          payment. Mode first, because "she paid some" and "she paid nothing"
          need different questions and the BP knows which she is before the
          sheet opens. */}
      <BottomSheet
        open={catatanFor !== null}
        onClose={() => setCatatanFor(null)}
        size="md"
        title="Catatan"
        description={catatanFor?.name}
        primaryAction={
          <Button
            className="w-full"
            disabled={mode === 'tidak' && !reason}
            onClick={saveCatatan}
          >
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
                <span className="flex-1 text-12 text-caption">Sisa tagihan minggu ini</span>
                <span className="text-14 font-bold text-default">
                  {catatanFor ? rupiah(remainingOf(s, catatanFor)) : ''}
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
            </>
          )}
        </div>
      </BottomSheet>
    </Screen>
  )
}
