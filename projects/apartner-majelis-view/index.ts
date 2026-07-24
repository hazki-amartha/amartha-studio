// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { MajelisScreen } from './screens/majelis'
import { AttendanceScreen } from './screens/attendance'
import { CollectionScreen } from './screens/collection'
import { MitraScreen } from './screens/mitra'
import { LoansScreen } from './screens/loans'
import { CollectScreen } from './screens/collect'
import { GrowthScreen } from './screens/growth'
import { OfferScreen } from './screens/offer'
import { ProofScreen } from './screens/proof'
import { LadderScreen } from './screens/ladder'
import { TodayScreen } from './screens/today'
import { MajelisListScreen } from './screens/majelis-list'
import { MitraListScreen } from './screens/mitra-list'
import { ProfileScreen } from './screens/profile'
import { KpiScreen } from './screens/kpi'
import { HomeBriefScreen } from './screens/home-brief'
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
        'The BP opens her day here, as one list of equal cards under two headings: Belum selesai and Selesai. There is no focus card and no “Sekarang”. The page used to draw one stop larger with the verb on a button, which answers “what next” on a day that does not run in clock order — she arrives early, a group is late, the 13.00 door is on the way back from the 10.00 balai — so the biggest thing on screen was regularly the row she was not doing. Every row starts its task on tap, which is all the button ever did.',
        'The split is on the only line that matters when she looks at her day: is there still something to do here. Dikerjakan sits with Belum mulai because a half-finished visit is unfinished work; Terkirim sits with Selesai because both are off her plate, and which of the two it is belongs to the sync widget rather than to a section heading.',
        'Every row wears its kind as a short code — MV, HV, Sos, FU — the same shorthand she and her BM already speak.',
        'Terkumpul hari ini sits above the work, the same card apartner-homepage-ia opens on, minus its “Lihat semua”: the figure is what a BM asks for before the day is out, and at the deposit screen it would arrive too late to change how she works the afternoon. It counts cash AND app payments — on-track is a different question from what is in the bag.',
        'Every card is now title + address and nothing else. The “why now” line is off both the focus card and the Berikutnya rows: a row that carries a reason is a row being argued for, and the schedule already made that call by putting the stop on the day. Where she has to ride is the fact a row gets read for.',
        'One inbox in the header, no bell. They were two senders — the business talking TO the BP, and the system reporting what happened — but a notification is something that already happened, and this page is for what has not.',
        'Belum terkirim sits directly above the task list, because that is what it is ABOUT: those rows, and the fact that finishing them was not the last step. A BP closes a visit standing in a balai with no signal; without this she finds out on Friday that Tuesday never landed. It disappears the moment nothing is pending — a sync widget saying “0” is a permanent reminder of a problem she does not have.',
