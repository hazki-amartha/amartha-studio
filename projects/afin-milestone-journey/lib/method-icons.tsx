// Which icon stands for which payment method. Kept out of data.ts so that file
// stays plain data, and out of the screens so the method list and the four
// instruction screens can't drift apart on what a VA or an agen looks like.

import type { ReactNode } from 'react'
import {
  IconBank,
  IconClock,
  IconPin,
  IconSend,
  IconStore,
  IconWallet,
  type IconSize,
} from './icons'
import type { MethodId } from './data'

/** The agen is a person you hand cash to, so it takes the map pin, not a logo. */
export function IconAgent(props: { size?: IconSize }) {
  return <IconPin {...props} />
}

export function methodIcon(id: MethodId, size: IconSize = 20): ReactNode {
  switch (id) {
    case 'poket':
      return <IconWallet size={size} />
    case 'va-bca':
    case 'va-mandiri':
      return <IconBank size={size} />
    case 'transfer':
      return <IconSend size={size} />
    case 'indomaret':
      return <IconStore size={size} />
    case 'amartha-link':
      return <IconPin size={size} />
    default:
      return <IconClock size={size} />
  }
}
