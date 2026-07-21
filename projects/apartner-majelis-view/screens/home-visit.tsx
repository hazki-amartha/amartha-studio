'use client'

// Home visit, step 1 of 2 — Temui & Tagih.
//
// A home visit branches more than a majelis stop: the team's flowchart runs
// met-mitra? → can-pay? → full/partial → reason → PTP, and in parallel
// not-present → met-PJ? → titipan?. This direction asks that same tree in one
// page that grows as she answers, with three collapses doing the work:
//
// * "met mitra? → met PJ? → met neighbour?" is ONE question with three answers.
//   All three ask who the BP talked to; nesting them made her answer the same
//   question repeatedly to reach "nobody was home".
// * Mitra and PJ take the SAME outcome controls. Whether the money came from
//   her or from her husband does not change what gets recorded — the amount and
//   the promise — so who handed it over is a tag, not a branch.
// * "Nobody home" cannot produce a payment, so the three-way outcome list is
//   not drawn at all; the page opens straight on the reason and the revisit.
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

import { Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { outstandingOf, rupiah } from '../lib/data'
import { HomeMitraCard, TagihanCard } from '../lib/home-card'
import {
  openHomeMitra,
  openHomeTask,
  paidOf,
  store,
  useApp,
  type MetWith,
} from '../lib/store'
import { Chip, ChipGroup, HOME_STAGE_LABELS, SectionTitle, StageBar, StickyBar } from '../lib/ui'

const WHO: { value: MetWith; title: string; description: string }[] = [
  { value: 'mitra', title: 'Mitra sendiri', description: 'Bisa langsung menagih' },
  {
    value: 'pj',
    title: 'Keluarga / penanggung jawab',
    description: 'Titipan dan janji bayar tetap dicatat atas nama mitra',
  },
  { value: 'nobody', title: 'Tidak ada orang', description: 'Tidak ada pembayaran hari ini' },
]

// Why she can't pay, when someone was reached.
const PAY_REASONS = [
  'Usaha sedang sepi',
  'Ada kebutuhan mendesak',
  'Sakit / keluarga sakit',
  'Menolak bayar',
]

// Why nobody was there. These are the ones that change what ops does next —
// relocation and death both open a different case entirely, which is why
// "pindah" asks for a new address.
const ABSENT_REASONS = ['Sedang bekerja', 'Pergi tanpa kabar', 'Pindah rumah', 'Meninggal dunia']

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

  // Nobody home means no money changed hands, so there is nothing to choose
  // between: the mode list is not drawn and the outcome is a recorded no.
  const absent = met === 'nobody'
  const mode = s.payMode[mitra.id]
  const reasons = absent ? ABSENT_REASONS : PAY_REASONS
  const shortfall = owed.total - paid

  function pick(next: 'penuh' | 'sebagian' | 'tidak') {
    store.setPayMode(mitra.id, next)
    if (next === 'penuh') store.collect(mitra, owed.total)
    if (next === 'tidak') store.setNonPayment(mitra, { reason: refusal?.reason ?? '', ptp: null })
  }

  function pickReason(value: string) {
    store.setNonPayment(mitra, { reason: value, ptp: refusal?.ptp ?? null })
  }

  function pickPtp(value: string | null) {
    store.setNonPayment(mitra, { reason: refusal?.reason ?? '', ptp: value })
  }

  return (
    <Screen
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
          onBack={() => flow.go('today')}
        />
      }
    >
      <StageBar current={1} labels={HOME_STAGE_LABELS} />

      <HomeMitraCard
        mitra={mitra}
        address={task?.place ?? ''}
        onOpen={() => {
          store.openMitraPage(mitra.id)
          flow.go('mitra')
        }}
      />

      {/* Always on screen, from the moment the step opens — the BP should never
          be talking to her with the amount she is asking for off-screen. */}
      <TagihanCard mitra={mitra} />

      {/* --- The one question that replaces three nested ones. */}
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
            onChange={() => store.setMetWith(mitra.id, option.value)}
          />
        ))}
      </div>

      {/* --- The outcome, inline. Same three results the majelis collect page
          offers, in the same order — and the same controls whether it was her
          or her family, since what gets recorded is the money and the promise,
          not who handed them over. */}
      {met && !absent ? (
        <>
          <SectionTitle>Pembayaran</SectionTitle>
          <div className="flex flex-col gap-8">
            <SelectableCard
              name="mode-tagih"
              inputType="radio"
              title="Bayar Penuh"
              description={rupiah(owed.total)}
              checked={mode === 'penuh'}
              onChange={() => pick('penuh')}
            />
            <SelectableCard
              name="mode-tagih"
              inputType="radio"
              title="Bayar Sebagian"
              description="Terima sebagian, sisanya dijanjikan"
              checked={mode === 'sebagian'}
              onChange={() => pick('sebagian')}
            />
            <SelectableCard
              name="mode-tagih"
              inputType="radio"
              title="Tidak Bayar"
              description="Catat alasan dan janji bayar"
              checked={mode === 'tidak'}
              onChange={() => pick('tidak')}
            />
          </div>
        </>
      ) : null}

      {/* The amount is typed straight into the record — no draft, no Simpan. */}
      {met && !absent && mode === 'sebagian' ? (
        <Card>
          <div className="flex flex-col gap-12">
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
                    ? `Sisa ${rupiah(shortfall)} — buat janji bayar untuk sisanya di bawah.`
                    : shortfall < 0
                      ? `Lebih ${rupiah(-shortfall)} dari tagihan`
                      : 'Sama dengan tagihan penuh'
              }
              state={paid > 0 && shortfall <= 0 ? 'valid' : 'default'}
            />

            {/* A balance is only a record once it has a date. Asked only once
                money is actually on file — an empty field has no sisa. */}
            {paid > 0 && shortfall > 0 ? (
              <ChipGroup label="Janji bayar sisanya">
                {PTP_OPTIONS.map((option) => (
                  <Chip
                    key={option.label}
                    selected={
                      s.partialPtp[mitra.id] !== undefined && s.partialPtp[mitra.id] === option.value
                    }
                    onClick={() => store.setPartialPtp(mitra.id, option.value)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </ChipGroup>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* --- Nobody home, or a recorded no. Either way the remaining questions
          are the same two: why, and when to come back. */}
      {(absent || mode === 'tidak') && met ? (
        <>
          <SectionTitle>{absent ? 'Catatan kunjungan' : 'Alasan belum bayar'}</SectionTitle>
          <Card>
            <div className="flex flex-col gap-12">
              <ChipGroup label={absent ? 'Kenapa tidak ada di rumah?' : 'Alasan'}>
                {reasons.map((option) => (
                  <Chip
                    key={option}
                    selected={refusal?.reason === option}
                    onClick={() => pickReason(option)}
                  >
                    {option}
                  </Chip>
                ))}
              </ChipGroup>

              {/* Relocation is the one reason that needs more than a label — an
                  address is what turns "pindah" into something ops can act on
                  rather than a dead end. */}
              {refusal?.reason === 'Pindah rumah' ? (
                <Input
                  label="Alamat baru (jika diketahui)"
                  value={s.newAddress[mitra.id] ?? ''}
                  onChange={(e) => store.setNewAddress(mitra.id, e.target.value)}
                  helperText="Kosongkan jika belum tahu — akan dibuat tugas pelacakan."
                />
              ) : null}

              {/* Asked only once there is a reason: a revisit date with nothing
                  attached to it is not a record of anything. */}
              {refusal?.reason && refusal.reason !== 'Meninggal dunia' ? (
                <ChipGroup label={absent ? 'Kunjungan ulang' : 'Janji bayar'}>
                  {PTP_OPTIONS.map((option) => (
                    <Chip
                      key={option.label}
                      selected={refusal.ptp === option.value}
                      onClick={() => pickPtp(option.value)}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </ChipGroup>
              ) : null}
            </div>
          </Card>
        </>
      ) : null}

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!met} onClick={() => flow.go('home-proof')}>
          Lanjut
        </Button>
      </StickyBar>
    </Screen>
  )
}
