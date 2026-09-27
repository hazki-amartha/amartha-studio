'use client'

// The New Concept setor journey's own vocabulary.
//
// It lives here because FIVE screens draw from it — the payment page, the
// partial page, the two roads (VA and agen) and the riwayat — and the thing
// that must not drift between them is the pair of LEGS: this concept settles to
// two lending entities, each with its own number, its own share of the amount
// and its own status. A leg that reads one way on the VA page and another at the
// agen counter is two different debts as far as the BP can tell.
//
// Nothing here leaves the prototype (CLAUDE.md §3) — the "sudah bayar" controls
// draw their result on the row rather than reaching for a bank.

import { useState, type ReactNode } from 'react'
import { Badge, BottomSheet, Button, Card } from '@/design-system/components'
import {
  ArrowClockwise,
  CalendarDots,
  Check,
  NotePencil,
  ChevronDown,
  ChevronUp,
  Copy,
  Hourglass,
  WarningCircle,
} from '@/design-system/icons'
import { rupiah } from './data'
import { DEPOSIT, splitDeposit, vaFor } from './schedule'
import type { SettleGroup } from './store'
import { IconHome, IconUsers, IconWallet } from './icons'
import { IconTile } from './ui'

/**
 * The two lending entities the day's cash is split between. The split is not
 * cosmetic: each entity reconciles its own half, which is why the number and
 * the status are per-leg rather than per-settlement.
 */
export const SETOR_ENTITIES = ['Amartha Mikro Fintek', 'Amartha Warbler Finance'] as const

/** When the branch stops matching today's numbers. */
export const SETOR_DEADLINE = '21 Juli 2026'

export interface SetorLeg {
  name: string
  /** The account this leg is paid into — a VA on either road. */
  number: string
  amount: number
}

/** The amount broken into the two legs it is actually settled in. */
export const setorLegs = (no: number, amount: number): SetorLeg[] => {
  const [first, second] = splitDeposit(amount)
  return [
    { name: SETOR_ENTITIES[0], number: vaFor(no, 1), amount: first },
    { name: SETOR_ENTITIES[1], number: vaFor(no, 2), amount: second },
  ]
}

// --- SetorSummary ----------------------------------------------------------
// What this handover is worth and where it came from, as the one card that
// opens the journey. "Setoran 1 dari 3" is the pacing fact — the day carries
// three handovers and no more — so it leads, above the figure. "Ubah" is the
// way into setting part of the bag aside: it sits on the figure it changes.

export function SetorSummary({
  no,
  amount,
  pelayanan,
  homeVisit,
  onEdit,
}: {
  no: number
  amount: number
  pelayanan: number
  homeVisit: number
  onEdit?: () => void
}) {
  return (
    <Card>
      <div className="flex items-center gap-12">
        <IconTile tint="green">
          <IconWallet size={20} />
        </IconTile>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-12 text-caption">
            Setoran {no} dari {DEPOSIT.maxPerDay}
          </span>
          <span className="text-20 font-bold text-default">{rupiah(amount)}</span>
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="flex shrink-0 items-center gap-4 text-12 font-bold text-link"
          >
            <NotePencil size={16} />
            Ubah
          </button>
        ) : null}
      </div>
      {/* What the figure is made of, in the two words she counts her day in. */}
      <span className="mt-12 flex items-center gap-8 border-t border-light pt-8 text-12 text-caption">
        <span className="flex items-center gap-4">
          <IconUsers size={16} />
          {pelayanan} Pelayanan
        </span>
        <span>•</span>
        <span className="flex items-center gap-4">
          <IconHome size={16} />
          {homeVisit} Home Visit
        </span>
      </span>
    </Card>
  )
}

// --- LegCard ---------------------------------------------------------------
// The two legs under one heading: the road's name and the total across the top,
// then a row per code carrying its number, its share and where it has got to.
//
// There is no "sudah bayar" button any more: the transfer happens outside this
// app and the BRANCH is what knows it landed, so the page asks — "Perbarui
// Halaman" — rather than taking her word for it.

