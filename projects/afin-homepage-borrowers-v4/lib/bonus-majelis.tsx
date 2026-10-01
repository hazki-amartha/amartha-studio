'use client'

// "Bonus majelis" page pieces (Figma section 2963:32482): the active bonus
// card with its 12-bar progress, the locked / failed bonus cards, the
// claimed-bonus card, and the screen frame all three states share.

import type { ReactNode } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { ArrowRight } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { Banner, LegendRow, ProgressTrack } from './progress-card'
import { setMajelisView, type MajelisStatus, type ProgressCardData } from './store'

const ASSET = '/prototypes/afin-homepage-borrowers-v4'
const CARD_SHADOW = { boxShadow: '0 2px 5px rgba(108, 114, 124, 0.16)' }

const STATUS_LABEL: Record<MajelisStatus, { text: string; className: string }> = {
  belum: { text: 'Belum mulai', className: 'bg-neutral-200 text-neutral-700' },
  lancar: { text: 'Lancar', className: 'bg-green-50 text-green-700' },
  tidak: { text: 'Tidak Lancar', className: 'bg-orange-50 text-orange-700' },
}

/** The soft status chip beside "Status majelis" (Figma Label, subtle). */
export function MajelisStatusLabel({ status }: { status: MajelisStatus }) {
  const { text, className } = STATUS_LABEL[status]
  return <span className={`shrink-0 rounded-4 px-8 py-2 text-12 font-bold ${className}`}>{text}</span>
}

// `status` drives the "Lihat status majelis" card at the top, which opens
// Majelis Anda in that same status.
export function BonusMajelisFrame({ status, children }: { status: MajelisStatus; children: ReactNode }) {
  const flow = useFlow()
  return (
    <Screen topBar={<NavigationHeader title="Bonus majelis" onBack={flow.back} />}>
      <div className="flex flex-col gap-16 pb-16">
        <button
          type="button"
          onClick={() => {
            setMajelisView(status)
            flow.go('majelis-anda')
          }}
          className="flex items-center gap-12 rounded-12 bg-neutral-white p-12 text-left"
          style={{ boxShadow: '0 1px 2px rgba(164, 172, 185, 0.24)' }}
        >
          <span className="flex flex-1 flex-col gap-4">
            <span className="text-14 font-bold text-default">Lihat status majelis</span>
            <span className="text-12 text-caption">Berpengaruh ke bonus majelis</span>
          </span>
          <MajelisStatusLabel status={status} />
          <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-neutral-50">
            <ArrowRight size={20} className="text-default" />
          </span>
        </button>
        {children}
      </div>
    </Screen>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-col gap-12 overflow-hidden rounded-12 bg-neutral-white p-12" style={CARD_SHADOW}>
      {children}
    </div>
  )
}

function Label({ tone, children }: { tone: 'neutral' | 'red'; children: ReactNode }) {
  return (
    <span
      className={`shrink-0 rounded-4 px-8 py-2 text-12 font-bold text-neutral-white ${
        tone === 'red' ? 'bg-red-500' : 'bg-neutral-600'
      }`}
    >
      {children}
    </span>
  )
}

function Period({ index, dates, muted }: { index: number; dates: string; muted?: boolean }) {
  return (
    <div className={`flex flex-1 flex-col ${muted ? 'gap-4 text-caption' : ''}`}>
      <p className="text-12 text-caption">Bonus ke-{index}</p>
      <p className={`text-14 font-bold ${muted ? '' : 'text-default'}`}>{dates}</p>
    </div>
  )
}

function Gift({ muted }: { muted?: boolean }) {
  return <img src={`${ASSET}/${muted ? 'gift-muted' : 'gift'}.svg`} alt="" width={20} height={20} className="shrink-0" />
}

