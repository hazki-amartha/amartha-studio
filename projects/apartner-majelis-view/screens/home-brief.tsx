'use client'

// Home visit, step 1 of 3 — Persiapan.
//
// What the BP needs in hand before the door decides the visit:
//
// * how to reach her — the doorstep card, WhatsApp and a handset up top,
//   because a home visit fails most often by simply not reaching her and the
//   fallback is to phone.
// * who answers for her — the penanggung jawab carries his own contact, since
//   he is who the BP calls when the mitra doesn't.
// * who she actually met — the one branch the whole visit turns on ("met mitra?
//   → met PJ? → nobody?").
//
// "Tidak ada orang" is where the flow forks. A locked door has nothing to tagih,
// so the visit note — why nobody was there, and when to come back — is taken
// right here and the Tagih step is skipped: the button goes straight to Bukti &
// Kirim. Meeting the mitra or her PJ instead carries on to Tagih as normal.

import { useState } from 'react'
import { BottomSheet, Button, Input, Modal, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ContactRow, HomeMitraCard } from '../lib/home-card'
import { MitraPhoto, mapsUrl } from '../lib/mitra-card'
import { profileOf } from '../lib/profile'
import {
  openHomeMitra,
  openHomeTask,
  rescheduleCount,
  store,
  useApp,
  type MetWith,
} from '../lib/store'
import {
  HOME_STAGE_LABELS,
  PickRow,
  ProductBadge,
  RescheduleSheet,
  SectionTitle,
  SelectList,
  StageBar,
  StickyBar,
} from '../lib/ui'
import { IconChevronDown, IconChevronUp } from '../lib/icons'

// The description says what the ANSWER means for the record, not what the BP
// can do next: "bisa langsung menagih" told her something she already knew from
// standing there, where "dicatat atas nama mitra" is the fact she is being
// asked to vouch for.
const WHO: { value: MetWith; title: string; description: string }[] = [
  {
    value: 'mitra',
    title: 'Mitra sendiri',
    description: 'Pembayaran dilakukan langsung oleh mitra.',
  },
  {
    value: 'pj',
    title: 'Penanggung jawab/keluarga',
    description: 'Pembayaran akan dicatat atas nama mitra.',
  },
  { value: 'nobody', title: 'Tidak ada orang', description: 'Tidak ada pembayaran hari ini.' },
]

// Why nobody was there. Relocation and death both open a different case
// entirely, which is why "pindah" asks for a new address and "meninggal" needs
// no revisit date.
const ABSENT_REASONS = ['Sedang bekerja', 'Pergi tanpa kabar', 'Pindah rumah', 'Meninggal dunia']

// Why the mitra herself was out when the PJ answered. No "pindah"/"meninggal"
// here: someone from the household is standing at the door, so the case is a
// titipan, not a relocation.
const PJ_ABSENCE_REASONS = ['Sedang bekerja', 'Sedang berdagang', 'Sakit', 'Sedang bepergian']

const PTP_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Besok, 22 Juli', value: '22 Juli' },
  { label: 'Lusa, 23 Juli', value: '23 Juli' },
  { label: 'Minggu depan, 28 Juli', value: '28 Juli' },
  { label: 'Tidak ada janji', value: null },
]