export function LegCard({
  title,
  amount,
  legs,
  paid,
  onRefresh,
}: {
  title: ReactNode
  amount: number
  legs: SetorLeg[]
  /** How many legs have landed, in order. */
  paid: number
  onRefresh: () => void
}) {
  return (
    <div className="flex flex-col gap-12 rounded-16 bg-neutral-white p-12">
      <div className="flex flex-col items-center gap-2">
        <span className="flex items-center gap-4 text-12 text-default">{title}</span>
        <span className="text-20 font-bold text-default">{rupiah(amount)}</span>
      </div>

      <div className="flex flex-col">
        {legs.map((leg, i) => (
          <div key={leg.number} className="flex flex-col gap-4 border-t border-light py-12">
            <div className="flex items-center gap-8">
              <span className="min-w-0 flex-1 truncate text-12 text-caption">Kode Amartha {i + 1}</span>
              {i < paid ? (
                <Badge intent="green" size="sm" leadingIcon={<Check size={16} />}>
                  Berhasil
                </Badge>
              ) : (
                <Badge intent="yellow" size="sm" leadingIcon={<Hourglass size={16} />}>
                  Menunggu
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-8">
              <span className="flex min-w-0 flex-1 items-center gap-4">
                <span className="truncate text-14 font-bold text-default">{leg.number}</span>
                <span className="shrink-0 text-caption">
                  <Copy size={16} />
                </span>
              </span>
              <span className="shrink-0 text-14 font-bold text-default">{rupiah(leg.amount)}</span>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={onRefresh}>
        <span className="flex items-center justify-center gap-4">
          <ArrowClockwise size={16} />
          Perbarui Halaman
        </span>
      </Button>
    </div>
  )
}

// --- CancelSetor -----------------------------------------------------------
// "Batalkan setoran" at the foot of both roads, and the sheet behind it. Once a
// leg has landed there is nothing left to cancel — the money is at the branch —
// so the link greys out rather than offering to undo a transfer.

export function CancelSetor({ disabled, onCancelled }: { disabled: boolean; onCancelled: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`py-8 text-center text-12 font-bold ${disabled ? 'text-disabled' : 'text-link'}`}
      >
        Batalkan setoran
      </button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        hideClose
        slotPosition="above"
        slot={
          <span className="flex h-120 items-center justify-center rounded-16 bg-primary-50 text-primary-500">
            <CalendarDots size={24} />
          </span>
        }
        title="Batal setor sekarang?"
        description="Jika dibatalkan, Anda perlu ulangi penyetoran dari awal."
        primaryAction={
          <Button
            className="w-full"
            onClick={() => {
              setOpen(false)
              onCancelled()
            }}
          >
            Ya, Batalkan Setoran
          </Button>
        }
        secondaryAction={
          <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
            Lanjutkan Setoran
          </Button>
        }
      />
    </>
  )
}

// --- DeadlineNote ----------------------------------------------------------
// The one warning on both roads: the numbers are per-entity and per-day, so
// paying the right total into the wrong one is a reconciliation the branch
// cannot close.

export function DeadlineNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-8 rounded-8 border border-orange-200 bg-orange-50 px-12 py-8">
      <span className="shrink-0 text-orange-500">
        <WarningCircle size={16} />
      </span>
      <span className="min-w-0 flex-1 text-12 text-default">{children}</span>
    </div>
  )
}

// --- HowList ---------------------------------------------------------------
// The numbered instructions inside a "cara bayar" panel.

export function HowList({ steps }: { steps: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-8">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-8">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-50 text-12 font-bold text-primary-500">
            {i + 1}
          </span>
          <span className="min-w-0 flex-1 text-12 text-default">{step}</span>
        </li>
      ))}
    </ol>
  )
}

// --- PickList --------------------------------------------------------------
// "Setor sebagian": the day's cash as a list of tickable sources, a majelis
// opening into the women inside it. Everything starts ticked — settling the
// whole bag is the common case — and unticking leaves that money for a later
// handover.

