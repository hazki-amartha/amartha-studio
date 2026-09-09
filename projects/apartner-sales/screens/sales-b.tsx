'use client'

// Sales · Option B — the BP's day as five jobs, not as a list of names.
//
// An ALTERNATIVE to the Sales page, not a replacement for it: both are on the
// project so the two can be put side by side. They disagree about one thing —
// whether the pipeline is a list you filter or a day made of jobs.
//
// "Fifteen leads" is not a thing anyone can do. "Five reactivations, one POI
// visit, nine calls" is an afternoon: those are different jobs, done at
// different times, often in different places. So the page is five cards, one
// per task category, each carrying how much of its job is cleared against how
// much there is — a status of the day before it is a menu — with that
// category's own tasks nested inside it.
//
// Nothing on a card drills down. The head is a heading, not a button, and there
// is no chevron: the tasks are already there, so a tap that opened "the group"
// would open what the BP is looking at. The one route out of the day is "Semua
// Leads" in the top bar, which drops the schedule entirely and shows the whole
// pipeline as one filterable list.
//
// POI Visit counts VISITS rather than leads — it is the only group that sends
// her somewhere — but the card is the same card; only what it counts differs.
//
// One card sits apart, at the bottom: Gather New Leads. Every other card counts
// work that already exists and shrinks as she clears it; this one counts work
// she has to CREATE, against a daily input target, and grows as she does. It has
// no task list under it for the same reason — a lead that does not exist yet
// cannot be listed — so where the others carry a stack of tasks it carries one
// full-width button, and it goes last because filling the pipeline is what she
// does with what is left of the afternoon, not what she opens the app for.
//
// That button and the floating "Add lead" are the same action, so they are
// never on screen together: the floating one is the way to add a lead from
// anywhere on the board, and it stands down the moment the card that owns the
// action scrolls into view.

