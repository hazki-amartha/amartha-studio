'use client'

// Bayar via BRI Virtual Account — the VA road of the New Concept.
//
// The page is one transaction seen as TWO: each lending entity has its own
// virtual account, its own share and its own status, because the branch
// reconciles them separately and a BP who has paid one and not the other is in
// a real state the old single-figure screen could not draw.
//
// Everything below the numbers is instructions, panelled by the way she is
// paying — mobile banking open, the rest folded — since a BP on her tenth
// handover never reads them and a BP on her first cannot do this without them.
//
// Nothing leaves the prototype (CLAUDE.md §3): "Saya sudah transfer" draws the
// result on the row rather than opening a bank app.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { RpHistory } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { SETOR_DEADLINE, DeadlineNote, HowList, LegCard, setorLegs } from '../lib/setor'
import { store, unsettledTotal, useApp } from '../lib/store'
import { AppScreen, Collapsible, SectionTitle, StickyBar } from '../lib/ui'

/** How the transfer actually gets made, per channel BRI offers. */
const CHANNELS: { title: string; steps: string[]; open?: boolean }[] = [
  {
    title: 'BRImo',
    steps: [
      'Login pada aplikasi BRImo.',
      'Pilih menu BRIVA.',
      'Masukkan Nomor BRIVA yang akan dibayarkan.',
      'Periksa nama dan nominal tagihan, lalu konfirmasi.',
      'Masukkan PIN BRImo, lalu simpan bukti pembayarannya.',
    ],
  },
  {
    title: 'Mobile banking BRI',
    open: true,
    steps: [
      'Login pada aplikasi Mobile banking BRI.',
      'Pilih menu Info > Info BRIVA.',
      'Masukan Nomor BRIVA untuk pembayaran Anda yang akan dibayarkan.',
      'Masukan nominal isi saldo yang diinginkan dengan minimum isi saldo Rp10.000.',
      'Masukkan PIN BRI Anda untuk memverifikasi transaksi.',
      'Ikuti instruksi untuk menyelesaikan transaksi.',
      'Simpan notifikasi SMS sebagai bukti pembayaran.',
    ],
  },
  {
    title: 'ATM BRI',
    steps: [
      'Masukkan kartu ATM dan PIN BRI Anda.',
      'Pilih menu Transaksi Lain > Pembayaran > Lainnya > BRIVA.',
      'Masukkan Nomor BRIVA yang akan dibayarkan.',
      'Periksa nama dan nominal tagihan, lalu konfirmasi.',
      'Simpan struk sebagai bukti pembayaran.',
    ],
  },
  {
    title: 'Internet banking BRI',
    steps: [
      'Login pada Internet Banking BRI.',
      'Pilih menu Pembayaran > BRIVA.',
      'Masukkan Nomor BRIVA yang akan dibayarkan.',
      'Masukkan password dan mToken, lalu konfirmasi.',
      'Simpan struk elektronik sebagai bukti pembayaran.',
    ],
  },
  {
    title: 'Teller BRI',
    steps: [
      'Datangi unit kerja BRI terdekat.',
      'Isi slip setoran dengan Nomor BRIVA dan nominal yang akan dibayarkan.',
      'Serahkan slip dan uang tunai ke teller.',
      'Simpan struk dari teller sebagai bukti pembayaran.',
    ],
  },
]

export function SetorVaScreen() {
  const flow = useFlow()
  const s = useApp()

  const amount = s.depositAmount ?? unsettledTotal(s)
  const no = s.settlements.length + 1
  const legs = setorLegs(no, amount)

  // One flag per leg. Local: both are answered minutes before the bag settles
  // and the screen navigates away, so neither needs to survive a trip.
  const [paid, setPaid] = useState<boolean[]>(() => legs.map(() => false))
  const markPaid = (i: number) => setPaid((prev) => prev.map((p, j) => (j === i ? true : p)))
  const allPaid = paid.every(Boolean)

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title="Setor pembayaran"
          onBack={() => flow.back()}
          trailingIcons={[
            <button
              key="riwayat"
              type="button"
              aria-label="Riwayat pembayaran"
              onClick={() => flow.go('setor-riwayat')}
            >
              <RpHistory size={24} />
            </button>,
          ]}
        />
      }
    >
      <LegCard
        title="Bayar via BRI Virtual Account"
        amount={amount}
        legs={legs}
        paid={paid}
        onPaid={markPaid}
        prefix="VA "
        action="Saya sudah transfer"
      />

      <DeadlineNote>Setor sebelum {SETOR_DEADLINE} ke VA yang sesuai.</DeadlineNote>

      <SectionTitle>Cara bayar via BRI Virtual Account:</SectionTitle>
      <div className="flex flex-col gap-8">
        {CHANNELS.map((c) => (
          <Collapsible key={c.title} title={c.title} defaultOpen={c.open}>
            <HowList steps={c.steps} />
          </Collapsible>
        ))}
      </div>

      {/* Only once BOTH legs are in. Before that the handover is half-made, and
          a confirm here would record a settlement the branch can only match one
          side of. */}
      {allPaid ? (
        <StickyBar>
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              store.settle(false)
              flow.go('setor-riwayat')
            }}
          >
            Konfirmasi Setoran
          </Button>
        </StickyBar>
      ) : null}
    </AppScreen>
  )
}
