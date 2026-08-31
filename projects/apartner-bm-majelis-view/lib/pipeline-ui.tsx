'use client'

// Shared Sales-pipeline UI, ported from the BP source: the majelis picker, the
// source (POI / referral) picker, KTP capture, the record's DetailRow and
// history sheet, and the "perbarui status" sheet. Kept here so Add Lead, the
// Lead detail page and the POI page all draw the exact same controls.
//
// The BM addition is `AssigneePickerSheet` — pick a BP, or the BM herself — used
// wherever a lead or a POI is handed to someone.

import { useEffect, useState, type ReactNode } from 'react'
import { BottomSheet, Button, Card, Input, SelectableCard } from '@/design-system/components'
import { Camera, FileCheck, NotePencil, Warning } from '@/design-system/icons'
import { MAJELIS_DIRECTORY } from './schedule'
import {
  ASSIGNEE_CHOICES,
  INTEREST_META,
  INTEREST_ORDER,
  MITRA_REFERRERS,
  OTHER_REFERRERS,
  POI_LIST,
  REASON_OTHER,
  SOURCE_LABEL,
  historyActivity,
  historyStatusLabel,
  statusReasons,
  type Interest,
  type LeadSource,
  type MajelisAssignment,
  type PipelineLead,
  type ReferrerKind,
} from './pipeline'
import { pipelineStore } from './pipeline-store'
import { SearchField } from './ui'

export const INTEREST_TEXT: Record<Interest, string> = {
  interested: 'text-green-600',
  undecided: 'text-blue-600',
  'not-interested': 'text-red-500',
}

export function assignmentLabel(m: MajelisAssignment): string {
  if (m.kind === 'existing') return MAJELIS_DIRECTORY.find((g) => g.id === m.id)?.name ?? 'Majelis'
  if (m.kind === 'new') return `${m.name || 'Majelis baru'} (Baru)`
  return 'Tanpa majelis'
}

// --- Assignee ---------------------------------------------------------------

/** Pick who works this lead / POI: a BP, or the BM herself. */
export function AssigneePickerSheet({
  open,
  value,
  onClose,
  onPick,
}: {
  open: boolean
  value: string
  onClose: () => void
  onPick: (assignedTo: string) => void
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Tugaskan ke"
      description="BP yang mengerjakan, atau Anda sendiri (BM)."
    >
      <div className="flex flex-col gap-8">
        {ASSIGNEE_CHOICES.map((c) => (
          <SelectableCard
            key={c.value}
            name="assignee-pick"
            inputType="radio"
            title={c.label}
            checked={value === c.value}
            onChange={() => onPick(c.value)}
          />
        ))}
      </div>
    </BottomSheet>
  )
}

// --- Majelis ----------------------------------------------------------------

