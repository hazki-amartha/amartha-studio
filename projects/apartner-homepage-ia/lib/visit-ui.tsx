'use client'

// Visit-flow components, ported from the A-Partner Task-First direction and
// rewired onto this prototype's data. Built only from tokens + design-system
// components per the missing-component protocol. See NOTES.md.
//
// These back the multi-screen Majelis visit (Kehadiran & Pembayaran → Tugas
// Tambahan → Bukti & Kirim) and Home visit (Temui & Tagih → Bukti & Kirim) that
// replaced the old inline visit-mode on Detail Majelis and the Kunjungan Rumah
// wizard.

import type { ReactNode } from 'react'
import { Card } from '@/design-system/components'
import { rp, type Mitra } from './data'
import { IconChat, IconCheck, IconChevR, IconPhone, IconPin } from './icons'
import { weeklyOf } from './store'
import { Avatar } from './ui'

// --- StepBar ---------------------------------------------------------------
// The step's NAME is the heading, "Langkah 1 dari 3" the caption. A visit is a
// sequence; the bar shows position but is not tappable — steps advance by being
// finished.

export const STEP_LABELS = ['Kehadiran & Pembayaran', 'Tugas Tambahan', 'Bukti & Kirim']
export const HOME_STEP_LABELS = ['Temui & Tagih', 'Bukti & Kirim']

export function StepBar({ current, labels = STEP_LABELS }: { current: number; labels?: string[] }) {
  const total = labels.length
  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-4">
        {labels.map((label, i) => (
          <span
            key={label}
            className={`h-4 flex-1 rounded-full ${i < current ? 'bg-primary-500' : 'bg-neutral-200'}`}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-20 font-bold text-default">{labels[current - 1]}</span>
        <span className="text-10 font-bold uppercase text-caption">
          Langkah {current} dari {total}
        </span>
      </div>
    </div>
  )
}

// --- VisitTitle ------------------------------------------------------------

export function VisitTitle({ title, when }: { title: string; when: string }) {
  return (
    <span className="flex flex-col">
      <span className="text-16 font-bold text-default">{title}</span>
      <span className="text-12 font-regular text-caption">{when}</span>
    </span>
  )
}

// --- InfoPill --------------------------------------------------------------

export function InfoPill({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-4 rounded-full border border-primary-200 bg-primary-50 px-12 py-4 text-12 font-bold text-primary-500">
      {children}
    </span>
  )
}

// --- SectionTitle ----------------------------------------------------------

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-14 font-bold text-default">{children}</h2>
}

// --- StatRows --------------------------------------------------------------
// The visit's status as quiet label/value rows rather than a hero number: the
// subject is the mitra list, so the totals are reassurance, not the headline.

export interface StatRow {
  label: string
  value: string
  detail?: string
}

export function StatRows({ rows }: { rows: StatRow[] }) {
  return (
    <div className="rounded-12 bg-neutral-white">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-start gap-12 px-12 py-12 ${i === 0 ? '' : 'border-t border-light'}`}
        >
          <span className="flex-1 text-14 text-caption">{row.label}</span>
          <span className="flex flex-col items-end">
            <span className="text-14 font-bold text-default">{row.value}</span>
            {row.detail ? <span className="text-12 text-caption">{row.detail}</span> : null}
          </span>
        </div>
      ))}
    </div>
  )
}

// --- AttendancePill --------------------------------------------------------
// Two named pills, "Hadir" / "Tidak", in the card's trailing slot. Selected
// uses the status pairing (500 on its own 50 tint); unselected is a real third
// state (not yet marked ≠ marked absent), so there is no default.

export function AttendancePill({
  selected,
  tone,
  onClick,
  label,
  children,
}: {
  selected: boolean
  tone: 'green' | 'red'
  onClick: () => void
  label: string
  children: ReactNode
}) {
  const selectedTone =
    tone === 'green'
      ? 'bg-green-50 text-green-500 border-green-500'
      : 'bg-red-50 text-red-500 border-red-500'
  const classes = selected ? selectedTone : 'bg-neutral-white text-neutral-600 border-default'
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-40 shrink-0 items-center justify-center rounded-full border px-12 text-14 font-bold ${classes}`}
    >
      {children}
    </button>
  )
}

// --- Chip / ChipGroup ------------------------------------------------------
// Compact selectable pills for the short, description-free lists — the reason
// and janji-bayar options.

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  const classes = selected
    ? 'border-primary-500 bg-primary-50 text-primary-500'
    : 'border-default bg-neutral-white text-neutral-700'
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-full border px-12 py-8 text-12 font-bold ${classes}`}
    >
      {children}
    </button>
  )
}

export function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-12 font-bold text-default">{label}</span>
      <div className="flex flex-wrap gap-8">{children}</div>
    </div>
  )
}

// --- ProofTile -------------------------------------------------------------
// One of the two captures that gate submitting a visit: location, then photo.

export function ProofTile({
  done,
  label,
  doneLabel,
  icon,
  onClick,
}: {
  done: boolean
  label: string
  doneLabel: string
  icon: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-8 rounded-12 border p-16 text-center ${
        done ? 'border-green-500 bg-green-50' : 'border-default bg-neutral-white'
      }`}
    >
      <span
        className={`flex h-48 w-48 items-center justify-center rounded-full ${
          done ? 'bg-green-50 text-green-500' : 'bg-primary-50 text-primary-500'
        }`}
      >
        {done ? <IconCheck size={24} /> : icon}
      </span>
      <span className={`text-14 font-bold ${done ? 'text-green-500' : 'text-default'}`}>
        {done ? doneLabel : label}
      </span>
    </button>
  )
}

