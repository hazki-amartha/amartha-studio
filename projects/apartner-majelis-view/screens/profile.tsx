'use client'

// Profil — her own record, and the drawer of things nobody opens twice a day.
//
// Ported from apartner-homepage-ia, the same way the L0 tabs were: the two
// directions should differ on the pelayanan, not on where "Keluar" lives, and a
// second invention of a settings page is noise in that comparison.
//
// KPI now lives at the head of the menu here, with the month's running target
// count as its subtitle — the scoreboard has left the bottom bar (that slot is
// Sales now), so Profil is its way in.
//
// It is the only L0 surface with no back button — it is a destination, not a
// page opened from somewhere.

import { Badge, Card, ListRow } from '@/design-system/components'
import { ChartLineUp, GearSix, Headset, ShieldCheck, SignOut, User } from '@/design-system/icons'
import { TopBar } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BP } from '../lib/schedule'
import { TabBar } from '../lib/tabs'
import { AppScreen, Avatar } from '../lib/ui'

export function ProfileScreen() {
  const { go } = useFlow()

  return (
    <AppScreen topBar={<TopBar>Profil</TopBar>}>
      <Card>
        <div className="flex items-center gap-12">
          <Avatar name={BP.name} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate text-16 font-bold text-default">{BP.name}</span>
            <span className="truncate text-12 text-caption">{BP.role}</span>
            <span className="flex">
              <Badge intent="primary">{BP.branch}</Badge>
            </span>
          </div>
        </div>
      </Card>

      <Card flush>
        <ListRow
          title="KPI"
          description="Penuhi 2 target lagi - sisa 12 hari"
          leading={<ChartLineUp size={20} />}
          chevron
          onClick={() => go('kpi')}
        />
        <ListRow title="Data diri" leading={<User size={20} />} chevron onClick={() => {}} />
        <ListRow
          title="Keamanan akun"
          leading={<ShieldCheck size={20} />}
          chevron
          onClick={() => {}}
        />
        <ListRow title="Pengaturan" leading={<GearSix size={20} />} chevron onClick={() => {}} />
        <ListRow title="Pusat bantuan" leading={<Headset size={20} />} chevron onClick={() => {}} />
      </Card>

      <Card flush>
        <ListRow
          title={<span className="text-red-500">Keluar</span>}
          leading={
            <span className="text-red-500">
              <SignOut size={20} />
            </span>
          }
          onClick={() => {}}
        />
      </Card>

      <p className="pb-16 text-center text-10 text-disabled">{BP.version}</p>

      <TabBar active="profile" />
    </AppScreen>
  )
}
