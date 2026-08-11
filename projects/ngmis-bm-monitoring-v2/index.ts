import type { ProjectModule, ScreenState } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import * as demo from './lib/demo'

/** The three commentary layouts, offered beside the device on both briefings. */
/** Which briefing the dashboard banner prompts — the one "scheduled to start". */
const SCHEDULE_STATES: ScreenState[] = [
  {
    id: 'jadwal-sore',
    label: 'Jadwal: Briefing Sore',
    description: 'Banner briefing sore muncul (default, sore hari).',
    apply: demo.scheduleEvening,
  },
  {
    id: 'jadwal-pagi',
    label: 'Jadwal: Briefing Pagi',
    description: 'Banner briefing pagi muncul (pagi hari).',
    apply: demo.scheduleMorning,
  },
]

const COMMENT_STATES: ScreenState[] = [
  {
    id: 'komentar-inline',
    label: 'Komentar: kolom di tiap section',
    description: 'Kotak komentar langsung di setiap tabel (default).',
    apply: demo.commentInline,
  },
  {
    id: 'komentar-dedicated',
    label: 'Komentar: section khusus per BP',
    description: 'Tanpa kolom di tabel; satu komentar per BP di section tersendiri.',
    apply: demo.commentDedicated,
  },
  {
    id: 'komentar-dialog',
    label: 'Komentar: CTA “✎ Isi” + dialog',
    description: 'Komentar per section, diisi lewat dialog berisi ringkasan angka.',
    apply: demo.commentDialog,
  },
]

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'dashboard',
      title: 'Branch Monitoring',
      component: lazyScreen(() => import('./screens/dashboard'), 'DashboardScreen'),
      entry: true,
      states: SCHEDULE_STATES,
      flowsTo: [
        { to: 'briefing-morning', label: 'Mulai briefing pagi' },
        { to: 'briefing-evening', label: 'Mulai briefing sore' },
        { to: 'briefing-history', label: 'Riwayat briefing' },
      ],
    },
    {
      id: 'briefing-history',
      title: 'Riwayat Briefing',
      component: lazyScreen(() => import('./screens/briefing-history'), 'BriefingHistoryScreen'),
      flowsTo: [
        { to: 'briefing-morning', label: 'Mulai briefing pagi' },
        { to: 'briefing-evening', label: 'Mulai briefing sore' },
        { to: 'briefing-detail', label: 'Lihat' },
        { to: 'dashboard', label: 'Kembali' },
      ],
    },
    {
      id: 'briefing-morning',
      title: 'Briefing Pagi',
      component: lazyScreen(() => import('./screens/briefing-morning'), 'BriefingMorningScreen'),
      states: COMMENT_STATES,
      flowsTo: [{ to: 'briefing-detail', label: 'Kirim' }],
    },
    {
      id: 'briefing-evening',
      title: 'Briefing Sore',
      component: lazyScreen(() => import('./screens/briefing-evening'), 'BriefingEveningScreen'),
      states: COMMENT_STATES,
      flowsTo: [{ to: 'briefing-detail', label: 'Kirim' }],
    },
    {
      id: 'briefing-detail',
      title: 'Detail Briefing',
      component: lazyScreen(() => import('./screens/briefing-detail'), 'BriefingDetailScreen'),
      flowsTo: [{ to: 'dashboard', label: 'Kembali' }],
    },
  ],
}
