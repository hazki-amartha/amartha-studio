'use client'

// Validasi Mitra — step 1 of 4: the underwriting state. ValidasiHeader
// (shared — lib/validasi-ui.tsx) already says who this is and that
// underwriting flagged her; this screen's own job is orienting the BM before
// she starts: how to reach the mitra, and the facts that actually matter
// from each source, so she doesn't have to open Data Underwriting or BP
// Feedback in full just to know whether it's worth reading closer — the
// highlight sits on the card whether or not it's expanded.
//
// Data Underwriting and the BP's own field feedback are accordions, not
// separate screens — reference material the BM opens while she's making up
// her mind, not steps of their own. Both start collapsed for now — she opens
// whichever one she actually wants to read in full.
//
// The 4 numbered steps are what she actually DOES: this notice, her own
// visit to the mitra, her visit to the Ketua Majelis, then the decision.

import { useState, type ReactNode } from 'react'
import { Card, Button } from '@/design-system/components'
import { House, MapPin, Storefront, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { VALIDASI_STEP_SCREENS, VALIDASI_STEPS } from '../lib/validasi'
import { canGoToValidasiStep, useOpenCase, useValidasi } from '../lib/validasi-store'
import { ValidasiHeader } from '../lib/validasi-ui'
import {
  BpFeedbackBody,
  BpFeedbackHighlight,
  DataUnderwritingBody,
  UnderwritingHighlight,
} from '../lib/validasi-reference'
import { AppScreen, ContactButton, SectionTitle, StageBar, StickyBar } from '../lib/ui'

function ReferenceItem({
  title,
  description,
  highlight,
  open,
  onToggle,
  children,
}: {
  title: string
  description: string
  /** Shown whether or not `open` — the handful of facts worth knowing even
   *  without expanding the whole card. */
  highlight: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <Card>
      <div className="flex flex-col gap-12">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-16 font-bold text-default">{title}</span>
          <span className="text-12 text-caption">{description}</span>
        </div>
        {highlight}
        {open ? <div className="border-t border-default pt-12">{children}</div> : null}
        <Button variant="ghost" size="sm" className="w-full" onClick={onToggle} aria-expanded={open}>
          {open ? 'Tutup' : 'Lihat lebih banyak'}
        </Button>
      </div>
    </Card>
  )
}

export function ValidasiMitraScreen() {
  const flow = useFlow()
  const c = useOpenCase()
  const s = useValidasi()
  const [dataOpen, setDataOpen] = useState(false)
  const [bpOpen, setBpOpen] = useState(false)

  return (
    <AppScreen topBar={<ValidasiHeader case={c} onBack={() => flow.go('tugas')} />}>
      <StageBar
        current={1}
        labels={VALIDASI_STEPS}
        onStepClick={(step) => flow.go(VALIDASI_STEP_SCREENS[step - 1])}
        canGoTo={(step) => canGoToValidasiStep(s, step)}
      />

      <Card>
        <div className="flex flex-col gap-12">
          <SectionTitle>Kontak &amp; alamat</SectionTitle>
          <div className="flex items-center gap-12">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-14 font-bold text-caption">
              {c.name.charAt(0)}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-14 font-bold text-default">{c.name}</span>
              <span className="truncate text-12 text-caption">Limit diajukan {c.amount}</span>
            </div>
            <ContactButton label={`Chat WhatsApp ${c.name}`} tone="green" onClick={() => {}}>
              <WhatsappLogo size={20} />
            </ContactButton>
          </div>
          <div className="flex items-start gap-12 border-t border-default pt-12">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 border border-default bg-canvas-blue text-caption">
              <House size={20} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-14 font-bold text-default">Rumah</span>
              <span className="text-12 text-caption">{c.houseAddress}</span>
            </div>
            <ContactButton label={`Peta rumah ${c.name}`} tone="red" onClick={() => {}}>
              <MapPin size={20} />
            </ContactButton>
          </div>
          <div className="flex items-start gap-12 border-t border-default pt-12">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 border border-default bg-canvas-blue text-caption">
              <Storefront size={20} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-14 font-bold text-default">Tempat usaha</span>
              <span className="text-12 text-caption">{c.businessAddress}</span>
            </div>
            <ContactButton label={`Peta tempat usaha ${c.name}`} tone="red" onClick={() => {}}>
              <MapPin size={20} />
            </ContactButton>
          </div>
        </div>
      </Card>

      <SectionTitle>Referensi</SectionTitle>

      <ReferenceItem
        title="Data Underwriting"
        description="Data lengkap pengajuan, dari KTP sampai data usaha"
        highlight={<UnderwritingHighlight case={c} />}
        open={dataOpen}
        onToggle={() => setDataOpen((v) => !v)}
      >
        <DataUnderwritingBody case={c} />
      </ReferenceItem>

      <ReferenceItem
        title="BP Feedback"
        description="Ringkasan kunjungan lapangan BP"
        highlight={<BpFeedbackHighlight case={c} />}
        open={bpOpen}
        onToggle={() => setBpOpen((v) => !v)}
      >
        <BpFeedbackBody case={c} />
      </ReferenceItem>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={() => flow.go('validasi-verifikasi-mitra')}>
          Lanjutkan ke Validasi Mitra
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
