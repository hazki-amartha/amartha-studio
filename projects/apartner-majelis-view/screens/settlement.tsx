'use client'

// Setoran — where the cash leaves her hands.
//
// Separate from Closing, which is the checklist that ends the DAY. This screen
// is about the BAG: the money she is carrying right now and the transfer that
// gets it to the branch. She reaches it twice from the schedule's widget, and a
// third time through Closing's titipan check — three doors onto one act.
//
// A day carries at most three settlements, and no more: two she times herself
// from the schedule, and a last one that clears the bag at the end. That cap is
// the shape of the risk from both sides — a BP holding six hours of collections
// on a motorbike wants to put money down often, but every handover is a
// reconciliation the branch has to clear, so three is the balance. The counter
// shuts at 17.00; the last of the three also waits on every task being finished,
// so a final drop never settles a bag a late majelis hasn't finished filling.
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
// The confirm is gated on an amount, a method, and the photo — and, on the last
// of the day's three, on every task being finished as well. The
// header carries a Riwayat link onto the day's cash story — what came in, what
// went out, and by which road — because a BP mid-settlement is exactly the
// person who wants to check what she already put down.

import { useEffect, useState } from 'react'
import {
  Badge,
  BottomSheet,
  Button,
  Card,
  InputNominal,
  NavigationHeader,
} from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { AGENT, DEPOSIT, TASKS, agentCodeFor, splitDeposit, vaFor } from '../lib/schedule'
import { IconCamera, IconCheck, IconInfo, IconPin, IconWallet } from '../lib/icons'
import {
  settledTotal,
  settlementsLeft,
  store,
  unsettledEntries,
  unsettledTotal,
  useApp,
} from '../lib/store'
import {
  IconTile,
  OptionCard,
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

  // Which settlement this will be within the day's three.
  const no = s.settlements.length + 1
  // The last of the three — the one that clears the bag at the end of the day.
  // It carries an extra gate: it cannot be sent until every task on the day is
  // finished, because a final handover that skipped a still-open visit would
  // settle a bag that has not finished filling. The first two are hers to time.
  const isLast = no >= DEPOSIT.maxPerDay
  const allTasksDone = TASKS.every((t) => s.doneTasks.includes(t.id))
  const lastBlocked = isLast && !allTasksDone
  const code = agentCodeFor(no)
  // The VA road splits into two transfers to two numbers; the agent road takes
  // the whole amount at one counter. The split is derived from the figure she
  // is settling, so editing the total re-splits both halves.
  const va1 = vaFor(no, 1)
  const va2 = vaFor(no, 2)
  const [vaAmount1, vaAmount2] = splitDeposit(amount)

  // Typing is opt-in. The default gesture is agreeing with the app.
  const [editing, setEditing] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  // Proof is captured AFTER she confirms she has transferred — the sheet that
  // opens on "Saya Sudah Setor" — not as an inline step that gates the button.
  const [proofOpen, setProofOpen] = useState(false)

  // Two gates to REACH the confirm: an amount and a road for it to travel. The
  // photo that proves it went is asked afterwards, in the sheet the button
  // opens, because she uploads it having already transferred — so it is the
  // last thing she does, not a step that blocks her from starting. The
  // difference used to demand a reason from a fixed list; the GAP is still
  // recorded, but what it was for is a conversation.
  const ready = amount > 0 && Boolean(s.depositMethod) && !lastBlocked

  const hint = lastBlocked
    ? 'Selesaikan semua tugas hari ini dulu sebelum setoran terakhir'
    : amount <= 0
      ? 'Belum ada jumlah yang disetor'
      : !s.depositMethod
        ? 'Pilih metode setoran dulu'
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

  // --- The three handovers are used up, and there is still cash in the bag.
  // Not a form: there is no fourth settlement to fill in. The money that
  // remains rides to closing, and the honest thing is to say so rather than
  // offer a button that cannot fire.
  if (s.settlements.length >= DEPOSIT.maxPerDay) {
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
            <span className="flex h-48 w-48 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <IconWallet size={24} />
            </span>
            <span className="text-20 font-bold text-default">Setoran hari ini sudah penuh</span>
            <span className="text-12 text-caption">
              {DEPOSIT.maxPerDay}x setoran sudah dikirim hari ini. Sisa {rupiah(expected)} tetap
              tercatat dan disetor saat Tutup Hari Ini.
            </span>
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="text-12 font-bold text-link"
            >
              Lihat riwayat setoran
            </button>
          </div>
        </Card>

        <StickyBar>
          <Button size="lg" className="w-full" onClick={() => flow.go('today')}>
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
      {/* The rules, said once and up front. Three handovers a day, no more — the
          count she has left is a fact to pace against — and after 17.00 only one
          drop remains, so a late-afternoon BP settles once and settles all of
          it. On the last of the three it says the extra rule instead: that it
          waits on every task being finished. */}
      <div className="flex items-start gap-8 rounded-8 border border-blue-200 bg-blue-50 px-12 py-8">
        <span className="shrink-0 text-blue-500">
          <IconInfo size={16} />
        </span>
        <span className="min-w-0 flex-1 text-12 text-default">
          {lastBlocked
            ? 'Setoran terakhir. Selesaikan semua tugas hari ini dulu sebelum mengirim.'
            : isLast
              ? 'Setoran terakhir hari ini.'
              : `Setoran maksimal ${DEPOSIT.maxPerDay}x per hari — sisa ${settlementsLeft(s)}x. Setelah pukul ${DEPOSIT.cutoff} hanya bisa 1x setoran lagi.`}
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
          <Badge intent={isLast ? 'orange' : 'neutral'}>
            {isLast ? 'Setoran terakhir' : `Setoran ke-${no}`}
          </Badge>
        </div>
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

      {/* --- Which road the cash takes, and how the amount is split to travel it.
          The VA road caps per transfer, so it goes as TWO transfers to two VA
          numbers; the agent road takes the whole sum at one counter, so it stays
          one figure and one kode unik. The amount anchors to the method she
          picks — that is why nothing shows until she picks one. */}
      <SectionTitle>Metode Setoran</SectionTitle>
      <div className="flex flex-col gap-8">
        <OptionCard
          selected={s.depositMethod === 'va'}
          title="Transfer ke Virtual Account"
          description="Setor lewat mobile banking ke 2 VA cabang"
          onSelect={() => store.setDepositMethod('va')}
        >
          <div className="flex flex-col gap-8 rounded-8 bg-neutral-white p-12">
            <span className="text-12 text-caption">{DEPOSIT.bank} · {DEPOSIT.holder}</span>
            {[
              { label: 'Transfer 1 dari 2', va: va1, amount: vaAmount1 },
              { label: 'Transfer 2 dari 2', va: va2, amount: vaAmount2 },
            ].map((row) => (
              <div key={row.label} className="flex flex-col gap-2 border-t border-default pt-8 first:border-t-0 first:pt-0">
                <span className="text-10 font-bold uppercase text-caption">{row.label}</span>
                <div className="flex items-center gap-8">
                  <span className="min-w-0 flex-1 truncate text-16 font-bold text-default">{row.va}</span>
                  <span className="shrink-0 text-14 font-bold text-primary-500">{rupiah(row.amount)}</span>
                </div>
              </div>
            ))}
            <span className="text-10 text-disabled">
              Dua nomor VA berbeda — pastikan nominal tiap transfer sesuai.
            </span>
          </div>
        </OptionCard>

        <OptionCard
          selected={s.depositMethod === 'agent'}
          title={`Setor tunai ke Agen ${AGENT.name}`}
          description="Serahkan seluruh uang tunai ke agen terdekat pakai kode unik"
          onSelect={() => store.setDepositMethod('agent')}
        >
          <div className="flex flex-col gap-8 rounded-8 bg-neutral-white p-12">
            <div className="flex items-center gap-8">
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-12 text-caption">Kode Unik · Agen {AGENT.name}</span>
                <span className="truncate text-18 font-bold text-default">{code}</span>
              </div>
              <span className="shrink-0 text-14 font-bold text-primary-500">{rupiah(amount)}</span>
            </div>
            <span className="text-10 text-disabled">{AGENT.hint}</span>
          </div>
          {/* The code is useless without a counter to read it out at, so the way
              to FIND one sits right under it — the one thing this road needs
              that the VA road does not. */}
          <button
            type="button"
            onClick={() => flow.go('agent-locator')}
            className="flex items-center justify-center gap-4 rounded-8 border border-primary-500 py-8 text-12 font-bold text-primary-500"
          >
            <IconPin size={16} />
            Cari agen terdekat
          </button>
        </OptionCard>
      </div>

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
        {/* Confirming she has transferred opens the proof sheet — she uploads
            the bukti there, then it settles the bag and drops her back on the
            schedule. The day is where a settlement ends; if there is still
            cash, the widget is waiting there saying so. */}
        <Button
          size="lg"
          className="w-full"
          disabled={!ready}
          onClick={() => setProofOpen(true)}
        >
          Saya Sudah Setor {rupiah(amount)}
        </Button>
      </StickyBar>

      {/* Proof, the same camera gesture as every visit today — but for the VA
          road it asks TWICE, one bukti per transfer, because the money left in
          two transfers to two different numbers and the branch reconciles each
          separately. Only after every slot is filled does the bag settle. */}
      <ProofSheet
        open={proofOpen}
        onClose={() => setProofOpen(false)}
        method={s.depositMethod}
        transfers={[
          { label: 'Transfer 1 dari 2', va: va1, amount: vaAmount1 },
          { label: 'Transfer 2 dari 2', va: va2, amount: vaAmount2 },
        ]}
        agent={{ name: AGENT.name, code, amount }}
        onConfirm={() => {
          setProofOpen(false)
          store.settle(isLast)
          flow.go('today')
        }}
      />

      <SettlementHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </Screen>
  )
}

