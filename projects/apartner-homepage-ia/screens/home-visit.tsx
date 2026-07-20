'use client'

// Home Visit — step 1 of 2: Temui & Tagih.
//
// Ported from the Task-First direction and rewired onto this prototype's data;
// it replaces the branching Kunjungan Rumah wizard. A home visit is ONE mitra,
// so everything lives on the page — no sheet — and reads top to bottom as the
// conversation goes: who she is and how to reach her, what she owes, who
// answered the door, then what happened about the money.
//
// Three collapses do the work: "met mitra / met PJ / nobody" is one question
// with three answers; mitra and PJ take the same outcome controls (who handed
// the money over is a tag, not a branch); "nobody home" cannot pay, so it drops
// the mode switch and opens straight on the reason and the revisit date.

import { Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { mitraContact, rp } from '../lib/data'
import { paidOf, selectedMitra, store, useApp, weeklyOf, type MetWith } from '../lib/store'
import { Chip, ChipGroup, HOME_STEP_LABELS, HomeMitraCard, SectionTitle, StepBar, TagihanCard } from '../lib/visit-ui'

const WHO: { value: MetWith; title: string; description: string }[] = [
  { value: 'mitra', title: 'Mitra sendiri', description: 'Bisa langsung menagih' },
  {
    value: 'pj',
    title: 'Keluarga / penanggung jawab',
    description: 'Titipan dan janji bayar tetap dicatat atas nama mitra',
  },
  { value: 'nobody', title: 'Tidak ada orang', description: 'Tidak ada pembayaran hari ini' },
]

const PAY_REASONS = ['Usaha sedang sepi', 'Ada kebutuhan mendesak', 'Sakit / keluarga sakit', 'Menolak bayar']
const ABSENT_REASONS = ['Sedang bekerja', 'Pergi tanpa kabar', 'Pindah rumah', 'Meninggal dunia']

const PTP_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Besok', value: 'besok' },
  { label: 'Lusa', value: 'lusa' },
  { label: 'Minggu depan', value: 'minggu depan' },
  { label: 'Tidak ada janji', value: null },
]

