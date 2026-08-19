'use client'

// Detail Lead — one prospect's record, and the actions that move her along the
// pipeline. What the BP does here depends entirely on where the lead stands:
//
//   Actionable (Baru / Tertarik / Belum memutuskan / Tidak tertarik)
//     — she can record a call (which changes the status), submit the lead to the
//       BM, and attach a foto KTP. A Tertarik lead's call sheet leads with
//       "Ajukan ke BM", the one status that opens the submit form.
//   Diajukan — handed to the BM. Read-only: her NIK, her KTP, her history.
//   Selesai  — closed. A result banner (Berhasil / Gagal) and the history.
//
// The record reads top to bottom: who she is and where she stands, then what
// the BP can do, then the running call history that explains how she got here.

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { FileCheck, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { MAJELIS_DIRECTORY } from '../lib/schedule'
import {
  CALL_OUTCOMES,
  CHANNEL_LABEL,
  FOLLOWUP_HINT,
  SOURCE_LABEL,
  isActionable,
  majelisLine,
  statusBadge,
  type CallOutcome,
  type MajelisAssignment,
  type PipelineLead,
} from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { AppScreen, Avatar, ContactButton, ReasonNote, SectionTitle } from '../lib/ui'
import { IconCamera, IconPhone } from '../lib/icons'

function assignmentLabel(m: MajelisAssignment): string {
  if (m.kind === 'existing') return MAJELIS_DIRECTORY.find((g) => g.id === m.id)?.name ?? 'Majelis'
  if (m.kind === 'new') return `${m.name} (baru)`
  return 'Tanpa majelis'
}

export function LeadDetailScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]

  // Which sheet is open, if any. The call sheet can hand off to the submit sheet
  // (that is what picking "Ajukan ke BM" does), so they are one state.
  const [sheet, setSheet] = useState<'call' | 'submit' | null>(null)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Detail Lead" onBack={() => flow.back()} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const badge = statusBadge(lead)
  const actionable = isActionable(lead.status)
  const hint = FOLLOWUP_HINT[lead.status]
  // The line the last call left behind — the "why" under a closed or waiting
  // lead. The newest log entry's note, if it carries one.
  const lastNote = lead.log[lead.log.length - 1]?.note

  return (
    <AppScreen topBar={<NavigationHeader title="Detail Lead" onBack={() => flow.back()} />}>
      {/* Identity — who she is, and where she stands. */}
      <Card>
        <div className="flex flex-col gap-12">
          <div className="flex items-center gap-12">
            <Avatar name={lead.name} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-18 font-bold text-default">{lead.name}</span>
              <span className="block truncate text-12 text-caption">{lead.phone}</span>
            </span>
            <span className="shrink-0">
              <Badge intent={badge.intent}>{badge.label}</Badge>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-12 text-caption">
            <span>{majelisLine(lead)}</span>
            <span className="whitespace-nowrap">· {SOURCE_LABEL[lead.source]}</span>
          </div>

          {lead.source === 'referral' && lead.referredBy ? (
            <div className="rounded-8 bg-canvas-blue px-12 py-8 text-12 text-default">
              Direferensikan oleh {lead.referredBy}
            </div>
          ) : null}

          {lead.nik ? (
            <div className="flex items-center gap-8 text-12">
              <span className="text-caption">NIK</span>
              <span className="font-bold text-default">{lead.nik}</span>
            </div>
          ) : null}

          {actionable && hint ? (
            <div className="rounded-8 bg-canvas-blue px-12 py-8 text-12 text-default">{hint}</div>
          ) : null}

          {/* WA / telepon — on an actionable lead both open the call record; the
              task here IS "hubungi dia", so contacting and recording are one act. */}
          {actionable ? (
            <div className="flex gap-8">
              <ContactButton label={`WhatsApp ${lead.name}`} tone="green" onClick={() => setSheet('call')}>
                <WhatsappLogo size={20} />
              </ContactButton>
              <ContactButton label={`Telepon ${lead.name}`} tone="primary" onClick={() => setSheet('call')}>
                <IconPhone size={20} />
              </ContactButton>
            </div>
          ) : null}
        </div>
      </Card>

      {/* What the BP can do — only while the lead is still hers to work. */}
      {actionable ? (
        <Card>
          <div className="flex flex-col gap-8">
            <Button size="lg" className="w-full" onClick={() => setSheet('call')}>
              Catat Panggilan
            </Button>
            <Button size="lg" variant="secondary" className="w-full" onClick={() => setSheet('submit')}>
              Teruskan ke BM
            </Button>
            <KtpButton lead={lead} />
          </div>
        </Card>
      ) : null}

      {/* Diajukan — nothing to do, but say plainly why. */}
      {lead.status === 'diajukan' ? (
        <Card>
          <div className="flex flex-col gap-8">
            <SectionTitle>Sedang diproses BM</SectionTitle>
            <span className="text-12 text-caption">
              Lead sudah diajukan ke Business Manager. Tidak ada tindakan lain untuk BP sampai
              keputusan keluar.
            </span>
            <KtpDoc attached={lead.ktp} />
          </div>
        </Card>
      ) : null}

      {/* Selesai — the result, and the reason it went that way. */}
      {lead.status === 'selesai' ? (
        <Card>
          <div className="flex flex-col gap-8">
            <div
              className={`rounded-8 px-12 py-8 text-14 font-bold ${
                lead.outcome === 'failed' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'
              }`}
            >
              {lead.outcome === 'failed' ? 'Gagal — tidak lolos pengajuan' : 'Berhasil — jadi mitra'}
            </div>
            {lastNote ? <ReasonNote label="Catatan" value={lastNote} /> : null}
            <KtpDoc attached={lead.ktp} />
          </div>
        </Card>
      ) : null}

      {/* The running history — how she got to where she is. */}
      <Card>
        <div className="flex flex-col gap-12">
          <SectionTitle>Riwayat Panggilan</SectionTitle>
          <div className="flex flex-col gap-12">
            {lead.log
              .slice()
              .reverse()
              .map((entry, i) => (
                <div
                  key={`${entry.at}-${i}`}
                  className="flex flex-col gap-2 border-l-2 border-default pl-12"
                >
                  <span className="flex items-center gap-8">
                    <span className="text-12 font-bold text-default">{entry.outcome}</span>
                  </span>
                  <span className="text-12 text-caption">
                    {entry.at} · {CHANNEL_LABEL[entry.via]}
                  </span>
                  {entry.note ? <span className="text-12 text-default">{entry.note}</span> : null}
                </div>
              ))}
          </div>
        </div>
      </Card>

      <CallSheet
        lead={lead}
        open={sheet === 'call'}
        onClose={() => setSheet(null)}
        onAjukan={() => setSheet('submit')}
      />
      <SubmitSheet lead={lead} open={sheet === 'submit'} onClose={() => setSheet(null)} />
    </AppScreen>
  )
}

