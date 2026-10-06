'use client'

// Konfirmasi pencairan — the disbursement confirmation: optional add-ons
// (Proteksi Keluarga, Celengan) and the pencairan breakdown. "Lanjut ke
// Persetujuan" moves on to the akad photo upload (disbursement-akad.tsx) —
// "Kirim Pengajuan" itself lives on that page, once the akad's documented.

import { useState } from 'react'
import { BottomSheet, Button, Card, NavigationHeader } from '@/design-system/components'
import { Check, ChevronDown, Coins, Plus, ShieldCheck, Warning, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { setOnboardingVerifyMethod, usePipeline } from '../lib/pipeline-store'
import { DISB } from '../lib/disbursement'
import { AppScreen, StickyBar } from '../lib/ui'

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-8 border ${
        checked ? 'border-primary-500 bg-primary-500 text-neutral-white' : 'border-default bg-neutral-white'
      }`}
    >
      {checked ? <Check size={16} /> : null}
    </span>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <span className={`text-14 ${muted ? 'text-caption' : 'text-default'}`}>{label}</span>
      <span className={`text-14 ${muted ? 'text-caption' : 'text-default'}`}>{value}</span>
    </div>
  )
}

export function DisbursementConfirmScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  // Ask how the passcode is sent before the Persetujuan passcode step.
  const [otpOpen, setOtpOpen] = useState(false)

  function sendPasscode(channel: 'wa' | 'sms') {
    setOnboardingVerifyMethod(channel)
    setOtpOpen(false)
    flow.go('disbursement-passcode')
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Konfirmasi pencairan" onBack={() => flow.back()} />}>
      <span className="pt-2 text-16 font-bold text-default">Jaga keluarga, usaha lebih tenang</span>

      {/* Proteksi Keluarga — selected add-on. */}
      <div className="overflow-hidden rounded-16 border border-primary-500 bg-neutral-white">
        <div className="flex flex-col gap-8 p-16">
          <div className="flex items-start gap-8">
            <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
              <ShieldCheck size={20} />
            </span>
            <span className="min-w-0 flex-1 text-16 font-bold text-default">Proteksi Keluarga 12 Bulan</span>
            <CheckBox checked />
          </div>
          <span className="text-12 text-caption">
            Santunan hingga <span className="font-bold text-default">{DISB.santunan}</span> untuk{' '}
            <span className="font-bold text-default">{DISB.anggota}</span>.
          </span>
          <span className="text-14 font-bold text-primary-500">
            {DISB.proteksi} <span className="font-regular text-disabled line-through">{DISB.proteksiCoret}</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-8 border-t border-default bg-neutral-50 px-16 py-12">
          <span className="flex min-w-0 flex-col">
            <span className="text-12 text-caption">Anggota keluarga</span>
            <span className="flex items-center gap-4 text-12 font-bold text-orange-500">
              <Warning size={16} />
              Belum terdaftar
            </span>
          </span>
          <Button size="sm">Daftar</Button>
        </div>
      </div>

      {/* Celengan — optional add-on. */}
      <Card>
        <div className="flex flex-col gap-8">
          <div className="flex items-start gap-8">
            <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
              <Coins size={20} />
            </span>
            <span className="min-w-0 flex-1 text-16 font-bold text-default">Isi Celengan Rp100 ribu</span>
            <button
              type="button"
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-8 border border-primary-500 text-primary-500"
              aria-label="Tambah celengan"
            >
              <Plus size={16} />
            </button>
          </div>
          <span className="text-12 text-caption">
            Dapatkan keuntungan <span className="font-bold text-default">5% per tahun</span>
          </span>
          <span className="text-14 font-bold text-default">{DISB.celengan}</span>
        </div>
      </Card>

      <span className="pt-2 text-16 font-bold text-default">Detail pencairan</span>

      <Card>
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-8">
            <Row label="Pokok pinjaman" value={DISB.pokok} />
            <Row label="Proteksi Keluarga 12 Bulan" value={`-${DISB.proteksi}`} />
            <Row label="Biaya admin" value={`-${DISB.admin}`} />
            <div className="flex items-center justify-between gap-8">
              <span className="text-16 font-bold text-default">Anda terima</span>
              <span className="text-16 font-bold text-primary-500">{DISB.terima}</span>
            </div>
          </div>
          <div className="flex items-start justify-between gap-8 border-t border-default pt-12">
            <span className="flex flex-col">
              <span className="text-16 font-bold text-default">Angsuran</span>
              <span className="text-12 text-caption">{DISB.cicilan}</span>
            </span>
            <span className="flex flex-col items-end">
              <span className="text-16 font-bold text-default">{DISB.angsuran}</span>
              <span className="text-12 text-caption">/minggu</span>
            </span>
          </div>
          <button
            type="button"
            className="flex items-center justify-center gap-4 rounded-full border border-default py-8 text-14 font-bold text-default"
          >
            Lihat semua
            <ChevronDown size={16} />
          </button>
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => setOtpOpen(true)}>
          Lanjut ke Persetujuan
        </Button>
      </StickyBar>

      {/* Kirim Passcode — pick the channel before the Persetujuan step. */}
      <BottomSheet
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        title="Kirim Passcode"
        description={`Pilih cara pengiriman passcode ke ${lead?.name ?? 'mitra'}`}
      >
        <div className="flex flex-col gap-8 pt-8">
          <Button size="lg" className="w-full" onClick={() => sendPasscode('wa')}>
            <span className="flex items-center justify-center gap-8">
              <WhatsappLogo size={20} />
              Kirim ke WhatsApp
            </span>
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => sendPasscode('sms')}>
            Kirim ke SMS
          </Button>
        </div>
      </BottomSheet>
    </AppScreen>
  )
}
