'use client'

// Shared Sales-pipeline UI: the majelis picker, used wherever a lead's majelis
// is set — on capture (Add Lead), at submission, and when reassigning. Kept here
// so the three screens draw the exact same control rather than three of them.

import { useEffect, useState } from 'react'
import { BottomSheet, Button, Input, SelectableCard } from '@/design-system/components'
import { Camera, FileCheck } from '@/design-system/icons'
import { MAJELIS_DIRECTORY } from './schedule'
import {
  MITRA_REFERRERS,
  OTHER_REFERRERS,
  POI_LIST,
  SOURCE_LABEL,
  type LeadSource,
  type MajelisAssignment,
  type ReferrerKind,
} from './pipeline'
import { SearchField } from './ui'

export function assignmentLabel(m: MajelisAssignment): string {
  if (m.kind === 'existing') return MAJELIS_DIRECTORY.find((g) => g.id === m.id)?.name ?? 'Majelis'
  if (m.kind === 'new') return `${m.name || 'Majelis baru'} (Baru)`
  return 'Tanpa majelis'
}

/**
 * The majelis picker: no majelis, an existing group, or a new one the BP names
 * on the spot. "Majelis baru" reveals a name field and cannot be confirmed empty.
 */
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

/** Which POI the lead was met at — a searchable list. */
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

/**
 * Who referred her. Two branches, one sheet: a mitra (searchable roster) or one
 * of the non-mitra kinds (Amartha employee, tetangga, teman).
 */
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

  // Always reopen at the first step, whoever closed it.
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

/**
 * The full source picker for the record's "Ubah Sumber": choose POI Visit or
 * Referral, then its detail. One `onDone` payload covers both branches.
 */
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

  // Always reopen at the type step, whoever closed it.
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

/** Capture or edit the KTP — the foto and the NIK. */
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

/** Edit the lead's name and phone — the pencil beside her number. */
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
