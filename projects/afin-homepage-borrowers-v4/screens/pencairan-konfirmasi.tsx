'use client'

// Konfirmasi pencairan — Figma node 2910:142584 ("Confirmation").

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { CheckCircleFill, ChevronDown } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ASSET, CheckboxMark, DetailRow, PENCAIRAN } from '../lib/pencairan-ui'
import { usePencairanLanjutan } from '../lib/store'

export function PencairanKonfirmasiScreen() {
  const flow = useFlow()
  const [agreed, setAgreed] = useState(true)
  const p = PENCAIRAN[usePencairanLanjutan() ? 'lanjutan' : 'awal']

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Konfirmasi pencairan" onBack={flow.back} />}>
      <div className="-mx-16 -mt-16 flex flex-1 flex-col">
        <div className="overflow-hidden rounded-b-24 bg-neutral-white">
          <div
            className="flex flex-col gap-12 p-16"
            style={{ backgroundImage: 'linear-gradient(to left, #F3F6FD 20.7%, #FFFFFF)' }}
          >
            <p className="text-14 font-bold text-default">Jaga keluarga, usaha lebih tenang</p>

            <div className="overflow-hidden rounded-16 border border-primary-500 bg-neutral-white">
              <div className="flex items-start gap-20 px-16 py-12">
                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex h-24 items-center gap-8">
                    <span className="flex h-24 w-24 shrink-0 items-center justify-center">
                      <img src={`${ASSET}/proteksi-keluarga.svg`} alt="" />
                    </span>
                    <p className="flex-1 text-14 font-bold text-default">Proteksi Keluarga 12 Bulan</p>
                  </div>
                  <p className="text-12 text-caption">
                    Santunan hingga <span className="font-bold">Rp9 juta/orang</span>
                    <br />
                    untuk <span className="font-bold">6 anggota keluarga</span>.
                  </p>
                  <p className="flex items-end gap-4">
                    <span className="text-14 text-link">Rp200.000</span>
                    <span className="text-12 text-placeholder line-through">Rp240.000</span>
                  </p>
                </div>
                <span className="flex h-24 items-center">
                  <CheckboxMark checked />
                </span>
              </div>
              <div className="flex items-center gap-8 bg-neutral-50 px-16 py-12">
                <div className="flex flex-1 flex-col">
                  <p className="text-12 text-caption">Anggota keluarga</p>
                  <p className="flex items-center gap-4">
                    <CheckCircleFill size={16} className="text-green-500" />
                    <span className="text-12 font-bold text-default">6 orang</span>
                  </p>
                </div>
                <Button variant="secondary" size="sm">
                  Ubah
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-16 border border-default bg-neutral-white">
              <div className="flex items-start gap-20 px-16 py-12">
                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex h-24 items-center gap-8">
                    <span className="flex h-24 w-24 shrink-0 items-center justify-center">
                      <img src={`${ASSET}/celengan-logo.svg`} alt="" style={{ width: 20, height: 'auto' }} />
                    </span>
                    <p className="flex-1 text-14 font-bold text-default">Isi Celengan Rp100 ribu</p>
                  </div>
                  <p className="text-12 text-caption">
                    Dapatkan keuntungan <span className="font-bold">5% per tahun</span>
                  </p>
                  <p className="text-14 text-default">Rp100.000</p>
                </div>
                <span className="flex h-24 items-center">
                  <img src={`${ASSET}/plus-icon.svg`} alt="Tambah" />
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-12 px-16 py-20">
            <p className="text-14 font-bold text-default">Detail pencairan</p>
            <div className="flex flex-col gap-12 rounded-16 border border-default bg-neutral-white p-16">
              <div className="flex flex-col gap-8">
                <DetailRow label="Pokok pinjaman" value={p.nominal} />
                <DetailRow label="Proteksi Keluarga 12 Bulan" value="-Rp200.000" />
                <DetailRow label="Biaya admin" value="-Rp5.000" />
                <div className="flex items-center gap-8 font-bold">
                  <p className="flex-1 text-14 text-default">Anda terima</p>
                  <p className="flex-1 text-right text-16 text-link">{p.terima}</p>
                </div>
                <div className="border-t border-dashed border-default" />
                <div className="flex items-start gap-8">
                  <div className="flex flex-1 flex-col">
                    <p className="text-14 font-bold text-default">Angsuran</p>
                    <p className="text-12 text-caption">48x pembayaran</p>
                  </div>
                  <div className="flex flex-1 flex-col text-right">
                    <p className="text-14 font-bold text-default">{p.tenors[0].weekly}</p>
                    <p className="text-12 text-caption">/minggu</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <span className="flex items-center justify-center gap-4">
                  Lihat semua <ChevronDown size={16} />
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 mt-auto border-t border-default bg-neutral-white">
          <div className="px-20 pt-12">
            <button type="button" onClick={() => setAgreed((a) => !a)} className="flex items-start gap-8 py-4 text-left">
              <CheckboxMark checked={agreed} />
              <p className="flex-1 text-12 text-default">
                Saya menyetujui seluruh ketentuan dan perjanjian pada{' '}
                <span className="text-link">Syarat-Syarat Umum Perjanjian Pendanaan</span> dan{' '}
                <span className="text-link">Dokumen Akad</span>.
              </p>
            </button>
          </div>
          <div className="px-20 pb-24 pt-12">
            <Button
              variant="primary"
              className="w-full"
              disabled={!agreed}
              onClick={() => flow.go('pencairan-diproses')}
            >
              Kirim Pengajuan
            </Button>
          </div>
        </div>
      </div>
    </Screen>
  )
}
