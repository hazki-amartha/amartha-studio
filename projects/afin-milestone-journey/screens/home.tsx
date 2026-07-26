'use client'

// Home — the whole loan restated as one nearest goal and the habits that reach
// it. Everything above the fold answers "what do I get, and what do I have to
// do this week to keep getting it".
//
// The goal card is the screen's argument: a three-stop rail from where she is
// now to the end of the tenor, with the two tasks that move her along it sitting
// INSIDE the same card rather than in a list below. Paying and attending are not
// chores that happen to be on this page — they are the mechanism the goal runs on.
//
// A brand-new mitra sees the same card with one stop lit and one task, because
// she has nothing to repay yet: her nearest goal is the first disbursement.

import type { ReactNode } from 'react'
import { NavigationBar, NavigationHeader } from '@/design-system/components'
import {
  Bell,
  ChartLineUp,
  ChatCircleQuestion,
  Check,
  ChevronRight,
  Clipboard,
  Headset,
  House,
  Majelis,
  User,
  Wallet,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { WEEKLY_BILL, rupiah } from '../lib/data'
import { IconPiggy } from '../lib/icons'
import { outstanding, store, useApp } from '../lib/store'
import { IconTile, Meter, TaskButton } from '../lib/ui'

export function HomeScreen() {
  const flow = useFlow()
  const s = useApp()
  const isNew = s.mitraStage === 'new'

  const goToPayment = () => {
    store.startPayment()
    flow.go('amount')
  }

  // The location check the "Absen" button runs. Deliberately unreliable — the
  // failure path (and the "Hubungi BP" escape after two of them) is the part of
  // attendance worth prototyping; a check that always passes shows nothing.
  const confirmAttendance = () => {
    store.startAttendCheck()
    window.setTimeout(() => {
      if (Math.random() < 0.65) {
        store.attendOk()
      } else {
        const dist = 500 + Math.floor(Math.random() * 600)
        store.attendFail(`Lokasi terlalu jauh (≈${dist}m dari titik kumpulan)`)
      }
    }, 1200)
  }

  return (
    <Screen
      topBar={
        <NavigationHeader
          hideBack
          title={
            <span className="flex items-center gap-12">
              <IconTile tint="neutral" round size={32}>
                <User size={20} />
              </IconTile>
              <span className="flex min-w-0 flex-col">
                <span className="text-12 font-regular text-caption">Hello! 👋</span>
                <span className="text-16 font-bold text-default">Ibu Siti</span>
              </span>
            </span>
          }
          trailingIcons={[
            <span key="bell" className="relative flex text-primary-500">
              <Bell size={20} />
              <span className="absolute -right-8 -top-8 flex h-16 min-w-16 items-center justify-center rounded-full bg-red-500 px-4 text-10 font-bold text-neutral-white">
                8
              </span>
            </span>,
          ]}
        />
      }
    >
      <h1 className="text-16 font-bold text-default">Perjalanan pendanaan Ibu</h1>

      {/* The two limit figures, side by side: what she has now and what discipline
          turns it into. They sit outside the goal card because they are the
          reason the goal card matters, not a step within it. */}
      <div className="flex items-start gap-16">
        <div className="flex-1">
          <p className="text-12 text-caption">Limit sekarang</p>
          <p className="mt-8 text-20 font-bold text-default">Rp5jt</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-12 text-caption">
            {isNew ? 'Di akhir tenor dapat naik s/d' : 'Di minggu 40 dapat naik s/d'}
          </p>
          <p className="mt-8 text-20 font-bold text-primary-500">Rp6jt – Rp7jt</p>
        </div>
      </div>

      <div className="rounded-12 border border-primary-200 bg-primary-50 p-16">
        <div className="mb-12 flex justify-center">
          <span className="rounded-full border border-primary-500 bg-primary-50 px-12 py-4 text-12 font-bold text-primary-500">
            Goal terdekat
          </span>
        </div>

        <GoalRail
          stops={
            isNew
              ? [
                  { when: 'Sekarang', what: 'Bisa cair Rp5jt', done: true },
                  { when: '3 minggu lagi', what: '', done: false },
                  { when: 'Di akhir tenor', what: 'Naik limit', done: false },
                ]
              : [
                  { when: 'Sekarang', what: 'Bisa cair Rp1jt', done: true },
                  { when: '8 minggu lagi', what: 'Cair Rp2.250jt', done: false, accent: true },
                  { when: 'Di akhir tenor', what: 'Naik limit', done: false },
                ]
          }
          percent={isNew ? 0 : 40}
        />

        <p className="mb-12 mt-24 text-14 text-neutral-700">
          Lakukan hal berikut untuk achieve goals:
        </p>

        <div className="flex flex-col gap-16 rounded-8 bg-neutral-white p-16">
          {isNew ? (
            <Task
              tint="primary"
              icon={<Wallet size={20} />}
              title="Cairkan Rp5jt"
              description="Limit tersedia Rp5jt"
              action={
                <TaskButton tone="primary" onClick={() => flow.go('disburse-amount')}>
                  Cairkan
                </TaskButton>
              }
            />
          ) : (
            <>
              <Task
                tint="blue"
                icon={<Wallet size={20} />}
                title="Bayar angsuran"
                description={<BillLine />}
                action={<BayarButton onPay={goToPayment} />}
              />
              <div className="flex flex-col gap-4">
                <Task
                  tint="green"
                  icon={<Majelis size={20} />}
                  title="Datang kumpulan"
                  description="Setiap Kamis, jam 11.30"
                  action={<AbsenButton onCheck={confirmAttendance} />}
                />
                {s.attendState === 'fail' && s.attendMsg ? (
                  <p className="text-right text-12 text-red-500">{s.attendMsg}</p>
                ) : null}
                {s.attendState === 'fail' && s.attendFails >= 2 ? (
                  <button
                    type="button"
                    className="text-right text-12 font-bold text-primary-500 underline"
                  >
                    Lokasi tidak sesuai? Hubungi BP
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => flow.go('progress')}
        className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-16 text-left"
      >
        <IconTile tint="primary" round>
          <Clipboard size={20} />
        </IconTile>
        <span className="flex-1 text-14 font-bold text-default">
          Lihat perjalanan ibu untuk 48 minggu
        </span>
        <span className="shrink-0 text-neutral-700">
          <ChevronRight size={16} />
        </span>
      </button>

      <div className="flex gap-12">
        <QuickLink icon={<ChatCircleQuestion size={20} />} label="Tanya Jawab" />
        <QuickLink icon={<Headset size={20} />} label="AmarthaCare" />
      </div>

      <div className="pb-16 text-center">
        <p className="text-12 text-primary-700">Terms &amp; Conditions • Privacy Policy</p>
        <p className="mt-16 text-12 text-caption">Berizin &amp; Diawasi oleh</p>
        <p className="mt-2 text-12 font-bold text-default">Otoritas Jasa Keuangan</p>
      </div>

      <div className="sticky bottom-0 -mx-16 mt-auto">
        <NavigationBar
          items={[
            { id: 'home', label: 'Home', icon: <House size={24} />, active: true },
            {
              id: 'progress',
              label: 'Progress',
              icon: <ChartLineUp size={24} />,
              onClick: () => flow.go('progress'),
            },
            {
              id: 'majelis',
              label: 'Majelis',
              icon: <Majelis size={24} />,
              onClick: () => flow.go('majelis'),
            },
            { id: 'celengan', label: 'Celengan', icon: <IconPiggy size={24} /> },
            {
              id: 'transaksi',
              label: 'Transaksi',
              icon: <Clipboard size={24} />,
              onClick: () => flow.go('riwayat'),
            },
          ]}
        />
      </div>
    </Screen>
  )
}

// --- The goal rail ---------------------------------------------------------
// Three stops, a meter behind them, and a caption under each. It is a progress
// bar that names its destinations, which is the only reason it beats the plain
// "week 14 of 48" it replaces.

interface Stop {
  when: string
  what: string
  done: boolean
  /** The stop the card is arguing for — printed in brand purple. */
  accent?: boolean
}

function GoalRail({ stops, percent }: { stops: Stop[]; percent: number }) {
  return (
    <>
      <div className="flex">
        {stops.map((stop) => (
          <span key={stop.when} className="flex-1 text-center text-12 text-neutral-700">
            {stop.when}
          </span>
        ))}
      </div>

      <div className="relative mt-12 flex items-center">
        <span className="absolute left-0 right-0">
          <Meter percent={percent} />
        </span>
        {stops.map((stop) => (
          <span key={stop.when} className="relative flex flex-1 justify-center">
            <span
              className={`flex h-20 w-20 items-center justify-center rounded-full text-neutral-white ${
                stop.done ? 'bg-primary-500' : 'bg-neutral-400'
              }`}
            >
              {stop.done ? <Check size={16} /> : null}
            </span>
          </span>
        ))}
      </div>

      <div className="mt-12 flex">
        {stops.map((stop) => (
          <span
            key={stop.when}
            className={`flex-1 text-center text-14 font-bold ${
              stop.accent ? 'text-primary-500' : 'text-default'
            }`}
          >
            {stop.what}
          </span>
        ))}
      </div>
    </>
  )
}

// --- Tasks -----------------------------------------------------------------

function Task({
  tint,
  icon,
  title,
  description,
  action,
}: {
  tint: 'primary' | 'blue' | 'green'
  icon: ReactNode
  title: string
  description: ReactNode
  action: ReactNode
}) {
  return (
    <div className="flex items-center gap-12">
      <IconTile tint={tint} round>
        {icon}
      </IconTile>
      <div className="min-w-0 flex-1">
        <p className="text-14 font-bold text-default">{title}</p>
        <div className="mt-4 text-12 text-neutral-700">{description}</div>
      </div>
      {action}
    </div>
  )
}

/** What is owed, stated three ways: due, settled, or short. */
function BillLine() {
  const s = useApp()
  if (s.billState === 'paid' && s.paidAmount >= WEEKLY_BILL) {
    return <span className="text-disabled line-through">{rupiah(WEEKLY_BILL)}</span>
  }
  if (s.billState === 'paid') {
    return <span className="text-red-500">{rupiah(outstanding(s))} (sisa tunggakan)</span>
  }
  return <>{rupiah(WEEKLY_BILL)}</>
}

function BayarButton({ onPay }: { onPay: () => void }) {
  const flow = useFlow()
  const s = useApp()

  if (s.billState === 'pending') {
    return (
      <TaskButton tone="orange" onClick={() => flow.go('pending')}>
        Cek status
      </TaskButton>
    )
  }
  if (s.billState === 'paid' && s.paidAmount >= WEEKLY_BILL) {
    return (
      <TaskButton tone="green" disabled>
        <Check size={16} /> Lunas
      </TaskButton>
    )
  }
  if (s.billState === 'paid') {
    return (
      <TaskButton tone="primary" onClick={onPay}>
        Bayar sisa
      </TaskButton>
    )
  }
  return (
    <TaskButton tone="primary" onClick={onPay}>
      Bayar
    </TaskButton>
  )
}

function AbsenButton({ onCheck }: { onCheck: () => void }) {
  const s = useApp()

  if (s.attendState === 'checking') {
    return (
      <TaskButton tone="neutral" disabled>
        Mengecek…
      </TaskButton>
    )
  }
  if (s.attendState === 'ok') {
    return (
      <TaskButton tone="green" disabled>
        <Check size={16} /> Hadir
      </TaskButton>
    )
  }
  return (
    <TaskButton tone={s.attendState === 'fail' ? 'red' : 'primary'} onClick={onCheck}>
      {s.attendState === 'fail' ? 'Coba lagi' : 'Absen'}
    </TaskButton>
  )
}

function QuickLink({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex flex-1 items-center justify-center gap-8 rounded-full border border-default bg-neutral-white px-12 py-12 text-14 text-default"
    >
      <span className="text-primary-500">{icon}</span>
      {label}
      <ChevronRight size={16} />
    </button>
  )
}
