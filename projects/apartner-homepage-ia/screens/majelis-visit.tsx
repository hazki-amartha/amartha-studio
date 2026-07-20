'use client'

// Majelis Visit — step 1 of 3: Kehadiran & Pembayaran.
//
// Ported from the Task-First direction and rewired onto this prototype's data.
// It replaces the old inline "visit mode" on Detail Majelis: a visit is a
// sequence (collect → offer → prove), so it is three screens rather than one
// page that changes shape.
//
// The queue drains on RECORDED, not paid — a mitra recorded as "tidak bayar"
// (reason + PTP) still counts as done, so the count can reach zero. Attendance
// is two named pills; payment is one "Tagih" button opening one sheet that holds
// every outcome. dpd-0 mitra are seeded as already paid this week, so the queue
// is only the mitra a BP actually has to collect from.

import { useState } from 'react'
import { BottomSheet, Button, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ptpOptions, rp, type Mitra } from '../lib/data'
import {
  activeMembers,
  paidOf,
  paymentStatus,
  pendingMembers,
  recordedMembers,
  remainingOf,
  selectedMajelis,
  store,
  useApp,
  weeklyOf,
} from '../lib/store'
import {
  AttendancePill,
  Chip,
  ChipGroup,
  SectionTitle,
  StatRows,
  StepBar,
  VisitMitraCard,
  VisitTitle,
} from '../lib/visit-ui'

const REASONS = [
  'Usaha sedang sepi',
  'Ada kebutuhan mendesak',
  'Sakit / keluarga sakit',
  'Sedang tidak di tempat',
  'Menolak bayar',
]

// Discrete PTP options from the shared date helper, plus an explicit "no promise".
const PTP_OPTIONS: { label: string; value: string | null }[] = [
  ...ptpOptions().map((o) => ({ label: `${o.l} (${o.date})`, value: o.date })),
  { label: 'Tidak ada janji', value: null },
]

/** The three outcomes the Tagih sheet records. Full payment comes through here
 *  too, and `penuh` is preselected so the common case is open-then-Simpan. */
type TagihMode = 'penuh' | 'sebagian' | 'tidak'

