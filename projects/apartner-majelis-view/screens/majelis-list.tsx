'use client'

// Majelis — the directory, and this direction's front door to the roster.
//
// The schedule answers "what now?". This tab answers "who is Majelis Anggrek,
// and when does it meet?" — the question a BM asks, or a moved visit forces.
// Tapping a group opens the Majelis View roster, NOT the pelayanan: reaching a
// group off-schedule is looking something up, and the roster is the screen that
// answers a look-up (who is in it, who is behind, what each one owes). Starting
// the work is still one deliberate button away, on the roster itself.
//
// That is the whole split this direction makes at L0: schedule → work, directory
// → record. Neither route hides the other; each just opens on what it is for.
//
// It stays a DIRECTORY, not a dashboard — no portfolio percentages, since those
// are BM monitoring numbers and keeping them off the BP's surfaces is a standing
// decision here.

import { Badge } from '@/design-system/components'
import { Screen, TopBar } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MAJELIS_DIRECTORY, type MajelisEntry } from '../lib/schedule'
import { IconChevronRight, IconPin } from '../lib/icons'
import { store } from '../lib/store'
import { TabBar } from '../lib/tabs'

export function MajelisListScreen() {
  const flow = useFlow()

  function Row({ entry }: { entry: MajelisEntry }) {
    return (
      <button
        type="button"
        onClick={() => {
          store.openMajelisPage(entry.id)
          flow.go('majelis')
        }}
        className="flex items-center gap-12 rounded-12 bg-neutral-white p-12 text-left active:bg-neutral-50"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-14 font-bold text-default">{entry.name}</span>
          <span className="flex items-center gap-4 text-12 text-caption">
            <IconPin size={16} />
            <span className="truncate">{entry.place}</span>
          </span>
          <span className="text-12 text-caption">
            {entry.day}, {entry.time} · {entry.members} mitra
          </span>
        </div>
        {entry.menunggak > 0 ? (
          <Badge intent="orange">{entry.menunggak} menunggak</Badge>
        ) : (
          <Badge intent="green">Lancar</Badge>
        )}
        <span className="shrink-0 text-disabled">
          <IconChevronRight size={20} />
        </span>
      </button>
    )
  }

  return (
    <Screen
      topBar={
        <TopBar>
          <span className="flex-1">Majelis</span>
          <span className="text-12 font-regular text-caption">
            {MAJELIS_DIRECTORY.length} majelis
          </span>
        </TopBar>
      }
    >
      {/* One flat list. It was split into "Hari ini" and "Majelis lain", which
          made the directory answer a question the schedule already owns — and a
          BP who opens this tab is looking a group UP, on whatever day. */}
      <div className="flex flex-col gap-8">
        {MAJELIS_DIRECTORY.map((m) => (
          <Row key={m.id} entry={m} />
        ))}
      </div>

      <TabBar active="majelis-list" />
    </Screen>
  )
}