// --- BucketLine ------------------------------------------------------------

function BucketLine({ mitra }: { mitra: Mitra }) {
  if (mitra.pending) return <span className="text-12 font-bold text-blue-700">Pengajuan baru</span>
  if (mitra.dpd === 0) return <span className="text-12 font-bold text-green-500">Lancar</span>
  return (
    <span className={`text-12 font-bold ${mitra.dpd >= 30 ? 'text-red-500' : 'text-orange-500'}`}>
      Menunggak {mitra.dpd} hari
    </span>
  )
}

// --- VisitMitraCard --------------------------------------------------------
// The one mitra card, shared by step 1 (kehadiran & pembayaran) and step 2
// (tugas tambahan): avatar + name (tappable through to her page), an optional
// status line, an optional trailing control (attendance), a rule, then an
// action row. The two steps sit the same face in the same shape.

export function VisitMitraCard({
  mitra,
  status,
  trailing,
  action,
  onOpen,
}: {
  mitra: Mitra
  status?: string
  trailing?: ReactNode
  /** The row under the rule. Omitted (e.g. browse mode) renders no action row. */
  action?: ReactNode
  onOpen?: () => void
}) {
  const identity = (
    <>
      <Avatar tone={mitra.ketua ? 'primary' : 'neutral'} size={40}>
        {mitra.n.charAt(0)}
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-4">
          <span className="truncate text-18 font-bold text-default">{mitra.n}</span>
          {onOpen ? (
            <span className="shrink-0 text-disabled">
              <IconChevR size={16} />
            </span>
          ) : null}
        </span>
        {status ? <span className="truncate text-12 text-caption">{status}</span> : null}
        <BucketLine mitra={mitra} />
      </div>
    </>
  )

  return (
    <Card>
      <div className="flex flex-col gap-12">
        <div className="flex items-center gap-12">
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              aria-label={`Buka halaman ${mitra.n}`}
              className="flex min-w-0 flex-1 items-center gap-12 text-left"
            >
              {identity}
            </button>
          ) : (
            identity
          )}
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
        {action ? <div className="border-t border-default pt-12">{action}</div> : null}
      </div>
    </Card>
  )
}

// --- HomeMitraCard ---------------------------------------------------------
// The doorstep card on a home visit: who she is, how to reach her, where she
// lives. Contact buttons matter — a home visit fails most often by not reaching
// her, and the BP's next move at a locked gate is to phone.

export function HomeMitraCard({
  mitra,
  address,
  onOpen,
}: {
  mitra: Mitra
  address: string
  onOpen: () => void
}) {
  return (
    <Card>
      <div className="flex flex-col gap-12">
        <div className="flex items-center gap-12">
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Buka halaman ${mitra.n}`}
            className="flex min-w-0 flex-1 items-center gap-12 text-left"
          >
            <Avatar tone={mitra.ketua ? 'primary' : 'neutral'} size={40}>
              {mitra.n.charAt(0)}
            </Avatar>
            <span className="flex min-w-0 items-center gap-4">
              <span className="truncate text-18 font-bold text-default">{mitra.n}</span>
              <span className="shrink-0 text-disabled">
                <IconChevR size={16} />
              </span>
            </span>
          </button>
          <div className="flex shrink-0 gap-8">
            <ContactButton label={`WhatsApp ${mitra.n}`} tone="green">
              <IconChat size={20} />
            </ContactButton>
            <ContactButton label={`Telepon ${mitra.n}`} tone="primary">
              <IconPhone size={20} />
            </ContactButton>
          </div>
        </div>
        <span className="flex items-start gap-4 text-12 text-caption">
          <span className="shrink-0">
            <IconPin size={16} />
          </span>
          {address}
        </span>
      </div>
    </Card>
  )
}

/** What she owes, and why the BP is here — always on screen during a home visit. */
export function TagihanCard({ mitra, reason }: { mitra: Mitra; reason: string }) {
  return (
    <Card>
      <div className="flex flex-col gap-2">
        <span className="text-12 text-caption">Tagihan minggu ini</span>
        <span className="text-24 font-bold text-default">{rp(weeklyOf(mitra))}</span>
        <span
          className={`text-12 font-bold ${
            mitra.dpd >= 30 ? 'text-red-500' : mitra.dpd > 0 ? 'text-orange-500' : 'text-green-500'
          }`}
        >
          {reason}
        </span>
      </div>
    </Card>
  )
}

function ContactButton({
  label,
  tone,
  children,
}: {
  label: string
  tone: 'green' | 'primary'
  children: ReactNode
}) {
  const classes =
    tone === 'green'
      ? 'bg-green-50 text-green-500 border-green-500'
      : 'bg-primary-50 text-primary-500 border-primary-200'
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex h-40 w-40 items-center justify-center rounded-full border ${classes}`}
    >
      {children}
    </button>
  )
}
