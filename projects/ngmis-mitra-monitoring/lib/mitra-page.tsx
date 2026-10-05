'use client'

// Mitra monitoring — the FO monitoring format: title with cascading filters,
// tabs, the week's scope line, four DPD cards, then a grouped table. Two tabs
// read the same book two ways: by majelis (the counts) and by mitra (who).

import { Fragment, useState } from 'react'
import { Button } from '@/design-system/components'
import { Badge } from '@/design-system/components'
import { DownloadSimple } from '@/design-system/icons'
import { MitraDrawer } from './mitra-drawer'
import { drawerMitraFor } from './drawer-data'
import { BmShell } from './shell'
import { BucketCard, Panel, PageHeading, RatePill, Select, Tabs } from './ui'
import {
  BRANCHES,
  BUCKETS,
  KOTA,
  MAJELIS,
  MITRA,
  PROVINCES,
  REGIONS,
  TABS,
  TARGETS,
  UPDATE_BAR,
  branchBucket,
  formatRate,
  meetsTarget,
  rateOf,
  rupiah,
  totalOf,
  type BucketId,
  type Count,
} from './data'

const GROUPS: { id: 'total' | BucketId; header: string }[] = [
  { id: 'total', header: 'Total mitra' },
  ...BUCKETS.map((b) => ({ id: b.id, header: b.label })),
]

export function MitraPage() {
  const [tab, setTab] = useState('majelis')
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
        { label: 'Mitra monitoring', current: true },
      ]}
      header={
        <>
          <PageHeading
            title={`Mitra: ${branchLabel}`}
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
      <div className="flex flex-wrap items-baseline justify-between gap-16 pb-16">
        <span className="text-16 font-bold text-default">{UPDATE_BAR.scope}</span>
        <span className="text-12 text-caption">{UPDATE_BAR.refreshed}</span>
      </div>

      <div className="grid grid-cols-4 gap-16 pb-16">
        {BUCKETS.map((b) => (
          <BucketCard
            key={b.id}
            label={b.label}
            intent={b.intent}
            value={rupiah(branchBucket(b.id).total)}
            caption="Total mitra aktif"
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-16 pb-12">
        <span className="text-16 font-bold text-default">
          {tab === 'majelis' ? 'Performa majelis' : 'Mitra perlu perhatian'}
        </span>
        <Button variant="outline" size="sm" onClick={() => undefined}>
          <span className="flex items-center gap-8">
            <DownloadSimple size={16} />
            Download
          </span>
        </Button>
      </div>

      {tab === 'majelis' ? <MajelisTable onBp={setBpOpen} /> : <MitraTable onBp={setBpOpen} />}

      {bpOpen ? (
        <MitraDrawer bpName={bpOpen} roster={drawerMitraFor(bpOpen)} onClose={() => setBpOpen(null)} />
      ) : null}
    </BmShell>
  )
}

function Rate({ n, id }: { n: Count; id: 'total' | BucketId }) {
  const label = formatRate(rateOf(n))
  if (id === 'total') return <span className="text-14 text-default">{label}</span>
  return <RatePill ok={meetsTarget(n, id)}>{label}</RatePill>
}

function BpLink({ name, onBp }: { name: string; onBp: (bp: string) => void }) {
  return (
    <button type="button" onClick={() => onBp(name)} className="text-12 text-link hover:underline">
      {name}
    </button>
  )
}

function MajelisTable({ onBp }: { onBp: (bp: string) => void }) {
  const counts = (m: (typeof MAJELIS)[number], id: 'total' | BucketId): Count =>
    id === 'total' ? totalOf(m) : m[id]

  return (
    <Panel className="p-0">
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-neutral-200">
              <th rowSpan={2} className="px-16 pb-12 pt-16 text-12 font-bold text-default" style={{ width: 150 }}>
                Majelis
              </th>
              {GROUPS.map((g) => {
                const target = g.id === 'total' ? undefined : TARGETS[g.id]
                return (
                  <th
                    key={g.id}
                    colSpan={3}
                    className="border-l border-default px-16 pb-8 pt-16 text-center text-12 font-bold text-default"
                  >
                    <span className="flex flex-col gap-2">
                      {g.header}
                      {target ? (
                        <span className="text-12 font-regular text-caption">Target {target}%</span>
                      ) : null}
                    </span>
                  </th>
                )
              })}
            </tr>
            <tr className="bg-neutral-200">
              {GROUPS.map((g) => (
                <Fragment key={g.id}>
                  <th className="border-l border-default px-12 pb-12 text-center text-12 font-regular text-caption">Aktif</th>
                  <th className="px-12 pb-12 text-center text-12 font-regular text-caption">Terbayar</th>
                  <th className="px-12 pb-12 text-center text-12 font-regular text-caption">Rate</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {MAJELIS.map((m, i) => (
              <tr
                key={m.id}
                className={`border-b border-default ${i % 2 === 1 ? 'bg-neutral-50' : 'bg-neutral-white'}`}
              >
                <td className="px-16 py-16 text-14 text-default">
                  <span className="flex flex-col items-start gap-2">
                    {m.name}
                    <BpLink name={m.bp} onBp={onBp} />
                  </span>
                </td>
                {GROUPS.map((g) => {
                  const n = counts(m, g.id)
                  return (
                    <Fragment key={g.id}>
                      <td className="border-l border-default px-12 py-16 text-center text-14 text-default">{n.total}</td>
                      <td className="px-12 py-16 text-center text-14 text-default">{n.paid}</td>
                      <td className="px-12 py-16 text-center">
                        <Rate n={n} id={g.id} />
                      </td>
                    </Fragment>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function MitraTable({ onBp }: { onBp: (bp: string) => void }) {
  return (
    <Panel className="p-0">
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-neutral-200">
              {['Nama', 'Majelis', 'BP', 'Status', 'Tunggakan', 'Angsuran terakhir'].map((h) => (
                <th key={h} className="px-16 py-16 text-12 font-bold text-default">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MITRA.map((m, i) => {
              const b = BUCKETS.find((x) => x.id === m.bucket)!
              return (
                <tr
                  key={m.id}
                  className={`border-b border-default ${i % 2 === 1 ? 'bg-neutral-50' : 'bg-neutral-white'}`}
                >
                  <td className="px-16 py-16 text-14 text-default">{m.name}</td>
                  <td className="px-16 py-16 text-14 text-default">{m.majelis}</td>
                  <td className="px-16 py-16 text-14">
                    <button type="button" onClick={() => onBp(m.bp)} className="text-link hover:underline">
                      {m.bp}
                    </button>
                  </td>
                  <td className="px-16 py-16">
                    <Badge intent={b.intent} variant="subtle" size="sm">
                      {b.label}
                    </Badge>
                  </td>
                  <td className="px-16 py-16 text-14 text-default">
                    {m.tunggakan ? `Rp${rupiah(m.tunggakan)}` : '-'}
                  </td>
                  <td className="px-16 py-16 text-14 text-default">{m.lastPaid}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
