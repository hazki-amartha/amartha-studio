'use client'

// The Performa page, shared by every variation.
//
// The variations differ only in how the Pembayaran tab draws its figures, so
// the shell, the filter row and the tabs live here once and each screen passes
// in the body it wants. That way a change to the chrome cannot drift between
// variations, and a review is comparing the one thing that actually differs.
//
// Progres harian is ngmis-bm-monitoring-v2's Daily Monitoring dashboard,
// followed exactly — banner, filters, full scorecard and the real briefing
// flow (see lib/daily-dashboard.tsx and NOTES.md). It brings its own
// PageHeading and "diperbarui" line, so the shared scope strip below is
// skipped for that tab rather than saying the same fact twice. Setor tunai is
// a lighter port of a different prototype's Cash outstanding tab (lib/cash-
// table.tsx). Pembayaran and Pencairan are unchanged by any of this.

import { useState, type ReactNode } from 'react'
import { CashTable } from './cash-table'
import { DailyDashboard } from './daily-dashboard'
import { DisbursementTable } from './disbursement-table'
import { DisbursementTableLeads } from './disbursement-table-leads'
import { BmShell } from './shell'
import { useApp } from './store'
import { PageHeading, Select, Tabs } from './ui'
import {
  BP_FILTER,
  BRANCHES,
  DEFAULT_TAB,
  KOTA,
  PROVINCES,
  REGIONS,
  TABS,
  UPDATE_BAR,
} from './data'

export function BranchSummaryPage({ pembayaran }: { pembayaran: ReactNode }) {
  const { pencairanVariant } = useApp()
  const [tab, setTab] = useState(DEFAULT_TAB)
  const [region, setRegion] = useState('jawa')
  const [province, setProvince] = useState('jawa-barat')
  const [kota, setKota] = useState('cirebon')
  const [branch, setBranch] = useState('all')
  const [bp, setBp] = useState('all')

  const kotaLabel = KOTA.find((k) => k.value === kota)?.label ?? ''

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
            title={`Performa: ${kotaLabel}`}
            actions={
              <>
                <Select label="Region" value={region} onChange={setRegion} options={REGIONS} />
                <Select
                  label="Provinsi"
                  value={province}
                  onChange={setProvince}
                  options={PROVINCES}
                />
                <Select label="Kota" value={kota} onChange={setKota} options={KOTA} />
                <Select label="Branch" value={branch} onChange={setBranch} options={BRANCHES} />
                <Select
                  label="Business Partner"
                  value={bp}
                  onChange={setBp}
                  options={BP_FILTER}
                  disabled
                />
              </>
            }
          />
          <Tabs items={TABS} activeId={tab} onChange={setTab} />
        </>
      }
    >
      {/* Scope on the left, freshness on the right — two different facts. The
          scope follows the tab: Pembayaran is read a week at a time, Pencairan
          is set and chased by the month. Progres harian carries its own, so
          it draws neither. */}
      {tab === 'daily' ? null : (
        <div className="flex flex-wrap items-baseline justify-between gap-16 pb-16">
          <span className="text-16 font-bold text-default">
            {tab === 'disbursement' ? UPDATE_BAR.scopeMonthly : UPDATE_BAR.scope}
          </span>
          <span className="text-12 text-caption">{UPDATE_BAR.refreshed}</span>
        </div>
      )}

      {tab === 'daily' ? <DailyDashboard /> : null}
      {tab === 'repayment' ? pembayaran : null}
      {tab === 'cash' ? <CashTable /> : null}
      {tab === 'disbursement' ? (
        pencairanVariant === 'leads' ? (
          <DisbursementTableLeads />
        ) : (
          <DisbursementTable />
        )
      ) : null}
    </BmShell>
  )
}
