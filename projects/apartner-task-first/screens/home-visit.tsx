'use client'

// Step 1 of 2 — Temui & Tagih.
//
// A home visit branches more than a majelis stop: the team's flowchart runs
// met-mitra? → can-pay? → full/partial → reason → PTP → Peldis, and in parallel
// not-present → met-PJ? → titipan? → PJ-PTP?, and met-neighbour? if not. The
// homepage-IA direction renders that faithfully as fourteen stacked questions.
// This direction takes the same decision tree and asks it in two places:
//
//   ON THE PAGE — the facts that are simply true when you arrive:
//     1. Who answered the door? (mitra / keluarga / nobody)
//     2. Did she pay in full? (one tap, no sheet — the good case stays cheap)
//
//   IN THE SHEET — everything that has to be negotiated:
//     the partial amount, the reason, the promise-to-pay date, the new address.
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
// behind, so there is nothing to upsell — the one honest offer is Peldis, which
// settles a bad loan rather than selling anything, and it lives inline here as
// a recommendation the app raises when she is eligible.

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
import { findHomeVisit, findTask, PELDIS_DPD, rupiah } from '../lib/data'
import { IconCheck } from '../lib/icons'
import { HomeMitraCard } from '../lib/home-card'
import { paidOf, paymentStatus, remainingOf, store, useApp, type MetWith } from '../lib/store'
import { HOME_STEP_LABELS, SectionTitle, StepBar } from '../lib/ui'

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

type SheetMode = 'bayar' | 'tidak'

