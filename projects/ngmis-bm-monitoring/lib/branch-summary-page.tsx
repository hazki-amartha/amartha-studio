'use client'

// The Performa page, shared by every variation.
//
// The variations differ only in how the Pembayaran tab draws its figures, so
// the shell, the filter row and the tabs live here once and each screen passes
// in the body it wants. That way a change to the chrome cannot drift between
// variations, and a review is comparing the one thing that actually differs.
//
// Tugas is deliberately empty: the earlier placeholder content there was
// invented, and a plausible-looking chart nobody has designed is worse than a
// blank — it gets reviewed as though it were a proposal. Pencairan now has a
// design of its own and draws it.

import { useState, type ReactNode } from 'react'
import { DisbursementTable } from './disbursement-table'
import { BmShell } from './shell'
import { PageHeading, Panel, Select, Tabs } from './ui'
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

/** A tab that has not been designed yet, saying so plainly. */
function NotDesignedYet({ label }: { label: string }) {
  return (
    <Panel>
      <div className="flex flex-col items-center gap-8 py-48 text-center">
        <span className="text-16 font-bold text-default">{label} belum dirancang</span>
        <span className="text-12 text-caption">
          Fokus saat ini ada di tab Pembayaran.
        </span>
      </div>
    </Panel>
  )
}

export function BranchSummaryPage({ pembayaran }: { pembayaran: ReactNode }) {
  const [tab, setTab] = useState(DEFAULT_TAB)
  const [region, setRegion] = useState('jawa')
  const [province, setProvince] = useState('jawa-barat')
  const [kota, setKota] = useState('cirebon')
  const [branch, setBranch] = useState('all')
  const [bp, setBp] = useState('all')

  const kotaLabel = KOTA.find((k) => k.value === kota)?.label ?? ''
  const tabLabel = TABS.find((t) => t.id === tab)?.label ?? ''

  return (
    <BmShell
      breadcrumbs={[{ label: 'Home' }, { label: 'Branches' }, { label: 'Activity', current: true }]}
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
      {/* Scope on the left, freshness on the right — two different facts. */}
      <div className="flex flex-wrap items-baseline justify-between gap-16 pb-16">
        <span className="text-16 font-bold text-default">{UPDATE_BAR.scope}</span>
        <span className="text-12 text-caption">{UPDATE_BAR.refreshed}</span>
      </div>

      {tab === 'repayment' ? pembayaran : null}
      {tab === 'disbursement' ? <DisbursementTable /> : null}
      {tab === 'task' ? <NotDesignedYet label={tabLabel} /> : null}
    </BmShell>
  )
}
