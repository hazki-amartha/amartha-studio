'use client'

// Sales · Option B — the BP's day as five jobs, not as a list of names.
//
// An ALTERNATIVE to the Sales page, not a replacement for it: both are on the
// project so the two can be put side by side. Option A lists the work as one
// stream ordered by when it is due; this one groups it by what kind of work it
// is. They disagree about one thing only — whether a BP plans her afternoon by
// the clock or by the job — and that is the question the pair exists to ask.
//
// The page used to be a flat roster of leads. The trouble with a roster is that
// it answers a question the BP does not have: she does not open this page to
// find out who is in her pipeline, she opens it to find out what to do next, and
// "fifteen leads" is not a thing anyone can do. Five of her leads need calling
// back after a month of silence, one is a warung she has to ride to, nine are
// names she has never spoken to — those are three different afternoons, and a
// list sorted by name buries the difference.
//
// So the page is five cards, one per task type, stacked most-urgent first:
//
//   Reactivation           a cold lead whose wait has run out
//   POI Visit              a sosialisasi to ride to
//   2nd Follow Up Referral a referral on her second call — the best odds here
//   1st Follow Up          the second conversation with everyone else
//   New Leads              names nobody has called yet
//
// Each card carries how much of that job is cleared against how much there is,
// so the page is a status of the day before it is a menu. Tapping one opens just
// that group's leads; the flat list still exists, it is simply behind the card
// that says why you would want it.

import {
  ArrowsClockwise,
  Contact,
  FileAdd,
  MapPin,
  PhoneCall,
  Plus,
} from '@/design-system/icons'
import { NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { EVENTS } from '../lib/events'
import {
  TASK_META,
  TASK_ORDER,
  TASK_TARGET,
  taskOf,
  type PipelineLead,
  type SalesTask,
} from '../lib/pipeline'
import { pipelineStore, setAddLeadEntry, usePipeline } from '../lib/pipeline-store'
import { TaskCard, TaskChip } from '../lib/task-card'
import { TabBar } from '../lib/tabs'
import { AppScreen, VisitTitle } from '../lib/ui'

const TASK_ICON: Record<SalesTask, React.ReactNode> = {
  reactivation: <ArrowsClockwise size={24} />,
  'poi-visit': <MapPin size={24} />,
  'followup-2-referral': <Contact size={24} />,
  'followup-1': <PhoneCall size={24} />,
  'new-leads': <FileAdd size={24} />,
}

/**
 * "Cleared" means something different per task, and the card has to say the
 * right one. A follow-up is cleared when the call has happened TODAY; a new lead
 * is cleared when it stops being new; a POI visit is cleared when the visit is
 * done. All three read as "done / total" on the card, and all three would be a
 * lie if the page picked one definition and applied it to everything.
 */
function clearedToday(lead: PipelineLead): boolean {
  return lead.log.some((e) => e.at === '21 Juli' && (e.via === 'telepon' || e.via === 'wa'))
}

export function SalesBScreen() {
  const flow = useFlow()
  const { leads, order } = usePipeline()
  const all = order.map((id) => leads[id])

  const byTask = (task: SalesTask): PipelineLead[] => all.filter((l) => taskOf(l) === task)

  const poiScheduled = EVENTS.filter((e) => e.agenda)
  const poiLeads = all.filter((l) => l.source === 'poi')

  function open(task: SalesTask) {
    pipelineStore.openTaskGroup(task)
    flow.go('task-group')
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          hideBack
          title={<VisitTitle title="Sales" when={`${all.length} leads & ${EVENTS.length} POI`} />}
        />
      }
    >
      {TASK_ORDER.map((task) => {
        const meta = TASK_META[task]
        const rows = byTask(task)

        if (task === 'poi-visit') {
          // The POI card counts VISITS, not leads — it is the only one of the
          // five that sends her somewhere. The chips carry what she needs to
          // know before she gets on the bike: how many stops, that the photo is
          // not optional, and what the last round of them actually produced.
          return (
            <TaskCard
              key={task}
              icon={TASK_ICON[task]}
              tint={meta.tint}
              title={meta.label}
              flow={meta.flow}
              done={0}
              total={poiScheduled.length}
              footer={`${poiScheduled.length} kunjungan terjadwal`}
              chips={
                <>
                  <TaskChip>foto wajib</TaskChip>
                  <TaskChip>{poiLeads.length} lead masuk</TaskChip>
                </>
              }
              onOpen={() => open(task)}
            />
          )
        }

        if (task === 'new-leads') {
          // The one card whose job is to ADD rather than to work through, so it
          // takes a "+" instead of a chevron: the fastest route from opening the
          // app to a name written down is the whole point of the group.
          const target = TASK_TARGET['new-leads']
          const inputToday = all.filter((l) => l.ageDays === 0).length
          return (
            <TaskCard
              key={task}
              icon={TASK_ICON[task]}
              tint={meta.tint}
              title={meta.label}
              flow={`Target input ${target} / hari`}
              done={inputToday}
              total={target}
              footer={`Input hari ini · ${rows.length} belum dihubungi`}
              action={
                <button
                  type="button"
                  aria-label="Tambah lead"
                  onClick={() => {
                    setAddLeadEntry({ mode: 'save', draft: null })
                    flow.go('lead-new')
                  }}
                  className="flex h-40 w-40 items-center justify-center rounded-full bg-primary-500 text-neutral-white"
                >
                  <Plus size={20} />
                </button>
              }
              onOpen={() => open(task)}
            />
          )
        }

        const done = rows.filter(clearedToday).length
        return (
          <TaskCard
            key={task}
            icon={TASK_ICON[task]}
            tint={meta.tint}
            title={meta.label}
            flow={meta.flow}
            done={done}
            total={rows.length}
            footer={
              rows.length === 0
                ? 'Tidak ada tugas hari ini'
                : `${done} dari ${rows.length} sudah dikerjakan hari ini`
            }
            onOpen={() => open(task)}
          />
        )
      })}

      <div className="pb-8" />
      <TabBar active="sales" />
    </AppScreen>
  )
}
