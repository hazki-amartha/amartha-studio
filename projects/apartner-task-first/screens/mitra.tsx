'use client'

// The mitra page — one borrower, opened from her card in any visit step.
//
// This is where the loan and payment history cut from the queue lives (NOTES,
// deliberate cut 2). CSAT says that record is among the most-sought data in the
// app; the cut was never "BPs don't need it", it was "it does not belong in a
// collection queue". So it lands here — but on this direction's terms.
//
// The order of the page IS the argument. A mitra page is the classic place a
// task-first app quietly turns back into a dashboard: open a person, get a wall
// of outstanding balances, instalment tables and attendance percentages, and
// leave having read a lot and done nothing. So the page opens on what to DO
// about her, pre-reasoned into a single recommendation, and the record sits
// underneath it — collapsed, because it exists to answer a follow-up question
// ("kenapa dia telat?"), not to be read on arrival.
//
// Same rule as the schedule's "Sekarang" card: the app synthesises, the BP acts.

import type { ReactNode } from 'react'
import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import {
  IconCalendar,
  IconChat,
  IconCheck,
  IconChevronRight,
  IconGift,
  IconPin,
  IconTrendUp,
  IconWallet,
  IconX,
} from '../lib/icons'
import { ladderOf } from '../lib/ladder'
import { LADDER_ACTION } from './ladder'
import {
  attendanceOf,
  attendanceRate,
  contactActionsFor,
  findMitra,
  historyOf,
  majelisOf,
  primaryActionFor,
  profileOf,
  type Action,
  type ActionKind,
} from '../lib/profile'
import { store, useApp } from '../lib/store'
import { Avatar, Collapsible, IconTile, Overline } from '../lib/ui'

/** What the BP has already done reads back as a done fact, not as "ditawarkan". */
const TAKEN_LABEL: Record<ActionKind, string> = {
  kunjungan: 'Kunjungan dijadwalkan',
  ingatkan: 'Sudah diingatkan',
  tawarkan: 'Sudah ditawarkan',
  hubungi: 'Sudah dihubungi',
  rute: 'Rute dibuka',
}

function ActionIcon({ kind }: { kind: ActionKind }) {
  if (kind === 'kunjungan') return <IconCalendar size={20} />
  if (kind === 'tawarkan') return <IconGift size={20} />
  if (kind === 'rute') return <IconPin size={20} />
  return <IconChat size={20} />
}

