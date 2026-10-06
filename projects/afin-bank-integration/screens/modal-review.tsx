'use client'

// "Data pengajuan" — the full read-only review of everything the mitra entered,
// shown after "Cek Lagi". A consent checkbox gates the "Kirim Pengajuan" button,
// which opens the confirmation sheet. (Reference: images 6 & 7.)

import { type ReactNode, useState } from 'react'
import { Button, Card, NavigationHeader } from '@/design-system/components'
import { Check, ChevronDown, FileDoc, House, IdentificationCard, Storefront } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, DataRow, KtpArt } from '../lib/ui'
import { PhotoArt } from '../lib/modal'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <p className="mb-4 text-16 font-bold text-default">{title}</p>
      {children}
    </Card>
  )
}

export function ModalReviewScreen() {
  const flow = useFlow()
  const [agree, setAgree] = useState(false)

  return (
    <Screen
      topBar={<NavigationHeader title="Data pengajuan" onBack={flow.back} link="Butuh bantuan?" onLinkClick={() => {}} />}
    >
      <Section title="KTP Anda">
        <KtpArt />
        <button type="button" className="mt-12 flex w-full items-center justify-center gap-4 text-14 font-bold text-link">
          Lihat detail <ChevronDown size={16} />
        </button>
      </Section>

      <Section title="Data bank">
        <DataRow label="Nama bank" value="Bank Central Asia (BCA)" />
        <DataRow label="Nomor rekening" value="8770333397" />
        <DataRow label="Pemilik rekening" value="Anik Susilowati" />
      </Section>

      <Section title="Data penanggung jawab">
        <DataRow label="Nama lengkap sesuai KTP" value="Haryono Nurhan" />
        <DataRow label="NIK" value="3312675887970099" />
        <DataRow label="Tempat lahir" value="Surabaya" />
        <DataRow label="Hubungan" value="Suami" />
        <DataRow label="Nomor HP penanggung jawab" value="+62 8123456789" />
        <DataRow label="Pendapatan per bulan" value="Rp2.500.000" />
        <DataRow label="Alamat" value="Jl. TB Simatupang No.18" />
        <DataRow
          label="Provinsi, kota/kabupaten, kecamatan, kelurahan"
          value="Cilandak Barat, Kota Jakarta Selatan, DKI Jakarta 12430"
        />
      </Section>

      <Section title="Foto rumah tinggal">
        <DataRow label="Isi nomor Kartu Keluarga" value="1234567890123456" />
        <DataRow label="Foto kartu keluarga" value={<PhotoArt icon={<FileDoc size={24} />} tone="green" />} />
      </Section>

      <Section title="Data domisili">
        <DataRow label="Alamat" value="Jl. Cilandak No.188" />
        <DataRow label="RT/RW" value="002 / 001" />
        <DataRow
          label="Provinsi, kota/kabupaten, kecamatan, kelurahan"
          value="Cilandak Barat, Kota Jakarta Selatan, DKI Jakarta 12430"
        />
        <DataRow label="Foto rumah tinggal Anda" value={<PhotoArt icon={<House size={24} />} tone="orange" />} />
      </Section>

      <Section title="Data usaha">
        <DataRow label="Bidang" value="Industri Rumah Tangga" />
        <DataRow label="Jenis" value="Makanan Kecil" />
        <DataRow label="Umur usaha" value="1 tahun" />
        <DataRow label="Pengeluaran per bulan" value="Rp301.000 - Rp500.000" />
        <DataRow label="Pendapatan per bulan" value="Rp2.500.000" />
        <DataRow label="Penghasilan lainnya per bulan (jika ada)" value="Tidak Ada" />
        <DataRow label="Alamat" value="Jl. TB Simatupang No.18" />
        <DataRow label="RT/RW" value="002 / 001" />
        <DataRow label="Foto usaha" value={<PhotoArt icon={<Storefront size={24} />} tone="orange" />} />
      </Section>

      <button type="button" onClick={() => setAgree((a) => !a)} className="flex items-start gap-12 px-4 text-left">
        <span
          className={`mt-2 flex h-20 w-20 shrink-0 items-center justify-center rounded-4 border ${
            agree ? 'border-primary-500 bg-primary-500 text-neutral-white' : 'border-default bg-neutral-white'
          }`}
        >
          {agree ? <Check size={16} /> : null}
        </span>
        <span className="text-12 text-default">
          Saya mengizinkan Amartha Mikro Fintek untuk mengakses data pribadi saya, antara lain: nama, data
          kependudukan, dan data verifikasi AmarthaFin.
        </span>
      </button>

      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" disabled={!agree} onClick={() => flow.go('modal-confirm')}>
          Kirim Pengajuan
        </Button>
      </BottomAction>
    </Screen>
  )
}
