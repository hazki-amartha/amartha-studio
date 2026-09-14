'use client'

// The majelis behind the home card. Subtle on home should not mean opaque on
// inspection, so this is where the real figures live — the 43-of-48 threshold,
// the weekly lane, the exact bonus, and who has paid this week.
//
// The roster is a COUNT again, not a list of names. It named who was short for
// three weeks; the field research is against it. AFin already ships per-member
// repayment visibility, and what the BPs report back is that it reads the wrong
// way round — "the others are not paying, so I will not either" — on top of
// jealousy inside a group that sees each other every Thursday, and the loss of
// the BP's leverage to collect at all. The standing recommendation is to
// restrict it. So the page keeps every group-scale figure (they are the thing
// she is asked to protect) and drops the fifteen verdicts on fifteen neighbours
// that she cannot act on and that give her a reason not to pay.
//
// Her OWN row stays, with the same pill the group wears — one status language
// at both scales — because that row is the one she can move.
//
// The one thing this page still does not do: grade the group. When the 90% goes
// out of reach the block stays visible and says so as a fact, without a
// bad-sounding label attached to fifteen people for the rest of the tenor.

import { NavigationHeader } from '@/design-system/components'
import { CoinTwoHands, Majelis, Medal, User } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  GROUP_BONUS,
  GROUP_SIZE,
  GROUP_THRESHOLD_WEEKS,
  INSTALMENT,
  KETUA_NAME,
  MITRA_NAME,
  TOTAL_WEEKS,
  groupGoodWeeks,
  groupStatus,
  paidThisWeek,
  rupiah,
  short,
  weekProgress,
} from '../lib/data'
import { useApp } from '../lib/store'
import { GroupBadge, Meter, PaymentPill, StatusPill } from '../lib/ui'

export function MajelisScreen() {
  const flow = useFlow()
  const s = useApp()
  const status = groupStatus(s)
  const good = groupGoodWeeks(s)
  const progress = weekProgress(s)

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

      {/* The week, as a count. Her own row first, because it is the only line
          on this page she can do something about — and then the group as ONE
          number. Fifteen names with fifteen verdicts is the part the research
          argues against; the number is the part she was actually asked to
          protect. */}
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-baseline gap-8">
          <span className="min-w-0 flex-1 text-14 font-bold text-default">Angsuran minggu ini</span>
          <span className="shrink-0 text-12 text-caption">{GROUP_SIZE} orang</span>
        </div>

        <div className="mt-12 flex items-center gap-12">
          <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <User size={16} />
          </span>
          <span className="min-w-0 flex-1 truncate text-14 text-default">
            {MITRA_NAME} (Anda)
          </span>
          {progress === 'titip' ? (
            <StatusPill tone="muted">Diproses</StatusPill>
          ) : (
            <PaymentPill bayar={s.paid} />
          )}
        </div>

        <p className="mt-12 border-t border-default pt-12 text-12 text-caption">
          {paidThisWeek(s)} dari {GROUP_SIZE} anggota sudah bayar minggu ini.
          {s.groupShort > 0 ? ' BP kelompok yang menindaklanjuti sisanya.' : ''}
        </p>
      </div>

      {/* The collection itself, for a majelis that pays through its Ketua. It
          is on this page rather than on home because it is a GROUP mechanism —
          and it is on screen at all because the alternative is fifteen mitra
          wondering why a payment they made in cash on Thursday is not on their
          own record. */}
      {s.channel === 'ketua' ? (
        <div className="rounded-12 border border-default bg-neutral-white p-16">
          <div className="flex items-center gap-12">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
              <CoinTwoHands size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-14 font-bold text-default">Setoran lewat Ketua Majelis</p>
              <p className="mt-2 text-12 text-caption">{KETUA_NAME}, setiap hari Kamis</p>
            </div>
          </div>
          <p className="mt-12 text-12 text-caption">
            Kelompok menyetor sekali untuk semua anggota, jadi biaya isi saldo ditanggung bersama
            satu kali. Angsuran {rupiah(INSTALMENT)} tetap tercatat atas nama masing-masing
            anggota.
          </p>
          <button
            type="button"
            onClick={() => flow.go('bukti-bayar')}
            className="mt-12 w-full rounded-full border border-primary-500 py-8 text-14 font-bold text-primary-500"
          >
            Lihat bukti bayar Ibu
          </button>
        </div>
      ) : null}

      <div className="pb-16" />
    </Screen>
  )
}
