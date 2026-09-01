'use client'

// Detail Lead — a prospect's record, reached from the Sales roster. Ported from
// the BP concept, with two BM changes: the follow-up-as-a-task jump is gone (the
// BM has no field schedule), and a "Ditugaskan ke" row lets her hand the lead to
// a BP or keep it herself.
//
// The header carries who she is (name) with where she is (status) under it, and
// WhatsApp / map at the right. Below, a form-style stack: the "action
// selanjutnya" box (history one tap inside it), then Info Pribadi, Penugasan and
// Detail Pengajuan, each field edited in place. One action drives the page —
// Ajukan Pinjaman, once her data is complete.

import { useState, type ReactNode } from 'react'
import {
  Badge,
  BottomSheet,
  Button,
  Card,
  NavigationHeader,
  SelectableCard,
} from '@/design-system/components'
import { MapPin, NotePencil, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import {
  AddressSheet,
  AssigneePickerSheet,
  KtpSheet,
  MajelisPickerSheet,
  PerbaruiStatusSheet,
  RiwayatSheet,
  SelectField,
  SourceSheet,
  TextField,
} from '../lib/pipeline-ui'
import { AppScreen, ContactButton, StickyBar } from '../lib/ui'
import {
  MEMBER_ROLE_LABEL,
  actionDetail,
  assigneeName,
  isNew,
  majelisDetail,
  sourceDetail,
  statusBadge,
  type MemberRole,
  type Product,
} from '../lib/pipeline'

type SheetId =
  | 'source'
  | 'majelis'
  | 'role'
  | 'product'
  | 'ktp'
  | 'address'
  | 'assignee'
  | 'ajukan'
  | 'pandu'
  | 'interest'
  | 'riwayat'
  | null

function FormCard({
  title,
  subtitle,
  editing,
  onToggleEdit,
  children,
}: {
  title: string
  subtitle?: string
  /** When provided, an Ubah / Simpan toggle sits on the card title. */
  editing?: boolean
  onToggleEdit?: () => void
  children: ReactNode
}) {
  return (
    <Card>
      <div className="flex flex-col gap-8">
        <div className="flex items-start justify-between gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-14 font-bold text-default">{title}</span>
            {subtitle ? <span className="text-12 text-caption">{subtitle}</span> : null}
          </div>
          {onToggleEdit ? (
            <button type="button" onClick={onToggleEdit} className="shrink-0 text-12 font-bold text-link">
              {editing ? 'Simpan' : 'Ubah'}
            </button>
          ) : null}
        </div>
        <div className="flex flex-col gap-12">{children}</div>
      </div>
    </Card>
  )
}

export function LeadDetailScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [sheet, setSheet] = useState<SheetId>(null)
  // The record opens read-only; each card's Ubah button turns its own edit on.
  const [editSection, setEditSection] = useState<'info' | 'pengajuan' | null>(null)
  const toggle = (s: 'info' | 'pengajuan') => setEditSection((cur) => (cur === s ? null : s))

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Detail Lead" onBack={() => flow.back()} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const worked = isNew(lead.status)
  const badge = statusBadge(lead)
  const detail = actionDetail(lead)
  const isNewMajelis = lead.majelis.kind === 'new'
  const role: MemberRole = isNewMajelis ? lead.role ?? 'anggota' : 'anggota'
  const hasKtp = lead.nik.replace(/\D/g, '').length === 16
  const hasMajelis = lead.majelis.kind !== 'none'
  const canInvite = hasKtp && hasMajelis && Boolean(lead.product)
  // Once the pengajuan is under review, her personal data is frozen — the system
  // is underwriting exactly what is on file, so Info Pribadi becomes read-only.
  const infoLocked = lead.status === 'underwriting'

  return (
    <AppScreen
      topBar={
        <div className="flex items-center gap-12 border-b border-default bg-neutral-white px-16 py-8">
          <button
            type="button"
            onClick={() => flow.back()}
            aria-label="Kembali"
            className="shrink-0 text-default"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <span className="truncate text-16 font-bold text-default">{lead.name}</span>
            <span className="flex items-center gap-8">
              <Badge intent={badge.intent} variant="outline" size="sm">
                {badge.label}
              </Badge>
              {worked ? (
                <button
                  type="button"
                  aria-label="Perbarui status minat"
                  onClick={() => setSheet('interest')}
                  className="shrink-0 text-primary-500"
                >
                  <NotePencil size={16} />
                </button>
              ) : null}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-8">
            <ContactButton label={`WhatsApp ${lead.name}`} tone="green" onClick={() => {}}>
              <WhatsappLogo size={20} />
            </ContactButton>
            <ContactButton label={`Peta ${lead.name}`} tone="red" onClick={() => {}}>
              <MapPin size={20} />
            </ContactButton>
          </div>
        </div>
      }
    >
      {/* Action selanjutnya — its own info box up top, history one tap inside it. */}
      <div className="flex flex-col gap-2 rounded-12 border border-blue-200 bg-blue-50 px-12 py-12">
        <span className="text-12 text-caption">Action selanjutnya:</span>
        <span className="text-14 font-bold text-default">{detail.title}</span>
        {detail.sub ? <span className="text-12 text-caption">{detail.sub}</span> : null}
        <button
          type="button"
          onClick={() => setSheet('riwayat')}
          className="mt-4 self-start text-12 font-bold text-link"
        >
          Lihat riwayat
        </button>
      </div>

      {/* Info Lead */}
      <FormCard title="Info Lead" editing={editSection === 'info'} onToggleEdit={() => toggle('info')}>
        <TextField
          label="Nama"
          required
          value={lead.name}
          editing={editSection === 'info'}
          disabled={infoLocked}
          onChange={(e) => pipelineStore.setName(lead.id, e.target.value)}
          placeholder="Nama calon mitra"
        />
        <TextField
          label="No. HP"
          required
          inputMode="tel"
          value={lead.phone}
          editing={editSection === 'info'}
          disabled={infoLocked}
          onChange={(e) => pipelineStore.setPhone(lead.id, e.target.value)}
          placeholder="08xx-xxxx-xxxx"
        />
        <SelectField
          label="Alamat"
          value={lead.address || undefined}
          placeholder="Isi alamat"
          readOnly={editSection !== 'info' || infoLocked}
          onClick={() => setSheet('address')}
          description={lead.mapsCoord ? (
                <span className="text-green-600">Lokasi sudah ditandai di peta</span>
              ) : undefined}
        />
        <SelectField
          label="KTP"
          required
          value={lead.nik || undefined}
          placeholder="Lengkapi KTP"
          readOnly={editSection !== 'info' || !worked}
          onClick={() => setSheet('ktp')}
        />
        <SelectField
          label="Sumber"
          value={sourceDetail(lead)}
          placeholder="Pilih sumber"
          readOnly={editSection !== 'info' || !worked}
          onClick={() => setSheet('source')}
        />
        {/* Petugas — the BM axis: who works this lead. */}
        <SelectField
          label="Petugas"
          value={assigneeName(lead.assignedTo)}
          placeholder="Pilih petugas"
          readOnly={editSection !== 'info'}
          onClick={() => setSheet('assignee')}
        />
      </FormCard>

      {/* Detail Pengajuan */}
      <FormCard
        title="Detail Pengajuan"
        editing={editSection === 'pengajuan'}
        onToggleEdit={() => toggle('pengajuan')}
      >
        <SelectField
          label="Majelis"
          required
          value={lead.majelis.kind === 'none' ? undefined : majelisDetail(lead)}
          placeholder="Pilih majelis"
          readOnly={editSection !== 'pengajuan'}
          onClick={() => setSheet('majelis')}
        />
        <SelectField
          label="Status anggota"
          required
          value={MEMBER_ROLE_LABEL[role]}
          placeholder="Pilih status"
          readOnly={editSection !== 'pengajuan'}
          onClick={() => setSheet('role')}
        />
        <SelectField
          label="Produk"
          required
          value={lead.product ?? undefined}
          placeholder="Pilih produk"
          readOnly={editSection !== 'pengajuan'}
          onClick={() => setSheet('product')}
        />
      </FormCard>

      {worked ? (
        <StickyBar>
          <Button size="lg" className="w-full" disabled={!canInvite} onClick={() => setSheet('ajukan')}>
            Ajukan Pinjaman
          </Button>
        </StickyBar>
      ) : lead.status === 'waiting-kyc' ? (
        <StickyBar>
          <Button size="lg" className="w-full" onClick={() => setSheet('pandu')}>
            Takeover Pengajuan
          </Button>
          <span className="text-center text-12 text-caption">Pandu calon mitra KYC via APartner</span>
        </StickyBar>
      ) : null}

      {/* Ajukan Pinjaman — how the calon mitra completes the pengajuan. */}
      <BottomSheet open={sheet === 'ajukan'} onClose={() => setSheet(null)} title="Ajukan Pinjaman">
        <div className="flex flex-col gap-8">
          <button
            type="button"
            disabled={isNewMajelis}
            onClick={() => {
              pipelineStore.invite(lead.id)
              setSheet(null)
            }}
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
            onClick={() => setSheet('pandu')}
            className="flex flex-col gap-2 rounded-12 border border-default bg-neutral-white p-16 text-left"
          >
            <span className="text-14 font-bold text-default">Ajukan langsung via APartner</span>
            <span className="text-12 text-caption">Bantu mitra lakukan pengajuan</span>
          </button>
        </div>
      </BottomSheet>

      {/* Pandu calon Mitra — the guided flow. Blank for now. */}
      <BottomSheet open={sheet === 'pandu'} onClose={() => setSheet(null)} size="fullscreen" title="Pandu Calon Mitra">
        <span className="text-14 text-caption">Alur pandu akan dibuat di sini.</span>
      </BottomSheet>

      {/* Status anggota picker. Ketua only for a majelis being formed. */}
      <BottomSheet open={sheet === 'role'} onClose={() => setSheet(null)} title="Status anggota">
        <div className="flex flex-col gap-8">
          <SelectableCard
            name="role"
            inputType="radio"
            title={MEMBER_ROLE_LABEL.anggota}
            checked={role === 'anggota'}
            onChange={() => {
              pipelineStore.setRole(lead.id, 'anggota')
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
              pipelineStore.setRole(lead.id, 'ketua')
              setSheet(null)
            }}
          />
        </div>
      </BottomSheet>

      {/* Produk picker. */}
      <BottomSheet open={sheet === 'product'} onClose={() => setSheet(null)} title="Produk">
        <div className="flex flex-col gap-8">
          {(['GL', 'Modal'] as Product[]).map((p) => (
            <SelectableCard
              key={p}
              name="product"
              inputType="radio"
              title={p}
              checked={lead.product === p}
              onChange={() => {
                pipelineStore.setProduct(lead.id, p)
                setSheet(null)
              }}
            />
          ))}
        </div>
      </BottomSheet>

      <RiwayatSheet lead={lead} open={sheet === 'riwayat'} onClose={() => setSheet(null)} />

      <SourceSheet
        open={sheet === 'source'}
        onClose={() => setSheet(null)}
        onDone={(data) => {
          pipelineStore.setSource(lead.id, data)
          setSheet(null)
        }}
      />
      <AssigneePickerSheet
        open={sheet === 'assignee'}
        value={lead.assignedTo}
        onClose={() => setSheet(null)}
        onPick={(assignedTo) => {
          pipelineStore.assignLead(lead.id, assignedTo)
          setSheet(null)
        }}
      />
      <MajelisPickerSheet
        open={sheet === 'majelis'}
        value={lead.majelis}
        onClose={() => setSheet(null)}
        onPick={(m) => {
          pipelineStore.assignMajelis(lead.id, m)
          setSheet(null)
        }}
      />
      <KtpSheet
        open={sheet === 'ktp'}
        nik={lead.nik}
        ktp={lead.ktp}
        onClose={() => setSheet(null)}
        onSave={(nik, ktp) => {
          pipelineStore.updateKtp(lead.id, nik, ktp)
          setSheet(null)
        }}
      />
      <AddressSheet
        key={sheet === 'address' ? 'addr-open' : 'addr-closed'}
        open={sheet === 'address'}
        address={lead.address ?? ''}
        mapsCoord={lead.mapsCoord ?? ''}
        onClose={() => setSheet(null)}
        onSave={(address, mapsCoord) => {
          pipelineStore.setAddress(lead.id, address, mapsCoord)
          setSheet(null)
        }}
      />
      <PerbaruiStatusSheet
        lead={lead}
        open={sheet === 'interest'}
        onClose={() => setSheet(null)}
        onSaved={() => setSheet(null)}
      />
    </AppScreen>
  )
}
