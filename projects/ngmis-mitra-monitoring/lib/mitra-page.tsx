'use client'

// Mitra monitoring — the FO monitoring Pembayaran format: title with cascading
// filters, tabs, the week's scope line, four DPD cards, then the BP table.
// A BP's "Lihat detail" opens the drawer with her mitra. Only Pembayaran is
// built; the other tabs are drawn so the header reads the same as the live page.

import { useState } from 'react'
import { BpTable, RepaymentMetrics, TableHeading } from './bp-table'
import { drawerMitraFor } from './drawer-data'
import { MitraDrawer } from './mitra-drawer'
import { BmShell } from './shell'
import { PageHeading, Select, Tabs } from './ui'
import {
  BRANCHES,
  KOTA,
  PROVINCES,
  REGIONS,
  TABS,
  UPDATE_BAR,
} from './data'

export function MitraPage() {
  const [tab, setTab] = useState('repayment')
  const [region, setRegion] = useState('jawa')
  const [province, setProvince] = useState('jawa-barat')
  const [kota, setKota] = useState('cirebon')
  const [branch, setBranch] = useState('belawa')
  const [bpOpen, setBpOpen] = useState<string | null>(null)

  const branchLabel = BRANCHES.find((b) => b.value === branch)?.label ?? ''

  return (
    <BmShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Branches' },
        { label: 'FO monitoring', current: true },
      ]}
      header={
        <>
          <PageHeading
            title={`Performa: ${branchLabel}`}
            actions={
              <>
                <Select label="Region" value={region} onChange={setRegion} options={REGIONS} />
                <Select label="Provinsi" value={province} onChange={setProvince} options={PROVINCES} />
                <Select label="Kota" value={kota} onChange={setKota} options={KOTA} />
                <Select label="Branch" value={branch} onChange={setBranch} options={BRANCHES} />
              </>
            }
          />
          <Tabs items={TABS} activeId={tab} onChange={setTab} />
        </>
      }
    >
      <span className="pb-12 text-16 font-bold text-default">{UPDATE_BAR.scope}</span>

      <RepaymentMetrics unit="pinjaman" />

      {tab === 'repayment' ? (
        <>
          <TableHeading />
          <BpTable unit="pinjaman" onDetailClick={(bp) => setBpOpen(bp.name)} />
        </>
      ) : (
        <span className="py-32 text-center text-14 text-caption">
          Tab ini tidak termasuk dalam prototipe — hanya Pembayaran.
        </span>
      )}

      {bpOpen ? (
        <MitraDrawer bpName={bpOpen} roster={drawerMitraFor(bpOpen)} onClose={() => setBpOpen(null)} />
      ) : null}
    </BmShell>
  )
}
