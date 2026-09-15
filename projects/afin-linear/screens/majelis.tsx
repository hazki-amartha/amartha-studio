'use client'

// The majelis behind the bonus card. Deliberately thin — the member-level
// "tugas" view is being reworked, so this carries only the group's condition,
// the three milestones, and the two conditions for sharing them.

import { Badge, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { Majelis, User } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  BONUS,
  GROUP_SIZE,
  MAJELIS_KONDISI,
  MAJELIS_NAME,
  MEMBERS,
  MILESTONES,
  STRETCH,
  eligible,
  majelisOf,
  milestoneStatus,
  short,
  type MilestoneStatus,
} from '../lib/data'
import { useApp } from '../lib/store'

const STATUS_BADGE: Record<
  MilestoneStatus,
  { label: string; intent: 'green' | 'primary' | 'neutral' | 'blue' }
> = {
  cair: { label: 'Sudah cair', intent: 'primary' },
  siap: { label: 'Siap dicairkan', intent: 'green' },
  lewat: { label: 'Terlewat', intent: 'neutral' },
  berjalan: { label: 'Berjalan', intent: 'blue' },
  nanti: { label: 'Belum mulai', intent: 'neutral' },
}

export function MajelisScreen() {
  const flow = useFlow()
  const s = useApp()
  const kondisi = MAJELIS_KONDISI[majelisOf(s)]

  return (
    <Screen topBar={<NavigationHeader title={MAJELIS_NAME} onBack={flow.back} />}>
      <Card>
        <div className="flex items-center gap-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-12 bg-primary-50 text-primary-500">
            <Majelis size={20} />
          </span>
          <p className="min-w-0 flex-1 text-14 text-caption">Kondisi majelis</p>
          <Badge intent={kondisi.intent}>{kondisi.label}</Badge>
        </div>
        <p className="mt-12 text-14 text-default">
          <span className="font-bold">
            {GROUP_SIZE - s.groupShort} dari {GROUP_SIZE}
          </span>{' '}
          anggota sudah bayar minggu ini
        </p>
      </Card>

      <Card>
        <div className="flex items-center gap-12 border-b border-default pb-12">
          <p className="min-w-0 flex-1 text-14 font-bold text-default">Anggota majelis</p>
          <p className="text-12 text-caption">{GROUP_SIZE} mitra</p>
        </div>
        {MEMBERS.map((m, i) => (
          <MemberRow
            key={m.name}
            name={i === 0 ? `${m.name} (Anda)` : m.name}
            ketua={m.ketua}
            divider={i > 0}
            status={
              i === 0
                ? eligible(s)
                  ? 'lancar'
                  : 'telat'
                : i >= MEMBERS.length - s.groupShort
                  ? 'belum'
                  : 'lancar'
            }
          />
        ))}
      </Card>

      <Card flush>
        <p className="px-12 pt-12 text-14 font-bold text-default">Cair tambahan</p>
        {MILESTONES.map((i) => {
          const badge = STATUS_BADGE[milestoneStatus(s, i)]
          return (
            <ListRow
              key={i}
              title={`Tambahan ke-${i} · ${short(BONUS)}`}
              description={`Minggu ${i * STRETCH}`}
              trailing={<Badge intent={badge.intent}>{badge.label}</Badge>}
            />
          )
        })}
      </Card>

      <Card flush>
        <p className="px-12 pt-12 text-14 font-bold text-default">Syarat tiap tambahan</p>
        <ListRow
          leading={<Majelis size={20} className="text-primary-500" />}
          title="Semua anggota bayar lancar"
          description={`${STRETCH} minggu berturut-turut`}
        />
        <ListRow
          leading={<User size={20} className="text-primary-500" />}
          title="Angsuran Ibu tepat waktu"
          description="Kalau telat, Ibu tidak ikut dapat"
        />
      </Card>
    </Screen>
  )
}

const MEMBER_STATUS = {
  lancar: { label: 'Lancar', intent: 'green' },
  belum: { label: 'Belum bayar', intent: 'orange' },
  telat: { label: 'Telat', intent: 'red' },
} as const

function MemberRow({
  name,
  ketua,
  divider,
  status,
}: {
  name: string
  ketua?: boolean
  divider: boolean
  status: keyof typeof MEMBER_STATUS
}) {
  const badge = MEMBER_STATUS[status]
  return (
    <div className={`flex items-center gap-12 py-12 ${divider ? 'border-t border-default' : ''}`}>
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
        <User size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-14 font-bold text-default">{name}</p>
        {ketua ? <p className="text-12 text-caption">Ketua majelis</p> : null}
      </div>
      <Badge intent={badge.intent}>{badge.label}</Badge>
    </div>
  )
}
