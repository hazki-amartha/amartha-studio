'use client'

// Tambah Lead — capturing a prospect, on the same form the Detail Lead page
// uses. Ported from the BP concept with the BM addition: a Penugasan row so the
// BM hands the new lead to a BP or keeps it herself on the spot. Defaults to the
// BM (SELF). Saving opens her record.

import { useState } from 'react'
import {
  BottomSheet,
  Button,
  Card,
  Input,
  NavigationHeader,
  SelectableCard,
} from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { pipelineStore } from '../lib/pipeline-store'
import {
  AddressSheet,
  AssigneePickerSheet,
  KtpSheet,
  MajelisPickerSheet,
  SelectField,
  SourceSheet,
  assignmentLabel,
} from '../lib/pipeline-ui'
import { AppScreen, StickyBar } from '../lib/ui'
import {
  MEMBER_ROLE_LABEL,
  SELF,
  assigneeName,
  type LeadSource,
  type MajelisAssignment,
  type MemberRole,
  type Product,
  type ReferrerKind,
} from '../lib/pipeline'

const DEFAULT_MAJELIS: MajelisAssignment = { kind: 'none', branch: 'BP Ciseeng' }

type SheetId = 'source' | 'ktp' | 'majelis' | 'role' | 'product' | 'assignee' | 'address' | null

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
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [mapsCoord, setMapsCoord] = useState('')
  const [sumber, setSumber] = useState<Sumber | null>(null)
  const [assignedTo, setAssignedTo] = useState<string>(SELF)
  const [majelis, setMajelis] = useState<MajelisAssignment>(DEFAULT_MAJELIS)
  const [role, setRole] = useState<MemberRole | null>(null)
  const [nik, setNik] = useState('')
  const [ktp, setKtp] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [sheet, setSheet] = useState<SheetId>(null)

  const isNewMajelis = majelis.kind === 'new'
  const majelisValue = majelis.kind === 'none' ? 'Belum ditentukan' : assignmentLabel(majelis)
  const ready = name.trim() !== '' && phone.trim() !== '' && sumber !== null

  function save() {
    if (!ready || !sumber) return
    pipelineStore.addLead({
      name,
      phone,
      address,
      mapsCoord,
      source: sumber.source,
      poi: sumber.poi,
      referredBy: sumber.referredBy,
      referrerKind: sumber.referrerKind,
      assignedTo,
      majelis,
      role: role ?? undefined,
      nik,
      ktp,
      product,
    })
    flow.go('lead-detail')
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Tambah Lead" onBack={() => flow.back()} />}>
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
              value={ktp && nik.replace(/\D/g, '').length === 16 ? nik : undefined}
              placeholder="Lengkapi KTP"
              onClick={() => setSheet('ktp')}
            />
            <SelectField
              label="Sumber"
              required
              value={sumber ? sumberLabel(sumber) : undefined}
              placeholder="Pilih sumber"
              onClick={() => setSheet('source')}
            />
            {/* Petugas — the BM axis: who works this lead. */}
            <SelectField
              label="Petugas"
              value={assigneeName(assignedTo)}
              placeholder="Pilih petugas"
              onClick={() => setSheet('assignee')}
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
              value={majelis.kind === 'none' ? undefined : majelisValue}
              placeholder="Pilih majelis"
              onClick={() => setSheet('majelis')}
            />
            <SelectField
              label="Status anggota"
              value={role ? MEMBER_ROLE_LABEL[role] : undefined}
              placeholder="Pilih status"
              onClick={() => setSheet('role')}
            />
            <SelectField
              label="Produk"
              value={product ?? undefined}
              placeholder="Pilih produk"
              onClick={() => setSheet('product')}
            />
          </div>
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!ready} onClick={save}>
          Simpan
        </Button>
      </StickyBar>

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
      <AssigneePickerSheet
        open={sheet === 'assignee'}
        value={assignedTo}
        onClose={() => setSheet(null)}
        onPick={(v) => {
          setAssignedTo(v)
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