export function MitraScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const majelis = majelisOf(mitra)
  const profile = profileOf(mitra)
  const history = historyOf(mitra)
  const sessions = attendanceOf(mitra)

  const taken = s.followUps[mitra.id] ?? []
  const primary = primaryActionFor(mitra)
  const contacts = contactActionsFor(mitra)

  // The ladder row's subtitle is the ladder's own conclusion, not a teaser — a
  // BP who never opens the screen should still leave with the one fact it holds.
  //
  // It does NOT repeat the word the badge is already carrying: with the badge
  // reading "Tertahan", a line reading "Tertahan — tunggakan Rp1.000.000" said
  // it twice in one row and spent the subtitle's width saying nothing new. The
  // badge states the status; the subtitle states the number behind it.
  const ladder = ladderOf(mitra)
  const ladderTold = taken.includes(LADDER_ACTION)
  const ladderLine =
    ladder.status === 'tertahan'
      ? `Tunggakan ${rupiah(ladder.arrears)}`
      : ladder.current
        ? `${ladder.current.detail} menuju ${ladder.current.title}`
        : 'Siklus selesai — bisa ajukan pembiayaan baru'

  function take(action: Action) {
    store.addFollowUp(mitra.id, action.id)
  }

  // The bar reads "Detail Mitra", not her name: the card below now carries the
  // name, and with the bar pinned the two sat on screen together saying the same
  // thing twice. The header says what the SCREEN is, the card says who she is.
  return (
    <Screen topBar={<NavigationHeader title="Detail Mitra" onBack={() => flow.back()} />}>
      {/* Who she is and how to reach her — one card, not three.
          These were separate blocks (identity, then a "Hubungi" section, then a
          "Bahan obrolan" section), which spent two section headings and two card
          borders on what is really one answer to one question: who am I looking
          at, and what do I know about her standing? Three bordered blocks in a
          row also read as three ranked things to consider, which they never
          were — only the recommendation below is ranked.
          Inside, the divisions survive as hairlines: identity, then the two ways
          to reach her, then the ladder. Same grouping, a third of the chrome. */}
      <Card>
        <div className="flex flex-col gap-12">
          {/* Tenure sits on its own full-width line rather than as a third line
              in the name column. Beside a "Menunggak 34 hari" badge that column
              is only ~98px wide, and "Mitra sejak Oktober 2024" needs ~146px —
              it truncated to "Mitra sejak Oktober 2…", which is worse than
              useless: a date clipped mid-year reads as a rendering fault. */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-12">
              <Avatar name={mitra.name} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-14 font-bold text-default">{mitra.name}</span>
                <span className="truncate text-12 text-caption">{majelis.name}</span>
              </div>
              {mitra.dpd > 0 ? (
                <Badge intent={mitra.dpd >= 30 ? 'red' : 'orange'}>Menunggak {mitra.dpd} hari</Badge>
              ) : (
                <Badge intent="green">Lancar</Badge>
              )}
            </div>
            <span className="text-12 text-caption">Mitra sejak {profile.joined}</span>
          </div>

          {/* Reaching her is plumbing, never a recommendation — so these sit
              inside her identity block rather than competing as their own
              section with the one thing that IS recommended. */}
          {contacts.map((action) => (
            <CardRow
              key={action.id}
              icon={<ActionIcon kind={action.kind} />}
              title={action.label}
              subtitle={action.why}
              trailing={taken.includes(action.id) ? <Badge intent="neutral">Sudah</Badge> : null}
              onClick={() => take(action)}
            />
          ))}

          {/* The ladder. Not an action and not a record — it is a fact about her
              standing, which is what this card is for. Always shown, including
              when it is held: a held ladder is the more useful conversation, not
              a reason to hide the row. */}
          <CardRow
            tint="primary"
            icon={<IconTrendUp size={20} />}
            title="Jalur Naik Modal"
            subtitle={ladderLine}
            trailing={
              ladderTold ? (
                <Badge intent="neutral">Sudah</Badge>
              ) : ladder.status === 'tertahan' ? (
                <Badge intent="orange">Tertahan</Badge>
              ) : null
            }
            onClick={() => flow.go('ladder')}
          />
        </div>
      </Card>

      {/* --- The point of the page. One recommendation, already reasoned. --- */}
      <section className="flex flex-col gap-8">
        <Overline>Yang perlu dilakukan</Overline>

        {primary === null ? (
          // A first-class outcome, not a gap: a mitra who is current and has
          // nothing to be offered should cost the BP no time at all.
          <Card>
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <span className="text-16 font-bold text-default">Tidak ada tindak lanjut</span>
              <span className="text-12 text-caption">
                {mitra.name.split(' ')[0]} lancar dan belum ada tawaran yang cocok.
              </span>
            </div>
          </Card>
        ) : taken.includes(primary.id) ? (
          <div className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12">
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-green-50 text-green-500">
              <IconCheck size={20} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-14 font-bold text-default">{TAKEN_LABEL[primary.kind]}</span>
              <span className="text-12 text-caption">{primary.label}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-12 rounded-12 border border-primary-200 bg-primary-50 p-12">
            <div className="flex items-start gap-12">
              <IconTile tint={mitra.dpd >= 30 ? 'red' : 'primary'}>
                <ActionIcon kind={primary.kind} />
              </IconTile>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-16 font-bold text-default">{primary.label}</span>
                <span className="text-12 text-caption">{primary.why}</span>
              </div>
            </div>
            <Button className="w-full" onClick={() => take(primary)}>
              {primary.kind === 'kunjungan' ? 'Jadwalkan' : 'Lakukan sekarang'}
            </Button>
          </div>
        )}
      </section>

      {/* --- The record. Below the actions and collapsed, on purpose. It is here
          to answer a question the BP already has, not to brief her on arrival. */}
      <section className="flex flex-col gap-8 pb-16">
        <Overline>Riwayat &amp; data</Overline>

        <Collapsible title="Tagihan & pinjaman" hint={rupiah(profile.outstanding)}>
          <div className="flex items-center gap-12 rounded-8 bg-neutral-50 px-12 py-8">
            <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-8 bg-primary-50 text-primary-500">
              <IconWallet size={20} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-12 text-caption">Sisa pinjaman</span>
              <span className="text-18 font-bold text-default">{rupiah(profile.outstanding)}</span>
            </div>
          </div>
          <Row label="Angsuran mingguan" value={rupiah(mitra.due)} />
          <Row label="Siklus berjalan" value={`Minggu ${profile.week} dari ${profile.cycle}`} />
          <Row label="Nomor HP" value={profile.phone} />
          <Row label="Alamat" value={profile.address} />
        </Collapsible>

        <Collapsible title="Riwayat pembayaran" hint="8 minggu terakhir">
          {history.map((x) => (
            <div key={x.label} className="flex items-center gap-8">
              <span className="flex-1 text-12 text-default">{x.label}</span>
              <span className="text-12 text-caption">{rupiah(x.amount)}</span>
              <Badge
                intent={x.status === 'lunas' ? 'green' : x.status === 'telat' ? 'orange' : 'red'}
              >
                {x.status === 'lunas' ? 'Lunas' : x.status === 'telat' ? 'Telat' : 'Belum bayar'}
              </Badge>
            </div>
          ))}
        </Collapsible>

        <Collapsible title="Kehadiran kumpulan" hint={`${attendanceRate(sessions)}% hadir`}>
          <div className="flex justify-between gap-4">
            {sessions.map((session) => (
              <div key={session.label} className="flex flex-1 flex-col items-center gap-4">
                <span
                  className={`flex h-32 w-32 items-center justify-center rounded-full ${
                    session.hadir ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
                  }`}
                >
                  {session.hadir ? <IconCheck size={16} /> : <IconX size={16} />}
                </span>
                <span className="text-10 text-caption">{session.label}</span>
              </div>
            ))}
          </div>
        </Collapsible>
      </section>
    </Screen>
  )
}

