import type { ProjectModule, ScreenState } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import { attendanceSlip, bonusReady, groupWatch, milestoneMissed, notEligible, onTrack } from './lib/demo'

// Every screen reads the same journey, so every screen carries the same states.
const journeyStates: ScreenState[] = [
  {
    id: 'on-track',
    label: 'Semua lancar',
    description: 'Minggu 10. Bayar dan hadir tepat, majelis lengkap.',
    apply: onTrack,
  },
  {
    id: 'attendance-slip',
    label: 'Kehadiran kurang rutin',
    description: 'Bayar selalu tepat, tapi 3 kali tidak hadir — limit naik s/d Rp7,5jt.',
    apply: attendanceSlip,
  },
  {
    id: 'not-eligible',
    label: 'Ibu bayar telat',
    description: 'Satu angsuran telat: tidak ikut tambahan dari majelis di 12 minggu ini.',
    apply: notEligible,
  },
  {
    id: 'group-watch',
    label: 'Majelis perlu dijaga',
    description: 'Dua anggota belum bayar minggu ini. Tambahan ke-1 bisa terlewat.',
    apply: groupWatch,
  },
  {
    id: 'bonus-ready',
    label: 'Tambahan siap dicairkan',
    description: 'Minggu 12 selesai lancar. Rp1jt bisa dicairkan.',
    apply: bonusReady,
  },
  {
    id: 'milestone-missed',
    label: 'Tambahan terlewat',
    description: 'Tambahan ke-1 terlewat. Ke-2 tetap Rp1jt, tidak menumpuk.',
    apply: milestoneMissed,
  },
]

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'home',
      title: 'Beranda A — Dua kartu',
      component: lazyScreen(() => import('./screens/home'), 'HomeScreen'),
      entry: true,
      states: journeyStates,
    },
    {
      id: 'home-b',
      title: 'Beranda B — Satu garis waktu',
      component: lazyScreen(() => import('./screens/home-b'), 'HomeBScreen'),
      states: journeyStates,
    },
    {
      id: 'riwayat',
      title: 'Riwayat angsuran',
      component: lazyScreen(() => import('./screens/riwayat'), 'RiwayatScreen'),
      states: journeyStates,
    },
    {
      id: 'majelis',
      title: 'Majelis',
      component: lazyScreen(() => import('./screens/majelis'), 'MajelisScreen'),
      states: journeyStates,
    },
    {
      id: 'cair',
      title: 'Cair tambahan',
      component: lazyScreen(() => import('./screens/cair'), 'CairScreen'),
      states: journeyStates,
    },
  ],
}
