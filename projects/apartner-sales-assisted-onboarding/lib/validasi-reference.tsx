'use client'

// The two reference bodies step 1 (Hasil Underwriting) expands inline —
// Data Underwriting and BP Feedback. They used to be their own screens
// (validasi-data.tsx / validasi-bp-feedback.tsx); now they're accordions on
// validasi-mitra.tsx itself, so their content lives here instead, shared by
// nothing else (§4 — project-local, not promoted, since only this one screen
// opens them).

import type { ReactNode } from 'react'
import { Camera, House, IdentificationCard, Storefront } from '@/design-system/icons'
import type { SoftRejectCase } from './validasi'
import { SectionTitle } from './ui'

/** A row's value by section + label — "Data usaha" carries the two financial
 *  facts the highlight below wants (Umur usaha, Penghasilan per bulan)
 *  without duplicating them as separate fields on the case. */
function findRow(c: SoftRejectCase, sectionTitle: string, label: string): string {
  return c.sections.find((s) => s.title === sectionTitle)?.rows.find((r) => r.label === label)
    ?.value ?? ''
}

/** The tinted callout the old "Alasan sistem" box used — reused for any
 *  single highlighted fact, so a preview reads as "the thing that matters"
 *  the same way whichever card it's on. Orange by default (a flag); `tone`
 *  switches it to green for an answer that's actually reassuring — an
 *  "Indikasi buruk: Tidak ada" painted orange would read backwards. */
function Highlight({
  label,
  value,
  tone = 'orange',
}: {
  label: string
  value: string
  tone?: 'orange' | 'green'
}) {
  const classes =
    tone === 'green'
      ? 'border-green-500 bg-green-50 text-green-500'
      : 'border-orange-500 bg-orange-50 text-orange-500'
  return (
    <div className={`flex flex-col gap-2 rounded-r-8 border-l-2 p-8 ${classes}`}>
      <span className="text-12 font-bold">{label}</span>
      <span className="text-12 text-default">{value}</span>
    </div>
  )
}

/** A quick reassuring/concerning read on a BP answer — starts with "Tidak"
 *  or "Mampu" outright reads as reassuring; anything else (an "Ada ...", a
 *  "Diragukan", a qualified "Mampu, dengan catatan") stays a flag. */
function toneFor(value: string): 'orange' | 'green' {
  return value === 'Mampu' || value.startsWith('Tidak') ? 'green' : 'orange'
}

/** The handful of facts that actually move the needle on Data Underwriting —
 *  shown whether or not the accordion is open, so she doesn't have to expand
 *  the whole "Data pengajuan" just to see why underwriting flagged her. */
export function UnderwritingHighlight({ case: c }: { case: SoftRejectCase }) {
  return (
    <div className="flex flex-col gap-8">
      <Highlight label="Alasan sistem" value={c.reason} />
      <div className="flex gap-8">
        <div className="flex-1 rounded-8 border border-default p-8">
          <span className="block text-12 text-caption">Umur usaha</span>
          <span className="text-14 font-bold text-default">{findRow(c, 'Data usaha', 'Umur usaha')}</span>
        </div>
        <div className="flex-1 rounded-8 border border-default p-8">
          <span className="block text-12 text-caption">Penghasilan/bulan</span>
          <span className="text-14 font-bold text-default">
            {findRow(c, 'Data usaha', 'Penghasilan per bulan')}
          </span>
        </div>
      </div>
    </div>
  )
}

/** The two calls the BP already made that most directly bear on Setujui/
 *  Tolak — shown whether or not BP Feedback is expanded. */
export function BpFeedbackHighlight({ case: c }: { case: SoftRejectCase }) {
  const a = c.bpAssessment
  return (
    <div className="flex flex-col gap-8">
      <Highlight
        label="Kesanggupan pembayaran"
        value={a.kesanggupanBayar}
        tone={toneFor(a.kesanggupanBayar)}
      />
      <Highlight label="Indikasi buruk" value={a.indikasiBuruk} tone={toneFor(a.indikasiBuruk)} />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-12">
      <span className="w-140 shrink-0 text-12 text-caption">{label}</span>
      <span className="min-w-0 flex-1 text-right text-12 font-bold text-default">{value}</span>
    </div>
  )
}

