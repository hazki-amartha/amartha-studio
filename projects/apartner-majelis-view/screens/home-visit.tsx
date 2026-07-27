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

import {
  Button,
  Card,
  InputNominal,
  NavigationHeader,
  SelectableCard,
} from '@/design-system/components'
import { Image as ImageIcon } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { SHORTFALL_REASONS } from '../lib/collect-options'
import { outstandingOf, rupiah } from '../lib/data'
import { AngsuranCard, JanjiBayarCard } from '../lib/mitra-card'
import { DAYS } from '../lib/schedule'
import {
  openHomeMitra,
  openHomeTask,
  paidOf,
  store,
  useApp,
  type PayMode,
} from '../lib/store'
import {
  Chip,
  ChipGroup,
  HOME_STAGE_LABELS,
  ProofTile,
  SectionTitle,
  StageBar,
  StickyBar,
} from '../lib/ui'

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

// Why she is leaving the program. "Meninggal" and "pindah tanpa kabar" are the
// two that open a case ops has to pick up rather than a promise to chase — which
// is the whole reason a drop-out is its own outcome and not a heavier "tidak".
const DROPOUT_REASONS = [
  'Usaha bangkrut',
  'Pindah tanpa kabar',
  'Menolak melanjutkan',
  'Meninggal dunia',
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
  const dropReason = s.dropOut[mitra.id]
  const shortfall = owed.total - paid

  // The Lanjut gate: a picked outcome must be COMPLETE before the visit moves
  // on. Penuh and tanggung renteng are done on the tap; the other three each
  // carry a follow-up — an amount, a reason — that the record isn't whole
  // without. No mode picked at all is not a recorded outcome either.
  // A payment made before she arrived is a CLAIM until the screenshot is
  // attached — the money is real, but nothing in the system has seen it yet.
  const poketProven = Boolean(s.poketProof[mitra.id])
  const poketReason = s.shortfallReasons[mitra.id]
  // A Poket payment short of the bill leaves the same balance a short cash one
  // does, so it needs the same two answers before the visit moves on.
  const poketShort = mode === 'poket' && paid > 0 && paid < owed.total
  const outcomeDone =
    mode === 'penuh' || mode === 'tanggung'
      ? true
      : mode === 'poket'
        ? poketProven &&
          paid > 0 &&
          (!poketShort || (Boolean(poketReason) && s.partialPtp[mitra.id] !== undefined))
        : mode === 'sebagian'
          ? paid > 0
          : mode === 'tidak'
            ? Boolean(refusal?.reason)
            : mode === 'keluar'
              ? Boolean(dropReason)
              : false

  function pick(next: PayMode) {
    store.setPayMode(mitra.id, next)
    // Switching away from a drop-out retracts it — the outcomes are exclusive.
    if (next !== 'keluar') store.clearDropOut(mitra.id)
    // Penuh and tanggung renteng both settle the whole bill; they differ only in
    // who funded it, which the mode itself records.
    if (next === 'penuh' || next === 'tanggung') store.collect(mitra, owed.total)
    // Paid through Poket: the field OPENS on the full bill and is editable from
    // there, because she pays what she has through the app. The mode keeps it
    // out of the day's cash; the amount, the proof and — if it fell short — the
    // reason and the janji are taken below.
    if (next === 'poket') store.recordPoket(mitra, owed.total)
    if (next === 'tidak') store.setNonPayment(mitra, { reason: refusal?.reason ?? '', ptp: null })
    if (next === 'keluar') store.setDropOut(mitra, dropReason ?? '')
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
          onBack={() => flow.back()}
        />
      }
    >
      <StageBar current={2} labels={HOME_STAGE_LABELS} />

      {/* The recent cycle on grey over the bill on white — the same AngsuranCard
          the mitra page and the majelis tagih flow open on, so a doorstep
          collection reads the same as a majelis one. No "Lihat Semua" here: with
          a mitra in front of her the full ledger is not a place to wander off. */}
      <AngsuranCard mitra={mitra} />

      {/* The promise she is being held to — dated the visit day. Sits with the
          bill because it is the figure the BP negotiates against. */}
      <JanjiBayarCard mitra={mitra} date={DAYS[0].date} />

      {/* --- The outcome, inline. Same three results the majelis collect page
          offers, in the same order — and the same controls whether it was her
          or her family, since what gets recorded is the money and the promise,
          not who handed them over. */}
      {met ? (
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
            {/* The group covering her arrears — the outcome a collections door
                exists to reach. Full settlement, funded by tanggung renteng
                rather than by the mitra, so it sits between paying and not.
                GL only: joint liability is what the G in GL is. A Modal loan is
                hers alone, and offering the group as a payer on her door would
                record a settlement no group ever agreed to. */}
            {mitra.product === 'GL' ? (
              <SelectableCard
                name="mode-tagih"
                inputType="radio"
                title="Tanggung Renteng"
                description="Tunggakan ditanggung kelompok"
                checked={mode === 'tanggung'}
                onChange={() => pick('tanggung')}
              />
            ) : null}
            {/* Not a payment she is taking — one she is catching up with. The
                mitra paid through Poket days ago and the system has not
                updated, which happens often enough that without this row the BP
                either books cash she never received or leaves a woman in the
                queue owing money she has already handed over. */}
            <SelectableCard
              name="mode-tagih"
              inputType="radio"
              title="Sudah Bayar via Poket"
              description="Sudah dibayar, sistem belum ter-update"
              checked={mode === 'poket'}
              onChange={() => pick('poket')}
            />
            <SelectableCard
              name="mode-tagih"
              inputType="radio"
              title="Tidak Bayar"
              description="Catat alasan dan janji bayar"
              checked={mode === 'tidak'}
              onChange={() => pick('tidak')}
            />
            {/* Not a payment and not a promise — she is leaving. Kept last, so
                the outcomes read from best to worst down the list. */}
            <SelectableCard
              name="mode-tagih"
              inputType="radio"
              title="Drop Out"
              description="Mitra berhenti dari program"
              checked={mode === 'keluar'}
              onChange={() => pick('keluar')}
            />
          </div>
        </>
      ) : null}

      {/* A one-tap settlement, so it reads back what got recorded and who paid
          it — the whole bill, closed by the group rather than by her. */}
      {met && mode === 'tanggung' ? (
        <Card>
          <div className="flex flex-col gap-4">
            <span className="text-12 text-caption">Ditanggung kelompok</span>
            <span className="text-20 font-bold text-default">{rupiah(owed.total)}</span>
            <span className="text-12 text-caption">
              Tanggung renteng menutup seluruh tagihan {mitra.name} hari ini.
            </span>
          </div>
        </Card>
      ) : null}

      {/* How much reached Poket, what backs it, and — if it did not cover the
          bill — why and when the rest comes. The amount is TYPED, opening on the
          full bill: she pays what she has through the app, and a locked figure
          would make the BP record money that was never paid just to get the
          transaction on file. */}
      {met && mode === 'poket' ? (
        <>
          <InputNominal
            label="Jumlah dibayar via Poket"
            value={paid > 0 ? String(paid) : ''}
            onValueChange={(digits) => store.collect(mitra, Number(digits) || 0, poketReason)}
            helperText={
              paid === 0
                ? 'Masukkan jumlah yang sudah dibayar'
                : shortfall > 0
                  ? `Sisa ${rupiah(shortfall)} — catat alasan dan janji bayar di bawah.`
                  : shortfall < 0
                    ? `Lebih ${rupiah(-shortfall)} dari tagihan`
                    : 'Lunas — sama dengan tagihan penuh'
            }
          />

          <SectionTitle>Bukti pembayaran</SectionTitle>
          <Card>
            <div className="flex flex-col gap-12">
              <div className="flex">
                <ProofTile
                  done={poketProven}
                  label="Unggah bukti"
                  doneLabel="Bukti terlampir"
                  icon={<ImageIcon size={24} />}
                  onClick={() => store.setPoketProof(mitra.id, !poketProven)}
                />
              </div>
              <span className="text-12 text-caption">
                Pembayaran sudah masuk tapi belum tercatat di sistem.
              </span>
            </div>
          </Card>

          {poketShort ? (
            <Card>
              <div className="flex flex-col gap-12">
                <ChipGroup label="Alasan kurang bayar">
                  {SHORTFALL_REASONS.map((option) => (
                    <Chip
                      key={option}
                      selected={poketReason === option}
                      onClick={() => store.collect(mitra, paid, option)}
                    >
                      {option}
                    </Chip>
                  ))}
                </ChipGroup>

                {/* Asked once there is a reason: a promise with nothing attached
                    to it is not a record of anything. */}
                {poketReason ? (
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
        </>
      ) : null}

      {/* A drop-out carries only a reason — the flag ops picks the case up from.
          "Just a flag": no janji, no amount, one answer. */}
      {met && mode === 'keluar' ? (
        <>
          <SectionTitle>Alasan drop out</SectionTitle>
          <Card>
            <ChipGroup label="Alasan berhenti">
              {DROPOUT_REASONS.map((option) => (
                <Chip
                  key={option}
                  selected={dropReason === option}
                  onClick={() => store.setDropOut(mitra, option)}
                >
                  {option}
                </Chip>
              ))}
            </ChipGroup>
          </Card>
        </>
      ) : null}

      {/* The amount is typed straight into the record — no draft, no Simpan.
          It sits on the page rather than inside a Card: `InputNominal` is a
          tile with its own border, and a bordered tile inside a bordered card
          is the same edge drawn twice. The janji keeps its card below, where
          it is a separate question rather than part of the figure. */}
      {met && mode === 'sebagian' ? (
        <>
          <InputNominal
            label="Jumlah diterima"
            value={paid > 0 ? String(paid) : ''}
            onValueChange={(digits) => store.collect(mitra, Number(digits) || 0)}
            helperText={
              paid === 0
                ? 'Masukkan jumlah yang diterima'
                : shortfall > 0
                  ? `Sisa ${rupiah(shortfall)} — buat janji bayar untuk sisanya di bawah.`
                  : shortfall < 0
                    ? `Lebih ${rupiah(-shortfall)} dari tagihan`
                    : 'Sama dengan tagihan penuh'
            }
          />

          {/* A balance is only a record once it has a date. Asked only once
              money is actually on file — an empty field has no sisa. */}
          {paid > 0 && shortfall > 0 ? (
            <Card>
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
            </Card>
          ) : null}
        </>
      ) : null}

      {/* --- A recorded no: she was reached but did not pay. The two remaining
          questions are why, and when she promises to. */}
      {met && mode === 'tidak' ? (
        <>
          <SectionTitle>Alasan belum bayar</SectionTitle>
          <Card>
            <div className="flex flex-col gap-12">
              <ChipGroup label="Alasan">
                {PAY_REASONS.map((option) => (
                  <Chip
                    key={option}
                    selected={refusal?.reason === option}
                    onClick={() => pickReason(option)}
                  >
                    {option}
                  </Chip>
                ))}
              </ChipGroup>

              {/* Asked only once there is a reason: a promise with nothing
                  attached to it is not a record of anything. */}
              {refusal?.reason ? (
                <ChipGroup label="Janji bayar">
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
        <Button
          size="lg"
          className="w-full"
          disabled={!outcomeDone}
          onClick={() => flow.go('home-proof')}
        >
          Lanjut
        </Button>
      </StickyBar>
    </Screen>
  )
}
