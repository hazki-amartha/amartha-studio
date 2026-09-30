'use client'

// Project-local pieces. The top half is copied from projects/amarthafin-live/
// lib/ui.tsx (brand band, header, homepage bits) so the homepage matches
// production — copied, not imported, per CLAUDE.md §1. The bottom half is new:
// the onboarding chrome and the balance widgets this feature adds.

import { type ReactNode } from 'react'
import { Wordmark } from '@/design-system/assets'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  Eye,
  Plus,
  Promo,
  Transfer,
  User,
} from '@/design-system/icons'

// ---------------------------------------------------------------------------
// Copied from amarthafin-live
// ---------------------------------------------------------------------------

export const BAND_FILL = 'bg-gradient-to-r from-primary-400 to-primary-500'

export function BrandHeader({ name = 'Widyasari' }: { name?: string }) {
  return (
    <div className="flex items-center gap-12 px-16 pb-16 pt-16">
      <ChromeIcon>
        <User size={20} />
      </ChromeIcon>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-12 text-neutral-white">Hello</span>
        <span className="truncate text-14 font-bold text-neutral-white underline">{name}</span>
      </span>
      <ChromeIcon badge="8">
        <Promo size={20} />
      </ChromeIcon>
      <ChromeIcon badge="8">
        <Bell size={20} />
      </ChromeIcon>
    </div>
  )
}

export function BrandBand({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-16 -mt-16">
      <svg aria-hidden className="absolute h-0 w-0">
        <clipPath id="afin-bank-band-sag" clipPathUnits="objectBoundingBox">
          <path d="M1 0 C1 0 0.8067 1 0.5 1 C0.1933 1 0 0 0 0 Z" />
        </clipPath>
      </svg>
      <div className={`h-16 w-full ${BAND_FILL}`} />
      <div className={`h-24 w-full ${BAND_FILL}`} style={{ clipPath: 'url(#afin-bank-band-sag)' }} />
      <div className="relative -mt-40 px-16">{children}</div>
    </div>
  )
}

function ChromeIcon({ badge, children }: { badge?: string; children: ReactNode }) {
  return (
    <span
      className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-2 border-neutral-white/60 bg-primary-50/25 text-neutral-white backdrop-blur-lg"
      style={{
        boxShadow: '0 4px 4px rgba(0, 0, 0, 0.1), inset -4px 6px 4px rgba(115, 44, 124, 0.32)',
      }}
    >
      {children}
      {badge ? (
        <span className="absolute -right-8 -top-8 flex h-20 min-w-20 items-center justify-center rounded-full bg-red-500 px-4 text-10 font-bold text-neutral-white">
          {badge}
        </span>
      ) : null}
    </span>
  )
}

/** The live Poket widget, unchanged — shown while the user has no bank account. */
export function PoketWidget({ balance }: { balance: string }) {
  return (
    <div className="flex items-center gap-16 rounded-16 border border-default bg-gradient-to-r from-neutral-white to-primary-50 p-12">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-4 text-primary-500">
          <Wordmark name="poket" height={20} />
          <ArrowRight size={16} />
        </div>
        <div className="mt-4 flex items-center gap-8">
          <span className="text-16 font-bold text-default">{balance}</span>
          <Eye size={16} className="text-default" />
        </div>
      </div>
      <WalletAction icon={<Plus size={16} />} label="Isi Saldo" />
      <WalletAction icon={<Transfer size={16} />} label="Transfer" />
    </div>
  )
}

export function WalletAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="flex shrink-0 flex-col items-center gap-4">
      <span className="flex h-24 w-24 items-center justify-center rounded-8 bg-primary-500 text-neutral-white">
        {icon}
      </span>
      <span className="text-12 text-primary-500">{label}</span>
    </button>
  )
}

export function SectionTitle({ children, showArrow = true }: { children: ReactNode; showArrow?: boolean }) {
  return (
    <div className="flex w-full items-center justify-between text-16 font-bold text-default">
      {children}
      {showArrow ? <ArrowRight size={16} className="text-caption" /> : null}
    </div>
  )
}

export function Shortcut({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex flex-1 flex-col items-center gap-4">
      <span className="flex h-48 w-48 items-center justify-center rounded-16 border border-default bg-neutral-white">
        {icon}
      </span>
      <span className="w-full text-center text-12 text-default">{label}</span>
    </span>
  )
}

