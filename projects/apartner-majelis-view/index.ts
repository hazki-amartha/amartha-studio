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

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'majelis',
      title: 'Majelis View',
      component: MajelisScreen,
      entry: true,
      flowsTo: [
        { to: 'attendance', label: 'Mulai Pelayanan' },
        { to: 'mitra', label: 'ketuk nama mitra' },
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
      flowsTo: [{ to: 'majelis', label: 'Kirim Tugas' }],
    },
    {
      id: 'ladder',
      title: 'Jalur Naik Modal',
      component: LadderScreen,
      flowsTo: [{ to: 'mitra', label: 'kembali' }],
    },
  ],
}
