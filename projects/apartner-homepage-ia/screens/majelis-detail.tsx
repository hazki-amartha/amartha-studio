'use client'

import { useState } from 'react'
import { Badge, Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  PRODUCT,
  TONE_TEXT,
  mitraOf,
  recsFor,
  type Mitra,
  type Tone,
} from '../lib/data'
import { IconChat, IconPin } from '../lib/icons'
import { selectedMajelis, useApp } from '../lib/store'
import { Avatar, EmptyState, SearchField } from '../lib/ui'

const repTone = (rep: number): Tone => (rep >= 90 ? 'on' : rep >= 75 ? 'warn' : 'off')
const attTone = (att: number): Tone => (att >= 80 ? 'on' : att >= 70 ? 'warn' : 'off')

export function MajelisDetailScreen() {
  const flow = useFlow()
  const s = useApp()
  const g = selectedMajelis(s)
  const [q, setQ] = useState('')

  const qq = q.trim().toLowerCase()
  const all = mitraOf(g.n)
  const list = all
    .filter((m) => !qq || m.n.toLowerCase().includes(qq))
    .sort((a, b) => b.dpd - a.dpd) // menunggak mitra surface first

  return (
    <Screen topBar={<NavigationHeader title={g.n} onBack={flow.back} />}>
      <p className="text-12 text-caption">
        {all.length} mitra · {g.day} · {g.area}
      </p>

      <SearchField
        value={q}
        onChange={setQ}
        placeholder={`Cari mitra di ${g.n}`}
        aria-label="Cari mitra"
      />

      {/* Rates strip — inline, with targets, colour-coded against them */}
      <div className="flex items-center gap-8 text-12 text-caption">
        <span>
          Repayment <b className={TONE_TEXT[repTone(g.rep)]}>{g.rep}%</b>{' '}
          <span className="text-placeholder">/ 90%</span>
        </span>
        <span className="text-neutral-200">|</span>
        <span>
          Attendance <b className={TONE_TEXT[attTone(g.att)]}>{g.att}%</b>{' '}
          <span className="text-placeholder">/ 80%</span>
        </span>
      </div>

      {/* Detail majelis — small enough (2 rows) to sit above the mitra list
          without pushing the primary work surface out of reach. */}
      <Card flush>
        <ListRow
          leading={<IconPin size={20} />}
          title={<span className="text-10 text-disabled">Lokasi kumpulan</span>}
          description={<span className="text-12 text-default">{g.lokasi}</span>}
          trailing={
            <Button variant="ghost" size="xs">
              Buka peta
            </Button>
          }
        />
        <ListRow
          leading={<IconChat size={20} />}
          title={<span className="text-10 text-disabled">Grup WhatsApp</span>}
          description={<span className="text-12 text-default">{g.wa}</span>}
          trailing={
            <Button variant="ghost" size="xs">
              Buka grup
            </Button>
          }
        />
      </Card>

      <p className="text-12 text-caption">
        {qq ? `${list.length} dari ${all.length} mitra` : `Daftar mitra (${all.length})`}
      </p>

      {list.length === 0 ? (
        <EmptyState title="Tidak ada mitra" body="Coba kata kunci lain." />
      ) : (
        <ul className="flex flex-col gap-12 pb-16">
          {list.map((m) => (
            <li key={m.n}>
              <MitraCard m={m} />
            </li>
          ))}
        </ul>
      )}
    </Screen>
  )
}

function MitraCard({ m }: { m: Mitra }) {
  const isMenunggak = !m.pending && m.dpd > 0
  const nRec = recsFor(m).length

  const subtitle = isMenunggak
    ? { text: `DPD ${m.dpd} · ${m.p}`, cls: 'font-bold text-red-500' }
    : m.pending
      ? { text: 'Pengajuan baru · belum verifikasi SLIK', cls: 'font-bold text-blue-700' }
      : { text: `${m.p} · Lancar`, cls: 'text-caption' }

  const tone = isMenunggak ? 'red' : m.pending ? 'blue' : m.ketua ? 'primary' : 'neutral'

  return (
    <Card className={isMenunggak ? 'border-red-200' : undefined}>
      <div className="flex items-center gap-8">
        <Avatar tone={tone} size={40}>
          {m.n.charAt(0)}
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-14 font-bold text-default">{m.n}</span>
            {m.ketua ? <Badge intent="primary">Ketua</Badge> : null}
          </div>
          <p className={`text-12 ${subtitle.cls}`}>{subtitle.text}</p>
        </div>
      </div>

      {/* Bottom row keeps a consistent structure across every state: products on
          the left, a status cue on the right. Mitra detail is switched off, so
          the right side is a label — no chevron, no tap affordance. */}
      <div className="mt-12 flex items-end gap-8 border-t border-light pt-12">
        <div className="min-w-0 flex-1">
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
            <span className="text-10 text-disabled">—</span>
          )}
        </div>

        {isMenunggak ? (
          <Badge intent="red">Perlu ditagih</Badge>
        ) : nRec > 0 ? (
          <span className="shrink-0 text-10 font-bold text-disabled">{nRec} rekomendasi</span>
        ) : null}
      </div>
    </Card>
  )
}
