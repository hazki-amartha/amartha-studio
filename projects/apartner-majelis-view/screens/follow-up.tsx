'use client'

// Follow Up — the call that decides what becomes of a prospect.
//
// It is the same shape as a home visit and for the same reason: both are one
// person, both branch on whether you reached her at all, and both are worthless
// unless the outcome carries a date. So the page asks the tree in one place and
// grows as she answers, exactly as the doorstep does.
//
// Three things this screen insists on that a generic "log a call" form doesn't:
//
// * DID IT LAND is asked first, before minat. Most follow-ups don't connect,
//   and a form that opens on "how interested is she?" makes an unanswered call
//   look like a lead who went cold. They are completely different facts and
//   only one of them is about her.
// * THE BRIEF IS ABOVE THE FORM. What she said last time, and the loan that is
//   the reason she is being called in July rather than April, sit above the
//   controls — a BP dials with the phone at her ear and cannot scroll to
//   remember who this is.
// * SIAP DIAJUKAN IS GATED ON COMPLETE DATA. Handing onboarding a prospect
//   without an address or a majelis is how a qualified lead becomes a ticket.
//   The gate names what's missing and offers the jump to fill it, which is the
//   navigation the draft lives in the store to survive.

import { Badge, Button, Card, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import {
  CONTACT_RESULTS,
  FOLLOW_UP_OPTIONS,
  INTEREST_META,
  INTEREST_ORDER,
  NO_REASONS,
  missingFields,
  type ContactResult,
} from '../lib/leads'
import { LeadIdentityCard } from '../lib/lead-card'
import { findMajelisEntry } from '../lib/schedule'
import { openLead, store, useApp } from '../lib/store'
import { Chip, ChipGroup, SectionTitle, StickyBar, VisitTitle } from '../lib/ui'

const NEXT_STEPS: { value: 'siap' | 'lanjut' | 'tidak'; title: string; description: string }[] = [
  {
    value: 'siap',
    title: 'Siap diajukan',
    description: 'Serahkan ke onboarding — masuk hitungan mitra baru bulan ini',
  },
  { value: 'lanjut', title: 'Follow up lagi', description: 'Masih tertarik, belum waktunya' },
  { value: 'tidak', title: 'Tidak tertarik', description: 'Tutup prospek dengan alasan' },
]

/** Why the number didn't work. Only one of these is recoverable. */
const WRONG_NUMBER_NOTE =
  'Prospek ditutup. Jika ada nomor lain dari perujuk atau tetangga, catat di bawah dan buat prospek baru.'

export function FollowUpScreen() {
  const flow = useFlow()
  const s = useApp()
  const lead = openLead(s)
  const draft = s.followUp
  const gaps = missingFields(lead)
  const lastLog = lead.log[lead.log.length - 1]
  const rostered = s.activeTask !== null

  const set = (patch: Parameters<typeof store.setFollowUpDraft>[0]) => store.setFollowUpDraft(patch)

  const connected = draft.contact === 'terhubung'
  const retry = draft.contact === 'tidak-diangkat'
  const dead = draft.contact === 'nomor-salah'

  // "Siap diajukan" is the only outcome the record can veto.
  const canQualify = gaps.length === 0

  const ready =
    draft.contact !== null &&
    (dead ||
      (retry && draft.followUpPicked) ||
      (connected &&
        draft.interest !== null &&
        ((draft.next === 'siap' && canQualify) ||
          (draft.next === 'lanjut' && draft.followUpPicked) ||
          (draft.next === 'tidak' && draft.reason !== ''))))

  function save() {
    if (!ready) return

    const stage = dead || draft.next === 'tidak' ? 'tidak' : draft.next === 'siap' ? 'siap' : 'follow-up'

    const outcome = dead
      ? 'Nomor tidak aktif · prospek ditutup'
      : retry
        ? `Tidak diangkat · coba lagi ${draft.followUpAt ?? 'belum dijadwalkan'}`
        : draft.next === 'siap'
          ? 'Terhubung · siap diajukan ke onboarding'
          : draft.next === 'tidak'
            ? `Terhubung · tidak tertarik — ${draft.reason}`
            : `Terhubung · ${draft.interest ? INTEREST_META[draft.interest].label.toLowerCase() : 'minat dicatat'} · follow up ${draft.followUpAt ?? 'belum dijadwalkan'}`

    store.recordFollowUp(lead.id, {
      contact: draft.contact as ContactResult,
      via: draft.via,
      // An unanswered call says nothing about how interested she is, so it must
      // not overwrite the grade her last real conversation earned.
      interest: connected ? draft.interest : null,
      stage,
      reason: draft.next === 'tidak' ? draft.reason : dead ? 'Nomor tidak aktif' : draft.reason,
      followUpAt: stage === 'follow-up' ? draft.followUpAt : null,
      followUpTomorrow: stage === 'follow-up' && draft.followUpAt === '22 Juli',
      note: draft.note,
      outcome,
    })

    // Only a rostered call closes a row on the day. The same follow-up reached
    // from her record page is real work with no task behind it.
    if (rostered) {
      store.finishTask()
      flow.go('today')
    } else {
      flow.go('lead')
    }
  }

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={lead.name} when="Follow up · Selasa, 11.45" />}
          onBack={() => flow.go(rostered ? 'today' : 'lead')}
        />
      }
    >
      {/* Tapping WhatsApp or the handset records the channel, so the log says
          how she was reached rather than assuming. */}
      <LeadIdentityCard lead={lead} onContact={(via) => set({ via })} />

      {/* --- The brief. Everything the BP needs in her head before the line
          connects, and nothing she needs afterwards. */}
      <Card>
        <div className="flex flex-col gap-8">
          <span className="text-14 font-bold text-default">Sebelum menghubungi</span>
          {lastLog ? (
            <div className="flex flex-col gap-2 rounded-8 bg-neutral-50 px-12 py-8">
              <span className="text-12 font-bold text-default">
                {lastLog.at} · {lastLog.outcome}
              </span>
              {lastLog.note ? <span className="text-12 text-caption">{lastLog.note}</span> : null}
            </div>
          ) : null}
          {lead.otherLoan ? (
            <span className="text-12 text-default">
              Pinjaman {lead.otherLoan.lender} sisa {rupiah(lead.otherLoan.amount)} · perkiraan
              lunas <span className="font-bold">{lead.otherLoan.ends || 'belum diketahui'}</span>
            </span>
          ) : null}
          {lead.majelisId ? (
            <span className="text-12 text-caption">
              Majelis tujuan {findMajelisEntry(lead.majelisId).name} ·{' '}
              {findMajelisEntry(lead.majelisId).day}, {findMajelisEntry(lead.majelisId).time}
            </span>
          ) : null}
        </div>
      </Card>

      {/* --- Did it land. Asked before anything about her. */}
      <SectionTitle>Hasil kontak</SectionTitle>
      <div className="flex flex-col gap-8">
        {CONTACT_RESULTS.map((option) => (
          <SelectableCard
            key={option.value}
            name="hasil-kontak"
            inputType="radio"
            title={option.title}
            description={option.description}
            checked={draft.contact === option.value}
            onChange={() =>
              set({
                contact: option.value,
                next: null,
                reason: '',
                followUpAt: null,
                followUpPicked: false,
              })
            }
          />
        ))}
      </div>

      {/* --- Nobody answered. One question: when to try again. */}
      {retry ? (
        <Card>
          <ChipGroup label="Coba lagi kapan">
            {FOLLOW_UP_OPTIONS.filter((o) => o.value !== null).map((option) => (
              <Chip
                key={option.label}
                selected={draft.followUpPicked && draft.followUpAt === option.value}
                onClick={() => set({ followUpAt: option.value, followUpPicked: true })}
              >
                {option.label}
              </Chip>
            ))}
          </ChipGroup>
        </Card>
      ) : null}

      {dead ? (
        <Card>
          <div className="flex flex-col gap-12">
            <span className="text-12 text-default">{WRONG_NUMBER_NOTE}</span>
            <Input
              label="Nomor alternatif"
              optionalText="opsional"
              inputMode="tel"
              placeholder="08xx-xxxx-xxxx"
              value={draft.note}
              onChange={(e) => set({ note: e.target.value })}
            />
          </div>
        </Card>
      ) : null}

      {/* --- She answered. Now the two questions that are actually about her. */}
      {connected ? (
        <>
          <SectionTitle>Minat sekarang</SectionTitle>
          <Card>
            <div className="flex flex-col gap-8">
              <div className="flex flex-wrap gap-8">
                {INTEREST_ORDER.map((level) => (
                  <Chip
                    key={level}
                    selected={draft.interest === level}
                    onClick={() =>
                      set({
                        interest: level,
                        // A "tidak tertarik" grade has exactly one honest next
                        // step, so pre-select it instead of letting the two
                        // controls contradict each other.
                        next: level === 'tidak' ? 'tidak' : draft.next === 'tidak' ? null : draft.next,
                      })
                    }
                  >
                    {INTEREST_META[level].label}
                  </Chip>
                ))}
              </div>
              {lead.interest && draft.interest && draft.interest !== lead.interest ? (
                <span className="text-12 text-caption">
                  Berubah dari {INTEREST_META[lead.interest].label.toLowerCase()} sejak{' '}
                  {lastLog?.at ?? 'kontak terakhir'}.
                </span>
              ) : null}
            </div>
          </Card>

          {draft.interest ? (
            <>
              <SectionTitle>Langkah berikutnya</SectionTitle>
              <div className="flex flex-col gap-8">
                {NEXT_STEPS.map((step) => (
                  <SelectableCard
                    key={step.value}
                    name="langkah"
                    inputType="radio"
                    title={step.title}
                    description={step.description}
                    checked={draft.next === step.value}
                    onChange={() => set({ next: step.value, reason: '', followUpPicked: false })}
                  />
                ))}
              </div>
            </>
          ) : null}

          {/* The gate. It names the gap and offers the fix rather than just
              refusing — a disabled button with no explanation is how a BP
              concludes the app is broken and phones her BM instead. */}
          {draft.next === 'siap' && !canQualify ? (
            <Card>
              <div className="flex flex-col gap-12">
                <span className="text-12 text-default">
                  Belum bisa diajukan — {gaps.join(', ').toLowerCase()} masih kosong.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => flow.go('lead')}
                >
                  Lengkapi Data Prospek
                </Button>
              </div>
            </Card>
          ) : null}

          {draft.next === 'siap' && canQualify ? (
            <div className="rounded-8 bg-green-50 px-12 py-8 text-12 text-green-500">
              Data lengkap. Prospek diteruskan ke onboarding dan dihitung pada target pencairan
              mitra baru bulan ini.
            </div>
          ) : null}

          {draft.next === 'lanjut' ? (
            <Card>
              <div className="flex flex-col gap-16">
                <ChipGroup label="Hubungi lagi kapan">
                  {FOLLOW_UP_OPTIONS.filter((o) => o.value !== null).map((option) => (
                    <Chip
                      key={option.label}
                      selected={draft.followUpPicked && draft.followUpAt === option.value}
                      onClick={() => set({ followUpAt: option.value, followUpPicked: true })}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </ChipGroup>
                {/* The date is only useful if the next BP knows what it is
                    waiting for. "Oktober" is a guess; "after the BRI loan
                    finishes" is a reason that survives the date moving. */}
                <Input
                  label="Menunggu apa"
                  optionalText="opsional"
                  placeholder="Setelah pinjaman BRI lunas"
                  value={draft.reason}
                  onChange={(e) => set({ reason: e.target.value })}
                />
              </div>
            </Card>
          ) : null}

          {draft.next === 'tidak' ? (
            <Card>
              <ChipGroup label="Alasan">
                {NO_REASONS.map((option) => (
                  <Chip
                    key={option}
                    selected={draft.reason === option}
                    onClick={() => set({ reason: option })}
                  >
                    {option}
                  </Chip>
                ))}
              </ChipGroup>
            </Card>
          ) : null}
        </>
      ) : null}

      {!dead && draft.contact ? (
        <Input
          label="Catatan"
          optionalText="opsional"
          placeholder="Apa yang dia katakan"
          value={draft.note}
          onChange={(e) => set({ note: e.target.value })}
        />
      ) : null}

      <StickyBar>
        {draft.followUpPicked && draft.followUpAt === '22 Juli' ? (
          <div className="flex items-center gap-8">
            <span className="flex-1 text-12 text-caption">Masuk jadwal besok</span>
            <Badge intent="primary" size="sm">
              22 Juli
            </Badge>
          </div>
        ) : null}
        <Button size="lg" className="w-full" disabled={!ready} onClick={save}>
          Simpan & Selesai
        </Button>
      </StickyBar>
    </Screen>
  )
}
