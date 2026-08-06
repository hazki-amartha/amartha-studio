'use client'

// The BM's landing screen: six branch KPIs, the two reports owed today, and the
// BP performance table underneath. Everything the viewer can touch — the two
// filters, sorting, paging — is local state; only the report tiles and Riwayat
// navigate.

import { useMemo, useState } from 'react'
import { Button } from '@/design-system/components'
import { ArrowRight, History } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { BmShell } from '../lib/shell'
import {
  DataTable,
  MoonGlyph,
  Pagination,
  Panel,
  PanelHeading,
  PageHeading,
  ProgressBar,
  ReportTile,
  Select,
  StatCard,
  SunGlyph,
  Tabs,
  type Column,
  type SortDir,
} from '../lib/ui'
import {
  BP_FILTER,
  BP_ROWS,
  BP_TOTAL,
  BRANCHES,
  KOTA,
  KPIS,
  MAJELIS_FILTER,
  PROVINCES,
  REGIONS,
  TABS,
  TAB_VIEWS,
} from '../lib/data'

const ALL_COLUMNS: Column[] = [
  { id: 'name', header: 'Business Partner', sortable: true },
  { id: 'majelis', header: 'Majelis aktif', sortable: true },
  { id: 'repayment', header: 'Repayment  rate', sortable: true },
  { id: 'dpd', header: 'New flow DPD 1-30', sortable: true },
  { id: 'tasks', header: 'Tugas Terkirim', sortable: true },
  { id: 'disbursement', header: 'Disbursement', sortable: true },
]

export function BranchSummaryScreen() {
  const flow = useFlow()
  const [tab, setTab] = useState('overview')
  const [region, setRegion] = useState('jawa')
  const [province, setProvince] = useState('jawa-barat')
  const [kota, setKota] = useState('cirebon')
  const [branch, setBranch] = useState('all')
  const [bp, setBp] = useState('all')
  const [majelis, setMajelis] = useState('all')
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
            meta="Per 27 Sep 2025, 04.15 WIB"
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
                <Select label="Business Partner" value={bp} onChange={setBp} options={BP_FILTER} />
                <Select
                  label="Majelis"
                  value={majelis}
                  onChange={setMajelis}
                  options={MAJELIS_FILTER}
                />
              </>
            }
          />
          <Tabs items={TABS} activeId={tab} onChange={setTab} />
        </>
      }
    >
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

      <div className="pb-16">
        <Panel>
          <PanelHeading
            title="Daily Report"
            action={
              <button
                type="button"
                onClick={() => flow.go('report-history')}
                className="flex items-center gap-4 text-12 font-bold text-link"
              >
                <History size={16} />
                Riwayat
              </button>
            }
          />
          <div className="flex gap-16">
            <ReportTile
              icon={<SunGlyph />}
              iconTone="text-orange-500"
              title="Morning report"
              body="Majelis 123_BIN TURATEA dan 2 lainnya punya repayment rate dan attendance rate rendah. Rencanakan aksi Anda untuk hari ini."
              action={
                <Button variant="outline" size="sm" onClick={() => flow.go('morning-report')}>
                  <span className="flex items-center gap-8">
                    Isi sekarang
                    <ArrowRight size={16} />
                  </span>
                </Button>
              }
            />
            <ReportTile
              icon={<MoonGlyph />}
              iconTone="text-blue-500"
              title="Evening report"
              body="Repayment rate hari ini masih 20%. Mohon jelaskan apa yang terjadi."
              action={
                <Button variant="outline" size="sm" onClick={() => flow.go('evening-report')}>
                  <span className="flex items-center gap-8">
                    Isi sekarang
                    <ArrowRight size={16} />
                  </span>
                </Button>
              }
            />
          </div>
        </Panel>
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
    </BmShell>
  )
}