export function MajelisPickerSheet({
  open,
  value,
  onClose,
  onPick,
}: {
  open: boolean
  value: MajelisAssignment
  onClose: () => void
  onPick: (m: MajelisAssignment) => void
}) {
  const [kind, setKind] = useState<'none' | 'new' | string>(
    value.kind === 'existing' ? value.id : value.kind,
  )
  const [newName, setNewName] = useState(value.kind === 'new' ? value.name : '')

  const active = MAJELIS_DIRECTORY.filter((g) => g.status === 'aktif')
  const canConfirm = kind !== 'new' || newName.trim() !== ''

  function confirm() {
    if (kind === 'none') return onPick({ kind: 'none', branch: 'BP Ciseeng' })
    if (kind === 'new') {
      if (newName.trim() === '') return
      return onPick({ kind: 'new', name: newName.trim() })
    }
    onPick({ kind: 'existing', id: kind })
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Pilih majelis"
      primaryAction={
        <Button size="lg" className="w-full" disabled={!canConfirm} onClick={confirm}>
          Pilih
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        <SelectableCard
          name="majelis-pick"
          inputType="radio"
          title="Tanpa majelis"
          checked={kind === 'none'}
          onChange={() => setKind('none')}
        />
        {active.map((g) => (
          <SelectableCard
            key={g.id}
            name="majelis-pick"
            inputType="radio"
            title={g.name}
            checked={kind === g.id}
            onChange={() => setKind(g.id)}
          />
        ))}
        <SelectableCard
          name="majelis-pick"
          inputType="radio"
          title="Majelis baru"
          description="Buat majelis baru untuk lead ini"
          checked={kind === 'new'}
          onChange={() => setKind('new')}
        />
        {kind === 'new' ? (
          <Input
            label="Nama majelis baru"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Majelis Cibeuteung"
          />
        ) : null}
      </div>
    </BottomSheet>
  )
}

// --- Source ----------------------------------------------------------------

export function PoiSheet({
  open,
  value,
  onClose,
  onPick,
}: {
  open: boolean
  value: string
  onClose: () => void
  onPick: (poi: string) => void
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const rows = POI_LIST.filter((p) => !q || p.toLowerCase().includes(q))

  return (
    <BottomSheet open={open} onClose={onClose} title="Pilih POI" description="Di mana lead ditemui?">
      <div className="flex flex-col gap-8">
        <SearchField value={query} onChange={setQuery} placeholder="Cari POI" label="Cari POI" />
        {rows.map((p) => (
          <SelectableCard
            key={p}
            name="poi-pick"
            inputType="radio"
            title={p}
            checked={value === p}
            onChange={() => onPick(p)}
          />
        ))}
      </div>
    </BottomSheet>
  )
}

export function ReferralSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean
  onClose: () => void
  onPick: (name: string, kind: ReferrerKind) => void
}) {
  const [step, setStep] = useState<'kind' | 'mitra' | 'others'>('kind')
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) {
      setStep('kind')
      setQuery('')
    }
  }, [open])

  function close() {
    setStep('kind')
    setQuery('')
    onClose()
  }

  if (step === 'mitra') {
    const q = query.trim().toLowerCase()
    const rows = MITRA_REFERRERS.filter((m) => !q || m.toLowerCase().includes(q))
    return (
      <BottomSheet open={open} onClose={close} onBack={() => setStep('kind')} title="Pilih mitra perujuk">
        <div className="flex flex-col gap-8">
          <SearchField value={query} onChange={setQuery} placeholder="Cari nama mitra" label="Cari mitra" />
          {rows.map((m) => (
            <SelectableCard
              key={m}
              name="referrer-mitra"
              inputType="radio"
              title={m}
              checked={false}
              onChange={() => onPick(m, 'mitra')}
            />
          ))}
          {rows.length === 0 ? (
            <span className="px-4 py-8 text-12 text-caption">Mitra tidak ditemukan.</span>
          ) : null}
        </div>
      </BottomSheet>
    )
  }

  if (step === 'others') {
    return (
      <BottomSheet open={open} onClose={close} onBack={() => setStep('kind')} title="Perujuk lainnya">
        <div className="flex flex-col gap-8">
          {OTHER_REFERRERS.map((o) => (
            <SelectableCard
              key={o.value}
              name="referrer-other"
              inputType="radio"
              title={o.label}
              checked={false}
              onChange={() => onPick(o.label, o.value)}
            />
          ))}
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet open={open} onClose={close} title="Siapa yang mereferensikan?">
      <div className="flex flex-col gap-8">
        <SelectableCard
          name="referrer-kind"
          inputType="radio"
          title="Mitra"
          description="Dikenalkan oleh mitra aktif"
          checked={false}
          onChange={() => setStep('mitra')}
        />
        <SelectableCard
          name="referrer-kind"
          inputType="radio"
          title="Lainnya"
          description="Karyawan Amartha, tetangga, atau teman"
          checked={false}
          onChange={() => setStep('others')}
        />
      </div>
    </BottomSheet>
  )
}

