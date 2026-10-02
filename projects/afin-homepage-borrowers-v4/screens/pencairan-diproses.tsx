'use client'

// Pencairan sedang diproses — Figma node 2910:142635 ("Pencairan Diproses").

import type { ReactNode } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { ChevronDown, ChevronRight } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ASSET, DetailRow, PENCAIRAN } from '../lib/pencairan-ui'
import { getHomePath, usePencairanLanjutan } from '../lib/store'

// Celengan card hidden for now — "Isi Celengan" isn't ticked on Konfirmasi, so
// nothing was bought. Flip to show it again.
const SHOW_CELENGAN = false

const CARD_SHADOW = { boxShadow: '0 2px 4px rgba(226, 223, 226, 0.6)' }

function Benefit({
  emoji,
  caption,
  title,
  intro,
  steps,
}: {
  emoji: string
  caption: string
  title: string
  intro: string
  steps: string[]
}) {
  return (
    <div className="flex flex-col gap-16">
      <div className="flex items-start gap-12">
        <img src={`${ASSET}/${emoji}`} alt="" width={32} height={32} className="shrink-0" />
        <div className="flex flex-1 flex-col text-default">
          <p className="text-12">{caption}</p>
          <p className="text-14 font-bold">{title}</p>
        </div>
      </div>
      <div className="text-14 text-default">
        <p>{intro}</p>
        <ul className="list-disc pl-20">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function InfoCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-16 rounded-12 bg-neutral-white p-16" style={CARD_SHADOW}>
      {children}
    </div>
  )
}

export function PencairanDiprosesScreen() {
  const flow = useFlow()
  const p = PENCAIRAN[usePencairanLanjutan() ? 'lanjutan' : 'awal']

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Ajukan pencairan" onBack={() => flow.go(getHomePath() === 'b' ? 'home-b' : 'home-var-d')} />}>
      <div className="-mx-16 -mt-16 flex flex-1 flex-col">
        <div className="flex flex-col items-center gap-12 px-20 pb-20 pt-24">
          <img src={`${ASSET}/pencairan-diproses.svg`} alt="" width={200} height={112} />
          <div className="flex flex-col gap-4 text-center text-default">
            <p className="text-18 font-bold">Pencairan sedang diproses</p>
            <p className="text-14">Dana akan Anda terima dalam 1 hari kerja.</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-16 bg-neutral-50 px-12 py-16">
          <div
            className="relative flex flex-col gap-16 overflow-hidden rounded-16 bg-neutral-white p-16"
            style={{ boxShadow: '0 2px 5px rgba(108, 114, 124, 0.16)' }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute overflow-hidden"
              style={{ width: 166.5, height: 280, right: -71, top: -159, filter: 'blur(25px)' }}
            >
              <img
                src={`${ASSET}/card-glow.png`}
                alt=""
                className="absolute max-w-none"
                style={{ height: '185.79%', width: '677.45%', left: '-81.97%', top: '-32.7%' }}
              />
            </div>
            <div className="relative flex flex-col gap-12 text-default">
              <p className="text-16 font-bold">Mau naik limit dan dapat limit tambahan?</p>
              <p className="text-14">
                Bayar tepat waktu, hadiri kumpulan, dan jaga kelancaran majelis selama 48 minggu!
              </p>
            </div>
            <div className="border-t border-default" />
            <Benefit
              emoji="emoji-party.svg"
              caption="Keuntungan jaga kelancaran Anda"
              title="Potensi naik limit ke Rp6 – 8 jt"
              intro="Perlu Anda lakukan:"
              steps={['Bayar angsuran tepat waktu', 'Hadiri kumpulan setiap minggunya', 'Lakukan selama 48 minggu']}
            />
            <div className="border-t border-default" />
            <Benefit
              emoji="emoji-gift.svg"
              caption="Keuntungan jaga kelancaran majelis"
              title="3x limit tambahan s.d. Rp1 jt"
              intro="Perlu dilakukan bersama anggota lainnya:"
              steps={['Jaga konsistensi pembayaran kumpulan', 'Lakukan selama 36 minggu']}
            />
          </div>

          <InfoCard>
            <div className="flex flex-col gap-16">
              <div className="flex flex-col gap-4 text-default">
                <p className="text-14">Anda akan terima</p>
                <p className="text-20 font-bold">{p.terima}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <span className="flex items-center justify-center gap-4">
                  Lihat detail <ChevronDown size={16} />
                </span>
              </Button>
            </div>
            <div className="border-t border-default" />
            <div className="flex flex-col gap-8">
              <DetailRow label="Jangka waktu" value="12 bulan" />
              <DetailRow label="Angsuran mingguan" value="Rp275.000" />
              <DetailRow label="Margin" value="Rp275.000" />
              <DetailRow label="Total tagihan" value="Rp5.275.000" />
              <DetailRow label="ID Pinjaman" value="331309" />
              <DetailRow label="Karyawan Amartha" value="Aulia Rachmawati" />
              <DetailRow label="ID Karyawan" value="2101231" />
            </div>
            <div className="border-t border-default" />
            <div className="flex flex-col gap-8">
              <p className="text-14 font-bold text-default">Dokumen pinjaman</p>
              {['Syarat-Syarat Umum Perjanjian', 'Perjanjian Akad'].map((doc) => (
                <div key={doc} className="flex items-center gap-8 py-8">
                  <p className="flex-1 text-12 text-caption">{doc}</p>
                  <Button variant="secondary" size="xs">
                    Lihat Dokumen
                  </Button>
                </div>
              ))}
            </div>
          </InfoCard>

          <InfoCard>
            <div className="flex items-center gap-8">
              <p className="flex-1 text-14 font-bold text-default">Proteksi Keluarga</p>
              <Button variant="secondary" size="xs">
                Lihat Proteksi
              </Button>
            </div>
            <div className="flex flex-col gap-8">
              <DetailRow size={12} label="Status proteksi" value="Diproses" />
              <DetailRow size={12} label="Masa proteksi" value="12 bulan" />
              <DetailRow size={12} label="Premi" value="Rp200.000" />
            </div>
          </InfoCard>

          {SHOW_CELENGAN ? (
            <InfoCard>
              <p className="text-14 font-bold text-default">Celengan Ibu Siti</p>
              <div className="flex flex-col gap-8">
                <DetailRow size={12} label="Status pembelian" value="Diproses" />
                <DetailRow size={12} label="Nominal pembelian" value="Rp100.000" />
                <DetailRow size={12} label="Dapat dicairkan setelah" value="1 bulan" />
              </div>
            </InfoCard>
          ) : null}
        </div>

        <button type="button" className="flex items-center gap-12 bg-neutral-white px-20 py-16 text-left">
          <img src={`${ASSET}/amartha-care.png`} alt="" width={40} height={40} className="shrink-0" />
          <p className="flex-1 text-14 font-bold text-default">Hubungi Amartha Care</p>
          <ChevronRight size={24} className="text-primary-500" />
        </button>
      </div>
    </Screen>
  )
}
