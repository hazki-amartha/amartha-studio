'use client'

// Kirim Tugas — the finished tasks still on the handset, reached from the
// floating Kirim Tugas button on the Tugas list (BP APP 2026 Figma "Current
// kirim tugas"). She ticks what to send, and the page turns into the sending
// loader — one task at a time, with the "don't close the app" warning — then
// hands her back to the list with those rows now Terkirim.

import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, NavigationHeader } from '@/design-system/components'
import { CheckCircleFill, Envelope, WarningCircle } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import type { Task } from '../lib/schedule'
import { pendingSync, store, todayTasks, useApp } from '../lib/store'
import { Meter, StickyBar } from '../lib/ui'

/** The short code on each tile. */
const CODE: Partial<Record<Task['kind'], string>> = {
  majelis: 'PEL',
  'home-visit': 'HV',
  bukti: 'BB',
  reminder: 'ING',
}

export function KirimTugasScreen() {
  const flow = useFlow()
  const s = useApp()
  const plate = todayTasks(s)
  const [tasks] = useState(() => pendingSync(s).filter((t) => plate.includes(t)))
  const [picked, setPicked] = useState<Set<string>>(() => new Set())
  // null while picking; the index of the task being sent while sending.
  const [sending, setSending] = useState<number | null>(null)

  const queue = useMemo(() => tasks.filter((t) => picked.has(t.id)), [tasks, picked])

  useEffect(() => {
    if (sending === null) return
    if (sending >= queue.length) {
      const t = setTimeout(() => flow.back(), 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      store.sendTasks([queue[sending].id])
      setSending(sending + 1)
    }, 700)
    return () => clearTimeout(t)
  }, [sending, queue, flow])

  if (sending !== null) {
    const done = Math.min(sending, queue.length)
    const pct = queue.length ? Math.round((done / queue.length) * 100) : 100
    return (
      <Screen className="!bg-primary-50">
        <div className="flex flex-1 flex-col items-center justify-center gap-24">
          <span className="flex h-80 w-120 items-center justify-center rounded-8 bg-primary-400 text-neutral-white">
            <Envelope size={24} />
          </span>
          <span className="flex items-center gap-8 text-12 text-primary-500">
            <WarningCircle size={16} />
            Jangan tutup aplikasi hingga pengiriman selesai.
          </span>
        </div>
        <div className="flex flex-col gap-4 pb-16">
          <span className="text-12 text-caption">
            Mengirim tugas ({done}/{queue.length})
          </span>
          <span className="flex items-center gap-8">
            <span className="min-w-0 flex-1">
              <Meter progress={pct} />
            </span>
            <span className="shrink-0 text-12 text-caption">{pct}%</span>
          </span>
        </div>
      </Screen>
    )
  }

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Kirim Tugas" onBack={() => flow.back()} />}>
      <div className="-mx-16 -mt-16 flex flex-col">
        {tasks.length === 0 ? (
          <span className="p-16 text-center text-12 text-caption">Semua tugas sudah terkirim.</span>
        ) : null}
        {tasks.map((t) => {
          const on = picked.has(t.id)
          return (
            <button
              key={t.id}
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => toggle(t.id)}
              className={`flex items-center gap-12 border-b border-light px-16 py-16 text-left ${
                on ? 'bg-primary-50' : 'bg-neutral-white'
              }`}
            >
              {on ? (
                <span className="shrink-0 text-green-500">
                  <CheckCircleFill size={24} />
                </span>
              ) : (
                <span className="h-24 w-24 shrink-0 rounded-full border border-neutral-400" />
              )}
              <span className="flex h-52 w-52 shrink-0 items-center justify-center rounded-8 bg-primary-500 text-14 font-bold text-neutral-white">
                {CODE[t.kind] ?? '—'}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="truncate text-14 font-bold text-default">{t.title}</span>
                <span className="flex items-center gap-8">
                  <span className="min-w-0 flex-1 text-12 text-caption">
                    {t.time} - {t.until}
                  </span>
                  <Badge intent="primary" variant="solid" size="sm">
                    Selesai
                  </Badge>
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={queue.length === 0} onClick={() => setSending(0)}>
          Kirim Tugas
        </Button>
      </StickyBar>
    </Screen>
  )
}
