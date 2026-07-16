'use client'

import { useState } from 'react'
import { Badge, Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  MAJELIS,
  PRODUCT,
  TYPE_BADGE,
  genInstallments,
  loanStatus,
  recsFor,
  rp,
  type Rec,
} from '../lib/data'
import { IconCal, IconCheck, IconChevR, IconUser } from '../lib/icons'
import { selectedMitra, store, useApp } from '../lib/store'
import { Avatar } from '../lib/ui'

export function MitraDetailScreen() {
  const flow = useFlow()
  const s = useApp()
  const m = selectedMitra(s)
  const g = MAJELIS.find((x) => x.n === m.m) ?? MAJELIS[0]

  const [taken, setTaken] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  const st = loanStatus(m)
  const installments = m.pending ? [] : genInstallments(m)
  const next = installments.find((x) => x.status === 'upcoming')
  const lastPaid = [...installments].reverse().find((x) => x.status !== 'upcoming')

  const active = s.tasks.filter((t) => t.who === m.n)
  const recs = recsFor(m).filter((r) => !taken.includes(r.id))

  function take(r: Rec) {
    store.addTask({
      id: `${r.id}-${Date.now()}`,
      act: r.act,
      who: m.n,
      maj: m.m,
      time: 'Belum dijadwalkan',
      loc: g.area,
      types: r.types,
      meta: r.why,
      day: 0,
      kind: 'rekomendasi',
    })
    setTaken((prev) => [...prev, r.id])
  }

  return (
    <Screen topBar={<NavigationHeader title={m.n} onBack={flow.back} />}>
      {/* Identity + loan */}
      <Card>
        <div className="flex items-center gap-12">
          <Avatar tone="neutral" size={48}>
            {m.n.charAt(0)}
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-12 text-caption">
              {m.ketua ? <b className="text-primary-600">Ketua Majelis · </b> : null}
              {m.m} · {g.area}
            </p>
            <p className="text-16 font-bold text-default">{m.p}</p>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Badge intent={st.intent}>{st.l}</Badge>
          {m.keringanan ? <Badge intent="orange">Dapat Keringanan</Badge> : null}
        </div>

        {/* Autodebit + PIC — surfaced high, not buried behind a tab */}
        {m.autodebit || m.pic ? (
          <div className="mt-12 flex flex-col gap-8 border-t border-light pt-12">
            {m.autodebit ? (
              <div className="flex items-center gap-8">
                <span className="text-disabled">
                  <IconCal size={16} />
                </span>
                <span className="flex-1 text-12 text-caption">Autodebit</span>
                <span className="text-12 font-bold text-default">{m.autodebit}</span>
              </div>
            ) : null}
            {m.pic ? (
              <div className="flex items-center gap-8">
                <span className="text-disabled">
                  <IconUser size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-12 font-bold text-default">{m.pic.n}</span>
                  <span className="block text-10 text-disabled">PIC · {m.pic.rel}</span>
                </span>
                <Button variant="ghost" size="xs">
                  Hubungi
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-12 border-t border-light pt-12">
          <p className="mb-4 text-10 text-disabled">Produk lain</p>
          {m.prod.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {m.prod.map((p) => (
                <Badge key={p} intent={PRODUCT[p].intent}>
                  {PRODUCT[p].l}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-12 text-disabled">Belum ada produk lain</p>
          )}
        </div>
      </Card>

      {/* Riwayat pinjaman — collapsed by default, summary only */}
      {!m.pending ? (
        <section className="flex flex-col gap-8">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            aria-expanded={showHistory}
            className="flex items-center gap-8 text-left"
          >
            <span className="flex-1 text-14 font-bold text-default">Riwayat pinjaman</span>
            <span className={`shrink-0 text-placeholder ${showHistory ? 'rotate-90' : ''}`}>
              <IconChevR size={16} />
            </span>
          </button>
          <p className="text-12 text-caption">
            {next ? `Jatuh tempo berikutnya: ${next.label} · ${rp(next.amt)}` : 'Tidak ada cicilan mendatang'}
            {lastPaid?.status === 'late' ? ' · Cicilan terakhir telat' : ''}
          </p>

          {showHistory ? (
            <Card flush>
              {installments.map((x) => (
                <ListRow
                  key={x.no}
                  leading={<span className="text-12 text-disabled">{x.no}</span>}
                  title={<span className="text-12 text-default">{x.label}</span>}
                  description={<span className="text-12 text-neutral-700">{rp(x.amt)}</span>}
                  trailing={
                    <Badge
                      intent={
                        x.status === 'ontime' ? 'green' : x.status === 'late' ? 'red' : 'neutral'
                      }
                    >
                      {x.status === 'ontime' ? 'Lunas' : x.status === 'late' ? 'Telat' : 'Belum jatuh tempo'}
                    </Badge>
                  }
                />
              ))}
            </Card>
          ) : null}
        </section>
      ) : null}

      {/* Tugas aktif */}
      <section className="flex flex-col gap-8">
        <div className="flex items-center gap-8">
          <h2 className="flex-1 text-14 font-bold text-default">Tugas aktif</h2>
          <span className="text-12 text-caption">{active.length}</span>
        </div>

        {active.length === 0 ? (
          <Card className="border-dashed text-center">
            <p className="text-12 text-caption">Belum ada tugas aktif untuk mitra ini.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-8">
            {active.map((t) => (
              <li key={t.id}>
                <Card>
                  <div className="flex flex-wrap gap-4">
                    {t.types.map((k) => (
                      <Badge key={k} intent={TYPE_BADGE[k]}>
                        {k}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-8 text-14 font-bold text-default">{t.act}</p>
                  <p className="text-12 text-caption">{t.time}</p>
                  {t.meta ? <p className="mt-4 text-12 font-bold text-orange-700">{t.meta}</p> : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Rekomendasi tugas */}
      <section className="flex flex-col gap-8 pb-16">
        <div>
          <h2 className="text-14 font-bold text-default">Rekomendasi tugas</h2>
          <p className="text-12 text-caption">Berdasarkan status pinjaman &amp; produk mitra ini.</p>
        </div>

        {recs.length === 0 ? (
          <Card className="text-center">
            <p className="text-12 text-caption">Semua rekomendasi sudah dijadikan tugas.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-8">
            {recs.map((r) => (
              <li key={r.id}>
                <Card className="flex flex-col gap-8">
                  <div className="flex flex-wrap gap-4">
                    {r.types.map((k) => (
                      <Badge key={k} intent={TYPE_BADGE[k]}>
                        {k}
                      </Badge>
                    ))}
                  </div>
                  <div>
                    <p className="text-14 font-bold text-default">{r.act}</p>
                    <p className="text-12 text-caption">{r.why}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => take(r)}>
                    + Jadikan tugas
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {taken.length > 0 ? (
          <div className="flex items-center gap-8 rounded-8 bg-green-50 px-12 py-8 text-12 text-green-600">
            <IconCheck size={16} />
            <span className="flex-1">{taken.length} tugas ditambahkan ke Tugas hari ini</span>
          </div>
        ) : null}
      </section>
    </Screen>
  )
}
