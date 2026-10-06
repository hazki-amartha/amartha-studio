import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import * as demo from './lib/demo'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'home',
      title: 'Beranda (Regular)',
      component: lazyScreen(() => import('./screens/home'), 'HomeScreen'),
      states: [
        { id: 'none', label: 'Belum punya rekening', apply: demo.belumPunya },
        { id: 'in-progress', label: 'Sedang diproses', apply: demo.sedangDiproses },
        { id: 'failed', label: 'Gagal dibuat', apply: demo.gagal },
        { id: 'active', label: 'Rekening aktif', apply: demo.aktif },
      ],
    },
    // --- Modal Usaha onboarding (inactive → active, 6 steps, Ketua / Anggota) ---
    {
      id: 'modal-home',
      title: 'Beranda',
      component: lazyScreen(() => import('./screens/modal-home'), 'ModalHomeScreen'),
      entry: true,
      states: [
        { id: 'non-belum', label: 'Non Modal: Belum Punya Rekening', apply: demo.berandaNonBelum },
        { id: 'non-proses', label: 'Non Modal: Sedang diproses', apply: demo.berandaNonProses },
        { id: 'non-gagal', label: 'Non Modal: Gagal dibuat', apply: demo.berandaNonGagal },
        { id: 'non-aktif', label: 'Non Modal: Rekening aktif', apply: demo.berandaNonAktif },
        { id: 'modal-belum-kyc', label: 'Modal: Belum KYC', apply: demo.berandaBelumKyc },
        { id: 'modal-kyc-ongoing', label: 'Modal: KYC ongoing (3 dari 6)', apply: demo.berandaKycOngoing },
        { id: 'modal-kyc-gagal', label: 'Modal: KYC gagal', apply: demo.berandaKycGagal },
        { id: 'modal-kyc-diproses', label: 'Modal: KYC Diproses', apply: demo.berandaKycDiproses },
        { id: 'modal-kyc-berhasil', label: 'Modal: KYC Berhasil siap dicairkan', apply: demo.berandaKycBerhasil },
        { id: 'modal-dicairkan', label: 'Modal: Sudah dicairkan, ongoing', apply: demo.berandaDicairkan },
      ],
    },
    {
      id: 'modal-prepare',
      title: 'Modal · Persiapan (Belum KYC)',
      component: lazyScreen(() => import('./screens/modal-prepare'), 'ModalPrepareScreen'),
    },
    {
      id: 'modal-verify-failed',
      title: 'Modal · Verifikasi gagal',
      component: lazyScreen(() => import('./screens/modal-verify-failed'), 'ModalVerifyFailedScreen'),
    },
    {
      id: 'modal-hub',
      title: 'Modal · Cek & perbarui data',
      component: lazyScreen(() => import('./screens/modal-hub'), 'ModalHubScreen'),
      states: [
        { id: 'review', label: 'Belum terisi', description: 'All six sections still incomplete.', apply: demo.modalKosong },
        { id: 'lengkap', label: 'Semua lengkap', description: 'All six sections complete.', apply: demo.modalTerisi },
      ],
    },
    {
      id: 'modal-ktp-guide',
      title: 'Modal · 1 Panduan foto KTP',
      component: lazyScreen(() => import('./screens/modal-ktp-guide'), 'ModalKtpGuideScreen'),
    },
    {
      id: 'modal-ktp-form',
      title: 'Modal · 1 Cek data KTP',
      component: lazyScreen(() => import('./screens/modal-ktp-form'), 'ModalKtpFormScreen'),
    },
    {
      id: 'modal-selfie',
      title: 'Modal · 1 Selfie',
      component: lazyScreen(() => import('./screens/modal-selfie'), 'ModalSelfieScreen'),
    },
    {
      id: 'modal-pribadi',
      title: 'Modal · 1 Alamat pribadi',
      component: lazyScreen(() => import('./screens/modal-pribadi'), 'ModalPribadiScreen'),
    },
    {
      id: 'modal-bank',
      title: 'Modal · 2 Data bank',
      component: lazyScreen(() => import('./screens/modal-bank'), 'ModalBankScreen'),
    },
    {
      id: 'modal-pekerjaan',
      title: 'Modal · 2 Data pekerjaan',
      component: lazyScreen(() => import('./screens/modal-pekerjaan'), 'ModalPekerjaanScreen'),
    },
    {
      id: 'modal-majelis',
      title: 'Modal · Majelis Anda',
      component: lazyScreen(() => import('./screens/modal-majelis'), 'ModalMajelisScreen'),
      states: [
        { id: 'belum-kyc', label: 'Belum KYC', apply: demo.berandaBelumKyc },
        { id: 'kyc-ongoing', label: 'KYC ongoing (3 dari 6)', apply: demo.berandaKycOngoing },
        { id: 'kyc-gagal', label: 'KYC gagal', apply: demo.berandaKycGagal },
        { id: 'kyc-diproses', label: 'KYC Diproses', apply: demo.berandaKycDiproses },
        { id: 'kyc-berhasil', label: 'KYC Berhasil siap dicairkan', apply: demo.berandaKycBerhasil },
        { id: 'dicairkan', label: 'Sudah dicairkan, ongoing', apply: demo.berandaDicairkan },
      ],
    },
    {
      id: 'modal-keluarga',
      title: 'Modal · 4 Panduan foto KK',
      component: lazyScreen(() => import('./screens/modal-keluarga'), 'ModalKeluargaScreen'),
    },
    {
      id: 'modal-keluarga-form',
      title: 'Modal · 4 Data keluarga',
      component: lazyScreen(() => import('./screens/modal-keluarga-form'), 'ModalKeluargaFormScreen'),
    },
    {
      id: 'modal-rumah',
      title: 'Modal · 5 Panduan foto rumah',
      component: lazyScreen(() => import('./screens/modal-rumah'), 'ModalRumahScreen'),
    },
    {
      id: 'modal-rumah-form',
      title: 'Modal · 5 Lokasi rumah',
      component: lazyScreen(() => import('./screens/modal-rumah-form'), 'ModalRumahFormScreen'),
    },
    {
      id: 'modal-usaha',
      title: 'Modal · 6 Panduan foto usaha',
      component: lazyScreen(() => import('./screens/modal-usaha'), 'ModalUsahaScreen'),
    },
    {
      id: 'modal-usaha-form',
      title: 'Modal · 6 Lokasi usaha',
      component: lazyScreen(() => import('./screens/modal-usaha-form'), 'ModalUsahaFormScreen'),
    },
    {
      id: 'modal-review',
      title: 'Modal · Data pengajuan (review)',
      component: lazyScreen(() => import('./screens/modal-review'), 'ModalReviewScreen'),
    },
    {
      id: 'modal-confirm',
      title: 'Modal · Konfirmasi kirim',
      component: lazyScreen(() => import('./screens/modal-confirm'), 'ModalConfirmScreen'),
    },
    {
      id: 'modal-sending',
      title: 'Modal · Mengirim…',
      component: lazyScreen(() => import('./screens/modal-sending'), 'ModalSendingScreen'),
    },
    {
      id: 'modal-sent',
      title: 'Modal · Pengajuan terkirim',
      component: lazyScreen(() => import('./screens/modal-sent'), 'ModalSentScreen'),
    },
    {
      id: 'modal-success',
      title: 'Modal · Approval (bank dibuka)',
      component: lazyScreen(() => import('./screens/modal-success'), 'ModalSuccessScreen'),
      states: [
        { id: 'pending', label: 'Terkirim (ditinjau)', apply: demo.modalMenunggu },
        { id: 'approved', label: 'Disetujui — rekening dibuka', description: 'Modal active; Rekening Amartha opens with it.', apply: demo.modalDisetujui },
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
      id: 'poket-detail',
      title: 'Poket',
      component: lazyScreen(() => import('./screens/poket-detail'), 'PoketDetailScreen'),
      states: [
        { id: 'non-premium', label: 'Non premium', apply: demo.poketNonPremium },
        { id: 'premium-mitra', label: 'Premium Mitra (after KYC Modal)', apply: demo.poketPremiumMitra },
        { id: 'premium-non-mitra', label: 'Premium Non Mitra (after buka rekening)', apply: demo.poketPremiumNonMitra },
      ],
    },
    {
      id: 'poket-topup',
      title: 'Poket · Isi Saldo',
      component: lazyScreen(() => import('./screens/poket-topup'), 'PoketTopupScreen'),
    },
    {
      id: 'poket-transfer',
      title: 'Poket · Transfer',
      component: lazyScreen(() => import('./screens/poket-transfer'), 'PoketTransferScreen'),
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
