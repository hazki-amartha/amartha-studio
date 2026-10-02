// The day's achievement ("capaian") — the categories shown on the "Lihat capaian
// hari ini" page. Each is a count (some against a target) that expands to the
// leads behind it; every item links to that lead's record. Short demo lists per
// §3, pointing at real seed leads so the links navigate.

export interface ActivityItem {
  /** Seed lead id — tapping the item opens this lead; its source is read from it. */
  leadId: string
  name: string
}

export interface ActivityCategory {
  key: string
  label: string
  /** The day's target for this category, if it has one. */
  target?: number
  items: ActivityItem[]
}

export const TODAY_ACTIVITY: ActivityCategory[] = [
  {
    key: 'prospek',
    label: 'Prospek baru ditambahkan',
    target: 10,
    items: [
      { leadId: 'p4', name: 'Nia Kurniasih' },
      { leadId: 'p1', name: 'Dewi Anggraeni' },
      { leadId: 'p2', name: 'Sri Mulyani' },
    ],
  },
  {
    key: 'followup',
    label: 'Follow-up dikerjakan',
    target: 7,
    items: [
      { leadId: 'p5', name: 'Yuyun Wahyuni' },
      { leadId: 'p2', name: 'Sri Mulyani' },
      { leadId: 'p3', name: 'Halimah' },
    ],
  },
  {
    key: 'onboarding',
    label: 'Onboarding disubmit',
    items: [
      { leadId: 'p6', name: 'Euis Komariah' },
      { leadId: 'pipah', name: 'Ibu Ipah' },
    ],
  },
  {
    key: 'disbursement',
    label: 'Disbursement diajukan',
    items: [
      { leadId: 'p7', name: 'Rohaya' },
      { leadId: 'p20', name: 'Wulan Sari' },
    ],
  },
]
