'use client'

// The mitra page — one borrower, opened from her card on any stage.
//
// This is the reference's "Repayment Overview", rebuilt on this project's terms.
// The header it specifies is kept exactly as specified — avatar, the loan she is
// carrying, her DPD badge — and so is the week strip beneath it, because the
// strip is the thing the whole direction turns on: it carries the AMOUNT inside
// each week rather than a paid/unpaid dot, which is what lets a BP say "Ibu
// kurang Rp50.000 di minggu 7" instead of "Ibu belum bayar".
//
// The reference's second screen — a full payment-history table — is deliberately
// absent. It was cut on the designer's call, and the strip is the reason it can
// be: a table of 50 rows says the same thing the rail already says, one screen
// further from the conversation that needed it.
//
// What this project adds back is the ORDER. The record does not open the page.
// What to do about her does — one pre-reasoned recommendation, with the ledger
// as the evidence underneath. A mitra page is the classic place a task-first app
// quietly turns back into a dashboard, and the strip is handsome enough to be
// exactly that trap.

import type { ReactNode } from 'react'
import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMitra, outstandingOf, rupiah } from '../lib/data'
import { IconChat, IconCheck, IconChevronRight, IconPin, IconTrendUp } from '../lib/icons'
import { ladderOf } from '../lib/ladder'
import { profileOf } from '../lib/profile'
import { collectStatus, paidOf, remainingOf, store, useApp } from '../lib/store'
import { Avatar, Overline, StatRows, WeekStrip } from '../lib/ui'

export function MitraScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const profile = profileOf(mitra)
  const owed = outstandingOf(mitra)
  const status = collectStatus(s, mitra)
  const ladder = ladderOf(mitra)

  // The ladder row carries the ladder's own conclusion, so a BP who never opens
  // that screen still leaves with the one fact it holds. It does not repeat the
  // word the badge already shows: the badge says "Tertahan", the line says the
  // number behind it.
  const ladderLine =
    ladder.status === 'tertahan'
      ? `Tunggakan ${rupiah(ladder.arrears)}`
      : ladder.current
        ? `${ladder.current.detail} menuju ${ladder.current.title}`
        : 'Siklus selesai — bisa ajukan pembiayaan baru'

  return (
    <Screen topBar={<NavigationHeader title="Detail Mitra" onBack={() => flow.back()} />}>
      {/* The reference's header, kept: who she is, what she carries, how she is
          doing. The loan is the number she is asked about; the badge is the one
          the BP is asked about. */}
      <Card>
        <div className="flex items-center gap-12">
          <Avatar name={mitra.name} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-18 font-bold text-default">{mitra.name}</span>
            <span className="truncate text-12 text-caption">Pinjaman {rupiah(mitra.loan)}</span>
            <span className="truncate text-12 text-caption">Mitra sejak {profile.joined}</span>
          </div>
          {mitra.dpd > 0 ? (
            <Badge intent={mitra.dpd >= 30 ? 'red' : 'orange'}>Menunggak {mitra.dpd} hari</Badge>
          ) : (
            <Badge intent="green">Lancar</Badge>
          )}
        </div>
      </Card>

      {/* --- What to do about her. First, before the record. ---------------- */}
      <section className="flex flex-col gap-8">
        <Overline>Yang perlu dilakukan</Overline>

        {status === 'lunas' ? (
          <Done
            title="Sudah lunas hari ini"
            detail={`${rupiah(paidOf(s, mitra))} diterima`}
          />
        ) : status === 'tidak' ? (
          <Done
            title="Tercatat tidak bayar"
            detail={
              s.nonPayments[mitra.id]?.ptp
                ? `${s.nonPayments[mitra.id]?.reason} · janji ${s.nonPayments[mitra.id]?.ptp}`
                : (s.nonPayments[mitra.id]?.reason ?? '')
            }
          />
        ) : (
          <div className="flex flex-col gap-12 rounded-12 border border-primary-200 bg-primary-50 p-12">
            <div className="flex flex-col gap-2">
              <span className="text-12 text-caption">
                {status === 'sebagian' ? 'Sisa yang belum dibayar' : 'Total yang harus ditagih'}
              </span>
              <span className="text-24 font-bold text-default">
                {rupiah(status === 'sebagian' ? remainingOf(s, mitra) : owed.total)}
              </span>
            </div>
            <Button className="w-full" onClick={() => flow.go('collect')}>
              Tagih Pembayaran
            </Button>
          </div>
        )}
      </section>

      {/* --- The evidence. The ledger the recommendation was reasoned from. -- */}
      <section className="flex flex-col gap-8">
        <Overline>Riwayat pembayaran</Overline>
        <WeekStrip weeks={mitra.weeks} totalWeeks={mitra.totalWeeks} />
        <StatRows
          rows={[
            { label: 'Angsuran minggu ini', value: rupiah(owed.thisWeek) },
            {
              label:
                owed.missedWeeks > 0 ? `Terlewat (${owed.missedWeeks} minggu)` : 'Terlewat',
              value: rupiah(owed.missed),
              tone: owed.missed > 0 ? 'red' : 'default',
            },
            {
              label: 'Sisa bayar sebagian',
              value: rupiah(owed.partial),
              tone: owed.partial > 0 ? 'orange' : 'default',
            },
            { label: 'Total tagihan', value: rupiah(owed.total), tone: 'strong' },
          ]}
        />
      </section>

      {/* --- Her standing and how to reach her. ---------------------------- */}
      <section className="flex flex-col gap-8 pb-16">
        <Overline>Data mitra</Overline>
        <Card>
          <div className="flex flex-col gap-12">
            <CardRow
              tint="primary"
              icon={<IconTrendUp size={20} />}
              title="Jalur Naik Modal"
              subtitle={ladderLine}
              trailing={ladder.status === 'tertahan' ? <Badge intent="orange">Tertahan</Badge> : null}
              onClick={() => flow.go('ladder')}
              first
            />
            <CardRow
              icon={<IconChat size={20} />}
              title="Chat WhatsApp"
              subtitle={profile.phone}
              onClick={() => undefined}
            />
            <CardRow
              icon={<IconPin size={20} />}
              title="Rute ke rumah"
              subtitle={profile.address}
              onClick={() => undefined}
            />
          </div>
        </Card>
      </section>
    </Screen>
  )
}

