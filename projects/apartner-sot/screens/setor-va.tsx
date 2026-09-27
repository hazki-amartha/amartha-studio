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
// Status is the branch's to report, not hers: "Perbarui Halaman" asks, and
// each leg flips Menunggu → Berhasil as it lands (in the prototype, one per
// tap). The second landing records the settlement. Until the first one lands
// she can still call the whole thing off — "Batalkan setoran".
//
// Back always returns to the schedule: the numbers are made, so stepping back
// into the method page would offer to make them again. The schedule's widget
// carries her back here while it is open.

import { NavigationHeader } from '@/design-system/components'
import { RpHistory } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { SETOR_DEADLINE, CancelSetor, DeadlineNote, HowList, LegCard, setorLegs } from '../lib/setor'
import { store, unsettledTotal, useApp } from '../lib/store'
import { AppScreen, Collapsible, SectionTitle } from '../lib/ui'

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

  // Straight from the gallery there is no handover in flight; draw a fresh one.
  const f = s.setorInFlight ?? {
    no: s.settlements.length + 1,
    amount: s.depositAmount ?? unsettledTotal(s),
    paid: 0,
  }
  const legs = setorLegs(f.no, f.amount)

  return (
    <AppScreen
      topBar={
        <NavigationHeader
          title="Setor pembayaran"
          onBack={() => flow.go('today')}
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
        amount={f.amount}
        legs={legs}
        paid={f.paid}
        onRefresh={() => store.refreshSetor()}
      />

      <DeadlineNote>Setor sebelum {SETOR_DEADLINE} ke kedua VA di atas.</DeadlineNote>

      <SectionTitle>Cara bayar via BRI Virtual Account:</SectionTitle>
      <div className="flex flex-col gap-8">
        {CHANNELS.map((c) => (
          <Collapsible key={c.title} title={c.title} defaultOpen={c.open}>
            <HowList steps={c.steps} />
          </Collapsible>
        ))}
      </div>

      <CancelSetor
        disabled={f.paid > 0}
        onCancelled={() => {
          store.cancelSetor()
          flow.go('today')
        }}
      />
    </AppScreen>
  )
}