export function HomeBriefScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)
  const task = openHomeTask(s)
  const profile = profileOf(mitra)
  // Shown without the "Bapak" honorific — the name alone is enough on the card.
  const pjName = profile.pjName.replace(/^Bapak\s+/, '')

  const met = s.metWith[mitra.id]
  const absent = met === 'nobody'
  const metPj = met === 'pj'
  const note = s.nonPayments[mitra.id]
  const pjReason = s.mitraAbsence[mitra.id]

  // The follow-up ("kenapa mitra tidak ada") opens in a bottom sheet the moment
  // she picks PJ or nobody, rather than growing the page under the options.
  const [sheetOpen, setSheetOpen] = useState(false)
  // A tapped photo (mitra, house, or PJ) enlarges in a lightbox.
  const [lightbox, setLightbox] = useState<string | null>(null)
  // Moving the whole visit off today, from the first step's top bar.
  const [rescheduling, setRescheduling] = useState(false)
  // Her house and her warung, folded away until asked for. See home-card.tsx.
  const [showPlaces, setShowPlaces] = useState(false)

  function reschedule(reason: string, date: string) {
    store.rescheduleTask(s.openHome, reason, date)
    setRescheduling(false)
    flow.go('today')
  }

  function reject(reason: string) {
    store.rejectTask(s.openHome, reason)
    setRescheduling(false)
    flow.go('today')
  }

  // Meeting the PJ or finding nobody home both require a reason before she can
  // move on — the record has to say why the borrower was absent.
  const canContinue = met === 'mitra' ? true : metPj ? !!pjReason : absent ? !!note?.reason : false

  function pickReason(value: string) {
    store.setNonPayment(mitra, { reason: value, ptp: note?.ptp ?? null })
  }

  function pickPtp(value: string | null) {
    store.setNonPayment(mitra, { reason: note?.reason ?? '', ptp: value })
  }

  return (
    <Screen
      className="bg-neutral-white"
      topBar={
        <NavigationHeader
          title={
            <span className="flex min-w-0 flex-col">
              <span className="flex min-w-0 items-center gap-8">
                <span className="min-w-0 truncate text-16 font-bold text-default">
                  {mitra.name}
                </span>
                <span className="shrink-0">
                  <ProductBadge product={mitra.product} />
                </span>
              </span>
              <span className="text-12 font-regular text-caption">
                Home visit · Selasa, {task?.time ?? '—'}
              </span>
            </span>
          }
          link="Jadwal ulang"
          onLinkClick={() => setRescheduling(true)}
          onBack={() => flow.back()}
        />
      }
    >
      <StageBar current={1} labels={HOME_STAGE_LABELS} />

      {/* --- Who's at this door: the two people the BP may be about to talk to,
          as two rows of the same shape, with her house and warung folded away
          behind "Selengkapnya". The addresses are for getting HERE, and she is
          already here. -------- */}
      <SectionTitle>Kontak &amp; alamat</SectionTitle>
      <section className="flex flex-col gap-12">
        <HomeMitraCard
          mitra={mitra}
          address={task?.place ?? profile.address}
          business={profile.business}
          photo={profile.photo}
          housePhoto={profile.housePhoto}
          expanded={showPlaces}
          onEnlarge={setLightbox}
          onOpen={() => {
            store.openMitraPage(mitra.id)
            flow.go('mitra')
          }}
        />

        <div className="border-t border-default" />

        <ContactRow
          avatar={
            <MitraPhoto src={profile.pjPhoto} onClick={() => setLightbox(profile.pjPhoto)} />
          }
          name={pjName}
          subtitle={<span className="text-caption">Penanggung jawab · {profile.pjRelation}</span>}
          mapHref={mapsUrl(task?.place ?? profile.address)}
          mapLabel={`Buka lokasi ${pjName} di peta`}
          waLabel={`WhatsApp ${pjName}`}
        />

        <button
          type="button"
          onClick={() => setShowPlaces((open) => !open)}
          className="flex items-center justify-center gap-4 self-center text-12 font-bold text-link"
        >
          {showPlaces ? 'Lebih sedikit' : 'Selengkapnya'}
          {showPlaces ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </button>
      </section>

      {/* --- The choice, on its own greyish panel that bleeds to the screen
          edges — the shift from reading about her to recording the visit.
          Grows to fill, so the input zone owns the lower screen. Picking PJ or
          nobody opens the follow-up in a bottom sheet, not inline. ---------- */}
      <section className="-mx-16 flex flex-1 flex-col gap-12 bg-neutral-50 px-16 py-16">
        <div className="flex flex-col gap-8">
          <SectionTitle>Siapa yang ditemui?</SectionTitle>
          <div className="flex flex-col gap-8">
            {WHO.map((option) => {
              const selected = met === option.value
              // A one-line recap of what the sheet captured, shown on the chosen
              // row: the reason, plus the revisit date when nobody was home.
              let summary: string | null = null
              if (selected && option.value === 'pj') {
                summary = pjReason ?? null
              } else if (selected && option.value === 'nobody' && note?.reason) {
                const revisit =
                  note.ptp !== undefined
                    ? (PTP_OPTIONS.find((o) => o.value === note.ptp)?.label ?? null)
                    : null
                summary = revisit ? `${note.reason} · ${revisit}` : note.reason
              }
              return (
                <PickRow
                  key={option.value}
                  title={option.title}
                  description={option.description}
                  detail={summary}
                  selected={selected}
                  onSelect={() => {
                    store.setMetWith(mitra.id, option.value)
                    setSheetOpen(option.value !== 'mitra')
                  }}
                />
              )
            })}
          </div>
        </div>
      </section>

      <StickyBar>
        <Button
          size="lg"
          className="w-full"
          disabled={!canContinue}
          onClick={() => flow.go(absent ? 'home-proof' : 'home-visit')}
        >
          Lanjut
        </Button>
      </StickyBar>

      {/* --- The follow-up, in a sheet. PJ asks only why she was out; nobody
          also asks for a new address (if she moved) and when to come back. --- */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={absent ? 'Catatan kunjungan' : 'Kenapa mitra tidak ada?'}
      >
        <div className="flex flex-col gap-16">
          {metPj ? (
            <SelectList
              label="Alasan mitra tidak di tempat"
              items={PJ_ABSENCE_REASONS.map((option) => ({
                key: option,
                label: option,
                selected: pjReason === option,
                onClick: () => store.setMitraAbsence(mitra.id, option),
              }))}
            />
          ) : null}

          {absent ? (
            <>
              <SelectList
                label="Kenapa tidak ada di rumah?"
                items={ABSENT_REASONS.map((option) => ({
                  key: option,
                  label: option,
                  selected: note?.reason === option,
                  onClick: () => pickReason(option),
                }))}
              />

              {/* Relocation needs more than a label — an address is what turns
                  "pindah" into something ops can act on rather than a dead end. */}
              {note?.reason === 'Pindah rumah' ? (
                <Input
                  label="Alamat baru (jika diketahui)"
                  value={s.newAddress[mitra.id] ?? ''}
                  onChange={(e) => store.setNewAddress(mitra.id, e.target.value)}
                  helperText="Kosongkan jika belum tahu — akan dibuat tugas pelacakan."
                />
              ) : null}

              {/* Asked only once there is a reason: a revisit date with nothing
                  attached to it is not a record of anything. */}
              {note?.reason && note.reason !== 'Meninggal dunia' ? (
                <SelectList
                  label="Kunjungan ulang"
                  items={PTP_OPTIONS.map((option) => ({
                    key: option.label,
                    label: option.label,
                    selected: note.ptp === option.value,
                    onClick: () => pickPtp(option.value),
                  }))}
                />
              ) : null}
            </>
          ) : null}

          {/* The sheet carries the Lanjut itself — fill the reason (and revisit
              date) and move on, without a trip back to the page for a second
              button. The page's own Lanjut stays for the "Mitra sendiri" path,
              which never opens this sheet. */}
          <Button
            size="lg"
            className="w-full"
            disabled={!canContinue}
            onClick={() => flow.go(absent ? 'home-proof' : 'home-visit')}
          >
            Lanjut
          </Button>
        </div>
      </BottomSheet>

      {/* A tapped photo, enlarged. */}
      <Modal open={!!lightbox} onClose={() => setLightbox(null)} size="md">
        {lightbox ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lightbox} alt="" className="w-full rounded-12 object-contain" />
        ) : null}
      </Modal>

      <RescheduleSheet
        open={rescheduling}
        onClose={() => setRescheduling(false)}
        subject={mitra.name}
        count={rescheduleCount(s, s.openHome)}
        onConfirm={reschedule}
        onReject={reject}
      />
    </Screen>
  )
}
