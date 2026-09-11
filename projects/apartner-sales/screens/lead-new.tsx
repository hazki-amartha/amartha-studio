'use client'

// Tambah Lead — one short form.
//
//   Source (preselected) · Nama · No. HP · Alamat Rumah (fields inline) ·
//   Pinjaman di kompetitor? · Foto bukti
//
// The SOURCE is chosen BEFORE this screen — a bottom sheet on the Sales page, or
// fixed by a sosialisasi — so here it is read-only. A pengajuan's questions (KTP,
// majelis, produk) are not here; those come later, once the prospect has said
// yes. Saving returns to wherever the form was opened from (Sales, or the POI's
// running leads list).

import { useRef, useState } from 'react'
import { Button, Input } from '@/design-system/components'
import { ArrowLeft, Camera, FileCheck, MapPin } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  getAddLeadEntry,
  pipelineStore,
  type AddLeadEntry,
  type AddLeadSource,
} from '../lib/pipeline-store'
import { PickSheet, SelectField } from '../lib/pipeline-ui'
import { poiStore } from '../lib/poi-store'
import { store, useApp } from '../lib/store'
import { AppScreen, Chip, StickyBar } from '../lib/ui'
import {
  CURRENT_FO,
  EMPTY_ADDRESS,
  FIELD_OFFICERS,
  KECAMATAN_LIST,
  WILAYAH,
  addressComplete,
  type LeadAddress,
} from '../lib/pipeline'

type SheetId = 'kecamatan' | 'desa' | 'fo' | 'lender' | null

const LENDER_OPTIONS = ['Mekaar', 'BRI', 'Lainnya']

function sumberLabel(s: AddLeadSource | null): string {
  if (!s) return ''
  if (s.source === 'poi') return s.poi ? `POI Visit · ${s.poi}` : 'POI Visit'
  if (s.source === 'canvassing') return s.poi ? `Canvassing · ${s.poi}` : 'Canvassing'
  return s.referredBy ? `Referral · ${s.referredBy}` : 'Referral'
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
  const hasAddress = addressComplete(address)
  // Lender & amount are optional now — a "Ya" answer alone is enough.
  const competitorLender = lenderChoice === 'Lainnya' ? lenderOther.trim() : lenderChoice
  const ready =
    name.trim() !== '' &&
    phone.trim() !== '' &&
    sumber !== null &&
    hasAddress &&
    competitorLoan !== null &&
    photo

  // Marking the pin stands in for a reverse-geocode: it fills the detail line if
  // it is still empty, so a marked location arrives with a readable address.
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
    <AppScreen
      topBar={
        <div className="flex items-center gap-12 border-b border-default bg-neutral-white px-16 py-8">
          <button
            type="button"
            aria-label="Kembali"
            onClick={goBack}
            className="flex h-32 w-32 shrink-0 items-center justify-center text-default"
          >
            <ArrowLeft size={24} />
          </button>
          <span className="min-w-0 flex-1 truncate text-16 font-bold text-default">New lead</span>
        </div>
      }
    >
      <div className="flex flex-col gap-16">
        <SelectField
          label="Source"
          readOnly
          value={sumber ? sumberLabel(sumber) : undefined}
          placeholder="Sumber"
          onClick={() => {}}
        />
        {isBM ? (
          <SelectField label="Petugas" required value={fo} placeholder="Pilih petugas" onClick={() => setSheet('fo')} />
        ) : null}
        <Input
          label="Nama"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nama calon mitra"
        />
        <Input
          label="No. HP"
          required
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="08xx-xxxx-xxxx"
          helperText="Nomor dicek otomatis — sudah terdaftar / mitra aktif akan ditandai"
        />

        {/* Alamat Rumah — fields exposed inline. */}
        <div className="flex flex-col gap-12">
          <SelectField
            label="Kecamatan"
            required
            value={address.kecamatan || undefined}
            placeholder="Pilih kecamatan"
            onClick={() => setSheet('kecamatan')}
          />
          <SelectField
            label="Desa"
            required
            value={address.desa || undefined}
            placeholder={address.kecamatan ? 'Pilih desa' : 'Pilih kecamatan dulu'}
            onClick={() => {
              if (address.kecamatan) setSheet('desa')
            }}
          />
          <div className="flex flex-col gap-8">
            <span className="text-12 font-regular text-default">
              Titik lokasi <span className="text-caption">(opsional)</span>
            </span>
            {pinned ? (
              <>
                <div className="relative flex items-center justify-center rounded-8 bg-blue-50 py-32">
                  <span className="text-primary-500">
                    <MapPin size={24} />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-12 text-green-600">Lokasi sudah ditandai</span>
                  <button
                    type="button"
                    onClick={() => setAddress({ ...address, mapsCoord: '' })}
                    className="text-12 font-bold text-link"
                  >
                    Ubah pin
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={markPin}
                className="flex items-center justify-center gap-8 rounded-8 border border-dashed border-default py-16 text-14 font-bold text-primary-500"
              >
                <MapPin size={20} />
                Tandai lokasi di peta
              </button>
            )}
          </div>
          <Input
            label="Detail alamat"
            optionalText="opsional"
            value={address.detail}
            onChange={(e) => setAddress({ ...address, detail: e.target.value })}
            placeholder="Kampung / RT / RW"
          />
        </div>

        <div className="flex flex-col gap-8">
          <span className="text-12 text-default">
            Punya pinjaman di kompetitor?<span className="text-red-500"> *</span>
          </span>
          <div className="flex gap-8">
            <Chip selected={competitorLoan === true} onClick={() => setCompetitorLoan(true)}>
              Ya
            </Chip>
            <Chip selected={competitorLoan === false} onClick={() => setCompetitorLoan(false)}>
              Tidak
            </Chip>
          </div>
          {competitorLoan === true ? (
            <div className="flex flex-col gap-12 pt-4">
              <SelectField
                label="Nama pemberi pinjaman"
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
              <Input
                label="Nominal pinjaman"
                optionalText="opsional"
                inputMode="numeric"
                value={competitorAmount}
                onChange={(e) => setCompetitorAmount(e.target.value)}
                placeholder="Rp"
              />
            </div>
          ) : null}
        </div>

        {/* Foto bukti — captured inline, not a dropdown. */}
        <div className="flex flex-col gap-8">
          <span className="text-12 text-default">
            Foto bukti<span className="text-red-500"> *</span>
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
              className="flex w-full flex-col items-center gap-4 rounded-8 border border-default bg-canvas-blue p-16 text-caption"
            >
              <Camera size={24} />
              <span className="text-14 text-default">Ambil foto bersama calon mitra</span>
            </button>
          )}
        </div>
      </div>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!ready} onClick={submit}>
          Submit
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
        title="Desa"
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
        title="Nama pemberi pinjaman"
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
