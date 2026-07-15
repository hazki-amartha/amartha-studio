// Project module — exports config + the screens array.

import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { GoalScreen } from './screens/goal'
import { AmountScreen } from './screens/amount'
import { MethodScreen } from './screens/method'
import { ReviewScreen } from './screens/review'
import { SuccessScreen } from './screens/success'
import { ReceiptScreen } from './screens/receipt'
import { FailedScreen } from './screens/failed'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'goal',
      title: 'Pilih Celengan',
      component: GoalScreen,
      entry: true,
      notes: [
        'Entry screen — the savings goal picker.',
        'SelectableCard radio group; the choice persists in lib/store.ts and follows the user through the flow.',
      ],
      flowsTo: [{ to: 'amount', label: 'lanjutkan' }],
    },
    {
      id: 'amount',
      title: 'Nominal',
      component: AmountScreen,
      notes: [
        'Numeric entry with Rp prefix; quick-amount pills fill the input.',
        'Continue stays disabled below the Rp10.000 minimum; the input flips to its error state.',
        'Back opens a "Batalkan top up?" Modal (dialog variant, warning intent) — confirming resets the store and returns to the goal picker.',
      ],
      flowsTo: [
        { to: 'method', label: 'lanjutkan' },
        { to: 'goal', label: 'batalkan (modal)' },
      ],
    },
    {
      id: 'method',
      title: 'Metode Pembayaran',
      component: MethodScreen,
      notes: [
        'One selectable payment method. Badges mark availability — "Instan" (green) and "Gangguan" (red).',
        'Picking the disrupted BNI VA is what routes the confirmation to the failed state.',
      ],
      flowsTo: [{ to: 'review', label: 'lanjutkan' }],
    },
    {
      id: 'review',
      title: 'Ringkasan',
      component: ReviewScreen,
      notes: [
        'Summary rows use Card flush + ListRow, with a status Badge.',
        'The confirmation step is a BottomSheet with a summary slot below the text.',
        'Confirming branches: disrupted method → failed, otherwise → success.',
      ],
      flowsTo: [
        { to: 'success', label: 'konfirmasi (bottom sheet)' },
        { to: 'failed', label: 'metode gangguan' },
      ],
    },
    {
      id: 'success',
      title: 'Berhasil',
      component: SuccessScreen,
      notes: ['Success state with a green Badge and the updated celengan balance.'],
      flowsTo: [
        { to: 'receipt', label: 'lihat bukti' },
        { to: 'goal', label: 'selesai' },
      ],
    },
    {
      id: 'receipt',
      title: 'Bukti Transaksi',
      component: ReceiptScreen,
      notes: ['Transaction detail / receipt. Back returns to success via useFlow().back().'],
      flowsTo: [{ to: 'success', label: 'kembali' }],
    },
    {
      id: 'failed',
      title: 'Gagal',
      component: FailedScreen,
      notes: [
        'Payment-failed state reached when the disrupted method is used.',
        'Offers both retry paths: change method, or retry the same review.',
      ],
      flowsTo: [
        { to: 'method', label: 'ganti metode' },
        { to: 'review', label: 'coba lagi' },
      ],
    },
  ],
}
