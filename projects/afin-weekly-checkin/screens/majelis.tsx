'use client'

// The majelis behind the home card. Subtle on home should not mean opaque on
// inspection, so this is where the real figures live — the 43-of-48 threshold,
// the weekly lane, the exact bonus.
//
// Two things this page deliberately does NOT do:
//
//   · It never names who is short. The count is on the card; the list below is
//     members, not a scoreboard. A majelis is fifteen women who see each other
//     every week — they already know who is behind, and publishing it would only
//     add a permanent, screenshot-able record to a room that has none.
//
//   · It never grades the group. When the 90% goes out of reach the block stays
//     visible and says so as a fact, without a bad-sounding label attached to
//     fifteen people for the rest of the tenor.

import { Badge, NavigationHeader } from '@/design-system/components'
import { Majelis, Medal, User } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  GROUP_BONUS,
  GROUP_SIZE,
  GROUP_THRESHOLD_WEEKS,
  TOTAL_WEEKS,
  groupGoodWeeks,
  groupStatus,
  short,
} from '../lib/data'
import { useApp } from '../lib/store'
import { GroupBadge, Meter } from '../lib/ui'

// Five names, not fifteen — the rest is a count. Nothing here carries a
// payment status.
const MEMBERS = ['Ibu Siti', 'Ibu Ratna', 'Ibu Yuni', 'Ibu Dewi', 'Ibu Marni']

export function MajelisScreen() {
  const flow = useFlow()
  const s = useApp()
  const status = groupStatus(s)
  const good = groupGoodWeeks(s)

  return (
    <Screen topBar={<NavigationHeader title="Kelompok Melati" onBack={flow.back} />}>
      {/* The status, restated at full size. Still qualitative, still no
          countdown — the numbers are one block further down. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-center gap-12">
          <span
            className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-full ${
              status === 'lewat'
                ? 'bg-neutral-50 text-neutral-500'
                : 'bg-primary-50 text-primary-500'
            }`}
          >
            <Majelis size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-12 text-caption">Kondisi kelompok</p>
            <div className="mt-4">
              <GroupBadge status={status} />
            </div>
          </div>
        </div>

        <p className="mt-12 text-14 text-default">
          {status === 'baik'
            ? 'Semua anggota lancar. Pertahankan sampai akhir tenor untuk tambahan limit.'
            : status === 'jaga'
              ? `${GROUP_SIZE - s.groupShort} dari ${GROUP_SIZE} anggota sudah bayar minggu ini. Kelompok masih bisa kembali lancar minggu depan.`
              : 'Tambahan limit dari kelompok tidak tercapai tenor ini. Hadiah Ibu sendiri tetap berjalan seperti biasa.'}
        </p>

        {status === 'jaga' ? (
          <button
            type="button"
            className="mt-12 w-full rounded-full border border-primary-500 py-8 text-14 font-bold text-primary-500"
          >
            Hubungi BP kelompok
          </button>
        ) : null}
      </div>

      {/* The bonus itself. */}
      <div
        className={`rounded-12 border p-16 ${
          status === 'lewat' ? 'border-default bg-neutral-50' : 'border-default bg-neutral-white'
        }`}
      >
        <div className="flex items-center gap-12">
          <span
            className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-full ${
              status === 'lewat' ? 'bg-neutral-200 text-neutral-500' : 'bg-yellow-50 text-yellow-600'
            }`}
          >
            <Medal size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`text-14 font-bold ${status === 'lewat' ? 'text-caption line-through' : 'text-default'}`}
            >
              Tambahan limit {short(GROUP_BONUS)}
            </p>
            <p className="mt-2 text-12 text-caption">Untuk semua anggota, di akhir tenor</p>
          </div>
        </div>
      </div>

      {/* The real figures. Everything the home card keeps off screen. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <p className="text-14 font-bold text-default">Rekap kelompok</p>

        <div className="mt-12 flex items-baseline gap-8">
          <span className="min-w-0 flex-1 text-12 text-caption">Minggu lancar satu kelompok</span>
          <span className="shrink-0 text-14 font-bold text-default">
            {good} dari {TOTAL_WEEKS}
          </span>
        </div>
        <div className="mt-8">
          <Meter percent={Math.round((good / TOTAL_WEEKS) * 100)} />
        </div>
        <p className="mt-8 text-12 text-caption">
          Butuh {GROUP_THRESHOLD_WEEKS} minggu lancar sampai minggu {TOTAL_WEEKS} untuk dapat
          tambahan limit.
        </p>

        <div className="mt-16 flex items-baseline gap-8">
          <span className="min-w-0 flex-1 text-12 text-caption">Minggu belum lengkap</span>
          <span className="shrink-0 text-14 font-bold text-default">{s.groupBroken.length}</span>
        </div>
      </div>

      {/* Members. A list, not a scoreboard — no payment status anywhere. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-baseline gap-8">
          <span className="min-w-0 flex-1 text-14 font-bold text-default">Anggota</span>
          <span className="shrink-0 text-12 text-caption">{GROUP_SIZE} orang</span>
        </div>
        <div className="mt-12 flex flex-col gap-12">
          {MEMBERS.map((name) => (
            <div key={name} className="flex items-center gap-12">
              <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-neutral-600">
                <User size={16} />
              </span>
              <span className="min-w-0 flex-1 truncate text-14 text-default">{name}</span>
              {name === 'Ibu Siti' ? (
                <Badge intent="neutral" variant="subtle" size="sm">
                  Ibu
                </Badge>
              ) : null}
            </div>
          ))}
          <p className="text-12 text-caption">dan {GROUP_SIZE - MEMBERS.length} anggota lainnya</p>
        </div>
      </div>

      <div className="pb-16" />
    </Screen>
  )
}
