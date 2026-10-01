// Project module — exports config + the screens array. Register the project
// with ONE appended line in EACH of the two maps (above their markers):
//   projects/registry.ts  'my-project': () => import('./my-project').then((m) => m.project),
//   projects/configs.ts   'my-project': () => import('./my-project/project.config').then((m) => m.config),
//
// Screens are declared with lazyScreen(), never imported at the top of this
// file: the index is the project's metadata, and listing a screen should not
// load it. See platform/lazyScreen.tsx.

import type { ProjectModule } from '@/platform/types'
import { lazyScreen } from '@/platform/lazyScreen'
import { config } from './project.config'
import {
  applyEightWeeksEmpty7Partial8,
  applyEightWeeksLancar,
  applyEightWeeksPartial78,
  applyFiveWeeksLancar,
  applyWeek0,
  applyWeek1,
  applyWeek1Paid,
  applyWeek5,
  applyWeek6,
  applyWeek6b,
  applyWeek10,
  applyWeek10b,
  applyWeek11,
  applyWeek12,
  applyWeek13,
  applyWeek47,
  applyWeek48,
  setBonusGagal,
  setMajelisView,
} from './lib/store'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'home-var-d',
      title: 'Home (Final)',
      component: lazyScreen(() => import('./screens/home-var-d'), 'HomeVarDScreen'),
      entry: true, // exactly ONE screen per project sets entry: true
      // Ten loan-week milestones (Figma section 2918:10990), switchable from
      // the state controls beside the device — see lib/store.ts.
      states: [
        {
          id: 'week-0',
          label: 'Minggu 0 - baru cair, belum bayar',
          description: 'Pembayaran belum dimulai',
          apply: applyWeek0,
        },
        {
          id: 'week-1',
          label: 'Minggu 1 - bayar pertama, semua lancar',
          description: 'Individual lancar · Majelis lancar',
          apply: applyWeek1,
        },
        {
          id: 'week-5',
          label: 'Minggu 5 - semua lancar',
          description: 'Individual lancar · Majelis lancar',
          apply: applyWeek5,
        },
        {
          id: 'week-6',
          label: 'Minggu 6A - telat bayar, majelis berisiko',
          description: 'Individual berisiko · Majelis berisiko karena dirinya',
          apply: applyWeek6,
        },
        {
          id: 'week-6b',
          label: 'Minggu 6B - tepat waktu, anggota lain telat',
          description: 'Individual lancar · Majelis berisiko karena anggota lain',
          apply: applyWeek6b,
        },
        {
          id: 'week-10',
          label: 'Minggu 10A - telat 5 minggu, bonus bisa hilang',
          description: 'Telat bayar minggu 5–10 · Majelis berisiko karena dirinya',
          apply: applyWeek10,
        },
        {
          id: 'week-10b',
          label: 'Minggu 10B - tepat waktu, majelis makin berisiko',
          description: 'Individual lancar · Majelis makin berisiko karena anggota lain',
          apply: applyWeek10b,
        },
        {
          id: 'week-11',
          label: 'Minggu 11 - mulai bayar lagi, status membaik',
          description: 'Bayar minggu 5–11 · Status membaik jadi lancar',
          apply: applyWeek11,
        },
        {
          id: 'week-12',
          label: 'Minggu 12 - bonus majelis ke-1 cair',
          description: 'Lunas 12 minggu · Tugas Majelis selesai, bonus cair',
          apply: applyWeek12,
        },
        {
          id: 'week-13',
          label: 'Minggu 13 - bonus majelis ke-2 dimulai',
          description: 'Bonus cair, tugas Majelis ke-2 dimulai',
          apply: applyWeek13,
        },
        {
          id: 'week-47',
          label: 'Minggu 47 - semua bonus majelis selesai',
          description: 'Lunas 47 minggu · Semua bonus Majelis sudah cair',
          apply: applyWeek47,
        },
        {
          id: 'week-48',
          label: 'Minggu 48 - lunas, limit berhasil naik',
          description: 'Lunas semua · Limit berhasil naik',
          apply: applyWeek48,
        },
      ],
    },
    // One screen, every Bonus majelis page — picked by the Minggu, plus the
    // "Bonus 1 gagal" page (Figma section 2963:32482).
    {
      id: 'bonus-majelis',
      title: 'Bonus Majelis',
      component: lazyScreen(() => import('./screens/bonus-majelis'), 'BonusMajelisScreen'),
      states: [
        {
          id: 'week-0',
          label: 'Minggu 0 - bonus ke-1 belum mulai',
          description: 'Pembayaran belum dimulai',
          apply: () => {
            setBonusGagal(false)
            applyWeek0()
          },
        },
        {
          id: 'week-1',
          label: 'Minggu 1 - bonus ke-1 berjalan lancar',
          description: 'Individual lancar · Majelis lancar',
          apply: () => {
            setBonusGagal(false)
            applyWeek1()
          },
        },
        {
          id: 'week-5',
          label: 'Minggu 5 - bonus ke-1 berjalan lancar',
          description: 'Individual lancar · Majelis lancar',
          apply: () => {
            setBonusGagal(false)
            applyWeek5()
          },
        },
        {
          id: 'week-6',
          label: 'Minggu 6A - bonus berisiko, Anda telat bayar',
          description: 'Individual berisiko · Majelis berisiko karena dirinya',
          apply: () => {
            setBonusGagal(false)
            applyWeek6()
          },
        },
        {
          id: 'week-6b',
          label: 'Minggu 6B - bonus berisiko, anggota lain telat',
          description: 'Individual lancar · Majelis berisiko karena anggota lain',
          apply: () => {
            setBonusGagal(false)
            applyWeek6b()
          },
        },
        {
          id: 'week-10',
          label: 'Minggu 10A - bonus bisa hilang, Anda telat bayar',
          description: 'Telat bayar minggu 5–10 · Majelis berisiko karena dirinya',
          apply: () => {
            setBonusGagal(false)
            applyWeek10()
          },
        },
        {
          id: 'week-10b',
          label: 'Minggu 10B - bonus bisa hilang, anggota lain telat',
          description: 'Individual lancar · Majelis makin berisiko karena anggota lain',
          apply: () => {
            setBonusGagal(false)
            applyWeek10b()
          },
        },
        {
          id: 'week-11',
          label: 'Minggu 11 - bonus ke-1 masih bisa didapat',
          description: 'Bayar minggu 5–11 · Status membaik jadi lancar',
          apply: () => {
            setBonusGagal(false)
            applyWeek11()
          },
        },
        {
          id: 'week-12',
          label: 'Minggu 12 - bonus ke-1 berhasil didapat',
          description: 'Lunas 12 minggu · Tugas Majelis selesai, bonus cair',
          apply: () => {
            setBonusGagal(false)
            applyWeek12()
          },
        },
        {
          id: 'week-13',
          label: 'Minggu 13 - bonus ke-1 berhasil, ke-2 berjalan',
          description: 'Bonus cair, tugas Majelis ke-2 dimulai',
          apply: () => {
            setBonusGagal(false)
            applyWeek13()
          },
        },
        {
          id: 'week-47',
          label: 'Minggu 47 - semua bonus berhasil',
          description: 'Lunas 47 minggu · Semua bonus Majelis sudah cair',
          apply: () => {
            setBonusGagal(false)
            applyWeek47()
          },
        },
        {
          id: 'week-48',
          label: 'Minggu 48 - semua bonus berhasil',
          description: 'Lunas semua · Limit berhasil naik',
          apply: () => {
            setBonusGagal(false)
            applyWeek48()
          },
        },
        {
          id: 'bonus-1-gagal',
          label: 'Bonus 1 gagal - bonus ke-1 gagal, ke-2 berjalan',
          description: 'Bonus ke-1 gagal, ke-2 berjalan · tidak terhubung dari Home',
          apply: () => setBonusGagal(true),
        },
      ],
    },
    {
      id: 'majelis-anda',
      title: 'Majelis Anda - Status majelis',
      component: lazyScreen(() => import('./screens/majelis-anda'), 'MajelisAndaScreen'),
      states: [
        {
          id: 'belum',
          label: 'Belum mulai - pembayaran belum dimulai',
          description: 'Minggu 0 · pembayaran belum dimulai',
          apply: () => setMajelisView('belum'),
        },
        {
          id: 'lancar',
          label: 'Lancar - semua anggota bayar lancar',
          description: 'Semua anggota lancar',
          apply: () => setMajelisView('lancar'),
        },
        {
          id: 'tidak',
          label: 'Tidak Lancar - 5 anggota telat bayar',
          description: '5 anggota tidak lancar',
          apply: () => setMajelisView('tidak'),
        },
      ],
    },
    // Progress limit detail + payment schedule (Figma section 2967:34429) —
    // reached from the "Progress limit Anda" card on Home Var D.
    {
      id: 'progress-limit',
      title: 'Progress Limit - Riwayat pembayaran',
      component: lazyScreen(() => import('./screens/progress-limit'), 'ProgressLimitScreen'),
      states: [
        {
          id: 'week-0',
          label: 'Minggu 0 - belum ada pembayaran',
          description: 'Pembayaran belum dimulai',
          apply: applyWeek0,
        },
        {
          id: 'week-1',
          label: 'Minggu 1 - 1x bayar lunas',
          description: 'Individual lancar · Majelis lancar',
          apply: applyWeek1,
        },
        {
          id: 'week-5',
          label: 'Minggu 5 - 5x bayar lunas',
          description: 'Individual lancar · Majelis lancar',
          apply: applyWeek5,
        },
        {
          id: 'week-6',
          label: 'Minggu 6A - 5x lunas, 1x telat',
          description: 'Individual berisiko · Majelis berisiko karena dirinya',
          apply: applyWeek6,
        },
        {
          id: 'week-6b',
          label: 'Minggu 6B - 6x bayar lunas',
          description: 'Individual lancar · Majelis berisiko karena anggota lain',
          apply: applyWeek6b,
        },
        {
          id: 'week-10',
          label: 'Minggu 10A - 5x lunas, 5x telat',
          description: 'Telat bayar minggu 5–10 · Majelis berisiko karena dirinya',
          apply: applyWeek10,
        },
        {
          id: 'week-10b',
          label: 'Minggu 10B - 10x bayar lunas',
          description: 'Individual lancar · Majelis makin berisiko karena anggota lain',
          apply: applyWeek10b,
        },
        {
          id: 'week-11',
          label: 'Minggu 11 - mulai bayar lagi setelah telat',
          description: 'Bayar minggu 5–11 · Status membaik jadi lancar',
          apply: applyWeek11,
        },
        {
          id: 'week-12',
          label: 'Minggu 12 - masih memperbaiki status',
          description: 'Lunas 12 minggu · Tugas Majelis selesai, bonus cair',
          apply: applyWeek12,
        },
        {
          id: 'week-13',
          label: 'Minggu 13 - masih memperbaiki status',
          description: 'Bonus cair, tugas Majelis ke-2 dimulai',
          apply: applyWeek13,
        },
        {
          id: 'week-47',
          label: 'Minggu 47 - riwayat campuran, hampir lunas',
          description: 'Lunas 47 minggu · Semua bonus Majelis sudah cair',
          apply: applyWeek47,
        },
      ],
    },
    {
      id: 'jadwal-pembayaran',
      title: 'Progress Limit - Jadwal Pembayaran',
      component: lazyScreen(() => import('./screens/jadwal-pembayaran'), 'JadwalPembayaranScreen'),
    },
    // Onboarding after disbursement (Figma section 2937:31006) — reached from
    // "Cairkan Sekarang" on Home Var D's Minggu 48 card.
    {
      id: 'pencairan-form',
      title: 'Pencairan - Ajukan',
      component: lazyScreen(() => import('./screens/pencairan-form'), 'PencairanFormScreen'),
    },
    {
      id: 'pencairan-konfirmasi',
      title: 'Pencairan - Konfirmasi',
      component: lazyScreen(() => import('./screens/pencairan-konfirmasi'), 'PencairanKonfirmasiScreen'),
    },
    {
      id: 'pencairan-diproses',
      title: 'Pencairan - Diproses',
      component: lazyScreen(() => import('./screens/pencairan-diproses'), 'PencairanDiprosesScreen'),
    },
    // No longer used — kept for reference.
    // id + title + component is the whole requirement. Two optional extras exist
    // and are OFF by default:
    //   notes    — annotations beside the device on desktop. Add ONLY when the
    //              designer asks. Never write unrequested design rationale.
    //   flowsTo  — descriptive edges for the flow view. Real navigation is
    //              useFlow().go(id) in the component; this just draws the map.
    //              Add it when a diagram helps, skip it otherwise.
    {
      id: 'home',
      title: '[Deprecate] Home',
      component: lazyScreen(() => import('./screens/home'), 'HomeScreen'),
    },
    {
      id: 'home-var-a',
      title: '[Deprecate] Home Var A - Progress bar',
      component: lazyScreen(() => import('./screens/home-var-a'), 'HomeVarAScreen'),
    },
    {
      id: 'home-var-b',
      title: '[Deprecate] Home Var B - Progress checklist',
      component: lazyScreen(() => import('./screens/home-var-b'), 'HomeVarBScreen'),
      // Five payment scenarios, switchable from the state controls beside
      // the device — see lib/store.ts.
      states: [
        {
          id: 'week1',
          label: 'Minggu 1 — baru bayar',
          description: 'Baru bayar minggu pertama · Lancar',
          apply: applyWeek1Paid,
        },
        {
          id: 'week5-lancar',
          label: '5 minggu, semua lancar',
          description: 'Lancar',
          apply: applyFiveWeeksLancar,
        },
        {
          id: 'week8-lancar',
          label: '8 minggu, semua lancar',
          description: 'Lancar',
          apply: applyEightWeeksLancar,
        },
        {
          id: 'week8-partial-78',
          label: '8 minggu, minggu 7–8 partial',
          description: 'Minggu 7 & 8 hanya bayar setengah · Bahaya',
          apply: applyEightWeeksPartial78,
        },
        {
          id: 'week8-empty7-partial8',
          label: '8 minggu, minggu 7 kosong, 8 partial',
          description: 'Minggu 7 tidak bayar, minggu 8 bayar setengah · Bahaya',
          apply: applyEightWeeksEmpty7Partial8,
        },
      ],
    },
    {
      id: 'home-var-c',
      title: '[Deprecate] Home Var C - Stat chip',
      component: lazyScreen(() => import('./screens/home-var-c'), 'HomeVarCScreen'),
    },
  ],
}
