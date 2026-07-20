'use client'

import { useState } from 'react'
import { Badge, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { COMMS_TAGS, TIME_OPTS, inWindow } from '../lib/data'
import { store, useApp } from '../lib/store'
import { EmptyState, FilterBar, FilterChip, OptionSheet, ResetLink } from '../lib/ui'

type MenuId = 'time' | 'tag' | null

export function CommsScreen() {
  const flow = useFlow()
  const s = useApp()
  const [menu, setMenu] = useState<MenuId>(null)
  const [time, setTime] = useState<number | null>(null)
  const [tag, setTag] = useState<string | null>(null)

  const list = s.comms.filter((c) => inWindow(c.days, time) && (!tag || c.tag === tag))
  const filtered = time !== null || Boolean(tag)
  const unread = s.comms.filter((c) => !c.read).length

  const tagOpts = [
    { l: 'Semua tipe', v: null as string | null },
    ...COMMS_TAGS.map((t) => ({ l: t, v: t as string | null })),
  ]

  return (
    <Screen topBar={<NavigationHeader title="Informasi & Program" onBack={flow.back} />}>
      <FilterBar>
        <FilterChip
          label={time === null ? 'Waktu' : (TIME_OPTS.find((o) => o.v === time)?.l ?? 'Waktu')}
          active={time !== null}
          open={menu === 'time'}
          onClick={() => setMenu('time')}
        />
        <FilterChip
          label={tag ?? 'Tipe info'}
          active={Boolean(tag)}
          open={menu === 'tag'}
          onClick={() => setMenu('tag')}
        />
        {filtered ? (
          <ResetLink
            onClick={() => {
              setTime(null)
              setTag(null)
            }}
          />
        ) : null}
      </FilterBar>

      <p className="text-12 text-caption">
        {filtered ? `${list.length} dari ${s.comms.length} informasi` : `${s.comms.length} informasi · ${unread} belum dibaca`}
      </p>

      {list.length === 0 ? (
        <EmptyState title="Tidak ada informasi" body="Coba ubah filter." />
      ) : (
        <ul className="flex flex-col gap-12 pb-16">
          {list.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => store.markCommRead(c.id)} className="w-full text-left">
                <Card>
                  <div className="flex items-center justify-between gap-8">
                    <Badge intent="primary">{c.tag}</Badge>
                    <div className="flex items-center gap-8">
                      {!c.read ? <Badge intent="primary">Belum dibaca</Badge> : null}
                      <span className="text-10 text-disabled">{c.d}</span>
                    </div>
                  </div>
                  <p className={`mt-8 text-14 font-bold ${c.read ? 'text-neutral-700' : 'text-default'}`}>{c.title}</p>
                  <p className="mt-4 text-12 text-caption">{c.body}</p>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}

      <OptionSheet
        open={menu === 'time'}
        title="Waktu"
        name="comms-time"
        options={TIME_OPTS}
        value={time}
        onPick={(v) => {
          setTime(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'tag'}
        title="Tipe info"
        name="comms-tag"
        options={tagOpts}
        value={tag}
        onPick={(v) => {
          setTag(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
    </Screen>
  )
}
