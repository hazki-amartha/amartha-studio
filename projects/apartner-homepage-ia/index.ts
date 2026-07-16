// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { HomeScreen } from './screens/home'
import { MajelisScreen } from './screens/majelis'
import { MajelisDetailScreen } from './screens/majelis-detail'
import { MitraDetailScreen } from './screens/mitra-detail'
import { KpiScreen } from './screens/kpi'
import { KpiInfoScreen } from './screens/kpi-info'
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
        'Three stacked entry points sit above it: the banner carousel (Informasi & Program), the collection summary with the expandable titip-bayar settlement, and the KPI link.',
        'Four filters — waktu, jenis, majelis, tipe KPI — each open a bottom sheet. They default to "Hari ini" + "Wajib", so the list opens on today\'s obligations only.',
        'Arriving from a KPI group shows a context strip explaining why the list came in pre-filtered.',
      ],
      flowsTo: [
        { to: 'comms', label: 'lihat semua informasi' },
        { to: 'banner-detail', label: 'tap banner' },
        { to: 'kpi', label: 'lihat semua achievement / tab KPI' },
        { to: 'majelis', label: 'tab majelis' },
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
        'Deep-linked from a KPI group, it arrives sorted worst-first on that group\'s metric with a context strip.',
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
        'Repayment and attendance read against their targets (90% / 80%) rather than in isolation.',
        'Mitra sort menunggak-first. Cards carry a status cue but are deliberately NOT tappable — see mitra-detail.',
      ],
      flowsTo: [{ to: 'majelis', label: 'kembali' }],
    },
    {
      id: 'mitra-detail',
      title: 'Detail Mitra',
      component: MitraDetailScreen,
      notes: [
        'PARKED — no inbound go(), matching the source draft, which keeps this page built but switched off and drops the chevron from mitra cards because of it.',
        'Opened directly it renders Rury Ramadhita (ketua, autodebit, PIC, celengan) — the record that exercises every section.',
        '"+ Jadikan tugas" writes a real task into the shared store, so a captured recommendation shows up in Beranda\'s list under the Rekomendasi filter.',
      ],
    },
    {
      id: 'kpi',
      title: 'KPI',
      component: KpiScreen,
      notes: [
        'The hero answers "why did I open this page" with the incentive estimate, not the score — the score is the means.',
        'Each group ends in two links: "Kejar <weakest metric>" into pre-filtered tasks, and "Lihat per majelis" into worst-first ranked majelis. This is the IA idea under test.',
        'Selecting a single majelis re-derives every metric from that majelis and hides the incentive hero, which is portfolio-wide.',
        'The boost group carries no weight and is labelled "Di luar skor" — it pays separately.',
      ],
      flowsTo: [
        { to: 'kpi-info', label: 'ikon bantuan' },
        { to: 'home', label: 'kejar metrik (tugas terfilter)' },
        { to: 'majelis', label: 'lihat per majelis (urut terendah)' },
      ],
    },
    {
      id: 'kpi-info',
      title: 'Cara Perhitungan KPI',
      component: KpiInfoScreen,
      notes: [
        'Explains the score formula, per-parameter weights, a worked example, the incentive bands, and why boost sits outside the score.',
        'Weights and targets are read from the same KPI_DEF the KPI page scores against, so the explainer cannot drift from the maths.',
      ],
      flowsTo: [{ to: 'kpi', label: 'kembali' }],
    },
    {
      id: 'comms',
      title: 'Informasi & Program',
      component: CommsScreen,
      notes: ['The banner carousel\'s "Lihat semua" target. Filters by time window and info type.'],
      flowsTo: [{ to: 'home', label: 'kembali' }],
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
      notes: ['The second route into KPI, showing the current score inline.'],
      flowsTo: [
        { to: 'kpi', label: 'KPI saya' },
        { to: 'home', label: 'kembali' },
      ],
    },
  ],
}
