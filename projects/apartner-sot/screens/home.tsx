'use client'

// Beranda — the BP's homepage, per the BP APP 2026 Figma.
//
// Who she is, her portfolio in three numbers, what the
// business sent her today, then "Tugas Anda": the day's progress (onto the
// Tugas list) and the cash she still has to settle (onto the setoran flow).
//
// The Setor pembayaran Modal card moved here from the Tugas list: the list is
// the day's visits, and the cash in her bag is not one of them.

import {
  ArrowRight,
  ArrowsClockwise,
  Envelope,
  HourglassLow,
  User,
} from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { AGENT, BP } from '../lib/schedule'
import { DeadlineNote, SETOR_DEADLINE } from '../lib/setor'
import {
  store,
  todayTasks,
  unreadComms,
  unsettledTotal,
  unsettledEntries,
  useApp,
} from '../lib/store'
import { TabBar } from '../lib/tabs'
import { AppScreen, Meter } from '../lib/ui'

const STATS = [
  { label: 'Total Mitra', value: 145 },
  { label: 'Mitra PAR', value: 95 },
  { label: 'Eligible Mitra', value: 81 },
]

export function HomeScreen() {
  const flow = useFlow()
  const s = useApp()

  const plate = todayTasks(s)
  const sent = plate.filter((t) => s.sentTasks.includes(t.id)).length
  const left = plate.length - sent

  // The setoran card — same rules it had on the Tugas list.
  // Only cash from SENT tasks can be put down — the branch settles against the
  // report — so the card shows (and counts) that and nothing else.
  const setorAmount = unsettledTotal(s)
  const inFlight = s.setorInFlight && s.setorInFlight.paid < 2 ? s.setorInFlight : null

  const updates = s.comms.filter((c) => !c.read).slice(0, 2)

  const header = (
    <header className="flex shrink-0 items-center gap-12 bg-neutral-white px-16 py-8">
      <span className="shrink-0 text-default">
        <User size={24} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-16 font-bold text-default">{BP.name}</span>
        <span className="truncate text-12 text-default">Business Partner | {BP.branch}</span>
      </div>
      <button type="button" aria-label="Kotak masuk" onClick={() => flow.go('comms')} className="text-default">
        <Envelope size={24} />
      </button>
      <button type="button" aria-label="Sinkronkan" onClick={() => store.sendPending()} className="text-caption">
        <ArrowsClockwise size={24} />
      </button>
    </header>
  )

  return (
    <AppScreen topBar={header}>
      {/* --- Portfolio */}
      <div className="grid grid-cols-3 gap-8">
        {STATS.map((x) => (
          <div key={x.label} className="flex flex-col items-center gap-4 rounded-12 bg-neutral-white p-12">
            <span className="text-12 text-default">{x.label}</span>
            <span className="text-24 font-bold text-primary-500">{x.value}</span>
          </div>
        ))}
      </div>

      {/* --- Update hari ini: the unread inbox, two lines deep */}
      {updates.length > 0 ? (
        <div className="flex flex-col gap-8 rounded-12 bg-neutral-white p-16">
          <button type="button" onClick={() => flow.go('comms')} className="flex items-start gap-8 text-left">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-16 font-bold text-default">Update hari ini</span>
              <span className="text-12 text-default">
                <b className="font-bold">{unreadComms(s)} update</b> belum dibaca
              </span>
            </span>
            <span className="shrink-0 text-primary-500">
              <ArrowRight size={16} />
            </span>
          </button>
          {updates.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => flow.go('comms')}
              className="flex items-center gap-8 text-left"
            >
              <span className="min-w-0 flex-1 truncate text-12 text-default">{c.title}</span>
              <span className="shrink-0 text-12 font-bold text-link">Lihat</span>
            </button>
          ))}
        </div>
      ) : null}

      {/* --- Tugas Anda */}
      <span className="pt-4 text-16 font-bold text-default">Tugas Anda</span>

      <button
        type="button"
        onClick={() => flow.go('today')}
        className="flex flex-col gap-8 rounded-12 bg-neutral-white p-16 text-left"
      >
        <span className="flex w-full items-center gap-8">
          <span className="min-w-0 flex-1 text-16 font-bold text-default">Tugas Anda hari ini</span>
          <span className="shrink-0 text-primary-500">
            <ArrowRight size={16} />
          </span>
        </span>
        <span className="text-12 text-default">
          {left > 0 ? (
            <>
              Masih ada <b className="font-bold">{left} tugas</b> lagi yang perlu Anda kirim!
            </>
          ) : (
            'Semua tugas hari ini sudah terkirim.'
          )}
        </span>
        <span className="flex w-full items-center gap-8">
          <span className="min-w-0 flex-1">
            <Meter progress={plate.length ? (sent / plate.length) * 100 : 0} />
          </span>
          <span className="shrink-0 text-12 text-default">
            {sent} dari <b className="font-bold">{plate.length}</b>
          </span>
        </span>
      </button>

      {/* Setor pembayaran Modal — the way into the setoran flow. While a
          handover is in flight it carries the "segera setor" warning and
          reopens that road instead of starting a new one. */}
      {/* Always on the page — Rp0 when there is nothing to settle. */}
      <button
        type="button"
        onClick={() => {
          if (inFlight) {
            flow.go(inFlight.method === 'agent' ? 'setor-agen' : 'setor-va')
            return
          }
          store.openSettlement()
          flow.go('setor-payment')
        }}
        className="flex flex-col gap-8 rounded-12 bg-neutral-white p-16 text-left"
      >
        <span className="flex w-full items-center gap-4">
          <span className="shrink-0 text-orange-500">
            <HourglassLow size={16} />
          </span>
          <span className="min-w-0 flex-1 truncate text-16 font-bold text-default">
            Setor pembayaran Modal
          </span>
          <span className="shrink-0 text-primary-500">
            <ArrowRight size={16} />
          </span>
        </span>
        <span className="text-12 text-default">
          Pembayaran <b className="font-bold">{unsettledEntries(s).length} tugas</b> belum disetor.
        </span>
        <span className="text-20 font-bold text-primary-500">
          {rupiah(inFlight ? inFlight.amount : setorAmount)}
        </span>
        {inFlight ? (
          <DeadlineNote>
            <span className="flex flex-col gap-2">
              <b className="font-bold text-orange-500">
                Segera setor ke {inFlight.method === 'agent' ? `Agen ${AGENT.name}` : 'VA Amartha'}
              </b>
              <span className="text-orange-500">
                Setor sebelum <b className="font-bold">{SETOR_DEADLINE}, 23:59</b> supaya mitra tidak telat
                bayar.
              </span>
            </span>
          </DeadlineNote>
        ) : null}
      </button>

      <TabBar active="home" />
    </AppScreen>
  )
}
