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
  applyWeek10,
  applyWeek11,
  applyWeek12,
  applyWeek13,
  applyWeek47,
  applyWeek48,
} from './lib/store'

export const project: ProjectModule = {
  config,
  screens: [
    // id + title + component is the whole requirement. Two optional extras exist
    // and are OFF by default:
    //   notes    — annotations beside the device on desktop. Add ONLY when the
    //              designer asks. Never write unrequested design rationale.
    //   flowsTo  — descriptive edges for the flow view. Real navigation is
    //              useFlow().go(id) in the component; this just draws the map.
    //              Add it when a diagram helps, skip it otherwise.
    {
      id: 'home',
      title: 'Home',
      component: lazyScreen(() => import('./screens/home'), 'HomeScreen'),
      entry: true, // exactly ONE screen per project sets entry: true
    },
    {
      id: 'home-var-a',
      title: 'Home Var A - Progress bar',
      component: lazyScreen(() => import('./screens/home-var-a'), 'HomeVarAScreen'),
    },
    {
      id: 'home-var-b',
      title: 'Home Var B - Progress checklist',
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
      title: 'Home Var C - Stat chip',
      component: lazyScreen(() => import('./screens/home-var-c'), 'HomeVarCScreen'),
    },
    {
      id: 'home-var-d',
      title: 'Home Var D - Payment History',
      component: lazyScreen(() => import('./screens/home-var-d'), 'HomeVarDScreen'),
      // Ten loan-week milestones (Figma section 2918:10990), switchable from
      // the state controls beside the device — see lib/store.ts.
      states: [
        {
          id: 'week-0',
          label: 'Minggu 0 — baru cair',
          description: 'Pembayaran belum dimulai',
          apply: applyWeek0,
        },
        {
          id: 'week-1',
          label: 'Minggu 1',
          description: 'Individual lancar · Majelis lancar',
          apply: applyWeek1,
        },
        {
          id: 'week-5',
          label: 'Minggu 5',
          description: 'Individual lancar · Majelis lancar',
          apply: applyWeek5,
        },
        {
          id: 'week-6',
          label: 'Minggu 6',
          description: 'Individual lancar · Majelis berisiko',
          apply: applyWeek6,
        },
        {
          id: 'week-10',
          label: 'Minggu 10',
          description: 'Telat bayar minggu 5–10 · Individual bermasalah',
          apply: applyWeek10,
        },
        {
          id: 'week-11',
          label: 'Minggu 11',
          description: 'Bayar minggu 5–11 · Status membaik jadi lancar',
          apply: applyWeek11,
        },
        {
          id: 'week-12',
          label: 'Minggu 12',
          description: 'Lunas 12 minggu · Tugas Majelis selesai, bonus cair',
          apply: applyWeek12,
        },
        {
          id: 'week-13',
          label: 'Minggu 13',
          description: 'Bonus cair, tugas Majelis ke-2 dimulai',
          apply: applyWeek13,
        },
        {
          id: 'week-47',
          label: 'Minggu 47',
          description: 'Lunas 47 minggu · Semua bonus Majelis sudah cair',
          apply: applyWeek47,
        },
        {
          id: 'week-48',
          label: 'Minggu 48',
          description: 'Lunas semua · Limit berhasil naik',
          apply: applyWeek48,
        },
      ],
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
  ],
}
