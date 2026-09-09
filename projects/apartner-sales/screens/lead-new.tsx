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
import { ArrowLeft } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  getAddLeadEntry,
  pipelineStore,
  type AddLeadEntry,
  type AddLeadSource,
} from '../lib/pipeline-store'
import { AddressSheet, PhotoSheet, SelectField } from '../lib/pipeline-ui'
import { AppScreen, Chip, StickyBar } from '../lib/ui'
import {
  CURRENT_FO,
  EMPTY_ADDRESS,
  addressComplete,
  addressLine,
  type LeadAddress,
} from '../lib/pipeline'

type SheetId = 'address' | 'photo' | null

function sumberLabel(s: AddLeadSource | null): string {
  if (!s) return ''
  if (s.source === 'poi') return s.poi ? `POI Visit · ${s.poi}` : 'POI Visit'
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

  const [sheet, setSheet] = useState<SheetId>(null)
  const [name, setName] = useState(draft?.name ?? '')
  const [phone, setPhone] = useState(draft?.phone ?? '')
  const [address, setAddress] = useState<LeadAddress>(EMPTY_ADDRESS)
  const [competitorLoan, setCompetitorLoan] = useState<boolean | null>(null)
  const [photo, setPhoto] = useState(false)

  const hasAddress = addressComplete(address)
  const ready =
    name.trim() !== '' &&
    phone.trim() !== '' &&
    sumber !== null &&
    hasAddress &&
    competitorLoan !== null &&
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
      fo: CURRENT_FO,
      photo,
      source: sumber.source,
      poi: sumber.poi,
      referredBy: sumber.referredBy,
      referrerKind: sumber.referrerKind,
      majelis: { kind: 'none', branch: 'BP Ciseeng' },
      nik: '',
      ktp: false,
      competitorLoan: competitorLoan ?? undefined,
    })
    if (returnTo === 'sosialisasi') {
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
        </div>
        <SelectField
          label="Foto bukti"
          required
          value={photo ? 'Foto terlampir' : undefined}
          placeholder="Ambil foto calon mitra"
          onClick={() => setSheet('photo')}
        />
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
      <PhotoSheet
        key={sheet === 'photo' ? 'photo-open' : 'photo-closed'}
        open={sheet === 'photo'}
        photo={photo}
        onClose={() => setSheet(null)}
        onSave={(v) => {
          setPhoto(v)
          setSheet(null)
        }}
      />
    </AppScreen>
  )
}
