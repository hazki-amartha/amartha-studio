'use client'

// Validasi Mitra — step 4 of 4: the BM's own verification, then her call.
//
// She doesn't just read the BP's report (step 3) and rule on it — she checks
// a couple of the same facts herself (each PickerField shows the BP's answer
// as a hint, so she's comparing, not guessing), asks the majelis directly
// whether they know this mitra, and photographs/geotags her own visit.
// Kirim Keputusan stays locked until all of that is done.
//
// Only then: Setujui/Tolak (it decides which reason list applies), then a
// reason — required either way, because overriding underwriting's own read
// needs a reason on file whichever direction it goes. "Lainnya" opens a
// free-text line for the one case the fixed list doesn't cover.

import { useState, type ReactNode } from 'react'
import {
  BottomSheet,
  Button,
  Card,
  InputNominal,
  NavigationHeader,
  SelectableCard,
} from '@/design-system/components'
import { Camera, CheckCircle, ChevronDown, CrossCircleFill, FileCheck } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  ASET_OPTIONS,
  DECISION_REASON_OTHER,
  DECISION_REASONS,
  MAJELIS_CHECKING_OPTIONS,
  STATUS_RUMAH_OPTIONS,
  USAHA_BERJALAN_OPTIONS,
  VALIDASI_STEP_SCREENS,
  VALIDASI_STEPS,
} from '../lib/validasi'
import { finalReason, useOpenCase, useValidasi, validasiStore } from '../lib/validasi-store'
import { store } from '../lib/store'
import { PickSheet } from '../lib/pipeline-ui'
import { AppScreen, SectionTitle, StageBar, StickyBar } from '../lib/ui'

/** The dropdown-trigger pattern already used for "Alasan" — reused for every
 *  single-choice field on this step so the page reads as one form. `hint`
 *  surfaces the BP's own answer to the same question (BP Feedback, step 3)
 *  so the BM is checking against it, not guessing blind. */
function PickerField({
  label,
  value,
  hint,
  onClick,
}: {
  label: string
  value: string
  /** The BP's own answer to the same question, if there is one to compare. */
  hint?: string
  onClick: () => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-14 font-bold text-default">{label}</span>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-left text-14"
      >
        <span className={`min-w-0 truncate ${value ? 'text-default' : 'text-disabled'}`}>
          {value || 'Pilih jawaban'}
        </span>
        <span className="shrink-0 text-disabled">
          <ChevronDown size={20} />
        </span>
      </button>
      {hint ? <span className="text-12 text-caption">Menurut BP Feedback: {hint}</span> : null}
    </div>
  )
}

/** Tap-to-capture — same dashed-box / "Foto terlampir" pair lead-new.tsx uses
 *  for its own bukti foto. The prototype takes no real photo (§3), only
 *  records that the BM did. */