export function SourceSheet({
  open,
  onClose,
  onDone,
}: {
  open: boolean
  onClose: () => void
  onDone: (data: { source: LeadSource; poi: string; referredBy: string; referrerKind: ReferrerKind | null }) => void
}) {
  const [step, setStep] = useState<'type' | 'poi' | 'referral'>('type')

  useEffect(() => {
    if (!open) setStep('type')
  }, [open])

  function close() {
    setStep('type')
    onClose()
  }

  if (step === 'poi') {
    return (
      <PoiSheet
        open={open}
        value=""
        onClose={close}
        onPick={(poi) => {
          setStep('type')
          onDone({ source: 'poi', poi, referredBy: '', referrerKind: null })
        }}
      />
    )
  }

  if (step === 'referral') {
    return (
      <ReferralSheet
        open={open}
        onClose={close}
        onPick={(name, kind) => {
          setStep('type')
          onDone({ source: 'referral', poi: '', referredBy: name, referrerKind: kind })
        }}
      />
    )
  }

  return (
    <BottomSheet open={open} onClose={close} title="Sumber lead">
      <div className="flex flex-col gap-8">
        <SelectableCard
          name="source-type"
          inputType="radio"
          title={SOURCE_LABEL.poi}
          description="Ditemui saat POI Visit / Sosialisasi"
          checked={false}
          onChange={() => setStep('poi')}
        />
        <SelectableCard
          name="source-type"
          inputType="radio"
          title={SOURCE_LABEL.referral}
          description="Dikenalkan oleh mitra atau warga"
          checked={false}
          onChange={() => setStep('referral')}
        />
      </div>
    </BottomSheet>
  )
}

// --- KTP --------------------------------------------------------------------

export function KtpSheet({
  open,
  nik: initialNik,
  ktp: initialKtp,
  onClose,
  onSave,
}: {
  open: boolean
  nik: string
  ktp: boolean
  onClose: () => void
  onSave: (nik: string, ktp: boolean) => void
}) {
  const [nik, setNik] = useState(initialNik)
  const [ktp, setKtp] = useState(initialKtp)
  const nikValid = nik.replace(/\D/g, '').length === 16
  const canSave = ktp && nikValid

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="KTP"
      description="Lampirkan foto KTP dan NIK. Lead langsung jadi Qualified."
      primaryAction={
        <Button size="lg" className="w-full" disabled={!canSave} onClick={() => onSave(nik, ktp)}>
          Simpan
        </Button>
      }
    >
      <div className="flex flex-col gap-12">
        {ktp ? (
          <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12">
            <span className="text-green-500">
              <FileCheck size={20} />
            </span>
            <span className="flex-1 text-default">Foto KTP terlampir</span>
            <button type="button" onClick={() => setKtp(false)} className="shrink-0 text-12 font-bold text-link">
              Hapus
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setKtp(true)}
            className="flex w-full flex-col items-center gap-4 rounded-8 border border-default bg-canvas-blue p-16 text-caption"
          >
            <Camera size={24} />
            <span className="text-14 text-default">Upload Foto KTP</span>
          </button>
        )}
        <Input
          label="NIK (16 digit)"
          inputMode="numeric"
          maxLength={16}
          value={nik}
          onChange={(e) => setNik(e.target.value)}
          placeholder="Masukkan 16 digit NIK"
          state={nik && !nikValid ? 'error' : 'default'}
          helperText={nik && !nikValid ? 'NIK harus 16 digit' : undefined}
        />
      </div>
    </BottomSheet>
  )
}

// --- Identity ---------------------------------------------------------------

export function EditContactSheet({
  open,
  name: initialName,
  phone: initialPhone,
  onClose,
  onSave,
}: {
  open: boolean
  name: string
  phone: string
  onClose: () => void
  onSave: (name: string, phone: string) => void
}) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const canSave = name.trim() !== '' && phone.trim() !== ''

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Ubah kontak"
      primaryAction={
        <Button size="lg" className="w-full" disabled={!canSave} onClick={() => onSave(name, phone)}>
          Simpan
        </Button>
      }
    >
      <div className="flex flex-col gap-12">
        <Input label="Nama" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama calon mitra" />
        <Input
          label="No. HP"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xx-xxxx-xxxx"
        />
      </div>
    </BottomSheet>
  )
}

// --- The record's rows + history + status sheets ----------------------------

