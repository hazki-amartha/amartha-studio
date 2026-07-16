'use client'

import { useState } from 'react'
import { Badge, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { COMMS, COMMS_TAGS, TIME_OPTS, inWindow } from '../lib/data'
import { EmptyState, FilterBar, FilterChip, OptionSheet, ResetLink } from '../lib/ui'

type MenuId = 'time' | 'tag' | null

export function CommsScreen() {
  const flow = useFlow()
  const [menu, setMenu] = useState<MenuId>(null)
  const [time, setTime] = useState<number | null>(null)
  const [tag, setTag] = useState<string | null>(null)

  const list = COMMS.filter((c) => inWindow(c.days, time) && (!tag || c.tag === tag))
  const filtered = time !== null || Boolean(tag)

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
        {filtered ? `${list.length} dari ${COMMS.length} informasi` : `${COMMS.length} informasi`}
      </p>

      {list.length === 0 ? (
        <EmptyState title="Tidak ada informasi" body="Coba ubah filter." />
      ) : (
        <ul className="flex flex-col gap-12 pb-16">
          {list.map((c) => (
            <li key={c.id}>
              <Card>
                <div className="flex items-center justify-between gap-8">
                  <Badge intent="primary">{c.tag}</Badge>
                  <span className="text-10 text-disabled">{c.d}</span>
                </div>
                <p className="mt-8 text-14 font-bold text-default">{c.title}</p>
                <p className="text-12 text-caption">{c.body}</p>
              </Card>
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
