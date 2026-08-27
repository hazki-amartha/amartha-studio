'use client'

// The status page behind the chevron on the check-in card. Same five grades
// as home-b's own StatusKey, read here as one gauge instead of a coloured
// strip — because this page's whole job is explaining WHY the grade landed
// where it did, not just reporting it.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { STATUS_DETAIL, VARIANT_STATUS, type StatusKey, type StatusRow } from '../lib/status'
import { useApp } from '../lib/store'

// The five grades in order, best first — the ladder under "Penjelasan status".
// Printing them as a list rather than as a sentence is the whole point: she can
// see the scale AND where she sits on it in one look.
const LADDER: { key: StatusKey; label: string; dot: string; tint: string }[] = [
  { key: 'sangat-baik',  label: 'Sangat Baik',  dot: '#22C55E', tint: '#EDFAF3' },
  { key: 'baik',         label: 'Baik',         dot: '#0F7A3D', tint: '#EDFAF3' },
  { key: 'sedang',       label: 'Sedang',       dot: '#F59E0B', tint: '#FFF3E8' },
  { key: 'buruk',        label: 'Buruk',        dot: '#EF4444', tint: '#FFF0F0' },
  { key: 'sangat-buruk', label: 'Sangat Buruk', dot: '#B91C1C', tint: '#FFE0E0' },
]

const HABITS = [
  { icon: '💰', bg: '#F4ECFC', text: 'Bayar angsuran tepat waktu setiap minggunya' },
  { icon: '🧕', bg: '#E6F5EB', text: 'Hadiri kumpulan setiap minggunya' },
  { icon: '👭', bg: '#FFF3E8', text: 'Jaga kelancaran 1 kumpulan' },
]

