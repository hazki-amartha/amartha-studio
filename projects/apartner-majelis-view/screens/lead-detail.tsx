'use client'

// Detail Lead — a prospect's record, reached from the Sales roster. It is built
// from the shared pipeline record card (`LeadRecordCard`) and the same action
// sheets the Follow-Up task uses, so a lead reads identically wherever the BP
// opens her. The one action is "Perbarui status", which also carries "Ajukan
// Pinjaman" (gated on Qualified).

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import {
  EditContactSheet,
  KtpSheet,
  LeadRecordCard,
  MajelisPickerSheet,
  PerbaruiStatusSheet,
  RiwayatPanggilan,
  SourceSheet,
  SubmitSheet,
} from '../lib/pipeline-ui'
import { AppScreen } from '../lib/ui'
import { hasInterest } from '../lib/pipeline'

type SheetId = 'contact' | 'source' | 'majelis' | 'ktp' | 'interest' | 'submit' | null

export function LeadDetailScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]
  const [sheet, setSheet] = useState<SheetId>(null)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Detail Lead" onBack={() => flow.back()} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const worked = hasInterest(lead.status)
  const canSubmit = lead.status === 'qualified'

  return (
    <AppScreen topBar={<NavigationHeader title="Detail Lead" onBack={() => flow.back()} />}>
      <LeadRecordCard
        lead={lead}
        onEditContact={() => setSheet('contact')}
        // Sumber and KTP are only editable while she is still being worked; once
        // a loan is Submitted onward they are locked. Majelis stays editable at
        // any status (the concept allows assigning a majelis regardless).
        onEditSource={worked ? () => setSheet('source') : undefined}
        onEditMajelis={() => setSheet('majelis')}
        onEditKtp={worked ? () => setSheet('ktp') : undefined}
        onContact={() => setSheet('interest')}
        action={
          worked ? (
            <Button size="lg" className="w-full" onClick={() => setSheet('interest')}>
              Perbarui status
            </Button>
          ) : null
        }
      />

      <RiwayatPanggilan lead={lead} />

      <EditContactSheet
        open={sheet === 'contact'}
        name={lead.name}
        phone={lead.phone}
        onClose={() => setSheet(null)}
        onSave={(name, phone) => {
          pipelineStore.updateContact(lead.id, name, phone)
          setSheet(null)
        }}
      />
      <SourceSheet
        open={sheet === 'source'}
        onClose={() => setSheet(null)}
        onDone={(data) => {
          pipelineStore.setSource(lead.id, data)
          setSheet(null)
        }}
      />
      <MajelisPickerSheet
        open={sheet === 'majelis'}
        value={lead.majelis}
        onClose={() => setSheet(null)}
        onPick={(m) => {
          pipelineStore.assignMajelis(lead.id, m)
          setSheet(null)
        }}
      />
      <KtpSheet
        open={sheet === 'ktp'}
        nik={lead.nik}
        ktp={lead.ktp}
        onClose={() => setSheet(null)}
        onSave={(nik, ktp) => {
          pipelineStore.updateKtp(lead.id, nik, ktp)
          setSheet(null)
        }}
      />
      <PerbaruiStatusSheet
        lead={lead}
        open={sheet === 'interest'}
        canSubmit={canSubmit}
        onClose={() => setSheet(null)}
        onAjukan={() => setSheet('submit')}
        onSaved={() => setSheet(null)}
      />
      <SubmitSheet
        lead={lead}
        open={sheet === 'submit'}
        onClose={() => setSheet(null)}
        onSaved={() => setSheet(null)}
      />
    </AppScreen>
  )
}
