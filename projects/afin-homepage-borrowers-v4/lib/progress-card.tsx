'use client'

// Shared pieces for Home Var D (screens/home-var-d.tsx) — sourced from Figma's
// "Progress limit Anda" card family (section 2918:10990, 10 loan-week states).
// Project-local: no equivalent in @/design-system/components (see NOTES.md).
//
// Two card shapes appear across the ten states, both built from these pieces:
//   - a loan-limit progress card (LoanProgressCard) — always present except
//     the final state, which is replaced by the celebratory UnlockedCard.
//   - a Majelis bonus card, which is either a matching progress card
//     (MajelisProgressCard), a reward-unlocked hero (UnlockedCard), a
//     reward-ended notice (EndedCard), or absent entirely.

import { useId } from 'react'
import { Button } from '@/design-system/components'
import { ArrowRight, CheckCircleFill, Hourglass, Warning } from '@/design-system/icons'
import type { BannerText, CardTone, ProgressCardData, SegmentTone } from './store'

const CELEBRATION_SRC = '/prototypes/afin-homepage-borrowers-v4/celebration.png'
const BONUS_UNLOCKED_SRC = '/prototypes/afin-homepage-borrowers-v4/bonus-unlocked.png'

const TONE_BANNER_BG: Record<CardTone, string> = {
  neutral: 'bg-neutral-50',
  success: 'bg-green-50',
  warning: 'bg-orange-50',
  alert: 'bg-red-50',
}

const TONE_ICON_CLASS: Record<CardTone, string> = {
  neutral: 'text-neutral-500',
  success: 'text-green-600',
  warning: 'text-orange-600',
  alert: 'text-red-500',
}

function ToneIcon({ tone }: { tone: CardTone }) {
  const className = `shrink-0 ${TONE_ICON_CLASS[tone]}`
  if (tone === 'neutral') return <Hourglass size={24} className={className} />
  if (tone === 'success') return <CheckCircleFill size={20} className={className} />
  return <Warning size={20} className={className} />
}

// Decorative "trending" capsule behind the limit-saat-ini / potensi-limit-baru
// row — Figma's arrow-illustration asset (a single pill-shaped path with 5
// notches cut into it, not 5 separate icons) reproduced as inline SVG so the
// exact geometry survives, with the fill's middle stop swapped per tone. The
// two downloaded reference SVGs (neutral/success) confirmed the middle stop
// is an exact token hex (neutral-400 / green-200); warning/alert use the
// nearest token to Figma's custom shade, per the "off-system → nearest
// token" rule. Gradient ids must be unique per render — two of these can be
// on screen at once (main card + Majelis card) — hence useId().
const CAPSULE_TONE_COLOR: Record<CardTone, string> = {
  neutral: '#C6CAD0', // neutral-400
  success: '#A2EDC3', // green-200
  warning: '#FCDDAB', // orange-200 (nearest token to Figma's custom #FDE9C8)
  alert: '#FFD9D6', // red-200
}

export function TrendCapsule({ tone }: { tone: CardTone }) {
  const gradientId = `trend-capsule-${useId()}`
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full"
      viewBox="0 0 300 29.547"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 2.7735H288C294.627 2.7735 300 8.14608 300 14.7735C300 21.4009 294.627 26.7735 288 26.7735H12C5.37258 26.7735 0 21.4009 0 14.7735C0 8.14608 5.37259 2.7735 12 2.7735Z"
        fill={`url(#${gradientId})`}
      />
      {[88, 116, 144, 172, 200].map((x) => (
        <path
          key={x}
          d={`M${x} 2.7735L${x + 7.26} 13.6641C${x + 7.708} 14.3359 ${x + 7.708} 15.2111 ${x + 7.26} 15.8829L${x} 26.7735`}
          stroke="white"
          strokeWidth={4}
          strokeLinecap="square"
          strokeLinejoin="round"
        />
      ))}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="14.7735" x2="300" y2="14.7735" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity={0} />
          <stop offset="0.5" stopColor={CAPSULE_TONE_COLOR[tone]} />
          <stop offset="1" stopColor="white" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function Banner({ tone, title, description }: { tone: CardTone; title: string; description: string }) {
  return (
    <div className={`flex items-start gap-8 rounded-8 p-12 ${TONE_BANNER_BG[tone]}`}>
      <ToneIcon tone={tone} />
      <div className="flex-1">
        <p className="text-14 font-bold text-default">{title}</p>
        <p className="text-12 text-default">{description}</p>
      </div>
    </div>
  )
}

const SEGMENT_CLASS: Record<SegmentTone, string> = {
  paid: 'bg-green-500',
  missed: 'bg-red-500',
  partial: 'bg-orange-500',
  upcoming: 'bg-neutral-200',
}

export function ProgressTrack({ segments }: { segments: SegmentTone[] }) {
  return (
    <div className="flex h-16 w-full gap-2">
      {segments.map((segment, i) => (
        <span key={i} className={`h-full flex-1 rounded-2 ${SEGMENT_CLASS[segment]}`} />
      ))}
    </div>
  )
}

export function LegendRow({ items }: { items: { tone: SegmentTone; label: string }[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-16">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-4">
          <span className={`h-8 w-8 shrink-0 rounded-2 ${SEGMENT_CLASS[item.tone]}`} />
          <span className="text-12 text-caption">{item.label}</span>
        </span>
      ))}
    </div>
  )
}

