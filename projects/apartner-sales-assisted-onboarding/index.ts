// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import * as demo from './lib/demo'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'sales',
      title: 'Sales',
      component: lazyScreen(() => import('./screens/sales'), 'SalesScreen'),
      entry: true,
      flowsTo: [
        { to: 'follow-up', label: 'buka lead' },
        { to: 'calon-mitra', label: 'buka calon mitra' },
        { to: 'lead-new', label: 'Tambah lead' },
        { to: 'sosialisasi', label: 'buka POI' },
        { to: 'all-tasks', label: 'Lihat semua' },
        { to: 'poi-select', label: 'Sumber POI Visit' },
        { to: 'validasi-mitra', label: 'BM Validation card' },
      ],
    },
    {
      id: 'poi-select',
      title: 'Pilih POI',
      component: lazyScreen(() => import('./screens/poi-select'), 'PoiSelectScreen'),
      flowsTo: [{ to: 'lead-new', label: 'Pilih POI → form' }],
    },
    {
      id: 'poi-new',
      title: 'Tambah POI',
      component: lazyScreen(() => import('./screens/poi-new'), 'PoiNewScreen'),
      flowsTo: [{ to: 'sales', label: 'Save POI' }],
    },
    {
      id: 'task-list',
      title: 'Semua tugas',
      component: lazyScreen(() => import('./screens/task-list'), 'TaskListScreen'),
      flowsTo: [
        { to: 'follow-up', label: 'buka lead' },
        { to: 'sosialisasi', label: 'buka POI' },
      ],
    },
    {
      id: 'capaian',
      title: 'Capaian hari ini',
      component: lazyScreen(() => import('./screens/capaian'), 'CapaianScreen'),
    },
    {
      id: 'all-tasks',
      title: 'All task',
      component: lazyScreen(() => import('./screens/all-tasks'), 'AllTasksScreen'),
      flowsTo: [
        { to: 'follow-up', label: 'buka lead' },
        { to: 'sosialisasi', label: 'buka POI' },
      ],
    },
    {
      id: 'lead-new',
      title: 'Tambah Lead',
      component: lazyScreen(() => import('./screens/lead-new'), 'LeadNewScreen'),
      flowsTo: [
        { to: 'pendaftaran', label: 'Mulai pendaftaran' },
        { to: 'sales', label: 'Simpan prospek → Sales' },
        { to: 'sosialisasi', label: 'POI Visit → POI page' },
      ],
    },
    {
      id: 'follow-up',
      title: 'Follow Up Prospek',
      component: lazyScreen(() => import('./screens/follow-up'), 'FollowUpScreen'),
      states: [
        {
          id: 'first',
          label: 'Follow up',
          description: 'A POI lead due for a follow-up (a couple of days late)',
          apply: demo.followUpFirst,
        },
        {
          id: 'reactivation',
          label: 'Reactivation',
          description: 'An ex-mitra reopening — previous & potential loan limits',
          apply: demo.followUpReactivation,
        },
        {
          id: 'self-service',
          label: 'Self-service started',
          description: 'She was sent the AFIN app — the "Takeover application" case',
          apply: demo.followUpSelfService,
        },
      ],
      flowsTo: [
        { to: 'pendaftaran', label: 'Mulai onboarding' },
        { to: 'calon-mitra', label: 'Lanjutkan onboarding' },
        { to: 'majelis-page', label: 'Survey approved → majelis' },
        { to: 'sales', label: 'Reschedule / Drop' },
      ],
    },
    {
      id: 'pendaftaran',
      title: 'Mulai Pendaftaran',
      component: lazyScreen(() => import('./screens/pendaftaran'), 'PendaftaranScreen'),
      flowsTo: [
        { to: 'kumpulan-jadwal', label: 'Majelis baru → buat majelis' },
        { to: 'onboarding-start', label: 'Existing → cara onboarding' },
      ],
    },
    {
      id: 'onboarding-start',
      title: 'Persetujuan pendaftaran',
      component: lazyScreen(() => import('./screens/onboarding-start'), 'OnboardingStartScreen'),
      flowsTo: [{ to: 'onboarding-finalize', label: 'Lanjut → finalisasi' }],
    },
    {
      id: 'onboarding-finalize',
      title: 'Finalisasi persetujuan pendaftaran',
      component: lazyScreen(() => import('./screens/onboarding-finalize'), 'OnboardingFinalizeScreen'),
      flowsTo: [
        { to: 'calon-mitra', label: 'Lanjut ke survey' },
        { to: 'sales', label: 'Close → Start onboarding' },
      ],
    },
    {
      id: 'kumpulan-jadwal',
      title: 'Buat Majelis Baru',
      component: lazyScreen(() => import('./screens/kumpulan-jadwal'), 'KumpulanJadwalScreen'),
      flowsTo: [
        { to: 'onboarding-start', label: 'Simpan → cara onboarding' },
        { to: 'sales', label: 'Simpan sebagai calon mitra' },
      ],
    },
    {
      id: 'calon-mitra',
      title: 'Calon Mitra',
      component: lazyScreen(() => import('./screens/calon-mitra'), 'CalonMitraScreen'),
      // Survey ongoing — the two states of one calon mitra's survey.
      states: [
        {
          id: 'start-survey',
          label: 'Start of the survey',
          description: 'Calon mitra dibuka dengan survey masih kosong',
          apply: demo.surveyStart,
        },
        {
          id: 'majelis-done',
          label: 'Majelis / group formation selesai',
          description: 'Sudah diterima majelis; survey masih perlu diisi',
          apply: demo.surveyMajelisDone,
        },
        {
          id: 'all-filled',
          label: 'All items filled',
          description: 'BP Feedback, Uji Kelayakan, ritual & penerimaan KM — Submit Onboarding aktif',
          apply: demo.surveyAllDone,
        },
      ],
      flowsTo: [
        { to: 'survey-form', label: 'BP Feedback / Uji Kelayakan' },
        { to: 'ritual', label: 'Ritual explanation' },
        { to: 'majelis-page', label: 'Buka majelis' },
        { to: 'group-formation', label: 'Start group formation' },
        { to: 'disbursement-confirm', label: 'Lanjut → pencairan' },
        { to: 'sales', label: 'Submit onboarding' },
      ],
    },
    {
      // The same Calon Mitra detail, reached once the survey has a result — its
      // own states selector switches between the four post-survey outcomes.
      id: 'onboarding-outcome',
      title: 'Calon Mitra — hasil',
      component: lazyScreen(() => import('./screens/calon-mitra'), 'CalonMitraScreen'),
      states: [
        {
          id: 'waiting-formation',
          label: 'Waiting for group formation',
          description: 'Approved, tapi majelis barunya belum terbentuk',
          apply: demo.waitingFormation,
        },
        {
          id: 'need-resubmit',
          label: 'Need to resubmit UK',
          description: 'Foto KTP buram di Uji Kelayakan — muncul di Sales hari ini & Lihat semua',
          apply: demo.issueResubmit,
        },
        {
          id: 'pending-bm-validation',
          label: 'Need BM Review',
          description: 'Soft reject — menunggu validasi BM. Muncul di Lihat semua',
          apply: demo.issueSoftReject,
        },
        {
          id: 'survey-rejected',
          label: 'Survey rejected',
          description: 'Hard reject — ditolak underwriting. Muncul di Lihat semua',
          apply: demo.issueHardReject,
        },
      ],
      flowsTo: [
        { to: 'survey-form', label: 'Perbaiki Uji Kelayakan' },
        { to: 'disbursement-confirm', label: 'Lanjut → pencairan' },
        { to: 'group-formation', label: 'Start group formation' },
        { to: 'sales', label: 'Kembali ke Sales' },
      ],
    },
    {
      id: 'disbursement-confirm',
      title: 'Konfirmasi Pencairan',
      component: lazyScreen(() => import('./screens/disbursement-confirm'), 'DisbursementConfirmScreen'),
      flowsTo: [{ to: 'disbursement-akad', label: 'Lanjut ke Persetujuan' }],
    },
    {
      id: 'disbursement-akad',
      title: 'Persetujuan Akad',
      component: lazyScreen(() => import('./screens/disbursement-akad'), 'DisbursementAkadScreen'),
      flowsTo: [{ to: 'disbursement-success', label: 'Kirim Pengajuan' }],
    },
    {
      id: 'disbursement-success',
      title: 'Pencairan Diproses',
      component: lazyScreen(() => import('./screens/disbursement-success'), 'DisbursementSuccessScreen'),
      flowsTo: [{ to: 'sales', label: 'Tutup → Sales' }],
    },
    {
      id: 'survey-form',
      title: 'Survey Form',
      component: lazyScreen(() => import('./screens/survey-form'), 'SurveyFormScreen'),
      flowsTo: [{ to: 'calon-mitra', label: 'Selesai' }],
    },
    {
      id: 'ritual',
      title: 'Ritual Explanation',
      component: lazyScreen(() => import('./screens/ritual'), 'RitualScreen'),
      flowsTo: [{ to: 'calon-mitra', label: 'Selesai' }],
    },
    {
      id: 'survey-started',
      title: 'Survey Self-service',
      component: lazyScreen(() => import('./screens/survey-started'), 'SurveyStartedScreen'),
      flowsTo: [
        { to: 'sales', label: 'Kembali ke Sales' },
        { to: 'calon-mitra', label: 'Ambil alih jadi assisted' },
      ],
    },
    {
      id: 'majelis-list',
      title: 'Majelis',
      component: lazyScreen(() => import('./screens/majelis-list'), 'MajelisListScreen'),
      flowsTo: [{ to: 'majelis-page', label: 'Buka majelis' }],
    },
    {
      id: 'mitra-list',
      title: 'Mitra',
      component: lazyScreen(() => import('./screens/mitra-list'), 'MitraListScreen'),
      flowsTo: [{ to: 'calon-mitra', label: 'Buka mitra' }],
    },
    {
      id: 'majelis-page',
      title: 'Halaman Majelis',
      component: lazyScreen(() => import('./screens/majelis-page'), 'MajelisPageScreen'),
      flowsTo: [
        { to: 'follow-up', label: 'Kembali (lead)' },
        { to: 'majelis-list', label: 'Kembali (direktori)' },
      ],
    },
    {
      id: 'tugas',
      title: 'Tugas',
      component: lazyScreen(() => import('./screens/tugas'), 'TugasScreen'),
      flowsTo: [
        { to: 'group-formation', label: 'Group Formation' },
        { to: 'validasi-mitra', label: 'Validasi Mitra (BM)' },
      ],
    },
    {
      id: 'validasi-mitra',
      title: 'Validasi Mitra',
      component: lazyScreen(() => import('./screens/validasi-mitra'), 'ValidasiMitraScreen'),
      flowsTo: [
        { to: 'validasi-verifikasi-mitra', label: 'Lanjutkan ke Validasi Mitra' },
        { to: 'validasi-data', label: 'Buka Data UK' },
        { to: 'validasi-bp-feedback', label: 'Buka BP Feedback' },
      ],
    },
    {
      id: 'validasi-data',
      title: 'Data UK',
      component: lazyScreen(() => import('./screens/validasi-data'), 'ValidasiDataScreen'),
      flowsTo: [{ to: 'validasi-mitra', label: 'Kembali' }],
    },
    {
      id: 'validasi-bp-feedback',
      title: 'BP Feedback',
      component: lazyScreen(() => import('./screens/validasi-bp-feedback'), 'ValidasiBpFeedbackScreen'),
      flowsTo: [{ to: 'validasi-mitra', label: 'Kembali' }],
    },
    {
      id: 'validasi-verifikasi-mitra',
      title: 'Validasi ke Mitra',
      component: lazyScreen(
        () => import('./screens/validasi-verifikasi-mitra'),
        'ValidasiVerifikasiMitraScreen',
      ),
      flowsTo: [{ to: 'validasi-verifikasi-ketua', label: 'Lanjutkan ke Validasi Ketua Majelis' }],
    },
    {
      id: 'validasi-verifikasi-ketua',
      title: 'Validasi ke Ketua Majelis',
      component: lazyScreen(
        () => import('./screens/validasi-verifikasi-ketua'),
        'ValidasiVerifikasiKetuaScreen',
      ),
      flowsTo: [{ to: 'validasi-keputusan', label: 'Lanjutkan ke Keputusan' }],
    },
    {
      id: 'validasi-keputusan',
      title: 'Keputusan BM',
      component: lazyScreen(() => import('./screens/validasi-keputusan'), 'ValidasiKeputusanScreen'),
      flowsTo: [{ to: 'tugas', label: 'Kirim Keputusan' }],
    },
    {
      id: 'group-formation',
      title: 'Pembentukan Majelis',
      component: lazyScreen(() => import('./screens/group-formation'), 'GroupFormationScreen'),
      flowsTo: [{ to: 'calon-mitra', label: 'Majelis terbentuk → lead' }],
    },
    {
      id: 'sosialisasi',
      title: 'Sosialisasi',
      component: lazyScreen(() => import('./screens/sosialisasi'), 'SosialisasiScreen'),
      states: [
        {
          id: 'awal',
          label: 'Just started',
          description: 'No prospects captured yet — the empty screen',
          apply: demo.eventEmpty,
        },
        {
          id: 'separuh',
          label: 'Part way',
          description: 'Three names on the board, against a target of nine',
          apply: demo.eventHalf,
        },
        {
          id: 'penuh',
          label: 'Five captured',
          description: 'The list long enough to scroll behind the counter',
          apply: demo.eventFull,
        },
      ],
      flowsTo: [
        { to: 'follow-up', label: 'ketuk prospek' },
        { to: 'lead-new', label: 'Start add leads' },
        { to: 'sales', label: 'Complete Sosialisasi' },
      ],
    },
  ],
}
