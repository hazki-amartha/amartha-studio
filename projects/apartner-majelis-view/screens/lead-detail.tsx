'use client'

// Detail Lead — one prospect's record as a single identity card:
//
//   name + phone (editable) and the WA / call buttons,
//   her two-level status (main badge + interest, coloured),
//   three editable rows — Sumber, Majelis, KTP — each with "Ubah",
//   the "action selanjutnya" line (a follow-up date while she is worked, or the
//   wait/closed instruction once a loan is in),
//   and the one action the status calls for.
//
// The call history follows as its own list of cards, each carrying what was said
// and the follow-up it scheduled.

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { NotePencil, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  INTEREST_META,
  INTEREST_ORDER,
  actionLine,
  hasInterest,
  historyChannel,
  ktpDetail,
  majelisDetail,
  sourceDetail,
  statusBadge,
  type Interest,
  type MajelisAssignment,
  type PipelineLead,
  type Product,
} from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import {
  EditContactSheet,
  KtpSheet,
  MajelisPickerSheet,
  SourceSheet,
  assignmentLabel,
} from '../lib/pipeline-ui'
import { AppScreen, ContactButton, SectionTitle } from '../lib/ui'
import { IconPhone } from '../lib/icons'

// Interest as coloured text — yellow reads illegibly small, so Undecided borrows
// the orange it shades toward.
const INTEREST_TEXT: Record<Interest, string> = {
  interested: 'text-green-600',
  undecided: 'text-orange-600',
  'not-interested': 'text-red-500',
}

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

  const badge = statusBadge(lead)
  const worked = hasInterest(lead.status)
  const interest = worked && lead.interest ? lead.interest : null
  // A loan can be submitted once she is Qualified — at any interest. Unqualified
  // leads see the option, greyed, because the KTP that qualifies her isn't in yet.
  const canSubmit = lead.status === 'qualified'

  return (
    <AppScreen topBar={<NavigationHeader title="Detail Lead" onBack={() => flow.back()} />}>
      <Card>
        <div className="flex flex-col gap-12">
          {/* Name + contact buttons. */}
          <div className="flex items-start gap-12">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="truncate text-18 font-bold text-default">{lead.name}</span>
              <span className="flex items-center gap-8">
                <span className="truncate text-14 text-caption">{lead.phone}</span>
                <button
                  type="button"
                  aria-label="Ubah kontak"
                  onClick={() => setSheet('contact')}
                  className="shrink-0 text-primary-500"
                >
                  <NotePencil size={16} />
                </button>
              </span>
            </div>
            {worked ? (
              <div className="flex shrink-0 gap-8">
                <ContactButton label={`WhatsApp ${lead.name}`} tone="green" onClick={() => setSheet('interest')}>
                  <WhatsappLogo size={20} />
                </ContactButton>
                <ContactButton label={`Telepon ${lead.name}`} tone="primary" onClick={() => setSheet('interest')}>
                  <IconPhone size={20} />
                </ContactButton>
              </div>
            ) : null}
          </div>

          {/* Two-level status. */}
          <div className="flex flex-wrap items-center gap-8">
            <Badge intent={badge.intent} variant="outline">
              {badge.label}
            </Badge>
            {interest ? (
              <span className={`text-14 font-bold ${INTEREST_TEXT[interest]}`}>
                {INTEREST_META[interest].label}
              </span>
            ) : null}
          </div>

          {/* The three editable rows. */}
          <div className="flex flex-col">
            <DetailRow label="Sumber" value={sourceDetail(lead)} onEdit={() => setSheet('source')} />
            <DetailRow label="Majelis" value={majelisDetail(lead)} onEdit={() => setSheet('majelis')} />
            <DetailRow label="KTP" value={ktpDetail(lead)} onEdit={() => setSheet('ktp')} />
            {lead.product ? (
              <DetailRow label="Produk" value={`${lead.product}${lead.amount ? ` · ${lead.amount}` : ''}`} />
            ) : null}
          </div>

          {/* Action selanjutnya. */}
          <div className="flex flex-col gap-2 rounded-8 bg-canvas-blue px-12 py-8">
            <span className="text-12 text-caption">Action selanjutnya:</span>
            <span className="text-14 font-bold text-default">{actionLine(lead)}</span>
          </div>

          {/* One action: "Perbarui status". Its sheet carries the interest
              choices AND "Ajukan Pinjaman" — the latter offered only once she is
              Qualified. */}
          {worked ? (
            <Button size="lg" className="w-full" onClick={() => setSheet('interest')}>
              Perbarui status
            </Button>
          ) : null}
        </div>
      </Card>

      <SectionTitle>Riwayat Panggilan</SectionTitle>
      <div className="flex flex-col gap-8 pb-16">
        {lead.log
          .slice()
          .reverse()
          .map((entry, i) => (
            <Card key={`${entry.at}-${i}`}>
              <div className="flex flex-col gap-2">
                <span className="text-12 text-caption">
                  {entry.at} · {historyChannel(entry.via)}
                </span>
                <span className="text-14 font-bold text-default">
                  {entry.outcome}
                  {entry.note ? ` · ${entry.note}` : ''}
                </span>
                {entry.next ? (
                  <span className="text-12 text-caption">Action selanjutnya: Follow up {entry.next}</span>
                ) : null}
              </div>
            </Card>
          ))}
      </div>

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
      <InterestSheet
        lead={lead}
        open={sheet === 'interest'}
        canSubmit={canSubmit}
        onClose={() => setSheet(null)}
        onAjukan={() => setSheet('submit')}
      />
      <SubmitSheet lead={lead} open={sheet === 'submit'} onClose={() => setSheet(null)} />
    </AppScreen>
  )
}

