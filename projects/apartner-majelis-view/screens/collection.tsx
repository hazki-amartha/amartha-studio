'use client'

// Stage 2 of 3 — Penagihan.
//
// Same roster, same order, same cards as the attendance stage — only the row
// under the rule has changed, from a register question to a bill. That is the
// whole idea of this direction now: the BP works one list three times and never
// has to find her place again, because the list never re-sorts itself. A card
// that has been dealt with says so where it stands; it does not travel to a
// "Sudah Ditagih" section the moment she taps.
//
// The stage's job is to RECORD an outcome for everyone, not to make everyone
// lunas — a card is done once it carries an outcome of ANY kind, "tidak bayar"
// included.
//
// The one action is "Tagih", and unlike apartner-task-first it opens a PAGE
// rather than a bottom sheet. That is the second thing this direction is testing.
// The sheet's case was that it kept the queue behind it visible and scannable;
// the page's case is that at the moment the BP is negotiating an amount she is
// not looking at the queue at all — she is looking at one woman, who is arguing
// about one number, and the page can afford to show her the week-by-week ledger
// that produced it. A sheet that grew to hold a 50-week strip would be a page
// wearing a sheet's clothes.

import { useState } from 'react'
import { Badge, Button, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { MAJELIS, isSelfServe, outstandingOf, rupiah, type Mitra } from '../lib/data'
import { majelisWhen } from '../lib/schedule'
import { DpdBadge, KetuaBadge, MitraCard } from '../lib/mitra-card'
import {
  cashBillableTotal,
  paidViaPoket,
  cashCollectedTotal,
  collectStatus,
  paidOf,
  pendingMembers,
  remainingOf,
  store,
  useApp,
  openMajelisEntry,
} from '../lib/store'
import { ActionRow, AppScreen, ProductBadge, ProgressCard, ResultRow, RosterFilter, SectionTitle, StageBar, StickyBar, type ResultTone, VisitTitle } from '../lib/ui'

type FilterId = 'semua' | 'sudah' | 'belum'

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  { id: 'sudah', label: 'Sudah ditagih' },
  { id: 'belum', label: 'Belum ditagih' },
]

