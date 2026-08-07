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
        'The BM’s day is two cards long: a morning briefing that opens the branch day with her BPs and an evening briefing that closes it. The BP direction’s field stops — majelis, doorsteps, sosialisasi, the cash handover — are gone rather than hidden, because a day that lists eight rides a BM is not making reads as somebody else’s.',
        'The card is exactly the BP app’s task card: a two-letter code tile, a caption carrying the appointment and its clock with the state pinned right, the name at reading size, the place, then the distance. MB and EB sit where MV and HV sit. The kind and the name are the same two words here, which they are not on a BP’s card — that is what a briefing is.',
        'Both cards open a page that is deliberately empty. What a briefing actually asks of her is the next conversation, and drawing a guess at it now would answer it before it is asked.',
      ],
      flowsTo: [
        { to: 'briefing-morning', label: 'Morning briefing' },
        { to: 'briefing-evening', label: 'Evening briefing' },
        { to: 'comms', label: 'kotak masuk di header' },
        { to: 'majelis-list', label: 'tab Majelis' },
        { to: 'mitra-list', label: 'tab Mitra' },
        { to: 'kpi', label: 'tab KPI' },
        { to: 'profile', label: 'tab Profil' },
      ],
    },
    {
      id: 'briefing-morning',
      title: 'Morning briefing',
      component: lazyScreen(() => import('./screens/briefing-morning'), 'BriefingMorningScreen'),
      notes: [
        'The meeting that opens the branch day, as a running order rather than a form: nothing is typed, everything is ticked. The whole card is the tap target, not a checkbox on its edge — she is talking to seven people while she uses this.',
        'Absensi is drawn as taken and collapsed to its count. The BPs are in the room or the meeting has not started, so the register is confirmed at a glance and expanded only if a name is in question. Its seven names are the same seven the BP filter reads, not a second hand-kept list.',
        'The NG-MIS paths are printed, not linked. NG-MIS is another system, and a prototype that navigates out of itself strands the review in an app nobody opened it to see.',
        'Selesaikan Briefing is gated on every item ticked and the photo taken, and the bar says which is missing rather than only refusing. Orange, not red: nothing has gone wrong, the meeting is still running.',
      ],
      states: [
        {
          id: 'alt1',
          label: 'Alt-1 · Satu halaman',
          description: 'The running order on one page — absensi open, ticked as the room fills',
          apply: demo.morningDefault,
        },
        {
          id: 'alt2',
          label: 'Alt-2 · Bertahap',
          description: 'The same order, one card per page behind a stepper, NG-MIS paths printed',
          apply: demo.morningStepper,
        },
        {
          id: 'alt3',
          label: 'Alt-3 · Data di aplikasi',
          description:
            'Alt-2, but repayment, disbursement and each BP’s tugas are read in-app instead of in NG-MIS',
          apply: demo.morningLive,
        },
        {
          id: 'alt4',
          label: 'Alt-4 · Tugas di dalam target',
          description:
            'Alt-3 without a tugas step — each BP’s stops sit under her own repayment and disbursement, with what each adds',
          apply: demo.morningMerged,
        },
        {
          id: 'alt5',
          label: 'Alt-5 · Poin bicara',
          description:
            'Alt-4 with the meters dropped — every figure states its gap as a sentence she reads out',
          apply: demo.morningPointer,
        },
        {
          id: 'alt3b',
          label: 'Alt-3b · Target mitra',
          description: 'Alt-3 with every repayment and disbursement target counted in mitra',
          apply: demo.morningLiveMitra,
        },
        {
          id: 'alt4b',
          label: 'Alt-4b · Target mitra',
          description: 'Alt-4 in mitra — each stop carries the number of women it should bring',
          apply: demo.morningMergedMitra,
        },
        {
          id: 'alt5b',
          label: 'Alt-5b · Target mitra',
          description: 'Alt-5’s spoken pointers, said in mitra rather than rupiah',
          apply: demo.morningPointerMitra,
        },
      ],
      flowsTo: [{ to: 'today', label: 'Selesaikan Briefing — kembali ke Tugas' }],
    },
    {
      id: 'briefing-evening',
      title: 'Evening briefing',
      component: lazyScreen(() => import('./screens/briefing-evening'), 'BriefingEveningScreen'),
      states: [
        {
          id: 'alt1',
          label: 'Alt-1 · Satu halaman',
          description:
            'The whole closing on one page — absensi, then three script cards with their NG-MIS paths',
          apply: demo.eveningDefault,
        },
        {
          id: 'alt2',
          label: 'Alt-2 · Bertahap',
          description: 'The same script, one subject per page behind the stepper',
          apply: demo.eveningStepper,
        },
        {
          id: 'alt3',
          label: 'Alt-3 · Data di aplikasi',
          description:
            'Alt-2, but the day’s numbers are read in-app — awal hari against setelah closing',
          apply: demo.eveningLive,
        },
      ],
      flowsTo: [{ to: 'today', label: 'Selesaikan Briefing — kembali ke Tugas' }],
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
        { to: 'kpi', label: 'tab KPI' },
        { to: 'profile', label: 'tab Profil' },
      ],
    },
    {
      id: 'kpi',
      title: 'KPI',
      component: lazyScreen(() => import('./screens/kpi'), 'KpiScreen'),
      notes: [
        'Blank on purpose. The BP direction’s scoreboard measures one field officer’s own collection and growth; a Branch Manager is scored on the BPs she runs, so keeping the seven parameters here would put a page of confident numbers in front of a reader that describe the wrong person. The tab stays, and what belongs on it is the next conversation.',
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
        { to: 'kpi', label: 'tab KPI' },
        { to: 'profile', label: 'tab Profil' },
      ],
    },
    {
      id: 'profile',
      title: 'Profil',
      component: lazyScreen(() => import('./screens/profile'), 'ProfileScreen'),
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
        'There is no footer action. Starting a pelayanan and reminding a majelis are BP work done from the BP app; this is the BM’s read-only view of the same group, so the page ends at the roster.',
        'The header’s trailing control is Edit, not Info. Changing a majelis is four routes rather than one form — its schedule lives with the BP’s week, its Ketua is a mitra, its location is a place, and moving a member changes another group as well as this one — so a combined form would be four unrelated fields sharing a Save button.',
      ],
      flowsTo: [
        { to: 'mitra', label: 'ketuk nama mitra' },
        { to: 'majelis-list', label: 'kembali' },
      ],
    },
    {
      id: 'settlement',
      title: 'Setoran',
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
        { to: 'today', label: 'Selesai — kembali ke jadwal' },
      ],
    },
    {
      id: 'agent-locator',
      title: 'Agen Terdekat',
      component: lazyScreen(() => import('./screens/agent-locator'), 'AgentLocatorScreen'),
      flowsTo: [{ to: 'settlement', label: 'kembali' }],
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
      ],
      flowsTo: [{ to: 'today', label: 'Selesai — setelah closing terkirim' }],
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
        { to: 'lead', label: 'ketuk prospek' },
        { to: 'today', label: 'Selesaikan Sosialisasi' },
      ],
    },
    {
      id: 'lead',
      title: 'Data Prospek',
      component: lazyScreen(() => import('./screens/lead'), 'LeadScreen'),
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
      component: lazyScreen(() => import('./screens/follow-up'), 'FollowUpScreen'),
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
      title: 'Semua Pencairan',
      component: lazyScreen(() => import('./screens/loans'), 'LoansScreen'),
      notes: [
        'Every cycle she has taken, active first and settled below. The mitra page answers “what does she owe today”; this answers “how long has she been with us, and how did the last cycles go” — a different question with a different shelf life, which is why it is a page rather than another section on one already carrying a ledger.',
        'It is the evidence behind the ladder. “Ibu sudah tiga kali cair dan dua lunas tepat waktu” is the sentence that makes a top-up conversation land, and until this screen existed the BP had to remember it.',
        'A settled cycle keeps every number and loses only its colour. It is still the thing she quotes, and greying it down to a summary line would throw away the proof to save a card.',
        'One active pencairan, always. Every number on the mitra page derives from a single ledger, and a second live loan would make “total tagihan” mean different things on different screens.',
      ],
      flowsTo: [
        { to: 'loan', label: 'ketuk kartu pencairan' },
        { to: 'mitra', label: 'kembali' },
      ],
    },
    {
      id: 'loan',
      title: 'Detail Pencairan',
      component: lazyScreen(() => import('./screens/loan'), 'LoanScreen'),
      notes: [
        'One cycle’s full instalment schedule, opened by tapping its card. The list of pencairan answers “how many cycles, and how did they go”; this answers the question a mitra actually argues with — “minggu ke berapa yang belum kebayar?” — so it is every instalment, not a summary of them.',
        'Fifty rows is the point rather than a problem to solve: the mitra page already summarises the recent weeks, and a BP opens this when the summary is being disputed — which it only is about a week off the edge of that summary.',
        'The rail makes fifty rows a sequence rather than fifty cards. Discs are filled where the week has been answered and hollow where it is still ahead, so how far in she is reads before any figure does. A week still ahead states a plan: grey amount, date on the right. An answered week states an outcome: solid amount, its due date underneath, and the badge at the edge.',
        'Every row opens, because the argument is never about the amount — it is about what happened that week. A part-payment is the case that earns it: “Lunas” and “Belum Bayar” both hide the week she handed over half.',
      ],
      flowsTo: [{ to: 'loans', label: 'kembali' }],
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
