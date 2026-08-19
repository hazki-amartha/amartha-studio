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
    label: 'Active mitra',
    description: 'Week 12 of the tenor — a bill to pay and a kumpulan to attend.',
    apply: demo.mitraAktif,
  },
  {
    id: 'mitra-baru',
    label: 'New mitra',
    description: 'No repayment history yet, so the nearest goal is the first pencairan.',
    apply: demo.mitraBaru,
  },
  {
    id: 'sudah-lunas',
    label: 'Instalment paid',
    description: 'Paid in full — the task shows Lunas and the amount is struck through.',
    apply: demo.sudahLunas,
  },
  {
    id: 'menunggu-konfirmasi',
    label: 'Awaiting confirmation',
    description: 'Paid off-app via VA — the task turns amber and offers Cek status.',
    apply: demo.menungguKonfirmasi,
  },
  {
    id: 'titip-bayar',
    label: 'Paid via field officer',
    description: 'Cash handed to the field officer, not yet settled to head office — a grey tick, and nothing for her to press.',
    apply: demo.titipBayar,
  },
  {
    id: 'sisa-tunggakan',
    label: 'Arrears remaining',
    description: 'A Rp50.000 part-payment landed, so Rp100.000 is now arrears.',
    apply: demo.sisaTunggakan,
  },
  {
    id: 'reward-berisiko',
    label: 'Reward at risk',
    description: 'She has fallen behind — the goal card warns the reward can be forfeited unless she pays and attends this week.',
    apply: demo.rewardBerisiko,
  },
  {
    id: 'sudah-hadir',
    label: 'Attended kumpulan',
    description: 'She turned up this week — the kumpulan row ticks while the bill is still outstanding.',
    apply: demo.sudahHadir,
  },
  {
    id: 'semua-beres',
    label: 'All clear',
    description: 'Every row ticked: week paid, kumpulan attended, nobody in the majelis behind.',
    apply: demo.semuaBeres,
  },
  {
    id: 'limit-terbuka',
    label: 'Limit ready to draw',
    description: 'A goal is reached and the money still undrawn, so the card carries a disbursement row under the tasks.',
    apply: demo.limitTerbuka,
  },
]

/**
 * The "Angsuran Anda" card on Home - alt only — its own selector
 * (lib/revolving.ts), independent of the AppState signals homeStates above
 * writes to. Only AWAL is a genuinely new scenario; the other three ride
 * existing homeStates entries instead of adding three more rows to an
 * already-10-deep panel:
 *   - "All clear" (semuaBeres)     → mendekati, kelompok lancar   (2a)
 *   - "Active mitra" (mitraAktif)  → mendekati, kelompok belum lancar (2b)
 *   - "Reward at risk" (rewardBerisiko) → menunggak              (3)
 * See the cardStateStore.set(...) calls added to those three in demo.ts.
 */
const cardStates = [
  {
    id: 'card-awal',
    label: 'Early repayment',
    description: 'Loan repayment in early stages. Nothing to offer but a motivation only.',
    apply: demo.earlyRepayment,
  },
]

/** Only these actually move the "Angsuran Anda" card (see the
 *  cardStateStore.set(...) calls in demo.ts and cardStates above) — every
 *  other homeStates entry still drives the rest of Home - alt (Poket,
 *  billing) exactly as it does on `home`, but leaves this card exactly where
 *  it was. Marked with a trailing "*" in the panel so a designer isn't left
 *  wondering why the card didn't change. */
const CARD_DESIGNED_IDS = new Set([
  'card-awal',
  'mitra-baru',
  'mitra-aktif',
  'sudah-lunas',
  'menunggu-konfirmasi',
  'titip-bayar',
  'sisa-tunggakan',
  'semua-beres',
  'reward-berisiko',
  'limit-terbuka',
])
const markUndesigned = <T extends { id: string; label: string }>(s: T): T =>
  CARD_DESIGNED_IDS.has(s.id) ? s : { ...s, label: `${s.label} *` }

/** Home - alt's own ordering — Early repayment slotted in at position 2,
 *  "All clear" moved just above Limit ready to draw. A separate array so
 *  `home`'s own panel keeps its original order and its unmarked labels.
 *  "New mitra" is relabelled here only — this is the one state that swaps
 *  the whole card for "Pinjaman Ibu" rather than moving cardStateStore. */
const homeAltStates = [
  { ...homeStates.find((s) => s.id === 'mitra-baru')!, label: 'New Mitra — belum pernah mencairkan' },
  cardStates[0],
  homeStates.find((s) => s.id === 'mitra-aktif')!,
  homeStates.find((s) => s.id === 'menunggu-konfirmasi')!,
  homeStates.find((s) => s.id === 'sudah-lunas')!,
  homeStates.find((s) => s.id === 'titip-bayar')!,
  homeStates.find((s) => s.id === 'sisa-tunggakan')!,
  homeStates.find((s) => s.id === 'reward-berisiko')!,
  homeStates.find((s) => s.id === 'sudah-hadir')!,
  homeStates.find((s) => s.id === 'semua-beres')!,
  homeStates.find((s) => s.id === 'limit-terbuka')!,
].map(markUndesigned)