export function HomeVisitScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = selectedMitra(s)
  const task = s.tasks.find((t) => t.id === s.hvTaskId)
  const due = weeklyOf(mitra)

  const met = s.metWith[mitra.n]
  const refusal = s.nonPayments[mitra.n]
  const paid = paidOf(s, mitra)

  const absent = met === 'nobody'
  const mode = s.payMode[mitra.n]
  const reasons = absent ? ABSENT_REASONS : PAY_REASONS

  // Everything writes straight to the store — no draft, no "Simpan".
  function pick(next: 'penuh' | 'sebagian' | 'tidak') {
    store.setPayMode(mitra.n, next)
    if (next === 'penuh') store.setPayment(mitra.n, due)
  }
  function pickReason(value: string) {
    store.setNonPayment(mitra.n, { reason: value, ptp: refusal?.ptp ?? null })
  }
  function pickPtp(value: string | null) {
    store.setNonPayment(mitra.n, { reason: refusal?.reason ?? '', ptp: value })
  }

  const shortfall = due - paid
  const reasonLine = task?.meta ?? (mitra.dpd > 0 ? `Menunggak ${mitra.dpd} hari` : 'Kunjungan rumah')

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={
            <span className="flex flex-col">
              <span className="text-16 font-bold text-default">{mitra.n}</span>
              <span className="text-12 font-regular text-caption">{task?.time ?? 'Hari ini'}</span>
            </span>
          }
          onBack={() => flow.back()}
        />
      }
    >
      <StepBar current={1} labels={HOME_STEP_LABELS} />

      <HomeMitraCard
        mitra={mitra}
        address={mitraContact(mitra).addr}
        onOpen={() => {
          store.set({ selMitra: mitra.n })
          flow.go('mitra-detail')
        }}
      />

      <TagihanCard mitra={mitra} reason={reasonLine} />

      <SectionTitle>Siapa yang ditemui?</SectionTitle>
      <div className="flex flex-col gap-8">
        {WHO.map((option) => (
          <SelectableCard
            key={option.value}
            name="ditemui"
            inputType="radio"
            title={option.title}
            description={option.description}
            checked={met === option.value}
            onChange={() => store.setMetWith(mitra.n, option.value)}
          />
        ))}
      </div>

      {met && !absent ? (
        <>
          <SectionTitle>Pembayaran</SectionTitle>
          <div className="flex flex-col gap-8">
            <SelectableCard
              name="mode-tagih"
              inputType="radio"
              title="Bayar Penuh"
              description={rp(due)}
              checked={mode === 'penuh'}
              onChange={() => pick('penuh')}
            />
            <SelectableCard
              name="mode-tagih"
              inputType="radio"
              title="Bayar Sebagian"
              checked={mode === 'sebagian'}
              onChange={() => pick('sebagian')}
            />
            <SelectableCard
              name="mode-tagih"
              inputType="radio"
              title="Tidak Bayar"
              checked={mode === 'tidak'}
              onChange={() => pick('tidak')}
            />
          </div>
        </>
      ) : null}

      {met && !absent && mode === 'sebagian' ? (
        <Input
          label="Jumlah diterima"
          prefix="Rp"
          inputMode="numeric"
          value={paid > 0 ? String(paid) : ''}
          onChange={(e) => store.setPayment(mitra.n, Number(e.target.value.replace(/\D/g, '')) || 0)}
          helperText={
            paid === 0
              ? 'Masukkan jumlah yang diterima'
              : shortfall > 0
                ? `Kurang ${rp(shortfall)} dari tagihan`
                : shortfall < 0
                  ? `Lebih ${rp(-shortfall)} dari tagihan`
                  : 'Sama dengan tagihan penuh'
          }
          state={paid > 0 && shortfall <= 0 ? 'valid' : 'default'}
        />
      ) : null}

      {/* Nobody home, or a recorded no — either way the remaining questions are
          the same two: why, and when to come back. */}
      {(absent || mode === 'tidak') && met ? (
        <>
          <SectionTitle>{absent ? 'Catatan kunjungan' : 'Alasan belum bayar'}</SectionTitle>
          <Card>
            <div className="flex flex-col gap-12">
              <ChipGroup label={absent ? 'Kenapa tidak ada di rumah?' : 'Alasan'}>
                {reasons.map((option) => (
                  <Chip key={option} selected={refusal?.reason === option} onClick={() => pickReason(option)}>
                    {option}
                  </Chip>
                ))}
              </ChipGroup>

              {refusal?.reason === 'Pindah rumah' ? (
                <Input
                  label="Alamat baru (jika diketahui)"
                  value={s.newAddress[mitra.n] ?? ''}
                  onChange={(e) => store.setNewAddress(mitra.n, e.target.value)}
                  helperText="Kosongkan jika belum tahu — akan dibuat tugas pelacakan."
                />
              ) : null}

              {refusal?.reason && refusal.reason !== 'Meninggal dunia' ? (
                <ChipGroup label={absent ? 'Kunjungan ulang' : 'Janji bayar'}>
                  {PTP_OPTIONS.map((option) => (
                    <Chip key={option.label} selected={refusal.ptp === option.value} onClick={() => pickPtp(option.value)}>
                      {option.label}
                    </Chip>
                  ))}
                </ChipGroup>
              ) : null}
            </div>
          </Card>
        </>
      ) : null}

      <div className="sticky bottom-0 -mx-16 mt-auto border-t border-default bg-neutral-white p-16">
        <Button size="lg" className="w-full" disabled={!met} onClick={() => flow.go('home-proof')}>
          Lanjut
        </Button>
      </div>
    </Screen>
  )
}
