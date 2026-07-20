'use client'

// Step 1 of 2 — Temui & Tagih.
//
// A home visit branches more than a majelis stop: the team's flowchart runs
// met-mitra? → can-pay? → full/partial → reason → PTP → Peldis, and in parallel
// not-present → met-PJ? → titipan? → PJ-PTP?, and met-neighbour? if not. The
// homepage-IA direction renders that faithfully as fourteen stacked questions.
// This direction takes the same decision tree and asks it in two places:
//
// It all now lives ON THE PAGE — there is no sheet in this flow. A majelis step
// keeps its sheet because the screen behind it is a queue of 22 cards that has
// to stay scannable, and a card cannot grow a form without wrecking the list.
// A home visit is ONE mitra, so the screen has nothing to protect: the page can
// simply grow as the BP answers, and a sheet here only added a layer over a
// form that had room to be visible.
//
// So step 1 reads top to bottom as the conversation actually goes: who she is
// and how to reach her, what she owes, who answered the door, and then what
// happened about the money.
//
// Three collapses do the work:
//
// * "met mitra? → met PJ? → met neighbour?" is ONE question with three answers.
//   All three ask who the BP talked to; nesting them made the BP answer the
//   same question repeatedly to reach "nobody was home".
// * Mitra and PJ take the SAME outcome controls. Whether the money came from
//   her or from her husband does not change what gets recorded — the amount and
//   the promise — so who handed it over is a tag, not a branch.
// * "nobody home" cannot produce a payment, so its sheet drops the mode switch
//   entirely and opens straight on the reason and the revisit date.
//
// What is gone: the cross-sell step. A home visit happens BECAUSE a mitra is
// behind, so there is nothing to upsell. The Peldis recommendation that briefly
// filled that gap is also gone — parked until the settlement route is confirmed
// — so this step records the outcome and nothing else.
//
// The payment OPTIONS still match the majelis sheet exactly — the same three
// outcomes, in the same order, with the same reason and janji-bayar chips. Only
// the container differs, and it differs for a reason the BP can feel: at a
// majelis she is working a list, at a door she is having one conversation.

import { Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findHomeVisit, findTask, rupiah } from '../lib/data'
import { HomeMitraCard, TagihanCard } from '../lib/home-card'
import { paidOf, store, useApp, type MetWith } from '../lib/store'
import { Chip, ChipGroup, HOME_STEP_LABELS, SectionTitle, StepBar } from '../lib/ui'

const WHO: { value: MetWith; title: string; description: string }[] = [
  { value: 'mitra', title: 'Mitra sendiri', description: 'Bisa langsung menagih' },
  {
    value: 'pj',
    title: 'Keluarga / penanggung jawab',
    description: 'Titipan dan janji bayar tetap dicatat atas nama mitra',
  },
  { value: 'nobody', title: 'Tidak ada orang', description: 'Tidak ada pembayaran hari ini' },
]

// Why she can't pay, when you did reach someone.
const PAY_REASONS = [
  'Usaha sedang sepi',
  'Ada kebutuhan mendesak',
  'Sakit / keluarga sakit',
  'Menolak bayar',
]

// Why nobody was there. These are the ones that change what ops does next —
// relocation and death both open a different case entirely, so the sheet asks
// for a new address when the answer is "pindah".
const ABSENT_REASONS = [
  'Sedang bekerja',
  'Pergi tanpa kabar',
  'Pindah rumah',
  'Meninggal dunia',
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
  const visit = findHomeVisit(s.openHome)
  const mitra = visit.mitra
  const task = findTask(visit.id)

  const met = s.metWith[mitra.id]
  const refusal = s.nonPayments[mitra.id]
  const paid = paidOf(s, mitra)

  // Nobody home means no money changed hands, so there is nothing to choose
  // between: the outcome is forced to "tidak" and the mode list is not drawn.
  const absent = met === 'nobody'
  const mode = s.payMode[mitra.id]
  const reasons = absent ? ABSENT_REASONS : PAY_REASONS

  // Everything the BP touches writes straight to the store. There is no draft
  // and no "Simpan" — with the options inline, what is on screen IS the record,
  // and a save button would imply the page might not be keeping up.
  function pick(next: 'penuh' | 'sebagian' | 'tidak') {
    store.setPayMode(mitra.id, next)
    if (next === 'penuh') store.setPayment(mitra.id, mitra.due, mitra.due)
  }

  function pickReason(value: string) {
    store.setNonPayment(mitra.id, { reason: value, ptp: refusal?.ptp ?? null })
  }

  function pickPtp(value: string | null) {
    store.setNonPayment(mitra.id, { reason: refusal?.reason ?? '', ptp: value })
  }

  const shortfall = mitra.due - paid

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={
            <span className="flex flex-col">
              <span className="text-16 font-bold text-default">{mitra.name}</span>
              <span className="text-12 font-regular text-caption">
                Selasa, {task?.time ?? '—'}
              </span>
            </span>
          }
          onBack={() => flow.back()}
        />
      }
    >
      <StepBar current={1} labels={HOME_STEP_LABELS} />

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
      <TagihanCard mitra={mitra} reason={task?.reason ?? ''} />

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

      {/* --- The outcome, inline. Same three options as the majelis sheet, in
          the same order — only the container differs. Same controls whether it
          was her or her family, too: what gets recorded is the money and the
          promise, not who handed them over. */}
      {met && !absent ? (
        <>
          <SectionTitle>Pembayaran</SectionTitle>
          <div className="flex flex-col gap-8">
            <SelectableCard
              name="mode-tagih"
              inputType="radio"
              title="Bayar Penuh"
              description={rupiah(mitra.due)}
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
                store.setPayment(mitra.id, Number(e.target.value.replace(/\D/g, '')) || 0, mitra.due)
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

            {/* Same rule as the majelis sheet: a balance is only a record once
                it has a date. Asked only once money is actually on file — an
                empty amount field has no "sisa" to promise. */}
            {paid > 0 && shortfall > 0 ? (
              <ChipGroup label="Janji bayar sisanya">
                {PTP_OPTIONS.map((option) => (
                  <Chip
                    key={option.label}
                    selected={
                      s.partialPtp[mitra.id] !== undefined &&
                      s.partialPtp[mitra.id] === option.value
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
          are the same two: why, and when to come back. When nobody was home the
          three-option list above is not drawn at all — an empty house cannot
          hand over money, so there is nothing to choose between. */}
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

      <div className="sticky bottom-0 -mx-16 mt-auto border-t border-default bg-neutral-white p-16">
        <Button size="lg" className="w-full" disabled={!met} onClick={() => flow.go('home-proof')}>
          Lanjut
        </Button>
      </div>
    </Screen>
  )
}
