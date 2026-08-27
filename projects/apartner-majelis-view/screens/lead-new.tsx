'use client'

// Tambah Lead — capturing a prospect the BP just met, on the same form the
// Detail Lead page uses: Info Pribadi (Nama & No. HP required, a fixed POI
// Visit source, KTP) and Detail Pengajuan (Majelis, Status anggota, Produk),
// each optional field edited in place via the same sheets. Saving opens her
// record.

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
import { DetailRow, KtpSheet, MajelisPickerSheet, SourceSheet, assignmentLabel } from '../lib/pipeline-ui'
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

type SheetId = 'source' | 'ktp' | 'majelis' | 'role' | 'product' | null

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
  const [sumber, setSumber] = useState<Sumber | null>(null)
  const [majelis, setMajelis] = useState<MajelisAssignment>(DEFAULT_MAJELIS)
  const [role, setRole] = useState<MemberRole | null>(null)
  const [nik, setNik] = useState('')
  const [ktp, setKtp] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [sheet, setSheet] = useState<SheetId>(null)

  const isNewMajelis = majelis.kind === 'new'
  const hasKtp = ktp && nik.replace(/\D/g, '').length === 16
  const majelisValue = majelis.kind === 'none' ? 'Belum ditentukan' : assignmentLabel(majelis)
  const ready = name.trim() !== '' && phone.trim() !== '' && sumber !== null

  function save() {
    if (!ready || !sumber) return
    pipelineStore.addLead({
      name,
      phone,
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
    flow.go('lead-detail')
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Tambah Lead" onBack={() => flow.back()} />}>
      {/* Info Pribadi */}
      <Card>
        <div className="flex flex-col gap-8">
          <span className="text-14 font-bold text-default">Info Pribadi</span>
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
          </div>
          <div className="flex flex-col">
            {/* Source is required — the BP picks POI Visit or Referral. (When a
                lead is captured from a POI Visit / sosialisasi it is pre-filled
                and locked instead; that flow lives on the Sosialisasi screen.) */}
            <DetailRow label="Sumber" value={sumberLabel(sumber)} onEdit={() => setSheet('source')} />
            <DetailRow
              label="KTP"
              value={hasKtp ? nik : 'Belum ada'}
              onEdit={() => setSheet('ktp')}
            />
          </div>
        </div>
      </Card>

      {/* Detail Pengajuan */}
      <Card>
        <div className="flex flex-col gap-8">
          <span className="text-14 font-bold text-default">Detail Pengajuan</span>
          <div className="flex flex-col">
            <DetailRow
              label="Majelis"
              value={majelisValue}
              onEdit={() => setSheet('majelis')}
            />
            <DetailRow
              label="Status anggota"
              value={role ? MEMBER_ROLE_LABEL[role] : 'Belum dipilih'}
              onEdit={() => setSheet('role')}
            />
            <DetailRow
              label="Produk"
              value={product ?? 'Belum dipilih'}
              onEdit={() => setSheet('product')}
            />
          </div>
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!ready} onClick={save}>
          Simpan
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
