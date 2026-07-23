'use client'

// Jalur Naik Modal — the one screen here that is not for the BP.
//
// Everything else answers "what do I do now?". This answers "what do I SAY?",
// which is a different job and why it is a screen rather than a fourth block on
// the mitra page. A BP opens it mid-conversation, reads the line at the top out
// loud, then turns the phone around and lets the mitra read the rail herself. So
// the copy is split: the framing speaks to the BP about the mitra, and the
// quoted line and the rail speak to the mitra directly.
//
// Ported from apartner-task-first with one thing removed: the "tandai sudah
// disampaikan" button. In that direction the mitra page was where follow-ups got
// recorded, so the briefing had to close its own loop. Here the growth stage
// does that job — Rina's recommendation is literally "Naik plafon · Diskusikan"
// — and a second place to record the same conversation is how two sources of
// truth quietly appear. This screen is now purely the briefing; the outcome is
// recorded where the BP is already being asked for it.

import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMitra, rupiah } from '../lib/data'
import { IconChat, IconCheck, IconWallet } from '../lib/icons'
import { ladderOf, type Rung } from '../lib/ladder'
import { useApp } from '../lib/store'
import { Meter, Overline } from '../lib/ui'

export function LadderScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const ladder = ladderOf(mitra)
  const held = ladder.status === 'tertahan'

  return (
    <Screen topBar={<NavigationHeader title="Jalur Naik Modal" onBack={() => flow.back()} />}>
      <Card>
        <div className="flex items-center gap-12">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-14 font-bold text-default">{mitra.name}</span>
            {/* Where she stands TODAY, directly under her name. Every rung on
                the rail below is an amount added to this one, and without it
                the whole ladder is a set of increments measured from a number
                the BP has to remember from another screen. */}
            <span className="truncate text-12 text-caption">
              Limit saat ini {rupiah(mitra.loan)}
            </span>
            <span className="truncate text-12 text-caption">
              {held
                ? `${ladder.missedWeeks} minggu belum dibayar`
                : ladder.current
                  ? `Menuju ${ladder.current.title}`
                  : 'Siklus selesai'}
            </span>
          </div>
          {/* The same two words as the card that opened this screen. The rungs
              below still say "Tertahan" — that describes a RUNG, frozen where
              it stands; this describes her, and whether the prize is in danger. */}
          <Badge intent={held ? 'orange' : 'green'}>{held ? 'At risk' : 'On Track'}</Badge>
        </div>
      </Card>

      {/* --- What the BP came for: the sentence, already written. ----------
          Quoted rather than given as bullets. A BP handed talking points has to
          compose the line herself at the door, in front of the mitra, and that
          is where a real argument collapses into "ada program top up, Bu". */}
      <section className="flex flex-col gap-8">
        <Overline>Yang perlu disampaikan</Overline>
        <div className="flex items-start gap-12 rounded-12 border border-primary-200 bg-primary-50 p-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-neutral-white text-primary-500">
            <IconChat size={20} />
          </span>
          <p className="min-w-0 flex-1 text-14 font-bold text-default">
            &ldquo;{ladder.script}&rdquo;
          </p>
        </div>
      </section>

      {/* --- What releases it, when it's held. -----------------------------
          One number and one condition, and no button of its own: collecting is
          already the mitra page's recommendation, and two buttons for one job is
          how a second place for the same work quietly appears. */}
      {held ? (
        <section className="flex flex-col gap-8">
          <Overline>Syarat lanjut</Overline>
          <div className="flex flex-col gap-12 rounded-12 border border-orange-200 bg-orange-50 p-12">
            <div className="flex items-start gap-12">
              <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-neutral-white text-orange-500">
                <IconWallet size={20} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-12 text-caption">
                  {ladder.missedWeeks === 1
                    ? 'Lunasi angsuran tertunggak'
                    : 'Lunasi seluruh tunggakan'}
                </span>
                <span className="text-20 font-bold text-default">{rupiah(ladder.arrears)}</span>
              </div>
            </div>
            {/* The whole tunggakan, not this week's angsuran — a mitra told
                "bayar minggu ini dulu" and then still held is a promise the BP
                has to take back next week. */}
            <p className="text-12 text-caption">
              {ladder.missedWeeks === 1
                ? 'Satu minggu tertunggak — begitu lunas, jalur langsung jalan lagi.'
                : `Termasuk sisa dari minggu yang dibayar sebagian. Angsuran minggu ini saja belum melepas jalur.`}
            </p>
          </div>
        </section>
      ) : null}

      {/* --- The rail. Evidence for the BP, and the part the mitra reads. --- */}
      <section className="flex flex-col gap-8">
        <Overline>Jalur</Overline>
        <div className="flex flex-col">
          {ladder.rungs.map((rung, i) => (
            <RungRow key={rung.id} rung={rung} index={i} last={i === ladder.rungs.length - 1} />
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-12 pb-16">
        <p className="rounded-12 bg-neutral-white p-12 text-12 text-caption">{ladder.keep}</p>
        <Button variant="outline" className="w-full" onClick={() => flow.back()}>
          Kembali ke Detail Mitra
        </Button>
      </div>
    </Screen>
  )
}

// --- The rail --------------------------------------------------------------
// A numbered node on a vertical line beside a card. Kept local to this screen
// rather than promoted to lib/: nothing else in the project has a milestone
// path, and a component earns promotion by being wanted twice.

function RungRow({ rung, index, last }: { rung: Rung; index: number; last: boolean }) {
  const done = rung.state === 'tercapai'
  const held = rung.state === 'tertahan'
  const active = held || rung.state === 'berjalan'

  // A held rung is neither "on your way" purple nor "not yet" grey, so it takes
  // the same orange as the arrears card — one state, one colour, wherever it
  // shows up on this screen.
  const node = done
    ? 'bg-green-500 text-neutral-white'
    : held
      ? 'bg-orange-500 text-neutral-white'
      : active
        ? 'bg-primary-500 text-neutral-white'
        : 'bg-neutral-200 text-neutral-600'

  const card = held ? 'border-orange-200' : active ? 'border-primary-200' : 'border-default'

  return (
    <div className="flex gap-12">
      <div className="flex w-32 shrink-0 flex-col items-center">
        <span
          className={`flex h-32 w-32 items-center justify-center rounded-full text-12 font-bold ${node}`}
        >
          {done ? <IconCheck size={16} /> : index + 1}
        </span>
        {last ? null : <span className={`w-2 flex-1 ${done ? 'bg-green-500' : 'bg-neutral-200'}`} />}
      </div>

      <div
        className={`mb-12 flex min-w-0 flex-1 flex-col gap-8 rounded-12 border bg-neutral-white p-12 ${card}`}
      >
        <div className="flex flex-wrap items-center gap-8">
          <span className="text-16 font-bold text-default">{rung.title}</span>
          <Badge intent={held ? 'orange' : 'primary'}>{rung.badge}</Badge>
        </div>

        <div className="flex flex-col">
          <span className="text-12 text-caption">{rung.lead}</span>
          {rung.amount === null ? null : (
            <span
              className={`text-20 font-bold ${
                rung.state === 'terkunci' ? 'text-caption' : 'text-primary-500'
              }`}
            >
              {rung.kind === 'topup' ? '+' : ''}
              {rupiah(rung.amount)}
            </span>
          )}
        </div>

        {rung.detail ? (
          <span className={`text-12 ${done ? 'text-green-500' : 'text-caption'}`}>
            {rung.detail}
          </span>
        ) : null}

        {rung.progress === null ? null : (
          <Meter progress={rung.progress} tone={held ? 'muted' : 'primary'} />
        )}
      </div>
    </div>
  )
}
