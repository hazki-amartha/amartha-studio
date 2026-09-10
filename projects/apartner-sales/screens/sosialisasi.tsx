'use client'

// POI Visit / Sosialisasi — the lead-generation stop.
//
// Two faces, on one screen:
//
//   detail  the POI brief — where she is going, who to ask for, when it is busy,
//           and what the BP already knows about the place. "Start add leads"
//           begins the visit; "Reschedule" moves it.
//   leads   the running list of prospects captured here this visit. Each capture
//           is a real Sales lead sourced from THIS POI (the Add Lead form with
//           its source fixed), so the list fills as she works the room, and
//           "Complete POI Visit" closes the task.

import { useState, type ReactNode } from 'react'
import { Button, Card, NavigationHeader } from '@/design-system/components'
import { MapPin, Phone } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, setAddLeadEntry, usePipeline } from '../lib/pipeline-store'
import { rescheduleCount, store, useApp } from '../lib/store'
import { poiStore, usePois } from '../lib/poi-store'
import { CURRENT_FO, FIELD_OFFICERS, type Agenda } from '../lib/pipeline'
import { PickSheet } from '../lib/pipeline-ui'
import { LeadTaskCard, scheduleLine } from '../lib/tasks'
import { AppScreen, ContactButton, RescheduleSheet, SectionTitle, StickyBar } from '../lib/ui'

// When a BM schedules a POI that has none.
const SCHEDULE_DATES: { label: string; days: number }[] = [
  { label: 'Hari ini', days: 0 },
  { label: 'Besok', days: 1 },
  { label: 'Lusa', days: 2 },
  { label: 'Minggu depan', days: 7 },
]

