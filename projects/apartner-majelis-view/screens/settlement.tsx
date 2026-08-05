'use client'

// Setoran — where the cash leaves her hands.
//
// Separate from Closing, which is the checklist that ends the DAY. This screen
// is about the BAG: the money she is carrying right now and the transfer that
// gets it to the branch. She reaches it twice from the schedule's widget, and a
// third time through Closing's titipan check — three doors onto one act.
//
// A day carries at most three settlements, and no more — there is no clock on
// it, only the count. That cap is the shape of the risk from both sides: a BP
// holding six hours of collections on a motorbike wants to put money down
// often, but every handover is a reconciliation the branch has to clear, so
// three is the balance.
//
// The screen is one stepped page, top to bottom, in the order the act happens:
//
//   1. WHAT is in the bag — the total she is carrying, and where it came from.
//   2. WHICH of it to put down now — she TICKS the tasks, and the mitra inside
//      a majelis she has a roster for, whose cash goes in this handover. The
//      amount is the sum of what she ticks; leaving some unticked leaves it in
//      the bag for a later drop.
//   3. WHICH ROAD — a VA she transfers to, or an AmarthaLink agent she hands
//      the cash to. Picking a road is all this step does; the number that road
//      actually uses lives on the NEXT step, together with the proof, because
//      that is the moment she needs it — reading it here and again there would
//      be the same number twice before she can act on either showing.
//   4. THE NUMBER, AND PROOF — one sheet, combined: the VA (or kode unik) she
//      transfers/hands cash to, and the camera gesture that proves it went,
//      slot for slot. She reaches it by tapping Lanjut, not by confirming she
//      has already sent anything — the sending happens FROM this sheet.
//
// "Lanjut" is gated on a chosen amount and a method. The header carries a
// Riwayat link onto the day's cash story — what came in, what went out, and by
// which road — because a BP mid-settlement is exactly the person who wants to
// check what she already put down.

import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  BottomSheet,
  Button,
  Card,
  NavigationHeader,
} from '@/design-system/components'
import { ChevronDown, ChevronUp } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { AGENT, DEPOSIT, agentCodeFor, splitDeposit, vaFor } from '../lib/schedule'
import { IconCamera, IconCheck, IconInfo, IconPin, IconWallet } from '../lib/icons'
import {
  settledTotal,
  settlementsLeft,
  settleableSources,
  store,
  unsettledEntries,
  unsettledTotal,
  useApp,
} from '../lib/store'
import { AppScreen, IconTile, OptionCard, SectionTitle, SettlementHistorySheet, StickyBar } from '../lib/ui'