export function HomeVisitScreen() {
  const flow = useFlow()
  const s = useApp()
  const visit = findHomeVisit(s.openHome)
  const mitra = visit.mitra
  const task = findTask(visit.id)

  const met = s.metWith[mitra.id]
  const status = paymentStatus(s, mitra)
  const refusal = s.nonPayments[mitra.id]
  const peldisDone = s.peldis.includes(mitra.id)

  // Sheet state is deliberately local: it must not survive navigation.
  const [sheetOpen, setSheetOpen] = useState(false)
  const [mode, setMode] = useState<SheetMode>('bayar')
  const [draft, setDraft] = useState('')
  const [reason, setReason] = useState<string | null>(null)
  const [ptp, setPtp] = useState<string | null | undefined>(undefined)
  const [address, setAddress] = useState('')

  // Nobody home means no money changed hands, so the sheet has one job.
  const absent = met === 'nobody'
  const reasons = absent ? ABSENT_REASONS : PAY_REASONS

  function openSheet(forced?: SheetMode) {
    const existing = s.nonPayments[mitra.id]
    setMode(absent ? 'tidak' : (forced ?? (existing ? 'tidak' : 'bayar')))
    setDraft(String(remainingOf(s, mitra)))
    setReason(existing?.reason ?? null)
    setPtp(existing ? existing.ptp : undefined)
    setAddress('')
    setSheetOpen(true)
  }

  function save() {
    if (mode === 'tidak') {
      if (!reason) return
      const note = reason === 'Pindah rumah' && address ? `${reason} → ${address}` : reason
      store.setNonPayment(mitra.id, { reason: note, ptp: ptp ?? null })
    } else {
      const entered = Number(draft.replace(/\D/g, '')) || 0
      store.setPayment(mitra.id, paidOf(s, mitra) + entered)
    }
    setSheetOpen(false)
  }

  const entered = Number(draft.replace(/\D/g, '')) || 0
  const overpay = entered - remainingOf(s, mitra)

  // What the BP has recorded so far, read back in her own terms.
  const outcomeLine =
    status === 'lunas'
      ? `Lunas · ${rupiah(paidOf(s, mitra))}`
      : status === 'sebagian'
        ? `${rupiah(paidOf(s, mitra))} · kurang ${rupiah(remainingOf(s, mitra))}`
        : status === 'tidak'
          ? `${refusal?.reason}${refusal?.ptp ? ` · janji ${refusal.ptp}` : ''}`
          : null

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
        reason={task?.reason ?? ''}
        onOpen={() => {
          store.openMitraPage(mitra.id)
          flow.go('mitra')
        }}
      />

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

      {/* --- The outcome. Same controls whether it was her or her family: what
          gets recorded is the money and the promise, not who handed them over. */}
      {met && !absent ? (
        <>
          <SectionTitle>Pembayaran</SectionTitle>
          <Card>
            {outcomeLine ? (
              <div className="flex items-center gap-8">
                <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-500">
                  <IconCheck size={20} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-12 text-caption">Tercatat</span>
                  <span className="truncate text-14 font-bold text-default">{outcomeLine}</span>
                </div>
                <Button size="sm" variant="ghost" className="h-40" onClick={() => openSheet()}>
                  Ubah
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-12 text-caption">Tagihan</span>
                  <span className="truncate text-18 font-bold text-default">
                    {rupiah(mitra.due)}
                  </span>
                </div>
                <Button size="sm" variant="outline" className="h-40" onClick={() => openSheet()}>
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
            )}
          </Card>
        </>
      ) : null}

      {/* --- Nobody home. No payment is possible, so the only thing left to
          record is why, and when to come back. One button, one sheet. */}
      {absent ? (
        <>
          <SectionTitle>Catatan kunjungan</SectionTitle>
          <Card>
            {outcomeLine ? (
              <div className="flex items-center gap-8">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-12 text-caption">Tercatat</span>
                  <span className="truncate text-14 font-bold text-default">{outcomeLine}</span>
                </div>
                <Button size="sm" variant="ghost" className="h-40" onClick={() => openSheet()}>
                  Ubah
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-12">
                <span className="text-12 text-caption">
                  Catat alasan dan kapan akan dikunjungi lagi, supaya kunjungan hari ini tidak
                  hilang begitu saja.
                </span>
                <Button size="sm" className="h-40 w-full" onClick={() => openSheet('tidak')}>
                  Catat alasan &amp; jadwal ulang
                </Button>
              </div>
            )}
          </Card>
        </>
      ) : null}

      {/* --- Peldis. The one offer this flow makes, and it is a collection
          outcome: settle the principal and close a loan that is 60+ days down.
          The app raises it because it already knows she is eligible — the BP
          should not have to remember a threshold. */}
      {mitra.dpd >= PELDIS_DPD && status !== 'lunas' ? (
        peldisDone ? (
          <div className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-green-50 text-green-500">
              <IconCheck size={20} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-14 font-bold text-default">Peldis diajukan</span>
              <span className="text-12 text-caption">Diteruskan ke BM untuk persetujuan</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-12 rounded-12 border border-primary-200 bg-primary-50 p-12">
            <div className="flex flex-col gap-2">
              <span className="text-14 font-bold text-default">Tawarkan Peldis</span>
              <span className="text-12 text-caption">
                Menunggak {mitra.dpd} hari — mitra berhak melunasi dengan membayar pokok saja.
                Pengajuan diteruskan ke BM.
              </span>
            </div>
            <Button size="sm" className="h-40 w-full" onClick={() => store.submitPeldis(mitra.id)}>
              Ajukan Peldis
            </Button>
          </div>
        )
      ) : null}

      <div className="sticky bottom-0 -mx-16 mt-auto border-t border-default bg-neutral-white p-16">
        <Button size="lg" className="w-full" disabled={!met} onClick={() => flow.go('home-proof')}>
          Lanjut
        </Button>
      </div>

      {/* --- The negotiated part. When someone was home the sheet still opens
          on the mode switch; when nobody was, that switch is gone — there is
          no partial payment to record from an empty house. */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        size="md"
        title={absent ? 'Catatan kunjungan' : 'Catatan pembayaran'}
        description={mitra.name}
        primaryAction={
          <Button className="w-full" disabled={mode === 'tidak' && !reason} onClick={save}>
            Simpan
          </Button>
        }
        secondaryAction={
          <Button className="w-full" variant="ghost" onClick={() => setSheetOpen(false)}>
            Batal
          </Button>
        }
      >
        <div className="flex flex-col gap-12">
          {!absent ? (
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
          ) : null}

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
                <span className="text-12 font-bold text-default">
                  {absent ? 'Kenapa tidak ada di rumah?' : 'Alasan belum bayar'}
                </span>
                {reasons.map((option) => (
                  <SelectableCard
                    key={option}
                    name="alasan"
                    inputType="radio"
                    title={option}
                    checked={reason === option}
                    onChange={() => setReason(option)}
                  />
                ))}
              </div>

              {/* Relocation is the one reason that needs more than a label —
                  an address is what turns "pindah" into something ops can act
                  on rather than a dead end. */}
              {reason === 'Pindah rumah' ? (
                <Input
                  label="Alamat baru (jika diketahui)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  helperText="Kosongkan jika belum tahu — akan dibuat tugas pelacakan."
                />
              ) : null}

              {reason !== 'Meninggal dunia' ? (
                <div className="flex flex-col gap-8">
                  <span className="text-12 font-bold text-default">
                    {absent ? 'Kunjungan ulang' : 'Janji bayar'}
                  </span>
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
              ) : null}
            </>
          )}
        </div>
      </BottomSheet>
    </Screen>
  )
}