/** "Masukkan Foto KTP", or the saved state once it is attached. */
function KtpButton({ lead }: { lead: PipelineLead }) {
  if (lead.ktp) {
    return (
      <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12 text-default">
        <span className="text-green-500">
          <FileCheck size={20} />
        </span>
        Foto KTP tersimpan
      </div>
    )
  }
  return (
    <Button
      size="lg"
      variant="secondary"
      className="w-full"
      onClick={() => pipelineStore.attachKtp(lead.id)}
    >
      Masukkan Foto KTP
    </Button>
  )
}

/** The KTP document tile shown on read-only records. */
function KtpDoc({ attached }: { attached: boolean }) {
  return (
    <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12">
      <span className={attached ? 'text-green-500' : 'text-disabled'}>
        {attached ? <FileCheck size={20} /> : <IconCamera size={20} />}
      </span>
      <span className={attached ? 'text-default' : 'text-caption'}>
        {attached ? 'Foto KTP tersimpan' : 'Foto KTP belum ada'}
      </span>
    </div>
  )
}

/**
 * Catat hasil panggilan — record what the call did, which is the same thing as
 * moving the lead's status. The options are the branches off her CURRENT status;
 * "Ajukan ke BM" hands off to the submit form instead of setting a status here.
 */
function CallSheet({
  lead,
  open,
  onClose,
  onAjukan,
}: {
  lead: PipelineLead
  open: boolean
  onClose: () => void
  onAjukan: () => void
}) {
  const [pick, setPick] = useState<CallOutcome | null>(null)
  const [note, setNote] = useState('')
  const options = CALL_OUTCOMES[lead.status] ?? []

  function reset() {
    setPick(null)
    setNote('')
  }

  function save() {
    if (!pick) return
    if (pick === 'ajukan') {
      reset()
      onAjukan()
      return
    }
    const label = options.find((o) => o.value === pick)?.label ?? ''
    pipelineStore.recordCall(lead.id, pick, label, note)
    reset()
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Catat hasil panggilan"
      primaryAction={
        <Button size="lg" className="w-full" disabled={!pick} onClick={save}>
          Simpan
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        {options.map((o) => (
          <SelectableCard
            key={o.value}
            name="call-outcome"
            title={o.label}
            checked={pick === o.value}
            onChange={() => setPick(o.value)}
          />
        ))}
        <label className="flex flex-col gap-4 pt-4">
          <span className="text-12 text-caption">Catatan (opsional)</span>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Hasil pembicaraan…"
          />
        </label>
      </div>
    </BottomSheet>
  )
}

/**
 * Submit ke BM — the Ajukan form. NIK gates it: a lead cannot be handed over
 * without her 16 digits. Majelis defaults to whatever she is already bound for,
 * and can be repointed to any active group before submitting.
 */
function SubmitSheet({ lead, open, onClose }: { lead: PipelineLead; open: boolean; onClose: () => void }) {
  const [nik, setNik] = useState('')
  const [plafon, setPlafon] = useState('')
  const [assignment, setAssignment] = useState<MajelisAssignment>(lead.majelis)
  const [picking, setPicking] = useState(false)

  function reset() {
    setNik('')
    setPlafon('')
    setAssignment(lead.majelis)
    setPicking(false)
  }

  const nikValid = nik.replace(/\D/g, '').length === 16

  function submit() {
    if (!nikValid) return
    pipelineStore.submitToBM(lead.id, { nik, plafon: plafon.trim(), majelis: assignment })
    reset()
    onClose()
  }

  // The majelis choices: keep her current non-existing assignment (new / none)
  // as an option, then every active group.
  const choices: { value: MajelisAssignment; label: string }[] = [
    ...(lead.majelis.kind !== 'existing'
      ? [{ value: lead.majelis, label: assignmentLabel(lead.majelis) }]
      : []),
    ...MAJELIS_DIRECTORY.filter((g) => g.status === 'aktif').map((g) => ({
      value: { kind: 'existing', id: g.id } as MajelisAssignment,
      label: g.name,
    })),
  ]

  if (picking) {
    return (
      <BottomSheet
        open={open}
        onClose={() => {
          reset()
          onClose()
        }}
        onBack={() => setPicking(false)}
        title="Pilih majelis"
      >
        <div className="flex flex-col gap-8">
          {choices.map((c) => (
            <SelectableCard
              key={c.label}
              name="submit-majelis"
              title={c.label}
              checked={assignmentLabel(assignment) === c.label}
              onChange={() => {
                setAssignment(c.value)
                setPicking(false)
              }}
            />
          ))}
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Submit ke BM"
      description="Lead akan diproses oleh Business Manager setelah diajukan."
      primaryAction={
        <Button size="lg" className="w-full" disabled={!nikValid} onClick={submit}>
          Ajukan ke BM
        </Button>
      }
    >
      <div className="flex flex-col gap-12">
        <Input label="Nama calon mitra" value={lead.name} disabled readOnly />
        <Input
          label="NIK (16 digit)"
          value={nik}
          inputMode="numeric"
          maxLength={16}
          onChange={(e) => setNik(e.target.value)}
          placeholder="Masukkan 16 digit NIK"
          state={nik && !nikValid ? 'error' : 'default'}
          helperText={nik && !nikValid ? 'NIK harus 16 digit' : undefined}
        />
        <Input
          label="Plafon diajukan"
          optionalText="Opsional"
          value={plafon}
          onChange={(e) => setPlafon(e.target.value)}
          placeholder="Rp3.000.000"
        />
        <label className="flex flex-col gap-4">
          <span className="text-12 text-caption">Majelis</span>
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-left text-14 text-default"
          >
            <span className="truncate">{assignmentLabel(assignment)}</span>
            <span className="shrink-0 text-12 font-bold text-link">Ubah</span>
          </button>
        </label>
      </div>
    </BottomSheet>
  )
}
