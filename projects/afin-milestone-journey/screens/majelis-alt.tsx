'use client'

// Majelis — follows the existing Majelis Melati 07 design (majelis.tsx): what
// she can do this week first, the roster underneath as the evidence. New
// here: pressing "Ingatkan" flips that row's state to "Sudah diingatkan"
// in place, instead of leaving for the WhatsApp compose screen.

import { useState, type ReactNode } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { ChevronRight, File, Headset, User, WhatsappLogo } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { type Member } from '../lib/data'
import { members, useApp } from '../lib/store'

export function MajelisAltScreen() {
  const flow = useFlow()
  const roster = members(useApp())
  const you = roster.find((m) => m.ketua) ?? roster[0]
  const others = roster.filter((m) => m !== you)
  const belumBayar = roster.filter((m) => !m.bayar)

  const [remindedJadwal, setRemindedJadwal] = useState<string | null>(null)
  const [remindedBayar, setRemindedBayar] = useState<string | null>(null)

  const overall =
    belumBayar.length === 0
      ? { text: 'Semua lancar 🎉', tone: 'bg-green-50 text-green-500' }
      : belumBayar.length <= 2
        ? { text: 'Cukup baik', tone: 'bg-orange-50 text-orange-700' }
        : { text: 'Butuh perhatian', tone: 'bg-red-50 text-red-500' }

  const names = belumBayar.map((m) => m.name.split(' ')[0])
  const belumText =
    names.length <= 2
      ? names.join(' dan ')
      : `${names.slice(0, 2).join(', ')}, dan ${names.length - 2} lainnya`

  return (
    <Screen topBar={<NavigationHeader title="Majelis Melati 07" onBack={() => flow.go('home-alt')} />}>
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-center gap-12 border-b border-light pb-12">
          <p className="flex-1 text-12 font-bold text-default">Kondisi majelis minggu ini</p>
          <span className={`rounded-full px-12 py-4 text-12 font-bold ${overall.tone}`}>
            {overall.text}
          </span>
        </div>

        <p className="mt-16 text-12 font-bold text-default">Yang bisa dilakukan minggu ini</p>
        <ActionRow
          emoji="📅"
          text="Ingatkan jadwal kumpulan"
          remindedAt={remindedJadwal}
          onRemind={() => setRemindedJadwal('2 jam lalu')}
        />
        {belumBayar.length > 0 ? (
          <ActionRow
            border
            emoji="⚠️"
            text={`Ingatkan Ibu ${belumText} untuk bayar.`}
            remindedAt={remindedBayar}
            onRemind={() => setRemindedBayar('2 jam lalu')}
          />
        ) : null}
      </div>

      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-center gap-12 border-b border-light pb-12">
          <p className="flex-1 text-14 font-bold text-default">Anggota majelis</p>
          <p className="text-12 text-caption">{roster.length} mitra</p>
        </div>

        <p className="mt-12 text-12 font-bold uppercase text-caption">Anda</p>
        <MemberRow member={you} />

        <p className="mt-8 text-12 font-bold uppercase text-caption">Anggota</p>
        <div className="mt-4">
          {others.map((m, i) => (
            <MemberRow key={m.initials} member={m} divider={i > 0} />
          ))}
        </div>
      </div>

      <LinkCard icon={<File size={24} />} title="Tentang Modal" subtitle="Keuntungan dan cara kerja Modal." />
      <div className="pb-16">
        <LinkCard icon={<Headset size={24} />} title="AmarthaCare" />
      </div>
    </Screen>
  )
}

function ActionRow({
  emoji,
  text,
  border,
  remindedAt,
  onRemind,
}: {
  emoji: string
  text: string
  border?: boolean
  remindedAt: string | null
  onRemind: () => void
}) {
  return (
    <div className={`flex items-center gap-8 py-12 ${border ? 'border-t border-light' : ''}`}>
      <span className="shrink-0 text-16">{emoji}</span>
      <p className="min-w-0 flex-1 text-12 text-caption">{text}</p>
      {remindedAt ? (
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-12 font-bold text-caption">Sudah diingatkan · {remindedAt}</span>
          <button type="button" onClick={onRemind} className="text-12 font-bold text-primary-500">
            Ingatkan lagi
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onRemind}
          className="flex shrink-0 items-center gap-4 rounded-full border border-green-500 bg-green-50 px-12 py-8 text-12 font-bold text-green-600"
        >
          <WhatsappLogo size={16} /> Ingatkan
        </button>
      )}
    </div>
  )
}

function LinkCard({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-12 rounded-12 border border-default bg-neutral-white p-16 text-left"
    >
      <span className="shrink-0 text-default">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-14 font-bold text-default">{title}</p>
        {subtitle ? <p className="mt-2 text-12 text-caption">{subtitle}</p> : null}
      </div>
      <span className="shrink-0 text-disabled">
        <ChevronRight size={20} />
      </span>
    </button>
  )
}

function MemberRow({ member, divider }: { member: Member; divider?: boolean }) {
  return (
    <div className={`flex items-center gap-12 py-12 ${divider ? 'border-t border-light' : ''}`}>
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
        <User size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-14 font-bold text-default">{member.name}</p>
        {member.ketua ? (
          <span className="mt-2 inline-block rounded-full border border-default px-8 py-2 text-12 text-caption">
            Ketua
          </span>
        ) : null}
      </div>
      <span
        className={`shrink-0 whitespace-nowrap rounded-full px-8 py-2 text-12 font-bold ${
          member.bayar ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
        }`}
      >
        {member.bayar ? 'Lancar' : 'Tidak lancar'}
      </span>
    </div>
  )
}
