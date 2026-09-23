'use client'

// Tambah Prospek — one short capture form.
//
//   Sumber (read-only) · Nama · No. HP · Alamat rumah (kecamatan · kelurahan ·
//   titik peta) · Pinjaman di kompetitor · Bukti foto
//
// The SOURCE is chosen BEFORE this screen — a bottom sheet on the Sales page, or
// fixed by a sosialisasi — so here it is a read-only line. A pengajuan's
// questions (KTP, majelis, produk) are not here; those come later, once the
// prospect has said yes. Saving returns to wherever the form was opened from
// (Sales, or the POI's running leads list).

import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { Button, Input, NavigationHeader } from '@/design-system/components'
import { Camera, FileCheck } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  getAddLeadEntry,
  pipelineStore,
  type AddLeadEntry,
  type AddLeadSource,
} from '../lib/pipeline-store'
import { PickSheet, ReadonlyField, SelectField } from '../lib/pipeline-ui'
import { poiStore } from '../lib/poi-store'
import { store, useApp } from '../lib/store'
import { AppScreen, Chip, StickyBar } from '../lib/ui'
import {
  CURRENT_FO,
  EMPTY_ADDRESS,
  FIELD_OFFICERS,
  KECAMATAN_LIST,
  WILAYAH,
  type LeadAddress,
} from '../lib/pipeline'

type SheetId = 'kecamatan' | 'desa' | 'fo' | 'lender' | null

const LENDER_OPTIONS = ['Mekaar', 'BRI', 'Lainnya']

function sumberLabel(s: AddLeadSource | null): string {
  if (!s) return ''
  if (s.source === 'poi') return s.poi ? `POI Visit • ${s.poi}` : 'POI Visit'
  if (s.source === 'canvassing') return s.poi ? `Canvassing • ${s.poi}` : 'Canvassing'
  return s.referredBy ? `Referral • ${s.referredBy}` : 'Referral'
}

/** A text field with a fixed prefix box (+62, Rp) — matches the Input chrome. */
function PrefixField({
  label,
  required,
  optionalText,
  prefix,
  value,
  onChange,
  placeholder,
  helper,
  inputMode,
}: {
  label: string
  required?: boolean
  optionalText?: string
  prefix: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  helper?: ReactNode
  inputMode?: 'tel' | 'numeric'
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-12 font-regular text-default">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
        {optionalText ? <span className="font-regular text-caption"> ({optionalText})</span> : null}
      </span>
      <div className="flex items-stretch overflow-hidden rounded-8 border border-default bg-neutral-white focus-within:border-primary-500">
        <span className="flex items-center border-r border-default bg-neutral-50 px-12 text-14 text-default">
          {prefix}
        </span>
        <input
          inputMode={inputMode}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-12 py-8 text-14 text-default outline-none placeholder:text-placeholder"
        />
      </div>
      {helper ? <span className="text-12 text-caption">{helper}</span> : null}
    </div>
  )
}

