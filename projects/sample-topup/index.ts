import type { ProjectModule } from '@/platform/types'
import { config } from './project.config'
import { AmountScreen } from './screens/amount'
import { ConfirmScreen } from './screens/confirm'

export const project: ProjectModule = {
  config,
  screens: [
    {
      id: 'amount',
      title: 'Amount',
      component: AmountScreen,
      entry: true,
      notes: ['Quick amounts pre-fill the input.', 'Continue is disabled until an amount is set.'],
      flowsTo: [{ to: 'confirm', label: 'continue' }],
    },
    {
      id: 'confirm',
      title: 'Confirm',
      component: ConfirmScreen,
      notes: ['Summary rows use Card flush + ListRow.'],
      flowsTo: [{ to: 'amount', label: 'back / confirm' }],
    },
  ],
}
