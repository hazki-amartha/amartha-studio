'use client'

// Setor sebagian — the same handover, with the bag opened up.
//
// Reached from the text link under the button on Setor pembayaran, for the BP
// who is putting part of today's cash down and keeping the rest for a later
// drop. It is the older Setoran screen's picker, moved off the main road: same
// ticks, same per-mitra rosters, but only in front of the person who asked for
// it.
//
// The method sits at the foot of THIS page too, so the choice she came with
// survives the detour and she leaves by the same button she would have tapped
// a screen ago.

import { useMemo, useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { MapPin, RpHistory } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { AGENT, DEPOSIT, TASKS } from '../lib/schedule'
import { PickList, SetorSummary } from '../lib/setor'
import { settleableSources, store, unsettledEntries, useApp } from '../lib/store'
import { AppScreen, OptionCard, SectionTitle, StickyBar } from '../lib/ui'

export function SetorPartialScreen() {
  const flow = useFlow()
  const s = useApp()

  const entries = unsettledEntries(s)
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
  const no = s.settlements.length + 1

  const kindOf = (taskId: string) => TASKS.find((t) => t.id === taskId)?.kind
  const pelayanan = entries.filter((e) => kindOf(e.taskId) === 'majelis').length
  const homeVisit = entries.filter((e) => kindOf(e.taskId) === 'home-visit').length

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title="Setor sebagian"
          onBack={() => flow.back()}
          trailingIcons={[
            <button
              key="riwayat"
              type="button"
              aria-label="Riwayat pembayaran"
              onClick={() => flow.go('setor-riwayat')}
            >
              <RpHistory size={24} />
            </button>,
          ]}
        />
      }
    >
      <SetorSummary no={no} amount={amount} pelayanan={pelayanan} homeVisit={homeVisit} />

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

      <SectionTitle>Pilih metode pembayaran</SectionTitle>
      <div className="flex flex-col gap-8">
        <OptionCard
          selected={s.depositMethod === 'agent'}
          title={`Agen ${AGENT.name}`}
          description="Setor tunai ke agen terdekat pakai kode unik"
          onSelect={() => store.setDepositMethod('agent')}
        >
          <button
            type="button"
            onClick={() => flow.go('agent-locator')}
            className="flex items-center justify-center gap-4 rounded-full border border-primary-500 py-8 text-12 font-bold text-primary-500"
          >
            <MapPin size={16} />
            Cari Agen Terdekat
          </button>
        </OptionCard>

        <OptionCard
          selected={s.depositMethod === 'va'}
          title="Virtual Account"
          description="Setor lewat mobile banking ke 2 VA cabang"
          onSelect={() => store.setDepositMethod('va')}
        />
      </div>

      <StickyBar>
        <Button
          size="lg"
          className="w-full"
          disabled={!s.depositMethod || amount <= 0}
          onClick={() => {
            // The picked figure has to be parked before either road opens: a
            // screen remounts on navigation, so it cannot ride in local state.
            store.setDepositAmount(amount)
            flow.go(s.depositMethod === 'agent' ? 'setor-agen' : 'setor-va')
          }}
        >
          Setor {rupiah(amount)}
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
