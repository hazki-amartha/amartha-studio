'use client'

import { Badge, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { FO, KPI_PERIODS, buildKpi } from '../lib/data'
import { IconChart, IconChevR, IconGear, IconMegaphone, IconShield, IconSignOut, IconUsers } from '../lib/icons'
import { Avatar, IconTile } from '../lib/ui'

export function ProfileScreen() {
  const flow = useFlow()
  const kpi = buildKpi(KPI_PERIODS[0])

  return (
    <Screen topBar={<NavigationHeader title="Profil" onBack={flow.back} />}>
      <Card className="flex items-center gap-12">
        <Avatar size={48}>{FO.initials}</Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-16 font-bold text-default">{FO.name}</p>
          <p className="text-12 text-caption">{FO.role}</p>
          <div className="mt-4">
            <Badge intent="primary">{FO.branch}</Badge>
          </div>
        </div>
      </Card>

      {/* KPI entry point — the profile's other route into the KPI tab */}
      <Card className="flex items-center gap-12" role="button" tabIndex={0} onClick={() => flow.go('kpi')}>
        <IconTile tone="primary">
          <IconChart size={20} />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className="text-14 font-bold text-default">KPI saya</p>
          <p className="text-12 text-caption">{KPI_PERIODS[0]}</p>
        </div>
        <span className="text-20 font-bold text-primary-600">
          {kpi.metCount}/{kpi.totalParams}
        </span>
        <span className="shrink-0 text-placeholder">
          <IconChevR size={20} />
        </span>
      </Card>

      <Card flush>
        <ListRow title="Data diri" leading={<IconUsers size={20} />} chevron onClick={() => {}} />
        <ListRow title="Keamanan akun" leading={<IconShield size={20} />} chevron onClick={() => {}} />
        <ListRow title="Pengaturan" leading={<IconGear size={20} />} chevron onClick={() => {}} />
        <ListRow title="Pusat bantuan" leading={<IconMegaphone size={20} />} chevron onClick={() => {}} />
      </Card>

      <Card flush>
        <ListRow
          title={<span className="text-red-500">Keluar</span>}
          leading={
            <span className="text-red-500">
              <IconSignOut size={20} />
            </span>
          }
          onClick={() => {}}
        />
      </Card>

      <p className="pb-16 text-center text-10 text-disabled">{FO.version}</p>
    </Screen>
  )
}