export function DetailRow({
  label,
  value,
  onEdit,
  warning,
  pencil,
  right,
}: {
  label: string
  value: ReactNode
  onEdit?: () => void
  warning?: boolean
  pencil?: boolean
  right?: ReactNode
}) {
  return (
    <div className="flex items-start gap-8 border-t border-default py-12">
      <span className="flex min-w-0 flex-1 items-start gap-4 text-14">
        <span className="shrink-0 text-caption">{label}:</span>
        <span className={warning ? 'text-orange-600' : 'text-default'}>{value}</span>
        {warning ? (
          <span className="shrink-0 text-orange-600">
            <Warning size={16} />
          </span>
        ) : null}
        {onEdit && pencil ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Ubah ${label}`}
            className="shrink-0 text-primary-500"
          >
            <NotePencil size={16} />
          </button>
        ) : null}
      </span>
      {right ? <span className="shrink-0">{right}</span> : null}
      {onEdit && !pencil ? (
        <button type="button" onClick={onEdit} className="shrink-0 text-12 font-bold text-link">
          Ubah
        </button>
      ) : null}
    </div>
  )
}

export function RiwayatSheet({
  lead,
  open,
  onClose,
}: {
  lead: PipelineLead
  open: boolean
  onClose: () => void
}) {
  return (
    <BottomSheet open={open} onClose={onClose} size="fullscreen" title="Riwayat">
      <div className="flex flex-col gap-8">
        {lead.log
          .slice()
          .reverse()
          .map((entry, i) => (
            <Card key={`${entry.at}-${i}`}>
              <div className="flex flex-col gap-2">
                <span className="text-12 text-caption">
                  {entry.at} · {historyActivity(entry, lead)}
                </span>
                <span className="text-14 font-bold text-default">{historyStatusLabel(entry)}</span>
                {entry.system ? <span className="text-12 text-default">{entry.system}</span> : null}
                {entry.note ? (
                  <span className="text-12 italic text-default">&ldquo;{entry.note}&rdquo;</span>
                ) : null}
              </div>
            </Card>
          ))}
      </div>
    </BottomSheet>
  )
}

export function ReasonRadios({
  interest,
  onChange,
}: {
  interest: Interest
  onChange: (reason: string) => void
}) {
  const options = statusReasons(interest) ?? []
  const [pick, setPick] = useState<string | null>(null)
  const [other, setOther] = useState('')
  const isOther = pick === REASON_OTHER

  return (
    <div className="flex flex-col gap-8">
      {options.map((r) => (
        <SelectableCard
          key={r}
          name="status-reason"
          inputType="radio"
          title={r}
          checked={pick === r}
          onChange={() => {
            setPick(r)
            onChange(r === REASON_OTHER ? other.trim() : r)
          }}
        />
      ))}
      {isOther ? (
        <Input
          label="Alasan lain"
          value={other}
          onChange={(e) => {
            setOther(e.target.value)
            onChange(e.target.value.trim())
          }}
          placeholder="Tuliskan alasan"
        />
      ) : null}
    </div>
  )
}

export function PerbaruiStatusSheet({
  lead,
  open,
  onClose,
  onSaved,
}: {
  lead: PipelineLead
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [pick, setPick] = useState<Interest | null>(null)
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')

  function reset() {
    setPick(null)
    setNote('')
    setReason('')
  }

  const needsReason = pick === 'undecided' || pick === 'not-interested'
  const ready = Boolean(pick) && (!needsReason || reason.trim() !== '')

  function save() {
    if (!pick || !ready) return
    pipelineStore.recordInterest(lead.id, pick, needsReason ? reason : note, undefined, 'manual')
    reset()
    onSaved()
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Perbarui status"
      description="Bagaimana minatnya sekarang?"
      primaryAction={
        <Button size="lg" className="w-full" disabled={!ready} onClick={save}>
          Simpan
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        {INTEREST_ORDER.map((value) => (
          <SelectableCard
            key={value}
            name="interest"
            inputType="radio"
            title={INTEREST_META[value].label}
            description={INTEREST_META[value].hint}
            checked={pick === value}
            onChange={() => {
              setPick(value)
              setReason('')
            }}
          />
        ))}
        {needsReason ? (
          <div className="flex flex-col gap-4 pt-4">
            <span className="text-12 text-caption">Alasan (wajib)</span>
            <ReasonRadios key={pick} interest={pick} onChange={setReason} />
          </div>
        ) : (
          <label className="flex flex-col gap-4 pt-4">
            <span className="text-12 text-caption">Catatan (opsional)</span>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Hasil pembicaraan…" />
          </label>
        )}
      </div>
    </BottomSheet>
  )
}
