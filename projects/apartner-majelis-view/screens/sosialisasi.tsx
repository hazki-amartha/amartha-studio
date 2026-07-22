'use client'

// Sosialisasi — the lead-generation stop, and the first task on this day that
// is not about a woman who already borrows.
//
// The screen commits to one shape: a counter, a button, and the names taken so
// far. That is the whole event. A BP standing in Bu Ipah's warung with ten
// women in front of her is not reading a dashboard — she is adding a name,
// looking up, and adding the next one, and the only thing she needs the phone
// to tell her between names is how many she has.
//
// Which is why the target is on screen and not on a report. "4 dari 10" at
// 14.30 is a BP who works the room for another hour; the same fact discovered
// at 17.00 is a BP who goes home short. A count that only exists after the
// event is a count that cannot change the event.
//
// Capture is the QUICK tier only (see `leads.ts`) and it opens in a fullscreen
// sheet rather than a page, because the list behind it IS the context — she is
// adding to something visible, and the count she is working toward should not
// disappear the moment she starts typing.

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  FOLLOW_UP_OPTIONS,
  INTEREST_META,
  INTEREST_ORDER,
  NO_REASONS,
  REFERRAL_KINDS,
  type Interest,
  type LeadSource,
  type ReferralKind,
} from '../lib/leads'
import { LeadRow } from '../lib/lead-card'
import { IconPin, IconUserPlus } from '../lib/icons'
import { eventProgress, leadsOfEvent, openEvent, store, useApp } from '../lib/store'
import { Chip, ChipGroup, ProgressCard, SectionTitle, StickyBar, VisitTitle } from '../lib/ui'

const SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'sosialisasi', label: 'Hadir di sosialisasi' },
  { value: 'referral', label: 'Referral' },
]

