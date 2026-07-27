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
// The screen is one stepped page, top to bottom, in the order the act happens:
//
//   1. WHAT is in the bag — the total, and the pelayanan it came from.
//   2. HOW MUCH of it to put down now — she confirms or edits the figure.
//   3. WHICH ROAD — a VA she transfers to, or an AmarthaLink agent she hands
//      the cash to. The receipt number (a VA, or a kode unik) appears inside
//      the road she picks, because a code with no chosen destination is a
//      number she cannot use yet.
//   4. PROOF — the same photo gesture as every visit, and it only appears once
//      there is a method for it to be proof OF.
//
// The confirm is gated on all three: an amount, a method, and the photo. The
// header carries a Riwayat link onto the day's cash story — what came in, what
// went out, and by which road — because a BP mid-settlement is exactly the
// person who wants to check what she already put down.

import { useState } from 'react'
import { Badge, Button, Card, InputNominal, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { AGENT, DEPOSIT, TASKS, agentCodeFor, vaFor } from '../lib/schedule'
import { IconCamera, IconCheck, IconInfo, IconWallet } from '../lib/icons'
import {
  freeSettlementsLeft,
  settledTotal,
  store,
  unsettledEntries,
  unsettledTotal,
  useApp,
} from '../lib/store'
import {
  IconTile,
  OptionCard,
  ProofTile,
  SectionTitle,
  SettlementHistorySheet,
  StickyBar,
} from '../lib/ui'

export function SettlementScreen() {
  const flow = useFlow()
  const s = useApp()

  const entries = unsettledEntries(s)
  const expected = unsettledTotal(s)
  const amount = s.depositAmount ?? expected
  const diff = amount - expected

  // Which settlement this will be, and whether it is the last one available.
  const no = s.settlements.length + 1
  // The last handover of the day, in the only sense left now that the count is
  // uncapped: nothing on the schedule can still take cash.
  const closing = TASKS.every((t) => s.doneTasks.includes(t.id))
  const va = vaFor(no)
  const code = agentCodeFor(no)

  // Typing is opt-in. The default gesture is agreeing with the app.
  const [editing, setEditing] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  // Three gates now, in the order the page asks them: an amount, a road for it
  // to travel, and the photo that proves it went. The difference used to demand
  // a reason from a fixed list — but she is standing at a counter having already
  // transferred, and the five options were guesses the app offered on her
  // behalf. The GAP is still recorded; what it was for is a conversation.
  const ready = amount > 0 && Boolean(s.depositMethod) && s.depositProof

  const hint =
    amount <= 0
      ? 'Belum ada jumlah yang disetor'
      : !s.depositMethod
        ? 'Pilih metode setoran dulu'
        : !s.depositProof
          ? s.depositMethod === 'agent'
            ? 'Foto struk agen belum diambil'
            : 'Foto bukti transfer belum diambil'
          : null

  // --- Nothing left to hand over. Either she has settled everything already,
  // or the day has not banked any cash yet. Both are honest empty states, and
  // neither is a form.
  if (entries.length === 0) {
    return (
      <Screen
        topBar={
          <NavigationHeader
            title="Setoran"
            onBack={() => flow.back()}
            link="Riwayat"
            onLinkClick={() => setHistoryOpen(true)}
          />
        }
      >
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
            {s.settlements.length > 0 ? (
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="text-12 font-bold text-link"
              >
                Lihat riwayat setoran
              </button>
            ) : null}
          </div>
        </Card>

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

        <SettlementHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />
      </Screen>
    )
  }

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={`Setoran ${no}`}
          onBack={() => flow.back()}
          link="Riwayat"
          onLinkClick={() => setHistoryOpen(true)}
        />
      }
    >
      {/* The fee, said once and up front. It is the only thing left that makes
          the COUNT matter now that there is no cap: settling often is the whole
          point, and this is the cost of doing it a fourth time — a fact to
          weigh, not a rule to obey. */}
      <div className="flex items-start gap-8 rounded-8 border border-blue-200 bg-blue-50 px-12 py-8">
        <span className="shrink-0 text-blue-500">
          <IconInfo size={16} />
        </span>
        <span className="min-w-0 flex-1 text-12 text-default">
          Admin fee settlement hanya gratis {DEPOSIT.freePerDay}x per hari.
          {freeSettlementsLeft(s) > 0
            ? ` Sisa ${freeSettlementsLeft(s)}x gratis hari ini.`
            : ' Setoran ini kena biaya admin.'}
        </span>
      </div>

      {/* --- What she is carrying. The figure she CAN put down — she chooses
          how much of it to settle now. */}
      <Card>
        <div className="flex items-center gap-12">
          <IconTile tint="green">
            <IconWallet size={20} />
          </IconTile>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-caption">Uang tunai yang bisa disetor</span>
            <span className="text-24 font-bold text-default">{rupiah(expected)}</span>
          </div>
          <Badge intent={closing ? 'orange' : 'neutral'}>
            {closing ? 'Setoran terakhir' : `Setoran ke-${no}`}
          </Badge>
        </div>
        <p className="mt-8 text-right text-10 text-disabled">Batas setor {DEPOSIT.due}</p>
      </Card>

      {/* --- How much to put down now. Agreeing is a tap; settling less is
          deliberate, and the remainder stays in the bag for a later handover. */}
      <SectionTitle>Jumlah yang Disetor</SectionTitle>
      {editing ? (
        <InputNominal
          label="Jumlah disetor"
          value={amount ? String(amount) : ''}
          onValueChange={(digits) => store.setDepositAmount(Number(digits) || 0)}
          helperText={
            diff === 0
              ? 'Sama dengan catatan aplikasi'
              : `${diff > 0 ? 'Lebih' : 'Kurang'} ${rupiah(Math.abs(diff))} dari catatan aplikasi`
          }
        />
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

      {/* --- Which road the cash takes. The receipt number lives INSIDE the road
          she picks: a VA she transfers to from her own banking, or a kode unik
          she reads out at an AmarthaLink agent. Each is fresh per settlement, so
          the branch can tell three handovers apart at the other end. */}
      <SectionTitle>Metode Setoran</SectionTitle>
      <div className="flex flex-col gap-8">
        <OptionCard
          selected={s.depositMethod === 'va'}
          title="Transfer ke Virtual Account"
          description="Setor lewat mobile banking ke VA cabang"
          onSelect={() => store.setDepositMethod('va')}
        >
          <div className="flex flex-col gap-2 rounded-8 bg-neutral-white p-12">
            <span className="text-12 text-caption">{DEPOSIT.bank}</span>
            <span className="truncate text-18 font-bold text-default">{va}</span>
            <span className="truncate text-12 text-caption">{DEPOSIT.holder}</span>
            <span className="mt-4 text-10 text-disabled">
              Nomor VA khusus setoran ke-{no} hari ini — jangan pakai nomor setoran sebelumnya.
            </span>
          </div>
        </OptionCard>

        <OptionCard
          selected={s.depositMethod === 'agent'}
          title={`Setor tunai ke Agen ${AGENT.name}`}
          description="Serahkan uang tunai ke agen terdekat pakai kode unik"
          onSelect={() => store.setDepositMethod('agent')}
        >
          <div className="flex flex-col gap-2 rounded-8 bg-neutral-white p-12">
            <span className="text-12 text-caption">Kode Unik · Agen {AGENT.name}</span>
            <span className="truncate text-18 font-bold text-default">{code}</span>
            <span className="mt-4 text-10 text-disabled">{AGENT.hint}</span>
          </div>
        </OptionCard>
      </div>

      {/* --- Proof, the same gesture as every visit today. It only appears once
          she has picked a road — it is proof that the cash went by THAT road, so
          before there is one there is nothing to photograph. */}
      {s.depositMethod ? (
        <>
          <SectionTitle>{s.depositMethod === 'agent' ? 'Bukti Setor' : 'Bukti Transfer'}</SectionTitle>
          <div className="flex gap-8">
            <ProofTile
              done={s.depositProof}
              label={s.depositMethod === 'agent' ? 'Foto Struk Agen' : 'Foto Bukti Transfer'}
              doneLabel="Bukti tersimpan"
              icon={<IconCamera size={24} />}
              onClick={() => store.setDepositProof(!s.depositProof)}
            />
          </div>
        </>
      ) : null}

      <StickyBar>
        {/* The difference, and — when she is settling less than she holds —
            what it LEAVES. A short handover is not a discrepancy to explain
            afterwards, it is cash still in her bag, and the honest thing to
            say before she taps is that it will still be there. */}
        {diff !== 0 ? (
          <div className="flex flex-col items-center gap-4">
            <Badge intent="orange">
              Selisih {diff > 0 ? 'lebih' : 'kurang'} {rupiah(Math.abs(diff))}
            </Badge>
            {diff < 0 ? (
              <span className="text-10 text-caption">
                Sisa {rupiah(-diff)} tetap tercatat belum disetor
              </span>
            ) : null}
          </div>
        ) : null}
        {hint ? (
          <span className="text-center text-12 font-bold text-orange-500">{hint}</span>
        ) : null}
        {/* Straight back to the schedule, whether or not it cleared the bag.
            The day is where a settlement ends; if there is still cash, the
            widget is waiting there saying so. */}
        <Button
          size="lg"
          className="w-full"
          disabled={!ready}
          onClick={() => {
            store.settle(closing)
            flow.go('today')
          }}
        >
          Saya Sudah Setor {rupiah(amount)}
        </Button>
      </StickyBar>

      <SettlementHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </Screen>
  )
}
