'use client'

// Tambah Lead — capturing a prospect the BP just met, on the same form the
// Detail Lead page uses: Info Pribadi (Nama & No. HP required, a fixed POI
// Visit source, KTP) and Detail Pengajuan (Majelis, Status anggota, Produk),
// each optional field edited in place via the same sheets. Saving opens her
// record.

import { useRef, useState } from 'react'
import {
  BottomSheet,
  Button,
  Card,
  Input,
  NavigationHeader,
  SelectableCard,
} from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { getAddLeadEntry, pipelineStore, type AddLeadEntry } from '../lib/pipeline-store'
import { AddressSheet, KtpSheet, MajelisPickerSheet, SelectField, SourceSheet, assignmentLabel } from '../lib/pipeline-ui'
import { AppScreen, StickyBar } from '../lib/ui'
import {
  MEMBER_ROLE_LABEL,
  type LeadSource,
  type MajelisAssignment,
  type MemberRole,
  type Product,
  type ReferrerKind,
} from '../lib/pipeline'

const DEFAULT_MAJELIS: MajelisAssignment = { kind: 'none', branch: 'BP Ciseeng' }

type SheetId = 'source' | 'ktp' | 'majelis' | 'role' | 'product' | 'address' | 'ajukan' | 'pandu' | null

interface Sumber {
  source: LeadSource
  poi: string
  referredBy: string
  referrerKind: ReferrerKind | null
}

function sumberLabel(s: Sumber | null): string {
  if (!s) return 'Belum dipilih'
  if (s.source === 'poi') return s.poi ? `POI ${s.poi}` : 'POI Visit'
  return s.referredBy ? `Referral · ${s.referredBy}` : 'Referral'
}

