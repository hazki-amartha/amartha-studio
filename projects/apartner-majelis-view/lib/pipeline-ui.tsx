'use client'

// Shared Sales-pipeline UI: the majelis picker, used wherever a lead's majelis
// is set — on capture (Add Lead), at submission, and when reassigning. Kept here
// so the three screens draw the exact same control rather than three of them.

import { useEffect, useState, type ReactNode } from 'react'
import { Badge, BottomSheet, Button, Card, Input, SelectableCard } from '@/design-system/components'
import { Camera, FileCheck, NotePencil, Warning, WhatsappLogo } from '@/design-system/icons'
import { MAJELIS_DIRECTORY } from './schedule'
import {
  INTEREST_META,
  INTEREST_ORDER,
  MITRA_REFERRERS,
  OTHER_REFERRERS,
  POI_LIST,
  SOURCE_LABEL,
  actionDetail,
  hasInterest,
  historyActivity,
  historyStatusLabel,
  ktpDetail,
  majelisDetail,
  sourceDetail,
  statusBadge,
  subStateTag,
  type Interest,
  type LeadSource,
  type MajelisAssignment,
  type PipelineLead,
  type Product,
  type ReferrerKind,
} from './pipeline'
import { pipelineStore } from './pipeline-store'
import { ContactButton, SearchField, SectionTitle } from './ui'
import { IconPhone } from './icons'

// Interest as coloured text: green for interested, blue (informational) for
// undecided, red for not interested.
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

// --- The record card + history + action sheets -----------------------------
// Shared by the Sales detail page and the Follow-Up task, so a lead reads the
// same way whether the BP reached her from the roster or from her schedule.

/**
 * A label / value row with an optional "Ubah", ruled off from its neighbours by
 * a top divider. `warning` paints the value orange with a caution icon — for a
 * missing KTP or an unassigned majelis.
 */
export function DetailRow({
  label,
  value,
  onEdit,
  warning,
}: {
  label: string
  value: string
  onEdit?: () => void
  warning?: boolean
}) {
  return (
    <div className="flex items-center gap-8 border-t border-default py-12">
      <span className="flex min-w-0 flex-1 items-center gap-4 text-14">
        <span className="shrink-0 text-caption">{label}:</span>
        <span className={warning ? 'text-orange-600' : 'text-default'}>{value}</span>
        {warning ? (
          <span className="shrink-0 text-orange-600">
            <Warning size={16} />
          </span>
        ) : null}
      </span>
      {onEdit ? (
        <button type="button" onClick={onEdit} className="shrink-0 text-12 font-bold text-link">
          Ubah
        </button>
      ) : null}
    </div>
  )
}

/**
 * The identity card: name + phone (editable), WA/call buttons, the two-level
 * status, the editable Sumber/Majelis/KTP rows, the "action selanjutnya" line,
 * and an action slot at the foot. Every callback is optional so a read-only
 * surface can drop the edit affordances.
 */
