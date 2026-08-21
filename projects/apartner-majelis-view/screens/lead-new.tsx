'use client'

// Tambah Lead — capturing a prospect the BP just met.
//
// The source is asked with a follow-up, in a sheet: a POI Visit lead names WHICH
// point of interest; a Referral names WHO sent her — a mitra (searchable) or one
// of the non-mitra kinds. KTP can be attached right here: a lead who arrives with
// her KTP is captured Qualified, skipping the extra call it would otherwise take.

import { useState } from 'react'
import { Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Camera, FileCheck } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { SOURCE_LABEL, type LeadSource, type MajelisAssignment, type ReferrerKind } from '../lib/pipeline'
import { pipelineStore } from '../lib/pipeline-store'
import { MajelisPickerSheet, PoiSheet, ReferralSheet, assignmentLabel } from '../lib/pipeline-ui'
import { AppScreen, SectionTitle, StickyBar } from '../lib/ui'

const SOURCES: LeadSource[] = ['poi', 'referral']
const DEFAULT_MAJELIS: MajelisAssignment = { kind: 'none', branch: 'BP Ciseeng' }

type SheetId = 'poi' | 'referral' | 'majelis' | null

export function LeadNewScreen() {
  const flow = useFlow()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState<LeadSource | null>(null)
  const [poi, setPoi] = useState('')
  const [referredBy, setReferredBy] = useState('')
  const [referrerKind, setReferrerKind] = useState<ReferrerKind | null>(null)
  const [majelis, setMajelis] = useState<MajelisAssignment>(DEFAULT_MAJELIS)
  const [nik, setNik] = useState('')
  const [ktp, setKtp] = useState(false)
  const [sheet, setSheet] = useState<SheetId>(null)

  // The one-line summary of the chosen source, shown once it is set.
  const sourceDetail = source === 'poi' ? poi : referredBy

  function pickSource(s: LeadSource) {
    setSource(s)
    setSheet(s === 'poi' ? 'poi' : 'referral')
  }

  const sourceReady = source === 'poi' ? poi !== '' : source === 'referral' ? referredBy !== '' : false
  const ready = name.trim() !== '' && phone.trim() !== '' && sourceReady

  function save() {
    if (!ready || !source) return
    pipelineStore.addLead({ name, phone, source, poi, referredBy, referrerKind, majelis, nik, ktp })
    flow.go('lead-detail')
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Tambah Lead" onBack={() => flow.back()} />}>
      <Card>
        <div className="flex flex-col gap-12">
          <Input
            label="Nama"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama calon mitra"
          />
          <Input
            label="No. HP"
            required
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xx-xxxx-xxxx"
          />
        </div>
      </Card>

      <SectionTitle>Sumber</SectionTitle>
      <div className="flex flex-col gap-8">
        {SOURCES.map((value) => (
          <SelectableCard
            key={value}
            name="lead-source"
            inputType="radio"
            title={SOURCE_LABEL[value]}
            description={
              value === 'poi' ? 'Ditemui saat POI Visit / Sosialisasi' : 'Dikenalkan oleh mitra atau warga'
            }
            checked={source === value}
            onChange={() => pickSource(value)}
          />
        ))}
        {/* Once a source is chosen, its detail (which POI / who referred) shows
            here, tappable to change. */}
        {source && sourceDetail ? (
          <button
            type="button"
            onClick={() => setSheet(source === 'poi' ? 'poi' : 'referral')}
            className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-left"
          >
            <span className="flex min-w-0 flex-col">
              <span className="text-12 text-caption">{source === 'poi' ? 'POI' : 'Perujuk'}</span>
              <span className="truncate text-14 text-default">{sourceDetail}</span>
            </span>
            <span className="shrink-0 text-12 font-bold text-link">Ubah</span>
          </button>
        ) : null}
      </div>

      <SectionTitle>Majelis</SectionTitle>
      <button
        type="button"
        onClick={() => setSheet('majelis')}
        className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-12 text-left text-14 text-default"
      >
        <span className="truncate">{assignmentLabel(majelis)}</span>
        <span className="shrink-0 text-12 font-bold text-link">Ubah</span>
      </button>

      <SectionTitle>KTP</SectionTitle>
      <Card>
        <div className="flex flex-col gap-12">
          <span className="text-12 text-caption">
            Lampirkan KTP sekarang agar lead langsung jadi Qualified. Tanpa KTP, lead masuk sebagai
            Unqualified.
          </span>
          {ktp ? (
            <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12">
              <span className="text-green-500">
                <FileCheck size={20} />
              </span>
              <span className="flex-1 text-default">Foto KTP terlampir</span>
              <button type="button" onClick={() => setKtp(false)} className="shrink-0 text-12 font-bold text-link">
                Hapus
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setKtp(true)}
              className="flex w-full flex-col items-center gap-4 rounded-8 border border-default bg-canvas-blue p-16 text-caption"
            >
              <Camera size={24} />
              <span className="text-14 text-default">Upload Foto KTP</span>
            </button>
          )}
          <Input
            label="NIK (16 digit)"
            optionalText="opsional"
            inputMode="numeric"
            maxLength={16}
            value={nik}
            onChange={(e) => setNik(e.target.value)}
            placeholder="Masukkan 16 digit NIK"
          />
        </div>
      </Card>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!ready} onClick={save}>
          Simpan
        </Button>
      </StickyBar>

      <PoiSheet
        open={sheet === 'poi'}
        value={poi}
        onClose={() => setSheet(null)}
        onPick={(p) => {
          setPoi(p)
          setSheet(null)
        }}
      />
      <ReferralSheet
        open={sheet === 'referral'}
        onClose={() => setSheet(null)}
        onPick={(name, kind) => {
          setReferredBy(name)
          setReferrerKind(kind)
          setSheet(null)
        }}
      />
      <MajelisPickerSheet
        open={sheet === 'majelis'}
        value={majelis}
        onClose={() => setSheet(null)}
        onPick={(m) => {
          setMajelis(m)
          setSheet(null)
        }}
      />
    </AppScreen>
  )
}
