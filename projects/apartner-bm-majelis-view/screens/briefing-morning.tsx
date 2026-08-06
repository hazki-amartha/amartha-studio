'use client'

// Morning briefing — the meeting that opens the branch day, as a checklist the
// BM works down while seven BPs sit in front of her.
//
// It is a RUNNING ORDER, not a form: nothing here is typed, everything is
// ticked. That is what the reference is — a roll call already taken, four
// things to talk through in a fixed order, and a photo that closes it — and it
// is why the whole card is the tap target rather than a checkbox on the edge of
// one. She is talking while she uses this.
//
// The NG-MIS paths are printed rather than linked. NG-MIS is another system,
// and a prototype that navigates out of itself strands the review in an app
// nobody opened it to see.
//
// Absensi is drawn as taken, 7/7, and collapsed to its count. The BPs are in
// the room — the meeting cannot start otherwise — so the register is something
// she confirms at a glance and expands only if a name is in question.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { BUSINESS_PARTNERS } from '../lib/bp'
import { AgendaCard, BriefingCard, CheckMark, MORNING_AGENDA } from '../lib/briefing'
import { IconCamera, IconChevronDown, IconChevronUp } from '../lib/icons'
import { BRIEFINGS } from '../lib/schedule'
import { store } from '../lib/store'
import { AppScreen, SectionTitle, StickyBar, VisitTitle } from '../lib/ui'

export function BriefingMorningScreen() {
  const flow = useFlow()
  const briefing = BRIEFINGS[0]

  // Local state, not the store: none of it has to survive leaving the page.
  // What survives is the one fact the Tugas card reads back — that the briefing
  // is closed — and that is written on the way out.
  const [ticked, setTicked] = useState<string[]>([])
  const [rollOpen, setRollOpen] = useState(false)
  const [photo, setPhoto] = useState(false)

  const toggle = (id: string) =>
    setTicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const ready = ticked.length === MORNING_AGENDA.length && photo

  function finish() {
    store.finishBriefing(briefing.id)
    flow.go('today')
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={briefing.name} when={`${briefing.time} · ${briefing.place}`} />}
          onBack={() => flow.go('today')}
        />
      }
    >
      <SectionTitle>Rangkaian acara</SectionTitle>

      {/* --- Absensi: the register, already taken. The count is the headline
          and the names sit behind it, because "are they all here" is the
          question and seven names is the answer to a different one. */}
      <BriefingCard
        title="Absensi BP"
        hint={
          <button
            type="button"
            onClick={() => setRollOpen(!rollOpen)}
            aria-expanded={rollOpen}
            className="flex items-center gap-4 text-14 font-bold text-link"
          >
            {BUSINESS_PARTNERS.length}/{BUSINESS_PARTNERS.length} Hadir
            {rollOpen ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
          </button>
        }
      >
        {rollOpen ? (
          <div className="flex flex-col gap-12 border-t border-default pt-12">
            {BUSINESS_PARTNERS.map((bp) => (
              <span key={bp.id} className="flex items-center gap-12">
                <CheckMark done size={24} />
                <span className="min-w-0 flex-1 truncate text-16 font-regular text-default">
                  {bp.name}
                </span>
              </span>
            ))}
          </div>
        ) : null}
      </BriefingCard>

      {MORNING_AGENDA.map((item) => (
        <AgendaCard
          key={item.id}
          item={item}
          done={ticked.includes(item.id)}
          onToggle={() => toggle(item.id)}
        />
      ))}

      {/* --- Bukti kehadiran: one photo of the room, the same proof the field
          visits close on. Dashed while empty — a slot waiting to be filled
          rather than a button that does something else. */}
      <BriefingCard title="Bukti kehadiran">
        <div className="flex flex-col gap-12">
          <span className="text-14 font-regular text-caption">
            Ambil foto bersama semua peserta yang hadir
          </span>
          <button
            type="button"
            onClick={() => setPhoto(!photo)}
            className={`flex flex-col items-center gap-8 rounded-12 border border-dashed p-24 ${
              photo ? 'border-green-500 bg-green-50 text-green-500' : 'border-default text-caption'
            }`}
          >
            <IconCamera size={24} />
            <span className="text-14 font-bold">{photo ? 'Foto tersimpan' : 'Ambil foto'}</span>
          </button>
        </div>
      </BriefingCard>

      <StickyBar>
        {/* The gate names what is missing rather than only refusing. Orange, not
            red: nothing has gone wrong, the meeting is simply still running. */}
        {!ready ? (
          <span className="text-center text-12 font-bold text-orange-500">
            Masih ada tugas yang belum selesai
          </span>
        ) : null}
        <Button size="lg" className="w-full" disabled={!ready} onClick={finish}>
          Selesaikan Briefing
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
