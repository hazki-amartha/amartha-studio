'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge, Card } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  KIND_OPTS,
  KTYPES,
  SORT_OPTS,
  TASK_MAJELIS,
  TASKS,
  TITIP,
  TAG_BG,
  TYPE_BADGE,
  WHEN_OPTS,
  dayLabel,
  inWhen,
  taskDist,
  timeRank,
  type KindFilter,
  type KpiType,
  type Task,
  type TaskSort,
  type WhenFilter,
} from '../lib/data'
import { IconBell, IconChart, IconChevR, IconDoc, IconHouse, IconPin, IconSort, IconUsers } from '../lib/icons'
import { TabBar } from '../lib/shell'
import { store, unreadCount, useApp } from '../lib/store'
import {
  Avatar,
  BannerTag,
  ContextStrip,
  FilterBar,
  FilterChip,
  IconTile,
  OptionSheet,
  ProgressBar,
  ResetLink,
  SectionHeader,
} from '../lib/ui'

type MenuId = 'when' | 'kind' | 'maj' | 'type' | 'sort' | null

const TYPE_DOT: Record<KpiType, string> = {
  Collection: 'bg-blue-500',
  Attendance: 'bg-green-500',
  Disbursement: 'bg-primary-500',
  Acquisition: 'bg-orange-500',
}

function taskIcon(act: string) {
  if (act === 'Kunjungan Majelis') return { I: IconUsers, tone: 'primary' as const }
  if (act === 'Kunjungan Rumah') return { I: IconHouse, tone: 'orange' as const }
  return { I: IconDoc, tone: 'neutral' as const }
}