export function SosialisasiScreen() {
  const flow = useFlow()
  const s = useApp()
  const event = openEvent(s)
  const leads = leadsOfEvent(s, event.id)
  const progress = eventProgress(s, event)
  const [adding, setAdding] = useState(false)

  function finish() {
    store.finishTask()
    flow.go('today')
  }

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={event.title} when="Sosialisasi · Selasa, 14.00" />}
          onBack={() => flow.go('today')}
        />
      }
    >
      <ProgressCard
        title="Prospek terkumpul"
        value={String(progress.captured)}
        of={`${progress.target} target`}
        percent={progress.percent}
        tone={progress.captured >= progress.target ? 'green' : 'primary'}
      />

      <Card>
        <div className="flex flex-col gap-12">
          <span className="flex items-start gap-4 text-12 text-caption">
            <span className="shrink-0">
              <IconPin size={16} />
            </span>
            {event.place}
          </span>
          {/* The only control that adds anything, and it stays above the list
              rather than under it: at name seven the list is longer than the
              screen, and a button that walks down the page as the BP succeeds
              is a button that gets harder to hit the better she does. */}
          <Button size="md" className="w-full" onClick={() => setAdding(true)}>
            <span className="flex items-center justify-center gap-8">
              <IconUserPlus size={20} />
              Tambah Prospek
            </span>
          </Button>
        </div>
      </Card>

      {leads.length > 0 ? (
        <>
          <SectionTitle>Prospek hari ini</SectionTitle>
          <div className="flex flex-col gap-8">
            {leads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                onOpen={() => {
                  store.openLeadPage(lead.id)
                  flow.go('lead')
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="text-14 font-bold text-default">Belum ada prospek</span>
            <span className="text-12 text-caption">
              Catat nama dan nomor WhatsApp setiap ibu yang tertarik. Data lengkapnya bisa
              menyusul saat follow up.
            </span>
          </div>
        </Card>
      )}

      <StickyBar>
        <div className="flex items-center gap-8">
          <span className="flex-1 text-12 text-caption">
            {progress.captured >= progress.target
              ? 'Target tercapai'
              : `Kurang ${progress.target - progress.captured} prospek dari target`}
          </span>
          <Badge intent={progress.captured >= progress.target ? 'green' : 'orange'} size="sm">
            {progress.captured}/{progress.target}
          </Badge>
        </div>
        {/* Not gated on the target. A sosialisasi where four women turned up is
            a finished sosialisasi, and a button that refuses to close it would
            only teach the BP to invent six names. */}
        <Button size="lg" className="w-full" onClick={finish}>
          Selesaikan Sosialisasi
        </Button>
      </StickyBar>

      <AddLeadSheet open={adding} onClose={() => setAdding(false)} />
    </Screen>
  )
}

/**
 * The quick tier, and every field in it is one a woman answers out loud in a
 * crowded room. Address, competing loans and destination majelis are all
 * deliberately absent: they need her to think, and asking them here is how a
 * BP gets four leads instead of ten.
 *
 * `useState` is safe in a way it is not anywhere else in this project — the
 * sheet never navigates, so the draft cannot outlive a `go()`. It is committed
 * to the store in one act, at "Simpan".
 */
function AddLeadSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [source, setSource] = useState<LeadSource>('sosialisasi')
  const [referredBy, setReferredBy] = useState('')
  const [referralKind, setReferralKind] = useState<ReferralKind | null>(null)
  const [interest, setInterest] = useState<Interest | null>(null)
  const [followUp, setFollowUp] = useState<string | null>(null)
  const [followUpPicked, setFollowUpPicked] = useState(false)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  // A no is a result, so it asks for a reason instead of a date. Everything
  // else asks when to come back — which is the field this whole flow exists
  // for, since "tertarik" with no date is the lead nobody ever calls.
  const refused = interest === 'tidak'
  const ready =
    name.trim().length > 1 &&
    phone.trim().length > 5 &&
    interest !== null &&
    (refused ? reason !== '' : followUpPicked) &&
    (source === 'sosialisasi' || (referredBy.trim() !== '' && referralKind !== null))

  function reset() {
    setName('')
    setPhone('')
    setSource('sosialisasi')
    setReferredBy('')
    setReferralKind(null)
    setInterest(null)
    setFollowUp(null)
    setFollowUpPicked(false)
    setReason('')
    setNote('')
  }

  function save() {
    if (!ready || !interest) return
    store.addLead({
      name,
      phone,
      source,
      referredBy,
      referralKind,
      interest,
      followUpAt: refused ? null : followUp,
      followUpTomorrow: !refused && followUp === '22 Juli',
      note: refused ? [reason, note].filter(Boolean).join(' — ') : note,
    })
    reset()
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      size="fullscreen"
      title="Tambah Prospek"
      primaryAction={
        <Button size="lg" className="w-full" disabled={!ready} onClick={save}>
          Simpan Prospek
        </Button>
      }
    >
      <div className="flex flex-col gap-16">
        <Input
          label="Nama"
          required
          placeholder="Nama lengkap"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          label="No. WhatsApp"
          required
          inputMode="tel"
          placeholder="08xx-xxxx-xxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          helperText="Satu-satunya cara menghubunginya lagi — pastikan benar."
        />

        <ChipGroup label="Dari mana">
          {SOURCES.map((option) => (
            <Chip
              key={option.value}
              selected={source === option.value}
              onClick={() => setSource(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </ChipGroup>

        {/* A referral's value is the name attached to it, so it is asked here
            and not deferred — it is also the one question the person standing
            in front of her answers instantly. */}
        {source === 'referral' ? (
          <>
            <Input
              label="Direferensikan oleh"
              required
              placeholder="Nama perujuk"
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value)}
            />
            <ChipGroup label="Hubungan perujuk">
              {REFERRAL_KINDS.map((kind) => (
                <Chip
                  key={kind.value}
                  selected={referralKind === kind.value}
                  onClick={() => setReferralKind(kind.value)}
                >
                  {kind.label}
                </Chip>
              ))}
            </ChipGroup>
          </>
        ) : null}

        <ChipGroup label="Tingkat minat">
          {INTEREST_ORDER.map((level) => (
            <Chip
              key={level}
              selected={interest === level}
              onClick={() => {
                setInterest(level)
                setReason('')
              }}
            >
              {INTEREST_META[level].label}
            </Chip>
          ))}
        </ChipGroup>

        {interest && !refused ? (
          <ChipGroup label="Hubungi lagi kapan">
            {FOLLOW_UP_OPTIONS.map((option) => (
              <Chip
                key={option.label}
                selected={followUpPicked && followUp === option.value}
                onClick={() => {
                  setFollowUp(option.value)
                  setFollowUpPicked(true)
                }}
              >
                {option.label}
              </Chip>
            ))}
          </ChipGroup>
        ) : null}

        {refused ? (
          <ChipGroup label="Alasan">
            {NO_REASONS.map((option) => (
              <Chip key={option} selected={reason === option} onClick={() => setReason(option)}>
                {option}
              </Chip>
            ))}
          </ChipGroup>
        ) : null}

        {/* The line that turns a name into a person a month from now. Optional,
            and phrased as a prompt because "Catatan" alone gets left empty. */}
        <Input
          label="Catatan"
          optionalText="opsional"
          placeholder="Usahanya apa, kebutuhannya apa"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {interest && !refused && followUpPicked && followUp === '22 Juli' ? (
          <div className="rounded-8 bg-primary-50 px-12 py-8 text-12 text-primary-500">
            Tugas follow up otomatis masuk ke jadwal besok.
          </div>
        ) : null}
      </div>
    </BottomSheet>
  )
}
