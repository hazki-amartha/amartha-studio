'use client'

// Shared Sales-pipeline UI, ported from the BP source: the majelis picker, the
// source (POI / referral) picker, KTP capture, the record's DetailRow and
// history sheet, and the "perbarui status" sheet. Kept here so Add Lead, the
// Lead detail page and the POI page all draw the exact same controls.
//
// The BM addition is `AssigneePickerSheet` — pick a BP, or the BM herself — used
// wherever a lead or a POI is handed to someone.

import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import { BottomSheet, Button, Card, Input, SelectableCard } from '@/design-system/components'
import { Camera, FileCheck, MapPin, NotePencil, Warning } from '@/design-system/icons'
import { IconChevronDown } from './icons'
import { MAJELIS_DIRECTORY } from './schedule'
import {
  ASSIGNEE_CHOICES,
  INTEREST_META,
  INTEREST_ORDER,
  MITRA_REFERRERS,
  PETUGAS_REFERRERS,
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
  const [step, setStep] = useState<'kind' | 'mitra' | 'petugas' | 'lainnya'>('kind')
  const [query, setQuery] = useState('')
  const [otherName, setOtherName] = useState('')
  const [otherRole, setOtherRole] = useState('')

  useEffect(() => {
    if (!open) {
      setStep('kind')
      setQuery('')
      setOtherName('')
      setOtherRole('')
    }
  }, [open])

  function close() {
    setStep('kind')
    setQuery('')
    setOtherName('')
    setOtherRole('')
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

  if (step === 'petugas') {
    const q = query.trim().toLowerCase()
    const rows = PETUGAS_REFERRERS.filter((p) => !q || p.toLowerCase().includes(q))
    return (
      <BottomSheet open={open} onClose={close} onBack={() => setStep('kind')} title="Pilih petugas Amartha">
        <div className="flex flex-col gap-8">
          <SearchField value={query} onChange={setQuery} placeholder="Cari nama petugas" label="Cari petugas" />
          {rows.map((p) => (
            <SelectableCard
              key={p}
              name="referrer-petugas"
              inputType="radio"
              title={p}
              checked={false}
              onChange={() => onPick(p, 'employee')}
            />
          ))}
          {rows.length === 0 ? (
            <span className="px-4 py-8 text-12 text-caption">Petugas tidak ditemukan.</span>
          ) : null}
        </div>
      </BottomSheet>
    )
  }

  if (step === 'lainnya') {
    return (
      <BottomSheet
        open={open}
        onClose={close}
        onBack={() => setStep('kind')}
        title="Perujuk lainnya"
        primaryAction={
          <Button
            size="lg"
            className="w-full"
            disabled={!otherName.trim()}
            onClick={() =>
              onPick(
                otherRole.trim() ? `${otherName.trim()} (${otherRole.trim()})` : otherName.trim(),
                'friend',
              )
            }
          >
            Simpan
          </Button>
        }
      >
        <div className="flex flex-col gap-12">
          <Input
            label="Nama"
            required
            value={otherName}
            onChange={(e) => setOtherName(e.target.value)}
            placeholder="Nama orang yang mereferensikan"
          />
          <Input
            label="Peran"
            value={otherRole}
            onChange={(e) => setOtherRole(e.target.value)}
            placeholder="Mis. tokoh warga, guru, kader posyandu"
          />
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
          title="Petugas Amartha"
          description="Dikenalkan oleh petugas Amartha"
          checked={false}
          onChange={() => setStep('petugas')}
        />
        <SelectableCard
          name="referrer-kind"
          inputType="radio"
          title="Lainnya"
          description="Perujuk lain — isi nama"
          checked={false}
          onChange={() => setStep('lainnya')}
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

// A stand-in for OCR: uploading the KTP reads its NIK. The BM can still edit it.
const READ_NIK = '3201094507910023'

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

  function uploadKtp() {
    setKtp(true)
    // The NIK is read off the photo — filled unless a valid one is already there.
    if (nik.replace(/\D/g, '').length !== 16) setNik(READ_NIK)
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="KTP"
      description="Unggah foto KTP — NIK terbaca otomatis dan bisa diubah."
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
            onClick={uploadKtp}
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
          placeholder="Unggah KTP untuk mengisi otomatis"
          state={nik && !nikValid ? 'error' : 'default'}
          helperText={
            nik && !nikValid
              ? 'NIK harus 16 digit'
              : ktp && nikValid
                ? 'Terbaca dari foto KTP — ubah bila perlu'
                : undefined
          }
        />
      </div>
    </BottomSheet>
  )
}

// --- SelectField ------------------------------------------------------------

/**
 * A picker styled to match the design-system Input: label above, a tappable
 * control below showing the chosen value (or a placeholder). Tapping opens
 * whatever sheet the caller wires to `onClick`, so a form mixing text inputs
 * and pickers reads as one.
 */
/**
 * A read-only field — label over value, no input chrome, like the Mitra record.
 * This is what every field renders as before its card's "Ubah" is tapped.
 */
export function ReadonlyField({
  label,
  value,
  required,
  description,
}: {
  label: ReactNode
  value?: string
  required?: boolean
  description?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-12 text-caption">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <span className="text-14 text-default">{value || '-'}</span>
      {description ? <span className="text-12">{description}</span> : null}
    </div>
  )
}

/** A text field that is an editable Input while active, a read-only row otherwise. */
export function TextField({
  label,
  value,
  editing,
  disabled,
  required,
  onChange,
  placeholder,
  inputMode,
  helperText,
  boldLabel,
}: {
  label: string
  value: string
  editing?: boolean
  disabled?: boolean
  required?: boolean
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  inputMode?: 'text' | 'tel' | 'numeric'
  helperText?: ReactNode
  boldLabel?: boolean
}) {
  if (!editing || disabled) {
    return <ReadonlyField label={label} value={value || undefined} required={required} description={helperText} />
  }
  return (
    <Input
      label={boldLabel ? <span className="font-bold">{label}</span> : label}
      required={required}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      inputMode={inputMode}
      helperText={helperText}
    />
  )
}

export function SelectField({
  label,
  value,
  placeholder,
  required,
  readOnly,
  description,
  boldLabel,
  onClick,
}: {
  label: string
  value?: string
  placeholder: string
  required?: boolean
  /** Render as a read-only row (label over value, no chevron) — for a locked field. */
  readOnly?: boolean
  /** A subtitle under the control — e.g. a map-pin status line. */
  description?: ReactNode
  /** Bold the label (to match a form whose other field labels are bold). */
  boldLabel?: boolean
  onClick: () => void
}) {
  const filled = Boolean(value)
  if (readOnly) {
    return <ReadonlyField label={label} value={filled ? value : undefined} required={required} description={description} />
  }
  const body = <span className={filled ? 'text-default' : 'text-placeholder'}>{filled ? value : placeholder}</span>
  return (
    <div className="flex flex-col gap-4">
      <span className={`text-12 text-default ${boldLabel ? 'font-bold' : 'font-regular'}`}>
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-left text-14"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          {body}
          {description ? <span className="text-12">{description}</span> : null}
        </span>
        <span className="shrink-0 text-disabled">
          <IconChevronDown size={20} />
        </span>
      </button>
    </div>
  )
}

// --- Address ----------------------------------------------------------------

/** Capture / edit an address, with an optional dropped map pin (a stand-in —
 *  the prototype draws the map; nothing opens a real Google Maps, §3). */
export function AddressSheet({
  open,
  address,
  mapsCoord,
  onClose,
  onSave,
}: {
  open: boolean
  address: string
  mapsCoord: string
  onClose: () => void
  onSave: (address: string, mapsCoord: string) => void
}) {
  const [addr, setAddr] = useState(address)
  const [coord, setCoord] = useState(mapsCoord)
  const pinned = Boolean(coord)

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Alamat"
      primaryAction={
        <Button size="lg" className="w-full" onClick={() => onSave(addr, coord)}>
          Simpan
        </Button>
      }
    >
      <div className="flex flex-col gap-12">
        <Input
          label="Alamat"
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="Kampung / RT / RW, desa"
        />
        <div className="flex flex-col gap-8">
          <span className="text-12 font-bold text-default">Lokasi di peta</span>
          {pinned ? (
            <>
              <div className="relative flex items-center justify-center rounded-8 bg-blue-50 py-32">
                <span className="text-primary-500">
                  <MapPin size={24} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-12 text-green-600">Lokasi sudah ditandai</span>
                <button type="button" onClick={() => setCoord('')} className="text-12 font-bold text-link">
                  Ubah pin
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setCoord('pinned')}
              className="flex items-center justify-center gap-8 rounded-8 border border-dashed border-default py-16 text-14 font-bold text-primary-500"
            >
              <MapPin size={20} />
              Tandai lokasi di peta
            </button>
          )}
        </div>
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
