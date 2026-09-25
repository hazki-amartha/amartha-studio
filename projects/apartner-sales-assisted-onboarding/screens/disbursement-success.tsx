'use client'

// Ajukan pencairan (processing) — the state after "Kirim Pengajuan": the request
// is being processed. Closing this page returns to Sales, where the mitra has
// left the board (she is now reachable only from the Majelis / Mitra pages).

import { useState } from 'react'
import { Button, Card, NavigationHeader } from '@/design-system/components'
import { ChevronDown, ChevronRight, File, Headset } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { DISB } from '../lib/disbursement'
import { AppScreen, StickyBar } from '../lib/ui'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <span className="text-14 text-caption">{label}</span>
      <span className="text-14 font-bold text-default">{value}</span>
    </div>
  )
}

function DocRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <span className="min-w-0 flex-1 text-14 text-default">{label}</span>
      <button
        type="button"
        className="shrink-0 rounded-full border border-primary-500 px-12 py-4 text-12 font-bold text-primary-500"
      >
        Lihat Dokumen
      </button>
    </div>
  )
}

export function DisbursementSuccessScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [detailOpen, setDetailOpen] = useState(true)

  // Closing lands on Sales with a green success snackbar whose "see here" opens
  // the mitra's Majelis page; the mitra has already left the board.
  function close() {
    pipelineStore.setFlashSuccess(`${lead?.name ?? 'Mitra'} disbursement is on progress.`, {
      label: 'see here',
      leadId: openId,
    })
    flow.go('sales')
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Ajukan pencairan" onBack={close} />}>
      {/* Stand-in illustration + processing message. */}
      <div className="flex flex-col items-center gap-8 py-8 text-center">
        <span className="flex h-64 w-64 items-center justify-center rounded-full bg-blue-50 text-primary-500">
          <File size={24} />
        </span>
        <span className="text-18 font-bold text-default">Pencairan sedang diproses</span>
        <span className="text-12 text-caption">Dana akan Anda terima dalam 1 hari kerja.</span>
      </div>

      <Card>
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-2">
            <span className="text-14 text-caption">Anda akan terima</span>
            <span className="text-24 font-bold text-default">{DISB.terima}</span>
          </div>
          <button
            type="button"
            onClick={() => setDetailOpen((v) => !v)}
            className="flex items-center justify-center gap-4 rounded-full border border-default py-8 text-14 font-bold text-default"
          >
            Lihat detail
            <span className={detailOpen ? 'rotate-180' : ''}>
              <ChevronDown size={16} />
            </span>
          </button>
          {detailOpen ? (
            <div className="flex flex-col gap-8 border-t border-default pt-12">
              <DetailRow label="Jangka waktu" value={DISB.jangka} />
              <DetailRow label="Angsuran mingguan" value={DISB.angsuran} />
              <DetailRow label="Margin" value={DISB.margin} />
              <DetailRow label="Total tagihan" value={DISB.totalTagihan} />
              <DetailRow label="ID Pinjaman" value={DISB.idPinjaman} />
              <DetailRow label="Karyawan Amartha" value={DISB.karyawan} />
              <DetailRow label="ID Karyawan" value={DISB.idKaryawan} />
            </div>
          ) : null}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-12">
          <span className="text-16 font-bold text-default">Dokumen pinjaman</span>
          <DocRow label="Syarat-Syarat Umum Perjanjian" />
          <DocRow label="Perjanjian Akad" />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-12">
          <div className="flex items-center justify-between gap-8">
            <span className="text-16 font-bold text-default">Proteksi Keluarga</span>
            <button
              type="button"
              className="shrink-0 rounded-full border border-primary-500 px-12 py-4 text-12 font-bold text-primary-500"
            >
              Lihat Proteksi
            </button>
          </div>
          <DetailRow label="Status proteksi" value="Diproses" />
          <DetailRow label="Masa proteksi" value={DISB.jangka} />
          <DetailRow label="Premi" value={DISB.proteksi} />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-12">
          <span className="text-16 font-bold text-default">Celengan {lead?.name ?? ''}</span>
          <DetailRow label="Status pembelian" value="Diproses" />
          <DetailRow label="Nominal pembelian" value={DISB.celengan} />
          <DetailRow label="Dapat dicairkan setelah" value={DISB.jangka} />
        </div>
      </Card>

      <button
        type="button"
        className="flex items-center gap-8 rounded-12 bg-neutral-white p-16 text-left"
      >
        <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
          <Headset size={20} />
        </span>
        <span className="min-w-0 flex-1 text-14 font-bold text-default">Hubungi Amartha Care</span>
        <span className="shrink-0 text-disabled">
          <ChevronRight size={20} />
        </span>
      </button>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={close}>
          Tutup
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
