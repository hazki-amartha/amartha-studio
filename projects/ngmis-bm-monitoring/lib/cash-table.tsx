'use client'

// Setor tunai — cash a BP is still holding, ported from the reference Cash
// Outstanding tab (ngmis-cash-outstanding). That project's drill-in — the
// per-mitra breakdown drawer, the acknowledge/mangkir workflow — isn't
// brought across; this tab shows the same read, Nama · Belum disetor ·
// Setoran terakhir · Tindakan, without wiring the actions to anything, the
// same way Download stays a placeholder on the other tabs (CLAUDE.md §3).
//
// Only the money and the timestamp are facts and stay black; `status` is
// already a judgement (a BP IS late or isn't), so it prints in red rather
// than getting a second colour decision layered on top.

import { Button } from '@/design-system/components'
import { DownloadSimple } from '@/design-system/icons'
import { BucketCard, Panel } from './ui'
import { CASH_ROWS, rupiah, type CashRow } from './data'

const rp = (n: number) => `Rp${rupiah(n)}`

export function CashMetrics() {
  const total = CASH_ROWS.reduce((n, r) => n + r.belumDisetor, 0)
  const late = CASH_ROWS.filter((r) => r.action).length

  return (
    <div className="grid grid-cols-2 gap-16 pb-16">
      <BucketCard label="Belum disetor" value={rp(total)} caption="Seluruh BP cabang" />
      <BucketCard label="BP Terlambat Setoran" value={`${late}`} caption="dari total BP" />
    </div>
  )
}

export function CashHeading() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-16 pb-12">
      <span className="text-16 font-bold text-default">Setor Tunai per BP</span>
      <Button variant="outline" size="sm" onClick={() => undefined}>
        <span className="flex items-center gap-8">
          <DownloadSimple size={16} />
          Download
        </span>
      </Button>
    </div>
  )
}

export function CashTable() {
  return (
    <>
      <CashMetrics />
      <CashHeading />
      <Panel className="p-0">
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-neutral-200">
                <th className="px-16 py-12 text-12 font-bold text-default" style={{ width: 180 }}>
                  Nama BP
                </th>
                <th className="border-l border-default px-16 py-12 text-left text-12 font-bold text-default">
                  Belum disetor
                </th>
                <th className="border-l border-default px-16 py-12 text-left text-12 font-bold text-default">
                  Setoran terakhir
                </th>
                <th className="border-l border-default px-16 py-12 text-left text-12 font-bold text-default">
                  Tindakan
                </th>
              </tr>
            </thead>
            <tbody>
              {CASH_ROWS.map((row, i) => (
                <CashRowView key={row.id} row={row} zebra={i % 2 === 1} />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}

function CashRowView({ row, zebra }: { row: CashRow; zebra: boolean }) {
  const stripe = zebra ? 'bg-neutral-50' : 'bg-neutral-white'
  return (
    <tr className={`border-b border-default ${stripe}`}>
      <td className="px-16 py-16 text-14 text-default">{row.name}</td>
      <td className="border-l border-default px-16 py-16 text-14 text-default">
        <span className="flex flex-col items-start gap-2">
          <span>{row.belumDisetor > 0 ? rp(row.belumDisetor) : '—'}</span>
          {row.belumDisetor > 0 ? (
            <button type="button" onClick={() => undefined} className="text-12 text-link">
              Koreksi nominal
            </button>
          ) : null}
        </span>
      </td>
      <td className="border-l border-default px-16 py-16 text-14 text-default">
        <span className="flex flex-col items-start gap-2">
          <span>{row.lastSetoran}</span>
          {row.status ? <span className="text-10 text-red-500">{row.status}</span> : null}
        </span>
      </td>
      <td className="border-l border-default px-16 py-16">
        {row.action ? (
          <Button variant="outline" size="sm" onClick={() => undefined}>
            {row.action}
          </Button>
        ) : (
          <span className="text-12 text-caption">—</span>
        )}
      </td>
    </tr>
  )
}