export function PickList({
  sources,
  isOn,
  onToggleLeaf,
  onToggleGroup,
  expanded,
  onToggleExpand,
}: {
  sources: SettleGroup[]
  isOn: (key: string) => boolean
  onToggleLeaf: (key: string) => void
  onToggleGroup: (keys: string[], on: boolean) => void
  expanded: (taskId: string) => boolean
  onToggleExpand: (taskId: string) => void
}) {
  return (
    <div className="flex flex-col gap-8">
      {sources.map((g) => {
        const keys = g.leaves.map((l) => l.key)
        const allOn = keys.every((k) => isOn(k))
        const someOn = keys.some((k) => isOn(k))
        // The ticked part of this group, not its whole cash: collapsed, that
        // figure is the only thing saying a majelis is partly in.
        const picked = g.leaves.reduce((sum, l) => sum + (isOn(l.key) ? l.cash : 0), 0)
        const open = expanded(g.taskId)
        return (
          <Card key={g.taskId}>
            <div className="flex flex-col gap-12">
              <div className="flex items-center gap-12">
                <TickBox
                  checked={allOn}
                  partial={someOn && !allOn}
                  onToggle={() => onToggleGroup(keys, !allOn)}
                />
                <button
                  type="button"
                  onClick={() => (g.perMitra ? onToggleExpand(g.taskId) : onToggleGroup(keys, !allOn))}
                  aria-expanded={g.perMitra ? open : undefined}
                  className="flex min-w-0 flex-1 items-center gap-8 text-left"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-10 font-bold uppercase text-caption">{g.kindLabel}</span>
                    <span className="truncate text-14 font-bold text-default">{g.title}</span>
                  </span>
                  <span className="shrink-0 text-14 font-bold text-default">{rupiah(picked)}</span>
                  {/* The space is held even without a chevron, so every amount
                      on the list lands on one right edge. */}
                  {g.perMitra ? (
                    <span className="shrink-0 text-caption">
                      {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  ) : (
                    <span className="h-16 w-16 shrink-0" aria-hidden />
                  )}
                </button>
              </div>
              {g.perMitra && open ? (
                <div className="flex flex-col gap-8 border-t border-light pl-36 pt-12">
                  {g.leaves.map((l) => (
                    <button
                      key={l.key}
                      type="button"
                      role="checkbox"
                      aria-checked={isOn(l.key)}
                      onClick={() => onToggleLeaf(l.key)}
                      className="flex w-full items-center gap-12 text-left"
                    >
                      <TickMark checked={isOn(l.key)} />
                      <span className="min-w-0 flex-1 truncate text-14 text-default">
                        {l.name ?? g.title}
                      </span>
                      <span className="shrink-0 text-14 font-bold text-default">{rupiah(l.cash)}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

/**
 * The tick as its own hit target. On a majelis line it has to be separable from
 * the rest of the row: tapping the name opens the group, tapping the box takes
 * the whole thing. `partial` is the state a collapsed group needs most — some
 * women in, some out — because a group that reads as fully selected when it
 * isn't is how the wrong amount gets sent.
 */
function TickBox({
  checked,
  partial,
  onToggle,
}: {
  checked: boolean
  partial?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={partial ? 'mixed' : checked}
      onClick={onToggle}
      className="shrink-0"
    >
      <TickMark checked={checked} partial={partial} />
    </button>
  )
}

function TickMark({ checked, partial }: { checked: boolean; partial?: boolean }) {
  const on = checked || partial
  return (
    <span
      className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-8 border ${
        on ? 'border-primary-500 bg-primary-500 text-neutral-white' : 'border-neutral-400 bg-neutral-white'
      }`}
    >
      {partial ? (
        <span className="h-2 w-12 rounded-full bg-neutral-white" />
      ) : checked ? (
        <Check size={16} />
      ) : null}
    </span>
  )
}