export function LeadNewScreen() {
  const flow = useFlow()
  // How this screen was opened: a plain save, or a direct pengajuan carrying the
  // name/phone/KTP typed in the sosialisasi quick capture. Consumed once.
  const entry = useRef<AddLeadEntry | null>(null)
  if (entry.current === null) entry.current = getAddLeadEntry()
  const ajukan = entry.current.mode === 'ajukan'
  const draft = entry.current.draft

  const [name, setName] = useState(draft?.name ?? '')
  const [phone, setPhone] = useState(draft?.phone ?? '')
  const [address, setAddress] = useState('')
  const [mapsCoord, setMapsCoord] = useState('')
  const [sumber, setSumber] = useState<Sumber | null>(
    draft?.poi ? { source: 'poi', poi: draft.poi, referredBy: '', referrerKind: null } : null,
  )
  const [majelis, setMajelis] = useState<MajelisAssignment>(DEFAULT_MAJELIS)
  const [role, setRole] = useState<MemberRole | null>(null)
  const [nik, setNik] = useState(draft?.nik ?? '')
  const [ktp, setKtp] = useState(draft?.ktp ?? false)
  const [product, setProduct] = useState<Product | null>(null)
  const [sheet, setSheet] = useState<SheetId>(null)

  const isNewMajelis = majelis.kind === 'new'
  const hasKtp = ktp && nik.replace(/\D/g, '').length === 16
  const hasMajelis = majelis.kind !== 'none'
  const majelisValue = majelis.kind === 'none' ? 'Belum ditentukan' : assignmentLabel(majelis)
  const ready = name.trim() !== '' && phone.trim() !== '' && sumber !== null
  // Filing the pengajuan needs the lead's data complete: KTP, majelis, product.
  const canAjukan = ready && hasKtp && hasMajelis && Boolean(product)
  const canSubmit = ajukan ? canAjukan : ready

  function createLead(): string | null {
    if (!ready || !sumber) return null
    return pipelineStore.addLead({
      name,
      phone,
      address,
      mapsCoord,
      source: sumber.source,
      poi: sumber.poi,
      referredBy: sumber.referredBy,
      referrerKind: sumber.referrerKind,
      majelis,
      role: role ?? undefined,
      nik,
      ktp,
      product,
    })
  }

  // Plain save (Sales "Tambah lead") — captures the lead and opens her record.
  function save() {
    const id = createLead()
    if (id) flow.go('lead-detail')
  }

  // Ajukan → "Undang pengajuan via AFin": files the pengajuan (→ Waiting for KYC).
  function undangAFin() {
    const id = createLead()
    if (!id) return
    pipelineStore.invite(id)
    flow.go('lead-detail')
  }

  // Ajukan → "Ajukan langsung via APartner": the guided (pandu) flow.
  function ajukanApartner() {
    if (createLead()) setSheet('pandu')
  }

  return (
    <AppScreen topBar={<NavigationHeader title={ajukan ? 'Ajukan Pinjaman' : 'Tambah Lead'} onBack={() => flow.back()} />}>
      {/* Info Pribadi */}
      <Card>
        <div className="flex flex-col gap-8">
          <span className="text-14 font-bold text-default">Info Lead</span>
          <div className="flex flex-col gap-12">
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
            />
            <SelectField
              label="Alamat"
              value={address || undefined}
              placeholder="Isi alamat"
              onClick={() => setSheet('address')}
              description={mapsCoord ? (
                <span className="text-green-600">Lokasi sudah ditandai di peta</span>
              ) : undefined}
            />
            <SelectField
              label="KTP"
              required={ajukan}
              value={hasKtp ? nik : undefined}
              placeholder="Lengkapi KTP"
              onClick={() => setSheet('ktp')}
            />
            {/* Source is required — POI Visit or Referral. */}
            <SelectField
              label="Sumber"
              required
              value={sumber ? sumberLabel(sumber) : undefined}
              placeholder="Pilih sumber"
              onClick={() => setSheet('source')}
            />
          </div>
        </div>
      </Card>

      {/* Detail Pengajuan */}
      <Card>
        <div className="flex flex-col gap-8">
          <span className="text-14 font-bold text-default">Detail Pengajuan</span>
          <div className="flex flex-col gap-12">
            <SelectField
              label="Majelis"
              required={ajukan}
              value={majelis.kind === 'none' ? undefined : majelisValue}
              placeholder="Pilih majelis"
              onClick={() => setSheet('majelis')}
            />
            <SelectField
              label="Status anggota"
              required={ajukan}
              value={role ? MEMBER_ROLE_LABEL[role] : undefined}
              placeholder="Pilih status"
              onClick={() => setSheet('role')}
            />
            <SelectField
              label="Produk"
              required={ajukan}
              value={product ?? undefined}
              placeholder="Pilih produk"
              onClick={() => setSheet('product')}
            />
          </div>
        </div>
      </Card>

      <StickyBar>
        <Button
          size="lg"
          className="w-full"
          disabled={!canSubmit}
          onClick={ajukan ? () => setSheet('ajukan') : save}
        >
          {ajukan ? 'Ajukan Pinjaman' : 'Simpan'}
        </Button>
      </StickyBar>

      {/* Ajukan Pinjaman — the same two-option flow as the Detail Lead page. */}
      <BottomSheet open={sheet === 'ajukan'} onClose={() => setSheet(null)} title="Ajukan Pinjaman">
        <div className="flex flex-col gap-8">
          <button
            type="button"
            disabled={isNewMajelis}
            onClick={undangAFin}
            className={`flex flex-col gap-2 rounded-12 border p-16 text-left ${
              isNewMajelis ? 'border-default bg-neutral-50' : 'border-default bg-neutral-white'
            }`}
          >
            <span className={`text-14 font-bold ${isNewMajelis ? 'text-disabled' : 'text-default'}`}>
              Undang pengajuan via AFin
            </span>
            <span className="text-12 text-caption">
              {isNewMajelis
                ? 'Tidak tersedia untuk majelis baru — perlu dipandu'
                : 'Calon mitra pengajuan mandiri'}
            </span>
          </button>
          <button
            type="button"
            onClick={ajukanApartner}
            className="flex flex-col gap-2 rounded-12 border border-default bg-neutral-white p-16 text-left"
          >
            <span className="text-14 font-bold text-default">Ajukan langsung via APartner</span>
            <span className="text-12 text-caption">Bantu mitra lakukan pengajuan</span>
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={sheet === 'pandu'}
        onClose={() => flow.go('lead-detail')}
        size="fullscreen"
        title="Pandu Calon Mitra"
      >
        <span className="text-14 text-caption">Alur pandu akan dibuat di sini.</span>
      </BottomSheet>

      <AddressSheet
        key={sheet === 'address' ? 'addr-open' : 'addr-closed'}
        open={sheet === 'address'}
        address={address}
        mapsCoord={mapsCoord}
        onClose={() => setSheet(null)}
        onSave={(a, c) => {
          setAddress(a)
          setMapsCoord(c)
          setSheet(null)
        }}
      />
      <SourceSheet
        open={sheet === 'source'}
        onClose={() => setSheet(null)}
        onDone={(data) => {
          setSumber(data)
          setSheet(null)
        }}
      />
      <KtpSheet
        open={sheet === 'ktp'}
        nik={nik}
        ktp={ktp}
        onClose={() => setSheet(null)}
        onSave={(n, k) => {
          setNik(n)
          setKtp(k)
          setSheet(null)
        }}
      />
      <MajelisPickerSheet
        open={sheet === 'majelis'}
        value={majelis}
        onClose={() => setSheet(null)}
        onPick={(m) => {
          setMajelis(m)
          if (m.kind !== 'new') setRole('anggota')
          setSheet(null)
        }}
      />

      {/* Status anggota — Ketua only for a majelis being formed. */}
      <BottomSheet open={sheet === 'role'} onClose={() => setSheet(null)} title="Status anggota">
        <div className="flex flex-col gap-8">
          <SelectableCard
            name="role"
            inputType="radio"
            title={MEMBER_ROLE_LABEL.anggota}
            checked={role === 'anggota'}
            onChange={() => {
              setRole('anggota')
              setSheet(null)
            }}
          />
          <SelectableCard
            name="role"
            inputType="radio"
            title={MEMBER_ROLE_LABEL.ketua}
            description={isNewMajelis ? undefined : 'Hanya untuk majelis baru'}
            disabled={!isNewMajelis}
            checked={role === 'ketua'}
            onChange={() => {
              setRole('ketua')
              setSheet(null)
            }}
          />
        </div>
      </BottomSheet>

      {/* Produk */}
      <BottomSheet open={sheet === 'product'} onClose={() => setSheet(null)} title="Produk">
        <div className="flex flex-col gap-8">
          {(['GL', 'Modal'] as Product[]).map((p) => (
            <SelectableCard
              key={p}
              name="product"
              inputType="radio"
              title={p}
              checked={product === p}
              onChange={() => {
                setProduct(p)
                setSheet(null)
              }}
            />
          ))}
        </div>
      </BottomSheet>
    </AppScreen>
  )
}