export function LeadRecordCard({
  lead,
  onEditContact,
  onEditSource,
  onEditMajelis,
  onEditKtp,
  onContact,
  action,
}: {
  lead: PipelineLead
  onEditContact?: () => void
  onEditSource?: () => void
  onEditMajelis?: () => void
  onEditKtp?: () => void
  onContact?: () => void
  action?: ReactNode
}) {
  const badge = statusBadge(lead)
  const worked = hasInterest(lead.status)
  const interest = worked && lead.interest ? lead.interest : null
  // For a Submitted lead the interest slot carries the system sub-state instead.
  const sub = subStateTag(lead)

  return (
    <Card>
      <div className="flex flex-col gap-12">
        <div className="flex items-start gap-12">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="truncate text-18 font-bold text-default">{lead.name}</span>
            <span className="flex items-center gap-8">
              <span className="truncate text-14 text-caption">{lead.phone}</span>
              {onEditContact ? (
                <button
                  type="button"
                  aria-label="Ubah kontak"
                  onClick={onEditContact}
                  className="shrink-0 text-primary-500"
                >
                  <NotePencil size={16} />
                </button>
              ) : null}
            </span>
          </div>
          {worked && onContact ? (
            <div className="flex shrink-0 gap-8">
              <ContactButton label={`WhatsApp ${lead.name}`} tone="green" onClick={onContact}>
                <WhatsappLogo size={20} />
              </ContactButton>
              <ContactButton label={`Telepon ${lead.name}`} tone="primary" onClick={onContact}>
                <IconPhone size={20} />
              </ContactButton>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-8">
          <Badge intent={badge.intent} variant="outline">
            {badge.label}
          </Badge>
          {interest ? (
            <span className={`text-14 font-bold ${INTEREST_TEXT[interest]}`}>
              {INTEREST_META[interest].label}
            </span>
          ) : sub ? (
            <span className="text-14 text-caption">{sub}</span>
          ) : null}
        </div>

        <div className="flex flex-col">
          <DetailRow label="Sumber" value={sourceDetail(lead)} onEdit={onEditSource} />
          <DetailRow label="KTP" value={ktpDetail(lead)} onEdit={onEditKtp} warning={!lead.nik} />
          <DetailRow
            label="Majelis"
            value={majelisDetail(lead)}
            onEdit={onEditMajelis}
            warning={lead.majelis.kind === 'none'}
          />
          {lead.product ? (
            <DetailRow label="Produk" value={`${lead.product}${lead.amount ? ` · ${lead.amount}` : ''}`} />
          ) : null}
        </div>

        {(() => {
          const detail = actionDetail(lead)
          return (
            <div className="flex flex-col gap-2 rounded-8 bg-canvas-blue px-12 py-8">
              <span className="text-12 text-caption">Action selanjutnya:</span>
              <span className="text-14 font-bold text-default">{detail.title}</span>
              {detail.sub ? <span className="text-12 text-caption">{detail.sub}</span> : null}
            </div>
          )
        })()}

        {action}
      </div>
    </Card>
  )
}

/** The lead's history — one card per event, newest first. */
export function RiwayatPanggilan({ lead }: { lead: PipelineLead }) {
  return (
    <>
      <SectionTitle>Riwayat</SectionTitle>
      <div className="flex flex-col gap-8 pb-16">
        {lead.log
          .slice()
          .reverse()
          .map((entry, i) => (
            <Card key={`${entry.at}-${i}`}>
              {/* Date · activity, the status, then any system detail (plain) and
                  the BP's free-text catatan (italic, quoted). */}
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
    </>
  )
}

/**
 * Perbarui status — records the interest note, and carries "Ajukan Pinjaman" as
 * a choice (selectable only once Qualified). `onSaved` fires after a status is
 * recorded, so the caller can close the sheet or finish a task.
 */
export function PerbaruiStatusSheet({
  lead,
  open,
  canSubmit,
  onClose,
  onAjukan,
  onSaved,
}: {
  lead: PipelineLead
  open: boolean
  canSubmit: boolean
  onClose: () => void
  onAjukan: () => void
  onSaved: () => void
}) {
  const [pick, setPick] = useState<Interest | 'ajukan' | null>(null)
  const [note, setNote] = useState('')

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
    // Updating status from the record (not a scheduled call) logs as "Manual".
    pipelineStore.recordInterest(lead.id, pick, note, undefined, 'manual')
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
        <Button size="lg" className="w-full" disabled={!pick} onClick={save}>
          {pick === 'ajukan' ? 'Lanjut' : 'Simpan'}
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
            onChange={() => setPick(value)}
          />
        ))}
        <SelectableCard
          name="interest"
          inputType="radio"
          title="Ajukan Pinjaman"
          description={canSubmit ? 'Kirim pengajuan pinjaman' : 'Pastikan KTP sudah tersedia'}
          checked={pick === 'ajukan'}
          onChange={() => setPick('ajukan')}
        />
        {pick !== 'ajukan' ? (
          <label className="flex flex-col gap-4 pt-4">
            <span className="text-12 text-caption">Catatan (opsional)</span>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Hasil pembicaraan…" />
          </label>
        ) : null}
      </div>
    </BottomSheet>
  )
}

/** Ajukan Pinjaman — the Qualified → Submitted form. `onSaved` fires on submit. */
export function SubmitSheet({
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
  const [product, setProduct] = useState<Product | null>(null)
  const [majelis, setMajelis] = useState<MajelisAssignment>(lead.majelis)
  const [nik, setNik] = useState(lead.nik)
  const [ktp, setKtp] = useState(lead.ktp)
  // Which sub-sheet is open over the form — the majelis picker or the KTP form.
  const [editing, setEditing] = useState<'majelis' | 'ktp' | null>(null)

  function reset() {
    setProduct(null)
    setMajelis(lead.majelis)
    setNik(lead.nik)
    setKtp(lead.ktp)
    setEditing(null)
  }

  // A loan can't be submitted without a majelis — she has to belong to a group
  // before the form goes in. "Tanpa majelis" does not count.
  const hasMajelis = majelis.kind !== 'none'
  // KTP is the prerequisite for a pengajuan, but it no longer blocks getting
  // INTO this flow — it can be attached right here if it is still missing.
  const hasKtp = ktp && nik.replace(/\D/g, '').length === 16

  function submit() {
    if (!product || !hasMajelis || !hasKtp) return
    pipelineStore.submitLoan(lead.id, { product, majelis, nik })
    reset()
    onSaved()
  }

  return (
    <>
      <BottomSheet
        open={open && editing === null}
        onClose={() => {
          reset()
          onClose()
        }}
        title="Ajukan Pinjaman"
        description="Kirim form pengajuan ke sistem. Setelah ini lead menunggu hasil UK."
        primaryAction={
          <Button
            size="lg"
            className="w-full"
            disabled={!product || !hasMajelis || !hasKtp}
            onClick={submit}
          >
            Kirim Pengajuan
          </Button>
        }
      >
        <div className="flex flex-col gap-12">
          {/* KTP first — the prerequisite the pengajuan is built on. Editable
              here so a missing KTP can be attached without leaving the flow. */}
          <div className="flex flex-col gap-4">
            <span className="text-12 text-caption">KTP</span>
            <button
              type="button"
              onClick={() => setEditing('ktp')}
              className={`flex items-center gap-8 rounded-8 border bg-neutral-white px-12 py-8 text-left text-14 ${
                hasKtp ? 'border-default text-default' : 'border-red-500 text-caption'
              }`}
            >
              {hasKtp ? (
                <span className="shrink-0 text-green-500">
                  <FileCheck size={20} />
                </span>
              ) : (
                <span className="shrink-0 text-orange-500">
                  <Warning size={20} />
                </span>
              )}
              <span className="min-w-0 flex-1 truncate">{hasKtp ? nik : 'Belum ada'}</span>
              <span className="shrink-0 text-12 font-bold text-link">{hasKtp ? 'Ubah' : 'Lengkapi'}</span>
            </button>
            {!hasKtp ? (
              <span className="text-12 text-red-500">Pastikan KTP sudah tersedia.</span>
            ) : null}
          </div>

          {/* Then Majelis — she must belong to a group before a loan is filed. */}
          <label className="flex flex-col gap-4">
            <span className="text-12 text-caption">Majelis</span>
            <button
              type="button"
              onClick={() => setEditing('majelis')}
              className={`flex items-center justify-between gap-8 rounded-8 border bg-neutral-white px-12 py-8 text-left text-14 ${
                hasMajelis ? 'border-default text-default' : 'border-red-500 text-caption'
              }`}
            >
              <span className="truncate">{hasMajelis ? assignmentLabel(majelis) : 'Pilih majelis'}</span>
              <span className="shrink-0 text-12 font-bold text-link">{hasMajelis ? 'Ubah' : 'Pilih'}</span>
            </button>
            {!hasMajelis ? (
              <span className="text-12 text-red-500">Pilih majelis dulu untuk mengajukan.</span>
            ) : null}
          </label>

          <div className="flex flex-col gap-4">
            <span className="text-12 text-caption">Produk</span>
            <div className="flex flex-col gap-8">
              {(['GL', 'Modal'] as Product[]).map((p) => (
                <SelectableCard
                  key={p}
                  name="submit-product"
                  inputType="radio"
                  title={p}
                  checked={product === p}
                  onChange={() => setProduct(p)}
                />
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      <MajelisPickerSheet
        open={open && editing === 'majelis'}
        value={majelis}
        onClose={() => setEditing(null)}
        onPick={(m) => {
          setMajelis(m)
          setEditing(null)
        }}
      />

      <KtpSheet
        open={open && editing === 'ktp'}
        nik={nik}
        ktp={ktp}
        onClose={() => setEditing(null)}
        onSave={(n, k) => {
          setNik(n)
          setKtp(k)
          setEditing(null)
        }}
      />
    </>
  )
}
