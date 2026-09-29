'use client'

// Validasi Mitra — step 4 of 4: the BM's call, once her own verification
// (steps 2 and 3 — the mitra visit, the Ketua Majelis visit) is whole.
// Kirim Keputusan stays locked until it is (`verificationDone`, below) —
// this screen only reads that state, it doesn't collect it.
//
// Setujui/Tolak first (it decides which reason list applies), then a
// reason — required either way, because overriding underwriting's own read
// needs a reason on file whichever direction it goes. "Lainnya" opens a
// free-text line for the one case the fixed list doesn't cover.

import { useState, type ReactNode } from 'react'
import { BottomSheet, Button, Card, InputNominal, NavigationHeader, SelectableCard } from '@/design-system/components'
import { CheckCircle, ChevronDown, CrossCircleFill } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { DECISION_REASON_OTHER, DECISION_REASONS, VALIDASI_STEP_SCREENS, VALIDASI_STEPS } from '../lib/validasi'
import { finalReason, useOpenCase, useValidasi, validasiStore } from '../lib/validasi-store'
import { store } from '../lib/store'
import { MitraCard } from '../lib/validasi-ui'
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
  const c = useOpenCase()
  const [reasonSheet, setReasonSheet] = useState(false)

  const reasonOptions = s.decision ? DECISION_REASONS[s.decision] : []
  const reasonValue = finalReason(s)
  const needsLimit = s.decision === 'approve'

  // Set on steps 2 (Validasi ke Mitra) and 3 (Validasi ke Ketua Majelis) —
  // see lib/validasi-store.ts for what each field is.
  const verificationDone =
    s.statusRumahBM.length > 0 &&
    s.usahaBerjalanBM.length > 0 &&
    s.majelisChecking.length > 0 &&
    s.fotoRumah &&
    s.fotoUsaha &&
    s.selfieMitra &&
    s.selfieKetua

  const canSubmit =
    verificationDone &&
    Boolean(s.decision) &&
    reasonValue.length > 0 &&
    (!needsLimit || s.proposedLimit.length > 0)

  function submit() {
    validasiStore.submit()
    store.setFlash('Your validation has been submitted.')
    flow.go('tugas')
  }

  return (
    <AppScreen
      topBar={<NavigationHeader title="Keputusan BM" onBack={() => flow.go('validasi-verifikasi-ketua')} />}
    >
      <StageBar
        current={4}
        labels={VALIDASI_STEPS}
        onStepClick={(step) => flow.go(VALIDASI_STEP_SCREENS[step - 1])}
      />

      <MitraCard case={c} />

      {!verificationDone ? (
        <Card>
          <span className="text-12 text-caption">
            Lengkapi Validasi ke Mitra dan Validasi ke Ketua Majelis terlebih dahulu sebelum
            mengirim keputusan.
          </span>
        </Card>
      ) : null}

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

      {/* Only asked once she's said yes — a limit is meaningless attached to a
          rejection, and asking for it before Setujui is chosen would read as
          the form assuming her answer. */}
      {needsLimit ? (
        <Card>
          <InputNominal
            label="Usulan limit"
            value={s.proposedLimit}
            onValueChange={validasiStore.setProposedLimit}
            currency="Rp"
            helperText="Limit yang Anda usulkan untuk menjadi konsiderasi untuk limit ibu mitra"
          />
        </Card>
      ) : null}

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
