'use client'

// The Modal onboarding first page, reached from the home Modal card. Like the
// Beranda, it carries the loan-lifecycle states on its switcher and reshapes
// per stage: early on it's you + the Ketua with a "Lengkapi Data" CTA; once
// submitted the full 5-mitra majelis shows with per-member status (reference:
// image 3). The mitra is always an Anggota (not the Ketua).

import { type ReactNode } from 'react'
import { Badge, Button, Card, ListRow } from '@/design-system/components'
import { ArrowLeft, FileDoc, Headset, Users } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction } from '../lib/ui'
import { useBankState, type ModalStage } from '../lib/store'
import { AVATAR_AGUSTIN, AVATAR_MUNIROH } from '../lib/avatars'

type Intent = 'blue' | 'red' | 'orange' | 'green'

function Avatar({ photo, initials }: { photo?: string; initials?: string }) {
  if (photo) {
    return (
      <span
        className="h-40 w-40 shrink-0 rounded-full bg-neutral-100 bg-cover bg-center"
        style={{ backgroundImage: `url("${photo}")` }}
        aria-hidden
      />
    )
  }
  return (
    <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-12 font-bold text-primary-500">
      {initials}
    </span>
  )
}

function MemberRow({ avatar, name, badges }: { avatar: ReactNode; name: string; badges?: ReactNode }) {
  return (
    <div className="flex items-center gap-12 py-8">
      {avatar}
      <span className="min-w-0 flex-1 text-14 font-bold text-default">{name}</span>
      {badges ? <span className="flex shrink-0 flex-wrap items-center justify-end gap-4">{badges}</span> : null}
    </div>
  )
}

interface StageUi {
  andaBadge: { label: string; intent: Intent }
  note: string
  cta?: { label: string; route: string }
  statusBadge?: { label: string; intent: Intent } // per-member badge, late stages
  full: boolean // 5 mitra vs 2
}

const STAGE: Record<ModalStage, StageUi> = {
  'belum-kyc': {
    andaBadge: { label: 'Lengkapi Data', intent: 'blue' },
    note: 'Pengajuan baru bisa diproses saat semua data sudah lengkap.',
    cta: { label: 'Lengkapi Data', route: 'modal-hub' },
    full: false,
  },
  'kyc-ongoing': {
    andaBadge: { label: 'Lengkapi Data', intent: 'blue' },
    note: 'Lanjutkan pengisian data Anda.',
    cta: { label: 'Lanjutkan', route: 'modal-hub' },
    full: false,
  },
  'kyc-gagal': {
    andaBadge: { label: 'Ditolak', intent: 'red' },
    note: 'Ada data yang perlu diperbaiki.',
    cta: { label: 'Perbaiki Data', route: 'modal-verify-failed' },
    full: false,
  },
  'kyc-diproses': {
    andaBadge: { label: 'Diproses', intent: 'orange' },
    note: 'Dokumen sedang diperiksa. Tunggu kabar, ya.',
    statusBadge: { label: 'Diproses', intent: 'orange' },
    full: true,
  },
  'kyc-berhasil': {
    andaBadge: { label: 'Terverifikasi', intent: 'green' },
    note: 'Semua data terverifikasi. Modal siap dicairkan.',
    cta: { label: 'Lihat Modal', route: 'modal-disbursement' },
    statusBadge: { label: 'Terverifikasi', intent: 'green' },
    full: true,
  },
  dicairkan: {
    andaBadge: { label: 'Aktif', intent: 'green' },
    note: 'Majelis aktif. Modal sudah dicairkan.',
    cta: { label: 'Lihat Modal', route: 'modal-disbursement' },
    statusBadge: { label: 'Aktif', intent: 'green' },
    full: true,
  },
}

const OTHERS = [
  { name: 'Alen Kurnia', initials: 'AK' },
  { name: 'Arin Nita', initials: 'AN' },
  { name: 'Suyamti', initials: 'SY' },
]

export function ModalMajelisScreen() {
  const flow = useFlow()
  const { modalStage } = useBankState()
  const ui = STAGE[modalStage]
  const ketuaBadge = <Badge intent="neutral" variant="outline" size="sm">Ketua Majelis</Badge>
  const stat = ui.statusBadge
  const statBadge = stat ? <Badge intent={stat.intent} size="sm">{stat.label}</Badge> : null

  return (
    <Screen
      statusBar="none"
      canvas="white"
      chromeClassName="bg-blue-500"
      topBar={
        <div className="flex h-48 items-center gap-12 px-16 text-neutral-white">
          <button type="button" onClick={flow.back} aria-label="Kembali" className="flex">
            <ArrowLeft size={24} />
          </button>
          <span className="text-16 font-bold">Majelis Anda</span>
        </div>
      }
    >
      <Card>
        <div className="flex items-center justify-between">
          <span className="text-14 font-bold text-default">Anggota majelis</span>
          <span className="text-12 text-caption">{ui.full ? '5 Mitra' : '2 Mitra'}</span>
        </div>

        <p className="mt-12 text-12 text-caption">Anda</p>
        <MemberRow
          avatar={<Avatar photo={AVATAR_AGUSTIN} />}
          name="Agustin Juliyanto"
          badges={<Badge intent={ui.andaBadge.intent} size="sm">{ui.andaBadge.label}</Badge>}
        />
        <p className="mt-4 text-12 text-default">{ui.note}</p>
        {ui.cta ? (
          <div className="mt-12">
            <Button variant="primary" size="md" className="w-full" onClick={() => flow.go(ui.cta!.route)}>
              {ui.cta.label}
            </Button>
          </div>
        ) : null}

        <p className="mt-16 text-12 text-caption">{ui.full ? 'Anggota lainnya' : 'Anggota majelis'}</p>
        <MemberRow
          avatar={<Avatar photo={AVATAR_MUNIROH} />}
          name="Muniroh"
          badges={
            <>
              {statBadge}
              {ketuaBadge}
            </>
          }
        />
        {ui.full
          ? OTHERS.map((m) => (
              <MemberRow key={m.name} avatar={<Avatar initials={m.initials} />} name={m.name} badges={statBadge} />
            ))
          : null}
      </Card>

      <Card flush>
        <ListRow
          title="Info majelis"
          description="058_Lubuk_Sikarah_Digital"
          leading={<span className="text-primary-500"><Users size={24} /></span>}
          chevron
          onClick={() => {}}
          className="border-b border-default"
        />
        <ListRow
          title="Tentang Modal"
          description="Keuntungan dan cara kerja Modal"
          leading={<span className="text-primary-500"><FileDoc size={24} /></span>}
          chevron
          onClick={() => {}}
        />
      </Card>

      <Card flush>
        <ListRow
          title="Amartha Care"
          leading={<span className="text-primary-500"><Headset size={24} /></span>}
          chevron
          onClick={() => {}}
        />
      </Card>

      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" disabled>
          Aktifkan Majelis
        </Button>
      </BottomAction>
    </Screen>
  )
}
