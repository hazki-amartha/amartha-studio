'use client'

// Home visit, step 1 of 3 — Kunjungi. Per the BP APP 2026 Figma.
//
// A white panel over the grey floor: the stage bar, then "Kontak & alamat" —
// the mitra and her penanggung jawab, each with WhatsApp and a route, and her
// three addresses folded behind "Selengkapnya". Under it, the one question the
// visit turns on: "Siapa yang ditemui?".
//
// Anyone but the mitra herself opens "Kenapa mitra tidak bisa ditemui?", and
// the answer is read back inside the picked card. A mitra visited before also
// shows her janji bayar and the latest home visit, with "Lihat semua" opening
// the full history (home-history.tsx). "Tidak ada orang" skips Tagih
// entirely — the visit goes straight to Kirim bukti with Tagih marked Dilewati.

import { useState, type ReactNode } from 'react'
import { BottomSheet, Button, Modal } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { joinOther, reasonDone, splitOther } from '../lib/collect-options'
import { ArrowRight, Door } from '@/design-system/icons'
import { rupiah } from '../lib/data'
import { ContactRow } from '../lib/home-card'
import { pastHomeVisits } from '../lib/home-history'
import { DAYS } from '../lib/schedule'
import { HomeReschedule, HomeTopBar, homeTaskState } from '../lib/home-visit-ui'
import { BusinessPhoto, HousePhoto, JanjiBayarCard, MitraPhoto, mapsUrl } from '../lib/mitra-card'
import { profileOf } from '../lib/profile'
import { openHomeMitra, openHomeTask, store, useApp, type MetWith } from '../lib/store'
import {
  ChoiceList,
  ContactButton,
  HOME_STAGE_LABELS,
  PickRow,
  PinMark,
  ProductBadge,
  ReasonNote,
  SectionTitle,
  StageBar,
  StickyBar,
} from '../lib/ui'
import { IconChevronDown, IconChevronUp } from '../lib/icons'

const WHO: { value: MetWith; title: string; description: string }[] = [
  { value: 'mitra', title: 'Mitra sendiri', description: 'Pembayaran dilakukan langsung oleh mitra.' },
  { value: 'pj', title: 'Penanggung jawab', description: 'Pembayaran akan dicatat atas nama mitra.' },
  { value: 'keluarga', title: 'Anggota keluarga', description: 'Pembayaran akan dicatat atas nama mitra.' },
  { value: 'nobody', title: 'Tidak ada orang', description: 'Tidak ada pembayaran hari ini.' },
]

// Why the mitra could not be met — the same list whoever answered the door.
const ABSENCE_REASONS = [
  'Sedang bekerja/berdagang',
  'Ada keperluan pribadi/keluarga',
  'Pindah rumah',
  'Pergi tanpa kabar',
  'Sakit',
  'Meninggal dunia',
  'Lainnya',
]