import { useEffect, useRef, useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import {
  ArrowsClockwise,
  Contact,
  FileAdd,
  MapPin,
  Phone,
  PhoneCall,
  Plus,
} from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import {
  TASK_CATEGORY_LABEL,
  TASK_CATEGORY_ORDER,
  buildTasks,
  dueTasks,
  leadScheduleLabel,
  overdueDays,
  poiScheduleLabel,
  type SalesTask,
  type TaskCategory,
} from '../lib/tasks'
import { addressLine, sourceDetail } from '../lib/pipeline'
import { pipelineStore, setAddLeadEntry, usePipeline } from '../lib/pipeline-store'
import { SourceSheet } from '../lib/pipeline-ui'
import { store } from '../lib/store'
import { BoardLeadCard, BoardPoiCard, TaskCard, type Tint } from '../lib/task-card'
import { TabBar } from '../lib/tabs'
import { AppScreen, VisitTitle } from '../lib/ui'

const TASK_ICON: Record<TaskCategory, React.ReactNode> = {
  reactivation: <ArrowsClockwise size={20} />,
  'poi-visit': <MapPin size={20} />,
  'second-follow-up': <PhoneCall size={20} />,
  referral: <Contact size={20} />,
  'first-follow-up': <Phone size={20} />,
}

/** How many new leads a BP is expected to input in a day. */
const NEW_LEAD_TARGET = 8

/** Each group's tint — a 500 foreground on its 50-tint ground, per the Badge. */
const TASK_TINT: Record<TaskCategory, Tint> = {
  reactivation: 'red',
  'poi-visit': 'primary',
  'second-follow-up': 'green',
  referral: 'blue',
  'first-follow-up': 'orange',
}

export function SalesBScreen() {
  const flow = useFlow()
  const { leads, order } = usePipeline()
  const [addSourceOpen, setAddSourceOpen] = useState(false)
  // The floating "Add lead" stands down while the Gather card — which carries
  // the same action as a full-width button — is on screen.
  const gatherRef = useRef<HTMLDivElement | null>(null)
  const [gatherVisible, setGatherVisible] = useState(false)

  useEffect(() => {
    const el = gatherRef.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setGatherVisible(entry.isIntersecting), {
      // Half the card is enough: the button is readable well before the card
      // has fully arrived, and a stricter threshold makes the swap feel late.
      threshold: 0.5,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const tasks = buildTasks(order.map((id) => leads[id]))
  const due = dueTasks(tasks)

  // Leads written down today — what the Gather card measures against its target.
  const inputToday = order.map((id) => leads[id]).filter((l) => l.ageDays === 0).length

  const totalOf = (c: TaskCategory) => tasks.filter((t) => t.category === c).length
  // Ascending dueDays: the ones that have already slipped ride at the top.
  const dueOf = (c: TaskCategory) =>
    due.filter((t) => t.category === c).sort((a, b) => a.dueDays - b.dueDays)

  // One tap-target per task — a lead opens her follow-up, a POI opens its brief.
  function openTask(task: SalesTask) {
    if (task.kind === 'lead') {
      pipelineStore.open(task.id)
      flow.go('follow-up')
    } else {
      store.openSosialisasi(task.id)
      flow.go('sosialisasi')
    }
  }

  function renderTask(task: SalesTask) {
    if (task.kind === 'lead') {
      return (
        <BoardLeadCard
          key={task.id}
          name={task.lead.name}
          schedule={leadScheduleLabel(task.lead.agenda)}
          late={overdueDays(task.lead.agenda)}
          source={sourceDetail(task.lead)}
          address={addressLine(task.lead.address)}
          onOpen={() => openTask(task)}
        />
      )
    }
    return (
      <BoardPoiCard
        key={task.id}
        title={task.event.title}
        schedule={poiScheduleLabel(task.event.agenda)}
        poiType={task.event.poiType}
        place={task.event.place}
        onOpen={() => openTask(task)}
      />
    )
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          hideBack
          // A little air under the 48px row, so the board does not start
          // flush against the header rule.
          className="pb-8"
          title={
            // The day's title leads; "Semua Leads" sits at the trailing edge as
            // a quiet outline button — the way out of today, offered but never
            // competing with the work itself.
            <span className="flex min-w-0 items-center justify-between gap-12">
              <VisitTitle title="Sales" when={`${due.length} tugas hari ini`} />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => flow.go('all-leads')}
              >
                Semua Leads
              </Button>
            </span>
          }
        />
      }
    >
      {TASK_CATEGORY_ORDER.map((category) => {
        const label = TASK_CATEGORY_LABEL[category]
        const total = totalOf(category)
        const rows = dueOf(category)
        // A task she has already handled today is one whose next touch is now
        // scheduled forward — she is no longer due to do anything about it. So
        // "cleared" is everything in the category that is not due, which is
        // also what makes the bar fill as the afternoon goes on.
        const done = Math.max(0, total - rows.length)

        const empty = (
          <span className="rounded-12 border border-default px-12 py-16 text-center text-12 text-caption">
            Tidak ada jadwal hari ini
          </span>
        )

        return (
          <TaskCard
            key={category}
            icon={TASK_ICON[category]}
            tint={TASK_TINT[category]}
            title={label}
            done={done}
            total={total}
          >
            {rows.length === 0 ? empty : rows.map(renderTask)}
          </TaskCard>
        )
      })}

      {/* Gather New Leads — the one card that counts input rather than backlog. */}
      <div ref={gatherRef}>
        <TaskCard
          icon={<FileAdd size={20} />}
          tint="blue"
          title="Gather New Leads"
          done={inputToday}
          total={NEW_LEAD_TARGET}
        >
          <Button className="w-full" onClick={() => setAddSourceOpen(true)}>
            <span className="flex items-center justify-center gap-4">
              <Plus size={16} />
              Tambah lead
            </span>
          </Button>
        </TaskCard>
      </div>

      <div className="pb-8" />

      {/* Add lead floats bottom-right above the nav — the same affordance and
          the same source-first sheet Option A uses — until the Gather card,
          which carries the same button, is on screen. */}
      <TabBar
        active="sales"
        actionAlign="center"
        action={
          gatherVisible ? null : (
            <Button size="sm" className="shadow-lg" onClick={() => setAddSourceOpen(true)}>
              <span className="flex items-center gap-4">
                <Plus size={16} />
                Tambah lead
              </span>
            </Button>
          )
        }
      />

      <SourceSheet
        open={addSourceOpen}
        onClose={() => setAddSourceOpen(false)}
        onDone={(data) => {
          setAddSourceOpen(false)
          setAddLeadEntry({ mode: 'save', source: data, returnTo: 'sales-b', draft: null })
          flow.go('lead-new')
        }}
      />
    </AppScreen>
  )
}