export function HomeScreen() {
  const flow = useFlow()
  const s = useApp()
  const [menu, setMenu] = useState<MenuId>(null)
  const [sort, setSort] = useState<TaskSort>('default')
  const [slide, setSlide] = useState(0)
  const carousel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = carousel.current
    if (!el) return
    const onScroll = () => setSlide(Math.round(el.scrollLeft / el.clientWidth))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const { filter } = s
  const unread = unreadCount(s.notifs)
  const unreadComms = s.comms.filter((c) => !c.read)

  const tasks = s.tasks
    .filter(
      (t) =>
        inWhen(t.day, filter.when) &&
        (filter.kind === 'all' || t.kind === filter.kind) &&
        (!filter.maj || t.maj === filter.maj) &&
        (!filter.type || t.types.includes(filter.type)),
    )
    .sort((a, b) => {
      // Setor titip bayar is the end-of-day wrap-up — always sorts last.
      const aTitip = a.act === 'Setor Titip Bayar'
      const bTitip = b.act === 'Setor Titip Bayar'
      if (aTitip !== bTitip) return aTitip ? 1 : -1
      return sort === 'distance' ? taskDist(a) - taskDist(b) : a.day - b.day || timeRank(a) - timeRank(b)
    })
  const filtered =
    Boolean(filter.maj || filter.type) || filter.when !== 'today' || filter.kind !== 'wajib'

  const majOpts = [
    { l: 'Semua majelis', v: null as string | null },
    ...TASK_MAJELIS.map((m) => ({ l: m, v: m as string | null })),
  ]
  const typeOpts = [
    { l: 'Semua tipe KPI', v: null as KpiType | null },
    ...KTYPES.map((k) => ({ l: k, v: k as KpiType | null, dot: TYPE_DOT[k] })),
  ]

  function openTask(t: Task) {
    if (t.act === 'Kunjungan Majelis' && t.maj) {
      store.set({ selMajelis: t.maj })
      flow.go('majelis-detail')
    } else if (t.act === 'Kunjungan Rumah') {
      // Lands on the mitra's page — like Kunjungan Majelis lands on the majelis
      // page — rather than opening the flow directly.
      store.set({ selMitra: t.who, selMajelis: t.maj ?? store.get().selMajelis })
      flow.go('mitra-detail')
    } else if (t.act === 'Setor Titip Bayar') {
      flow.go('titip-bayar')
    }
  }

  return (
    <Screen
      topBar={
        <header className="flex items-center gap-12 border-b border-default bg-neutral-white px-16 py-12">
          <button type="button" onClick={() => flow.go('profile')}>
            <Avatar>SR</Avatar>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-12 text-caption">Selamat pagi</p>
            <p className="text-16 font-bold text-default">Siti Rahayu</p>
          </div>
          <button
            type="button"
            onClick={() => flow.go('notif')}
            className="relative shrink-0 text-default"
            aria-label={`Notifikasi, ${unread} belum dibaca`}
          >
            <IconBell />
            {unread > 0 ? (
              <span className="absolute right-0 top-0 flex h-16 min-w-16 items-center justify-center rounded-full border-2 border-neutral-white bg-red-500 px-4 text-10 font-bold text-neutral-white">
                {unread}
              </span>
            ) : null}
          </button>
        </header>
      }
    >
      {/* Informasi & Program — only unread items surface here; read ones live
          on the full Informasi & Program page. */}
      <section className="flex flex-col gap-8">
        <SectionHeader title="Informasi & Program" linkLabel="Lihat semua" onLink={() => flow.go('comms')} />
        {unreadComms.length === 0 ? (
          <p className="text-12 text-caption">Semua informasi sudah dibaca. Buka halaman untuk melihat arsip.</p>
        ) : (
          <>
            <div
              ref={carousel}
              className="-mx-16 flex snap-x snap-mandatory gap-12 overflow-x-auto px-16 scroll-px-16"
            >
              {unreadComms.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    store.openBanner(c)
                    flow.go('banner-detail')
                  }}
                  className={`flex w-full shrink-0 snap-start flex-col justify-between gap-16 rounded-12 p-16 text-left ${TAG_BG[c.tag]}`}
                >
                  <span className="flex items-center justify-between gap-8">
                    <BannerTag>{c.tag}</BannerTag>
                    <BannerTag>Belum dibaca</BannerTag>
                  </span>
                  <span>
                    <span className="block text-14 font-bold text-neutral-white">{c.title}</span>
                    <span className="block text-12 text-neutral-white">{c.sub}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-4">
              {unreadComms.map((c, i) => (
                <span
                  key={c.id}
                  className={`h-4 rounded-full ${i === slide ? 'w-16 bg-primary-500' : 'w-4 bg-neutral-200'}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Terkumpul hari ini */}
      <section className="flex flex-col gap-8">
        <SectionHeader title="Terkumpul hari ini" linkLabel="Lihat semua" onLink={() => flow.go('kpi')} />
        <Card>
          <div className="flex items-baseline justify-between gap-8">
            <span className="text-16 font-bold text-default">{TITIP.total}</span>
            <span className="text-10 text-disabled">Target {TITIP.target}</span>
          </div>
          <div className="mt-8">
            <ProgressBar value={TITIP.pct} />
          </div>
        </Card>
      </section>

      {/* Tugas */}
      <section className="flex flex-col gap-12">
        <SectionHeader
          title="Tugas"
          trailing={
            <div className="flex shrink-0 items-center gap-10">
              <span className="text-12 text-caption">
                {filtered ? `${tasks.length} dari ${TASKS.length} tugas` : '2 dari 10 tugas selesai'}
              </span>
              <button
                type="button"
                onClick={() => setMenu('sort')}
                aria-label="Urutkan tugas"
                title="Urutkan"
                className={`flex h-30 w-30 items-center justify-center rounded-8 border ${
                  sort !== 'default' ? 'border-primary-200 bg-primary-50 text-primary-600' : 'border-default text-neutral-700'
                }`}
              >
                <IconSort size={16} />
              </button>
            </div>
          }
        />

        <FilterBar>
          <FilterChip
            label={WHEN_OPTS.find((o) => o.v === filter.when)?.l ?? 'Waktu'}
            active={filter.when !== 'today'}
            open={menu === 'when'}
            onClick={() => setMenu('when')}
          />
          <FilterChip
            label={KIND_OPTS.find((o) => o.v === filter.kind)?.l ?? 'Jenis tugas'}
            active={filter.kind !== 'wajib'}
            open={menu === 'kind'}
            onClick={() => setMenu('kind')}
          />
          <FilterChip
            label={filter.maj ?? 'Majelis'}
            active={Boolean(filter.maj)}
            open={menu === 'maj'}
            onClick={() => setMenu('maj')}
          />
          <FilterChip
            label={filter.type ?? 'Tipe KPI'}
            active={Boolean(filter.type)}
            open={menu === 'type'}
            onClick={() => setMenu('type')}
          />
          {filtered ? <ResetLink onClick={() => store.resetFilter()} /> : null}
        </FilterBar>

        {filter.from ? (
          <ContextStrip>
            <IconChart size={16} />
            <span className="flex-1">
              Tugas terkait KPI <b>{filter.from}</b>
            </span>
          </ContextStrip>
        ) : null}

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-40 text-center">
            <p className="text-14 font-bold text-default">Tidak ada tugas</p>
            <p className="text-12 text-caption">Tidak ada tugas untuk filter ini.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-12">
            {tasks.map((t) => (
              <li key={t.id}>
                <TaskCard task={t} when={filter.when} sortedByDistance={sort === 'distance'} onOpen={() => openTask(t)} />
              </li>
            ))}
          </ul>
        )}

        {tasks.length > 0 ? (
          <p className="pb-8 text-center text-12 text-disabled">Semua tugas yang cocok sudah ditampilkan</p>
        ) : null}
      </section>

      <TabBar active="home" />

      <OptionSheet
        open={menu === 'when'}
        title="Waktu"
        name="when"
        options={WHEN_OPTS}
        value={filter.when}
        onPick={(v: WhenFilter) => {
          store.setFilter({ when: v })
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'kind'}
        title="Jenis tugas"
        name="kind"
        options={KIND_OPTS}
        value={filter.kind}
        onPick={(v: KindFilter) => {
          store.setFilter({ kind: v })
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'maj'}
        title="Majelis"
        name="maj"
        options={majOpts}
        value={filter.maj}
        onPick={(v) => {
          store.setFilter({ maj: v })
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'type'}
        title="Tipe KPI"
        name="type"
        options={typeOpts}
        value={filter.type as KpiType | null}
        onPick={(v) => {
          store.setFilter({ type: v })
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'sort'}
        title="Urutkan tugas"
        name="sort"
        options={SORT_OPTS}
        value={sort}
        onPick={(v) => {
          setSort(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
    </Screen>
  )
}

function TaskCard({
  task,
  when,
  sortedByDistance,
  onOpen,
}: {
  task: Task
  when: WhenFilter
  sortedByDistance: boolean
  onOpen: () => void
}) {
  const { I, tone } = taskIcon(task.act)
  const clickable =
    task.act === 'Kunjungan Majelis' || task.act === 'Kunjungan Rumah' || task.act === 'Setor Titip Bayar'

  return (
    <Card
      className={`flex items-start gap-12 ${clickable ? 'w-full text-left' : ''}`}
      onClick={clickable ? onOpen : undefined}
    >
      <IconTile tone={tone}>
        <I size={20} />
      </IconTile>
      <div className="min-w-0 flex-1">
        <p className="text-14 font-bold text-default">
          {task.act} — {task.who}
        </p>
        <p className="text-12 text-caption">
          {when !== 'today' ? `${dayLabel(task.day)} · ` : ''}
          {task.time}
          {task.maj ? ` · ${task.maj}` : ''}
        </p>
        <div className={`mt-4 flex items-center gap-4 text-10 font-bold ${sortedByDistance ? 'text-primary-600' : 'text-disabled'}`}>
          <IconPin size={16} />
          <span>
            {taskDist(task)} km · {task.loc}
          </span>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {task.kind === 'rekomendasi' ? <Badge intent="primary">Rekomendasi</Badge> : null}
          {task.types.map((k) => (
            <Badge key={k} intent={TYPE_BADGE[k]}>
              {k}
            </Badge>
          ))}
        </div>
        {task.meta ? <p className="mt-8 text-12 font-bold text-orange-700">{task.meta}</p> : null}
      </div>
      {clickable ? (
        <span className="shrink-0 text-placeholder">
          <IconChevR size={20} />
        </span>
      ) : null}
    </Card>
  )
}
