'use client'

// Tambah Lead — one short form, every field required.
//
//   Source (preselected) · Nama · No. HP · Alamat Rumah · Pinjaman di kompetitor?
//   · Foto bukti
//
// The SOURCE is chosen BEFORE this screen — a bottom sheet on the Sales page, or
// fixed by a sosialisasi — so here it is read-only. A pengajuan's questions (KTP,
// majelis, produk) are not here; those come later, once the prospect has said
// yes. Saving returns to wherever the form was opened from (Sales, or the POI's
// running leads list).

import { useRef, useState } from 'react'
import { Button, Input } from '@/design-system/components'
import { ArrowLeft, Camera, FileCheck } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  getAddLeadEntry,
  pipelineStore,
  type AddLeadEntry,
  type AddLeadSource,
} from '../lib/pipeline-store'
import { AddressSheet, PickSheet, SelectField } from '../lib/pipeline-ui'
import { poiStore } from '../lib/poi-store'
import { store, useApp } from '../lib/store'
import { AppScreen, Chip, StickyBar } from '../lib/ui'
import {
  CURRENT_FO,
  EMPTY_ADDRESS,
  FIELD_OFFICERS,
  addressComplete,
  addressLine,
  type LeadAddress,
} from '../lib/pipeline'

type SheetId = 'address' | 'fo' | null

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
  const [competitorLender, setCompetitorLender] = useState('')
  const [competitorAmount, setCompetitorAmount] = useState('')
  const [photo, setPhoto] = useState(false)

  const hasAddress = addressComplete(address)
  // A "Ya" competitor loan must name the lender and the amount.
  const competitorOk =
    competitorLoan === false ||
    (competitorLoan === true && competitorLender.trim() !== '' && competitorAmount.trim() !== '')
  const ready =
    name.trim() !== '' &&
    phone.trim() !== '' &&
    sumber !== null &&
    hasAddress &&
    competitorLoan !== null &&
    competitorOk &&
    photo

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
        <SelectField
          label="Alamat Rumah"
          required
          value={hasAddress ? addressLine(address) : undefined}
          placeholder="Kecamatan, desa, titik lokasi"
          onClick={() => setSheet('address')}
          description={
            hasAddress ? (
              <span className="text-green-600">Lokasi sudah ditandai di peta</span>
            ) : (
              <span className="text-caption">Hanya kecamatan &amp; desa dalam wilayahmu</span>
            )
          }
        />
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
              <Input
                label="Nama pemberi pinjaman"
                required
                value={competitorLender}
                onChange={(e) => setCompetitorLender(e.target.value)}
                placeholder="Mis. Mekaar, BRI, koperasi"
              />
              <Input
                label="Nominal pinjaman"
                required
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

      <AddressSheet
        key={sheet === 'address' ? 'addr-open' : 'addr-closed'}
        open={sheet === 'address'}
        value={address}
        onClose={() => setSheet(null)}
        onSave={(a) => {
          setAddress(a)
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
