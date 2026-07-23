// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import * as demo from './lib/demo'
import { HomeScreen } from './screens/home'
import { ProgressScreen } from './screens/progress'
import { RiwayatScreen } from './screens/riwayat'
import { MajelisScreen } from './screens/majelis'
import { WhatsAppReminderScreen } from './screens/whatsapp-reminder'
import { MilestoneUnlockedScreen } from './screens/milestone-unlocked'
import { DisburseAmountScreen } from './screens/disburse-amount'
import { DisburseSuccessScreen } from './screens/disburse-success'
import { AmountScreen } from './screens/amount'
import { MethodScreen } from './screens/method'
import { InstructionScreen } from './screens/instruction'
import { PoketConfirmScreen } from './screens/poket-confirm'
import { PoketShortfallScreen } from './screens/poket-shortfall'
import { TopupScreen } from './screens/topup'
import { PendingScreen } from './screens/pending'
import { SuccessScreen } from './screens/success'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'home',
      title: 'Home',
      component: HomeScreen,
      entry: true,
      states: [
        {
          id: 'mitra-aktif',
          label: 'Mitra aktif',
          description: 'Week 14 of the tenor — a bill to pay and a kumpulan to attend.',
          apply: demo.mitraAktif,
        },
        {
          id: 'mitra-baru',
          label: 'Mitra baru',
          description: 'No repayment history yet, so the nearest goal is the first pencairan.',
          apply: demo.mitraBaru,
        },
        {
          id: 'sudah-lunas',
          label: 'Angsuran lunas',
          description: 'Paid in full — the task shows Lunas and the amount is struck through.',
          apply: demo.sudahLunas,
        },
        {
          id: 'menunggu-konfirmasi',
          label: 'Menunggu konfirmasi',
          description: 'Paid off-app via VA — the task turns amber and offers Cek status.',
          apply: demo.menungguKonfirmasi,
        },
        {
          id: 'sisa-tunggakan',
          label: 'Sisa tunggakan',
          description: 'A Rp50.000 part-payment landed, so Rp100.000 is now arrears.',
          apply: demo.sisaTunggakan,
        },
        {
          id: 'absen-gagal',
          label: 'Absen gagal 2x',
          description: 'The location check has failed twice — the Hubungi BP escape is showing.',
          apply: demo.absenGagal,
        },
        {
          id: 'absen-berhasil',
          label: 'Absen berhasil',
          description: 'Attendance confirmed for the week.',
          apply: demo.absenBerhasil,
        },
      ],
      flowsTo: [
        { to: 'amount', label: 'bayar angsuran' },
        { to: 'pending', label: 'cek status' },
        { to: 'progress', label: 'lihat perjalanan / tab progress' },
        { to: 'majelis', label: 'tab majelis' },
        { to: 'riwayat', label: 'tab transaksi' },
        { to: 'disburse-amount', label: 'cairkan (mitra baru)' },
      ],
    },
    {
      id: 'progress',
      title: 'Perjalanan 48 minggu',
      component: ProgressScreen,
      flowsTo: [
        { to: 'milestone-unlocked', label: 'tap milestone terbuka' },
        { to: 'home', label: 'kembali' },
      ],
    },
    {
      id: 'riwayat',
      title: 'Riwayat bayar & hadir',
      component: RiwayatScreen,
      flowsTo: [{ to: 'home', label: 'kembali' }],
    },
    {
      id: 'majelis',
      title: 'Majelis Melati 07',
      component: MajelisScreen,
      flowsTo: [
        { to: 'whatsapp-reminder', label: 'ingatkan' },
        { to: 'home', label: 'kembali' },
      ],
    },
    {
      id: 'whatsapp-reminder',
      title: 'Kirim pengingat',
      component: WhatsAppReminderScreen,
      flowsTo: [{ to: 'majelis', label: 'terkirim' }],
    },
    {
      id: 'milestone-unlocked',
      title: 'Milestone minggu 12',
      component: MilestoneUnlockedScreen,
      flowsTo: [
        { to: 'disburse-amount', label: 'cairkan sekarang' },
        { to: 'progress', label: 'nanti saja' },
      ],
    },
    {
      id: 'disburse-amount',
      title: 'Cairkan modal tambahan',
      component: DisburseAmountScreen,
      flowsTo: [{ to: 'disburse-success', label: 'cairkan' }],
    },
    {
      id: 'disburse-success',
      title: 'Pencairan berhasil',
      component: DisburseSuccessScreen,
      flowsTo: [
        { to: 'progress', label: 'lihat perjalananmu' },
        { to: 'home', label: 'kembali ke home' },
      ],
    },
    {
      id: 'amount',
      title: 'Jumlah pembayaran',
      component: AmountScreen,
      flowsTo: [{ to: 'method', label: 'lanjut' }],
    },
    {
      id: 'method',
      title: 'Metode pembayaran',
      component: MethodScreen,
      states: [
        {
          id: 'poket-cukup',
          label: 'Saldo Poket cukup',
          description: 'Rp200.000 against a Rp150.000 bill — Poket routes to confirm.',
          apply: demo.poketCukup,
        },
        {
          id: 'poket-kurang',
          label: 'Saldo Poket kurang',
          description: 'Rp80.000 against a Rp150.000 bill — Poket routes to the shortfall.',
          apply: demo.poketKurang,
        },
        {
          id: 'bayar-sebagian',
          label: 'Bayar sebagian',
          description: 'A Rp50.000 part-payment in progress.',
          apply: demo.bayarSebagian,
        },
      ],
      flowsTo: [
        { to: 'poket-confirm', label: 'poket, saldo cukup' },
        { to: 'poket-shortfall', label: 'poket, saldo kurang' },
        { to: 'instruction', label: 'metode lain' },
        { to: 'amount', label: 'ubah jumlah' },
      ],
    },
    {
      id: 'instruction',
      title: 'Cara pembayaran',
      component: InstructionScreen,
      states: [
        {
          id: 'va-bca',
          label: 'Virtual Account BCA',
          description: 'VA number, deadline, and the five-step transfer.',
          apply: demo.viaVaBca,
        },
        {
          id: 'transfer',
          label: 'Transfer bank',
          description: 'Account details plus the 5–15 minute confirmation notice.',
          apply: demo.viaTransfer,
        },
        {
          id: 'indomaret',
          label: 'Indomaret / Alfamart',
          description: 'Payment code, 24-hour validity, and the Rp2.500 admin fee.',
          apply: demo.viaIndomaret,
        },
        {
          id: 'agen',
          label: 'Agen Amartha Link',
          description: 'The cash variant — no code to copy, because there is nothing to type.',
          apply: demo.viaAgen,
        },
      ],
      flowsTo: [
        { to: 'pending', label: 'saya sudah bayar' },
        { to: 'method', label: 'ganti metode' },
      ],
    },
    {
      id: 'poket-confirm',
      title: 'Konfirmasi Poket',
      component: PoketConfirmScreen,
      flowsTo: [
        { to: 'success', label: 'bayar sekarang' },
        { to: 'method', label: 'ganti metode' },
      ],
    },
    {
      id: 'poket-shortfall',
      title: 'Saldo tidak cukup',
      component: PoketShortfallScreen,
      flowsTo: [
        { to: 'topup', label: 'isi saldo' },
        { to: 'method', label: 'pilih metode lain' },
      ],
    },
    {
      id: 'topup',
      title: 'Isi Saldo Poket',
      component: TopupScreen,
      flowsTo: [{ to: 'poket-confirm', label: 'isi saldo' }],
    },
    {
      id: 'pending',
      title: 'Menunggu konfirmasi',
      component: PendingScreen,
      flowsTo: [
        { to: 'success', label: 'simulasi konfirmasi' },
        { to: 'home', label: 'kembali ke beranda' },
      ],
    },
    {
      id: 'success',
      title: 'Pembayaran berhasil',
      component: SuccessScreen,
      flowsTo: [{ to: 'home', label: 'kembali ke beranda' }],
    },
  ],
}
