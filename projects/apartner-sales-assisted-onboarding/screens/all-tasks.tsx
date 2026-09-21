'use client'

// Lihat semua — every Sales item in one place, reached from "Sales hari ini".
// Same structure as the board (the shared `SalesList`): the Leads ↔ POI visit
// switch, the four funnel columns, the same cards. The only difference is the
// date scope — this is the `all` scope, so it lists items on every date, not just
// what is due today.

import { SalesList } from '../lib/sales-list'

export function AllTasksScreen() {
  return <SalesList scope="all" />
}
