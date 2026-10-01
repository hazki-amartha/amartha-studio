'use client'

// Majelis Anda — Figma section 2984:38210 ("Majelis detail page"). Opened
// from "Lihat status majelis" on the Bonus majelis page, in that page's
// status: Lancar (everyone on track), Tidak Lancar (5 members behind, with
// Ingatkan actions) or Belum mulai (payments haven't started).

import { Fragment, type ReactNode } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { ChevronRight, File, Headphones, Plus, User, Users } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MajelisStatusLabel } from '../lib/bonus-majelis'
import { Banner } from '../lib/progress-card'
import { useHomeVarD, useMajelisView } from '../lib/store'

const ASSET = '/prototypes/afin-homepage-borrowers-v4'

// Nine members as in the Figma; `late` are the five who fall behind in the
// Tidak Lancar state.
const MEMBERS = [
  { name: 'Agustin Juliyanto', photo: 'avatar-agustin.png', late: false },
  { name: 'Arin Nita', late: true },
  { name: 'Suyamti', late: true },
  { name: 'Alen Kurnia', photo: 'avatar-alen.png', late: false },
  { name: 'Suyamti', late: true },
  { name: 'Alen Kurnia', photo: 'avatar-alen.png', late: false },
  { name: 'Suyamti', late: true },
  { name: 'Suyamti', late: true },
  { name: 'Alen Kurnia', photo: 'avatar-alen.png', late: false },
]

