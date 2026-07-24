'use client'

// Setoran — where the cash leaves her hands.
//
// Separate from Closing, which is the checklist that ends the DAY. This screen
// is about the BAG: the money she is carrying right now and the transfer that
// gets it to the branch. She reaches it twice from the schedule's widget, and a
// third time through Closing's titipan check — three doors onto one act.
//
// A day can carry up to three settlements: two she times herself from the
// schedule, and a third that IS the closing task. That is not a convenience —
// it is the shape of the risk. A BP holding six hours of collections on a
// motorbike is the largest exposure in this flow, and the answer is to let her
// put the money down twice before 17.45 rather than once at the end of it.
//
// Two rules hold the model together:
//
// 1. A SETTLEMENT TAKES EVERYTHING. There is no amount to choose. Partial
//    handovers would need the app to hold an opinion about which rupiah in her
//    bag belongs to which pelayanan — which it cannot check and she cannot
//    separate — and a BP free to pick the number is a BP who can be asked why
//    she picked it. What she chooses is WHEN, and that is the whole choice.
//
// 2. EACH ONE GETS ITS OWN VA. A virtual account is what the branch reconciles
//    against, so three transfers to one number are three deposits nobody can
//    tell apart at the other end. The number on screen is the receipt.
//
// The selisih flow survives unchanged, because the disagreement it exists for
// does not go away when the handovers get smaller: the app's figure and the
// money in the bag differ, and a gap with a reason is a record ops can chase
// while a gap with nowhere to put it becomes a phone call.

import { useState } from 'react'
import { Badge, Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { DEPOSIT, taskCode, vaFor } from '../lib/schedule'
import { IconCamera, IconCheck, IconWallet } from '../lib/icons'
import {
  depositDigital,
  midDayUsed,
  settledTotal,
  store,
  unsettledEntries,
  unsettledTotal,
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

export function SettlementScreen() {
  const flow = useFlow()
  const s = useApp()

  const entries = unsettledEntries(s)
  const expected = unsettledTotal(s)
  const digital = depositDigital(s)
  const amount = s.depositAmount ?? expected
  const diff = amount - expected

  // Which settlement this will be, and whether it is the last one available.
  const no = s.settlements.length + 1
  // The last available handover: both mid-day slots spent, so this one is
  // the third and it belongs to the day's close.
  const closing = midDayUsed(s) >= DEPOSIT.maxMidDay
  const va = vaFor(no)

  // Typing is opt-in. The default gesture is agreeing with the app.
  const [editing, setEditing] = useState(false)

  const needsReason = diff !== 0 && !s.depositDiffReason
  const ready = amount > 0 && s.depositProof && !needsReason

  // --- Nothing left to hand over. Either she has settled everything already,
  // or the day has not banked any cash yet. Both are honest empty states, and
  // neither is a form.
  if (entries.length === 0) {
    return (
      <Screen topBar={<NavigationHeader title="Setoran" onBack={() => flow.back()} />}>
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="flex h-48 w-48 items-center justify-center rounded-full bg-green-50 text-green-500">
              <IconCheck size={24} />
            </span>
            <span className="text-20 font-bold text-default">
              {s.settlements.length > 0 ? 'Semua setoran sudah dikirim' : 'Belum ada uang tunai'}
            </span>
            <span className="text-12 text-caption">
              {s.settlements.length > 0
                ? `${rupiah(settledTotal(s))} disetor dalam ${s.settlements.length} kali hari ini.`
                : 'Selesaikan pelayanan hari ini dulu — setoran dihitung dari hasilnya.'}
            </span>
          </div>
        </Card>

        {s.settlements.length > 0 ? <Riwayat /> : null}

        <StickyBar>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              // Never ticks the day's row. Closing owns that, and it has its
              // own checklist to satisfy first — a settlement that closed the
              // day would skip the check that every visit is finished.
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
    <Screen topBar={<NavigationHeader title={`Setoran ${no}`} onBack={() => flow.back()} />}>
      {/* --- What she is handing over. One number, not a choice. */}
      <Card>
        <div className="flex items-center gap-12">
          <IconTile tint="green">
            <IconWallet size={20} />
          </IconTile>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-caption">Uang tunai yang harus disetor</span>
            <span className="text-24 font-bold text-default">{rupiah(expected)}</span>
          </div>
          <Badge intent={closing ? 'orange' : 'neutral'}>
            {closing ? 'Setoran terakhir' : `Setoran ke-${no}`}
          </Badge>
        </div>
        {digital > 0 ? (
          <p className="mt-8 rounded-8 bg-neutral-50 px-12 py-8 text-12 text-caption">
            {rupiah(digital)} sudah masuk lewat aplikasi mitra — tidak perlu kamu setor.
          </p>
        ) : null}
        <p className="mt-8 text-right text-10 text-disabled">Batas setor {DEPOSIT.due}</p>
      </Card>

      {/* --- Where it came from. Every line traces back to a pelayanan she ran
          today, which is what makes disagreeing with the total actionable: she
          knows which group to re-open. */}
      <SectionTitle>Rincian</SectionTitle>
      <div className="rounded-12 bg-neutral-white">
        {entries.map((e, i) => (
          <div
            key={e.taskId}
            className={`flex items-center gap-12 px-12 py-12 ${i === 0 ? '' : 'border-t border-default'}`}
          >
            <span className="shrink-0 rounded-8 bg-neutral-50 px-8 py-4 text-10 font-bold text-neutral-600">
              {taskCode(e.taskId)}
            </span>
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

      {/* --- Where it goes. A different number every time. */}
      <SectionTitle>Tujuan Setoran</SectionTitle>
      <Card>
        <div className="flex flex-col gap-2">
          <span className="text-12 text-caption">{DEPOSIT.bank}</span>
          <span className="truncate text-18 font-bold text-default">{va}</span>
          <span className="truncate text-12 text-caption">{DEPOSIT.holder}</span>
          <span className="mt-4 text-10 text-disabled">
            Nomor VA khusus setoran ke-{no} hari ini — jangan pakai nomor setoran sebelumnya.
          </span>
        </div>
      </Card>

      {s.settlements.length > 0 ? <Riwayat /> : null}

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
        <Button size="lg" className="w-full" disabled={!ready} onClick={() => store.settle(closing)}>
          Saya Sudah Setor {rupiah(expected)}
        </Button>
      </StickyBar>
    </Screen>
  )
}

/**
 * What has already gone today. It is on this screen rather than only on the
 * schedule because the question it answers is asked HERE — "did I already send
 * the morning's?" — at the moment she is about to send more, and because two
 * transfers to two VAs are two things she may have to prove separately.
 */
function Riwayat() {
  const s = useApp()
  return (
    <>
      <SectionTitle>Setoran hari ini</SectionTitle>
      <div className="rounded-12 bg-neutral-white">
        {s.settlements.map((x, i) => (
          <div
            key={x.no}
            className={`flex items-center gap-12 px-12 py-12 ${i === 0 ? '' : 'border-t border-default'}`}
          >
            <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-500">
              <IconCheck size={16} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-14 font-bold text-default">
                Setoran {x.no} · {x.at}
              </span>
              <span className="truncate text-12 text-caption">
                {x.taskIds.map(taskCode).join(', ')} · VA {x.va}
              </span>
            </div>
            <span className="shrink-0 text-14 font-bold text-default">{rupiah(x.amount)}</span>
          </div>
        ))}
      </div>
    </>
  )
}