/**
 * A tappable row inside the identity card: icon, title, one line under it, and
 * an optional trailing badge.
 *
 * The hairline above each row is what lets three different kinds of thing —
 * identity, contact, ladder — share one card without the groupings dissolving.
 * It is full-bleed (`-mx-12` against the card's 12px padding) so it reads as a
 * division of the card rather than an underline on the row.
 *
 * `border-default`, not `border-light`: light is neutral-50 (#F9FAF8), which on
 * a white card is invisible — the dividers were rendering and simply could not
 * be seen, which defeats the whole reason the rows were merged into one card.
 *
 * The chevron is the tell that the row goes somewhere. The contact rows only
 * record a tap today (NOTES, open question 4), so it is a promise the prototype
 * half-keeps — but it is the same affordance the mitra rows elsewhere use, and
 * inconsistency here would be the worse lie.
 */
function CardRow({
  icon,
  title,
  subtitle,
  trailing,
  onClick,
  tint = 'neutral',
}: {
  icon: ReactNode
  title: string
  subtitle: string
  trailing?: ReactNode
  onClick: () => void
  tint?: 'neutral' | 'primary'
}) {
  const tone =
    tint === 'primary' ? 'bg-primary-50 text-primary-500' : 'bg-neutral-50 text-neutral-600'

  return (
    <button
      type="button"
      onClick={onClick}
      className="-mx-12 flex items-center gap-12 border-t border-default px-12 pt-12 text-left"
    >
      <span
        className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-8 ${tone}`}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-14 font-bold text-default">{title}</span>
        <span className="truncate text-12 text-caption">{subtitle}</span>
      </div>
      {trailing}
      <span className="shrink-0 text-disabled">
        <IconChevronRight size={20} />
      </span>
    </button>
  )
}

/** A label/value line inside a collapsed record section. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-12 border-t border-light pt-8">
      <span className="shrink-0 text-12 text-caption">{label}</span>
      <span className="min-w-0 flex-1 text-right text-12 text-default">{value}</span>
    </div>
  )
}
