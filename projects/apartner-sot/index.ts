// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import * as demo from './lib/demo'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'today',
      title: 'Tugas',
      component: lazyScreen(() => import('./screens/today'), 'TodayScreen'),
      entry: true,
      notes: [
        'The BP opens her day here, as one list of equal cards under two headings: Belum selesai and Selesai. Every row starts its task on tap. Nothing is singled out as “now” — a day does not run in clock order, so the schedule stays a list of things she can begin rather than a queue that only hands her the top row.',
        'The split is on the only line that matters when she looks at her day: is there still something to do here. Dikerjakan sits with Belum mulai, because a half-finished visit is unfinished work.',
        'Every row wears its kind as a short code — MV, HV, Sos, FU — the shorthand she and her BM already speak. The title has the first line to itself, since that is the line she scans to find a row. The time sits on the address line in front of the pin: when and where are one fact in two parts, and reading them together is how a stop gets planned.',
        'A card reads top to bottom in one order: name, address, distance, and — on a home visit only — “Kemungkinan bayar tinggi”. Distance sits directly under the address it qualifies, because “where, and how far” is one thought. The order of a day is decided by geography as much as by the clock: two stops in one kampung get done together whatever their slots say.',
        'The propensity label is the only badge on the card, and it goes on home visits only — a majelis is 22 women with 22 answers, so one flag on a group describes nobody in it. It stays a small label rather than a headline, because a BP who reads a prediction as a promise and finds an empty house twice stops believing the next one.',
        'Setoran sits at the top: the cash she is carrying right now, phrased as a decision rather than as progress against a target. The risk being managed is money on a motorbike. It names the amount, says how many handovers she has used, and offers one button.',
'From the widget she picks WHEN to settle; the Setoran screen is where she picks how much and by which road. She can put the whole bag down or part of it — a short handover leaves the remainder recorded as still in the bag, and the widget comes straight back with it.',
        'She can settle up to THREE times a day — that is the only limit, there is no clock on it. The widget names how many drops she has left so she paces them; once all three are used it goes quiet, and any cash still in the bag rides to closing.',
        'Belum terkirim sits directly above the task list, because that is what it is about: those rows, and the fact that finishing them was not the last step. A BP closes a visit standing in a balai with no signal; without this she finds out on Friday that Tuesday never landed. It disappears the moment nothing is pending.',
        'Closing — Tutup Hari Ini — is a task ROW at the foot of the list, tapped like any other task. The "every visit done, bag empty" gate lives inside the closing screen, not on the row, so it stays tappable throughout: an early tap just shows her what is still left to do. Once the day is closed the same row moves to Selesai reading Terkirim — a day has one end, and this is it.',
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
          label: 'All three handovers used',
          description: 'Three settlements made — the widget goes quiet, cash rides to closing',
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
          description: 'Closing submitted — the Tutup Hari Ini row now reads Terkirim in Selesai',
          apply: demo.scheduleClosed,
        },
        // Which setoran direction the Setor button opens. Off screen on
        // purpose: both alternatives are live, and a chooser drawn inside the
        // app would be the one screen that exists only because there are two
        // prototypes. Sets the road and nothing else, so flipping it never
        // disturbs whichever day is on screen.
        {
          id: 'setor-alt-1',
          label: 'Setor → Alt 1',
          description: 'Setor opens the first concept: pick what to settle, then how',
          apply: demo.setorAltOne,
        },
        {
          id: 'setor-alt-2',
          label: 'Setor → Alt 2',
          description: 'Setor opens the new concept: pick how, setor sebagian a page away',
          apply: demo.setorAltTwo,
        },
        {
          id: 'bukti-baru',
          label: 'Nominal berubah — kirim bukti baru',
          description:
            'Ops mengubah nominal dari dashboard setelah setoran, jadi dua tugas kirim ulang muncul: rekap ke Majelis Mawar dan bukti bayar ke Ibu Wati',
          apply: demo.buktiBaru,
        },
      ],
      flowsTo: [
        { to: 'attendance', label: 'Mulai Pelayanan — langsung ke Majelis Visit 1' },
        { to: 'comms', label: 'kotak masuk di header' },
        { to: 'home-brief', label: 'Mulai Kunjungan (home visit)' },
        { to: 'sosialisasi', label: 'Mulai Sosialisasi — cari prospek baru' },
        { to: 'follow-up', label: 'Mulai Follow Up — telepon prospek' },
        { to: 'settlement', label: 'Setor → Alt 1 — dari widget setoran' },
        { to: 'setor-payment', label: 'Setor → Alt 2 — dari widget setoran' },
        { to: 'deposit', label: 'Tutup Hari Ini — baris tugas terakhir' },
        { to: 'bukti-rekap', label: 'Kirim Bukti Bayar Baru (Majelis) — state Nominal berubah' },
        { to: 'bukti-bayar', label: 'Kirim Bukti Bayar Baru (Mitra) — state Nominal berubah' },
        { to: 'majelis-list', label: 'tab Majelis' },
        { to: 'mitra-list', label: 'tab Mitra' },
        { to: 'profile', label: 'tab Profil' },
      ],
    },
    {
      id: 'majelis-list',
      title: 'Majelis',
      component: lazyScreen(() => import('./screens/majelis-list'), 'MajelisListScreen'),
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
        { to: 'profile', label: 'tab Profil' },
      ],
    },
    {
      id: 'mitra-list',
      title: 'Mitra',
      component: lazyScreen(() => import('./screens/mitra-list'), 'MitraListScreen'),
      notes: [
        'Every borrower the BP carries, across every group. The Majelis tab answers “who is in this group”; this answers “where is Ibu Rina” — a question a directory of groups cannot take, because the woman phoning her does not open with which balai she attends.',
        'The card is the roster’s card unchanged, with one line added under the name: her majelis and when it meets. That line is the only reason this list is not the roster — on the roster, the group is the page you are already on.',
        'Search finds a woman she can name; the two filters find a set she can only describe — “everyone past 30 days”, “everyone in Kenanga”. DPD is filtered by BUCKET rather than by day count, because a bucket is the question someone actually asks.',
      ],
      flowsTo: [
        { to: 'mitra', label: 'ketuk mitra → Detail Mitra' },
        { to: 'today', label: 'tab Jadwal' },
        { to: 'majelis-list', label: 'tab Majelis' },
        { to: 'profile', label: 'tab Profil' },
      ],
    },
    {
      id: 'profile',
      title: 'Profil',
      component: lazyScreen(() => import('./screens/profile'), 'ProfileScreen'),
      notes: [
        'The BP’s own account and settings — the standard shelf every app has, and deliberately unremarkable.',
      ],
      flowsTo: [
        { to: 'today', label: 'tab Jadwal' },
        { to: 'majelis-list', label: 'tab Majelis' },
        { to: 'mitra-list', label: 'tab Mitra' },
      ],
    },
    {
      id: 'lead-detail',
      title: 'Detail Lead',
      component: lazyScreen(() => import('./screens/lead-detail'), 'LeadDetailScreen'),
    },
    {
      id: 'lead-new',
      title: 'Tambah Lead',
      component: lazyScreen(() => import('./screens/lead-new'), 'LeadNewScreen'),
      flowsTo: [{ to: 'lead-detail', label: 'simpan → buka record' }],
    },
    {
      id: 'bukti-rekap',
      title: 'Kirim Rekap Baru',
      component: lazyScreen(() => import('./screens/bukti-rekap'), 'BuktiRekapScreen'),
      notes: [
        'The majelis-level re-send: the recap the BP already sent the group, with the one figure ops corrected on the dashboard marked — old struck, new highlighted — so the second message reads as a correction, not a contradictory receipt.',
      ],
      flowsTo: [{ to: 'today', label: 'Kirim / Tutup — kembali ke Jadwal' }],
    },
    {
      id: 'bukti-bayar',
      title: 'Kirim Bukti Bayar Baru',
      component: lazyScreen(() => import('./screens/bukti-bayar'), 'BuktiBayarScreen'),
      notes: [
        'The mitra-level re-send: the doorstep receipt the mitra already had, with the corrected nominal marked the same way, so a single number moving upstream does not turn into two messages that disagree.',
      ],
      flowsTo: [{ to: 'today', label: 'Kirim / Tutup — kembali ke Jadwal' }],
    },
    {
      id: 'comms',
      title: 'Informasi & Program',
      component: lazyScreen(() => import('./screens/comms'), 'CommsScreen'),
      flowsTo: [{ to: 'banner-detail', label: 'ketuk kartu' }],
    },
    {
      id: 'banner-detail',
      title: 'Detail Banner',
      component: lazyScreen(() => import('./screens/banner-detail'), 'BannerDetailScreen'),
      flowsTo: [{ to: 'comms', label: 'kembali' }],
    },
    {
      id: 'majelis',
      title: 'Majelis View',
      component: lazyScreen(() => import('./screens/majelis'), 'MajelisScreen'),
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
      id: 'reminder',
      title: 'Ingatkan Majelis',
      component: lazyScreen(() => import('./screens/reminder'), 'ReminderScreen'),
      notes: [
        'The morning reminder, as ONE task rather than one per majelis. A BP sends these in a single sitting before she leaves the house, so three separate schedule rows would be three rows she ticks in ten seconds and then re-reads all day.',
        'Which groups appear is derived from today’s schedule, not listed again here: move a pelayanan to tomorrow and that group drops off the reminder by itself. A second hand-kept list of “who meets today” is the kind that quietly stops matching the agenda above it.',
        'The app writes the message; it does not send it. She copies and pastes it into the group herself — WhatsApp owns the send, and the copy/paste is also what keeps the flow inside the device frame.',
        'Each group carries its own tick, and it is held in the store rather than on the screen — it is a record she comes back to: two groups messaged before she rides out, the third at 11.00 when the ketua finally answers. A tick local to the screen would greet her with a clean slate and no way to tell which group she still owes.',
        'Copying and ticking are two gestures on purpose. Copying is not evidence she SENT it — she still has to switch apps and paste — so the app must not tick the row on her behalf and then be wrong about a group that never got the message.',
        'The task does not close until every group is ticked — the same gate the attendance register runs on, and for the same reason: a majelis that never got its message and a majelis nobody ticked read identically afterwards. The tick is hers to give, so a group she messaged from her own phone still clears the gate; what it refuses is calling the job done while one is unaccounted for.',
      ],
      flowsTo: [{ to: 'today', label: 'Selesai — kembali ke jadwal' }],
    },
    {
      id: 'attendance',
      title: 'Majelis Visit 1 — Hadir',
      component: lazyScreen(() => import('./screens/attendance'), 'AttendanceScreen'),
      states: [
        {
          id: 'fresh',
          label: 'Just opened',
          description: 'The register as she finds it — nothing marked, all 22 still to record',
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
        {
          id: 'no-address',
          label: 'No address on file',
          description: 'The kumpulan has no address — "Alamat tidak tersedia."',
          apply: demo.registerNoAddress,
        },
        {
          id: 'offline',
          label: 'Connection lost',
          description: 'The "internet terputus" sheet over the register',
          apply: demo.registerOffline,
        },
      ],
      flowsTo: [{ to: 'collection', label: 'Simpan & Lanjut — butuh 22/22' }],
    },
    {
      id: 'collection',
      title: 'Majelis Visit 2 — Tagih',
      component: lazyScreen(() => import('./screens/collection'), 'CollectionScreen'),
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
        {
          id: 'every-state',
          label: 'One of every card state',
          description: 'Bayar penuh, jumlah lain, pelunasan dini, tidak bayar, sudah bayar sendiri, meninggal dunia',
          apply: demo.queueEveryOutcome,
        },
        {
          id: 'refund',
          label: 'Ditolak — paid before the task was sent',
          description: 'AFin recorded an early payoff first; two mitra are owed money back',
          apply: demo.queueRefund,
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
      title: 'Majelis Visit 3 — Tawarkan',
      component: lazyScreen(() => import('./screens/growth'), 'GrowthScreen'),
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
        {
          id: 'carried',
          label: 'Offer carried from last visit',
          description: 'A yes not yet processed — the card asks "sudah diproses?"',
          apply: demo.offersCarried,
        },
        {
          id: 'empty',
          label: 'No offers',
          description: 'Nobody in the majelis qualifies — "Belum ada penawaran"',
          apply: demo.offersEmpty,
        },
      ],
      flowsTo: [
        { to: 'proof', label: 'Lanjut' },
        { to: 'mitra', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'proof',
      title: 'Majelis Visit 4 — Bukti',
      component: lazyScreen(() => import('./screens/proof'), 'ProofScreen'),
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
      ],
      flowsTo: [{ to: 'proof-wa', label: 'Simpan — ke pratinjau WhatsApp' }],
    },
    {
      id: 'proof-wa',
      title: 'Kirim Rekap ke Grup',
      component: lazyScreen(() => import('./screens/proof-wa'), 'ProofWaScreen'),
      flowsTo: [{ to: 'today', label: 'Kirim / Tutup — kembali ke jadwal' }],
    },
    {
      id: 'home-brief',
      title: 'Home Visit 1 — Kunjungi',
      component: lazyScreen(() => import('./screens/home-brief'), 'HomeBriefScreen'),
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
          description: 'Her penanggung jawab, plus why the mitra could not be met',
          apply: demo.doorMetPj,
        },
        {
          id: 'nobody',
          label: 'Nobody home',
          description: 'A reason for the empty house; Tagih is skipped and marked Dilewati',
          apply: demo.doorNobody,
        },
        {
          id: 'stuck',
          label: 'Moved twice already',
          description: '“Jadwal ulang” is blocked — the task has to be worked',
          apply: demo.doorStuck,
        },
        {
          id: 'friday',
          label: 'Friday',
          description: 'Home visits cannot be rescheduled on a Friday',
          apply: demo.doorFriday,
        },
      ],
      flowsTo: [
        { to: 'home-visit', label: 'Lanjut — mitra / PJ ditemui' },
        { to: 'home-proof', label: 'Lanjut — jika tidak ada orang (lewati Tagih)' },
        { to: 'mitra', label: 'ketuk nama mitra' },
      ],
    },
    {
      id: 'home-history',
      title: 'Tugas Home Visit',
      component: lazyScreen(() => import('./screens/home-history'), 'HomeHistoryScreen'),
    },
    {
      id: 'home-visit',
      title: 'Home Visit 2 — Tagih',
      component: lazyScreen(() => import('./screens/home-visit'), 'HomeVisitScreen'),
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
          id: 'tidak',
          label: 'Reached, did not pay',
          description: 'A reason and a promise — an outcome, not an empty record',
          apply: demo.payRefused,
        },
      ],
      flowsTo: [{ to: 'home-proof', label: 'Lanjut' }],
    },
    {
      id: 'home-proof',
      title: 'Home Visit 3 — Kirim bukti',
      component: lazyScreen(() => import('./screens/home-proof'), 'HomeProofScreen'),
      states: [
        {
          id: 'empty',
          label: 'No photo yet',
          description: 'The visit cannot be submitted until the door is photographed',
          apply: demo.doorProofEmpty,
        },
        {
          id: 'nobody',
          label: 'Nobody home',
          description: 'Tagih was skipped — marked Dilewati, Rp0',
          apply: demo.doorProofNobody,
        },
        {
          id: 'saved',
          label: 'Finished, not yet sent',
          description: 'Reopened from Tugas: every step ticked, still editable',
          apply: demo.doorSaved,
        },
        {
          id: 'sent',
          label: 'Sent — read only',
          description: 'Reopened from Tugas: nothing can change, the button is Tutup',
          apply: demo.doorSent,
        },
        {
          id: 'cash',
          label: 'Cash collected at the door',
          description: 'The summary shows the amount; the WhatsApp receipt carries it too',
          apply: demo.doorProofCash,
        },
        {
          id: 'no-cash',
          label: 'Nothing collected',
          description: 'She was met but did not pay — Rp0',
          apply: demo.doorProofNoCash,
        },
        {
          id: 'partial',
          label: 'A part-payment at the door',
          description: 'Bayar jumlah lain — part of the bill in cash',
          apply: demo.receiptPartial,
        },
      ],
      flowsTo: [{ to: 'home-proof-wa', label: 'Selesaikan Tugas — ke pratinjau WhatsApp' }],
    },
    {
      id: 'home-proof-wa',
      title: 'Tugas selesai',
      component: lazyScreen(() => import('./screens/home-proof-wa'), 'HomeProofWaScreen'),
      flowsTo: [{ to: 'today', label: 'Kirim / Tutup — kembali ke jadwal' }],
    },
    {
      id: 'settlement',
      title: 'Setoran (Alt 1)',
      component: lazyScreen(() => import('./screens/settlement'), 'SettlementScreen'),
      notes: [
        'Where the cash leaves her hands — separate from Closing, which is the checklist that ends the DAY. This screen is about the BAG: the money she is carrying right now and the transfer that gets it to the branch.',
        'One stepped page, in the order the act happens: what is in the bag, then WHICH of it to put down now, then which ROAD — a VA she transfers to, or an AmarthaLink agent she hands the notes to — then the photo that proves it went.',
        'She picks what goes in this handover: she ticks the tasks, and the individual mitra inside a majelis she has a roster for, and the amount is the sum of what she ticks. Everything starts ticked (settling the whole bag is the common case); unticking leaves that cash recorded as unsettled for a later drop.',
        'A day carries at most THREE handovers — that is the only limit, there is no clock on it. The cap is the balance between two risks: cash on a motorbike wants to be put down often, but every settlement is a reconciliation the branch has to clear. The banner names how many she has left, and once all three are used the remainder rides to closing.',
        'The agent road needs one thing the VA road does not: a counter to walk to. So under the kode unik sits “Cari agen terdekat”, onto a short list of the AmarthaLink desks near today’s route, each with its distance and closing time.',
        'The receipt number lives INSIDE the road she picks: a VA number for a transfer, a kode unik for the agent. A code with no chosen destination is a number she cannot use yet, so nothing shows until she picks — and the proof step only appears once there is a method for it to be proof OF.',
        'Cash settles by the RUPIAH, not by the task. What is outstanding is everything banked minus everything handed over, so a short handover leaves a remainder and the widget comes straight back with it — the breakdown attributes it to the pelayanan it came from, with the covered part drained off.',
        'Each settlement gets its own VA or kode unik, because that identifier is what the branch reconciles against, and several handovers keyed to one number are deposits nobody can tell apart at the other end.',
        'The header carries a Riwayat link onto the day’s cash story — what came in, what went out, and by which road — because a BP mid-settlement is exactly the person who wants to check what she already put down. The same sheet is reachable from the schedule’s settled line.',
      ],
      states: [
        {
          id: 'first',
          label: 'First handover of the day',
          description: 'Two majelis in the bag by midday — one of the day’s three drops',
          apply: demo.bagFirstHandover,
        },
        {
          id: 'capped',
          label: 'All three handovers used',
          description: 'Three settlements already made and cash still in the bag — no fourth drop',
          apply: demo.scheduleCapped,
        },
        {
          id: 'empty',
          label: 'Nothing left to hand over',
          description: 'Everything already settled — an honest empty state, not a form',
          apply: demo.scheduleCloseable,
        },
      ],
      flowsTo: [
        { to: 'agent-locator', label: 'Cari agen terdekat — dari metode agen' },
        { to: 'agent-payment', label: 'Lanjut — dengan metode agen dipilih' },
        { to: 'today', label: 'Selesai — kembali ke jadwal' },
      ],
    },
    // --- New Concept setor journey. Alt 2 to `settlement`'s Alt 1, and BOTH
    // are live: the Setor button (and Closing's titipan check) opens a sheet
    // naming the two, so a demo can walk either without going to look for it.
    // Alt 2 assumes the whole bag, makes the road the only question, and moves
    // splitting the handover onto its own page.
    {
      id: 'setor-payment',
      title: 'Setor Pembayaran (Alt 2)',
      component: lazyScreen(() => import('./screens/setor-payment'), 'SetorPaymentScreen'),
      flowsTo: [
        { to: 'setor-partial', label: 'Setor sebagian' },
        { to: 'agent-locator', label: 'Cari Agen Terdekat — dari metode agen' },
        { to: 'setor-agen', label: 'Setor — dengan metode agen dipilih' },
        { to: 'setor-va', label: 'Setor — dengan Virtual Account dipilih' },
        { to: 'setor-riwayat', label: 'Riwayat — dari header' },
      ],
    },
    {
      id: 'setor-partial',
      title: 'Setor Sebagian',
      component: lazyScreen(() => import('./screens/setor-partial'), 'SetorPartialScreen'),
      flowsTo: [
        { to: 'agent-locator', label: 'Cari Agen Terdekat — dari metode agen' },
        { to: 'setor-agen', label: 'Setor — dengan metode agen dipilih' },
        { to: 'setor-va', label: 'Setor — dengan Virtual Account dipilih' },
        { to: 'setor-riwayat', label: 'Riwayat — dari header' },
      ],
    },
    {
      id: 'setor-va',
      title: 'Setor via Virtual Account',
      component: lazyScreen(() => import('./screens/setor-va'), 'SetorVaScreen'),
      flowsTo: [{ to: 'setor-riwayat', label: 'Konfirmasi Setoran — ke riwayat' }],
    },
    {
      id: 'setor-agen',
      title: 'Setor Tunai (New Concept)',
      component: lazyScreen(() => import('./screens/setor-agen'), 'SetorAgenScreen'),
      flowsTo: [
        { to: 'agent-map', label: 'Buka Peta — dari baris agen' },
        { to: 'setor-riwayat', label: 'Konfirmasi Setoran — ke riwayat' },
      ],
    },
    {
      id: 'setor-riwayat',
      title: 'Riwayat Pembayaran',
      component: lazyScreen(() => import('./screens/setor-riwayat'), 'SetorRiwayatScreen'),
      flowsTo: [{ to: 'today', label: 'Selesai — kembali ke jadwal' }],
    },
    {
      id: 'agent-payment',
      title: 'Setor Tunai via Agen',
      component: lazyScreen(() => import('./screens/agent-payment'), 'AgentPaymentScreen'),
      flowsTo: [
        { to: 'agent-map', label: 'Buka Peta — dari baris agen' },
        { to: 'today', label: 'Konfirmasi Setoran — kembali ke jadwal' },
      ],
    },
    {
      id: 'agent-locator',
      title: 'Agen Terdekat',
      component: lazyScreen(() => import('./screens/agent-locator'), 'AgentLocatorScreen'),
      flowsTo: [
        { to: 'agent-map', label: 'Buka Peta — dari baris agen' },
        { to: 'settlement', label: 'kembali' },
      ],
    },
    {
      id: 'agent-map',
      title: 'Peta Agen',
      component: lazyScreen(() => import('./screens/agent-map'), 'AgentMapScreen'),
      flowsTo: [{ to: 'agent-locator', label: 'kembali' }],
    },
    {
      id: 'deposit',
      title: 'Closing',
      component: lazyScreen(() => import('./screens/deposit'), 'DepositScreen'),
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
        // The same off-screen setting the schedule carries: Setor Sekarang on
        // the titipan check opens whichever alternative is selected.
        {
          id: 'setor-alt-1',
          label: 'Setor → Alt 1',
          description: 'Setor Sekarang opens the first concept',
          apply: demo.setorAltOne,
        },
        {
          id: 'setor-alt-2',
          label: 'Setor → Alt 2',
          description: 'Setor Sekarang opens the new concept',
          apply: demo.setorAltTwo,
        },
      ],
      flowsTo: [
        { to: 'settlement', label: 'Setor Sekarang → Alt 1' },
        { to: 'setor-payment', label: 'Setor Sekarang → Alt 2' },
        { to: 'today', label: 'Selesai — setelah closing terkirim' },
      ],
    },
    {
      id: 'sosialisasi',
      title: 'Sosialisasi',
      component: lazyScreen(() => import('./screens/sosialisasi'), 'SosialisasiScreen'),
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
        { to: 'lead-detail', label: 'ketuk prospek' },
        { to: 'today', label: 'Selesaikan Sosialisasi' },
      ],
    },
    {
      id: 'follow-up',
      title: 'Follow Up Prospek',
      component: lazyScreen(() => import('./screens/follow-up'), 'FollowUpScreen'),
      notes: [
        'The same shape as a home visit, for the same reason: one person, a branch on whether you reached her at all, and worthless unless the outcome carries a date.',
        '“Did the call land” is asked BEFORE minat. Most follow-ups do not connect, and a form that opens on how interested she is makes an unanswered phone look like a lead who went cold — two completely different facts, only one of them about her.',
        '“Siap diajukan” is the one outcome the record can veto. Handing onboarding a prospect with no address and no majelis is how a qualified lead becomes a ticket, so the gate names the gap and offers the jump to fill it — which is why the half-finished call lives in the store and survives the trip.',
      ],
      states: [
        {
          id: 'default',
          label: 'Default',
          description: 'The default two-step follow-up on a connected lead',
          apply: demo.followUpDefault,
        },
        {
          id: 'alt',
          label: 'Alt · Tawarkan pengajuan',
          description:
            'Two steps — Hubungi, then Tawarkan pengajuan (Ajukan sekarang / Belum siap → catat minat & jadwal)',
          apply: demo.followUpAlt,
        },
      ],
      flowsTo: [
        { to: 'lead-new', label: 'Lengkapi Data Prospek' },
        { to: 'today', label: 'Simpan & Selesai — dari jadwal' },
      ],
    },
    {
      id: 'mitra',
      title: 'Detail Mitra',
      component: lazyScreen(() => import('./screens/mitra'), 'MitraScreen'),
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
      title: 'Riwayat angsuran',
      component: lazyScreen(() => import('./screens/loans'), 'LoansScreen'),
      flowsTo: [
        { to: 'loan', label: 'ketuk kartu pencairan' },
        { to: 'mitra', label: 'kembali' },
      ],
    },
    {
      id: 'loan',
      title: 'Detail Pencairan',
      component: lazyScreen(() => import('./screens/loan'), 'LoanScreen'),
      flowsTo: [{ to: 'loans', label: 'kembali' }],
    },
    {
      id: 'collect',
      title: 'Tagih Pembayaran',
      component: lazyScreen(() => import('./screens/collect'), 'CollectScreen'),
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
      component: lazyScreen(() => import('./screens/ladder'), 'LadderScreen'),
      notes: [
        'The one screen here that is not about what to do, but what to say. A BP opens it mid-conversation, reads the line at the top out loud, then turns the phone around and lets the mitra read the ladder herself. The top card states her current limit, because every rung below is an amount added to it and without the base the ladder is a set of increments measured from nowhere.',
        'So the copy is split by audience: the framing speaks to the BP about the mitra, while the quoted line and the rail speak to the mitra directly. Nothing is recorded here — the outcome of the conversation is logged where she is already being asked for it.',
      ],
      flowsTo: [{ to: 'mitra', label: 'kembali' }],
    },
  ],
}
