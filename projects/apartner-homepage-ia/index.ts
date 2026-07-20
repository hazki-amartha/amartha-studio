// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { HomeScreen } from './screens/home'
import { MajelisScreen } from './screens/majelis'
import { MajelisDetailScreen } from './screens/majelis-detail'
import { MitraDetailScreen } from './screens/mitra-detail'
import { KunjunganRumahScreen } from './screens/kunjungan-rumah'
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
        'On a kumpulan day, "Mulai kunjungan" switches the whole page into visit mode: every mitra card expands into inline Kehadiran + Pembayaran controls, a Tugas tambahan section surfaces renewal/celengan offers, and a Rekam kumpulan step (lokasi + foto) gates the sticky Submit Kumpulan bar.',
        'Browse mode keeps mitra cards tappable through to mitra-detail — the visit-mode gate that used to make them inert is gone now that mitra-detail is a live destination.',
        'Mitra sort menunggak-first; a MAJ_FILTERS chip row (Semua / Belum bayar / Sudah bayar / Pengajuan) narrows the list further.',
      ],
      flowsTo: [
        { to: 'majelis', label: 'kembali' },
        { to: 'mitra-detail', label: 'tap kartu mitra (browse mode)' },
      ],
    },
    {
      id: 'mitra-detail',
      title: 'Detail Mitra',
      component: MitraDetailScreen,
      notes: [
        'Live now — reached from a Home Kunjungan Rumah task, or a browse-mode mitra card on majelis-detail. Opened directly it renders Rury Ramadhita (ketua, autodebit, PIC, celengan), the record that exercises every section.',
        'Two views in one screen: a compact "main" view (active tasks, HV launcher, recommendations) that taps through to a full "profil" view (loan history, progress-limit outlook, attendance, produk lain).',
        'The active Kunjungan Rumah task gets its own primary-tinted launcher card instead of sitting in the plain task list — "Mulai kunjungan" is what opens the flow.',
        '"+ Jadikan tugas" writes a real task into the shared store, so a captured recommendation shows up in Beranda\'s list under the Rekomendasi filter.',
      ],
      flowsTo: [{ to: 'kunjungan-rumah', label: 'mulai kunjungan' }],
    },
    {
      id: 'kunjungan-rumah',
      title: 'Kunjungan Rumah',
      component: KunjunganRumahScreen,
      notes: [
        'A branching wizard, not a form: bertemu mitra? → bisa bayar? (penuh/sebagian/PTP), or tidak bertemu → temui PJ → titipan/PTP, else tetangga, else tidak ada siapa pun. DPD 60+ mitra who can\'t commit get a Peldis offer.',
        'Every PTP branch auto-creates a follow-up Kunjungan Rumah task on the promised date; dead-end branches (nobody met, PJ can\'t commit) schedule a plain retry next week.',
        'The result screen lists exactly which tasks got created, then "Selesai kunjungan" just closes the flow — there is no separate completion/return routing in the source to mirror.',
      ],
      flowsTo: [{ to: 'mitra-detail', label: 'tap pil Mitra / tutup' }],
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
