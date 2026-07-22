'use client'

// Setoran Harian — the close of the day, and the only task that is not a visit.
//
// The BP has spent the day taking physical money from women in their homes and
// at balai. This screen is where it leaves her: she transfers the day's cash to
// the branch VA and records that she did. Nothing here is a payment rail — the
// confirmation is self-reported, exactly as it is in the field, where the app
// cannot see a bank transfer either.
//
// Two things this direction can do that a mocked-up deposit screen cannot, and
// they are the reason it is worth building here at all:
//
// 1. THE AMOUNT IS DERIVED. Every rupiah was recorded against a named mitra in a
//    named pelayanan, so the total is built from the day's work rather than
//    typed from a notebook. And it counts only CASH: a mitra who settled through
//    the app paid the company directly, and folding her into the deposit is how
//    a BP ends up short at the counter with nothing to show for it.
//
// 2. THE SELISIH IS A FIRST-CLASS OUTCOME. The app's figure and the money in the
//    bag disagree more often than a happy-path screen admits — a mitra was
//    Rp 5.000 short, an amount was mistyped, something got spent. So the BP
//    confirms or edits, and a difference must carry a reason before it can be
//    submitted. Same rule as "tidak bayar" in the collection stage: a gap with a
//    reason is a record ops can chase, and a gap with nowhere to put it becomes
//    a phone call.

