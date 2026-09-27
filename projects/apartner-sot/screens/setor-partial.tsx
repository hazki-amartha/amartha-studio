'use client'

// Ubah — the same handover, with the bag opened up.
//
// Reached from "Ubah" on the Setor pembayaran figure, for the BP who is
// putting part of today's cash down and keeping the rest for a later drop. It
// is the older Setoran screen's picker, moved off the main road: same ticks,
// same per-mitra rosters, but only in front of the person who asked for it.
//
// It only changes the figure. "Simpan" takes the new total back to Setor
// pembayaran, where the road is still chosen and the Setor button still waits.

import { useMemo, useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { DEPOSIT } from '../lib/schedule'
import { PickList } from '../lib/setor'
import { settleableSources, store, useApp } from '../lib/store'
import { AppScreen, SectionTitle, StickyBar } from '../lib/ui'

export function SetorPartialScreen() {
  const flow = useFlow()
  const s = useApp()

  const sources = settleableSources(s)
  const allKeys = useMemo(() => sources.flatMap((g) => g.leaves.map((l) => l.key)), [sources])
  const cashOf = useMemo(() => {
    const m = new Map<string, number>()
    sources.forEach((g) => g.leaves.forEach((l) => m.set(l.key, l.cash)))
    return m
  }, [sources])

  // We track what she UNTICKS, not what she picks — so everything starts in,
  // and cash that appears after mount comes in ticked rather than stranded off.
  const [deselected, setDeselected] = useState<Set<string>>(() => new Set())
  const isOn = (key: string) => !deselected.has(key)
  const toggleLeaf = (key: string) =>
    setDeselected((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  const toggleGroup = (keys: string[], on: boolean) =>
    setDeselected((prev) => {
      const next = new Set(prev)
      keys.forEach((k) => (on ? next.delete(k) : next.add(k)))
      return next
    })

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const toggleExpand = (taskId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })

  const amount = allKeys.reduce((sum, k) => (isOn(k) ? sum + (cashOf.get(k) ?? 0) : sum), 0)

  return (
    <AppScreen topBar={<NavigationHeader title="Ubah" onBack={() => flow.back()} />}>
      {/* --- What goes down now. The line under the title is the whole reason
          unticking is safe: nothing is written off, it just moves to the next
          handover — and there are only so many of those in a day. */}
      <SectionTitle>Pilih setoran</SectionTitle>
      <span className="text-12 text-caption">
        Pembayaran yang tidak disetor sekarang akan masuk ke daftar setoran berikutnya. Maksimum{' '}
        {DEPOSIT.maxPerDay} kali setor sehari.
      </span>
      <PickList
        sources={sources}
        isOn={isOn}
        onToggleLeaf={toggleLeaf}
        onToggleGroup={toggleGroup}
        expanded={(taskId) => expanded.has(taskId)}
        onToggleExpand={toggleExpand}
      />

      <StickyBar>
        <Button
          size="lg"
          className="w-full"
          disabled={amount <= 0}
          onClick={() => {
            // Parked in the store: Setor pembayaran remounts on the way back.
            store.setDepositAmount(amount)
            flow.back()
          }}
        >
          Simpan Total {rupiah(amount)}
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
