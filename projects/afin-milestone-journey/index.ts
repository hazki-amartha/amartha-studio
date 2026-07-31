// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import * as demo from './lib/demo'

/** Shared by both home options, so a state control means the same thing on
 *  whichever of the two is on screen. */
const homeStates = [
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
    id: 'reward-berisiko',
    label: 'Reward berisiko',
    description: 'She has fallen behind — the goal card warns the reward can be forfeited unless she pays and attends this week.',
    apply: demo.rewardBerisiko,
  },
]

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'home',
      title: 'Home',
      component: lazyScreen(() => import('./screens/home-v2'), 'HomeV2Screen'),
      entry: true,
      states: homeStates,
      flowsTo: [
        { to: 'topup', label: 'isi saldo poket' },
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
      component: lazyScreen(() => import('./screens/progress'), 'ProgressScreen'),
      states: [
        {
          id: 'journey-sekarang',
          label: 'Perjalanan sekarang',
          description: 'The entry view — four rungs from 14 Jul to the 23 Mar limit rise.',
          apply: demo.journeySekarang,
        },
        {
          id: 'journey-gagal',
          label: 'Goal 14 Jul gagal',
          description: 'The first goal was missed — its rung shows Gagal in red.',
          apply: demo.journeyGagal,
        },
        {
          id: 'journey-okt',
          label: 'Hari ini 6 Okt',
          description: 'The first cair is done and gone; 6 Okt is reached and ready to cair.',
          apply: demo.journeyOkt,
        },
        {
          id: 'journey-jan',
          label: 'Hari ini 26 Jan',
          description: '6 Okt and 26 Jan are both reached and awaiting their (purple) action.',
          apply: demo.journeyJan,
        },
        {
          id: 'journey-mar',
          label: 'Hari ini 23 Mar',
          description: 'Only the limit-rise rung remains — reached, with a Cairkan button.',
          apply: demo.journeyMar,
        },
        {
          id: 'journey-newloan',
          label: 'Limit baru cair',
          description: 'The larger loan is disbursed — a fresh ladder toward a Rp10jt ceiling.',
          apply: demo.journeyNewLoan,
        },
      ],
      flowsTo: [
        { to: 'milestone-unlocked', label: '14 Jul — cairkan sekarang' },
        { to: 'milestone-progress', label: '6 Okt — lihat progress' },
        { to: 'milestone-pelunasan', label: '26 Jan — lihat progress' },
        { to: 'milestone-limit', label: '23 Mar — lihat progress' },
        { to: 'home', label: 'kembali' },
      ],
    },
    {
      id: 'milestone-progress',
      title: 'Target 6 Okt 2026',
      component: lazyScreen(() => import('./screens/milestone-progress'), 'MilestoneProgressScreen'),
      flowsTo: [
        { to: 'riwayat', label: 'lihat progress bayar & hadir' },
        { to: 'majelis', label: 'lihat progress majelis' },
        { to: 'progress', label: 'kembali' },
      ],
    },
    {
      id: 'milestone-pelunasan',
      title: 'Target 26 Jan 2027',
      component: lazyScreen(() => import('./screens/milestone-pelunasan'), 'MilestonePelunasanScreen'),
      flowsTo: [
        { to: 'riwayat', label: 'lihat progress bayar & hadir' },
        { to: 'progress', label: 'kembali' },
      ],
    },
    {
      id: 'milestone-limit',
      title: 'Target 23 Mar 2027',
      component: lazyScreen(() => import('./screens/milestone-limit'), 'MilestoneLimitScreen'),
      flowsTo: [
        { to: 'riwayat', label: 'lihat progress bayar & hadir' },
        { to: 'majelis', label: 'lihat progress majelis' },
        { to: 'progress', label: 'kembali' },
      ],
    },
    {
      id: 'riwayat',
      title: 'Riwayat bayar & hadir',
      component: lazyScreen(() => import('./screens/riwayat'), 'RiwayatScreen'),
      flowsTo: [{ to: 'home', label: 'kembali' }],
    },
    {
      id: 'majelis',
      title: 'Majelis Melati 07',
      component: lazyScreen(() => import('./screens/majelis'), 'MajelisScreen'),
      flowsTo: [
        { to: 'whatsapp-reminder', label: 'ingatkan' },
        { to: 'home', label: 'kembali' },
      ],
    },
    {
      id: 'whatsapp-reminder',
      title: 'Kirim pengingat',
      component: lazyScreen(() => import('./screens/whatsapp-reminder'), 'WhatsAppReminderScreen'),
      flowsTo: [{ to: 'majelis', label: 'terkirim' }],
    },
    {
      id: 'milestone-unlocked',
      title: 'Milestone minggu 12',
      component: lazyScreen(() => import('./screens/milestone-unlocked'), 'MilestoneUnlockedScreen'),
      flowsTo: [
        { to: 'disburse-amount', label: 'cairkan sekarang' },
        { to: 'progress', label: 'nanti saja' },
      ],
    },
    {
      id: 'disburse-amount',
      title: 'Cairkan modal tambahan',
      component: lazyScreen(() => import('./screens/disburse-amount'), 'DisburseAmountScreen'),
      flowsTo: [{ to: 'disburse-success', label: 'cairkan' }],
    },
    {
      id: 'disburse-success',
      title: 'Pencairan berhasil',
      component: lazyScreen(() => import('./screens/disburse-success'), 'DisburseSuccessScreen'),
      flowsTo: [
        { to: 'progress', label: 'lihat perjalananmu' },
        { to: 'home', label: 'kembali ke home' },
      ],
    },
    {
      id: 'amount',
      title: 'Jumlah pembayaran',
      component: lazyScreen(() => import('./screens/amount'), 'AmountScreen'),
      flowsTo: [{ to: 'method', label: 'lanjut' }],
    },
    {
      id: 'method',
      title: 'Metode pembayaran',
      component: lazyScreen(() => import('./screens/method'), 'MethodScreen'),
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
      component: lazyScreen(() => import('./screens/instruction'), 'InstructionScreen'),
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
      component: lazyScreen(() => import('./screens/poket-confirm'), 'PoketConfirmScreen'),
      flowsTo: [
        { to: 'success', label: 'bayar sekarang' },
        { to: 'method', label: 'ganti metode' },
      ],
    },
    {
      id: 'poket-shortfall',
      title: 'Saldo tidak cukup',
      component: lazyScreen(() => import('./screens/poket-shortfall'), 'PoketShortfallScreen'),
      flowsTo: [
        { to: 'topup', label: 'isi saldo' },
        { to: 'method', label: 'pilih metode lain' },
      ],
    },
    {
      id: 'topup',
      title: 'Isi Saldo Poket',
      component: lazyScreen(() => import('./screens/topup'), 'TopupScreen'),
      flowsTo: [
        { to: 'poket-confirm', label: 'isi saldo (menutup kekurangan)' },
        { to: 'home', label: 'isi saldo (dari Poket)' },
      ],
    },
    {
      id: 'pending',
      title: 'Menunggu konfirmasi',
      component: lazyScreen(() => import('./screens/pending'), 'PendingScreen'),
      flowsTo: [
        { to: 'success', label: 'simulasi konfirmasi' },
        { to: 'home', label: 'kembali ke beranda' },
      ],
    },
    {
      id: 'success',
      title: 'Pembayaran berhasil',
      component: lazyScreen(() => import('./screens/success'), 'SuccessScreen'),
      flowsTo: [{ to: 'home', label: 'kembali ke beranda' }],
    },
  ],
}
