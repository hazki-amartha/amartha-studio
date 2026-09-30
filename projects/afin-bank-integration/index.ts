import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import * as demo from './lib/demo'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'home',
      title: 'Beranda',
      component: lazyScreen(() => import('./screens/home'), 'HomeScreen'),
      entry: true,
      states: [
        { id: 'none', label: 'Belum punya rekening', apply: demo.belumPunya },
        { id: 'in-progress', label: 'Sedang diproses', apply: demo.sedangDiproses },
        { id: 'failed', label: 'Gagal dibuat', apply: demo.gagal },
        { id: 'active', label: 'Rekening aktif', apply: demo.aktif },
      ],
    },
    {
      id: 'ob-intro',
      title: 'Buka Rekening — Intro',
      component: lazyScreen(() => import('./screens/ob-intro'), 'ObIntroScreen'),
      states: [
        { id: 'kyc-verified', label: 'KYC Verified', description: 'KTP + selfie reused, no KTP photo step.', apply: demo.kycVerified },
        { id: 'kyc-basic', label: 'KYC Basic', description: 'User photographs their KTP during onboarding.', apply: demo.kycBasic },
      ],
    },
    {
      id: 'ob-contact',
      title: '1 · Nomor HP & email',
      component: lazyScreen(() => import('./screens/ob-contact'), 'ObContactScreen'),
    },
    {
      id: 'ob-otp',
      title: '1 · Kode OTP',
      component: lazyScreen(() => import('./screens/ob-otp'), 'ObOtpScreen'),
    },
    {
      id: 'ob-password',
      title: '1 · Kata sandi',
      component: lazyScreen(() => import('./screens/ob-password'), 'ObPasswordScreen'),
    },
    {
      id: 'ob-ktp-verified',
      title: '2 · KTP terverifikasi',
      component: lazyScreen(() => import('./screens/ob-ktp-verified'), 'ObKtpVerifiedScreen'),
    },
    {
      id: 'ob-ktp-guide',
      title: '2 · Panduan foto KTP',
      component: lazyScreen(() => import('./screens/ob-ktp-guide'), 'ObKtpGuideScreen'),
    },
    {
      id: 'ob-ktp-camera',
      title: '2 · Kamera KTP',
      component: lazyScreen(() => import('./screens/ob-ktp-camera'), 'ObKtpCameraScreen'),
    },
    {
      id: 'ob-ktp-review',
      title: '2 · Cek foto KTP',
      component: lazyScreen(() => import('./screens/ob-ktp-review'), 'ObKtpReviewScreen'),
    },
    {
      id: 'ob-ktp-form',
      title: '2 · Cek data KTP',
      component: lazyScreen(() => import('./screens/ob-ktp-form'), 'ObKtpFormScreen'),
    },
    {
      id: 'ob-liveness-guide',
      title: '2 · Panduan verifikasi wajah',
      component: lazyScreen(() => import('./screens/ob-liveness-guide'), 'ObLivenessGuideScreen'),
      states: [
        { id: 'pass', label: 'Wajah lolos', apply: demo.livenessLolos },
        { id: 'fail', label: 'Wajah gagal', apply: demo.livenessGagal },
        { id: 'locked', label: 'Terkunci', apply: demo.livenessTerkunci },
      ],
    },
    {
      id: 'ob-liveness-camera',
      title: '2 · Kamera verifikasi wajah',
      component: lazyScreen(() => import('./screens/ob-liveness-camera'), 'ObLivenessCameraScreen'),
    },
    {
      id: 'ob-liveness-checking',
      title: '2 · Memeriksa wajah',
      component: lazyScreen(() => import('./screens/ob-liveness-checking'), 'ObLivenessCheckingScreen'),
    },
    {
      id: 'ob-liveness-failed',
      title: '2 · Wajah belum terdeteksi',
      component: lazyScreen(() => import('./screens/ob-liveness-failed'), 'ObLivenessFailedScreen'),
    },
    {
      id: 'ob-liveness-locked',
      title: '2 · Verifikasi dikunci',
      component: lazyScreen(() => import('./screens/ob-liveness-locked'), 'ObLivenessLockedScreen'),
    },
    {
      id: 'ob-occupation',
      title: '3 · Pekerjaan',
      component: lazyScreen(() => import('./screens/ob-occupation'), 'ObOccupationScreen'),
    },
    {
      id: 'ob-address',
      title: '3 · Alamat surat',
      component: lazyScreen(() => import('./screens/ob-address'), 'ObAddressScreen'),
    },
    {
      id: 'ob-summary',
      title: '3 · Periksa data',
      component: lazyScreen(() => import('./screens/ob-summary'), 'ObSummaryScreen'),
    },
    {
      id: 'ob-terms',
      title: '4 · Akad & S&K',
      component: lazyScreen(() => import('./screens/ob-terms'), 'ObTermsScreen'),
    },
    {
      id: 'ob-pin',
      title: '4 · Buat PIN',
      component: lazyScreen(() => import('./screens/ob-pin'), 'ObPinScreen'),
    },
    {
      id: 'ob-pin-confirm',
      title: '4 · Ulangi PIN',
      component: lazyScreen(() => import('./screens/ob-pin-confirm'), 'ObPinConfirmScreen'),
    },
    {
      id: 'ob-processing',
      title: 'Rekening dibuat',
      component: lazyScreen(() => import('./screens/ob-processing'), 'ObProcessingScreen'),
    },
    {
      id: 'ob-success',
      title: 'Rekening aktif',
      component: lazyScreen(() => import('./screens/ob-success'), 'ObSuccessScreen'),
    },
    {
      id: 'account-detail',
      title: 'Detail rekening',
      component: lazyScreen(() => import('./screens/account-detail'), 'AccountDetailScreen'),
    },
    {
      id: 'ob-rejected',
      title: 'Rekening gagal',
      component: lazyScreen(() => import('./screens/ob-rejected'), 'ObRejectedScreen'),
    },
    {
      id: 'bind-intro',
      title: 'Hubungkan — Intro',
      component: lazyScreen(() => import('./screens/bind-intro'), 'BindIntroScreen'),
    },
    {
      id: 'bind-form',
      title: 'Hubungkan — Nomor HP & rekening',
      component: lazyScreen(() => import('./screens/bind-form'), 'BindFormScreen'),
    },
    {
      id: 'bind-otp',
      title: 'Hubungkan — Kode OTP',
      component: lazyScreen(() => import('./screens/bind-otp'), 'BindOtpScreen'),
    },
    {
      id: 'bind-success',
      title: 'Hubungkan — Berhasil',
      component: lazyScreen(() => import('./screens/bind-success'), 'BindSuccessScreen'),
    },
    {
      id: 'balance-detail',
      title: 'Saldo Saya',
      component: lazyScreen(() => import('./screens/balance-detail'), 'BalanceDetailScreen'),
      states: [
        { id: 'active', label: 'Aktif', apply: demo.statusAktif },
        { id: 'dormant', label: 'Tidak aktif (dormant)', apply: demo.statusDormant },
        { id: 'frozen', label: 'Dibekukan', apply: demo.statusBeku },
      ],
    },
    {
      id: 'unbind',
      title: 'Putuskan rekening',
      component: lazyScreen(() => import('./screens/unbind'), 'UnbindScreen'),
      states: [
        { id: 'pin-ok', label: 'PIN benar', apply: demo.pinBenar },
        { id: 'pin-wrong', label: 'PIN salah', description: 'First entry is rejected; the retry goes through.', apply: demo.pinSalah },
        { id: 'pin-locked', label: 'PIN terkunci', apply: demo.pinTerkunci },
      ],
    },
    {
      id: 'unbind-success',
      title: 'Putuskan — Berhasil',
      component: lazyScreen(() => import('./screens/unbind-success'), 'UnbindSuccessScreen'),
    },
    {
      id: 'topup',
      title: 'Isi Saldo',
      component: lazyScreen(() => import('./screens/topup'), 'TopupScreen'),
    },
    {
      id: 'history',
      title: 'Riwayat Transaksi',
      component: lazyScreen(() => import('./screens/history'), 'HistoryScreen'),
    },
    {
      id: 'history-detail',
      title: 'Detail Transaksi',
      component: lazyScreen(() => import('./screens/history-detail'), 'HistoryDetailScreen'),
    },
    {
      id: 'ppob-pulsa',
      title: 'Pulsa',
      component: lazyScreen(() => import('./screens/ppob-pulsa'), 'PpobPulsaScreen'),
    },
    {
      id: 'ppob-confirm',
      title: 'Pulsa — Konfirmasi & PIN',
      component: lazyScreen(() => import('./screens/ppob-confirm'), 'PpobConfirmScreen'),
      states: [
        { id: 'pin-ok', label: 'PIN benar', apply: demo.pinBenar },
        { id: 'pin-wrong', label: 'PIN salah', description: 'First entry is rejected; the retry goes through.', apply: demo.pinSalah },
        { id: 'pin-locked', label: 'PIN terkunci', apply: demo.pinTerkunci },
      ],
    },
    {
      id: 'ppob-success',
      title: 'Pulsa — Berhasil',
      component: lazyScreen(() => import('./screens/ppob-success'), 'PpobSuccessScreen'),
    },
    {
      id: 'pin-reset',
      title: 'Atur Ulang PIN',
      component: lazyScreen(() => import('./screens/pin-reset'), 'PinResetScreen'),
    },
    {
      id: 'pin-reset-otp',
      title: 'Atur Ulang PIN — OTP',
      component: lazyScreen(() => import('./screens/pin-reset-otp'), 'PinResetOtpScreen'),
    },
    {
      id: 'pin-change-old',
      title: 'Ubah PIN — PIN lama',
      component: lazyScreen(() => import('./screens/pin-change-old'), 'PinChangeOldScreen'),
    },
    {
      id: 'pin-new',
      title: 'PIN baru',
      component: lazyScreen(() => import('./screens/pin-new'), 'PinNewScreen'),
    },
    {
      id: 'pin-new-confirm',
      title: 'Ulangi PIN baru',
      component: lazyScreen(() => import('./screens/pin-new-confirm'), 'PinNewConfirmScreen'),
    },
    {
      id: 'pin-done',
      title: 'PIN tersimpan',
      component: lazyScreen(() => import('./screens/pin-done'), 'PinDoneScreen'),
    },
    {
      id: 'modal-disbursement',
      title: 'Pencairan Modal',
      component: lazyScreen(() => import('./screens/modal-disbursement'), 'ModalDisbursementScreen'),
      states: [
        { id: 'no-account', label: 'Belum punya rekening', apply: demo.tanpaRekening },
        { id: 'has-account', label: 'Rekening aktif', apply: demo.punyaRekening },
      ],
    },
  ],
}
