// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { HomeScreen } from './screens/home'
import { MajelisScreen } from './screens/majelis'
import { MajelisDetailScreen } from './screens/majelis-detail'
import { MajelisVisitScreen } from './screens/majelis-visit'
import { MajelisOffersScreen } from './screens/majelis-offers'
import { MajelisProofScreen } from './screens/majelis-proof'
import { MitraDetailScreen } from './screens/mitra-detail'
import { HomeVisitScreen } from './screens/home-visit'
import { HomeProofScreen } from './screens/home-proof'
import { TitipBayarScreen } from './screens/titip-bayar'
import { KpiScreen } from './screens/kpi'
import { CommsScreen } from './screens/comms'
import { BannerDetailScreen } from './screens/banner-detail'
import { NotifScreen } from './screens/notif'
import { ProfileScreen } from './screens/profile'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'home',
      title: 'Beranda',
      component: HomeScreen,
      entry: true,
      notes: [
        'Entry screen, and the "Tugas" tab in everything but name — the task list is the primary work surface.',
        'Three stacked entry points sit above it: the banner carousel (Informasi & Program), the collection summary, and the KPI link.',
        'Four filters — waktu, jenis, majelis, tipe KPI — each open a bottom sheet, plus an icon-only sort (default / jarak terdekat). Filters default to "Hari ini" + "Wajib".',
        'Tapping a task routes by type: Kunjungan Majelis → majelis-detail, Kunjungan Rumah → mitra-detail (where the visit launches), Setor Titip Bayar → titip-bayar. Other task types are not tappable, matching the source.',
        'Arriving from a KPI parameter shows a context strip explaining why the list came in pre-filtered.',
      ],
      flowsTo: [
        { to: 'comms', label: 'lihat semua informasi' },
        { to: 'banner-detail', label: 'tap banner' },
        { to: 'kpi', label: 'lihat semua achievement / tab KPI' },
        { to: 'majelis', label: 'tab majelis' },
        { to: 'majelis-detail', label: 'tap tugas Kunjungan Majelis' },
        { to: 'mitra-detail', label: 'tap tugas Kunjungan Rumah' },
        { to: 'titip-bayar', label: 'tap tugas Setor Titip Bayar' },
        { to: 'notif', label: 'tap lonceng' },
        { to: 'profile', label: 'tap avatar' },
      ],
    },
    {
      id: 'majelis',
      title: 'Majelis',
      component: MajelisScreen,
      notes: [
        'Search spans majelis name, desa, and mitra name — one field, three targets.',
        'Sorting by a metric promotes it to a highlighted stat on every card and adds a rank number, so the ordering is legible rather than implicit.',
      ],
      flowsTo: [
        { to: 'majelis-detail', label: 'tap majelis' },
        { to: 'home', label: 'tab beranda' },
        { to: 'kpi', label: 'tab KPI' },
      ],
    },
    {
      id: 'majelis-detail',
      title: 'Detail Majelis',
      component: MajelisDetailScreen,
      notes: [
        'Browse-only now: what the group is, its status this week, and a mitra list that taps through to mitra-detail. On a kumpulan day it carries a "Mulai kunjungan" banner that launches the standalone Majelis visit flow (majelis-visit) rather than flipping this page into an inline visit mode.',
        'Mitra sort menunggak-first; a MAJ_FILTERS chip row (Semua / Belum bayar / Sudah bayar / Pengajuan) narrows the list further.',
      ],
      flowsTo: [
        { to: 'majelis', label: 'kembali' },
        { to: 'mitra-detail', label: 'tap kartu mitra' },
        { to: 'majelis-visit', label: 'Mulai kunjungan' },
      ],
    },
    {
      id: 'majelis-visit',
      title: 'Majelis Visit - 1 — Kehadiran & Pembayaran',
      component: MajelisVisitScreen,
      notes: [
        'Step 1 of 3, ported from the Task-First direction. The queue drains on RECORDED, not paid — a mitra recorded as "tidak bayar" (reason + PTP) still counts as done. dpd-0 mitra are seeded as already paid this week, so the queue is only who the BP has to collect from.',
        'Attendance is two named pills; payment is one "Tagih" button opening a sheet with "Bayar Penuh" preselected. A short "Bayar Sebagian" now asks the same reason + PTP a "Tidak Bayar" asks — the shortfall is a closed outcome, not a gap.',
        'Recorded mitra stay in the list as full cards, marked with their outcome ("Sudah ditagih", "Sudah ditagih sebagian · PTP …"); there is no separate collapsed drawer.',
      ],
      flowsTo: [
        { to: 'majelis-offers', label: 'Lanjut → langkah 2' },
        { to: 'mitra-detail', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'majelis-offers',
      title: 'Majelis Visit - 2 — Tugas Tambahan',
      component: MajelisOffersScreen,
      notes: [
        'Step 2 of 3 — the same mitra list and card as step 1, action row swapped for a renewal/Celengan recommendation. Cross-sell comes after collection, one offer per mitra, and the whole step is skippable ("Lewati").',
        'Only mitra with an actual recommendation are shown; "Tawarkan" records what she said (Tertarik / Tidak tertarik), not merely that she was asked.',
      ],
      flowsTo: [
        { to: 'majelis-proof', label: 'Lanjut / Lewati → langkah 3' },
        { to: 'majelis-visit', label: 'kembali' },
        { to: 'mitra-detail', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'majelis-proof',
      title: 'Majelis Visit - 3 — Bukti & Kirim',
      component: MajelisProofScreen,
      notes: [
        'Step 3 of 3 — a recap that reads back what was entered, then location + photo, both required before Submit unlocks. Submitting finishes the majelis task and returns to Beranda.',
        'Warns on work not DONE (unmarked attendance, uncollected mitra), never on money not collected — a recorded "tidak bayar" is finished work.',
      ],
      flowsTo: [{ to: 'home', label: 'Selesaikan Kunjungan' }],
    },
    {
      id: 'mitra-detail',
      title: 'Detail Mitra',
      component: MitraDetailScreen,
      notes: [
        'Live now — reached from a Home Kunjungan Rumah task, or a mitra card on majelis-detail / the majelis visit. Opened directly it renders Rury Ramadhita (ketua, autodebit, PIC, celengan), the record that exercises every section.',
        'Two views in one screen: a compact "main" view (active tasks, HV launcher, recommendations) that taps through to a full "profil" view (loan history, progress-limit outlook, attendance, produk lain).',
        'The active Kunjungan Rumah task gets its own primary-tinted launcher card; "Mulai kunjungan" opens the standalone Home visit flow (home-visit).',
        '"+ Jadikan tugas" writes a real task into the shared store, so a captured recommendation shows up in Beranda\'s list under the Rekomendasi filter.',
      ],
      flowsTo: [{ to: 'home-visit', label: 'mulai kunjungan' }],
    },
    {
      id: 'home-visit',
      title: 'Home Visit - 1 — Temui & Tagih',
      component: HomeVisitScreen,
      notes: [
        'Step 1 of 2, ported from the Task-First direction — it replaces the branching Kunjungan Rumah wizard. One mitra, so everything lives on the page: doorstep card, the amount owed, who answered the door, then the outcome, top to bottom.',
        '"Who was met" is one question with three answers (mitra / PJ / nobody). Mitra and PJ take the same outcome controls; "nobody home" drops the payment modes and opens straight on a reason and a revisit date.',
        'Options write immediately — no "Simpan" — so the record survives tapping through to her mitra page and back.',
      ],
      flowsTo: [
        { to: 'home-proof', label: 'Lanjut → langkah 2' },
        { to: 'mitra-detail', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'home-proof',
      title: 'Home Visit - 2 — Bukti & Kirim',
      component: HomeProofScreen,
      notes: [
        'Step 2 of 2 — location and photo both required, same as the majelis close. The recap reads back who was met and what she paid; it only warns if nothing was recorded at all.',
        'Submitting finishes the Kunjungan Rumah task and returns to Beranda.',
      ],
      flowsTo: [{ to: 'home', label: 'Selesaikan Kunjungan' }],
    },
    {
      id: 'titip-bayar',
      title: 'Setor Titip Bayar',
      component: TitipBayarScreen,
      notes: [
        'Reached only from the "Setor Titip Bayar" task on Beranda. Shows the VA to transfer to and the mitra-level breakdown that sums to it; "Saya sudah setor" is a self-reported confirmation, no real payment rail.',
      ],
      flowsTo: [{ to: 'home', label: 'selesai / tutup' }],
    },
    {
      id: 'kpi',
      title: 'KPI',
      component: KpiScreen,
      notes: [
        'Flat-Rp model, not weighted groups: each of the 7 parameters is binary — hit the target, earn its own flat rupiah bonus; miss it, earn nothing. The hero is the sum earned out of the Rp2.500.000 maximum.',
        'Each parameter row links straight to "Tugas" pre-filtered by the task type it drives — the per-majelis breakdown and the separate calculation explainer from the previous draft are both gone.',
      ],
      flowsTo: [{ to: 'home', label: 'tugas (per parameter)' }],
    },
    {
      id: 'comms',
      title: 'Informasi & Program',
      component: CommsScreen,
      notes: ['The banner carousel\'s "Lihat semua" target. Filters by time window and info type; tapping a card marks it read.'],
      flowsTo: [
        { to: 'home', label: 'kembali' },
        { to: 'banner-detail', label: 'tap kartu' },
      ],
    },
    {
      id: 'banner-detail',
      title: 'Detail Banner',
      component: BannerDetailScreen,
      notes: [
        'Stub — the source marks the banner destination as TBD, so the body is an explicit dashed placeholder rather than invented content.',
      ],
      flowsTo: [{ to: 'home', label: 'kembali' }],
    },
    {
      id: 'notif',
      title: 'Notifikasi',
      component: NotifScreen,
      notes: [
        'Unread rows tint primary-50 and carry a dot; tapping one marks it read and the Beranda tab badge drops in step.',
        '"Tandai dibaca" appears in the header only while something is unread.',
      ],
      flowsTo: [{ to: 'home', label: 'kembali' }],
    },
    {
      id: 'profile',
      title: 'Profil',
      component: ProfileScreen,
      notes: ['The second route into KPI, showing the current parameter count (met / total) inline.'],
      flowsTo: [
        { to: 'kpi', label: 'KPI saya' },
        { to: 'home', label: 'kembali' },
      ],
    },
  ],
}
