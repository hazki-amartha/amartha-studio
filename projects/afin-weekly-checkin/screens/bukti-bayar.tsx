'use client'

// Her week, in her name — the screen the pooled-payment flow has never had.
//
// When the Ketua Majelis cashes in once and settles fifteen instalments as one
// payment, Amartha receives one payment and the app credits one person. Every
// other mitra in that majelis paid, and has nothing: no confirmation, no
// record, no week. This page is the other half of the fix in lib/data.ts — the
// cash rail stays pooled, the receipt is always individual.
//
// It is deliberately small and deliberately boring. Three facts (how much, for
// which week, in whose name), the route the money took, and the one consequence
// she cares about: that this week counts toward her Status Modal. A receipt
// that tries to sell her something is a receipt she stops trusting.

import { NavigationHeader } from '@/design-system/components'
import { CheckCircleFill, ChevronRight, Hourglass, User } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  INSTALMENT,
  KETUA_NAME,
  MITRA_NAME,
  STATUS_NAME,
  rupiah,
  weekDate,
  weekProgress,
} from '../lib/data'
import { useApp } from '../lib/store'

export function BuktiBayarScreen() {
  const flow = useFlow()
  const s = useApp()
  const progress = weekProgress(s)
  const settled = progress === 'lunas'

  return (
    <Screen topBar={<NavigationHeader title="Bukti bayar" onBack={flow.back} />}>
      {/* The verdict, big, before any detail. In transit is its own state and
          not a soft version of unpaid — the money has left her hands, and the
          page has to say so or it is telling her she still owes it. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16 text-center">
        <span
          className={`mx-auto flex h-48 w-48 items-center justify-center rounded-full ${
            settled ? 'bg-green-50 text-green-500' : 'bg-primary-50 text-primary-500'
          }`}
        >
          {settled ? <CheckCircleFill size={24} /> : <Hourglass size={24} />}
        </span>
        <p className="mt-12 text-14 text-caption">
          {settled ? `Angsuran minggu ${s.week} tercatat` : `Angsuran minggu ${s.week} diproses`}
        </p>
        <p className="mt-4 text-24 font-bold text-default">{rupiah(INSTALMENT)}</p>
        <p className="mt-8 text-12 text-caption">
          {settled
            ? `Diterima Amartha, ${weekDate(s.week)}`
            : `Dititipkan ke ${KETUA_NAME}, ${weekDate(s.week)}`}
        </p>
      </div>

      {/* Whose week this is. The one line the pooled payment used to erase. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <Row label="Atas nama" value={MITRA_NAME} />
        <Row label="Untuk" value={`Angsuran minggu ${s.week}`} divider />
        <Row label="Disetor lewat" value={`${KETUA_NAME} (Ketua Majelis)`} divider />
        <Row
          label="Status"
          value={settled ? 'Diterima Amartha' : 'Menunggu setoran kelompok'}
          divider
        />
      </div>

      {/* Why the route does not cost her anything — the fear this page has to
          answer is "the group paid, so does it count for me?". */}
      <div className="rounded-12 border border-default bg-neutral-50 p-16">
        <div className="flex items-start gap-12">
          <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-700">
            <User size={16} />
          </span>
          <p className="min-w-0 flex-1 text-12 text-caption">
            {settled
              ? `Ketua Majelis menyetor untuk satu kelompok sekaligus, tapi angsuran tetap tercatat atas nama Ibu sendiri. Minggu ini masuk hitungan ${STATUS_NAME} Ibu seperti bayar sendiri.`
              : `Selama masih diproses, minggu ini tidak dihitung telat. Angsuran tercatat atas nama Ibu sendiri begitu ${KETUA_NAME} menyetor.`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => flow.go('progress-tier')}
        className="flex w-full items-center justify-center gap-8 rounded-12 border border-default bg-neutral-white p-16 text-14 text-caption"
      >
        Lihat {STATUS_NAME.toLowerCase()} Ibu
        <ChevronRight size={16} />
      </button>

      <div className="pb-16" />
    </Screen>
  )
}

/** One line of the record: what it is, and what it says. */
function Row({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <div className={`flex items-baseline gap-8 ${divider ? 'mt-12 border-t border-default pt-12' : ''}`}>
      <span className="min-w-0 flex-1 text-12 text-caption">{label}</span>
      <span className="shrink-0 text-14 font-bold text-default">{value}</span>
    </div>
  )
}