function PhotoCapture({
  label,
  captured,
  onToggle,
}: {
  label: string
  captured: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-14 font-bold text-default">{label}</span>
      {captured ? (
        <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12">
          <span className="text-green-500">
            <FileCheck size={20} />
          </span>
          <span className="flex-1 text-default">Foto tersimpan</span>
          <button type="button" onClick={onToggle} className="shrink-0 text-12 font-bold text-link">
            Ambil ulang
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full flex-col items-center gap-4 rounded-8 border border-dashed border-default bg-canvas-blue p-16 text-caption"
        >
          <Camera size={24} />
          <span className="text-14 text-default">Ambil foto</span>
        </button>
      )}
    </div>
  )
}

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
  const a = c.bpAssessment
  const [reasonSheet, setReasonSheet] = useState(false)
  const [statusRumahSheet, setStatusRumahSheet] = useState(false)
  const [usahaSheet, setUsahaSheet] = useState(false)
  const [majelisSheet, setMajelisSheet] = useState(false)
  const [asetSheet, setAsetSheet] = useState(false)

  const reasonOptions = s.decision ? DECISION_REASONS[s.decision] : []
  const reasonValue = finalReason(s)
  const needsLimit = s.decision === 'approve'

  // Everything the BM has to do herself before a decision counts — the
  // Keputusan card stays enabled to look at, but Kirim Keputusan won't fire
  // until this is whole. See lib/validasi-store.ts for what each field is.
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
      topBar={<NavigationHeader title="Keputusan BM" onBack={() => flow.go('validasi-bp-feedback')} />}
    >
      <StageBar
        current={4}
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

      {/* Her own field check, before she rules on it, in the two places it
          actually happens — the mitra's own house, then the Ketua Majelis —
          rather than one flat list that hides which visit each answer
          belongs to. */}
      <Card>
        <div className="flex flex-col gap-16">
          <SectionTitle>Verifikasi BM — kunjungan ke rumah mitra</SectionTitle>

          <PickerField
            label="Status kepemilikan rumah"
            value={s.statusRumahBM}
            hint={a.statusRumah}
            onClick={() => setStatusRumahSheet(true)}
          />

          <PickerField
            label="Apakah usaha masih berjalan?"
            value={s.usahaBerjalanBM}
            hint={a.usahaAktif}
            onClick={() => setUsahaSheet(true)}
          />

          <PickerField
            label="Aset yang dimiliki mitra"
            value={s.asetBM.join(', ')}
            onClick={() => setAsetSheet(true)}
          />

          <PhotoCapture
            label="Foto rumah mitra"
            captured={s.fotoRumah}
            onToggle={validasiStore.toggleFotoRumah}
          />
          <PhotoCapture
            label="Foto usaha mitra"
            captured={s.fotoUsaha}
            onToggle={validasiStore.toggleFotoUsaha}
          />
          <PhotoCapture
            label="Selfie & geotag BM bersama mitra"
            captured={s.selfieMitra}
            onToggle={validasiStore.toggleSelfieMitra}
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-16">
          <SectionTitle>Verifikasi BM — kunjungan ke Ketua Majelis</SectionTitle>

          <PickerField
            label="Apakah Ketua Majelis mengenal mitra ini dengan baik?"
            value={s.majelisChecking}
            onClick={() => setMajelisSheet(true)}
          />

          <PhotoCapture
            label="Selfie & geotag BM bersama Ketua Majelis"
            captured={s.selfieKetua}
            onToggle={validasiStore.toggleSelfieKetua}
          />
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

      <PickSheet
        open={statusRumahSheet}
        title="Status kepemilikan rumah"
        options={STATUS_RUMAH_OPTIONS}
        value={s.statusRumahBM}
        onClose={() => setStatusRumahSheet(false)}
        onPick={(v) => {
          validasiStore.setStatusRumahBM(v)
          setStatusRumahSheet(false)
        }}
      />
      <PickSheet
        open={usahaSheet}
        title="Apakah usaha masih berjalan?"
        options={USAHA_BERJALAN_OPTIONS}
        value={s.usahaBerjalanBM}
        onClose={() => setUsahaSheet(false)}
        onPick={(v) => {
          validasiStore.setUsahaBerjalanBM(v)
          setUsahaSheet(false)
        }}
      />
      <PickSheet
        open={majelisSheet}
        title="Pengecekan Ketua Majelis"
        options={MAJELIS_CHECKING_OPTIONS}
        value={s.majelisChecking}
        onClose={() => setMajelisSheet(false)}
        onPick={(v) => {
          validasiStore.setMajelisChecking(v)
          setMajelisSheet(false)
        }}
      />

      {/* Multi-select — stays open across picks (unlike PickSheet's single
          radio) so she can check more than one box before closing it. */}
      <BottomSheet
        open={asetSheet}
        onClose={() => setAsetSheet(false)}
        title="Aset yang dimiliki mitra"
        primaryAction={
          <Button size="lg" className="w-full" onClick={() => setAsetSheet(false)}>
            Simpan
          </Button>
        }
      >
        <div className="flex flex-col gap-8">
          {ASET_OPTIONS.map((o) => (
            <SelectableCard
              key={o}
              name={`aset-${o}`}
              inputType="checkbox"
              title={o}
              checked={s.asetBM.includes(o)}
              onChange={() => validasiStore.toggleAset(o)}
            />
          ))}
        </div>
      </BottomSheet>
    </AppScreen>
  )
}
