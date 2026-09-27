'use client'

// Validasi Mitra — step 3: the BM's call. Setujui/Tolak first (it decides
// which reason list applies), then a reason — required either way, because
// overriding underwriting's own read needs a reason on file whichever
// direction it goes. "Lainnya" opens a free-text line for the one case the
// fixed list doesn't cover.

import { useState, type ReactNode } from 'react'
import { BottomSheet, Button, Card, NavigationHeader, SelectableCard } from '@/design-system/components'
import { CheckCircle, ChevronDown, CrossCircleFill } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  DECISION_REASON_OTHER,
  DECISION_REASONS,
  SOFT_REJECT_CASE,
  VALIDASI_STEP_SCREENS,
  VALIDASI_STEPS,
} from '../lib/validasi'
import { finalReason, useValidasi, validasiStore } from '../lib/validasi-store'
import { AppScreen, SectionTitle, StageBar, StickyBar } from '../lib/ui'

// Neutral by default, same selected treatment as the design system's own
// SelectableCard (border-primary-500 + primary-50 tint) — Setujui/Tolak read
// as one flat choice, not a red/green verdict flashing before she's picked.
function DecisionChoice({
  selected,
  icon,
  label,
  onClick,
}: {
  selected: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  const classes = selected
    ? 'border-primary-500 bg-primary-50 text-primary-500'
    : 'border-default bg-neutral-white text-default'
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-8 rounded-12 border px-12 py-16 text-14 font-bold ${classes}`}
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
      <StageBar
        current={3}
        labels={VALIDASI_STEPS}
        onStepClick={(step) => flow.go(VALIDASI_STEP_SCREENS[step - 1])}
      />

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
              selected={s.decision === 'approve'}
              icon={<CheckCircle size={24} />}
              label="Setujui"
              onClick={() => validasiStore.setDecision('approve')}
            />
            <DecisionChoice
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
                <span className={`min-w-0 truncate ${reasonValue ? 'text-default' : 'text-disabled'}`}>
                  {reasonValue || 'Pilih alasan'}
                </span>
                <span className="shrink-0 text-disabled">
                  <ChevronDown size={20} />
                </span>
              </button>
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
        <BottomSheet
          open={reasonSheet}
          onClose={() => setReasonSheet(false)}
          title="Pilih alasan"
          primaryAction={
            <Button
              size="lg"
              className="w-full"
              disabled={reasonValue.length === 0}
              onClick={() => setReasonSheet(false)}
            >
              Simpan
            </Button>
          }
        >
          <div className="flex flex-col gap-8">
            {reasonOptions.map((o) => (
              <div key={o} className="flex flex-col gap-8">
                <SelectableCard
                  name="validasi-reason"
                  inputType="radio"
                  title={o}
                  checked={s.reason === o}
                  onChange={() => validasiStore.setReason(o)}
                />
                {/* "Lainnya" opens its free-text field right under itself, not
                    lower on the page — the field belongs to the option that
                    asked for it. */}
                {o === DECISION_REASON_OTHER && s.reason === DECISION_REASON_OTHER ? (
                  <textarea
                    className="ds-inp min-h-80 resize-none"
                    placeholder="Masukkan alasan lainnya"
                    value={s.customReason}
                    onChange={(e) => validasiStore.setCustomReason(e.target.value)}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </BottomSheet>
      ) : null}
    </AppScreen>
  )
}
