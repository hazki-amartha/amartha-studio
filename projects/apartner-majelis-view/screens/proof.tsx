'use client'

// Bukti kunjungan — the capture that gates submitting.
//
// Both a photo and a recorded location are required. A photo alone does not
// prove the BP was there; it proves she photographed something. Location alone
// proves she was in the right place but not that a majelis happened. Only the
// pair makes a visit verifiable after the fact, which is why they are shown as
// two equal tiles rather than a big photo drop-zone with location as a footnote.
//
// It sits outside the three-stage bar deliberately. Attendance, collection and
// growth are the WORK; proof is the paperwork that closes it, and giving it a
// numbered stage of its own would imply the visit is four things when the
// reference — and the recap that follows — treat it as three.

import { Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MAJELIS, rupiah } from '../lib/data'
import { majelisWhen } from '../lib/schedule'
import { IconCamera, IconPin } from '../lib/icons'
import {
  collectStatus,
  collectedTotal,
  pendingMembers,
  presentCount,
  store,
  useApp,
  openMajelisEntry,
} from '../lib/store'
import { ProofTile, SectionTitle, StatRows, StickyBar, VisitTitle } from '../lib/ui'

export function ProofScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)

  const ready = s.photo && s.geo
  const pending = pendingMembers(s)

  function submit() {
    store.finishTask()
    flow.go('today')
  }

  // Read-back of the three stages, borrowed from apartner-task-first's proof
  // step. It sits BEFORE the capture, not after it: this is the last point where
  // the BP is still doing the visit rather than filing it, so "I forgot to mark
  // Ibu Ani" is still cheap to fix. The recap that follows says what the numbers
  // MEAN for the group; this one only says what she entered.
  const total = MAJELIS.members.length
  const lunas = MAJELIS.members.filter((m) => collectStatus(s, m) === 'lunas').length
  // Only "tertarik" is read back — a no is closed, and it carries its reason on
  // the growth card already. An interest is the item that creates work later.
  const tertarik = MAJELIS.members.filter((m) => s.growthResults[m.id] === 'ya').length

  return (
    <Screen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={group.name} when={majelisWhen(group)} />}
          onBack={() => flow.back()}
        />
      }
    >
      <SectionTitle>Yang sudah dicatat</SectionTitle>

      <StatRows
        rows={[
          { label: 'Kehadiran', value: `${presentCount(s)} dari ${total} hadir` },
          { label: 'Terkumpul', value: rupiah(collectedTotal(s)) },
          { label: 'Lunas', value: `${lunas} dari ${total} mitra` },
          ...(tertarik > 0
            ? [{ label: 'Tertarik penawaran', value: `${tertarik} mitra` }]
            : []),
        ]}
      />

      <SectionTitle>Bukti Pelayanan</SectionTitle>
      <p className="text-12 text-caption">
        Foto kegiatan majelis dan titik lokasi keduanya diperlukan sebelum tugas dikirim.
      </p>

      <div className="flex gap-8">
        <ProofTile
          done={s.geo}
          label="Rekam Lokasi"
          doneLabel="Lokasi terekam"
          icon={<IconPin size={24} />}
          onClick={() => store.setGeo(!s.geo)}
        />
        <ProofTile
          done={s.photo}
          label="Ambil Foto"
          doneLabel="Foto tersimpan"
          icon={<IconCamera size={24} />}
          onClick={() => store.setPhoto(!s.photo)}
        />
      </div>

      {s.geo ? (
        <div className="flex flex-col gap-2 rounded-12 bg-neutral-white p-12">
          <span className="text-12 text-caption">Titik terekam</span>
          <span className="text-14 font-bold text-default">{group.place}</span>
        </div>
      ) : null}

      {/* A warning, not a block. The field decides whether a mitra who never
          turned up is worth waiting for; the app's job is to make sure the BP
          knows what she is about to submit, not to overrule her. */}
      {pending.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-12 border border-orange-200 bg-orange-50 p-12">
          <span className="text-14 font-bold text-orange-500">
            {pending.length} mitra belum ditagih
          </span>
          <span className="text-12 text-caption">
            Tugas tetap bisa dikirim — mitra ini akan tercatat belum ada hasilnya.
          </span>
        </div>
      ) : null}

      <StickyBar>
        {!ready ? (
          <span className="text-center text-12 font-bold text-orange-500">
            {!s.geo && !s.photo
              ? 'Lokasi dan foto belum diambil'
              : !s.geo
                ? 'Lokasi belum direkam'
                : 'Foto belum diambil'}
          </span>
        ) : null}
        {/* Submitting IS the end of the visit. There used to be a "Ringkasan &
            Kirim" page after this one, which re-read numbers this screen already
            reads back and put a second confirmation between the BP and a task
            she has finished. The read-back above is the summary; this button
            files it and returns her to the day. */}
        <Button size="lg" className="w-full" disabled={!ready} onClick={submit}>
          Kirim Laporan
        </Button>
      </StickyBar>
    </Screen>
  )
}