export function MajelisVisitScreen() {
  const flow = useFlow()
  const s = useApp()
  const g = selectedMajelis(s)
  const members = activeMembers(g.n)
  const task = s.tasks.find((t) => t.act === 'Kunjungan Majelis' && t.maj === g.n)

  const [catatanFor, setCatatanFor] = useState<Mitra | null>(null)
  const [mode, setMode] = useState<TagihMode>('penuh')
  const [draft, setDraft] = useState('')
  const [reason, setReason] = useState<string | null>(null)
  const [ptp, setPtp] = useState<string | null | undefined>(undefined)

  const pending = pendingMembers(s, members)
  const recorded = recordedMembers(s, members)
  const total = members.length
  const marked = members.filter((m) => s.attendance[m.n]).length
  const billed = members.reduce((sum, m) => sum + paidOf(s, m), 0)
  const billable = members.reduce((sum, m) => sum + weeklyOf(m), 0)

  function openTagih(mitra: Mitra) {
    const refusal = s.nonPayments[mitra.n]
    const paid = paidOf(s, mitra)
    // A refusal with nothing paid is a "tidak bayar"; a refusal riding alongside
    // a part-payment reopens on "sebagian" so its amount stays editable.
    setMode(refusal && paid === 0 ? 'tidak' : paid > 0 && paid < weeklyOf(mitra) ? 'sebagian' : 'penuh')
    setDraft(String(paid > 0 ? paid : weeklyOf(mitra)))
    setReason(refusal?.reason ?? null)
    setPtp(refusal ? refusal.ptp : undefined)
    setCatatanFor(mitra)
  }

  function saveTagih() {
    if (!catatanFor) return
    const due = weeklyOf(catatanFor)
    if (mode === 'tidak') {
      if (!reason) return
      store.setNonPayment(catatanFor.n, { reason, ptp: ptp ?? null })
    } else if (mode === 'penuh') {
      store.setPayment(catatanFor.n, due)
    } else {
      const received = Number(draft.replace(/\D/g, '')) || 0
      if (received < due) {
        // A shortfall is left — capture why, exactly like a "tidak bayar", so the
        // remaining balance is a closed outcome and not a silent gap.
        if (!reason) return
        store.setPartialPayment(catatanFor.n, received, { reason, ptp: ptp ?? null })
      } else {
        store.setPayment(catatanFor.n, received)
      }
    }
    setCatatanFor(null)
  }

  const entered = Number(draft.replace(/\D/g, '')) || 0
  const shortfall = catatanFor ? weeklyOf(catatanFor) - entered : 0
  const needsReason = mode === 'tidak' || (mode === 'sebagian' && shortfall > 0)

  const attendancePills = (mitra: Mitra) => (
    <div className="flex gap-8">
      <AttendancePill
        selected={s.attendance[mitra.n] === 'hadir'}
        tone="green"
        label={`Hadir — ${mitra.n}`}
        onClick={() => store.setAttendance(mitra.n, 'hadir')}
      >
        Hadir
      </AttendancePill>
      <AttendancePill
        selected={s.attendance[mitra.n] === 'tidak'}
        tone="red"
        label={`Tidak hadir — ${mitra.n}`}
        onClick={() => store.setAttendance(mitra.n, 'tidak')}
      >
        Tidak
      </AttendancePill>
    </div>
  )

  const openMitra = (mitra: Mitra) => () => {
    store.set({ selMitra: mitra.n })
    flow.go('mitra-detail')
  }

  const reasonFields = (
    <>
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
    </>
  )

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={g.n} when={g.day} />}
          onBack={() => flow.back()}
        />
      }
    >
      <StepBar current={1} />

      <StatRows
        rows={[
          { label: 'Kehadiran', value: `${marked} dari ${total} mitra` },
          {
            label: 'Penagihan',
            value: `${recorded.length} dari ${total} mitra`,
            detail: `${rp(billed)} dari ${rp(billable)}`,
          },
        ]}
      />

      <SectionTitle>Daftar Mitra</SectionTitle>

      {/* ONE list, roster order: mitra still to collect on top with the Tagih
          action, then the ones already recorded — kept in the page as full
          cards, only their action row swapped for a marked outcome. */}
      <div className="flex flex-col gap-8">
        {pending.map((mitra) => (
          <VisitMitraCard
            key={mitra.n}
            mitra={mitra}
            onOpen={openMitra(mitra)}
            trailing={attendancePills(mitra)}
            action={
              <div className="flex items-center gap-8">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-12 text-caption">Tagihan</span>
                  <span className="truncate text-18 font-bold text-default">{rp(weeklyOf(mitra))}</span>
                </div>
                <Button size="sm" className="h-40 px-24" onClick={() => openTagih(mitra)}>
                  Tagih
                </Button>
              </div>
            }
          />
        ))}

        {recorded.map((mitra) => {
          const status = paymentStatus(s, mitra)
          const refusal = s.nonPayments[mitra.n]
          const mark =
            status === 'lunas' ? (
              <span className="text-14 font-bold text-green-500">Sudah ditagih</span>
            ) : status === 'sebagian' ? (
              <div className="flex min-w-0 flex-col">
                <span className="text-14 font-bold text-orange-500">Sudah ditagih sebagian</span>
                <span className="truncate text-12 text-caption">
                  Kurang {rp(remainingOf(s, mitra))}
                  {refusal?.ptp ? ` · PTP ${refusal.ptp}` : ''}
                </span>
              </div>
            ) : (
              <div className="flex min-w-0 flex-col">
                <span className="text-14 font-bold text-red-500">Tidak bayar</span>
                <span className="truncate text-12 text-caption">
                  {refusal?.reason}
                  {refusal?.ptp ? ` · PTP ${refusal.ptp}` : ' · Tanpa janji'}
                </span>
              </div>
            )
          return (
            <VisitMitraCard
              key={mitra.n}
              mitra={mitra}
              onOpen={openMitra(mitra)}
              trailing={attendancePills(mitra)}
              action={
                <div className="flex items-center gap-8">
                  <div className="flex min-w-0 flex-1 flex-col justify-center">{mark}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-40 px-24"
                    onClick={() => openTagih(mitra)}
                  >
                    Ubah
                  </Button>
                </div>
              }
            />
          )
        })}
      </div>

      <div className="sticky bottom-0 -mx-16 mt-auto border-t border-default bg-neutral-white p-16">
        <Button size="lg" className="w-full" onClick={() => flow.go('majelis-offers')}>
          Lanjut
        </Button>
      </div>

      {/* --- Tagih: the one door to every payment outcome. "Bayar Penuh" is
          preselected, so the common case is open-then-Simpan. A short "Bayar
          Sebagian" asks the same reason + PTP a "Tidak Bayar" asks. */}
      <BottomSheet
        open={catatanFor !== null}
        onClose={() => setCatatanFor(null)}
        size="md"
        title="Tagih"
        description={catatanFor?.n}
        primaryAction={
          <Button className="w-full" disabled={needsReason && !reason} onClick={saveTagih}>
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
              description={catatanFor ? rp(weeklyOf(catatanFor)) : undefined}
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
                  ? `Kurang ${rp(shortfall)} dari tagihan`
                  : shortfall < 0
                    ? `Lebih ${rp(-shortfall)} dari tagihan`
                    : 'Sama dengan tagihan penuh'
              }
              state={shortfall > 0 ? 'default' : 'valid'}
            />
          ) : null}

          {/* Alasan + janji-bayar: for a flat "tidak bayar" AND a short
              part-payment — both leave a balance that needs the same answers. */}
          {needsReason ? reasonFields : null}
        </div>
      </BottomSheet>
    </Screen>
  )
}
