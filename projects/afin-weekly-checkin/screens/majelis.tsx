'use client'

// The majelis behind the home card. Subtle on home should not mean opaque on
// inspection, so this is where the real figures live — the 43-of-48 threshold,
// the weekly lane, the exact bonus, and who has paid this week.
//
// The roster names who is short (designer's call, 2026-08-03, reversing the
// earlier no-names rule) and it is drawn the way afin-milestone-journey draws
// its majelis: her own row pulled out under "Anda", the rest under "Anggota",
// a status pill on every line. The pill is the SAME pill the group itself wears
// at the top of the page — one status language for both scales, so a member who
// has not paid and a group that needs watching read as the same fact rather
// than as two different alarms.
//
// The one thing this page still does not do: grade the group. When the 90% goes
// out of reach the block stays visible and says so as a fact, without a
// bad-sounding label attached to fifteen people for the rest of the tenor.

import { NavigationHeader } from '@/design-system/components'
import { Majelis, Medal, User } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  GROUP_BONUS,
  GROUP_SIZE,
  GROUP_THRESHOLD_WEEKS,
  TOTAL_WEEKS,
  UNNAMED_MEMBERS,
  groupGoodWeeks,
  groupStatus,
  members,
  paidThisWeek,
  short,
  type Member,
} from '../lib/data'
import { useApp } from '../lib/store'
import { GroupBadge, Meter, PaymentPill } from '../lib/ui'

export function MajelisScreen() {
  const flow = useFlow()
  const s = useApp()
  const status = groupStatus(s)
  const good = groupGoodWeeks(s)
  const roster = members(s)
  const you = roster[0]
  const others = roster.slice(1)

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
              ? `${paidThisWeek(s)} dari ${GROUP_SIZE} anggota sudah bayar minggu ini. Kelompok masih bisa kembali lancar minggu depan.`
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

      {/* Members, each with this week's payment status. Her own row sits apart
          at the top — it is the one row she can do something about, and it
          moves the moment she pays on home. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-baseline gap-8">
          <span className="min-w-0 flex-1 text-14 font-bold text-default">Angsuran minggu ini</span>
          <span className="shrink-0 text-12 text-caption">{GROUP_SIZE} orang</span>
        </div>

        <p className="mt-12 text-10 font-bold uppercase text-caption">Anda</p>
        <MemberRow member={you} />

        <p className="mt-8 text-10 font-bold uppercase text-caption">Anggota</p>
        {others.map((m, i) => (
          <MemberRow key={m.name} member={m} divider={i > 0} />
        ))}

        <p className="mt-12 border-t border-default pt-12 text-12 text-caption">
          dan {UNNAMED_MEMBERS} anggota lainnya sudah bayar
        </p>
      </div>

      <div className="pb-16" />
    </Screen>
  )
}

/** One mitra's week: who she is, and the same pill the group wears. */
function MemberRow({ member, divider }: { member: Member; divider?: boolean }) {
  return (
    <div
      className={`flex items-center gap-12 py-12 ${divider ? 'border-t border-default' : ''}`}
    >
      <span
        className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-full ${
          member.you ? 'bg-primary-50 text-primary-500' : 'bg-neutral-50 text-neutral-600'
        }`}
      >
        <User size={16} />
      </span>
      <span className="min-w-0 flex-1 truncate text-14 text-default">
        {member.name}
        {member.you ? ' (Anda)' : ''}
      </span>
      <PaymentPill bayar={member.bayar} />
    </div>
  )
}
