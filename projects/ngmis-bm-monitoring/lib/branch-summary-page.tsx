'use client'

// The Performa page, shared by every variation.
//
// The variations differ only in how the Pembayaran tab draws its figures, so
// the shell, the filter row, the tabs and the other two tabs live here once and
// each screen passes in the body it wants. That way a change to the chrome
// cannot drift between variations, and a review is comparing the one thing
// that actually differs.

import { useMemo, useState, type ReactNode } from 'react'
import { BmShell } from './shell'
import {
  DataTable,
  Pagination,
  Panel,
  PanelHeading,
  PageHeading,
  ProgressBar,
  Select,
  StatCard,
  Tabs,
  type Column,
  type SortDir,
} from './ui'
import {
  BP_FILTER,
  BP_ROWS,
  BP_TOTAL,
  BRANCHES,
  DEFAULT_TAB,
  KOTA,
  KPIS,
  PROVINCES,
  REGIONS,
  TABS,
  UPDATE_BAR,
  TAB_VIEWS,
} from './data'

const ALL_COLUMNS: Column[] = [
  { id: 'name', header: 'Business Partner', sortable: true },
  { id: 'majelis', header: 'Majelis aktif', sortable: true },
  { id: 'repayment', header: 'Repayment  rate', sortable: true },
  { id: 'dpd', header: 'New flow DPD 1-30', sortable: true },
  { id: 'tasks', header: 'Tugas Terkirim', sortable: true },
  { id: 'disbursement', header: 'Disbursement', sortable: true },
]

export function BranchSummaryPage({ pembayaran }: { pembayaran: ReactNode }) {
  const [tab, setTab] = useState(DEFAULT_TAB)
  const [region, setRegion] = useState('jawa')
  const [province, setProvince] = useState('jawa-barat')
  const [kota, setKota] = useState('cirebon')
  const [branch, setBranch] = useState('all')
  const [bp, setBp] = useState('all')
  const [sort, setSort] = useState<{ columnId: string; dir: SortDir } | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState('10')

  const sorted = useMemo(() => {
    if (!sort) return BP_ROWS
    const value = (row: (typeof BP_ROWS)[number]) => {
      switch (sort.columnId) {
        case 'majelis':
          return row.majelisAktif
        case 'repayment':
          return row.repaymentRate
        case 'dpd':
          return row.newFlowDpd
        case 'tasks':
          return row.tasksDone / row.tasksTotal
        default:
          return row.name
      }
    }
    return [...BP_ROWS].sort((a, b) => {
      const av = value(a)
      const bv = value(b)
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv))
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [sort])

  const rows = sorted.map((row) => ({
    id: row.id,
    cells: {
      name: row.name,
      majelis: row.majelisAktif,
      repayment: `${row.repaymentRate}%`,
      dpd: row.newFlowDpd,
      tasks: (
        <span className="flex flex-col gap-4">
          <span className="text-14 text-default">
            {row.tasksDone}/{row.tasksTotal} Tugas
          </span>
          <ProgressBar percent={Math.round((row.tasksDone / row.tasksTotal) * 100)} />
        </span>
      ),
      disbursement: row.disbursement,
    },
  }))

  const pageCount = Math.ceil(BP_TOTAL / Number(perPage))

  const view = TAB_VIEWS[tab]
  const kpis = KPIS.filter((kpi) => view.kpis.includes(kpi.id))
  const columns = ALL_COLUMNS.filter((col) => view.columns.includes(col.id))
  const kotaLabel = KOTA.find((k) => k.value === kota)?.label ?? ''

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

      {tab === 'repayment' ? (
        pembayaran
      ) : (
        <>
          <div className="grid grid-cols-3 gap-16 pb-16">
            {kpis.map((kpi) => (
              <StatCard
                key={kpi.id}
                label={kpi.label}
                value={kpi.value}
                delta={kpi.delta}
                average={kpi.average}
                aside={kpi.aside}
              />
            ))}
          </div>

          <Panel>
            <PanelHeading title="BP Performance" subtitle="Performa per BP di poin ini." />
            <DataTable
              columns={columns}
              rows={rows}
              sort={sort}
              onSortChange={(columnId) =>
                setSort((prev) =>
                  prev?.columnId === columnId
                    ? { columnId, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                    : { columnId, dir: 'asc' },
                )
              }
            />
            <Pagination
              page={page}
              pageCount={pageCount}
              rangeLabel={`1 - ${rows.length} of ${BP_TOTAL} entries.`}
              onPageChange={setPage}
              perPage={perPage}
              onPerPageChange={(next) => {
                setPerPage(next)
                setPage(1)
              }}
            />
          </Panel>
        </>
      )}
    </BmShell>
  )
}