// `data` mirrors the homepage's "Bonus majelis Anda" card for the current
// Minggu (banner tone, bars, legend, reminder button). Without it the card
// shows the Figma's static "1x on track" state.
export function ActiveBonusCard({
  index,
  dates,
  reward,
  progressLabel,
  data,
  rewardStrike,
}: {
  index: number
  dates: string
  reward: string
  progressLabel: string
  data?: ProgressCardData
  /** Strike the reward through, as the homepage card does when it's at risk. */
  rewardStrike?: boolean
}) {
  return (
    <Card>
      <Period index={index} dates={dates} />
      <div className="border-t border-default" />
      <div className="flex items-center gap-4">
        <Gift />
        <p className={`text-14 font-bold text-default ${rewardStrike ? 'line-through' : ''}`}>{reward}</p>
      </div>
      {data ? (
        <Banner tone={data.tone} title={data.bannerTitle} description={data.bannerDescription} />
      ) : (
        <div className="flex items-center gap-12 rounded-8 bg-green-50 p-12">
          <img src={`${ASSET}/check-fat.svg`} alt="" width={20} height={20} className="shrink-0" />
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-14 font-bold text-default">Anda berpotensi mendapat hadiah</p>
            <p className="text-12 text-neutral-700">Pastikan semua anggota membayar dengan lancar.</p>
          </div>
        </div>
      )}
      <div className="flex flex-col gap-4">
        <p className="text-default">
          <span className="text-14 font-bold">{data?.progressLabel ?? progressLabel}</span>{' '}
          <span className="text-12">{data?.progressUnit ?? 'minggu majelis bayar lancar'}</span>
        </p>
        {data ? (
          <>
            <ProgressTrack segments={data.segments} />
            <LegendRow items={data.legend} />
          </>
        ) : (
          <>
            <div className="flex h-16 gap-2">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="h-full flex-1 rounded-2 bg-neutral-200" />
              ))}
            </div>
            <div className="flex items-center gap-4">
              <span className="h-8 w-8 rounded-2 bg-green-500" />
              <p className="text-12 text-caption">0x lancar</p>
            </div>
          </>
        )}
      </div>
      {data?.buttonLabel ? (
        <Button variant="secondary" size="sm" className="w-full">
          {data.buttonLabel}
        </Button>
      ) : null}
    </Card>
  )
}

export function LockedBonusCard({ index, dates, reward }: { index: number; dates: string; reward: string }) {
  return (
    <Card>
      <div className="flex items-start gap-12">
        <Period index={index} dates={dates} muted />
        <Label tone="neutral">Belum mulai</Label>
      </div>
      <div className="border-t border-default" />
      <div className="flex flex-col gap-4 text-caption">
        <p className="text-12">Bonus yang diberikan</p>
        <div className="flex items-center gap-8">
          <Gift muted />
          <p className="text-14 font-bold">{reward}</p>
        </div>
      </div>
      <div className="flex flex-col gap-4 text-caption">
        <p className="text-12">Periode</p>
        <p className="text-14 font-bold">12 minggu</p>
      </div>
    </Card>
  )
}

export function FailedBonusCard({ index, dates }: { index: number; dates: string }) {
  return (
    <Card>
      <div className="flex items-start gap-12">
        <Period index={index} dates={dates} muted />
        <Label tone="red">Gagal</Label>
      </div>
      <div className="border-t border-default" />
      <div className="flex flex-col gap-4">
        <p className="text-14 font-bold text-default">Bonus tidak bisa didapatkan</p>
        <p className="text-12 text-caption">
          2 Majelis tidak membayar angsuran. Jadi Anda tidak bisa mendapatkan tambahan bonus Rp1.000.000
        </p>
      </div>
    </Card>
  )
}

// A bonus that was earned. A cash bonus shows its amount and "Cairkan
// Sekarang"; a goods bonus (Minyak Goreng) shows the item instead.
export function ClaimedBonusCard({
  index,
  dates,
  amount,
  reward,
  description,
}: {
  index: number
  dates: string
  amount?: string
  reward?: string
  description: string
}) {
  return (
    <Card>
      <img
        src={`${ASSET}/bonus-unlocked.png`}
        alt=""
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{ width: 88, height: 110, top: 8, right: -6 }}
      />
      <div className="relative">
        <Period index={index} dates={dates} />
      </div>
      <div className="relative border-t border-default" />
      <div className="relative flex gap-20">
        <div className="flex flex-1 flex-col gap-4 text-default">
          <p className="text-14 font-bold">Selamat! Anda dapat bonusnya</p>
          <p className="text-12">{description}</p>
        </div>
        <span aria-hidden className="w-48 shrink-0" />
      </div>
      {amount ? (
        <>
          <p className="relative text-24 font-bold text-default">{amount}</p>
          <Button variant="primary" size="sm" className="relative w-full" disabled>
            Sudah dicairkan
          </Button>
        </>
      ) : null}
      {reward ? (
        <div className="relative flex items-center gap-4">
          <Gift />
          <p className="text-14 font-bold text-default">{reward}</p>
        </div>
      ) : null}
    </Card>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="pt-12 text-16 font-bold text-default">{children}</p>
}
