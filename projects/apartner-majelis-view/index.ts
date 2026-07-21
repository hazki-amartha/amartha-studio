// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { MajelisScreen } from './screens/majelis'
import { AttendanceScreen } from './screens/attendance'
import { CollectionScreen } from './screens/collection'
import { MitraScreen } from './screens/mitra'
import { CollectScreen } from './screens/collect'
import { CollectDoneScreen } from './screens/collect-done'
import { GrowthScreen } from './screens/growth'
import { ProofScreen } from './screens/proof'
import { RecapScreen } from './screens/recap'
import { LadderScreen } from './screens/ladder'
import { TodayScreen } from './screens/today'
import { MajelisListScreen } from './screens/majelis-list'
import { KpiScreen } from './screens/kpi'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'today',
      title: 'Jadwal',
      component: TodayScreen,
      entry: true,
      flowsTo: [
        { to: 'attendance', label: 'Mulai Pelayanan — langsung ke Kunjungan 1' },
        { to: 'majelis-list', label: 'tab Majelis' },
        { to: 'kpi', label: 'tab KPI' },
      ],
    },
    {
      id: 'majelis-list',
      title: 'Majelis',
      component: MajelisListScreen,
      flowsTo: [
        { to: 'majelis', label: 'ketuk majelis → Majelis View' },
        { to: 'today', label: 'tab Jadwal' },
        { to: 'kpi', label: 'tab KPI' },
      ],
    },
    {
      id: 'kpi',
      title: 'KPI',
      component: KpiScreen,
      flowsTo: [
        { to: 'today', label: 'tab Jadwal' },
        { to: 'majelis-list', label: 'tab Majelis' },
      ],
    },
    {
      id: 'majelis',
      title: 'Majelis View',
      component: MajelisScreen,
      flowsTo: [
        { to: 'attendance', label: 'Mulai Pelayanan' },
        { to: 'mitra', label: 'ketuk nama mitra' },
        { to: 'majelis-list', label: 'kembali' },
      ],
    },
    {
      id: 'attendance',
      title: 'Kunjungan 1 — Kehadiran',
      component: AttendanceScreen,
      flowsTo: [{ to: 'collection', label: 'Simpan & Lanjut — butuh 22/22' }],
    },
    {
      id: 'collection',
      title: 'Kunjungan 2 — Penagihan',
      component: CollectionScreen,
      flowsTo: [
        { to: 'collect', label: 'Tagih' },
        { to: 'mitra', label: 'ketuk nama mitra' },
        { to: 'growth', label: 'Lanjut' },
      ],
    },
    {
      id: 'mitra',
      title: 'Detail Mitra',
      component: MitraScreen,
      flowsTo: [
        { to: 'collect', label: 'Tagih Pembayaran' },
        { to: 'ladder', label: 'Jalur Naik Modal' },
      ],
    },
    {
      id: 'collect',
      title: 'Tagih Pembayaran',
      component: CollectScreen,
      flowsTo: [
        { to: 'collect-done', label: 'Terima Tunai' },
        { to: 'collection', label: 'Simpan Catatan — tidak bayar' },
      ],
    },
    {
      id: 'collect-done',
      title: 'Pembayaran Diterima',
      component: CollectDoneScreen,
      flowsTo: [{ to: 'collection', label: 'Kembali ke Daftar' }],
    },
    {
      id: 'growth',
      title: 'Kunjungan 3 — Pertumbuhan',
      component: GrowthScreen,
      flowsTo: [
        { to: 'proof', label: 'Lanjut' },
        { to: 'mitra', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'proof',
      title: 'Bukti Kunjungan',
      component: ProofScreen,
      flowsTo: [{ to: 'recap', label: 'Lanjut — butuh foto + lokasi' }],
    },
    {
      id: 'recap',
      title: 'Ringkasan & Kirim',
      component: RecapScreen,
      flowsTo: [{ to: 'today', label: 'Kirim Tugas' }],
    },
    {
      id: 'ladder',
      title: 'Jalur Naik Modal',
      component: LadderScreen,
      flowsTo: [{ to: 'mitra', label: 'kembali' }],
    },
  ],
}
