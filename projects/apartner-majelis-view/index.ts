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
import { SettlementScreen } from './screens/settlement'
import { SosialisasiScreen } from './screens/sosialisasi'
import { LeadScreen } from './screens/lead'
import { FollowUpScreen } from './screens/follow-up'
import { CommsScreen } from './screens/comms'
import { BannerDetailScreen } from './screens/banner-detail'
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
        'The BP opens her day here, as one list of equal cards under two headings: Belum selesai and Selesai. Every row starts its task on tap. Nothing is singled out as “now” — a day does not run in clock order, so the schedule stays a list of things she can begin rather than a queue that only hands her the top row.',
        'The split is on the only line that matters when she looks at her day: is there still something to do here. Dikerjakan sits with Belum mulai, because a half-finished visit is unfinished work.',
        'Every row wears its kind as a short code — MV, HV, Sos, FU — the shorthand she and her BM already speak. The title has the first line to itself, since that is the line she scans to find a row. The time sits on the address line in front of the pin: when and where are one fact in two parts, and reading them together is how a stop gets planned.',
        'A card reads top to bottom in one order: name, address, distance, and — on a home visit only — “Kemungkinan bayar tinggi”. Distance sits directly under the address it qualifies, because “where, and how far” is one thought. The order of a day is decided by geography as much as by the clock: two stops in one kampung get done together whatever their slots say.',
        'The propensity label is the only badge on the card, and it goes on home visits only — a majelis is 22 women with 22 answers, so one flag on a group describes nobody in it. It stays a small label rather than a headline, because a BP who reads a prediction as a promise and finds an empty house twice stops believing the next one.',
        'Setoran sits at the top: the cash she is carrying right now, phrased as a decision rather than as progress against a target. The risk being managed is money on a motorbike. It names the amount, says how many handovers she has used, and offers one button.',
        'A settlement takes EVERYTHING outstanding — there is no amount to choose. Partial handovers would need the app to hold an opinion about which rupiah in her bag belongs to which pelayanan, which it cannot check and she cannot separate; and a BP free to pick the number is a BP who can be asked why she picked it. What she chooses is when.',
        'There is no cap on how many times she can settle — every handover reduces the cash she is carrying, which is the point of the feature. What the count decides is the FEE: the first three are free, and the settlement page says so. A cost is a reason to think; a lock is a reason to keep carrying cash she wanted to be rid of.',
        'Belum terkirim sits directly above the task list, because that is what it is about: those rows, and the fact that finishing them was not the last step. A BP closes a visit standing in a balai with no signal; without this she finds out on Friday that Tuesday never landed. It disappears the moment nothing is pending.',
        'Closing is a widget above the list rather than a row in it — every other row is a woman to see, this one is the day’s paperwork. It appears only when there is nothing left to do: every task finished AND sent, and nothing left in the bag. Those are the conditions inside the closing screen, so she never opens a page to be told she cannot use it.',
        'Once Closing is submitted the widget is replaced by a green thank-you banner — the one card on this page that is not work. It replaces rather than joins: a day has exactly one end.',
        'One filter, Tipe tugas, and one inbox in the header. Filtering replaces the agenda with a flat list, because the two headings are a shape built around whether work is left, and a BP filtering by type has stopped asking that.',
      ],
      states: [
        {
          id: 'majelis',
          label: 'Start of day',
          description: 'Nothing done yet — the first majelis visit is the open task',
          apply: demo.scheduleMajelis,
        },
        {
          id: 'home-visit',
          label: 'Midday — a home visit next',
          description: 'Two majelis done and banked, so the cash handover widget is live',
          apply: demo.scheduleHomeVisit,
        },
        {
          id: 'closing',
          label: 'Every visit finished',
          description: 'All work submitted, the day’s cash still in her bag',
          apply: demo.scheduleClosing,
        },
        {
          id: 'capped',
          label: 'Free handovers used up',
          description: 'Three settlements made — the next one carries an admin fee',
          apply: demo.scheduleCapped,
        },
        {
          id: 'closeable',
          label: 'Ready to close the day',
          description: 'Everything sent and every rupiah handed over',
          apply: demo.scheduleCloseable,
        },
        {
          id: 'closed',
          label: 'Day already closed',
          description: 'Closing submitted — only the thank-you banner is left',
          apply: demo.scheduleClosed,
        },
      ],
      flowsTo: [
        { to: 'attendance', label: 'Mulai Pelayanan — langsung ke Majelis Visit 1' },
        { to: 'comms', label: 'kotak masuk di header' },
        { to: 'home-brief', label: 'Mulai Kunjungan (home visit)' },
        { to: 'sosialisasi', label: 'Mulai Sosialisasi — cari prospek baru' },
        { to: 'follow-up', label: 'Mulai Follow Up — telepon prospek' },
        { to: 'settlement', label: 'Setor Sekarang — dari widget setoran' },
        { to: 'deposit', label: 'Tutup — dari widget tutup hari' },
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
        'Every majelis the BP is responsible for, in one flat list. A BP who opens this tab is looking a group up, on whatever day it meets — which day it is belongs to the schedule, not to a directory.',
        'Each row states three things about the group: what product it runs on (Modal blue, GL purple, Hybrid neutral), when it meets, and one status badge — Draft, n Mitra DPD, or Lancar. The product palette deliberately avoids green/orange/yellow, which the status badges own; a hue that means two things on one card is worse than no hue at all. Hybrid is neutral because it is not a third product, it is a group carrying both.',
        'Draft groups are the reason the filters earn their space. A majelis being assembled has no kumpulan to send the BP anywhere, so without a way to ask for it, it only ever surfaces by scrolling — and the one thing she needs from it is the gap: “Kurang 4 mitra untuk aktif”, not the word “Draft”.',
        'Search and filter answer different questions. Search is for a group she can name; the filters are for a set she can only describe — “what am I doing Kamis”, “which ones am I still building”. The filters survive opening a group and coming back; the search box does not, because a query is a question already answered.',
      ],
      states: [
        {
          id: 'all',
          label: 'Every group',
          description: 'The directory unfiltered — all eight, active and draft',
          apply: demo.groupsUnfiltered,
        },
        {
          id: 'one-day',
          label: 'One day’s groups',
          description: 'Filtered to Selasa — the “what am I doing Tuesday” question',
          apply: demo.groupsOneDay,
        },
        {
          id: 'drafts',
          label: 'Groups being assembled',
          description: 'The two drafts, each stating how many more mitra it needs',
          apply: demo.groupsDrafts,
        },
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
        'Seven monthly parameters, each carrying a flat rupiah bonus — a parameter earns its bonus outright rather than feeding a combined score.',
        'Every card answers one question: how many more women. The subtraction is done for her and the result IS the headline — “Kurangi 3 mitra lagi”, “Tambah 3 mitra lagi”, “Target tercapai”. A number that exists only to be subtracted from another number is a number the app should be holding, so the current count is not printed.',
        'The hero says the same thing the same way: “Penuhi 4 target lagi” rather than “3 dari 7 tercapai” — work remaining rather than a score. Switch the period to Juni 2026 to see the all-clear.',
        'The target survives as small print, because a BP does get asked what the threshold is and nobody recites seven of them, and the bonus as a pill, because it is what makes the gap worth closing. No card links out to the work: the schedule owns that, and hanging a task off a score turns the score into how you navigate.',
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
        'Search finds a woman she can name; the two filters find a set she can only describe — “everyone past 30 days”, “everyone in Kenanga”. DPD is filtered by BUCKET rather than by day count, because a bucket is the question someone actually asks.',
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
        'The BP’s own account and settings — the standard shelf every app has, and deliberately unremarkable.',
        'No KPI card here. KPI is its own tab one thumb away, so a card would be a shortcut to the thing sitting beside it.',
      ],
      flowsTo: [
        { to: 'today', label: 'tab Jadwal' },
        { to: 'majelis-list', label: 'tab Majelis' },
        { to: 'mitra-list', label: 'tab Mitra' },
        { to: 'kpi', label: 'tab KPI' },
      ],
    },
    {
      id: 'comms',
      title: 'Informasi & Program',
      component: CommsScreen,
      flowsTo: [{ to: 'banner-detail', label: 'ketuk kartu' }],
    },
    {
      id: 'banner-detail',
      title: 'Detail Banner',
      component: BannerDetailScreen,
      flowsTo: [{ to: 'comms', label: 'kembali' }],
    },
    {
      id: 'majelis',
      title: 'Majelis View',
      component: MajelisScreen,
      notes: [
        'The roster of one group. The kumpulan slot rides in the header subtitle — it is asked every time the page is opened — and the address is a one-liner directly under it, ending in a Rute button rather than a full stop, because on the way there the answer she needs is the route, not the text.',
        'Each card is a name, a DPD badge and its labels — no rupiah figure at all. DPD already answers “who do I deal with first”, and an amount on a roster is a number the BP reads but cannot act on; the one she negotiates against is derived fresh on the collect page, from the ledger, at the moment she needs it. KM says who the chair is; Modal / GL says which product she is on, since a Hybrid majelis is exactly a group with both in one room; and Janji bayar / Dapat keringanan are on the ROSTER rather than only in the collect flow, because a BP who walks up to a mitra without knowing she already promised a date asks for the whole amount and gets the argument that follows.',
        'Sorting is the only control, defaulting to whoever is most behind.',
        'What the footer OFFERS depends on the day. On the group’s kumpulan day it starts the pelayanan; on any other day there is no visit to start, so it becomes the thing a BP actually does from her sofa on a Thursday — send the group its reminder, already written, with this group’s day, time and place in it. It goes to the WhatsApp group, not to 22 numbers: that is where the group already talks, and a reminder arriving as 22 private messages is one the ketua cannot reinforce.',
        'The header’s trailing control is Edit, not Info. Changing a majelis is four routes rather than one form — its schedule lives with the BP’s week, its Ketua is a mitra, its location is a place, and moving a member changes another group as well as this one — so a combined form would be four unrelated fields sharing a Save button.',
      ],
      states: [
        {
          id: 'kumpulan-day',
          label: 'Meets today',
          description: 'The day’s schedule sends her here — the footer starts the visit',
          apply: demo.rosterOnSchedule,
        },
        {
          id: 'other-day',
          label: 'Meets another day',
          description: 'No visit to start, so the footer sends the group its reminder instead',
          apply: demo.rosterOffSchedule,
        },
      ],
      flowsTo: [
        { to: 'attendance', label: 'Mulai Pelayanan' },
        { to: 'mitra', label: 'ketuk nama mitra' },
        { to: 'majelis-list', label: 'kembali' },
      ],
    },
    {
      id: 'attendance',
      title: 'Majelis Visit 1 — Kehadiran',
      component: AttendanceScreen,
      notes: [
        'Attendance is asked first and on its own, and collection does not open until every mitra is marked. The register is a record other people read later, and a half-marked one cannot be trusted or audited.',
        'Nothing on this screen mentions money — that is the next stage’s question, and asking both at once is what this split exists to avoid. The 15 who already paid before the visit come pre-marked present, so the BP confirms 7 rather than all 22.',
      ],
      states: [
        {
          id: 'fresh',
          label: 'Just opened',
          description: 'The 15 who paid on their own are pre-marked; 7 still to record',
          apply: demo.registerFresh,
        },
        {
          id: 'almost',
          label: 'Two mitra left to mark',
          description: '20 recorded, 2 still unanswered',
          apply: demo.registerAlmost,
        },
        {
          id: 'done',
          label: 'Register complete',
          description: '20 present · 2 absent, each with her reason',
          apply: demo.registerDone,
        },
      ],
      flowsTo: [{ to: 'collection', label: 'Simpan & Lanjut — butuh 22/22' }],
    },
    {
      id: 'collection',
      title: 'Majelis Visit 2 — Penagihan',
      component: CollectionScreen,
      notes: [
        'The same roster in the same order as the register before it, and the same card — only the row under the rule changes, from a register question to a bill. The list is static: recording an outcome updates the card where it stands instead of moving it to a “sudah ditagih” section, so the woman the BP is standing in front of stays where she was.',
        'The stage’s job is to record an outcome for everyone, not to make everyone lunas — any recorded result counts, including “tidak bayar”. Tagih opens a page rather than a sheet; the 15 who settled before the visit carry the fact and no button, because there is nothing to tagih from them and offering the control would invite a double entry.',
      ],
      states: [
        {
          id: 'full',
          label: 'Full queue',
          description: '7 mitra still to collect from, 15 already paid on their own',
          apply: demo.queueFull,
        },
        {
          id: 'half',
          label: 'Halfway through',
          description: 'Half the queue has an outcome, half has none yet',
          apply: demo.queueHalf,
        },
        {
          id: 'done',
          label: 'Every outcome recorded',
          description: 'Including one part-payment and one refusal with a promise to pay',
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
      title: 'Majelis Visit 3 — Penawaran',
      component: GrowthScreen,
      notes: [
        'Offers come last, after the money. Pitching a savings product before collecting would mean asking a woman to open an account with the instalment she has not handed over yet.',
        'Only mitra with a real recommendation appear — four rows out of 22, not a list for everyone — in the same order and the same card as the two stages before. Tawarkan opens a page, exactly as Tagih does, so both actions on a visit card behave the same way. The whole stage can be skipped: a tail that blocks the close of a visit has stopped being a tail.',
      ],
      states: [
        {
          id: 'none',
          label: 'Nothing offered yet',
          description: 'Four recommendations, none of them put to anyone',
          apply: demo.offersNone,
        },
        {
          id: 'mixed',
          label: 'Every outcome at once',
          description: 'One closed on the spot, one carried to next kumpulan, one declined',
          apply: demo.offersMixed,
        },
        {
          id: 'all',
          label: 'Everyone answered',
          description: 'The stage as the BP leaves it — no card still offering',
          apply: demo.offersAll,
        },
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
      states: [
        {
          id: 'fresh',
          label: 'Nothing answered',
          description: 'The page as “Tawarkan” opens it — the offer, and no result yet',
          apply: demo.offerFresh,
        },
        {
          id: 'carried',
          label: 'Yes, but not processed',
          description: 'She agreed; there was no time to open it — next kumpulan inherits it',
          apply: demo.offerCarried,
        },
        {
          id: 'declined',
          label: 'No, with her reason',
          description: 'Declined because she already has one — a note about the offer, not her',
          apply: demo.offerDeclined,
        },
      ],
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
      states: [
        {
          id: 'empty',
          label: 'No photo yet',
          description: 'Submission blocked until the geotagged photo is taken',
          apply: demo.visitProofEmpty,
        },
        {
          id: 'captured',
          label: 'Photo and location captured',
          description: 'Every mitra has an outcome — the visit is ready to send',
          apply: demo.visitProofCaptured,
        },
        {
          id: 'gaps',
          label: 'Sending with mitra unrecorded',
          description: 'Seven never got an outcome — a warning, not a block',
          apply: demo.visitProofGaps,
        },
      ],
      flowsTo: [{ to: 'today', label: 'Kirim Laporan — butuh foto + lokasi' }],
    },
    {
      id: 'home-brief',
      title: 'Home Visit 1 — Persiapan',
      component: HomeBriefScreen,
      states: [
        {
          id: 'fresh',
          label: 'At the door',
          description: 'Nothing recorded — the one question the whole visit turns on',
          apply: demo.doorFresh,
        },
        {
          id: 'mitra',
          label: 'Met the mitra',
          description: 'She answered herself — the visit carries straight on to Tagih',
          apply: demo.doorMetMitra,
        },
        {
          id: 'pj',
          label: 'Met her guarantor',
          description: 'Someone from the household, plus why the borrower was out',
          apply: demo.doorMetPj,
        },
        {
          id: 'nobody',
          label: 'Nobody home',
          description: 'The visit note and a revisit date here; Tagih is skipped entirely',
          apply: demo.doorNobody,
        },
        {
          id: 'stuck',
          label: 'Moved three times already',
          description: 'Only now does “Jadwal ulang” also offer to close the visit for good',
          apply: demo.doorStuck,
        },
      ],
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
      states: [
        {
          id: 'penuh',
          label: 'Paid in full',
          description: 'She cleared the whole bill herself — done on the tap',
          apply: demo.payFull,
        },
        {
          id: 'sebagian',
          label: 'Part-payment',
          description: 'Some of the bill, and a date for the rest — a balance nobody loses',
          apply: demo.payPartial,
        },
        {
          id: 'tanggung',
          label: 'Covered by the group',
          description: 'Tanggung renteng on a GL loan — a full settlement she did not fund',
          apply: demo.payGroupCovered,
        },
        {
          id: 'tidak',
          label: 'Reached, did not pay',
          description: 'A reason and a promise — an outcome, not an empty record',
          apply: demo.payRefused,
        },
        {
          id: 'keluar',
          label: 'Dropping out',
          description: 'Neither payment nor promise; recording it retracts everything else',
          apply: demo.payDropOut,
        },
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
      states: [
        {
          id: 'empty',
          label: 'No photo yet',
          description: 'The visit cannot be submitted until the door is photographed',
          apply: demo.doorProofEmpty,
        },
        {
          id: 'cash',
          label: 'Cash collected at the door',
          description: 'The receipt sheet carries the amount and the date',
          apply: demo.doorProofCash,
        },
        {
          id: 'no-cash',
          label: 'Nothing collected',
          description: 'The receipt carries the promise instead of a payment',
          apply: demo.doorProofNoCash,
        },
        {
          id: 'partial',
          label: 'A part-payment at the door',
          description: 'The receipt also carries the balance and the date promised',
          apply: demo.receiptPartial,
        },
      ],
      flowsTo: [{ to: 'today', label: 'Selesaikan Tugas — kembali ke jadwal' }],
    },
    {
      id: 'settlement',
      title: 'Setoran',
      component: SettlementScreen,
      notes: [
        'Where the cash leaves her hands — separate from Closing, which is the checklist that ends the DAY. This screen is about the BAG: the money she is carrying right now and the transfer that gets it to the branch.',
        'Cash settles by the RUPIAH, not by the task. What is outstanding is everything banked minus everything handed over, so a short handover leaves a remainder and the widget comes straight back with it — the breakdown attributes it to the pelayanan it came from, with the covered part drained off. A BP who confirms Rp3.500.000 against a Rp3.700.000 ledger must still see the missing Rp200.000 on the page whose whole job is to say what she is carrying.',
        'Each settlement gets its own VA, because a virtual account is what the branch reconciles against, and several transfers to one number are deposits nobody can tell apart at the other end.',
        'The selisih flow is for the disagreement that will happen: the app’s figure and the money in the bag differ. A gap with a reason attached is a record ops can chase; a gap with nowhere to put it becomes a phone call.',
      ],
      states: [
        {
          id: 'first',
          label: 'First handover of the day',
          description: 'Two majelis in the bag by midday, and this one is free',
          apply: demo.bagFirstHandover,
        },
        {
          id: 'short',
          label: 'Short of the ledger',
          description: 'She declares Rp200.000 less than the app says — the gap ops chases',
          apply: demo.bagShort,
        },
        {
          id: 'fee',
          label: 'Free handovers used up',
          description: 'Three already made and cash still coming in — the next one costs',
          apply: demo.scheduleCapped,
        },
        {
          id: 'empty',
          label: 'Nothing left to hand over',
          description: 'Everything already settled — an honest empty state, not a form',
          apply: demo.scheduleCloseable,
        },
      ],
      flowsTo: [{ to: 'today', label: 'Selesai — kembali ke jadwal' }],
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
          label: 'Day not started',
          description: 'Every task still open — nothing has been collected to hand over',
          apply: demo.closingFresh,
        },
        {
          id: 'separuh',
          label: 'Some tasks still open',
          description: '4 of 7 done — the check names the three she has to go back to',
          apply: demo.closingPartial,
        },
        {
          id: 'perlu-setor',
          label: 'Cash still to hand over',
          description: 'Every task done, the collected cash not yet transferred',
          apply: demo.closingReady,
        },
        {
          id: 'siap',
          label: 'Ready to close',
          description: 'Tasks done and cash transferred — both checks pass',
          apply: demo.closingSettled,
        },
        {
          id: 'terkirim',
          label: 'Already closed',
          description: 'Closing submitted — waiting on branch verification',
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
          label: 'Just started',
          description: 'No prospects captured yet — the empty screen',
          apply: demo.eventEmpty,
        },
        {
          id: 'separuh',
          label: 'Half the target',
          description: '5 of 10, a mix of walk-ups and referrals',
          apply: demo.eventHalf,
        },
        {
          id: 'penuh',
          label: 'Target reached',
          description: '10 prospects, including one refusal with her reason',
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
          label: 'Record still has gaps',
          description: 'Address, majelis and other loans all still blank',
          apply: demo.leadIncomplete,
        },
        {
          id: 'lengkap',
          label: 'Ready to submit',
          description: 'Every field filled — the submission gate is open',
          apply: demo.leadComplete,
        },
        {
          id: 'menunggu',
          label: 'Blocked by another loan',
          description: 'High interest, but tied to a BRI loan until October',
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
          label: 'Before the call',
          description: 'The screen as the schedule opens it — nothing answered yet',
          apply: demo.followUpFresh,
        },
        {
          id: 'terhubung',
          label: 'Reached, interest cooled',
          description: 'High down to medium — the change between two calls is flagged',
          apply: demo.followUpCooled,
        },
        {
          id: 'tidak-diangkat',
          label: 'No answer',
          description: 'One question left: when to try her again',
          apply: demo.followUpMissed,
        },
        {
          id: 'siap',
          label: 'Ready to submit',
          description: 'Record complete, the qualification gate is open',
          apply: demo.followUpQualified,
        },
      ],
      flowsTo: [
        { to: 'lead', label: 'Lengkapi Data Prospek' },
        { to: 'today', label: 'Simpan & Selesai — dari jadwal' },
      ],
    },
    {
      id: 'mitra',
      title: 'Detail Mitra',
      component: MitraScreen,
      notes: [
        'One borrower, opened from her card anywhere in the flow, and a record rather than a second place to act. Her name and her DPD chip are the pinned top bar, with chat and route as the two icon buttons beside them — the two things a BP DOES with a mitra rather than reads about her, reachable from wherever she has scrolled to. Collecting happens in the pelayanan queue, which is the only place the BP has the mitra in front of her.',
        'The week strip is the heart of the page: it carries the amount inside each week rather than a paid/unpaid dot, so the BP can say “Ibu kurang Rp50.000 di minggu 7” instead of “Ibu belum bayar”. It shows the last ten weeks and opens on THIS week at the right edge, scrolling left into the past. The date under each cell says which week it is, in the only terms said out loud.',
        'Under it, one figure and its parts: total tagihan, then minggu ini and terlewat. This is the only number she is about to act on, and the lines beneath it are the sentence she says when it gets argued with. The shortfall line appears only when there is one — but it does appear, because without it the parts do not add up to the total.',
        'The ladder is its own entry point. It is not a datum about her; it is a conversation, and the only thing on this page that leads somewhere she does something.',
        'Everything else on file drops to the bottom as Informasi tambahan, read-only: what a BP reads out when ops asks, or checks before she rides.',
      ],
      states: [
        {
          id: 'behind',
          label: '34 days behind',
          description: 'Arrears in the week strip and a shortfall line under the total',
          apply: demo.mitraBehind,
        },
        {
          id: 'current',
          label: 'Nothing overdue',
          description: 'The same page with no arrears in it — only this week to pay',
          apply: demo.mitraCurrent,
        },
        {
          id: 'deep',
          label: '63 days behind',
          description: 'The arrears deep enough to have earned a home visit',
          apply: demo.mitraDeepArrears,
        },
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
        'One active pencairan, always. Every number on the mitra page derives from a single ledger, and a second live loan would make “total tagihan” mean different things on different screens.',
      ],
      flowsTo: [{ to: 'mitra', label: 'kembali' }],
    },
    {
      id: 'collect',
      title: 'Tagih Pembayaran',
      component: CollectScreen,
      notes: [
        'The moment of negotiation. It opens on who she is over what she owes, drawn flat with no cards — the identity, the week-grid history and the bill read as one block — over the week grid carrying the date, outcome and amount of each recent week. Under it, the four ways she can pay as a menu.',
        'Two levels, told apart by ground rather than a rule: the identity and bill on white up top, the choice on a lightest-grey floor below. Every option opens a bottom sheet carrying only what it needs — a reason, a promise, an amount, or for a full payment nothing but a confirm — because the bill it is against is still on the page behind the sheet. A payment short of the bill still cannot save without both a reason and a date for the rest, exactly as a “tidak bayar” cannot.',
      ],
      states: [
        {
          id: 'fresh',
          label: 'Nothing recorded',
          description: 'The page as “Tagih” opens it — the bill, and the menu of four ways to pay',
          apply: demo.collectFresh,
        },
        {
          id: 'partial',
          label: 'Correcting a part-payment',
          description: 'Reopens on the amount sheet, prefilled with what was taken and why',
          apply: demo.collectPartial,
        },
        {
          id: 'refused',
          label: 'Correcting a recorded no',
          description: 'Reopens on the refusal sheet, carrying the reason and the promised date',
          apply: demo.collectRefused,
        },
        {
          id: 'tanggung',
          label: 'Covered by the group',
          description: 'Tanggung renteng, offered on GL loans only — never on a Modal card',
          apply: demo.collectGroupCovered,
        },
      ],
      flowsTo: [
        { to: 'collection', label: 'Terima Tunai' },
        { to: 'collection', label: 'Simpan Catatan — tidak bayar' },
        { to: 'mitra', label: 'ketuk nama mitra' },
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