import { useState } from 'react'
import { Badge, Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { DEPOSIT } from '../lib/schedule'
import { IconCamera, IconCheck, IconWallet } from '../lib/icons'
import {
  depositDiff,
  depositDigital,
  depositEntries,
  depositExpected,
  store,
  useApp,
} from '../lib/store'
import { Chip, ChipGroup, IconTile, ProofTile, SectionTitle, StickyBar } from '../lib/ui'

// Why her figure and the app's disagree. Fixed list for the same reason every
// other reason list in this direction is fixed: ops needs a column it can sort,
// and the BP is standing at a counter, not writing a report.
const DIFF_REASONS = [
  'Salah catat nominal',
  'Mitra bayar kurang dari yang dicatat',
  'Uang terpakai dulu',
  'Ada setoran susulan',
  'Belum tahu — akan dicek',
]

export function DepositScreen() {
  const flow = useFlow()
  const s = useApp()

  const entries = depositEntries(s)
  const expected = depositExpected(s)
  const digital = depositDigital(s)
  const amount = s.depositAmount ?? expected
  const diff = depositDiff(s)

  // Typing is opt-in. The default gesture is agreeing with the app.
  const [editing, setEditing] = useState(false)

  const needsReason = diff !== 0 && !s.depositDiffReason
  const ready = amount > 0 && s.depositProof && !needsReason

  // --- Submitted. Deliberately not "Selesai": she has handed over cash and
  // cannot prove it landed. The branch confirms, and that is tomorrow.
  if (s.depositDone) {
    return (
      <Screen topBar={<NavigationHeader title="Setoran Harian" hideBack />}>
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
              <IconCheck size={24} />
            </span>
            <span className="text-20 font-bold text-default">Setoran terkirim</span>
            <span className="text-24 font-bold text-default">{rupiah(amount)}</span>
            <span className="text-12 text-caption">
              Sedang diverifikasi cabang. Kamu akan dapat notifikasi begitu masuk.
            </span>
          </div>
        </Card>

        {diff !== 0 ? (
          <div className="flex flex-col gap-2 rounded-12 border border-orange-200 bg-orange-50 p-12">
            <span className="text-14 font-bold text-orange-500">
              Selisih {diff > 0 ? 'lebih' : 'kurang'} {rupiah(Math.abs(diff))}
            </span>
            <span className="text-12 text-caption">
              {s.depositDiffReason} · cabang akan menghubungi kamu untuk mencocokkan.
            </span>
          </div>
        ) : null}

        <StickyBar>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              store.finishTask()
              flow.go('today')
            }}
          >
            Selesai
          </Button>
        </StickyBar>
      </Screen>
    )
  }

  return (
    <Screen
      topBar={<NavigationHeader title="Setoran Harian" onBack={() => flow.back()} />}
    >
      {/* --- What she is carrying. One number, and what it is NOT. */}
      <Card>
        <div className="flex items-center gap-12">
          <IconTile tint="green">
            <IconWallet size={20} />
          </IconTile>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-caption">Uang tunai yang harus disetor</span>
            <span className="text-24 font-bold text-default">{rupiah(expected)}</span>
          </div>
        </div>
        {digital > 0 ? (
          <p className="mt-8 rounded-8 bg-neutral-50 px-12 py-8 text-12 text-caption">
            {rupiah(digital)} sudah masuk lewat aplikasi mitra — tidak perlu kamu setor.
          </p>
        ) : null}
        <p className="mt-8 text-right text-10 text-disabled">Batas setor {DEPOSIT.due}</p>
      </Card>

      {/* --- Where it came from. Every line traces back to a pelayanan the BP
          ran today, which is what makes disagreeing with the total actionable:
          she knows which group to re-open. */}
      <SectionTitle>Rincian</SectionTitle>
      {entries.length > 0 ? (
        <div className="rounded-12 bg-neutral-white">
          {entries.map((e, i) => (
            <div
              key={e.taskId}
              className={`flex items-center gap-12 px-12 py-12 ${i === 0 ? '' : 'border-t border-default'}`}
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-14 font-bold text-default">{e.label}</span>
                <span className="truncate text-12 text-caption">{e.detail}</span>
              </div>
              <span className="shrink-0 text-14 font-bold text-default">{rupiah(e.cash)}</span>
            </div>
          ))}
          <div className="flex items-center gap-12 border-t border-default bg-neutral-50 px-12 py-12">
            <span className="flex-1 text-14 font-bold text-default">Total</span>
            <span className="text-18 font-bold text-default">{rupiah(expected)}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-12 bg-neutral-white p-12">
          <span className="text-14 font-bold text-default">Belum ada penagihan tunai</span>
          <span className="text-12 text-caption">
            Selesaikan pelayanan hari ini dulu — setoran dihitung dari hasilnya.
          </span>
        </div>
      )}

      {/* --- Where it goes. */}
      <SectionTitle>Tujuan Setoran</SectionTitle>
      <Card>
        <div className="flex items-center gap-12">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-caption">{DEPOSIT.bank}</span>
            <span className="truncate text-18 font-bold text-default">{DEPOSIT.va}</span>
            <span className="truncate text-12 text-caption">{DEPOSIT.holder}</span>
          </div>
        </div>
      </Card>

      {/* --- What she actually handed over. Agreeing is a tap; disagreeing is
          deliberate, and carries a reason. */}
      <SectionTitle>Jumlah yang Disetor</SectionTitle>
      {editing ? (
        <>
          <Input
            label="Jumlah disetor"
            prefix="Rp"
            inputMode="numeric"
            value={amount ? String(amount) : ''}
            onChange={(e) => store.setDepositAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
            helperText={
              diff === 0
                ? 'Sama dengan catatan aplikasi'
                : `${diff > 0 ? 'Lebih' : 'Kurang'} ${rupiah(Math.abs(diff))} dari catatan aplikasi`
            }
            state={diff === 0 ? 'valid' : 'default'}
          />
          {diff !== 0 ? (
            <ChipGroup label="Alasan selisih">
              {DIFF_REASONS.map((reason) => (
                <Chip
                  key={reason}
                  selected={s.depositDiffReason === reason}
                  onClick={() => store.setDepositDiffReason(reason)}
                >
                  {reason}
                </Chip>
              ))}
            </ChipGroup>
          ) : null}
        </>
      ) : (
        <Card>
          <div className="flex items-center gap-12">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-18 font-bold text-default">{rupiah(amount)}</span>
              <span className="text-12 text-caption">Sesuai catatan aplikasi</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              Ubah
            </Button>
          </div>
        </Card>
      )}

      {/* --- Proof, the same gesture as every visit today. */}
      <SectionTitle>Bukti Transfer</SectionTitle>
      <div className="flex gap-8">
        <ProofTile
          done={s.depositProof}
          label="Foto Bukti Transfer"
          doneLabel="Bukti tersimpan"
          icon={<IconCamera size={24} />}
          onClick={() => store.setDepositProof(!s.depositProof)}
        />
      </div>

      <StickyBar>
        {diff !== 0 && s.depositDiffReason ? (
          <div className="flex justify-center">
            <Badge intent="orange">
              Selisih {diff > 0 ? 'lebih' : 'kurang'} {rupiah(Math.abs(diff))}
            </Badge>
          </div>
        ) : null}
        {!ready ? (
          <span className="text-center text-12 font-bold text-orange-500">
            {amount <= 0
              ? 'Belum ada jumlah yang disetor'
              : needsReason
                ? 'Pilih alasan selisih dulu'
                : 'Foto bukti transfer belum diambil'}
          </span>
        ) : null}
        <Button
          size="lg"
          className="w-full"
          disabled={!ready}
          onClick={() => store.submitDeposit()}
        >
          Saya Sudah Setor
        </Button>
      </StickyBar>
    </Screen>
  )
}
