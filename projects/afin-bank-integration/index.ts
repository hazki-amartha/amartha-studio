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
  ],
}
