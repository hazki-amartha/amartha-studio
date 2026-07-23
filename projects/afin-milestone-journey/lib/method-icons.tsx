// Which icon stands for which payment method. Kept out of data.ts so that file
// stays plain data, and out of the screens so the method list and the four
// instruction screens can't drift apart on what a VA or an agen looks like.

import type { ReactNode } from 'react'
import {
  Bank,
  Hourglass,
  MapPin,
  PaperPlaneTilt,
  Storefront,
  Wallet,
  type IconSize,
} from '@/design-system/icons'
import type { MethodId } from './data'

/** The agen is a person you hand cash to, so it takes the map pin, not a logo. */
export function IconAgent(props: { size?: IconSize }) {
  return <MapPin {...props} />
}

export function methodIcon(id: MethodId, size: IconSize = 20): ReactNode {
  switch (id) {
    case 'poket':
      return <Wallet size={size} />
    case 'va-bca':
    case 'va-mandiri':
      return <Bank size={size} />
    case 'transfer':
      return <PaperPlaneTilt size={size} />
    case 'indomaret':
      return <Storefront size={size} />
    case 'amartha-link':
      return <MapPin size={size} />
    default:
      return <Hourglass size={size} />
  }
}