export function CollectionScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)

  const pending = pendingMembers(s)
  const [filter, setFilter] = useState<FilterId>('semua')

  // "Sudah ditagih" means an outcome is ON FILE, whatever it says — a payment,
  // a part-payment, a recorded no, or a bill that was already settled before
  // she arrived. What is left is the work.
  const isDone = (mitra: Mitra) => collectStatus(s, mitra) !== 'belum'
  const countOf = (id: FilterId) =>
    id === 'semua'
      ? MAJELIS.members.length
      : MAJELIS.members.filter((m) => (id === 'sudah' ? isDone(m) : !isDone(m))).length
  const visible = MAJELIS.members.filter((m) =>
    filter === 'semua' ? true : filter === 'sudah' ? isDone(m) : !isDone(m),
  )
  // Cash only, on both sides of the bar — the self-serve mitra settled through
  // the app and were never hers to collect. See store.ts.
  const cashCollected = cashCollectedTotal(s)
  const cashBillable = cashBillableTotal(s)

  // Both "Tagih" and "Ubah" land on the collect menu. A fresh tagih opens it with
  // every sheet closed; an ubah opens it with the sheet that produced the
  // outcome already open and prefilled — the menu reads that from what is on file.
  function openCollect(mitraId: string) {
    store.openMitraPage(mitraId)
    flow.go('collect')
  }

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title={<VisitTitle title={group.name} when={majelisWhen(group)} />}
          onBack={() => flow.back()}
        />
      }
    >
      {/* The stage's chrome — where she is in the visit, and how the cash is
          going — as one flat white band running the full width, with the roster
          below it on the grey canvas. Two stacked cards floating on grey made
          the top of the page read as more content to get through; as a band it
          reads as the header it is. */}
      <div className="-mx-16 -mt-16 flex flex-col gap-12 border-b border-default bg-neutral-white px-16 pb-12 pt-16">
        <StageBar current={2} />

        <ProgressCard
          flat
          showPercent={false}
          title="Tunai terkumpul"
          value={rupiah(cashCollected)}
          of={rupiah(cashBillable)}
          percent={cashBillable > 0 ? Math.round((cashCollected / cashBillable) * 100) : 0}
        />
      </div>

      <SectionTitle>Daftar mitra</SectionTitle>

      {/* "Who is left" is the question this stage is asked constantly, and it
          was being answered by scrolling 22 cards looking for buttons. */}
      <RosterFilter
        value={filter}
        onPick={setFilter}
        options={FILTERS.map((f) => ({ ...f, count: countOf(f.id) }))}
      />

      <div className="flex flex-col gap-8 pb-16">
        {visible.length === 0 ? (
          <p className="py-16 text-center text-12 text-caption">
            Tidak ada mitra di filter ini.
          </p>
        ) : null}
        {visible.map((mitra) => {
          const status = collectStatus(s, mitra)
          const owed = outstandingOf(mitra)
          const paid = paidOf(s, mitra)
          // She settled before the BP arrived — through the app, an agent or a
          // transfer. Money the BP never handles, so her card carries the fact
          // and no button: there is nothing to tagih from her, and offering the
          // control would invite a double entry.
          const selfPaid = isSelfServe(mitra) && status === 'lunas'
          // The group closed her bill under joint liability — GL only, and the
          // card says so rather than reading as money she handed over.
          const byGroup = s.payMode[mitra.id] === 'tanggung' && paid > 0
          // She had already paid through Poket and the system had not caught
          // up. Not money the BP collected, so the card says which it was.
          const byPoket = paidViaPoket(s, mitra)
          const refusal = s.nonPayments[mitra.id]
          // What stage 1 recorded about her, carried onto the card that asks
          // for money. The BP looking at an empty seat is deciding whether to
          // chase, and the reason she is not there is most of that decision —
          // "sedang bekerja" is a collection that happens next week,
          // "meninggal dunia" is not a collection at all. Without it the
          // absence is on the register two taps away and the bill is here.
          const absence =
            s.attendance[mitra.id] === 'tidak' ? (s.absenceReasons[mitra.id] ?? null) : null

          // The recorded outcome, as the band says it: a tone, the words, the
          // figure the outcome is ABOUT, and whatever it leaves for whoever
          // reads the visit later. Built here rather than in the JSX because
          // the seven results differ in every one of those four fields, and as
          // nested ternaries in props they could no longer be read as a set.
          //
          // Who paid is part of the record: a bill closed by the group under
          // tanggung renteng, one caught up through Poket days ago and one
          // handed over in cash this morning are three different facts, and the
          // card is where the BP re-reads which one she entered.
          function resultOf(): {
            tone: ResultTone
            label: string
            amount?: string
            notes?: { label: string; value: string }[]
            proof?: boolean
          } {
            if (status === 'keluar') {
              return {
                tone: 'red',
                label: 'Berhenti pinjam',
                // No figure. She did not pay a smaller number — she stopped
                // having a bill at all, and "Rp0" beside her name says the
                // opposite of that.
                notes: [{ label: 'Alasan', value: s.dropOut[mitra.id] ?? '—' }],
              }
            }
            if (status === 'tidak') {
              return {
                tone: 'red',
                label: 'Tidak bayar',
                // What she did NOT pay, not "Rp0": the figure on the band is
                // always the money the outcome is about, and on a refusal that
                // is the bill still standing.
                amount: rupiah(owed.total),
                notes: [
                  { label: 'Alasan', value: refusal?.reason ?? '—' },
                  { label: 'Janji bayar', value: refusal?.ptp ?? 'Tidak ada janji bayar' },
                ],
              }
            }
            // A part-payment leaves a balance, and a balance nobody wrote a
            // reason and a date against is a balance nobody can chase — so both
            // ride under the band, with what is still short.
            const notes =
              status === 'sebagian'
                ? [
                    { label: 'Kurang', value: rupiah(remainingOf(s, mitra)) },
                    { label: 'Alasan', value: s.shortfallReasons[mitra.id] ?? '—' },
                    { label: 'Janji bayar', value: s.partialPtp[mitra.id] ?? 'Tidak ada janji bayar' },
                  ]
                : undefined
            return {
              // A Poket payment that covered the bill and one that fell short
              // are different outcomes, exactly as they are in cash: the second
              // leaves a balance, and green on it would file a part-payment as
              // settled.
              tone: status === 'lunas' ? 'green' : 'orange',
              label: byPoket
                ? status === 'lunas'
                  ? 'Bayar via Poket'
                  : 'Bayar sebagian via Poket'
                : byGroup
                  ? 'Ditanggung renteng'
                  : status === 'lunas'
                    ? 'Lunas'
                    : 'Bayar sebagian',
              amount: rupiah(paid),
              notes,
              // The screenshot is what makes a Poket claim more than one
              // person's word about a payment nobody's system has seen.
              proof: byPoket,
            }
          }

          const result = resultOf()

          return (
            <MitraCard
              key={mitra.id}
              mitra={mitra}
              // Identical to stage 1, deliberately. See attendance.tsx.
              meta={null}
              // See attendance.tsx — the product labels the card from the right
              // edge of the name row on all three stages.
              titleBadge={<ProductBadge product={mitra.product} />}
              labels={
                <>
                  <KetuaBadge mitra={mitra} />
                  <DpdBadge dpd={mitra.dpd} format="short" />
                  {/* Red only for the absence that ends the membership — the
                      rest are this week's news and read as neutral facts, and
                      a row where every chip is loud has no loud chip. */}
                  {absence ? (
                    <Badge intent={absence === 'Meninggal dunia' ? 'red' : 'neutral'}>
                      Tidak hadir · {absence}
                    </Badge>
                  ) : null}
                </>
              }
              onOpen={() => {
                store.openMitraPage(mitra.id)
                flow.go('mitra')
              }}
              action={
                selfPaid ? (
                  // Settled before the BP arrived, so the band carries the fact
                  // and no "Ubah": there is nothing of hers for the BP to
                  // correct, and a control here would invite a second entry
                  // against money that never passed through her hands.
                  <ResultRow tone="green" label="Sudah bayar via Poket" amount={rupiah(paid)} />
                ) : status === 'belum' ? (
                  <ActionRow label="Tagihan" value={rupiah(owed.total)}>
                    {/* Default size, not sm: sm sets 12px type and the pills on
                        the attendance stage are 14px, so the same card read at
                        two different sizes from one stage to the next. h-40
                        pins it to the avatar rhythm — see NOTES.md. */}
                    <Button className="h-40 px-24" onClick={() => openCollect(mitra.id)}>
                      Tagih
                    </Button>
                  </ActionRow>
                ) : (
                  // One band, in the colour of what happened, with everything
                  // the outcome left behind hanging under it. "Ubah" reopens the
                  // page that produced it, so a recorded entry is never trapped.
                  <ResultRow
                    tone={result.tone}
                    label={result.label}
                    amount={result.amount}
                    notes={result.notes}
                    proof={result.proof}
                    onEdit={() => openCollect(mitra.id)}
                  />
                )
              }
            />
          )
        })}
      </div>

      <StickyBar>
        {/* A gate now, not a warning. Stage 2 is the money, and a visit that
            moves on with four mitra unasked leaves a queue nobody will come back
            to — the BP has left the balai. Same shape as the attendance gate one
            stage up: the button says nothing, the line above it says what is
            missing, because a disabled button with no reason attached is the
            most common way a blocking step becomes a support ticket. */}
        {pending.length > 0 ? (
          <span className="text-center text-12 text-caption">
            {pending.length} mitra belum dicatat pembayarannya
          </span>
        ) : null}
        {/* Two buttons, equal width: the way back out of a stage is part of the
            footer rather than only the arrow in the top bar, which a BP working
            one-handed on a motorbike stand cannot reach. */}
        <div className="flex gap-12">
          <Button size="lg" variant="secondary" className="flex-1" onClick={() => flow.back()}>
            Kembali
          </Button>
          <Button
            size="lg"
            className="flex-1"
            disabled={pending.length > 0}
            onClick={() => flow.go('growth')}
          >
            Lanjut
          </Button>
        </div>
      </StickyBar>
    </AppScreen>
  )
}
