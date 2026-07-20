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

import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import {
  IconCalendar,
  IconChat,
  IconCheck,
  IconGift,
  IconPin,
  IconWallet,
  IconX,
} from '../lib/icons'
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

  function take(action: Action) {
    store.addFollowUp(mitra.id, action.id)
  }

  return (
    <Screen topBar={<NavigationHeader title={mitra.name} onBack={() => flow.back()} />}>
      {/* Who she is, in one card — enough to be sure you opened the right woman,
          and no more. The name is already in the header, so this line carries
          what the header cannot: her group and how long she has been a mitra. */}
      <Card>
        <div className="flex items-center gap-12">
          <Avatar name={mitra.name} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-14 font-bold text-default">{majelis.name}</span>
            <span className="truncate text-12 text-caption">Mitra sejak {profile.joined}</span>
          </div>
          {mitra.dpd > 0 ? (
            <Badge intent={mitra.dpd >= 30 ? 'red' : 'orange'}>Menunggak {mitra.dpd} hari</Badge>
          ) : (
            <Badge intent="green">Lancar</Badge>
          )}
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

      {/* Reaching her is plumbing, not a recommendation — so it is a quiet list
          under the one thing that IS recommended, never competing with it. */}
      <section className="flex flex-col gap-8">
        <Overline>Hubungi</Overline>
        {contacts.map((action) => {
          const done = taken.includes(action.id)
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => take(action)}
              className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-12 text-left"
            >
              <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-8 bg-neutral-50 text-neutral-600">
                <ActionIcon kind={action.kind} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-14 font-bold text-default">{action.label}</span>
                <span className="truncate text-12 text-caption">{action.why}</span>
              </div>
              {done ? <Badge intent="neutral">Sudah</Badge> : null}
            </button>
          )
        })}
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

/** A label/value line inside a collapsed record section. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-12 border-t border-light pt-8">
      <span className="shrink-0 text-12 text-caption">{label}</span>
      <span className="min-w-0 flex-1 text-right text-12 text-default">{value}</span>
    </div>
  )
}