export function HomeBriefScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)
  const task = openHomeTask(s)
  const profile = profileOf(mitra)
  const pjName = profile.pjName.replace(/^Bapak\s+/, '')
  const address = task?.place ?? profile.address

  const met = s.metWith[mitra.id]
  const { done, sent } = homeTaskState(s)
  const lastVisit = pastHomeVisits(mitra.id)[0]
  const reason = s.mitraAbsence[mitra.id]

  const [expanded, setExpanded] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [rescheduling, setRescheduling] = useState(false)

  // The reason sheet, and its draft: the pick only lands on "Lanjut", so
  // "Batal" leaves the page as it was.
  const [asking, setAsking] = useState<MetWith | null>(null)
  const [draft, setDraft] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')

  function pick(value: MetWith) {
    if (value === 'mitra') {
      store.setMetWith(mitra.id, 'mitra')
      return
    }
    const onFile = splitOther(met === value ? reason : undefined)
    setDraft(onFile.pick)
    setDraftText(onFile.text)
    setAsking(value)
  }

  function confirmReason() {
    if (!asking || !reasonDone(draft, draftText)) return
    store.setMetWith(mitra.id, asking)
    store.setMitraAbsence(mitra.id, joinOther(draft, draftText) as string)
    setAsking(null)
  }

  const canContinue = met === 'mitra' || (met !== undefined && Boolean(reason))

  return (
    <Screen
      className="bg-canvas-blue"
      topBar={<HomeTopBar onReschedule={() => setRescheduling(true)} />}
    >
      <div className="-mx-16 -mt-16 flex flex-col gap-12 rounded-b-16 border-b border-default bg-neutral-white p-16">
        <StageBar current={1} labels={HOME_STAGE_LABELS} complete={done} />

        <span className="pt-4 text-12 font-bold text-default">Kontak &amp; alamat</span>

        <ContactRow
          avatar={<MitraPhoto src={profile.photo} onClick={() => setLightbox(profile.photo)} />}
          name={mitra.name}
          subtitle={<ProductBadge product={mitra.product} />}
          onOpen={() => {
            store.openMitraPage(mitra.id)
            flow.go('mitra')
          }}
          mapHref={mapsUrl(address)}
          mapLabel={`Buka lokasi rumah ${mitra.name} di peta`}
          waLabel={`WhatsApp ${mitra.name}`}
        />
        <div className="border-t border-default" />
        <ContactRow
          avatar={<MitraPhoto src={profile.pjPhoto} onClick={() => setLightbox(profile.pjPhoto)} />}
          name={pjName}
          subtitle={<span className="text-caption">Penanggung jawab</span>}
          mapHref={mapsUrl(address)}
          mapLabel={`Buka lokasi ${pjName} di peta`}
          waLabel={`WhatsApp ${pjName}`}
        />

        {expanded ? (
          <>
            <AddressRow
              label="Alamat rumah mitra"
              address={address}
              photo={
                <HousePhoto size={32} src={profile.housePhoto} onClick={() => setLightbox(profile.housePhoto)} />
              }
            />
            <AddressRow
              label="Alamat tempat usaha mitra"
              address={profile.business}
              photo={<BusinessPhoto size={32} />}
            />
            <AddressRow label="Alamat rumah penanggung jawab" address={address} />
          </>
        ) : null}

        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="flex items-center justify-center gap-4 self-center text-14 font-bold text-primary-500"
        >
          {expanded ? 'Tutup' : 'Selengkapnya'}
          {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
        </button>

        {/* Earlier effort on this door, when there is any: the promise on file
            and the latest home visit, with the full list one tap away. */}
        {lastVisit ? (
          <>
            <div className="border-t border-default" />
            <JanjiBayarCard mitra={mitra} date={DAYS[0].date} flat />
            <div className="flex items-start gap-12">
              <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                <Door size={20} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-12 text-caption">Home Visit ke-{lastVisit.no}</span>
                <span className="break-words text-14 font-bold text-default">
                  {lastVisit.paid > 0 ? `Bayar ${rupiah(lastVisit.paid)}` : 'Tidak bayar'} •{' '}
                  {lastVisit.reason}
                </span>
                <button
                  type="button"
                  onClick={() => flow.go('home-history')}
                  className="flex items-center gap-4 self-start pt-4 text-14 font-bold text-primary-500"
                >
                  Lihat semua
                  <ArrowRight size={16} />
                </button>
              </span>
            </div>
          </>
        ) : null}
      </div>

      <SectionTitle>Siapa yang ditemui?</SectionTitle>
      <div role="radiogroup" aria-label="Siapa yang ditemui?" className="flex flex-col gap-8 pb-16">
        {WHO.map((option) => {
          const selected = met === option.value
          return (
            <PickRow
              key={option.value}
              title={option.title}
              description={option.description}
              selected={selected}
              disabled={sent && !selected}
              onSelect={() => (sent ? undefined : pick(option.value))}
              note={
                selected && option.value !== 'mitra' && reason ? (
                  <ReasonNote
                    label="Alasan:"
                    value={reason.replace(/^Lainnya: /, 'Lainnya.\n')}
                    onEdit={sent ? undefined : () => pick(option.value)}
                  />
                ) : undefined
              }
            />
          )
        })}
      </div>

      <StickyBar>
        <Button
          size="lg"
          className="w-full"
          disabled={!canContinue}
          onClick={() => flow.go(met === 'nobody' ? 'home-proof' : 'home-visit')}
        >
          Lanjut
        </Button>
      </StickyBar>

      <BottomSheet
        open={asking !== null}
        onClose={() => setAsking(null)}
        title="Kenapa mitra tidak bisa ditemui?"
        description={
          asking === 'nobody'
            ? 'Pilih alasan tidak ada orang yang bisa ditemui.'
            : 'Pilih alasan mitra tidak di tempat.'
        }
        secondaryAction={
          <Button variant="outline" size="lg" className="w-full" onClick={() => setAsking(null)}>
            Batal
          </Button>
        }
        primaryAction={
          <Button size="lg" className="w-full" disabled={!reasonDone(draft, draftText)} onClick={confirmReason}>
            Lanjut
          </Button>
        }
      >
        <ChoiceList
          hideLabel
          label="Alasan mitra tidak bisa ditemui"
          options={ABSENCE_REASONS}
          value={draft ?? undefined}
          onPick={setDraft}
          other={{ text: draftText, onText: setDraftText }}
        />
      </BottomSheet>

      <Modal open={!!lightbox} onClose={() => setLightbox(null)} size="md">
        {lightbox ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lightbox} alt="" className="w-full rounded-12 object-contain" />
        ) : null}
      </Modal>

      <HomeReschedule open={rescheduling} onClose={() => setRescheduling(false)} />
    </Screen>
  )
}

/** One address in the expanded contact block: caption, address, photo, route. */
function AddressRow({
  label,
  address,
  photo,
}: {
  label: string
  address: string
  photo?: ReactNode
}) {
  return (
    <div className="flex items-start gap-12 border-t border-default pt-12">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-12 text-caption">{label}</span>
        <span className="break-words text-14 text-default">{address}</span>
      </div>
      {photo}
      <ContactButton label={`Buka ${label.toLowerCase()} di peta`} tone="red" href={mapsUrl(address)}>
        <PinMark size={20} />
      </ContactButton>
    </div>
  )
}
