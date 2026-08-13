'use client'

// FO User Management — reached from the "Tandai sebagai Mangkir" action on the
// Cash outstanding table. Deliberately blank for now: it exists so the action
// has somewhere to land (§3 click-through), with the branch chrome around it.

import { FoShell } from '../lib/shell'
import { PageHeading } from '../lib/ui'

export function FoUserManagementScreen() {
  return (
    <FoShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: 'FO Report' },
        { label: 'User Management', current: true },
      ]}
      header={<PageHeading title="FO User Management" />}
    >
      {null}
    </FoShell>
  )
}