export function SettlementScreen() {
  const flow = useFlow()
  const s = useApp()

  const entries = unsettledEntries(s)
  const expected = unsettledTotal(s)

  // What she can pick from: the day's unsettled cash, broken down as far as it
  // can be selected — a majelis with a roster into its cash payers, everything
  // else as one line.
  const sources = settleableSources(s)
  const allKeys = useMemo(
    () => sources.flatMap((g) => g.leaves.map((l) => l.key)),
    [sources],
  )
  const cashOf = useMemo(() => {
    const m = new Map<string, number>()
    sources.forEach((g) => g.leaves.forEach((l) => m.set(l.key, l.cash)))
    return m
  }, [sources])

  // Everything ticked by default: agreeing is a tap, and settling the whole bag
  // is the common case. We track what she UNTICKS, not what she picks — so a
  // source is selected until she says otherwise, which also means cash that
  // populates after mount (a state control, a late render) comes in ticked
  // rather than stranded off.
  const [deselected, setDeselected] = useState<Set<string>>(() => new Set())
  const isOn = (key: string) => !deselected.has(key)
  const toggle = (key: string) =>
    setDeselected((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  const setGroup = (keys: string[], on: boolean) =>
    setDeselected((prev) => {
      const next = new Set(prev)
      keys.forEach((k) => (on ? next.delete(k) : next.add(k)))
      return next
    })

  // Which majelis are opened to their mitra. Closed by default — the common
  // case is settling whole groups, and seven rosters expanded at once is a wall
  // of names between her and the method she came here to pick.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const toggleExpand = (taskId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })

  // The nominal she is settling: the sum of what is still ticked.
  const amount = allKeys.reduce((sum, k) => (isOn(k) ? sum + (cashOf.get(k) ?? 0) : sum), 0)
  const diff = amount - expected

  // Which settlement this will be within the day's three.
  const no = s.settlements.length + 1
  const code = agentCodeFor(no)
  // The VA road splits into two transfers to two numbers; the agent road takes
  // the whole amount at one counter. The split is derived from the figure she
  // is settling, so ticking more re-splits both halves.
  const va1 = vaFor(no, 1)
  const va2 = vaFor(no, 2)
  const [vaAmount1, vaAmount2] = splitDeposit(amount)

  const [historyOpen, setHistoryOpen] = useState(false)
  // Proof is captured AFTER she confirms she has transferred — the sheet that
  // opens on "Saya Sudah Setor" — not as an inline step that gates the button.
  const [proofOpen, setProofOpen] = useState(false)

  // Two gates to REACH the confirm: something ticked, and a road for it to
  // travel. The photo that proves it went is asked afterwards, in the sheet the
  // button opens, because she uploads it having already transferred.
  const ready = amount > 0 && Boolean(s.depositMethod)

  const hint =
    amount <= 0
      ? 'Pilih minimal satu yang mau disetor'
      : !s.depositMethod
        ? 'Pilih metode setoran dulu'
        : null

  // --- Nothing left to hand over. Either she has settled everything already,
  // or the day has not banked any cash yet. Both are honest empty states, and
  // neither is a form.
  if (entries.length === 0) {
    return (
      <AppScreen
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
      </AppScreen>
    )
  }

  // --- The three handovers are used up, and there is still cash in the bag.
  // Not a form: there is no fourth settlement to fill in. The money that
  // remains rides to closing, and the honest thing is to say so rather than
  // offer a button that cannot fire.
  if (s.settlements.length >= DEPOSIT.maxPerDay) {
    return (
      <AppScreen
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
      </AppScreen>
    )
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={`Setoran ${no}`}
          onBack={() => flow.back()}
          link="Riwayat"
          onLinkClick={() => setHistoryOpen(true)}
        />
      }
    >
      {/* Just the count she has left today — the fact she paces against. */}
      <div className="flex items-start gap-8 rounded-8 border border-blue-200 bg-blue-50 px-12 py-8">
        <span className="shrink-0 text-blue-500">
          <IconInfo size={16} />
        </span>
        <span className="min-w-0 flex-1 text-12 text-default">
          Sisa {settlementsLeft(s)}x setoran hari ini.
        </span>
      </div>

      {/* --- The figure THIS handover is worth, and it moves with the ticks.
          It used to print the whole bag, which meant unticking a mitra changed
          the button at the bottom of the page and nothing at the top — the one
          number she is reading while she picks stayed still while the decision
          underneath it changed. The bag is still shown, but demoted to the line
          that says what the picked figure came OUT of, and only while the two
          disagree. */}
      <Card>
        <div className="flex items-center gap-12">
          <IconTile tint="green">
            <IconWallet size={20} />
          </IconTile>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 text-caption">Jumlah yang akan disetor</span>
            <span className="text-24 font-bold text-default">{rupiah(amount)}</span>
          </div>
          <Badge intent="neutral">Setoran ke-{no}</Badge>
        </div>
      </Card>

      {/* --- Which cash goes in THIS handover. She ticks the tasks, and the
          mitra inside a majelis she has a roster for; the amount is the sum of
          what is ticked. Everything starts ticked — settling the whole bag is
          the common case — and unticking leaves that cash for a later drop. */}
      <SectionTitle>Pilih yang mau disetor</SectionTitle>
      <div className="flex flex-col gap-8">
        {sources.map((g) => {
          const keys = g.leaves.map((l) => l.key)
          const allOn = keys.every((k) => isOn(k))
          const someOn = keys.some((k) => isOn(k))
          // What THIS group contributes to the handover: the ticked leaves, not
          // the group's whole cash. Collapsed, that figure is the only thing
          // saying a majelis is partly in — so it has to be the picked sum.
          const picked = g.leaves.reduce((sum, l) => sum + (isOn(l.key) ? l.cash : 0), 0)
          const open = expanded.has(g.taskId)
          return (
            <Card key={g.taskId}>
              {g.perMitra ? (
                <div className="flex flex-col gap-12">
                  {/* The majelis line: tick it to take the whole group, or open
                      it to pick the women inside. The two live on one row and
                      do different things, so the checkbox is its own hit target
                      and the rest of the row opens the group. */}
                  <div className="flex items-center gap-12">
                    <CheckBox
                      checked={allOn}
                      partial={someOn && !allOn}
                      onToggle={() => setGroup(keys, !allOn)}
                    />
                    <button
                      type="button"
                      onClick={() => toggleExpand(g.taskId)}
                      aria-expanded={open}
                      className="flex min-w-0 flex-1 items-center gap-8 text-left"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-10 font-bold uppercase text-caption">
                          {g.kindLabel}
                        </span>
                        <span className="truncate text-14 font-bold text-default">{g.title}</span>
                      </span>
                      <span className="shrink-0 text-14 font-bold text-default">
                        {rupiah(picked)}
                      </span>
                      <span className="shrink-0 text-caption">
                        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>
                  </div>
                  {/* The mitra inside. Collapsed by default: seven groups of
                      five women is a wall of names, and the common case is
                      settling whole groups. Opening one is how she gets to the
                      woman whose money is staying in the bag. */}
                  {open ? (
                    <div className="flex flex-col gap-8 border-t border-light pl-36 pt-12">
                      {g.leaves.map((l) => (
                        <SelectRow
                          key={l.key}
                          label={l.name ?? g.title}
                          cash={l.cash}
                          checked={isOn(l.key)}
                          onToggle={() => toggle(l.key)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                /* No roster to open — but the SAME line as a majelis, because
                   these are peers in one list: a source of cash she is either
                   putting down or not. Only the chevron differs, and the space
                   it would occupy is held open so every amount on the list
                   lands on one right edge. */
                <div className="flex items-center gap-12">
                  <CheckBox
                    checked={allOn}
                    onToggle={() => setGroup(keys, !allOn)}
                  />
                  <button
                    type="button"
                    onClick={() => setGroup(keys, !allOn)}
                    className="flex min-w-0 flex-1 items-center gap-8 text-left"
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-10 font-bold uppercase text-caption">
                        {g.kindLabel}
                      </span>
                      <span className="truncate text-14 font-bold text-default">{g.title}</span>
                    </span>
                    <span className="shrink-0 text-14 font-bold text-default">
                      {rupiah(picked)}
                    </span>
                    <span className="h-16 w-16 shrink-0" aria-hidden />
                  </button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* --- Which road the cash takes. Just the choice — the VA numbers and
          the kode unik that road actually uses live on the NEXT step, together
          with the proof that it went, because showing them here too would put
          the same number in front of her twice before she can act on either
          showing. */}
      <SectionTitle>Metode Setoran</SectionTitle>
      <div className="flex flex-col gap-8">
        <OptionCard
          selected={s.depositMethod === 'va'}
          title="Transfer ke Virtual Account"
          description="Setor lewat mobile banking ke 2 VA cabang"
          onSelect={() => store.setDepositMethod('va')}
        />

        <OptionCard
          selected={s.depositMethod === 'agent'}
          title={`Setor tunai ke Agen ${AGENT.name}`}
          description="Serahkan seluruh uang tunai ke agen terdekat pakai kode unik"
          onSelect={() => store.setDepositMethod('agent')}
        >
          {/* The kode unik itself waits for the next step, but WHERE to walk it
              to is a step-1 question — she may want to check there is a counter
              on her route before she commits to this road at all. */}
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
        {/* When she has left some of the bag unticked, say what stays behind.
            A short handover is not a discrepancy — it is cash still in her bag —
            and the honest thing before she taps is that it will still be there. */}
        {diff < 0 ? (
          <span className="text-center text-10 text-caption">
            Sisa {rupiah(-diff)} tetap tercatat belum disetor
          </span>
        ) : null}
        {hint ? (
          <span className="text-center text-12 font-bold text-orange-500">{hint}</span>
        ) : null}
        {/* Lanjut, not a confirm — the sheet it opens is where the number
            appears and where she actually sends the money, so this button
            can't claim she's already done that. It settles the bag and drops
            her back on the schedule once every proof slot is filled. */}
        <Button
          size="lg"
          className="w-full"
          disabled={!ready}
          onClick={() => setProofOpen(true)}
        >
          Lanjut
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
          // Record the picked nominal, then settle it: the store reads
          // depositAmount, so setting it here is what makes the handover the
          // sum she ticked rather than the whole bag.
          store.setDepositAmount(amount)
          store.settle(false)
          flow.go('today')
        }}
      />

      <SettlementHistorySheet open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </AppScreen>
  )
}

// --- ProofSheet ------------------------------------------------------------
// Where the VA/kode unik and the bukti finally live together. She reaches it
// by tapping Lanjut, not by confirming she has already sent anything — this
// sheet is where the number appears and where she sends the money, so it
// cannot open on a claim that jumped ahead of what she's actually done.
//
// The VA road asks for TWO photos, one per transfer, because the amount left in
// two transfers to two different VA numbers and the branch reconciles each on
// its own — a single screenshot cannot prove both. The agent road is one
// counter, one struk, so it asks once. Konfirmasi Setoran stays disabled until
// every slot the chosen road needs is filled.

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

// One selectable line in the "pilih yang mau disetor" list: a checkbox, the
// name (a mitra, or a whole task), and its cash on the right. The whole row is
// the tap target, so she never has to hit the small box.
/**
 * The tick on its own, as a hit target of its own. On a majelis line it has to
 * be separable from the rest of the row: tapping the name opens the group,
 * tapping the box takes the whole thing, and one control doing both would make
 * "show me the mitra" and "settle all of them" the same gesture.
 *
 * `partial` is the state a collapsed group needs most — some women ticked, some
 * not. Neither empty nor full says that, and a collapsed group that reads as
 * fully selected when it isn't is how the wrong amount gets sent.
 */
function CheckBox({
  checked,
  partial,
  onToggle,
}: {
  checked: boolean
  partial?: boolean
  onToggle: () => void
}) {
  const on = checked || partial
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={partial ? 'mixed' : checked}
      onClick={onToggle}
      className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-8 border ${
        on
          ? 'border-primary-500 bg-primary-500 text-neutral-white'
          : 'border-neutral-400 bg-neutral-white'
      }`}
    >
      {partial ? (
        <span className="h-2 w-12 rounded-full bg-neutral-white" />
      ) : checked ? (
        <IconCheck size={16} />
      ) : null}
    </button>
  )
}

function SelectRow({
  label,
  cash,
  checked,
  onToggle,
}: {
  label: string
  cash: number
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center gap-12 text-left"
    >
      <span
        className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-8 border ${
          checked
            ? 'border-primary-500 bg-primary-500 text-neutral-white'
            : 'border-neutral-400 bg-neutral-white'
        }`}
      >
        {checked ? <IconCheck size={16} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate text-14 text-default">{label}</span>
      <span className="shrink-0 text-14 font-bold text-default">{rupiah(cash)}</span>
    </button>
  )
}
