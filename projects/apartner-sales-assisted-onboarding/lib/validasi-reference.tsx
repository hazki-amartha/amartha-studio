'use client'

// The two reference bodies behind step 1 (Hasil Underwriting) — Data
// Underwriting and BP Feedback. Their own screens (validasi-data.tsx /
// validasi-bp-feedback.tsx) show the highlight + full body; validasi-mitra.tsx
// shows just the highlight on its reference card. Shared here so all three
// screens read from the same facts (§4 — project-local, not promoted to the
// design system, since nothing outside this project wants them).

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

/** One "Yang perlu diperhatikan" callout, shared by both step-1 reference
 *  cards — a flat bulleted read of the facts that actually matter, not a
 *  quote of the system's own formal wording. */
function ConcernList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-col gap-4 rounded-r-8 border-l-2 border-orange-500 bg-orange-50 p-8">
      <span className="text-12 font-bold text-orange-500">Yang perlu diperhatikan</span>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-8">
            <span className="h-4 w-4 shrink-0 rounded-full bg-neutral-900" />
            <span className="text-12 text-default">{item}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** The handful of facts that actually move the needle on Data UK — shown
 *  whether or not the full page is open, so she doesn't have to leave this
 *  card just to see why underwriting flagged her. */
export function UnderwritingHighlight({ case: c }: { case: SoftRejectCase }) {
  return (
    <ConcernList
      items={[
        `Umur usaha ${findRow(c, 'Data usaha', 'Umur usaha')}`,
        `Pengeluaran per bulan ${findRow(c, 'Data usaha', 'Pengeluaran per bulan')}`,
        `Penghasilan per bulan ${findRow(c, 'Data usaha', 'Penghasilan per bulan')}`,
      ]}
    />
  )
}

/** The two calls the BP already made that most directly bear on Setujui/
 *  Tolak — shown whether or not BP Feedback is expanded. */
export function BpFeedbackHighlight({ case: c }: { case: SoftRejectCase }) {
  const a = c.bpAssessment
  return (
    <ConcernList
      items={[
        `Kesanggupan pembayaran: ${a.kesanggupanBayar}`,
        `Indikasi buruk: ${a.indikasiBuruk}`,
      ]}
    />
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
