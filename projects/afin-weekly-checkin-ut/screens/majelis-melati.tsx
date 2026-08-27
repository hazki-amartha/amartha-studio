'use client'

// "Majelis Melati 07" — reached only from "Lihat riwayat" on the "Pembayaran
// anggota" factor card in Status pinjaman. Project-local port of the Majelis
// screen on afin-milestone-journey (§2: never import across projects), with
// the WhatsApp-reminder flow left as a static affordance since this project
// has no compose/whatsapp-reminder screen of its own to send it to.

import type { ReactNode } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { ChevronRight, File, Headset, User, WhatsappLogo } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'

interface Member {
  initials: string
  name: string
  bayar: boolean
  ketua?: boolean
}

const MEMBERS: Member[] = [
  { initials: 'IS', name: 'Ibu Siti', bayar: true, ketua: true },
  { initials: 'AK', name: 'Alen Kurnia', bayar: true },
  { initials: 'AN', name: 'Arin Nita', bayar: false },
  { initials: 'SY', name: 'Suyamti', bayar: false },
  { initials: 'DS', name: 'Dewi Sartika', bayar: true },
  { initials: 'RW', name: 'Ratna Wati', bayar: false },
  { initials: 'SW', name: 'Sri Wahyuni', bayar: true },
  { initials: 'FH', name: 'Fitri Handayani', bayar: false },
  { initials: 'NH', name: 'Nurul Hidayah', bayar: false },
  { initials: 'ML', name: 'Marlina', bayar: true },
]

export function MajelisMelatiScreen() {
  const flow = useFlow()

  const total = MEMBERS.length
  const you = MEMBERS.find((m) => m.ketua) ?? MEMBERS[0]
  const others = MEMBERS.filter((m) => m !== you)
  const belumBayar = MEMBERS.filter((m) => !m.bayar)

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
    <Screen topBar={<NavigationHeader title="Majelis Melati 07" onBack={flow.back} />}>
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-center gap-12 border-b border-light pb-12">
          <p className="flex-1 text-12 font-bold text-default">Kondisi majelis minggu ini</p>
          <span className={`rounded-full px-12 py-4 text-12 font-bold ${overall.tone}`}>
            {overall.text}
          </span>
        </div>

        <p className="mt-16 text-12 font-bold text-default">Yang bisa dilakukan minggu ini</p>
        <ActionRow emoji="📅" text="Ingatkan jadwal kumpulan" />
        {belumBayar.length > 0 && (
          <ActionRow border emoji="⚠️" text={`Ingatkan Ibu ${belumText} untuk bayar.`} />
        )}
      </div>

      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-center gap-12 border-b border-light pb-12">
          <p className="flex-1 text-14 font-bold text-default">Anggota majelis</p>
          <p className="text-12 text-caption">{total} mitra</p>
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

      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <p className="mb-8 text-12 font-bold uppercase text-caption">Info majelis</p>
        <StatRow label="Petugas Ibu" value="Fadhil Maulana" border />
        <StatRow label="Jadwal kumpulan" value="Senin, 11.30 – 12.00" border />
        <StatRow label="Lokasi kumpulan" value="Jl. Melati No. 7" border />
        <StatRow label="Ketua majelis" value="Ibu Siti (Anda) 👑" />
      </div>

      <LinkCard icon={<File size={24} />} title="Tentang Modal" subtitle="Keuntungan dan cara kerja Modal." />
      <div className="pb-16">
        <LinkCard icon={<Headset size={24} />} title="AmarthaCare" />
      </div>
    </Screen>
  )
}

function ActionRow({ emoji, text, border }: { emoji: string; text: string; border?: boolean }) {
  return (
    <div className={`flex items-center gap-8 py-12 ${border ? 'border-t border-light' : ''}`}>
      <span className="shrink-0 text-16">{emoji}</span>
      <p className="min-w-0 flex-1 text-12 text-caption">{text}</p>
      <span className="flex shrink-0 items-center gap-4 rounded-full border border-green-500 bg-green-50 px-12 py-8 text-12 font-bold text-green-600">
        <WhatsappLogo size={16} /> Ingatkan
      </span>
    </div>
  )
}

function LinkCard({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex w-full items-center gap-12 rounded-12 border border-default bg-neutral-white p-16">
      <span className="shrink-0 text-default">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-14 font-bold text-default">{title}</p>
        {subtitle && <p className="mt-2 text-12 text-caption">{subtitle}</p>}
      </div>
      <span className="shrink-0 text-disabled">
        <ChevronRight size={20} />
      </span>
    </div>
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
        {member.ketua && (
          <span className="mt-2 inline-block rounded-full border border-default px-8 py-2 text-12 text-caption">
            Ketua
          </span>
        )}
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

function StatRow({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={`flex items-center gap-12 py-8 ${border ? 'border-b border-light' : ''}`}>
      <span className="flex-1 text-12 text-caption">{label}</span>
      <span className="text-14 font-bold text-default">{value}</span>
    </div>
  )
}
