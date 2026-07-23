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
import { DepositScreen } from './screens/deposit'
import { SosialisasiScreen } from './screens/sosialisasi'
import { LeadScreen } from './screens/lead'
import { FollowUpScreen } from './screens/follow-up'
import * as demo from './lib/demo'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'today',
      title: 'Tugas',
      component: TodayScreen,
      entry: true,
      notes: [
        'The BP opens her day here. The page commits to one answer: the single visit she should be doing right now, with the reason it matters already written for her. Every row wears its kind as a short code — MV, HV, Sos, FU — the same shorthand she and her BM already speak.',
        'Berikutnya is the rest of the day, and tapping a row starts that task too. A day does not run in clock order — she arrives early, a group is late, a doorstep is on the way back — so the schedule stays a list of things she can begin, not a queue that only hands her the top row.',
      ],
      states: [
        {
          id: 'majelis',
          label: 'Sekarang: Majelis',
          description: 'Awal hari — pelayanan majelis jadi tugas aktif',
          apply: demo.scheduleMajelis,
        },
        {
          id: 'home-visit',
          label: 'Sekarang: Home Visit',
          description: 'Dua majelis selesai — kunjungan rumah jadi tugas aktif',
          apply: demo.scheduleHomeVisit,
        },
        {
          id: 'closing',
          label: 'Sekarang: Setoran',
          description: 'Semua kunjungan selesai — tinggal setor tutup hari',
          apply: demo.scheduleClosing,
        },
      ],
      flowsTo: [
        { to: 'attendance', label: 'Mulai Pelayanan — langsung ke Pelayanan 1' },
        { to: 'home-visit', label: 'Mulai Kunjungan (home visit)' },
        { to: 'sosialisasi', label: 'Mulai Sosialisasi — cari prospek baru' },
        { to: 'follow-up', label: 'Mulai Follow Up — telepon prospek' },
        { to: 'deposit', label: 'Setor Setoran Harian — tugas penutup' },
        { to: 'majelis-list', label: 'tab Majelis' },
        { to: 'kpi', label: 'tab KPI' },
      ],
    },
    {
      id: 'majelis-list',
      title: 'Majelis',
      component: MajelisListScreen,
      notes: [
        'Every majelis the BP is responsible for, in one flat list. It used to split into “Hari ini” and “Majelis lain”, which made the directory re-answer a question the schedule already owns — a BP who opens this tab is looking a group up, on whatever day it meets.',
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
        'The same seven monthly parameters as apartner-homepage-ia, so the two directions are judged on one scoreboard rather than on two inventions of what a BP is measured on. Each carries a flat rupiah bonus.',
        'Every card answers one question: how many more women. The page used to print four figures per parameter — a percentage, a target, the current count, a rupiah line — and the BP had to subtract two of them to reach the only one she can act on. Now the subtraction is done for her and the result IS the headline: “Kurangi 3 mitra lagi”, “Tambah 3 mitra lagi”, “Target tercapai”. The current count is gone; a number that exists to be subtracted from another number is a number the app should be holding.',
        'Same edit in the hero — “3 dari 7 tercapai” became “Penuhi 4 target lagi”. Identical fact, already phrased as work remaining rather than as a score. Switch the period to Juni 2026 to see the all-clear.',
        'What survives is the target itself as small print, because a BP does get asked what the threshold is and nobody recites seven of them, and the bonus as a pill, because it is what makes the gap worth closing. What this direction still does not copy is the reference’s “Tugas ›” link on each lagging row: here the schedule owns the work, and hanging a task off a score turns the score into how you navigate.',
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
        'The roster of one group, and the screen this direction is named after. The page header carries where the group meets and when — the two questions a look-up asks — and every card is down to the pair that decides who to read first: tunggakan and DPD.',
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
      id: 'deposit',
      title: 'Setoran Harian',
      component: DepositScreen,
      notes: [
        'The close of the day, and the only task that is not a visit: the cash the BP collected leaves her hands here, transferred to the branch VA and self-reported, exactly as it is in the field where the app cannot see a bank transfer either.',
        'The amount is derived, not typed. Every rupiah was recorded against a named mitra in a named pelayanan, so the deposit is built from the day’s work — and it counts CASH only. A mitra who settled through the app paid the company directly, and folding her in is how a BP ends up short at the counter.',
        'The selisih is the part worth judging. The app’s figure and the money in the bag disagree more often than a happy-path screen admits, so the BP confirms or edits the amount, and any difference must carry a reason before it can be sent. Same rule as “tidak bayar”: a gap with a reason is a record ops can chase, a gap with nowhere to put it becomes a phone call.',
      ],
      states: [
        {
          id: 'empty',
          label: 'Hari belum jalan',
          description: 'Belum ada pelayanan selesai — tidak ada yang bisa disetor',
          apply: demo.dayEmpty,
        },
        {
          id: 'collected',
          label: 'Sudah 3 tugas',
          description: '2 pelayanan + 1 kunjungan rumah, siap disetor',
          apply: demo.dayCollected,
        },
        {
          id: 'selisih',
          label: 'Ada selisih',
          description: 'Kurang Rp 15.000 dari catatan aplikasi, alasan terisi',
          apply: demo.daySelisih,
        },
        {
          id: 'sent',
          label: 'Sudah dikirim',
          description: 'Menunggu verifikasi cabang',
          apply: demo.daySubmitted,
        },
      ],
      flowsTo: [{ to: 'today', label: 'Selesai — setelah setoran terkirim' }],
    },
    {
      id: 'sosialisasi',
      title: 'Sosialisasi',
      component: SosialisasiScreen,
      notes: [
        'The first task on this day that is not about a woman who already borrows. A BP carries an NTB target out of the same seven KPI parameters as her collection target, so prospecting sits on the same schedule rather than in a tab she visits when there is time — which is how it stops happening.',
        'The page is a counter, a button, and the names taken so far. The target is on screen DURING the event and not on a report afterwards: “4 dari 10” at 14.30 is a BP who works the room for another hour; the same fact at 17.00 is a BP who went home short.',
        'Capture is the quick tier only — nama, WA, sumber, minat, kapan dihubungi lagi. Address, competing loans and destination majelis all need the prospect to think, and asking them in a crowded warung is how a BP comes back with four leads instead of ten. They become named blanks on her record instead.',
      ],
      states: [
        {
          id: 'awal',
          label: 'Baru mulai',
          description: 'Belum ada prospek dicatat — layar kosongnya',
          apply: demo.eventEmpty,
        },
        {
          id: 'separuh',
          label: 'Separuh target',
          description: '5 dari 10, campuran sosialisasi dan referral',
          apply: demo.eventHalf,
        },
        {
          id: 'penuh',
          label: 'Target tercapai',
          description: '10 prospek, termasuk 1 yang menolak dengan alasan',
          apply: demo.eventFull,
        },
      ],
      flowsTo: [
        { to: 'lead', label: 'ketuk prospek' },
        { to: 'today', label: 'Selesaikan Sosialisasi' },
      ],
    },
    {
      id: 'lead',
      title: 'Data Prospek',
      component: LeadScreen,
      notes: [
        'The counterpart to the mitra page, for a woman who is not one yet. It is deliberately drawn WITH GAPS: everything the quick capture skipped appears as an empty field with a name and a count, because a lead who cannot be submitted for want of an address is a lead that dies silently.',
        'The history at the bottom is what makes a three-month-old prospect callable. “Minat tinggi, menunggu pinjaman BRI lunas Oktober” recorded on 14 Juli is the reason anyone dials her in October — without it, October’s BP is cold-calling a stranger the app told her was warm.',
      ],
      states: [
        {
          id: 'kosong',
          label: 'Data belum lengkap',
          description: 'Alamat, majelis dan pinjaman lain masih kosong',
          apply: demo.leadIncomplete,
        },
        {
          id: 'lengkap',
          label: 'Siap diajukan',
          description: 'Semua terisi — gerbang “siap diajukan” terbuka',
          apply: demo.leadComplete,
        },
        {
          id: 'menunggu',
          label: 'Terganjal pinjaman lain',
          description: 'Minat tinggi tapi masih terikat BRI sampai Oktober',
          apply: demo.leadBlocked,
        },
      ],
      flowsTo: [{ to: 'follow-up', label: 'Follow Up Sekarang' }],
    },
    {
      id: 'follow-up',
      title: 'Follow Up Prospek',
      component: FollowUpScreen,
      notes: [
        'The same shape as a home visit, for the same reason: one person, a branch on whether you reached her at all, and worthless unless the outcome carries a date.',
        '“Did the call land” is asked BEFORE minat. Most follow-ups do not connect, and a form that opens on how interested she is makes an unanswered phone look like a lead who went cold — two completely different facts, only one of them about her.',
        '“Siap diajukan” is the one outcome the record can veto. Handing onboarding a prospect with no address and no majelis is how a qualified lead becomes a ticket, so the gate names the gap and offers the jump to fill it — which is why the half-finished call lives in the store and survives the trip.',
      ],
      states: [
        {
          id: 'brief',
          label: 'Sebelum menelepon',
          description: 'Layar seperti yang dibuka dari jadwal, belum ada jawaban',
          apply: demo.followUpFresh,
        },
        {
          id: 'terhubung',
          label: 'Terhubung, minat turun',
          description: 'Dari minat tinggi ke sedang — perubahan ditandai',
          apply: demo.followUpCooled,
        },
        {
          id: 'tidak-diangkat',
          label: 'Tidak diangkat',
          description: 'Hanya satu pertanyaan tersisa: kapan coba lagi',
          apply: demo.followUpMissed,
        },
        {
          id: 'siap',
          label: 'Siap diajukan',
          description: 'Data lengkap, gerbang terbuka',
          apply: demo.followUpQualified,
        },
      ],
      flowsTo: [
        { to: 'lead', label: 'Lengkapi Data Prospek' },
        { to: 'today', label: 'Simpan & Selesai — dari jadwal' },
      ],
    },
    {
      id: 'attendance',
      title: 'Pelayanan 1 — Kehadiran',
      component: AttendanceScreen,
      notes: [
        'Attendance is asked first and on its own, and collection does not open until every mitra is marked. The register is a record other people read later, and a half-marked one cannot be trusted or audited.',
        'Nothing on this screen mentions money — that is the next stage’s question, and asking both at once is what this split exists to avoid. The 15 who already paid before the visit come pre-marked present, so the BP confirms 7 rather than all 22.',
      ],
      states: [
        {
          id: 'fresh',
          label: 'Baru dibuka',
          description: '15 mitra bayar mandiri sudah terisi, 7 belum diabsen',
          apply: demo.registerFresh,
        },
        {
          id: 'almost',
          label: 'Tinggal 2 mitra',
          description: 'Sisa register di atas, yang sudah ditandai di bawah',
          apply: demo.registerAlmost,
        },
        {
          id: 'done',
          label: 'Register lengkap',
          description: '20 hadir · 2 tidak hadir dengan alasannya',
          apply: demo.registerDone,
        },
      ],
      flowsTo: [{ to: 'collection', label: 'Simpan & Lanjut — butuh 22/22' }],
    },
    {
      id: 'collection',
      title: 'Pelayanan 2 — Penagihan',
      component: CollectionScreen,
      notes: [
        'The queue. One card per mitra who has not been dealt with yet, and it drains as the BP works down the room, so at any moment the page shows exactly who is left.',
        'The stage’s job is to record an outcome for everyone, not to make everyone lunas — so a card leaves the queue on any recorded result, including “tidak bayar”. That is what lets the page actually reach zero and the visit be closed honestly.',
      ],
      states: [
        {
          id: 'full',
          label: 'Antrean penuh',
          description: '7 mitra belum ditagih, 15 sudah bayar mandiri di bawah',
          apply: demo.queueFull,
        },
        {
          id: 'half',
          label: 'Setengah jalan',
          description: 'Antrean tinggal separuh, hasilnya tersusun di bawah',
          apply: demo.queueHalf,
        },
        {
          id: 'done',
          label: 'Semua ada hasilnya',
          description: 'Termasuk 1 bayar sebagian dan 1 tidak bayar dengan janji',
          apply: demo.queueDone,
        },
      ],
      flowsTo: [
        { to: 'collect', label: 'Tagih' },
        { to: 'mitra', label: 'ketuk nama mitra' },
        { to: 'growth', label: 'Lanjut' },
      ],
    },
    {
      id: 'growth',
      title: 'Pelayanan 3 — Penawaran',
      component: GrowthScreen,
      notes: [
        'Offers come last, after the money. Pitching a savings product before collecting would mean asking a woman to open an account with the instalment she has not handed over yet.',
        'Only mitra with a real recommendation appear — four rows out of 22, not a list for everyone. Each states where she stands rather than what to say about it, and the whole stage can be skipped: a tail that blocks the close of a visit has stopped being a tail.',
      ],
      flowsTo: [
        { to: 'proof', label: 'Lanjut' },
        { to: 'mitra', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'proof',
      title: 'Bukti Pelayanan',
      component: ProofScreen,
      notes: [
        'A photo and a recorded location, both required before the visit can be submitted. A photo alone proves she photographed something; a location alone proves she was in the right place but not that a majelis happened. Only the pair makes a visit verifiable afterwards.',
        'They sit as two equal tiles rather than a big photo drop-zone with location as a footnote, and outside the three-stage bar — attendance, collection and growth are the work, this is the paperwork that closes it.',
      ],
      flowsTo: [{ to: 'recap', label: 'Lanjut — butuh foto + lokasi' }],
    },
    {
      id: 'recap',
      title: 'Ringkasan & Kirim',
      component: RecapScreen,
      notes: [
        'The close. Submitting is final, so the page reads back all three stages first — the BP’s last chance to catch a majelis she half-finished before it becomes someone else’s problem.',
        'It also states what the visit means for the group: how the majelis’ collective repayment shapes its credit limit. That is the only reason a BP can give a mitra for why her neighbour’s late payment is any of her business.',
      ],
      flowsTo: [{ to: 'today', label: 'Kirim Tugas' }],
    },
    {
      id: 'mitra',
      title: 'Detail Mitra',
      component: MitraScreen,
      notes: [
        'One borrower, opened from her card anywhere in the flow, and now a record rather than a second place to act. The header states only who she is and how late she is; collecting happens in the pelayanan queue, which is the only place the BP has the mitra in front of her.',
        'The week strip is the heart of the page: it carries the amount inside each week rather than a paid/unpaid dot, so the BP can say “Ibu kurang Rp50.000 di minggu 7” instead of “Ibu belum bayar”. Under it sit the three figures she gets asked for by name — total tagihan, total outstanding, angsuran.',
        'Data mitra is the reach-her block, and it carries two routes and two numbers: her house and her tempat usaha, her WhatsApp and her PJ’s. A BP who cannot raise a mitra at home at 10.00 has three other things to try, and all of them are on this card.',
      ],
      flowsTo: [{ to: 'ladder', label: 'Jalur Naik Modal' }],
    },
    {
      id: 'collect',
      title: 'Tagih Pembayaran',
      component: CollectScreen,
      notes: [
        'The moment of negotiation, and the page is only two things: the choice, and its consequence. As the BP types an amount, the “sisa setelah ini” sits pinned above the button so the figure she is about to be held to stays in her eyeline.',
        '“Tidak Bayar” is a full fourth option, not an escape hatch. A no with a reason and a date is a result the BP can close and ops can chase; leaving it unrecorded is what pushes arrears work out of the app and onto a spreadsheet.',
      ],
      flowsTo: [
        { to: 'collect-done', label: 'Terima Tunai' },
        { to: 'collection', label: 'Simpan Catatan — tidak bayar' },
      ],
    },
    {
      id: 'collect-done',
      title: 'Pembayaran Diterima',
      component: CollectDoneScreen,
      notes: [
        'A receipt, and it earns the extra tap for one reason: cash. The BP has just taken physical money from a woman standing in front of her, and both of them need a moment where the amount is stated and agreed.',
        'It reads back three numbers and nothing else — owed, paid, left. The remaining balance is not softened: a mitra who just handed over Rp300.000 against Rp650.000 should see the Rp350.000 now, not discover it next week.',
      ],
      flowsTo: [{ to: 'collection', label: 'Kembali ke Daftar' }],
    },
    {
      id: 'ladder',
      title: 'Jalur Naik Modal',
      component: LadderScreen,
      notes: [
        'The one screen here that is not about what to do, but what to say. A BP opens it mid-conversation, reads the line at the top out loud, then turns the phone around and lets the mitra read the ladder herself.',
        'So the copy is split by audience: the framing speaks to the BP about the mitra, while the quoted line and the rail speak to the mitra directly. Nothing is recorded here — the outcome of the conversation is logged where she is already being asked for it.',
      ],
      flowsTo: [{ to: 'mitra', label: 'kembali' }],
    },
  ],
}
