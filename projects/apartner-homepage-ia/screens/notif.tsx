'use client'

import { useState } from 'react'
import { Badge, Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { NOTIF_BADGE, NOTIF_TYPES, TIME_OPTS, inWindow, type NotifType } from '../lib/data'
import { IconBell } from '../lib/icons'
import { store, unreadCount, useApp } from '../lib/store'
import { Avatar, EmptyState, FilterBar, FilterChip, OptionSheet, ResetLink } from '../lib/ui'

type MenuId = 'time' | 'type' | null

/** Dot swatches for the type picker — one per Badge intent in NOTIF_BADGE. */
const TYPE_DOT: Record<NotifType, string> = {
  Tugas: 'bg-blue-500',
  Penagihan: 'bg-red-500',
  Persetujuan: 'bg-green-500',
  Sistem: 'bg-neutral-600',
}

const AVATAR_TONE: Record<NotifType, 'blue' | 'red' | 'primary' | 'neutral'> = {
  Tugas: 'blue',
  Penagihan: 'red',
  Persetujuan: 'primary',
  Sistem: 'neutral',
}

export function NotifScreen() {
  const flow = useFlow()
  const s = useApp()
  const [menu, setMenu] = useState<MenuId>(null)
  const [time, setTime] = useState<number | null>(null)
  const [type, setType] = useState<NotifType | null>(null)

  const list = s.notifs.filter((n) => inWindow(n.days, time) && (!type || n.type === type))
  const filtered = time !== null || Boolean(type)
  const unread = unreadCount(s.notifs)

  const typeOpts = [
    { l: 'Semua tipe', v: null as NotifType | null },
    ...NOTIF_TYPES.map((t) => ({ l: t, v: t as NotifType | null, dot: TYPE_DOT[t] })),
  ]

  return (
    <Screen
      topBar={
        <NavigationHeader
          title="Notifikasi"
          onBack={flow.back}
          link={unread > 0 ? 'Tandai dibaca' : undefined}
          onLinkClick={() => store.readAll()}
        />
      }
    >
      <FilterBar>
        <FilterChip
          label={time === null ? 'Waktu' : (TIME_OPTS.find((o) => o.v === time)?.l ?? 'Waktu')}
          active={time !== null}
          open={menu === 'time'}
          onClick={() => setMenu('time')}
        />
        <FilterChip
          label={type ?? 'Tipe notif'}
          active={Boolean(type)}
          open={menu === 'type'}
          onClick={() => setMenu('type')}
        />
        {filtered ? (
          <ResetLink
            onClick={() => {
              setTime(null)
              setType(null)
            }}
          />
        ) : null}
      </FilterBar>

      <p className="text-12 text-caption">
        {filtered ? `${list.length} dari ${s.notifs.length} notifikasi` : `${unread} belum dibaca`}
      </p>

      {list.length === 0 ? (
        <EmptyState title="Tidak ada notifikasi" body="Coba ubah filter." />
      ) : (
        <ul className="-mx-16 flex flex-col pb-16">
          {list.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => store.readOne(n.id)}
                className={`flex w-full items-start gap-12 border-b border-light px-16 py-12 text-left ${
                  n.read ? 'bg-neutral-white' : 'bg-primary-50'
                }`}
              >
                <Avatar tone={n.read ? 'neutral' : AVATAR_TONE[n.type]} size={40}>
                  <IconBell size={20} />
                </Avatar>
                <span className="min-w-0 flex-1">
                  <Badge intent={NOTIF_BADGE[n.type]}>{n.type}</Badge>
                  <span
                    className={`mt-8 block text-14 text-default ${n.read ? '' : 'font-bold'}`}
                  >
                    {n.title}
                  </span>
                  <span className="block text-12 text-caption">{n.s}</span>
                </span>
                {!n.read ? (
                  <span className="mt-8 block h-8 w-8 shrink-0 rounded-full bg-primary-500" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}

      <OptionSheet
        open={menu === 'time'}
        title="Waktu"
        name="notif-time"
        options={TIME_OPTS}
        value={time}
        onPick={(v) => {
          setTime(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'type'}
        title="Tipe notif"
        name="notif-type"
        options={typeOpts}
        value={type}
        onPick={(v) => {
          setType(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
    </Screen>
  )
}