export function QuickLink({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="flex flex-1 items-center justify-center gap-8 rounded-full border border-default bg-neutral-white px-12 py-12 text-14 text-default">
      <span className="text-primary-500">{icon}</span>
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// New for this feature
// ---------------------------------------------------------------------------

/** Working name for the white-labelled account. Change it here, once. */
export const ACCOUNT_NAME = 'Rekening Amartha'

/** Header title for the screens opening and linking share (liveness). */
export const journeyTitle = (journey: 'open' | 'bind') =>
  journey === 'bind' ? 'Hubungkan Rekening' : 'Buka Rekening'

export const STAGES = ['Kontak', 'Identitas', 'Data diri', 'Rekening'] as const

/**
 * The onboarding progress: four segments for the PRD's four stages, and the
 * current stage named under them. Sits at the top of every onboarding step so
 * a 13-step flow always says how much is left.
 */
export function StepHeader({ stage }: { stage: 1 | 2 | 3 | 4 }) {
  return (
    <div>
      <div className="flex gap-4">
        {STAGES.map((s, i) => (
          <span
            key={s}
            className={`h-4 flex-1 rounded-full ${i < stage ? 'bg-primary-500' : 'bg-neutral-200'}`}
          />
        ))}
      </div>
      <p className="mt-8 text-12 text-caption">
        Langkah {stage} dari 4 · <span className="font-bold text-default">{STAGES[stage - 1]}</span>
      </p>
    </div>
  )
}

/** The pinned CTA strip at the foot of a form page. */
export function BottomAction({ children, stacked }: { children: ReactNode; stacked?: boolean }) {
  return (
    <div
      className={`sticky bottom-0 -mx-16 mt-auto flex gap-8 border-t border-default bg-neutral-white px-16 py-12 ${stacked ? 'flex-col' : ''}`}
    >
      {children}
    </div>
  )
}

export function PageTitle({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <div>
      <h1 className="text-20 font-bold text-default">{title}</h1>
      {description ? <p className="mt-8 text-14 text-caption">{description}</p> : null}
    </div>
  )
}

/** The green-tick rule list the live KYC guide pages use. */
export function RuleList({ rules }: { rules: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-12">
      {rules.map((r, i) => (
        <li key={i} className="flex gap-12 text-14 text-default">
          <Check size={20} className="shrink-0 text-green-500" />
          <span>{r}</span>
        </li>
      ))}
    </ul>
  )
}

/** A two-column read-only row, as on the live "Data pengajuan" summary. */
export function DataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-12 border-b border-default py-12 last:border-b-0">
      <span className="text-14 text-caption">{label}</span>
      <span className="text-right text-14 font-bold text-default">{value}</span>
    </div>
  )
}

/**
 * A schematic e-KTP — no real card image exists in the repo, so this stands in
 * for the photo: the blue card, the text lines, the portrait box.
 */
export function KtpArt({ dim = false }: { dim?: boolean }) {
  return (
    <div
      className={`flex w-full gap-12 rounded-12 border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-200 p-12 ${dim ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-1 flex-col gap-4">
        <span className="h-8 w-120 self-center rounded-full bg-blue-400" />
        <span className="mt-4 h-8 w-full rounded-full bg-blue-400" />
        {['w-80', 'w-100', 'w-64', 'w-96', 'w-72', 'w-88'].map((w) => (
          <span key={w} className={`h-4 rounded-full bg-blue-400/60 ${w}`} />
        ))}
      </div>
      <div className="flex h-80 w-64 items-end justify-center overflow-hidden rounded-4 bg-red-400">
        <User size={24} className="text-red-50" />
      </div>
    </div>
  )
}

/** Six boxes for a one-time code. `value` is what has been typed so far. */
export function CodeBoxes({ value, length = 6, masked = false }: { value: string; length?: number; masked?: boolean }) {
  return (
    <div className="flex justify-center gap-8">
      {Array.from({ length }, (_, i) => {
        const ch = value[i]
        const active = i === value.length
        return (
          <span
            key={i}
            className={`flex h-48 w-40 items-center justify-center rounded-8 border text-20 font-bold text-default ${
              active ? 'border-primary-500' : 'border-default'
            }`}
          >
            {ch ? (masked ? '•' : ch) : ''}
          </span>
        )
      })}
    </div>
  )
}

/** A numeric keypad for PIN / OTP entry. */
export function Keypad({ onDigit, onDelete }: { onDigit: (d: string) => void; onDelete: () => void }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']
  return (
    <div className="grid grid-cols-3 gap-8">
      {keys.map((k, i) =>
        k === '' ? (
          <span key={i} />
        ) : (
          <button
            key={i}
            type="button"
            onClick={() => (k === 'del' ? onDelete() : onDigit(k))}
            className="flex h-52 items-center justify-center rounded-12 text-20 font-bold text-default active:bg-neutral-50"
          >
            {k === 'del' ? <ArrowLeft size={20} /> : k}
          </button>
        ),
      )}
    </div>
  )
}

/** A schematic face for the selfie guide and summary — stands in for a photo. */
export function FaceArt({ blurred = false }: { blurred?: boolean }) {
  return (
    <div
      className={`flex h-120 w-full flex-col items-center justify-end overflow-hidden rounded-12 bg-blue-50 ${blurred ? 'blur-sm' : ''}`}
    >
      <span className="h-52 w-52 rounded-full bg-orange-200" />
      <span className="mt-4 h-40 w-96 rounded-t-full bg-primary-300" />
    </div>
  )
}

/** Dark camera page: header, full-bleed dark body, shutter row at the foot. */
export function CameraShutter({ onShoot }: { onShoot: () => void }) {
  return (
    <div className="flex items-center justify-center py-24">
      <button
        type="button"
        onClick={onShoot}
        aria-label="Ambil foto"
        className="flex h-64 w-64 items-center justify-center rounded-full border-4 border-neutral-white"
      >
        <span className="h-48 w-48 rounded-full bg-primary-500" />
      </button>
    </div>
  )
}

/** A spinner ring, for the checking and processing waits. */
export function Spinner() {
  return <span className="block h-48 w-48 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
}
