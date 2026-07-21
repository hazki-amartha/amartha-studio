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
import { HomeVisitScreen } from './screens/home-visit'
import { HomeProofScreen } from './screens/home-proof'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'today',
      title: 'Jadwal',
      component: TodayScreen,
      entry: true,
      notes: [
        'The BP opens her day here. The page commits to one answer: the single visit she should be doing right now, with the reason it matters already written for her.',
        'Only that card carries a button. Everything under Berikutnya is there so she can shape her day — see what is coming, and tap through to read up on a group before she arrives — without it competing with the one thing to start now.',
      ],
      flowsTo: [
        { to: 'attendance', label: 'Mulai Pelayanan — langsung ke Kunjungan 1' },
        { to: 'home-visit', label: 'Mulai Kunjungan (home visit)' },
        { to: 'majelis', label: 'ketuk kartu Berikutnya (majelis)' },
        { to: 'mitra', label: 'ketuk kartu Berikutnya (home visit)' },
        { to: 'majelis-list', label: 'tab Majelis' },
        { to: 'kpi', label: 'tab KPI' },
      ],
    },
    {
      id: 'majelis-list',
      title: 'Majelis',
      component: MajelisListScreen,
      notes: [
        'Every majelis the BP is responsible for, in one list. Today’s groups sort to the top so the list agrees with her schedule rather than competing with it.',
        'Each row states the health of the group at a glance — lancar, or how many mitra are menunggak — so she can see which majelis needs attention before she plans her week. Tapping one opens its roster to read, not to start work.',
      ],
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
      notes: [
        'A BP is measured on four daily targets at once. They live behind a tab so she can check how the day is going when she wants to, instead of reading numbers on every working screen and having to work out what they ask of her.',
        'The page is read-only on purpose. Each target says in one line what it means, and the page ends by pointing back at the schedule — the work is planned there, not chased from a score.',
      ],
      flowsTo: [
        { to: 'today', label: 'tab Jadwal' },
        { to: 'majelis-list', label: 'tab Majelis' },
      ],
    },
    {
      id: 'majelis',
      title: 'Majelis View',
      component: MajelisScreen,
      notes: [
        'The roster of one group, and the screen this direction is named after. Before the BP walks in she wants one thing: who is in this majelis and what state is each one in — outstanding loan, how many days behind, weekly instalment, on every card.',
        'Sorting is the only control, defaulting to whoever is most behind, because the mitra worth reading about first are the ones in arrears. Nothing here records anything; the single button starts the pelayanan when she is ready.',
      ],
      flowsTo: [
        { to: 'attendance', label: 'Mulai Pelayanan' },
        { to: 'mitra', label: 'ketuk nama mitra' },
        { to: 'majelis-list', label: 'kembali' },
      ],
    },
    {
      id: 'home-visit',
      title: 'Home Visit 1 — Temui & Tagih',
      component: HomeVisitScreen,
      notes: [
        'A home visit is one door, not a group, and it branches: did she meet the mitra, the penanggung jawab, a neighbour, or nobody — and then, was there money, a partial, or only a promise. The page asks that whole tree in one place, growing as she answers.',
        'Who she met and what was collected are separate facts, so the same outcome controls appear whether the money came from the mitra or her PJ. If nobody was home, the payment options never appear at all — she goes straight to the reason and when she will return.',
      ],
      flowsTo: [
        { to: 'home-proof', label: 'Lanjut — butuh jawaban "siapa ditemui"' },
        { to: 'mitra', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'home-proof',
      title: 'Home Visit 2 — Bukti & Kirim',
      component: HomeProofScreen,
      notes: [
        'The close of a home visit: a photo and a recorded location, both required before it can be submitted. Location carries more weight here than at a majelis — a balai has a fixed address everyone knows, a doorstep is the visit that gets questioned.',
        'The recap is scaled to one mitra: who was met, what she paid, and whether there is a promise to come back for. A balance with a promise is work closed for today; a balance with nothing recorded is the one to worry about.',
      ],
      flowsTo: [{ to: 'today', label: 'Selesaikan Tugas — butuh foto + lokasi' }],
    },
    {
      id: 'attendance',
      title: 'Kunjungan 1 — Kehadiran',
      component: AttendanceScreen,
      notes: [
        'Attendance is asked first and on its own, and collection does not open until every mitra is marked. The register is a record other people read later, and a half-marked one cannot be trusted or audited.',
        'Nothing on this screen mentions money — that is the next stage’s question, and asking both at once is what this split exists to avoid. The 15 who already paid before the visit come pre-marked present, so the BP confirms 7 rather than all 22.',
      ],
      flowsTo: [{ to: 'collection', label: 'Simpan & Lanjut — butuh 22/22' }],
    },
    {
      id: 'collection',
      title: 'Kunjungan 2 — Penagihan',
      component: CollectionScreen,
      notes: [
        'The queue. One card per mitra who has not been dealt with yet, and it drains as the BP works down the room, so at any moment the page shows exactly who is left.',
        'The stage’s job is to record an outcome for everyone, not to make everyone lunas — so a card leaves the queue on any recorded result, including “tidak bayar”. That is what lets the page actually reach zero and the visit be closed honestly.',
      ],
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