/** An outcome already on file — a finished state, not a gap to fill. */
function Done({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12">
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-green-50 text-green-500">
        <IconCheck size={20} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-14 font-bold text-default">{title}</span>
        <span className="truncate text-12 text-caption">{detail}</span>
      </div>
    </div>
  )
}

/**
 * A tappable row inside the data card. The hairline above each row is what lets
 * three different kinds of thing share one card without the groupings
 * dissolving; it is full-bleed (`-mx-12` against the card's 12px padding) so it
 * reads as a division of the card rather than an underline on the row.
 *
 * `border-default`, not `border-light`: light is neutral-50, which on a white
 * card is invisible.
 */
function CardRow({
  icon,
  title,
  subtitle,
  trailing,
  onClick,
  tint = 'neutral',
  first = false,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  trailing?: ReactNode
  onClick: () => void
  tint?: 'neutral' | 'primary'
  /** The first row needs no divider above it — the card edge is the division. */
  first?: boolean
}) {
  const tone =
    tint === 'primary' ? 'bg-primary-50 text-primary-500' : 'bg-neutral-50 text-neutral-600'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mx-12 flex items-center gap-12 px-12 text-left ${first ? '' : 'border-t border-default pt-12'}`}
    >
      <span className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-8 ${tone}`}>
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-14 font-bold text-default">{title}</span>
        <span className="truncate text-12 text-caption">{subtitle}</span>
      </div>
      {trailing}
      <span className="shrink-0 text-disabled">
        <IconChevronRight size={20} />
      </span>
    </button>
  )
}
