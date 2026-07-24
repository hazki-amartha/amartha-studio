'use client'

// Profil — her own record, and the drawer of things nobody opens twice a day.
//
// Ported from apartner-homepage-ia, the same way the L0 tabs were: the two
// directions should differ on the pelayanan, not on where "Keluar" lives, and a
// second invention of a settings page is noise in that comparison.
//
// One change from the source. That version put a KPI card here as a second
// route into the scoreboard, which made sense when Profil sat behind an avatar
// in a header. Here KPI is its own tab one thumb away, so the card would be a
// shortcut to the thing beside it.
//
// It is the only L0 surface with no back button — it is a destination, not a
// page opened from somewhere.

import { Badge, Card, ListRow } from '@/design-system/components'
import { GearSix, Headset, ShieldCheck, SignOut, User } from '@/design-system/icons'
import { Screen, TopBar } from '@/platform/primitives'
import { BP } from '../lib/schedule'
import { TabBar } from '../lib/tabs'
import { Avatar } from '../lib/ui'

export function ProfileScreen() {
  return (
    <Screen topBar={<TopBar>Profil</TopBar>}>
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
    </Screen>
  )
}