/** Shared by both Perjalanan pendanaan layouts, so a phase means the same
 *  thing on whichever of the two is on screen. */
const journeyStates = [
  {
    id: 'journey-sekarang',
    label: 'Before 14 Jul',
    description: 'The entry view — today is before the first goal, so nothing is unlocked or missed and 14 Jul is simply next.',
    apply: demo.journeySekarang,
  },
  {
    id: 'journey-sisa-limit',
    label: 'Limit partly undrawn',
    description: 'Same week, with Rp2.500.000 of her limit still undrawn — an already-open rung at the top of the ladder.',
    apply: demo.journeySisaLimit,
  },
  {
    id: 'journey-jul',
    label: 'Goal 14 Jul reached',
    description: 'The first goal is reached and ready to cair; 6 Okt becomes the next goal.',
    apply: demo.journeyJul,
  },
  {
    id: 'journey-gagal',
    label: 'Goal 14 Jul missed',
    description: 'The first goal was missed — its rung shows Gagal in red.',
    apply: demo.journeyGagal,
  },
  {
    id: 'journey-okt',
    label: 'Today is 6 Okt',
    description: '14 Jul stays on the ladder as a collected rung; 6 Okt is reached and ready to cair, 26 Jan is the next goal.',
    apply: demo.journeyOkt,
  },
  {
    id: 'journey-jan',
    label: 'Today is 26 Jan',
    description: '6 Okt and 26 Jan are both reached and awaiting their (purple) action; 23 Mar is the next goal.',
    apply: demo.journeyJan,
  },
  {
    id: 'journey-mar',
    label: 'Today is 23 Mar',
    description: 'Three collected rungs above a reached limit rise — the last rung of the cycle, so it carries the next-goal marker.',
    apply: demo.journeyMar,
  },
  {
    id: 'journey-newloan',
    label: 'New limit drawn',
    description: 'The cycle closed: a fresh ladder toward Rp10jt, last cycle behind a link at the foot of the page.',
    apply: demo.journeyNewLoan,
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
    // "Alt" set — revolving-credit reframe of the naik-limit card. Sits right
    // under the screen it's an alternative to, so the two are easy to compare.
    // home-v2.tsx and progress.tsx / progress-alt.tsx above are untouched;
    // these read the same store, so a demo state set on either means the same
    // thing on both.
    {
      id: 'home-alt',
      title: 'Home - alt',
      component: lazyScreen(() => import('./screens/home-alt'), 'HomeAltScreen'),
      states: homeAltStates,
      flowsTo: [
        { to: 'perjalanan-alt2', label: 'lihat semua' },
        { to: 'riwayat', label: 'lihat riwayat (status angsuran)' },
        { to: 'majelis-alt', label: 'cek kelompok (status kelompok)' },
        { to: 'amount', label: 'bayar' },
        { to: 'pending', label: 'cek status (awaiting confirmation)' },
        { to: 'milestone-12-alt', label: 'cairkan pinjaman (limit terbuka)' },
      ],
    },
    {
      id: 'progress',
      title: 'Perjalanan 48 minggu',
      component: lazyScreen(() => import('./screens/progress'), 'ProgressScreen'),
      states: journeyStates,
      flowsTo: [
        { to: 'milestone-unlocked', label: '14 Jul — cairkan sekarang' },
        { to: 'milestone-missed', label: '14 Jul — gagal' },
        { to: 'milestone-progress', label: '6 Okt — lihat progress' },
        { to: 'milestone-pelunasan', label: '26 Jan — lihat progress' },
        { to: 'milestone-limit', label: '23 Mar — lihat progress' },
        { to: 'riwayat', label: 'progress pribadi' },
        { to: 'majelis', label: 'progress majelis' },
        { to: 'home', label: 'kembali' },
      ],
    },
    {
      id: 'perjalanan-alt2',
      title: 'Perjalanan 48w - alt 2',
      component: lazyScreen(() => import('./screens/perjalanan-alt2'), 'PerjalananAlt2Screen'),
      states: journeyStates,
      flowsTo: [
        { to: 'milestone-12-alt', label: 'cairkan (rung terbuka)' },
        { to: 'milestone-unlocked', label: 'rung sudah dicairkan' },
        { to: 'milestone-progress', label: '6 Okt — lihat progress' },
        { to: 'milestone-pelunasan', label: '26 Jan — lihat progress' },
        { to: 'milestone-limit', label: '23 Mar — lihat progress' },
        { to: 'milestone-missed', label: 'rung terlewat' },
        { to: 'riwayat', label: 'riwayat angsuran' },
        { to: 'majelis-alt', label: 'detail majelis' },
        { to: 'home-alt', label: 'kembali' },
      ],
    },
    {
      id: 'progress-alt',
      title: 'Perjalanan 48 minggu — alternatif',
      component: lazyScreen(() => import('./screens/progress-alt'), 'ProgressAltScreen'),
      states: journeyStates,
      flowsTo: [
        { to: 'milestone-unlocked', label: '14 Jul — cairkan sekarang' },
        { to: 'milestone-missed', label: '14 Jul — gagal' },
        { to: 'milestone-progress', label: '6 Okt — lihat progress' },
        { to: 'milestone-pelunasan', label: '26 Jan — lihat progress' },
        { to: 'milestone-limit', label: '23 Mar — lihat progress' },
        { to: 'riwayat', label: 'progress pribadi' },
        { to: 'majelis', label: 'progress majelis' },
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
        { to: 'majelis', label: 'lihat progress majelis' },
        { to: 'disburse-amount', label: 'mulai pelunasan dini (saat tercapai)' },
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
      title: 'Progress pribadi',
      component: lazyScreen(() => import('./screens/riwayat'), 'RiwayatScreen'),
      // A static read — outstanding balance and the weekly record — whose one
      // action is Detail, opening the loan-level list of disbursements.
      flowsTo: [
        { to: 'pencairan', label: 'detail — semua pencairan' },
        { to: 'home', label: 'kembali' },
      ],
    },
    {
      id: 'pencairan',
      title: 'Semua pencairan',
      component: lazyScreen(() => import('./screens/pencairan'), 'PencairanScreen'),
      flowsTo: [{ to: 'riwayat', label: 'kembali' }],
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
      id: 'majelis-alt',
      title: 'Majelis Melati 07 - alt',
      component: lazyScreen(() => import('./screens/majelis-alt'), 'MajelisAltScreen'),
      flowsTo: [{ to: 'home-alt', label: 'kembali' }],
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
      id: 'milestone-12-alt',
      title: 'Milestone minggu 12 - alt',
      component: lazyScreen(() => import('./screens/milestone-12-alt'), 'Milestone12AltScreen'),
      flowsTo: [
        { to: 'cairkan-alt', label: 'cairkan sekarang' },
        { to: 'home-alt', label: 'nanti saja' },
      ],
    },
    {
      id: 'milestone-missed',
      title: 'Milestone minggu 12 — gagal',
      component: lazyScreen(() => import('./screens/milestone-missed'), 'MilestoneMissedScreen'),
      flowsTo: [
        { to: 'riwayat', label: 'riwayat pembayaran & kehadiran' },
        { to: 'progress', label: 'tutup' },
      ],
    },
    {
      id: 'disburse-amount',
      title: 'Cairkan modal tambahan',
      component: lazyScreen(() => import('./screens/disburse-amount'), 'DisburseAmountScreen'),
      flowsTo: [{ to: 'disburse-success', label: 'cairkan' }],
    },
    {
      id: 'cairkan-alt',
      title: 'Cairkan modal tambahan - alt',
      component: lazyScreen(() => import('./screens/cairkan-alt'), 'CairkanAltScreen'),
      flowsTo: [{ to: 'home-alt', label: 'cairkan' }],
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
      states: [
        {
          id: 'autodebit-kurang',
          label: 'Autodebit — balance short',
          description: 'Armed against a Rp80.000 wallet, so the banner leads with Top-up.',
          apply: demo.autodebitKurang,
        },
        {
          id: 'autodebit-aktif',
          label: 'Autodebit ready',
          description: 'Armed and funded — the banner states the withdrawal date.',
          apply: demo.autodebitAktif,
        },
      ],
      flowsTo: [
        { to: 'konfirmasi', label: 'lanjut' },
        { to: 'topup', label: 'top-up (autodebit kurang)' },
      ],
    },
    {
      id: 'konfirmasi',
      title: 'Konfirmasi',
      component: lazyScreen(() => import('./screens/konfirmasi'), 'KonfirmasiScreen'),
      states: [
        {
          id: 'poket-cukup',
          label: 'Poket balance enough',
          description: 'Rp200.000 against a Rp150.000 bill — Poket routes to confirm.',
          apply: demo.poketCukup,
        },
        {
          id: 'poket-kurang',
          label: 'Poket balance short',
          description: 'Rp80.000 against a Rp150.000 bill — Poket routes to the shortfall.',
          apply: demo.poketKurang,
        },
        {
          id: 'bayar-sebagian',
          label: 'Partial payment',
          description: 'A Rp50.000 part-payment in progress.',
          apply: demo.bayarSebagian,
        },
      ],
      flowsTo: [
        { to: 'success', label: 'poket, saldo cukup' },
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
          label: 'Bank transfer',
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
        { to: 'konfirmasi', label: 'ganti metode' },
      ],
    },
    {
      id: 'poket-shortfall',
      title: 'Saldo tidak cukup',
      component: lazyScreen(() => import('./screens/poket-shortfall'), 'PoketShortfallScreen'),
      flowsTo: [
        { to: 'topup', label: 'isi saldo' },
        { to: 'konfirmasi', label: 'pilih metode lain' },
      ],
    },
    {
      id: 'topup',
      title: 'Isi Saldo Poket',
      component: lazyScreen(() => import('./screens/topup'), 'TopupScreen'),
      flowsTo: [
        { to: 'konfirmasi', label: 'isi saldo (menutup kekurangan)' },
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
