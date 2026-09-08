'use client'

// Tambah Lead — the whole capture form, and deliberately five fields long.
//
//   Nama · No. HP · Sumber · Alamat Rumah · Foto bukti
//
// Every one of them is required, which is the point: this is the shortest record
// the branch can actually act on. A name and a number alone is a lead nobody can
// visit; the address is how she gets visited, the source is how the branch knows
// which channel is working, and the photo is the one field that cannot be filled
// in later from memory.
//
// Everything a PENGAJUAN needs — KTP, majelis, status anggota, produk — is not
// here. Those are questions for a prospect who has said yes, asked at submission
// on her own record, and asking them at capture is how a BP standing in a warung
// comes back with four leads instead of ten. The one exception is entering this
// screen AS a pengajuan (from the sosialisasi's "Langsung Ajukan Pinjaman"),
// which is a different intent and adds its own card below.

import { useRef, useState } from 'react'
import {
  BottomSheet,
  Button,
  Card,
  Input,
  NavigationHeader,
  SelectableCard,
} from '@/design-system/components'
import { ArrowLeft } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { getAddLeadEntry, pipelineStore, type AddLeadEntry } from '../lib/pipeline-store'
import {
  AddressSheet,
  KtpSheet,
  MajelisPickerSheet,
  PhotoSheet,
  PickSheet,
  SelectField,
  SourceSheet,
  assignmentLabel,
} from '../lib/pipeline-ui'
import { AppScreen, StickyBar } from '../lib/ui'
import {
  CURRENT_FO,
  EMPTY_ADDRESS,
  FIELD_OFFICERS,
  MEMBER_ROLE_LABEL,
  addressComplete,
  addressLine,
  type LeadAddress,
  type LeadSource,
  type MajelisAssignment,
  type MemberRole,
  type Product,
  type ReferrerKind,
} from '../lib/pipeline'

const DEFAULT_MAJELIS: MajelisAssignment = { kind: 'none', branch: 'BP Ciseeng' }

type SheetId =
  | 'source'
  | 'address'
  | 'photo'
  | 'fo'
  | 'ktp'
  | 'majelis'
  | 'role'
  | 'product'
  | 'ajukan'
  | 'pandu'
  | null

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
  const [sumber, setSumber] = useState<Sumber | null>(
    draft?.poi ? { source: 'poi', poi: draft.poi, referredBy: '', referrerKind: null } : null,
  )
  const [address, setAddress] = useState<LeadAddress>(EMPTY_ADDRESS)
  const [photo, setPhoto] = useState(false)
  const [fo, setFo] = useState(CURRENT_FO)
  const [sheet, setSheet] = useState<SheetId>(null)

  // Pengajuan-only, and only reachable in `ajukan` mode.
  const [majelis, setMajelis] = useState<MajelisAssignment>(DEFAULT_MAJELIS)
  const [role, setRole] = useState<MemberRole | null>(null)
  const [nik, setNik] = useState(draft?.nik ?? '')
  const [ktp, setKtp] = useState(draft?.ktp ?? false)
  const [product, setProduct] = useState<Product | null>(null)

  const isNewMajelis = majelis.kind === 'new'
  const hasKtp = ktp && nik.replace(/\D/g, '').length === 16
  const hasMajelis = majelis.kind !== 'none'
  const hasAddress = addressComplete(address)
  const majelisValue = majelis.kind === 'none' ? 'Belum ditentukan' : assignmentLabel(majelis)

  // All five, every time. Nothing on this form is optional.
  const ready =
    name.trim() !== '' && phone.trim() !== '' && sumber !== null && hasAddress && photo
  // Filing the pengajuan needs the lead's data complete on top of that.
  const canSubmit = ajukan ? ready && hasKtp && hasMajelis && Boolean(product) : ready

  function createLead(): string | null {
    if (!ready || !sumber) return null
    return pipelineStore.addLead({
      name,
      phone,
      address,
      fo,
      photo,
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
    <AppScreen
      topBar={
        // The header carries WHO the lead will belong to, because assignment is
        // a property of the whole form rather than a sixth field: every lead has
        // an owner from the moment it is written down, and it is normally the
        // person holding the phone. It is a line to correct, not one to fill in.
        <div className="flex items-start gap-12 border-b border-default bg-neutral-white px-16 py-8">
          <button
            type="button"
            aria-label="Kembali"
            onClick={() => flow.back()}
            className="flex h-32 w-32 shrink-0 items-center justify-center text-default"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-2 py-2">
            <span className="truncate text-16 font-bold text-default">
              {ajukan ? 'Ajukan Pinjaman' : 'Tambah Lead'}
            </span>
            <span className="flex items-center gap-4 text-12 text-caption">
              <span className="truncate">FO: {fo}</span>
              <button type="button" onClick={() => setSheet('fo')} className="shrink-0 text-link underline">
                Ubah
              </button>
            </span>
          </div>
        </div>
      }
    >
      <Card>
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
            label="Sumber"
            required
            value={sumber ? sumberLabel(sumber) : undefined}
            placeholder="Pilih sumber"
            onClick={() => setSheet('source')}
          />
          {/* One row, four parts — kecamatan, desa, pin, free text — because an
              address is one answer even though it takes four questions. Filled,
              it reads back as the line a BP would say out loud. */}
          <SelectField
            label="Alamat Rumah"
            required
            value={hasAddress ? addressLine(address) : undefined}
            placeholder="Kecamatan, desa, titik lokasi"
            onClick={() => setSheet('address')}
            description={
              hasAddress ? <span className="text-green-600">Lokasi sudah ditandai di peta</span> : undefined
            }
          />
          <SelectField
            label="Foto bukti"
            required
            value={photo ? 'Foto terlampir' : undefined}
            placeholder="Ambil foto calon mitra"
            onClick={() => setSheet('photo')}
          />
        </div>
      </Card>

      {/* Only when this screen was opened AS a pengajuan. */}
      {ajukan ? (
        <Card>
          <div className="flex flex-col gap-8">
            <span className="text-14 font-bold text-default">Detail Pengajuan</span>
            <div className="flex flex-col gap-12">
              <SelectField
                label="KTP"
                required
                value={hasKtp ? nik : undefined}
                placeholder="Lengkapi KTP"
                onClick={() => setSheet('ktp')}
              />
              <SelectField
                label="Majelis"
                required
                value={majelis.kind === 'none' ? undefined : majelisValue}
                placeholder="Pilih majelis"
                onClick={() => setSheet('majelis')}
              />
              <SelectField
                label="Status anggota"
                required
                value={role ? MEMBER_ROLE_LABEL[role] : undefined}
                placeholder="Pilih status"
                onClick={() => setSheet('role')}
              />
              <SelectField
                label="Produk"
                required
                value={product ?? undefined}
                placeholder="Pilih produk"
                onClick={() => setSheet('product')}
              />
            </div>
          </div>
        </Card>
      ) : null}

      <StickyBar>
        <Button
          size="lg"
          className="w-full"
          disabled={!canSubmit}
          onClick={ajukan ? () => setSheet('ajukan') : save}
        >
          {ajukan ? 'Ajukan Pinjaman' : 'Simpan Lead'}
        </Button>
      </StickyBar>

      <SourceSheet
        open={sheet === 'source'}
        onClose={() => setSheet(null)}
        onDone={(data) => {
          setSumber(data)
          setSheet(null)
        }}
      />
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
      <PickSheet
        open={sheet === 'fo'}
        title="Field Officer"
        options={FIELD_OFFICERS}
        value={fo}
        onClose={() => setSheet(null)}
        onPick={(v) => {
          setFo(v)
          setSheet(null)
        }}
      />

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
