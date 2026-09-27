'use client'

// Validasi Mitra — step 3: the BM's call. Setujui/Tolak first (it decides
// which reason list applies), then a reason — required either way, because
// overriding underwriting's own read needs a reason on file whichever
// direction it goes. "Lainnya" opens a free-text line for the one case the
// fixed list doesn't cover.

import { useState, type ReactNode } from 'react'
import { Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { CheckCircle, ChevronDown, CrossCircleFill } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { DECISION_REASON_OTHER, DECISION_REASONS, SOFT_REJECT_CASE } from '../lib/validasi'
import { finalReason, useValidasi, validasiStore } from '../lib/validasi-store'
import { PickSheet } from '../lib/pipeline-ui'
import { AppScreen, SectionTitle, StickyBar } from '../lib/ui'

function DecisionChoice({
  tone,
  selected,
  icon,
  label,
  onClick,
}: {
  tone: 'green' | 'red'
  selected: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  const classes = selected
    ? tone === 'green'
      ? 'border-green-500 bg-green-50 text-green-500'
      : 'border-red-500 bg-red-50 text-red-500'
    : 'border-default bg-neutral-white text-default'
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-4 rounded-12 border px-12 py-16 text-14 font-bold ${classes}`}
    >
      {icon}
      {label}
    </button>
  )
}

export function ValidasiKeputusanScreen() {
  const flow = useFlow()
  const s = useValidasi()
  const c = SOFT_REJECT_CASE
  const [reasonSheet, setReasonSheet] = useState(false)

  const reasonOptions = s.decision ? DECISION_REASONS[s.decision] : []
  const needsCustom = s.reason === DECISION_REASON_OTHER
  const reasonValue = finalReason(s)
  const canSubmit = Boolean(s.decision) && reasonValue.length > 0

  function submit() {
    validasiStore.submit()
    flow.go('validasi-selesai')
  }

  return (
    <AppScreen
      topBar={<NavigationHeader title="Keputusan BM" onBack={() => flow.go('validasi-data')} />}
    >
      <Card>
        <div className="flex flex-col gap-4">
          <span className="text-16 font-bold text-default">{c.name}</span>
          <span className="text-12 text-caption">
            {c.majelisName} · {c.product} · {c.amount}
          </span>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-12">
          <SectionTitle>Keputusan Anda</SectionTitle>
          <div className="flex gap-8">
            <DecisionChoice
              tone="green"
              selected={s.decision === 'approve'}
              icon={<CheckCircle size={24} />}
              label="Setujui"
              onClick={() => validasiStore.setDecision('approve')}
            />
            <DecisionChoice
              tone="red"
              selected={s.decision === 'reject'}
              icon={<CrossCircleFill size={24} />}
              label="Tolak"
              onClick={() => validasiStore.setDecision('reject')}
            />
          </div>

          {s.decision ? (
            <div className="flex flex-col gap-8">
              <span className="text-14 font-bold text-default">Alasan</span>
              <button
                type="button"
                onClick={() => setReasonSheet(true)}
                className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-left text-14"
              >
                <span className={`min-w-0 truncate ${s.reason ? 'text-default' : 'text-disabled'}`}>
                  {s.reason || 'Pilih alasan'}
                </span>
                <span className="shrink-0 text-disabled">
                  <ChevronDown size={20} />
                </span>
              </button>

              {needsCustom ? (
                <Input
                  label="Jelaskan alasan Anda"
                  placeholder="Tulis alasan di sini"
                  value={s.customReason}
                  onChange={(e) => validasiStore.setCustomReason(e.target.value)}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!canSubmit} onClick={submit}>
          Kirim Keputusan
        </Button>
      </StickyBar>

      {s.decision ? (
        <PickSheet
          open={reasonSheet}
          title="Pilih alasan"
          options={reasonOptions}
          value={s.reason}
          onClose={() => setReasonSheet(false)}
          onPick={(v) => {
            validasiStore.setReason(v)
            setReasonSheet(false)
          }}
        />
      ) : null}
    </AppScreen>
  )
}
