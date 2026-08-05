'use client'

// The prospect's record — the counterpart to the mitra page, for a woman who
// isn't one yet.
//
// It is deliberately shaped as a page with GAPS in it. Everything the quick
// capture skipped is drawn as an empty field with a name, not hidden until
// someone thinks to ask: a lead who cannot be submitted because nobody took her
// address is a lead that dies silently, and the difference between that and a
// lead who gets submitted is one visible blank.
//
// So the top of the page states what is still missing and the fields to fix it
// are immediately under it. Everything writes straight to the record as it is
// typed — no draft, no Simpan — the same rule the home visit follows, and for
// the same reason: what is on screen IS the record.
//
// The history at the bottom is the part that matters when this lead outlives
// the BP who found her. "Minat tinggi, menunggu pinjaman BRI lunas Oktober" on
// 14 Juli is why anyone is calling her in October, and without it October's BP
// is making a cold call to a stranger the app told her was warm.

import { Badge, Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import {
  INTEREST_META,
  LENDERS,
  STAGE_META,
  findEvent,
  missingFields,
  referralKindLabel,
} from '../lib/leads'
import { LeadIdentityCard } from '../lib/lead-card'
import { MAJELIS_DIRECTORY, findMajelisEntry } from '../lib/schedule'
import { openLead, store, useApp } from '../lib/store'
import { Chip, ChipGroup, SectionTitle, StatRows, StickyBar, VisitTitle } from '../lib/ui'

export function LeadScreen() {
  const flow = useFlow()
  const s = useApp()
  const lead = openLead(s)
  const gaps = missingFields(lead)
  const stage = STAGE_META[lead.stage]
  const interest = lead.interest ? INTEREST_META[lead.interest] : null
  const event = lead.eventId ? findEvent(lead.eventId) : null

  const set = (patch: Parameters<typeof store.updateLead>[1]) => store.updateLead(lead.id, patch)

  function setOtherLoan(patch: Partial<NonNullable<typeof lead.otherLoan>>) {
    set({
      hasOtherLoan: true,
      otherLoan: { lender: '', amount: 0, ends: '', ...(lead.otherLoan ?? {}), ...patch },
    })
  }

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={
            <VisitTitle
              title={lead.name}
              when={event ? `Prospek · ${event.title}` : 'Prospek · Referral'}
            />
          }
          onBack={flow.back}
        />
      }
    >
      <LeadIdentityCard lead={lead} />

      {/* Where she stands, and what that means to do about her. The hint is
          carried from the interest grade rather than written per lead: a grade
          that doesn't say what it implies gets read four different ways by four
          different BPs. */}
      <Card>
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-8">
            <span className="flex-1 text-14 font-bold text-default">Status</span>
            <Badge intent={stage.intent}>{stage.label}</Badge>
          </div>
          {interest ? <span className="text-12 text-caption">{interest.hint}</span> : null}
          {lead.reason ? (
            <div className="rounded-8 bg-neutral-50 px-12 py-8 text-12 text-default">
              {lead.reason}
            </div>
          ) : null}
          {lead.followUpAt ? (
            <span className="text-12 text-default">
              Dijadwalkan dihubungi <span className="font-bold">{lead.followUpAt}</span>
            </span>
          ) : null}
        </div>
      </Card>

      {/* --- The lengkap tier. Named as homework, with the count, so it reads
          as a task with an end rather than an open-ended form. */}
      <SectionTitle>
        {gaps.length > 0 ? `Lengkapi data · ${gaps.length} belum terisi` : 'Data prospek'}
      </SectionTitle>

      {gaps.length > 0 ? (
        <div className="rounded-8 bg-orange-50 px-12 py-8 text-12 text-orange-500">
          Belum bisa diajukan: {gaps.join(', ').toLowerCase()}.
        </div>
      ) : null}

      <Card>
        <div className="flex flex-col gap-16">
          <Input
            label="Alamat rumah"
            placeholder="Kampung, RT / RW"
            value={lead.address}
            onChange={(e) => set({ address: e.target.value })}
            state={lead.address ? 'valid' : 'default'}
          />

          <ChipGroup label="Majelis tujuan">
            {MAJELIS_DIRECTORY.map((m) => (
              <Chip
                key={m.id}
                selected={lead.majelisId === m.id}
                onClick={() => set({ majelisId: m.id })}
              >
                {m.name}
              </Chip>
            ))}
          </ChipGroup>
          {lead.majelisId ? (
            <span className="text-12 text-caption">
              {findMajelisEntry(lead.majelisId).day}, {findMajelisEntry(lead.majelisId).time} ·{' '}
              {findMajelisEntry(lead.majelisId).place}
            </span>
          ) : null}

          {/* The single biggest reason a lead stalls, and the reason a
              follow-up gets DATED rather than repeated: an existing loan is not
              a no, it is a no until a month the BP can write down. */}
          <ChipGroup label="Pinjaman lain yang berjalan">
            <Chip
              selected={lead.hasOtherLoan === false}
              onClick={() => set({ hasOtherLoan: false, otherLoan: null })}
            >
              Tidak ada
            </Chip>
            <Chip selected={lead.hasOtherLoan === true} onClick={() => setOtherLoan({})}>
              Ada
            </Chip>
          </ChipGroup>

          {lead.hasOtherLoan ? (
            <div className="flex flex-col gap-16 rounded-12 bg-neutral-50 p-12">
              <ChipGroup label="Dari mana">
                {LENDERS.map((lender) => (
                  <Chip
                    key={lender}
                    selected={lead.otherLoan?.lender === lender}
                    onClick={() => setOtherLoan({ lender })}
                  >
                    {lender}
                  </Chip>
                ))}
              </ChipGroup>
              <Input
                label="Sisa pinjaman"
                prefix="Rp"
                inputMode="numeric"
                value={lead.otherLoan?.amount ? String(lead.otherLoan.amount) : ''}
                onChange={(e) =>
                  setOtherLoan({ amount: Number(e.target.value.replace(/\D/g, '')) || 0 })
                }
              />
              <Input
                label="Perkiraan lunas"
                placeholder="Oktober 2026"
                value={lead.otherLoan?.ends ?? ''}
                onChange={(e) => setOtherLoan({ ends: e.target.value })}
                helperText="Ini yang menentukan kapan dia pantas dihubungi lagi."
              />
            </div>
          ) : null}

          <Input
            label="Catatan"
            optionalText="opsional"
            placeholder="Usahanya apa, kebutuhannya apa"
            value={lead.note}
            onChange={(e) => set({ note: e.target.value })}
          />
        </div>
      </Card>

      {lead.source === 'referral' ? (
        <StatRows
          rows={[
            { label: 'Perujuk', value: lead.referredBy || '—' },
            { label: 'Hubungan', value: referralKindLabel(lead.referralKind) },
          ]}
        />
      ) : null}

      {lead.hasOtherLoan && lead.otherLoan ? (
        <StatRows
          rows={[
            { label: 'Pinjaman berjalan', value: lead.otherLoan.lender || '—' },
            { label: 'Sisa', value: rupiah(lead.otherLoan.amount) },
            { label: 'Perkiraan lunas', value: lead.otherLoan.ends || '—', tone: 'orange' },
          ]}
        />
      ) : null}

      {/* --- The history. Oldest first, because it reads as a story of a
          relationship and a relationship does not run backwards. */}
      <SectionTitle>Riwayat kontak</SectionTitle>
      <Card>
        <div className="flex flex-col gap-12">
          {lead.log.map((entry, i) => (
            <div
              key={`${entry.at}-${i}`}
              className={`flex flex-col gap-2 ${i === 0 ? '' : 'border-t border-default pt-12'}`}
            >
              <span className="flex items-center gap-8">
                <span className="text-12 font-bold text-default">{entry.at}</span>
                <Badge intent="neutral" variant="outline" size="sm">
                  {entry.via === 'sosialisasi'
                    ? 'Sosialisasi'
                    : entry.via === 'wa'
                      ? 'WhatsApp'
                      : 'Telepon'}
                </Badge>
              </span>
              <span className="text-12 text-default">{entry.outcome}</span>
              {entry.note ? <span className="text-12 text-caption">{entry.note}</span> : null}
            </div>
          ))}
        </div>
      </Card>

      <StickyBar>
        {/* Reachable from the record and not only from the schedule. A BP who
            is already reading a prospect should not have to wait for a task to
            be allowed to call her. */}
        <Button
          size="lg"
          className="w-full"
          disabled={lead.stage === 'siap'}
          onClick={() => {
            store.openFollowUp(lead.id)
            flow.go('follow-up')
          }}
        >
          {lead.stage === 'siap' ? 'Sudah diajukan' : 'Follow Up Sekarang'}
        </Button>
      </StickyBar>
    </Screen>
  )
}