/** A label / value row with an optional "Ubah", ruled off from its neighbours. */
function DetailRow({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className="flex items-center gap-8 border-t border-default py-12 first:border-t-0">
      <span className="min-w-0 flex-1 text-14 text-default">
        <span className="text-caption">{label}: </span>
        {value}
      </span>
      {onEdit ? (
        <button type="button" onClick={onEdit} className="shrink-0 text-12 font-bold text-link">
          Ubah
        </button>
      ) : null}
    </div>
  )
}

/**
 * Perbarui status — the one action on the record. It records the interest note,
 * and also carries "Ajukan Pinjaman" as a choice: picking it hands off to the
 * submit form. That option only becomes selectable once she is Qualified.
 */
function InterestSheet({
  lead,
  open,
  canSubmit,
  onClose,
  onAjukan,
}: {
  lead: PipelineLead
  open: boolean
  canSubmit: boolean
  onClose: () => void
  onAjukan: () => void
}) {
  const [pick, setPick] = useState<Interest | 'ajukan' | null>(null)
  const [note, setNote] = useState('')

  function reset() {
    setPick(null)
    setNote('')
  }

  function save() {
    if (!pick) return
    if (pick === 'ajukan') {
      reset()
      onAjukan()
      return
    }
    pipelineStore.recordInterest(lead.id, pick, INTEREST_META[pick].label, note)
    reset()
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Perbarui status"
      description="Bagaimana minatnya sekarang?"
      primaryAction={
        <Button size="lg" className="w-full" disabled={!pick} onClick={save}>
          {pick === 'ajukan' ? 'Lanjut' : 'Simpan'}
        </Button>
      }
    >
      <div className="flex flex-col gap-8">
        {INTEREST_ORDER.map((value) => (
          <SelectableCard
            key={value}
            name="interest"
            inputType="radio"
            title={INTEREST_META[value].label}
            description={INTEREST_META[value].hint}
            checked={pick === value}
            onChange={() => setPick(value)}
          />
        ))}
        {/* Ajukan Pinjaman as a status choice — greyed until she is Qualified. */}
        <SelectableCard
          name="interest"
          inputType="radio"
          title="Ajukan Pinjaman"
          description={canSubmit ? 'Kirim pengajuan pinjaman' : 'Lengkapi KTP dulu untuk mengajukan'}
          disabled={!canSubmit}
          checked={pick === 'ajukan'}
          onChange={() => setPick('ajukan')}
        />
        {pick !== 'ajukan' ? (
          <label className="flex flex-col gap-4 pt-4">
            <span className="text-12 text-caption">Catatan (opsional)</span>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Hasil pembicaraan…" />
          </label>
        ) : null}
      </div>
    </BottomSheet>
  )
}

/** Ajukan Pinjaman — the Qualified → Submitted form: product, majelis, amount. */
function SubmitSheet({ lead, open, onClose }: { lead: PipelineLead; open: boolean; onClose: () => void }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [amount, setAmount] = useState('')
  const [majelis, setMajelis] = useState<MajelisAssignment>(lead.majelis)
  const [picking, setPicking] = useState(false)

  function reset() {
    setProduct(null)
    setAmount('')
    setMajelis(lead.majelis)
    setPicking(false)
  }

  function submit() {
    if (!product) return
    pipelineStore.submitLoan(lead.id, { product, majelis, amount, nik: lead.nik })
    reset()
    onClose()
  }

  return (
    <>
      <BottomSheet
        open={open && !picking}
        onClose={() => {
          reset()
          onClose()
        }}
        title="Ajukan Pinjaman"
        description="Kirim form pengajuan ke sistem. Setelah ini lead menunggu hasil UK."
        primaryAction={
          <Button size="lg" className="w-full" disabled={!product} onClick={submit}>
            Kirim Pengajuan
          </Button>
        }
      >
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-4">
            <span className="text-12 text-caption">Produk</span>
            <div className="flex flex-col gap-8">
              {(['GL', 'Modal'] as Product[]).map((p) => (
                <SelectableCard
                  key={p}
                  name="submit-product"
                  inputType="radio"
                  title={p}
                  checked={product === p}
                  onChange={() => setProduct(p)}
                />
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-4">
            <span className="text-12 text-caption">Majelis</span>
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-left text-14 text-default"
            >
              <span className="truncate">{assignmentLabel(majelis)}</span>
              <span className="shrink-0 text-12 font-bold text-link">Ubah</span>
            </button>
          </label>

          <Input
            label="Plafon diajukan"
            optionalText="opsional"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Rp3.000.000"
          />
        </div>
      </BottomSheet>

      <MajelisPickerSheet
        open={open && picking}
        value={majelis}
        onClose={() => setPicking(false)}
        onPick={(m) => {
          setMajelis(m)
          setPicking(false)
        }}
      />
    </>
  )
}