export function StatusDetailScreen() {
  const flow = useFlow()
  const { homeBVariant } = useApp()
  const status = VARIANT_STATUS[homeBVariant ?? 'matrix-sangat-baik']
  const detail = STATUS_DETAIL[status]

  // "Pertahankan" is the wrong verb once the grade has already slipped — the
  // top two keep it, the rest are being asked to climb back.
  const holding = status === 'sangat-baik' || status === 'baik'

  return (
    <Screen topBar={<NavigationHeader title="Status pinjaman" onBack={flow.back} />}>
      <div className="flex flex-col gap-20 pb-24">
        <Gauge status={status} label={detail.label} color={detail.color} />

        <div>
          <SectionTitle>Status kamu dipengaruhi oleh</SectionTitle>
          <div className="mt-12 flex flex-col gap-8">
            {detail.rows.map((row) => (
              <FactorCard
                key={row.title}
                {...row}
                onLinkClick={
                  row.title === 'Kelancaran pembayaran' || row.title === 'Kehadiran kumpulan'
                    ? () => flow.go('riwayat-pembayaran')
                    : row.title === 'Pembayaran anggota'
                      ? () => flow.go('majelis-melati')
                      : undefined
                }
              />
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Penjelasan status</SectionTitle>

          {/* The scale itself, and where she sits on it. */}
          <p className="mt-12 text-12 text-caption">Status pinjaman punya 5 kondisi:</p>
          <div className="mt-8 overflow-hidden rounded-12" style={{ border: '1px solid #E9DEF6' }}>
            {LADDER.map((rung, i) => {
              const active = rung.key === status
              return (
                <div
                  key={rung.key}
                  className="flex items-center gap-8 px-12 py-8"
                  style={{
                    background: active ? rung.tint : '#FFFFFF',
                    borderTop: i === 0 ? undefined : '1px solid #F4F0F9',
                  }}
                >
                  <span className="shrink-0 rounded-full" style={{ width: '8px', height: '8px', background: rung.dot }} />
                  <span className={`flex-1 text-14 ${active ? 'font-bold text-default' : 'text-caption'}`}>
                    {rung.label}
                  </span>
                  {active && (
                    <span
                      className="shrink-0 rounded-full text-10 font-bold uppercase"
                      style={{ background: '#FFFFFF', color: rung.dot, padding: '2px 8px', border: `1px solid ${rung.dot}` }}
                    >
                      Status kamu
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* What actually moves the needle. */}
          <p className="mt-16 text-14 font-bold text-default">
            {holding ? 'Pertahankan' : 'Perbaiki'} status kamu dengan cara:
          </p>
          <div className="mt-8 flex flex-col gap-8">
            {HABITS.map((habit) => (
              <div key={habit.text} className="flex items-center gap-12">
                <span
                  className="flex shrink-0 items-center justify-center"
                  style={{ width: '28px', height: '28px', borderRadius: '10px', background: habit.bg, fontSize: '14px' }}
                >
                  {habit.icon}
                </span>
                <span className="text-14 text-default">{habit.text}</span>
              </div>
            ))}
          </div>

          {/* The payoff — the only part of this page that names money. */}
          <div
            className="mt-16 flex items-start gap-8 rounded-12 p-12"
            style={
              detail.rewardTone === 'gift'
                ? { background: '#EDFAF3', border: '1px solid #CBE9D8' }
                : { background: '#FFF7ED', border: '1px solid #FBD9AE' }
            }
          >
            <span className="shrink-0" style={{ fontSize: '16px', lineHeight: '1.4' }}>{detail.rewardIcon}</span>
            <p className="min-w-0 flex-1 text-12 text-default">{detail.rewardText}</p>
          </div>
        </div>
      </div>
    </Screen>
  )
}

/** A section heading with the small purple rule that marks a new block on this page. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-8">
      <span className="shrink-0 rounded-full bg-primary-500" style={{ width: '3px', height: '16px' }} />
      <p className="text-16 font-bold text-default">{children}</p>
    </div>
  )
}

/** The five-pill gauge — one segment per grade, lit in its own colour, the active one picked out with a marker above it. */
function Gauge({ status, label, color }: { status: StatusKey; label: string; color: string }) {
  // The bar reads worst-to-best, left-to-right — the opposite of LADDER's
  // best-first order, which the ranked list below still wants top-down.
  const bars = [...LADDER].reverse()
  const activeIndex = bars.findIndex((rung) => rung.key === status)
  const segmentWidth = 100 / bars.length
  const markerCenter = activeIndex * segmentWidth + segmentWidth / 2

  return (
    <div
      className="flex flex-col items-center rounded-16 p-16"
      style={{ background: 'linear-gradient(180deg, #FAF7FC 0%, #FFFFFF 100%)', border: '1px solid #E9DEF6' }}
    >
      <div className="relative w-full">
        {/* The marker sits above the bar it's pointing at, not the reverse —
            so the eye lands on "here" before it reads which segment that is. */}
        <div
          className="absolute flex flex-col items-center"
          style={{ left: `${markerCenter}%`, top: '-8px', transform: 'translateX(-50%)' }}
        >
          <span
            style={{
              width: '0', height: '0',
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: `6px solid ${color}`,
            }}
          />
        </div>
        <div className="flex" style={{ gap: '2px' }}>
          {bars.map((rung) => (
            <div
              key={rung.key}
              className="flex-1 rounded-4"
              style={{ height: '12px', background: rung.dot, opacity: rung.key === status ? 1 : 0.25 }}
            />
          ))}
        </div>
      </div>
      <p className="mt-12 uppercase text-10 text-caption" style={{ lineHeight: '1' }}>Status kamu</p>
      <p className="mt-4 font-bold" style={{ color, fontSize: '28px', lineHeight: '1.1' }}>{label}</p>
    </div>
  )
}

function FactorCard({ title, link, done, total, unit, desc, onLinkClick }: StatusRow & { onLinkClick?: () => void }) {
  return (
    <div className="rounded-12 bg-neutral-white p-12" style={{ border: '1px solid #E9DEF6' }}>
      <div className="flex items-center justify-between gap-8">
        <span className="text-14 font-bold text-default">{title}</span>
        {onLinkClick ? (
          <button type="button" onClick={onLinkClick} className="shrink-0 text-12 font-bold text-primary-500">
            {link}
          </button>
        ) : (
          <span className="shrink-0 text-12 font-bold text-primary-500">{link}</span>
        )}
      </div>
      <p className="mt-4 text-14 text-default">{done} dari {total} {unit}</p>
      <p className="mt-2 text-12 text-caption">{desc}</p>
    </div>
  )
}
