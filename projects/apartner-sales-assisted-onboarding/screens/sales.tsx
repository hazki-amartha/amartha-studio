'use client'

// Sales hari ini — the entry board. The whole list (Leads ↔ POI visit switch,
// the four funnel columns, the cards) lives in the shared `SalesList`; this
// screen is the "today" scope of it — what is due now. "Lihat semua" opens the
// same list at the `all` scope (every date).

import { SalesList } from '../lib/sales-list'

export function SalesScreen() {
  return <SalesList scope="today" />
}