function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-12">
      <div className="flex-1">
        <p className="text-14 font-bold text-default">{title}</p>
        <p className="text-12 text-caption">{subtitle}</p>
      </div>
      <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-neutral-50">
        <ArrowRight size={20} className="text-default" />
      </span>
    </div>
  )
}

export function LoanProgressCard({ data, onClick }: { data: ProgressCardData; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex w-full flex-col gap-12 rounded-16 border border-default bg-neutral-white p-12 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <CardHeader title={data.cardTitle} subtitle={data.cardSubtitle} />
      <div className="border-t border-default" />

      <div className="relative flex items-start justify-between gap-8">
        <TrendCapsule tone={data.tone} />
        <div className="relative flex flex-col gap-2">
          <p className="text-12 text-caption">{data.leftLabel}</p>
          <p className="text-16 font-bold text-default">{data.leftValue}</p>
        </div>
        <div className="relative flex flex-col items-end gap-2 text-right">
          <p className="text-12 text-caption">{data.rightLabel}</p>
          <p className={`text-16 font-bold text-default ${data.rightStrike ? 'line-through' : ''}`}>{data.rightValue}</p>
        </div>
      </div>

      <Banner tone={data.tone} title={data.bannerTitle} description={data.bannerDescription} />

      <div className="flex flex-col gap-4">
        <p className="text-14 text-default">
          <span className="font-bold">{data.progressLabel}</span> <span className="text-12">{data.progressUnit}</span>
        </p>
        <ProgressTrack segments={data.segments} />
        <LegendRow items={data.legend} />
      </div>

      {data.buttonLabel ? (
        <Button variant="primary" className="w-full" onClick={(e) => e.stopPropagation()}>
          {data.buttonLabel}
        </Button>
      ) : null}
    </div>
  )
}

export function MajelisProgressCard({
  data,
  rewardLabel,
  rewardStrike,
  onClick,
}: {
  data: ProgressCardData
  rewardLabel: string
  rewardStrike?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`flex w-full flex-col gap-12 rounded-16 border border-default bg-neutral-white p-12 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <CardHeader title={data.cardTitle} subtitle={data.cardSubtitle} />
      <div className="border-t border-default" />

      <div className="flex items-center gap-4">
        <span className="text-14">🎁</span>
        <p className={`text-14 font-bold text-default ${rewardStrike ? 'line-through' : ''}`}>{rewardLabel}</p>
      </div>

      <Banner tone={data.tone} title={data.bannerTitle} description={data.bannerDescription} />

      <div className="flex flex-col gap-4">
        <p className="text-14 text-default">
          <span className="font-bold">{data.progressLabel}</span> <span className="text-12">{data.progressUnit}</span>
        </p>
        <ProgressTrack segments={data.segments} />
        <LegendRow items={data.legend} />
      </div>

      {data.buttonLabel ? (
        <Button variant="secondary" size="sm" className="w-full" onClick={(e) => e.stopPropagation()}>
          {data.buttonLabel}
        </Button>
      ) : null}
    </div>
  )
}

// Reward-unlocked hero (Figma 2911:145487 limit, 2906:139904 Majelis bonus):
// Rp-ticket confetti in the corner, text kept clear of it (234px of 304px).
// `compact` is the Majelis bonus variant — 14/12 text instead of 16/14.
export function UnlockedCard({
  title,
  description,
  amount,
  buttonLabel,
  nextLabel,
  compact = false,
  onButtonClick,
  onClick,
}: {
  title: string
  description: BannerText
  amount: string
  buttonLabel: string
  nextLabel?: string
  compact?: boolean
  onButtonClick?: () => void
  /** Tapping anywhere on the card except its button. */
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`relative flex w-full flex-col gap-12 overflow-hidden rounded-12 border border-default p-12 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <img
        src={BONUS_UNLOCKED_SRC}
        alt=""
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{ width: 88, height: 110, top: -1, right: -6 }}
      />
      <div className="relative flex gap-20">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <p className={`${compact ? 'text-14' : 'text-16'} font-bold text-default`}>{title}</p>
          <p className={`${compact ? 'text-12' : 'text-14'} text-default`}>
            {description.text}
            {description.linkLabel ? <span className="font-bold text-primary-500"> {description.linkLabel}</span> : null}
          </p>
        </div>
        <span aria-hidden className="w-48 shrink-0" />
      </div>
      <p className="relative text-24 font-bold text-default">{amount}</p>
      <Button
        variant="secondary"
        size="sm"
        className="relative w-full"
        onClick={(e) => {
          e.stopPropagation()
          onButtonClick?.()
        }}
      >
        {buttonLabel}
      </Button>
      {nextLabel ? <p className="relative text-center text-12 font-bold text-primary-500">{nextLabel}</p> : null}
    </div>
  )
}

export function EndedCard({
  title,
  description,
  linkLabel,
  onClick,
}: {
  title: string
  description: string
  linkLabel: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`relative flex w-full items-center gap-16 overflow-hidden rounded-16 border border-default bg-neutral-white p-12 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <img
        src={CELEBRATION_SRC}
        alt=""
        aria-hidden
        className="pointer-events-none absolute select-none opacity-20 blur-sm"
        style={{ width: 180, top: -60, right: -60, transform: 'rotate(-25deg)' }}
      />
      <div className="relative flex-1">
        <p className="text-14 font-bold text-default">{title}</p>
        <p className="text-12 text-default">{description}</p>
      </div>
      <p className="relative shrink-0 text-12 font-bold text-primary-500">{linkLabel}</p>
    </div>
  )
}
