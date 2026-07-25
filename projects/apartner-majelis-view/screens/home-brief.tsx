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
import {
  BottomSheet,
  Button,
  Input,
  NavigationHeader,
  SelectableCard,
} from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { HomeMitraCard } from '../lib/home-card'
import { mapsUrl } from '../lib/mitra-card'
import { profileOf } from '../lib/profile'
import { openHomeMitra, openHomeTask, store, useApp, type MetWith } from '../lib/store'
import {
  Chip,
  ChipGroup,
  ContactButton,
  HOME_STAGE_LABELS,
  PinMark,
  SectionTitle,
  StageBar,
  StickyBar,
  WaMark,
} from '../lib/ui'

const WHO: { value: MetWith; title: string; description: string }[] = [
  { value: 'mitra', title: 'Mitra sendiri', description: 'Bisa langsung menagih' },
  {
    value: 'pj',
    title: 'Keluarga / penanggung jawab',
    description: 'Titipan dan janji bayar tetap dicatat atas nama mitra',
  },
  { value: 'nobody', title: 'Tidak ada orang', description: 'Tidak ada pembayaran hari ini' },
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

  const met = s.metWith[mitra.id]
  const absent = met === 'nobody'
  const metPj = met === 'pj'
  const note = s.nonPayments[mitra.id]
  const pjReason = s.mitraAbsence[mitra.id]

  // The follow-up ("kenapa mitra tidak ada") opens in a bottom sheet the moment
  // she picks PJ or nobody, rather than growing the page under the options.
  const [sheetOpen, setSheetOpen] = useState(false)

  // Meeting the PJ or finding nobody home both require a reason before she can
  // move on — the record has to say why the borrower was absent.
  const canContinue = met === 'mitra' ? true : metPj ? !!pjReason : absent ? !!note?.reason : false

  const revisitLabel =
    note?.ptp !== undefined ? (PTP_OPTIONS.find((o) => o.value === note?.ptp)?.label ?? null) : null
  const captured = metPj ? pjReason : absent ? note?.reason : undefined

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
            <span className="flex flex-col">
              <span className="text-16 font-bold text-default">{mitra.name}</span>
              <span className="text-12 font-regular text-caption">
                Home visit · Selasa, {task?.time ?? '—'}
              </span>
            </span>
          }
          onBack={() => flow.back()}
        />
      }
    >
      <StageBar current={1} labels={HOME_STAGE_LABELS} />

      {/* --- Mitra info: who she is and who answers for her. Flat on white,
          with room under the stepper, and the penanggung jawab grouped tight
          under its own label so the two read as one block. ----------------- */}
      <section className="flex flex-col gap-16 pt-8">
        <HomeMitraCard
          mitra={mitra}
          address={task?.place ?? ''}
          onOpen={() => {
            store.openMitraPage(mitra.id)
            flow.go('mitra')
          }}
        />

        <div className="flex flex-col gap-8">
          <SectionTitle>Penanggung jawab</SectionTitle>
          <div className="flex items-center gap-12">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="break-words text-14 font-bold text-default">{profile.pjName}</span>
              <span className="flex items-start gap-4 text-12 text-caption">
                <PinMark />
                {task?.place ?? profile.address}
              </span>
            </div>
            <div className="flex shrink-0 gap-8">
              <ContactButton
                label={`Buka lokasi ${profile.pjName} di peta`}
                tone="red"
                href={mapsUrl(task?.place ?? profile.address)}
              >
                <PinMark size={20} />
              </ContactButton>
              <ContactButton label={`WhatsApp ${profile.pjName}`} tone="green">
                <WaMark size={20} />
              </ContactButton>
            </div>
          </div>
        </div>
      </section>

      {/* --- The choice, on its own greyish panel that bleeds to the screen
          edges — the shift from reading about her to recording the visit.
          Grows to fill, so the input zone owns the lower screen. Picking PJ or
          nobody opens the follow-up in a bottom sheet, not inline. ---------- */}
      <section className="-mx-16 flex flex-1 flex-col gap-12 bg-neutral-50 px-16 py-16">
        <div className="flex flex-col gap-8">
          <SectionTitle>Siapa yang ditemui?</SectionTitle>
          <div className="flex flex-col gap-8">
            {WHO.map((option) => (
              <SelectableCard
                key={option.value}
                name="ditemui"
                inputType="radio"
                title={option.title}
                description={option.description}
                checked={met === option.value}
                onChange={() => {
                  store.setMetWith(mitra.id, option.value)
                  setSheetOpen(option.value !== 'mitra')
                }}
              />
            ))}
          </div>
        </div>

        {/* What the sheet captured, and a way back into it. */}
        {met && met !== 'mitra' ? (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12 text-left"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-12 text-caption">
                {absent ? 'Catatan kunjungan' : 'Alasan mitra tidak ada'}
              </span>
              {captured ? (
                <span className="break-words text-14 font-bold text-default">
                  {captured}
                  {absent && revisitLabel ? ` · ${revisitLabel}` : ''}
                </span>
              ) : (
                <span className="text-14 text-placeholder">Belum diisi — ketuk untuk mengisi</span>
              )}
            </div>
            <span className="shrink-0 text-12 font-bold text-primary-500">
              {captured ? 'Ubah' : 'Isi'}
            </span>
          </button>
        ) : null}
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
            <ChipGroup label="Alasan mitra tidak di tempat">
              {PJ_ABSENCE_REASONS.map((option) => (
                <Chip
                  key={option}
                  selected={pjReason === option}
                  onClick={() => store.setMitraAbsence(mitra.id, option)}
                >
                  {option}
                </Chip>
              ))}
            </ChipGroup>
          ) : null}

          {absent ? (
            <>
              <ChipGroup label="Kenapa tidak ada di rumah?">
                {ABSENT_REASONS.map((option) => (
                  <Chip
                    key={option}
                    selected={note?.reason === option}
                    onClick={() => pickReason(option)}
                  >
                    {option}
                  </Chip>
                ))}
              </ChipGroup>

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
                <ChipGroup label="Kunjungan ulang">
                  {PTP_OPTIONS.map((option) => (
                    <Chip
                      key={option.label}
                      selected={note.ptp === option.value}
                      onClick={() => pickPtp(option.value)}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </ChipGroup>
              ) : null}
            </>
          ) : null}

          <Button size="lg" className="w-full" onClick={() => setSheetOpen(false)}>
            Simpan
          </Button>
        </div>
      </BottomSheet>
    </Screen>
  )
}