export function SosialisasiScreen() {
  const flow = useFlow()
  const s = useApp()
  const pois = usePois()
  const { leads, order } = usePipeline()
  const event = pois.find((p) => p.id === s.openEvent) ?? pois[0]
  const stage = s.poiStage
  const isBM = s.role === 'BM'
  const [rescheduling, setRescheduling] = useState(false)
  const [seeMore, setSeeMore] = useState(false)
  const [foOpen, setFoOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const taskId = s.activeTask

  // Every prospect sourced from THIS POI — the ones pre-recorded plus whatever
  // the BP adds this session, since a POI capture lands with its source fixed.
  const captured = order
    .map((id) => leads[id])
    .filter((l) => l && l.source === 'poi' && l.poi === event.poi)

  const completed = s.completedPois.includes(event.id)
  const noSchedule = completed || !event.agenda
  const when = noSchedule ? 'Belum ada jadwal' : scheduleLine(event.agenda, true)
  // A BM can reassign/schedule any POI, but can only run a visit that is hers.
  const canAct = !isBM || event.fo === CURRENT_FO

  function scheduleSosialisasi(days: number) {
    const opt = SCHEDULE_DATES.find((d) => d.days === days)
    const agenda: Agenda = {
      day: days === 0 ? 'today' : 'upcoming',
      kind: 'Sosialisasi POI',
      when: `${opt?.label ?? 'Hari ini'}, 14.00`,
      order: 0,
      dueDays: days,
    }
    poiStore.schedule(event.id, agenda)
    store.uncompletePoi(event.id)
    setScheduleOpen(false)
    pipelineStore.setFlash(`POI Visit ${event.title} dijadwalkan`)
    flow.go('sales')
  }

  function startAddLeads() {
    setAddLeadEntry({
      mode: 'save',
      source: { source: 'poi', poi: event.poi, referredBy: '', referrerKind: null },
      returnTo: 'sosialisasi',
      draft: { name: '', phone: '', nik: '', ktp: false, poi: event.poi },
    })
    store.startPoiLeads()
    flow.go('lead-new')
  }

  function complete() {
    store.completePoi(event.id)
    store.finishTask(taskId ?? undefined)
    pipelineStore.setFlash(`POI Visit ${event.title} selesai`)
    flow.go('sales')
  }

  function reschedule() {
    setRescheduling(false)
    flow.go('sales')
  }

  const topBar = (
    <NavigationHeader
      title="POI Visit"
      link={stage === 'leads' ? 'Lihat detail' : undefined}
      onLinkClick={stage === 'leads' ? () => store.set({ poiStage: 'detail' }) : undefined}
      onBack={() => flow.go('sales')}
    />
  )

  // --- The brief -----------------------------------------------------------
  if (stage === 'detail') {
    return (
      <AppScreen topBar={topBar}>
        <Card>
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-2">
              <span className="text-12 text-caption">{event.poiType}</span>
              <span className="text-16 font-bold text-default">{event.title}</span>
            </div>

            <BriefRow
              label="Alamat"
              action={
                <ContactButton label={`Peta ${event.title}`} tone="red" onClick={() => {}}>
                  <MapPin size={20} />
                </ContactButton>
              }
            >
              {event.address}
            </BriefRow>

            {event.contact ? (
              <BriefRow
                label="Kontak"
                action={
                  event.contactPhone ? (
                    <ContactButton label={`Telepon ${event.contact}`} tone="green" onClick={() => {}}>
                      <Phone size={20} />
                    </ContactButton>
                  ) : undefined
                }
              >
                <span className="flex flex-col">
                  <span>{event.contact}</span>
                  {event.contactPhone ? (
                    <span className="text-12 text-caption">{event.contactPhone}</span>
                  ) : null}
                </span>
              </BriefRow>
            ) : null}

            {event.busyHours ? <BriefRow label="Jam ramai">{event.busyHours}</BriefRow> : null}

            {event.guide ? (
              <BriefRow label="Catatan">
                <span className="flex flex-col items-start gap-2">
                  <span className={seeMore ? '' : 'line-clamp-2'}>{event.guide}</span>
                  {event.guide.length > 90 ? (
                    <button
                      type="button"
                      onClick={() => setSeeMore((v) => !v)}
                      className="text-12 font-bold text-link"
                    >
                      {seeMore ? 'Tutup' : 'Selengkapnya'}
                    </button>
                  ) : null}
                </span>
              </BriefRow>
            ) : null}

            <BriefRow
              label="Petugas"
              action={
                isBM ? (
                  <button
                    type="button"
                    onClick={() => setFoOpen(true)}
                    className="text-12 font-bold text-link"
                  >
                    Ganti
                  </button>
                ) : undefined
              }
            >
              {event.fo ?? '-'}
            </BriefRow>
          </div>
        </Card>

        <StickyBar>
          <div className="flex flex-col gap-2">
            <span className="text-12 text-caption">Jadwal POI Visit</span>
            <span className="text-14 font-bold text-default">{when}</span>
          </div>
          {noSchedule ? (
            // No schedule — a BM can set one; a BP just sees the status.
            isBM ? (
              <Button size="lg" className="w-full" onClick={() => setScheduleOpen(true)}>
                Jadwalkan POI Visit
              </Button>
            ) : (
              <span className="text-center text-12 text-caption">
                Belum ada POI Visit terjadwal untuk POI ini.
              </span>
            )
          ) : (
            <>
              {!canAct ? (
                <span className="text-center text-12 text-caption">
                  POI Visit ini milik {event.fo}. Tugaskan ke dirimu untuk mengerjakannya.
                </span>
              ) : null}
              <Button size="lg" className="w-full" disabled={!canAct} onClick={startAddLeads}>
                Start add leads
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                disabled={!canAct}
                onClick={() => setRescheduling(true)}
              >
                Reschedule
              </Button>
            </>
          )}
        </StickyBar>

        <RescheduleSheet
          open={rescheduling}
          onClose={() => setRescheduling(false)}
          subject={event.title}
          subjectNoun="POI Visit"
          count={taskId ? rescheduleCount(s, taskId) : 0}
          onConfirm={reschedule}
        />

        {/* BM: reassign the POI's petugas. */}
        <PickSheet
          open={foOpen}
          title="Ganti petugas"
          options={FIELD_OFFICERS}
          value={event.fo ?? ''}
          onClose={() => setFoOpen(false)}
          onPick={(f) => {
            poiStore.reassign(event.id, f)
            setFoOpen(false)
          }}
        />

        {/* BM: set a schedule for a POI that has none. */}
        <PickSheet
          open={scheduleOpen}
          title="Jadwalkan POI Visit"
          options={SCHEDULE_DATES.map((d) => d.label)}
          value=""
          onClose={() => setScheduleOpen(false)}
          onPick={(label) => {
            const opt = SCHEDULE_DATES.find((d) => d.label === label)
            if (opt) scheduleSosialisasi(opt.days)
          }}
        />
      </AppScreen>
    )
  }

  // --- The running leads list ----------------------------------------------
  return (
    <AppScreen topBar={topBar}>
      <div className="flex flex-col gap-2">
        <SectionTitle>List leads</SectionTitle>
        <span className="text-12 text-caption">{captured.length} leads tercatat</span>
      </div>

      {captured.length > 0 ? (
        <div className="flex flex-col gap-8">
          {captured.map((lead) => (
            <LeadTaskCard
              key={lead.id}
              lead={lead}
              onOpen={() => {
                pipelineStore.open(lead.id)
                flow.go('follow-up')
              }}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-8 py-24 text-center">
            <span className="text-14 font-bold text-default">Belum ada lead tercatat</span>
            <span className="text-12 text-caption">
              Catat setiap ibu yang tertarik sebagai lead POI Visit.
            </span>
          </div>
        </Card>
      )}

      <Button size="md" variant="outline" className="w-full" disabled={!canAct} onClick={startAddLeads}>
        Add new leads
      </Button>

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!canAct} onClick={complete}>
          Complete POI Visit
        </Button>
      </StickyBar>
    </AppScreen>
  )
}

/** One label-over-value row on the POI brief, with an optional pin / call action. */
function BriefRow({
  label,
  children,
  action,
}: {
  label: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-start gap-8 border-t border-default pt-12">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-12 text-caption">{label}:</span>
        <span className="text-14 text-default">{children}</span>
      </div>
      {action ? <span className="shrink-0">{action}</span> : null}
    </div>
  )
}
