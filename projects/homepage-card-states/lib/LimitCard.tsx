'use client'

// Card 3 — limit growth. The exploration under test: the three ring meters roll
// up into one current → potential gauge, so the headline reading is "where will
// my limit land", with the rings demoted to the drivers behind it.

import { Button, Card } from '@/design-system/components'
import { Bulb } from './icons'
import { CardHeader, LimitGauge, Ring } from './ui'
import { LIMIT_CURRENT, LIMIT_POTENTIAL, LIMIT_PROJECTED, RINGS, jt } from './data'

export function LimitCard() {
  return (
    <Card>
      <CardHeader title="Terus kembangkan limitmu!" />
      <p className="mt-8 text-12 text-neutral-700">Periode assessment: 1 Jul 2026 – 31 Des 2026</p>

      <div className="mt-12 flex items-end justify-between gap-12">
        <div>
          <p className="text-10 font-bold uppercase text-disabled">Limit Sekarang</p>
          <p className="text-20 font-bold text-default">{jt(LIMIT_CURRENT)}</p>
        </div>
        <div className="text-right">
          <p className="text-10 font-bold uppercase text-link">Potensi Limit</p>
          <p className="text-20 font-bold text-primary-600">{jt(LIMIT_POTENTIAL)}</p>
        </div>
      </div>

      <LimitGauge
        current={LIMIT_CURRENT}
        potential={LIMIT_POTENTIAL}
        projected={LIMIT_PROJECTED}
      />

      <div className="mt-12 flex gap-8">
        {RINGS.map((r) => (
          <Ring key={r.label} pct={r.pct} stroke={r.stroke} label={r.label} />
        ))}
      </div>

      <div className="mt-12 flex items-center gap-8 rounded-12 bg-primary-50 p-12">
        <span className="shrink-0 text-orange-500">
          <Bulb />
        </span>
        <p className="flex-1 text-12 text-default">Naikkan jumlah celenganmu</p>
        <Button variant="primary" size="sm" className="shrink-0">
          Cek
        </Button>
      </div>
    </Card>
  )
}