function MemberLabel({ late }: { late: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-4 border px-8 py-2 text-12 font-bold ${
        late ? 'border-red-500 bg-red-50 text-red-700' : 'border-green-600 bg-green-50 text-green-700'
      }`}
    >
      {late ? 'Tidak Lancar' : 'Lancar'}
    </span>
  )
}

function Avatar({ photo }: { photo?: string }) {
  return photo ? (
    <img src={`${ASSET}/${photo}`} alt="" width={40} height={40} className="shrink-0 rounded-full" />
  ) : (
    <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
      <User size={24} />
    </span>
  )
}

/** Hairline that starts under the member's name, past the avatar. */
function RowDivider() {
  return (
    <div className="pl-48">
      <div className="ml-16 border-t border-default" />
    </div>
  )
}

function Todo({ icon, text, action }: { icon: string; text: string; action?: boolean }) {
  return (
    <div className="flex items-center gap-8">
      <img src={`${ASSET}/${icon}.svg`} alt="" className="shrink-0" />
      <p className="flex-1 text-14 text-default">{text}</p>
      {action ? (
        <Button variant="secondary" size="xs">
          Ingatkan
        </Button>
      ) : null}
    </div>
  )
}

function InfoRow({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <button type="button" className="flex w-full items-center gap-32 px-12 text-left">
      <span className="shrink-0 text-default">{icon}</span>
      <span className="flex flex-1 flex-col gap-4">
        <span className="text-14 text-default">{title}</span>
        {subtitle ? <span className="text-12 text-caption">{subtitle}</span> : null}
      </span>
      <ChevronRight size={20} className="shrink-0 text-default" />
    </button>
  )
}

export function MajelisAndaScreen() {
  const flow = useFlow()
  const status = useMajelisView()
  const behind = status === 'tidak'
  // Tidak Lancar mirrors the homepage Majelis banner for this Minggu — "Karena
  // Anda tidak bayar…" when it's her own late payment (A), "Status turun!…"
  // when other members fell behind (B).
  const { majelis } = useHomeVarD()
  const atRisk = majelis.kind === 'progress' && majelis.data.tone !== 'success' && majelis.data.tone !== 'neutral'
  const riskBanner = atRisk
    ? majelis.data
    : {
        tone: 'warning' as const,
        bannerTitle: 'Bonus berpotensi hangus',
        bannerDescription: 'Karena Anda tidak bayar angsuran, 1 majelis berpotensi tidak dapat bonus.',
      }

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Majelis Anda" onBack={flow.back} />}>
      <div className="flex flex-col gap-16 pb-16">
        <div className="flex flex-col gap-16 rounded-12 border border-default bg-neutral-white p-12">
          <div className="flex items-center gap-12">
            <p className="flex-1 text-16 font-bold text-default">Status majelis</p>
            <MajelisStatusLabel status={status} />
          </div>
          {status === 'lancar' ? (
            <div className="flex items-center gap-12 rounded-8 bg-green-50 p-12">
              <img src={`${ASSET}/check-fat.svg`} alt="" width={20} height={20} className="shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <p className="text-14 font-bold text-default">Anda berpotensi mendapat hadiah</p>
                <p className="text-12 text-neutral-700">Pastikan semua anggota membayar dengan lancar.</p>
              </div>
            </div>
          ) : status === 'tidak' ? (
            <Banner tone={riskBanner.tone} title={riskBanner.bannerTitle} description={riskBanner.bannerDescription} />
          ) : (
            <Banner
              tone="neutral"
              title="Pembayaran belum dimulai"
              description="Anda baru saja mencairkan Modal. Pembayaran akan dimulai 1 Sep 2026."
            />
          )}
        </div>

        <div className="flex flex-col gap-16 rounded-12 border border-default bg-neutral-white p-12">
          <p className="text-16 font-bold text-default">Perlu Anda lakukan</p>
          {behind ? (
            <>
              <Todo icon="emoji-money" text="Ingatkan jadwal kumpulan" action />
              <Todo icon="emoji-raise-hand" text="Ingatkan Ibu Arin, Suyamti, dan 3 lainnya untuk bayar." action />
            </>
          ) : (
            <>
              <Todo icon="emoji-money" text="Jaga konsistensi pembayaran kumpulan" />
              <Todo icon="emoji-raise-hand" text="Hadir kumpulan setiap minggu" />
              <Todo icon="emoji-timer" text="Lakukan selama 48 minggu" />
            </>
          )}
        </div>

        <div className="overflow-hidden rounded-16 border border-default bg-neutral-white">
          <div className="flex items-center justify-between border-b border-default px-12 py-12 text-14 text-default">
            <p className="font-bold">Anggota majelis</p>
            <p>5 mitra</p>
          </div>
          <p className="bg-neutral-50 px-12 py-4 text-12 text-caption">Anda</p>
          <div className="flex items-center gap-12 px-12 py-12">
            <Avatar photo="avatar-muniroh.png" />
            <div className="flex flex-col items-start gap-8">
              <p className="text-14 text-default">Muniroh</p>
              <span className="rounded-full border border-neutral-600 bg-neutral-50 px-4 text-10 font-bold text-caption">
                Ketua
              </span>
            </div>
          </div>
          <p className="bg-neutral-50 px-12 py-4 text-12 text-caption">Anggota</p>
          <div className="flex flex-col gap-16 py-16">
            <div className="flex items-center gap-12 px-12">
              <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-default">
                <Plus size={24} />
              </span>
              <p className="text-14 text-default">Undang anggota</p>
            </div>
            {MEMBERS.map((m, i) => (
              <Fragment key={i}>
                <RowDivider />
                <div className="flex items-center gap-12 px-12">
                  <Avatar photo={m.photo} />
                  <div className="flex flex-1 flex-col gap-2">
                    <p className="text-14 text-default">{m.name}</p>
                    <p className="text-12 text-caption">+62 818223344</p>
                  </div>
                  <MemberLabel late={behind && m.late} />
                </div>
              </Fragment>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-16 rounded-16 border border-default bg-neutral-white py-16">
          <InfoRow icon={<Users size={20} />} title="Info majelis" subtitle="058_Lubuk_Sikarah_Digital" />
          <RowDivider />
          <InfoRow icon={<File size={20} />} title="Tentang Modal" subtitle="Keuntungan dan cara kerja Modal." />
        </div>

        <div className="rounded-16 border border-default bg-neutral-white py-16">
          <InfoRow icon={<Headphones size={20} />} title="AmarthaCare" />
        </div>
      </div>
    </Screen>
  )
}
