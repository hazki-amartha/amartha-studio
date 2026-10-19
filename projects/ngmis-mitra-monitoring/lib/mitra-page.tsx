'use client'

// Mitra monitoring — the FO monitoring Pembayaran format: title with cascading
// filters, tabs, the week's scope line, four DPD cards, then the BP table.
// A BP's "Lihat detail" opens the drawer with her mitra. Only Pembayaran is
// built; the other tabs are drawn so the header reads the same as the live page.

import { useEffect, useState } from 'react'
import { CashPage } from './cash-page'
import { DailyDashboard } from './daily-dashboard'
import { WeeklyProgress } from './weekly-page'
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
  const [tab, setTab] = useState('daily')
  const [region, setRegion] = useState('jawa')
  const [province, setProvince] = useState('jawa-barat')
  const [kota, setKota] = useState('cirebon')
  const [branch, setBranch] = useState('belawa')
  const [cashBp, setCashBp] = useState<string | undefined>()
  const [bpOpen, setBpOpen] = useState<string | null>(null)

  // A page opened by "Review" in a new browser tab lands straight on Sisa setor
  // tunai for that BP (?tab=cash&bp=...).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    if (q.get('tab') !== 'cash') return
    setCashBp(q.get('bp') ?? undefined)
    setTab('cash')
  }, [])

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
          <Tabs items={TABS} activeId={tab} onChange={(t) => {
            setCashBp(undefined)
            setTab(t)
          }} />
        </>
      }
    >
      {tab === 'daily' ? (
        <DailyDashboard
          // Opens in a new browser tab so the BM keeps the daily drawer where it is.
          onOpenCash={(name) =>
            // eslint-disable-next-line no-restricted-properties -- asked for in #525; it opens this same prototype, so the viewer never leaves the studio
            window.open(
              `${window.location.pathname}?tab=cash&bp=${encodeURIComponent(name)}`,
              '_blank',
              'noopener',
            )
          }
        />
      ) : tab === 'weekly' ? (
        <WeeklyProgress
          onOpenCash={(name) => {
            setCashBp(name)
            setTab('cash')
          }}
        />
      ) : tab === 'cash' ? (
        <CashPage initialBp={cashBp} />
      ) : tab === 'repayment' ? (
        <>
          <span className="pb-12 text-16 font-bold text-default">{UPDATE_BAR.scope}</span>

          <RepaymentMetrics unit="pinjaman" />

          <TableHeading />
          <BpTable unit="pinjaman" onDetailClick={(bp) => setBpOpen(bp.name)} />
        </>
      ) : null}

      {bpOpen ? (
        <MitraDrawer bpName={bpOpen} roster={drawerMitraFor(bpOpen)} onClose={() => setBpOpen(null)} />
      ) : null}
    </BmShell>
  )
}