'One filter: Tipe tugas. A status filter went with it — the page already answers that question twice, once with the Belum selesai / Selesai split and once with the sync widget, and a third control for the same fact is a control nobody reaches for. Filtering replaces the agenda with a flat list, because the two headings are a shape built around whether work is left, and a BP filtering by type has stopped asking that.',
        'A card reads top to bottom in one order: name, address, distance, and — on a home visit only — “Kemungkinan bayar tinggi”. Distance sits directly under the address it qualifies, because “where, and how far” is one thought and the two read as a pair only when nothing comes between them. The order of a day is decided by geography as much as by the clock: two stops in one kampung get done together whatever their slots say.',
        'The propensity label is last, and it is the only badge left on the card. Everything above it is a fact about the stop; this is a prediction about the person. It goes on home visits only — a majelis is 22 women with 22 answers, so one flag on a group describes nobody in it — and stays a small label rather than a headline, because a BP who reads a prediction as a promise and finds an empty house twice stops believing the next one.',
        'No status badge on the card. The section already says whether there is work left, and the sync widget says which finished rows have not gone — a badge on every row was a third telling of a fact told twice, on the one line the card had left for something new.',
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
        { to: 'home-brief', label: 'Mulai Kunjungan (home visit)' },
        { to: 'sosialisasi', label: 'Mulai Sosialisasi — cari prospek baru' },
        { to: 'follow-up', label: 'Mulai Follow Up — telepon prospek' },
        { to: 'deposit', label: 'Setor Setoran Harian — tugas penutup' },
        { to: 'majelis-list', label: 'tab Majelis' },
        { to: 'mitra-list', label: 'tab Mitra' },
        { to: 'kpi', label: 'tab KPI' },
        { to: 'profile', label: 'tab Profil' },
      ],
    },
    {
      id: 'majelis-list',
      title: 'Majelis',
      component: MajelisListScreen,
      notes: [
        'Every majelis the BP is responsible for, in one flat list. It used to split into “Hari ini” and “Majelis lain”, which made the directory re-answer a question the schedule already owns — a BP who opens this tab is looking a group up, on whatever day it meets.',
        'Each row states three things about the group: what product it runs on (Modal blue, GL purple, Hybrid neutral), when it meets, and one status badge — Draft, n Mitra DPD, or Lancar. The product palette deliberately avoids green/orange/yellow, which the status badges own; a hue that means two things on one card is worse than no hue at all. Hybrid is neutral because it is not a third product, it is a group carrying both.',
        'Draft groups are the reason the filters earn their space. A majelis being assembled has no kumpulan to send the BP anywhere, so without a way to ask for it, it only ever surfaces by scrolling — and the one thing she needs from it is the gap: “Kurang 4 mitra untuk aktif”, not the word “Draft”.',
        'Search and filter answer different questions. Search is for a group she can name; the filters are for a set she can only describe — “what am I doing Kamis”, “which ones am I still building”. Both are lifted shape-for-shape from apartner-homepage-ia, so the two directions differ on the flow rather than on how a list gets narrowed. The filters survive opening a group and coming back; the search box does not, because a query is a question already answered.',
      ],
      flowsTo: [
        { to: 'majelis', label: 'ketuk majelis → Majelis View' },
        { to: 'today', label: 'tab Jadwal' },
        { to: 'mitra-list', label: 'tab Mitra' },
        { to: 'kpi', label: 'tab KPI' },
        { to: 'profile', label: 'tab Profil' },
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
        { to: 'mitra-list', label: 'tab Mitra' },
        { to: 'profile', label: 'tab Profil' },
      ],
    },
    {
      id: 'mitra-list',
      title: 'Mitra',
      component: MitraListScreen,
      notes: [
        'Every borrower the BP carries, across every group. The Majelis tab answers “who is in this group”; this answers “where is Ibu Rina” — a question a directory of groups cannot take, because the woman phoning her does not open with which balai she attends.',
        'The card is the roster’s card unchanged, with one line added under the name: her majelis and when it meets. That line is the only reason this list is not the roster — on the roster, the group is the page you are already on.',
        'Search finds a woman she can name; the two filters find a set she can only describe — “everyone past 30 days”, “everyone in Kenanga”. DPD is filtered by BUCKET rather than by day count, because a bucket is a question someone actually asks.',
        'Prototype edge, and an honest version of one this project already has: only Majelis Mawar has an authored roster, so the other groups draw their members from it under their own names. Every card is real — a ledger, a DPD, a product — without inventing six more week-by-week records to fill a list that exists to be searched.',
      ],
      flowsTo: [
        { to: 'mitra', label: 'ketuk mitra → Detail Mitra' },
        { to: 'today', label: 'tab Jadwal' },
        { to: 'majelis-list', label: 'tab Majelis' },
        { to: 'kpi', label: 'tab KPI' },
        { to: 'profile', label: 'tab Profil' },
      ],
    },
    {
      id: 'profile',
      title: 'Profil',
      component: ProfileScreen,
      notes: [
        'Ported from apartner-homepage-ia, the same way the L0 tabs were: the two directions should differ on the pelayanan, not on where “Keluar” lives, and a second invention of a settings page is noise in that comparison.',
        'One change from the source. That version carried a KPI card here as a second route into the scoreboard, which made sense when Profil sat behind an avatar in a header. Here KPI is its own tab one thumb away, so the card would be a shortcut to the thing beside it.',
      ],
      flowsTo: [
        { to: 'today', label: 'tab Jadwal' },
        { to: 'majelis-list', label: 'tab Majelis' },
        { to: 'mitra-list', label: 'tab Mitra' },
        { to: 'kpi', label: 'tab KPI' },
      ],
    },
    {
      id: 'majelis',
      title: 'Majelis View',
      component: MajelisScreen,
      notes: [
        'The roster of one group, and the screen this direction is named after. The kumpulan slot rides in the header subtitle — it is asked every time the page is opened — and the address is a one-liner directly under it, ending in a Rute button rather than a full stop, because on the way there the answer she needs is the route, not the text.',
        'Each card is a name, a DPD badge and its labels — no rupiah figure at all. DPD already answers “who do I deal with first”, and an amount on a roster is a number the BP reads but cannot act on; the one she negotiates against is derived fresh on the collect page, from the ledger, at the moment she needs it. KM says who the chair is; Modal / GL says which product she is on, since a Hybrid majelis is exactly a group with both in one room; and Janji bayar / Dapat keringanan are on the ROSTER rather than only in the collect flow, because a BP who walks up to a mitra without knowing she already promised a date asks for the whole amount and gets the argument that follows.',
        'Sorting is the only control, defaulting to whoever is most behind. It wears a sort mark now: the chevron it used to carry is the universal “this opens a list of options”, and it opens nothing.',
        'What the footer OFFERS depends on the day. On the group’s kumpulan day it starts the pelayanan; on any other day there is no visit to start, so it becomes the thing a BP actually does from her sofa on a Thursday — send the group its reminder, already written, with this group’s day, time and place in it. It goes to the WhatsApp group, not to 22 numbers: that is where the group already talks, and a reminder arriving as 22 private messages is one the ketua cannot reinforce.',
        'The header’s trailing control is Edit, not Info. Changing a majelis is four routes rather than one form — its schedule lives with the BP’s week, its Ketua is a mitra, its location is a place, and moving a member changes another group as well as this one — so a combined form would be four unrelated fields sharing a Save button. All four are affordances only.',
      ],
      flowsTo: [
        { to: 'attendance', label: 'Mulai Pelayanan' },
        { to: 'mitra', label: 'ketuk nama mitra' },
        { to: 'majelis-list', label: 'kembali' },
      ],
    },
    {
      id: 'home-brief',
      title: 'Home Visit 1 — Persiapan',
      component: HomeBriefScreen,
      flowsTo: [
        { to: 'home-visit', label: 'Lanjut — mitra / PJ ditemui' },
        { to: 'home-proof', label: 'Lanjut — jika tidak ada orang (lewati Tagih)' },
        { to: 'mitra', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'home-visit',
      title: 'Home Visit 2 — Tagih',
      component: HomeVisitScreen,
      notes: [
        'The money step. Who she met was answered on Persiapan, so this page opens straight on the ledger and the bill — the ten-week strip and the total tagihan, the same components the mitra and collect pages draw — then the payment outcome: full, partial, or a recorded no.',
        'Whether the money came from the mitra or her PJ does not change what gets recorded — the amount and the promise — so who handed it over is a tag, not a branch. "Nobody home" never reaches this step: a locked door has nothing to tagih, so that case takes its visit note on Persiapan and skips straight to Bukti & Kirim.',
      ],
      flowsTo: [{ to: 'home-proof', label: 'Lanjut' }],
    },
    {
      id: 'home-proof',
      title: 'Home Visit 3 — Bukti & Kirim',
      component: HomeProofScreen,
      notes: [
        'The close of a home visit: a photo of the door, required before it can be submitted. What she recorded on the two steps before — who was met, what was paid — is not read back here; this step is the paperwork that closes the visit, not a second review of it.',
      ],
      flowsTo: [{ to: 'today', label: 'Selesaikan Tugas — butuh foto' }],
    },
    {
      id: 'deposit',
      title: 'Closing',
      component: DepositScreen,
      notes: [
        'The close of the day, rebuilt as a two-item checklist over one CTA. Closing is exactly two obligations: every task on the day finished, and the collected cash handed back — so the screen is those two checks and nothing else, and the CTA unlocks only when both pass.',
        'Check 1 counts the day’s stops. When any are still open it names them — “5 dari 7 selesai”, then the list — so the BP knows what to go back to rather than only that she cannot close yet; when all are done it collapses to a single ticked line.',
        'Check 2 is the titip bayar: every rupiah she collected is money she is holding for the company, and closing means transferring it to the branch VA. It shows what is still owed and where it goes, gated behind the tasks being done — you settle the bag once, at the end — and self-reported, exactly as it is in the field where the app cannot see a bank transfer. The figure is derived from the day’s collections, so there is nothing to type.',
      ],
      states: [
        {
          id: 'awal',
          label: 'Hari belum jalan',
          description: 'Semua tugas masih terbuka — belum ada yang bisa disetor',
          apply: demo.closingFresh,
        },
        {
          id: 'separuh',
          label: 'Sebagian tugas selesai',
          description: '4 dari 7 selesai — daftar tugas yang belum tuntas',
          apply: demo.closingPartial,
        },
        {
          id: 'perlu-setor',
          label: 'Perlu setor titipan',
          description: 'Semua tugas selesai, titip bayar belum disetor',
          apply: demo.closingReady,
        },
        {
          id: 'siap',
          label: 'Siap ditutup',
          description: 'Semua tugas selesai & titip bayar sudah disetor — dua-duanya tercentang',
          apply: demo.closingSettled,
        },
        {
          id: 'terkirim',
          label: 'Sudah ditutup',
          description: 'Closing terkirim — menunggu verifikasi cabang',
          apply: demo.closingSent,
        },
      ],
      flowsTo: [{ to: 'today', label: 'Selesai — setelah closing terkirim' }],
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
          description: '20 mitra sudah tercatat, 2 belum dijawab',
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
        'The same roster in the same order as the register before it, and the same card — only the row under the rule changes, from a register question to a bill. The list is static: recording an outcome updates the card where it stands instead of moving it to a “sudah ditagih” section, so the woman the BP is standing in front of stays where she was.',
        'The stage’s job is to record an outcome for everyone, not to make everyone lunas — any recorded result counts, including “tidak bayar”. Tagih opens a page rather than a sheet; the 15 who settled before the visit carry the fact and no button, because there is nothing to tagih from them and offering the control would invite a double entry.',
      ],
      states: [
        {
          id: 'full',
          label: 'Antrean penuh',
          description: '7 mitra belum ditagih, 15 sudah bayar mandiri',
          apply: demo.queueFull,
        },
        {
          id: 'half',
          label: 'Setengah jalan',
          description: 'Separuh sudah ada hasilnya, separuh belum',
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
        'Only mitra with a real recommendation appear — four rows out of 22, not a list for everyone — in the same order and the same card as the two stages before. Tawarkan opens a page, exactly as Tagih does, so both actions on a visit card behave the same way. The whole stage can be skipped: a tail that blocks the close of a visit has stopped being a tail.',
      ],
      flowsTo: [
        { to: 'offer', label: 'Tawarkan' },
        { to: 'proof', label: 'Lanjut' },
        { to: 'mitra', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'offer',
      title: 'Tawarkan Produk',
      component: OfferScreen,
      flowsTo: [{ to: 'growth', label: 'Simpan Hasil' }],
    },
    {
      id: 'proof',
      title: 'Bukti Pelayanan',
      component: ProofScreen,
      notes: [
        'A photo and a recorded location, both required before the visit can be submitted. A photo alone proves she photographed something; a location alone proves she was in the right place but not that a majelis happened. Only the pair makes a visit verifiable afterwards.',
        'They sit as two equal tiles rather than a big photo drop-zone with location as a footnote, and outside the three-stage bar — attendance, collection and growth are the work, this is the paperwork that closes it.',
      ],
      flowsTo: [{ to: 'today', label: 'Kirim Laporan — butuh foto + lokasi' }],
    },
    {
      id: 'mitra',
      title: 'Detail Mitra',
      component: MitraScreen,
      notes: [
        'One borrower, opened from her card anywhere in the flow, and a record rather than a second place to act. Her name and her DPD chip are the pinned top bar, with chat and route as the two icon buttons beside them — the two things a BP DOES with a mitra rather than reads about her, reachable from wherever she has scrolled to. Collecting happens in the pelayanan queue, which is the only place the BP has the mitra in front of her.',
        'The week strip is the heart of the page: it carries the amount inside each week rather than a paid/unpaid dot, so the BP can say “Ibu kurang Rp50.000 di minggu 7” instead of “Ibu belum bayar”. It shows the last ten weeks and opens on THIS week at the right edge, scrolling left into the past — fifty cells was a ledger drawn as a rail, and the forty at the far left were never reached. The week numbers are gone: the date under each cell already says which week it is, in the only terms said out loud.',
        'Under it, one figure and its parts: total tagihan, then minggu ini and terlewat. Total outstanding and the weekly instalment were facts about the CONTRACT; this is the only number she is about to act on, and the lines beneath it are the sentence she says when it gets argued with. The shortfall line appears only when there is one — but it does appear, because without it the parts do not add up to the total.',
        'The ladder is its own entry point now instead of the first row of a card it shared with a phone number and two addresses. It is not a datum about her; it is a conversation, and the only thing on this page that leads somewhere she does something.',
        'Everything else on file drops to the bottom as Informasi tambahan, read-only. Those rows were tappable and four of them opened nothing that is not now a header button, so what survives is the content: what a BP reads out when ops asks, or checks before she rides.',
      ],
      flowsTo: [
        { to: 'loans', label: 'Lihat semua riwayat' },
        { to: 'ladder', label: 'Jalur Naik Modal' },
      ],
    },
    {
      id: 'loans',
      title: 'Semua Pencairan',
      component: LoansScreen,
      notes: [
        'Every cycle she has taken, active first and settled below. The mitra page answers “what does she owe today”; this answers “how long has she been with us, and how did the last cycles go” — a different question with a different shelf life, which is why it is a page rather than another section on one already carrying a ledger.',
        'It is the evidence behind the ladder. “Ibu sudah tiga kali cair dan dua lunas tepat waktu” is the sentence that makes a top-up conversation land, and until this screen existed the BP had to remember it.',
        'A settled cycle keeps every number and loses only its colour. It is still the thing she quotes, and greying it down to a summary line would throw away the proof to save a card.',
        'One active pencairan, always — the reference screen shows two. Every number on the mitra page derives from a single ledger, and a second live loan would make “total tagihan” mean different things on different screens. That is the contradiction this direction was built to avoid, so it is the one thing from the reference not copied.',
      ],
      flowsTo: [{ to: 'mitra', label: 'kembali' }],
    },
    {
      id: 'collect',
      title: 'Tagih Pembayaran',
      component: CollectScreen,
      notes: [
        'The moment of negotiation. It opens on who she is over what she owes — the recent cycle on grey, the bill on white, the same Angsuran card the mitra page uses — and every follow-up a choice needs is drawn inside the option that caused it, rather than parked at the bottom of the page where the BP has to connect it back up. The “Jumlah lain” field reads back the shortfall as she types, so the figure she is about to be held to stays in her eyeline without a second summary pinned over the button.',
        '“Tidak Bayar” is a full fourth option, not an escape hatch, and it does not save until it carries BOTH the reason and the janji bayar — a no with no date is unchaseable, and “tidak ada janji” is a real answer rather than something you express by skipping the question. The same rule now covers money: any payment short of the bill has to say why it was short, because a balance nobody wrote a reason against is the same unchaseable gap.',
      ],
      flowsTo: [
        { to: 'collection', label: 'Terima Tunai' },
        { to: 'collection', label: 'Simpan Catatan — tidak bayar' },
      ],
    },
    {
      id: 'ladder',
      title: 'Jalur Naik Modal',
      component: LadderScreen,
      notes: [
        'The one screen here that is not about what to do, but what to say. A BP opens it mid-conversation, reads the line at the top out loud, then turns the phone around and lets the mitra read the ladder herself. The top card states her current limit, because every rung below is an amount added to it and without the base the ladder is a set of increments measured from nowhere.',
        'So the copy is split by audience: the framing speaks to the BP about the mitra, while the quoted line and the rail speak to the mitra directly. Nothing is recorded here — the outcome of the conversation is logged where she is already being asked for it.',
      ],
      flowsTo: [{ to: 'mitra', label: 'kembali' }],
    },
  ],
}
