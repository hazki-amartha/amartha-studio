'use client'

// Detail Lead — a prospect's record, reached from the Sales roster.
//
// The header carries who she is (name) with where she is (status + sub-state)
// under it, and WhatsApp / call at the right. Below, a form-style stack: the
// "action selanjutnya" box (history one tap inside it), then Info Pribadi and
// Detail Pengajuan, each field edited in place via "Ubah". One action drives the
// page — "Perbarui Lead" — a choice between inviting her as a calon mitra (the
// pengajuan, once her data is complete) or recording how interested she is now.

import { useState, type ReactNode } from 'react'
import {
  Badge,
  BottomSheet,
  Button,
  Card,
  NavigationHeader,
  SelectableCard,
} from '@/design-system/components'
import { WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import {
  DetailRow,
  EditContactSheet,
  INTEREST_TEXT,
  KtpSheet,
  MajelisPickerSheet,
  PerbaruiStatusSheet,
  RiwayatSheet,
  SourceSheet,
} from '../lib/pipeline-ui'
import { AppScreen, ContactButton } from '../lib/ui'
import { StickyBar } from '../lib/ui'
import { IconPhone } from '../lib/icons'
import {
  INTEREST_META,
  MEMBER_ROLE_LABEL,
  actionDetail,
  hasInterest,
  ktpDetail,
  majelisDetail,
  sourceDetail,
  statusBadge,
  subStateTag,
  type MemberRole,
  type Product,
} from '../lib/pipeline'

type SheetId =
  | 'contact'
  | 'source'
  | 'majelis'
  | 'role'
  | 'product'
  | 'ktp'
  | 'perbarui'
  | 'interest'
  | 'riwayat'
  | null

function FormCard({
  title,
  subtitle,
  children,
}: {
  title: string
  /** A prompt shown under the title while the section is incomplete. */
  subtitle?: string
  children: ReactNode
}) {
  return (
    <Card>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <span className="text-14 font-bold text-default">{title}</span>
          {subtitle ? <span className="text-12 text-caption">{subtitle}</span> : null}
        </div>
        <div className="flex flex-col">{children}</div>
      </div>
    </Card>
  )
}

export function LeadDetailScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [sheet, setSheet] = useState<SheetId>(null)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Detail Lead" onBack={() => flow.back()} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const worked = hasInterest(lead.status)
  const badge = statusBadge(lead)
  const interest = worked && lead.interest ? lead.interest : null
  const sub = subStateTag(lead)
  const detail = actionDetail(lead)
  // The header sub-state: her interest while she is worked, the system stage
  // once she is Submitted.
  const headerSub = interest ? INTEREST_META[interest].label : sub
  const isNewMajelis = lead.majelis.kind === 'new'
  const role: MemberRole = isNewMajelis ? lead.role ?? 'anggota' : 'anggota'
  // Inviting her (the pengajuan) needs her data complete: KTP, a majelis, and a
  // product picked.
  const hasKtp = lead.nik.replace(/\D/g, '').length === 16
  const hasMajelis = lead.majelis.kind !== 'none'
  const canInvite = hasKtp && hasMajelis && Boolean(lead.product)

  return (
    <AppScreen
      topBar={
        // A custom header: the design-system NavigationHeader is a fixed 48px row
        // whose trailing slot clamps to 24px, so it can't hold a two-line
        // name+status title alongside the WA/call buttons. Same tokens, more room.
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
            <span className="flex items-center gap-4">
              <Badge intent={badge.intent} variant="outline" size="sm">
                {badge.label}
              </Badge>
              {headerSub ? (
                <span
                  className={`text-12 font-regular ${interest ? INTEREST_TEXT[interest] : 'text-caption'}`}
                >
                  {headerSub}
                </span>
              ) : null}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-8">
            <ContactButton label={`WhatsApp ${lead.name}`} tone="green" onClick={() => {}}>
              <WhatsappLogo size={20} />
            </ContactButton>
            <ContactButton label={`Telepon ${lead.name}`} tone="primary" onClick={() => {}}>
              <IconPhone size={20} />
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

      {/* Info Pribadi */}
      <FormCard
        title="Info Pribadi"
        subtitle={hasKtp ? undefined : 'Lengkapi untuk mengubah jadi qualified lead'}
      >
        <DetailRow label="Nama" value={lead.name} onEdit={() => setSheet('contact')} />
        <DetailRow label="No. HP" value={lead.phone} onEdit={() => setSheet('contact')} />
        <DetailRow
          label="Sumber"
          value={sourceDetail(lead)}
          onEdit={worked ? () => setSheet('source') : undefined}
        />
        <DetailRow
          label="KTP"
          value={ktpDetail(lead)}
          onEdit={worked ? () => setSheet('ktp') : undefined}
          warning={!lead.nik}
        />
      </FormCard>

      {/* Detail Pengajuan */}
      <FormCard
        title="Detail Pengajuan"
        subtitle={
          hasMajelis && lead.product ? undefined : 'Lengkapi untuk bisa mulai pengajuan'
        }
      >
        <DetailRow
          label="Majelis"
          value={majelisDetail(lead)}
          onEdit={() => setSheet('majelis')}
          warning={lead.majelis.kind === 'none'}
        />
        <DetailRow
          label="Status anggota"
          value={MEMBER_ROLE_LABEL[role]}
          onEdit={() => setSheet('role')}
        />
        <DetailRow
          label="Produk"
          value={lead.product ?? 'Belum dipilih'}
          onEdit={() => setSheet('product')}
          warning={!lead.product}
        />
      </FormCard>

      {/* The one action the page drives to — a choice of what to update. Offered
          while she is still the BP's to work; once Submitted it is system-led. */}
      {worked ? (
        <StickyBar>
          <Button size="lg" className="w-full" onClick={() => setSheet('perbarui')}>
            Perbarui Lead
          </Button>
        </StickyBar>
      ) : null}

      {/* Perbarui Lead — the choice of what to update. */}
      <BottomSheet open={sheet === 'perbarui'} onClose={() => setSheet(null)} title="Perbarui Lead">
        <div className="flex flex-col gap-8">
          <button
            type="button"
            disabled={!canInvite}
            onClick={() => {
              pipelineStore.invite(lead.id)
              setSheet(null)
            }}
            className={`flex flex-col gap-2 rounded-12 border p-16 text-left ${
              canInvite ? 'border-default bg-neutral-white' : 'border-default bg-neutral-50'
            }`}
          >
            <span className={`text-14 font-bold ${canInvite ? 'text-default' : 'text-disabled'}`}>
              Undang sebagai calon mitra
            </span>
            <span className="text-12 text-caption">
              {canInvite
                ? 'Mulai tahap pengajuan pinjaman'
                : 'Lengkapi KTP, majelis, dan produk dulu'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSheet('interest')}
            className="flex flex-col gap-2 rounded-12 border border-default bg-neutral-white p-16 text-left"
          >
            <span className="text-14 font-bold text-default">Update status ketertarikan</span>
            <span className="text-12 text-caption">Catat minat terbarunya</span>
          </button>
        </div>
      </BottomSheet>

      {/* Status anggota picker. Ketua is only offered for a majelis being formed. */}
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

      <EditContactSheet
        open={sheet === 'contact'}
        name={lead.name}
        phone={lead.phone}
        onClose={() => setSheet(null)}
        onSave={(name, phone) => {
          pipelineStore.updateContact(lead.id, name, phone)
          setSheet(null)
        }}
      />
      <SourceSheet
        open={sheet === 'source'}
        onClose={() => setSheet(null)}
        onDone={(data) => {
          pipelineStore.setSource(lead.id, data)
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
      <PerbaruiStatusSheet
        lead={lead}
        open={sheet === 'interest'}
        onClose={() => setSheet(null)}
        onSaved={() => setSheet(null)}
      />
    </AppScreen>
  )
}
