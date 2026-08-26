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
// at 17.00 is a BP who goes home short.
//
// Every prospect captured here IS a Sales lead from THIS POI Visit — so the
// capture form is the Sales "Tambah Lead" form, with its source fixed to this
// sosialisasi's POI, and each save lands a real lead in the pipeline. The list
// and counter show the ones taken in this session.

import { useState } from 'react'
import { Badge, BottomSheet, Button, Card, Input, NavigationHeader } from '@/design-system/components'
import { Camera, FileCheck } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { statusBadge, type MajelisAssignment } from '../lib/pipeline'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { MajelisPickerSheet, assignmentLabel } from '../lib/pipeline-ui'
import { IconUserPlus } from '../lib/icons'
import { openEvent, rescheduleCount, store, useApp } from '../lib/store'
import { AppScreen, PinMark, ProgressCard, RescheduleSheet, SectionTitle, StickyBar, VisitTitle } from '../lib/ui'

export function SosialisasiScreen() {
  const flow = useFlow()
  const s = useApp()
  const { leads } = usePipeline()
  const event = openEvent(s)
  const [rescheduling, setRescheduling] = useState(false)
  const [adding, setAdding] = useState(false)
  // The prospects captured in THIS session — pipeline lead ids, newest last.
  const [capturedIds, setCapturedIds] = useState<string[]>([])
  // Only a rostered sosialisasi has a task to move; opened without one, the
  // reschedule entry point stays off.
  const taskId = s.activeTask

  const captured = capturedIds.map((id) => leads[id]).filter(Boolean)
  const percent = Math.min(100, Math.round((captured.length / event.target) * 100))
  const hit = captured.length >= event.target

  function finish() {
    store.finishTask()
    flow.go('today')
  }

  function reschedule(reason: string, date: string) {
    if (taskId) store.rescheduleTask(taskId, reason, date)
    setRescheduling(false)
    flow.go('today')
  }

  function reject(reason: string) {
    if (taskId) store.rejectTask(taskId, reason)
    setRescheduling(false)
    flow.go('today')
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={event.title} when="Sosialisasi · Selasa, 14.00" />}
          link={taskId ? 'Jadwal ulang' : undefined}
          onLinkClick={taskId ? () => setRescheduling(true) : undefined}
          onBack={() => flow.go('today')}
        />
      }
    >
      <ProgressCard
        title="Prospek terkumpul"
        value={String(captured.length)}
        of={`${event.target} target`}
        percent={percent}
        tone={hit ? 'green' : 'primary'}
      />

      <Card>
        <div className="flex flex-col gap-12">
          <span className="flex items-start gap-4 text-12 text-caption">
            <PinMark />
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

      {captured.length > 0 ? (
        <>
          <SectionTitle>Prospek hari ini</SectionTitle>
          <div className="flex flex-col gap-8">
            {captured.map((lead) => {
              const badge = statusBadge(lead)
              return (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => {
                    pipelineStore.open(lead.id)
                    flow.go('lead-detail')
                  }}
                  className="flex w-full items-center gap-8 rounded-12 bg-neutral-white p-12 text-left active:bg-neutral-50"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="truncate text-14 font-bold text-default">{lead.name}</span>
                    <span className="truncate text-12 text-caption">{lead.phone}</span>
                  </div>
                  <Badge intent={badge.intent}>{badge.label}</Badge>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="text-14 font-bold text-default">Belum ada prospek</span>
            <span className="text-12 text-caption">
              Catat setiap ibu yang tertarik sebagai lead POI Visit. Data lengkapnya bisa
              menyusul saat follow up.
            </span>
          </div>
        </Card>
      )}

      <StickyBar>
        <div className="flex items-center gap-8">
          <span className="flex-1 text-12 text-caption">
            {hit ? 'Target tercapai' : `Kurang ${event.target - captured.length} prospek dari target`}
          </span>
          <Badge intent={hit ? 'green' : 'orange'} size="sm">
            {captured.length}/{event.target}
          </Badge>
        </div>
        {/* Not gated on the target. A sosialisasi where four women turned up is
            a finished sosialisasi, and a button that refuses to close it would
            only teach the BP to invent six names. */}
        <Button size="lg" className="w-full" onClick={finish}>
          Selesaikan Sosialisasi
        </Button>
      </StickyBar>

      <AddProspekSheet
        open={adding}
        onClose={() => setAdding(false)}
        poi={event.poi}
        onSaved={(id) => {
          setCapturedIds((prev) => [...prev, id])
          setAdding(false)
        }}
      />

      <RescheduleSheet
        open={rescheduling}
        onClose={() => setRescheduling(false)}
        subject={event.title}
        subjectNoun="Sosialisasi"
        count={taskId ? rescheduleCount(s, taskId) : 0}
        onConfirm={reschedule}
        onReject={reject}
      />
    </AppScreen>
  )
}

const DEFAULT_MAJELIS: MajelisAssignment = { kind: 'none', branch: 'BP Ciseeng' }

/**
 * The Sales "Tambah Lead" form, adapted for a sosialisasi: Sumber is fixed to
 * this POI Visit (everyone here came from it, so it isn't a question), and each
 * save is a real `pipelineStore.addLead` — a lead sourced from this POI. It
 * lives in a fullscreen sheet, not a page, so the count and list behind it stay
 * in view while the BP works the room name after name.
 */
function AddProspekSheet({
  open,
  onClose,
  poi,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  poi: string
  onSaved: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [majelis, setMajelis] = useState<MajelisAssignment>(DEFAULT_MAJELIS)
  const [nik, setNik] = useState('')
  const [ktp, setKtp] = useState(false)
  const [picking, setPicking] = useState(false)

  const ready = name.trim() !== '' && phone.trim() !== ''

  function reset() {
    setName('')
    setPhone('')
    setMajelis(DEFAULT_MAJELIS)
    setNik('')
    setKtp(false)
    setPicking(false)
  }

  function save() {
    if (!ready) return
    const id = pipelineStore.addLead({
      name,
      phone,
      source: 'poi',
      poi,
      referredBy: '',
      referrerKind: null,
      majelis,
      nik,
      ktp,
    })
    reset()
    onSaved(id)
  }

  return (
    <>
      <BottomSheet
        open={open && !picking}
        onClose={() => {
          reset()
          onClose()
        }}
        size="fullscreen"
        title="Tambah Prospek"
        primaryAction={
          <Button size="lg" className="w-full" disabled={!ready} onClick={save}>
            Simpan Prospek
          </Button>
        }
      >
        <div className="flex flex-col gap-16">
          <div className="flex flex-col gap-12">
            <Input
              label="Nama"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama calon mitra"
            />
            <Input
              label="No. HP"
              required
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xx-xxxx-xxxx"
            />
          </div>

          {/* Sumber is fixed — everyone captured at this sosialisasi came from
              this POI Visit, so it is shown as a locked, pre-selected source
              rather than a choice. */}
          <div className="flex flex-col gap-4">
            <span className="text-12 text-caption">Sumber</span>
            <div className="flex flex-col gap-2 rounded-8 border border-primary-500 bg-primary-50 px-12 py-12">
              <span className="text-14 font-bold text-default">POI Visit</span>
              <span className="text-12 text-caption">{poi}</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-12 text-caption">Majelis</span>
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="flex items-center justify-between gap-8 rounded-8 border border-default bg-neutral-white px-12 py-12 text-left text-14 text-default"
            >
              <span className="truncate">{assignmentLabel(majelis)}</span>
              <span className="shrink-0 text-12 font-bold text-link">Ubah</span>
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-12 text-caption">KTP</span>
            <div className="flex flex-col gap-12">
              <span className="text-12 text-caption">
                Lampirkan KTP sekarang agar lead langsung jadi Qualified. Tanpa KTP, lead masuk
                sebagai Unqualified.
              </span>
              {ktp ? (
                <div className="flex items-center gap-8 rounded-8 border border-default bg-neutral-white px-12 py-8 text-12">
                  <span className="text-green-500">
                    <FileCheck size={20} />
                  </span>
                  <span className="flex-1 text-default">Foto KTP terlampir</span>
                  <button
                    type="button"
                    onClick={() => setKtp(false)}
                    className="shrink-0 text-12 font-bold text-link"
                  >
                    Hapus
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setKtp(true)}
                  className="flex w-full flex-col items-center gap-4 rounded-8 border border-default bg-canvas-blue p-16 text-caption"
                >
                  <Camera size={24} />
                  <span className="text-14 text-default">Upload Foto KTP</span>
                </button>
              )}
              <Input
                label="NIK (16 digit)"
                optionalText="opsional"
                inputMode="numeric"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="Masukkan 16 digit NIK"
              />
            </div>
          </div>
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