export function LeadNewScreen() {
  const flow = useFlow()
  const entry = useRef<AddLeadEntry | null>(null)
  if (entry.current === null) entry.current = getAddLeadEntry()
  const draft = entry.current.draft
  const returnTo = entry.current.returnTo
  // Source is fixed before this screen opens — read-only here.
  const sumber = entry.current.source

  const { role } = useApp()
  const isBM = role === 'BM'
  const [sheet, setSheet] = useState<SheetId>(null)
  // BM assigns the lead to a petugas; a BP always captures under their own name.
  const [fo, setFo] = useState(CURRENT_FO)
  const [name, setName] = useState(draft?.name ?? '')
  const [phone, setPhone] = useState(draft?.phone ?? '')
  const [address, setAddress] = useState<LeadAddress>(EMPTY_ADDRESS)
  const [competitorLoan, setCompetitorLoan] = useState<boolean | null>(null)
  const [lenderChoice, setLenderChoice] = useState('')
  const [lenderOther, setLenderOther] = useState('')
  const [competitorAmount, setCompetitorAmount] = useState('')
  const [photo, setPhoto] = useState(false)

  const desaOptions = address.kecamatan ? WILAYAH[address.kecamatan] ?? [] : []
  const pinned = Boolean(address.mapsCoord)
  // Lender & amount are optional — a "Ada" answer alone is enough.
  const competitorLender = lenderChoice === 'Lainnya' ? lenderOther.trim() : lenderChoice
  // Required: name, phone, kecamatan, kelurahan/desa, foto. Titik peta &
  // competitor loan are optional.
  const ready =
    name.trim() !== '' &&
    phone.trim() !== '' &&
    sumber !== null &&
    Boolean(address.kecamatan) &&
    Boolean(address.desa) &&
    photo

  // Marking the pin stands in for setting a map point (§3 — the prototype draws
  // the map, nothing opens a real one). It fills the detail line if still empty.
  function markPin() {
    setAddress((a) => {
      const guessed = a.desa ? `Kp. ${a.desa} RT 02/RW 05` : 'Kp. sekitar lokasi RT 02/RW 05'
      return { ...a, mapsCoord: 'pinned', detail: a.detail.trim() === '' ? guessed : a.detail }
    })
  }

  function goBack() {
    if (returnTo === 'sosialisasi') flow.go('sosialisasi')
    else flow.back()
  }

  function submit() {
    if (!ready || !sumber) return
    pipelineStore.addLead({
      name,
      phone,
      address,
      fo,
      photo,
      source: sumber.source,
      poi: sumber.poi,
      referredBy: sumber.referredBy,
      referrerKind: sumber.referrerKind,
      majelis: { kind: 'none', branch: 'BP Ciseeng' },
      nik: '',
      ktp: false,
      competitorLoan: competitorLoan ?? undefined,
      competitorLender,
      competitorAmount,
    })
    if (returnTo === 'sosialisasi') {
      // Already inside that POI's visit — back to its running leads list.
      flow.go('sosialisasi')
    } else if (sumber.source === 'poi') {
      // POI-source capture from the Sales button: land on that POI's page so the
      // BP can keep adding leads from the same visit. Find its POI record, or
      // create one if this place is new.
      const existing = poiStore.get().find((e) => e.poi === sumber.poi || e.title === sumber.poi)
      const id =
        existing?.id ??
        poiStore.add({
          title: sumber.poi,
          poi: sumber.poi,
          place: '',
          address: '',
          target: 10,
          contact: '',
          type: 'POI',
          poiType: 'POI',
          guide: '',
          art: 'pasar-ikan',
        })
      store.openSosialisasi(id)
      store.startPoiLeads()
      flow.go('sosialisasi')
    } else {
      pipelineStore.setFlash(`${name.trim()} berhasil ditambahkan sebagai lead`)
      flow.go('sales')
    }
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Tambah prospek" onBack={goBack} />}>
      <div className="flex flex-col gap-16">
        <ReadonlyField label="Sumber" value={sumber ? sumberLabel(sumber) : undefined} />

        {isBM ? (
          <SelectField
            label="Petugas"
            required
            value={fo}
            placeholder="Pilih petugas"
            onClick={() => setSheet('fo')}
          />
        ) : null}

        <Input
          label="Nama"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Marta Hakim"
        />

        <PrefixField
          label="Nomor HP"
          required
          prefix="+62"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Isi nomor HP yang aktif"
          helper="Contoh: 8567891298"
        />

        <SelectField
          label="Kecamatan rumah calon mitra"
          required
          value={address.kecamatan || undefined}
          placeholder="Pilih kecamatan"
          onClick={() => setSheet('kecamatan')}
        />
        <SelectField
          label="Kelurahan/desa rumah calon mitra"
          required
          value={address.desa || undefined}
          placeholder={address.kecamatan ? 'Pilih kelurahan atau desa' : 'Pilih kecamatan dulu'}
          onClick={() => {
            if (address.kecamatan) setSheet('desa')
          }}
        />
        <SelectField
          label="Alamat calon mitra"
          optionalText="opsional"
          value={pinned ? address.detail || 'Titik alamat sudah diatur' : undefined}
          placeholder="Atur titik alamat di peta"
          description={pinned ? <span className="text-green-600">Lokasi sudah ditandai</span> : undefined}
          onClick={markPin}
        />

        {/* Pinjaman di kompetitor — optional. "Ada" reveals lender + nominal. */}
        <div className="flex flex-col gap-8">
          <span className="text-12 font-regular text-default">
            Pinjaman di kompetitor <span className="font-regular text-caption">(opsional)</span>
          </span>
          <div className="flex gap-8">
            <Chip selected={competitorLoan === true} onClick={() => setCompetitorLoan(true)}>
              Ada
            </Chip>
            <Chip selected={competitorLoan === false} onClick={() => setCompetitorLoan(false)}>
              Tidak Ada
            </Chip>
          </div>
          {competitorLoan === true ? (
            <div className="flex flex-col gap-12 pt-4">
              <SelectField
                label="Kompetitor pemberi pinjaman"
                optionalText="opsional"
                value={lenderChoice || undefined}
                placeholder="Pilih pemberi pinjaman"
                onClick={() => setSheet('lender')}
              />
              {lenderChoice === 'Lainnya' ? (
                <Input
                  label="Nama pemberi pinjaman lainnya"
                  value={lenderOther}
                  onChange={(e) => setLenderOther(e.target.value)}
                  placeholder="Tulis nama pemberi pinjaman"
                />
              ) : null}
              <PrefixField
                label="Total Pinjaman"
                optionalText="opsional"
                prefix="Rp"
                inputMode="numeric"
                value={competitorAmount}
                onChange={(e) => setCompetitorAmount(e.target.value)}
                placeholder="Isi nominal pinjaman"
              />
            </div>
          ) : null}
        </div>

        {/* Bukti foto — captured inline, not a dropdown. */}
        <div className="flex flex-col gap-8">
          <span className="text-12 font-regular text-default">
            Bukti foto bersama calon mitra<span className="text-red-500"> *</span>
          </span>
          {photo ? (
            <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12">
              <span className="text-green-500">
                <FileCheck size={20} />
              </span>
              <span className="flex-1 text-default">Foto terlampir</span>
              <button
                type="button"
                onClick={() => setPhoto(false)}
                className="shrink-0 text-12 font-bold text-link"
              >
                Ambil ulang
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPhoto(true)}
              className="flex w-full flex-col items-center gap-4 rounded-8 border border-dashed border-default bg-canvas-blue p-16 text-caption"
            >
              <Camera size={24} />
              <span className="text-14 text-default">Ambil foto</span>
            </button>
          )}
        </div>
      </div>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!ready} onClick={submit}>
          Simpan ke Daftar Prospek
        </Button>
      </StickyBar>

      <PickSheet
        open={sheet === 'kecamatan'}
        title="Kecamatan"
        options={KECAMATAN_LIST}
        value={address.kecamatan}
        onClose={() => setSheet(null)}
        onPick={(k) => {
          // A new kecamatan drops the desa under it — the old one belongs elsewhere.
          setAddress({ ...address, kecamatan: k, desa: k === address.kecamatan ? address.desa : '' })
          setSheet(null)
        }}
      />
      <PickSheet
        open={sheet === 'desa'}
        title="Kelurahan/desa"
        options={desaOptions}
        value={address.desa}
        onClose={() => setSheet(null)}
        onPick={(d) => {
          setAddress({ ...address, desa: d })
          setSheet(null)
        }}
      />
      <PickSheet
        open={sheet === 'lender'}
        title="Kompetitor pemberi pinjaman"
        options={LENDER_OPTIONS}
        value={lenderChoice}
        onClose={() => setSheet(null)}
        onPick={(v) => {
          setLenderChoice(v)
          if (v !== 'Lainnya') setLenderOther('')
          setSheet(null)
        }}
      />
      <PickSheet
        open={sheet === 'fo'}
        title="Pilih petugas"
        options={FIELD_OFFICERS}
        value={fo}
        onClose={() => setSheet(null)}
        onPick={(v) => {
          setFo(v)
          setSheet(null)
        }}
      />
    </AppScreen>
  )
}
