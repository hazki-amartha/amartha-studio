'use client'

// Validasi Mitra — reference material off step 1 (Hasil Underwriting), not a
// numbered step of its own: the full underwriting data behind the soft
// reject — the same "Data pengajuan" a mitra sees on her own AFin app, laid
// out for the BM to actually read (no "Ubah" — she's reviewing, not editing).
// Opened from, and closed back to, validasi-mitra.tsx.

import type { ReactNode } from 'react'
import { Card, NavigationHeader } from '@/design-system/components'
import { House, IdentificationCard, Storefront } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { type DataSection } from '../lib/validasi'
import { useOpenCase } from '../lib/validasi-store'
import { MitraCard } from '../lib/validasi-ui'
import { AppScreen, SectionTitle } from '../lib/ui'

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-12">
      <span className="w-120 shrink-0 text-12 text-caption">{label}</span>
      <span className="min-w-0 flex-1 text-right text-12 font-bold text-default">{value}</span>
    </div>
  )
}

function Section({ section }: { section: DataSection }) {
  return (
    <Card>
      <div className="flex flex-col gap-12">
        <SectionTitle>{section.title}</SectionTitle>
        <div className="flex flex-col gap-8">
          {section.rows.map((row) => (
            <DataRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
      </div>
    </Card>
  )
}

/** A drawn stand-in for a document/photo the prototype doesn't ship a real
 *  image for (§2: tokens only) — a tinted tile carrying the one icon that says
 *  what it stands for. */
function PhotoPlaceholder({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex h-120 flex-col items-center justify-center gap-8 rounded-8 bg-canvas-blue text-primary-500">
      {icon}
      <span className="text-12 font-regular text-caption">{label}</span>
    </div>
  )
}

export function ValidasiDataScreen() {
  const flow = useFlow()
  const c = useOpenCase()

  return (
    <AppScreen
      topBar={<NavigationHeader title="Data Underwriting" onBack={() => flow.go('validasi-mitra')} />}
    >
      <MitraCard case={c} />

      <Card>
        <div className="flex flex-col gap-12">
          <SectionTitle>KTP {c.name}</SectionTitle>
          <PhotoPlaceholder icon={<IdentificationCard size={24} />} label="Foto KTP" />
          <DataRow label="Nama sesuai KTP" value={c.name.toUpperCase()} />
          <DataRow label="NIK" value={c.nik} />
        </div>
      </Card>

      {c.sections.map((section) => (
        <Section key={section.title} section={section} />
      ))}

      <Card>
        <div className="flex flex-col gap-12">
          <SectionTitle>Foto rumah tinggal</SectionTitle>
          <PhotoPlaceholder icon={<House size={24} />} label="Foto rumah tinggal" />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-12">
          <SectionTitle>Foto tempat usaha</SectionTitle>
          <PhotoPlaceholder icon={<Storefront size={24} />} label="Foto dengan dagangan/alat usaha" />
        </div>
      </Card>
    </AppScreen>
  )
}