// --- ProofSheet ------------------------------------------------------------
// The bukti, moved off the page and behind the confirm. She taps "Saya Sudah
// Setor" once the money has actually left her banking app, and THEN uploads the
// receipt — so proof is the last gesture, not a step blocking her from starting.
//
// The VA road asks for TWO photos, one per transfer, because the amount left in
// two transfers to two different VA numbers and the branch reconciles each on
// its own — a single screenshot cannot prove both. The agent road is one
// counter, one struk, so it asks once. The confirm stays disabled until every
// slot the chosen road needs is filled.

interface Transfer {
  label: string
  va: string
  amount: number
}

function ProofSheet({
  open,
  onClose,
  method,
  transfers,
  agent,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  method: 'va' | 'agent' | null
  /** The two VA transfers, each proved by its own photo. */
  transfers: Transfer[]
  /** The single agent handover, proved by the struk. */
  agent: { name: string; code: string; amount: number }
  onConfirm: () => void
}) {
  // One boolean per slot. Two are ever used (the VA road); the agent road only
  // reads the first. Local to the sheet: it is captured moments before the bag
  // settles and the screen navigates away, so it never needs to survive a trip.
  const [proofs, setProofs] = useState<[boolean, boolean]>([false, false])

  // Fresh every time it opens — a sheet dismissed and reopened for the same
  // settlement starts its capture over, and a new settlement never inherits the
  // last one's ticks.
  useEffect(() => {
    if (open) setProofs([false, false])
  }, [open])

  const toggle = (i: 0 | 1) =>
    setProofs((p) => (i === 0 ? [!p[0], p[1]] : [p[0], !p[1]]))

  const isAgent = method === 'agent'
  const total = isAgent ? 1 : 2
  const done = proofs.slice(0, total).filter(Boolean).length
  const ready = done === total

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isAgent ? 'Bukti Setor' : 'Bukti Transfer'}
      description={
        isAgent
          ? `Foto struk dari Agen ${agent.name} sebagai bukti setor tunai.`
          : 'Foto bukti transfer untuk masing-masing nomor Virtual Account.'
      }
      size="md"
      secondaryAction={
        <Button variant="outline" size="lg" className="w-full" onClick={onClose}>
          Batal
        </Button>
      }
      primaryAction={
        <Button size="lg" className="w-full" disabled={!ready} onClick={onConfirm}>
          Konfirmasi Setoran
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        {isAgent ? (
          <CaptureRow
            label={`Kode Unik · Agen ${agent.name}`}
            code={agent.code}
            amount={agent.amount}
            done={proofs[0]}
            onClick={() => toggle(0)}
          />
        ) : (
          transfers.map((t, i) => (
            <CaptureRow
              key={t.label}
              label={t.label}
              code={t.va}
              amount={t.amount}
              done={proofs[i as 0 | 1]}
              onClick={() => toggle(i as 0 | 1)}
            />
          ))
        )}

        {/* Progress, not an alarm. Two transfers need two receipts, so the
            count says how far along she is; a single-slot agent handover has
            nothing to pace, so it shows none. */}
        {!isAgent ? (
          <span className="pt-4 text-center text-12 text-caption">
            {done} dari {total} bukti terunggah
          </span>
        ) : null}
      </div>
    </BottomSheet>
  )
}

// One capture as a single tappable row: the destination it proves on the left —
// which transfer, its VA number and its share of the amount — and the camera on
// the right, which turns into a green tick once the receipt is attached. The
// whole row is the target, so the tap area is the card, not just the icon.
function CaptureRow({
  label,
  code,
  amount,
  done,
  onClick,
}: {
  label: string
  code: string
  amount: number
  done: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={done ? `Ganti foto untuk ${label}` : `Ambil foto untuk ${label}`}
      className={`flex w-full items-center gap-12 rounded-12 border p-12 text-left ${
        done ? 'border-green-500 bg-green-50' : 'border-default bg-neutral-white'
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-10 font-bold uppercase text-caption">{label}</span>
        <span className="truncate text-14 font-bold text-default">{code}</span>
        <span className="text-12 text-caption">
          {done ? 'Bukti tersimpan' : rupiah(amount)}
        </span>
      </span>
      <span
        className={`flex h-48 w-48 shrink-0 items-center justify-center rounded-12 ${
          done ? 'bg-green-500 text-neutral-white' : 'bg-primary-50 text-primary-500'
        }`}
      >
        {done ? <IconCheck size={24} /> : <IconCamera size={24} />}
      </span>
    </button>
  )
}
