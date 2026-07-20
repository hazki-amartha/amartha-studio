'use client'

// Jalur Naik Modal — the one screen in this direction that is not for the BP.
//
// Everything else here answers "what do I do now?". This answers "what do I
// SAY?", which is a different job and is why it is a screen of its own rather
// than a fourth block on the mitra page. A BP opens it mid-conversation, reads
// the line at the top out loud, then turns the phone around and lets the mitra
// read the rail herself. So the copy is deliberately split: the framing speaks
// to the BP about the mitra, and the quoted line and the rail speak to the
// mitra directly.
//
// The order makes the same argument the mitra page does. The thing to do comes
// first — here, the sentence to deliver — and the ladder that justifies it sits
// underneath as evidence. A BP who reads only the top of this screen has still
// got what she came for.
//
// The blocked path is the one that matters. Most mitra worth opening are
// behind, and showing a woman 34 days down a cheerful purple progress bar hands
// the BP a claim she then has to walk back. When there are arrears the screen
// leads with what is holding the ladder and what releases it — the whole
// tunggakan, not this week's angsuran — and the script changes with it.

import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { IconChat, IconCheck, IconWallet } from '../lib/icons'
import { ladderOf, type Rung } from '../lib/ladder'
import { findMitra } from '../lib/profile'
import { store, useApp } from '../lib/store'
import { Meter, Overline } from '../lib/ui'

/** The follow-up this screen closes, recorded like any other on the mitra page. */
export const LADDER_ACTION = 'jalur-modal'

export function LadderScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const ladder = ladderOf(mitra)
  const told = (s.followUps[mitra.id] ?? []).includes(LADDER_ACTION)
  const held = ladder.status === 'tertahan'

  return (
    <Screen topBar={<NavigationHeader title="Jalur Naik Modal" onBack={() => flow.back()} />}>
      {/* Who this is about and where she stands. The BP may have arrived from
          any of four screens and shouldn't have to recall which mitra she
          opened to trust the numbers below. */}
      <Card>
        <div className="flex items-center gap-12">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-14 font-bold text-default">{mitra.name}</span>
            <span className="truncate text-12 text-caption">
              {held
                ? `${ladder.missedWeeks} minggu belum dibayar`
                : ladder.current
                  ? `Menuju ${ladder.current.title}`
                  : 'Siklus selesai'}
            </span>
          </div>
          <Badge intent={held ? 'orange' : 'green'}>{held ? 'Tertahan' : 'Berjalan'}</Badge>
        </div>
      </Card>

      {/* --- What the BP came for: the sentence, already written. ----------
          Quoted rather than given as bullets. A BP handed talking points has to
          compose the line herself at the door, in front of the mitra, and that
          is where a real argument collapses into "ada program top up, Bu". */}
      <section className="flex flex-col gap-8">
        <Overline>Yang perlu disampaikan</Overline>

        {told ? (
          <div className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-green-50 text-green-500">
              <IconCheck size={20} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-14 font-bold text-default">Sudah disampaikan</span>
              <span className="text-12 text-caption">Jalur naik modal sudah dijelaskan</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-12 rounded-12 border border-primary-200 bg-primary-50 p-12">
            <div className="flex items-start gap-12">
              <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-neutral-white text-primary-500">
                <IconChat size={20} />
              </span>
              <p className="min-w-0 flex-1 text-14 font-bold text-default">
                &ldquo;{ladder.script}&rdquo;
              </p>
            </div>
            <Button className="w-full" onClick={() => store.addFollowUp(mitra.id, LADDER_ACTION)}>
              Tandai sudah disampaikan
            </Button>
          </div>
        )}
      </section>

      {/* --- What releases it, when it's held. -----------------------------
          One number and one condition. It gets no button of its own: collecting
          the arrears is already the recommendation on the mitra page, and two
          buttons for one job is how a task-first app quietly grows a second
          place where work lives. */}
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
                has to take back next week. With one week missed the two are the
                same money, and saying otherwise would be false precision. */}
            <p className="text-12 text-caption">
              {ladder.missedWeeks === 1
                ? 'Satu minggu tertunggak — begitu lunas, jalur langsung jalan lagi.'
                : `${ladder.missedWeeks} minggu × ${rupiah(mitra.due)}. Angsuran minggu ini saja belum melepas jalur.`}
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

      {/* The closing line — what keeps the ladder moving, or what happens to it
          once the arrears clear. A held mitra gets the reassurance that matters
          most to her: the clock does not restart. */}
      <Card className="pb-16">
        <p className="text-12 text-caption">{ladder.keep}</p>
      </Card>
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
      {/* The rail: the node, and the connector down to the next rung. */}
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
