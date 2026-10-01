'use client'

// Persetujuan Akad — the last stop before Kirim Pengajuan: two photos
// documenting the akad itself (the signed document, and the agent with the
// mitra at signing) rather than a typed agreement checkbox. "Kirim
// Pengajuan" only unlocks once both are captured.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { Camera, FileCheck } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { AppScreen, StickyBar } from '../lib/ui'

function PhotoCapture({
  label,
  captured,
  onToggle,
}: {
  label: string
  captured: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <span className="text-14 font-bold text-default">{label}</span>
      {captured ? (
        <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12">
          <span className="text-green-500">
            <FileCheck size={20} />
          </span>
          <span className="flex-1 text-default">Foto terlampir</span>
          <button type="button" onClick={onToggle} className="shrink-0 text-12 font-bold text-link">
            Ambil ulang
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full flex-col items-center gap-4 rounded-8 border border-dashed border-default bg-canvas-blue p-16 text-caption"
        >
          <Camera size={24} />
          <span className="text-14 text-default">Ambil foto</span>
        </button>
      )}
    </div>
  )
}

export function DisbursementAkadScreen() {
  const flow = useFlow()
  const { openId } = usePipeline()
  const [fotoAkad, setFotoAkad] = useState(false)
  const [fotoAkadMitra, setFotoAkadMitra] = useState(false)
  const ready = fotoAkad && fotoAkadMitra

  function submit() {
    pipelineStore.submitDisbursement(openId)
    flow.go('disbursement-success')
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Persetujuan Akad" onBack={() => flow.back()} />}>
      <span className="pt-2 text-16 font-bold text-default">Foto bukti penandatanganan akad</span>
      <span className="text-12 text-caption">
        Ambil kedua foto berikut sebagai bukti akad sudah ditandatangani sebelum pengajuan dikirim.
      </span>

      <PhotoCapture label="Foto akad" captured={fotoAkad} onToggle={() => setFotoAkad((v) => !v)} />
      <PhotoCapture
        label="Foto akad bersama mitra"
        captured={fotoAkadMitra}
        onToggle={() => setFotoAkadMitra((v) => !v)}
      />

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!ready} onClick={submit}>
          Kirim Pengajuan
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