/** A drawn stand-in for a document/photo the prototype doesn't ship a real
 *  image for (§2: tokens only) — a tinted tile carrying the one icon that
 *  says what it stands for. */
function PhotoPlaceholder({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex h-120 flex-col items-center justify-center gap-8 rounded-8 bg-canvas-blue text-primary-500">
      {icon}
      <span className="text-12 font-regular text-caption">{label}</span>
    </div>
  )
}

/** A divider between subsections inside the one expanded card — flattened
 *  rather than nested Cards, since this now sits inside another Card. */
function Sub({ first, children }: { first?: boolean; children: ReactNode }) {
  return (
    <div className={`flex flex-col gap-12 ${first ? '' : 'border-t border-default pt-12'}`}>
      {children}
    </div>
  )
}

/** The full underwriting data behind the soft reject — the same "Data
 *  pengajuan" a mitra sees on her own AFin app (no "Ubah" — she's reviewing,
 *  not editing). */
export function DataUnderwritingBody({ case: c }: { case: SoftRejectCase }) {
  return (
    <div className="flex flex-col gap-12">
      <Sub first>
        <SectionTitle>KTP {c.name}</SectionTitle>
        <PhotoPlaceholder icon={<IdentificationCard size={24} />} label="Foto KTP" />
        <Row label="Nama sesuai KTP" value={c.name.toUpperCase()} />
        <Row label="NIK" value={c.nik} />
      </Sub>

      {c.sections.map((section) => (
        <Sub key={section.title}>
          <SectionTitle>{section.title}</SectionTitle>
          <div className="flex flex-col gap-8">
            {section.rows.map((row) => (
              <Row key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </Sub>
      ))}

      <Sub>
        <SectionTitle>Foto rumah tinggal</SectionTitle>
        <PhotoPlaceholder icon={<House size={24} />} label="Foto rumah tinggal" />
      </Sub>

      <Sub>
        <SectionTitle>Foto tempat usaha</SectionTitle>
        <PhotoPlaceholder icon={<Storefront size={24} />} label="Foto dengan dagangan/alat usaha" />
      </Sub>
    </div>
  )
}

/** The BP's field read, condensed onto one page. The real BP Feedback form
 *  the BP fills is five steps on her own app; the BM reading it afterward
 *  needs the answers, not the steps, so this is that whole form collapsed
 *  into the handful of facts that actually change her decision, plus the
 *  BP's own note verbatim at the bottom. */
export function BpFeedbackBody({ case: c }: { case: SoftRejectCase }) {
  const a = c.bpAssessment
  return (
    <div className="flex flex-col gap-12">
      {/* Stands in for the form's own selfie-verification step — the BM
          doesn't need the photo, only that the visit actually happened. */}
      <Sub first>
        <SectionTitle>Kunjungan lapangan</SectionTitle>
        <PhotoPlaceholder icon={<Camera size={24} />} label={`Selfie BP & ${c.name}`} />
        <Row label="Status" value="Terverifikasi" />
        <Row label="Lokasi" value="Tercatat" />
      </Sub>

      <Sub>
        <SectionTitle>Kondisi usaha &amp; profil mitra</SectionTitle>
        <div className="flex flex-col gap-8">
          <Row label="Usaha berjalan aktif?" value={a.usahaAktif} />
          <Row label="Lama usaha berjalan" value={a.lamaUsaha} />
          <Row label="Status kepemilikan rumah" value={a.statusRumah} />
          <Row label="Lama tinggal di alamat ini" value={a.lamaTinggal} />
        </div>
      </Sub>

      <Sub>
        <SectionTitle>Verifikasi lingkungan</SectionTitle>
        <div className="flex flex-col gap-8">
          <Row label="Pengakuan warga / Ketua Majelis" value={a.pengakuanLingkungan} />
          <Row label="Verifikasi domisili" value={a.verifikasiDomisili} />
        </div>
      </Sub>

      <Sub>
        <SectionTitle>Penilaian BP</SectionTitle>
        <div className="flex flex-col gap-8">
          <Row label="Kesanggupan pembayaran" value={a.kesanggupanBayar} />
          <Row label="Indikasi buruk" value={a.indikasiBuruk} />
        </div>
      </Sub>

      <Sub>
        <span className="text-14 font-bold text-default">Catatan BP</span>
        <span className="text-14 text-default">{a.catatan}</span>
      </Sub>
    </div>
  )
}
