// Every mitra the BP carries, across every group — the Mitra tab's list.
//
// The Majelis tab answers "who is in this group". This answers "where is Ibu
// Rina", which is the question a directory of groups cannot take: the BP knows
// the name and not the majelis, because the woman phoning her does not open
// with which balai she attends.
//
// PROTOTYPE EDGE: only Majelis Mawar has an authored roster. The other groups
// take their LEDGERS from Mawar's members — so every card carries a real DPD, a
// real product, a real repayment record — but each gets its own name, because a
// list whose whole purpose is search cannot show the same woman five times. A
// duplicate name in a searchable list does not read as a shared fixture; it
// reads as a bug, and it makes the one gesture this screen exists for useless.

import { MAJELIS, type Mitra } from './data'
import { MAJELIS_DIRECTORY, type MajelisEntry } from './schedule'

// One name per mitra in every group except Mawar, which keeps its own — 100 of
// them, matching the member counts in the directory exactly. Sundanese, same as
// the authored roster, because Ciseeng is. Run short and the last group comes
// up empty, which is worse than any of the alternatives: a majelis the filter
// offers and the list cannot show.
const NAMES = [
  'Aminah Solihat', 'Eneng Rohimah', 'Titin Suhartini', 'Rohayah Nurdin',
  'Lina Marlina', 'Enok Rosmiati', 'Wati Sumiati', 'Icih Kurnia',
  'Nining Suryani', 'Elis Herlina', 'Kokom Komariah', 'Ecin Kuraesin',
  'Ida Farida', 'Nani Suryani', 'Emah Maemunah', 'Dewi Sartika',
  'Yeni Nuraeni', 'Erna Wati', 'Siti Juariah', 'Tati Rohaeti',
  'Endah Purwanti', 'Iis Aisyah', 'Rina Herawati', 'Ai Kartika',
  'Uun Unayah', 'Teti Sumiati', 'Nurjanah Saidah', 'Empat Patimah',
  'Cicih Sukaesih', 'Oom Komalasari', 'Lilis Nurhasanah', 'Iyar Siti',
  'Enung Nurhayati', 'Yoyoh Rokayah', 'Atik Rustika', 'Mimi Rohaeni',
  'Tuti Alawiyah', 'Nia Daniati', 'Susi Susanti', 'Wiwi Widaningsih',
  'Rita Zahara', 'Neni Nuraeni', 'Ipah Saripah', 'Dedeh Hasanah',
  'Ella Nurlaela', 'Ooh Rohaeti', 'Enah Suhaenah', 'Titi Rohaeti',
  'Nurlaila Sari', 'Ade Irma', 'Yayah Rokayah', 'Imas Kurniasih',
  'Cucu Rohaeti', 'Popon Kartika', 'Eti Rohaeti', 'Nunung Nurjanah',
  'Sri Wahyuni', 'Lia Amelia', 'Ineu Wulandari', 'Ratna Juwita',
  'Maria Ulfah', 'Halimah Tusadiah', 'Rohimah Saidah', 'Uus Kusmiati',
  'Ani Rohaeni', 'Nurhasanah Dewi', 'Elin Marlina', 'Wina Kartika',
  'Sopiah Nurdin', 'Tarsih Suhaeti', 'Icha Rahmawati', 'Neneng Sri',
  'Rani Anggraeni', 'Fitri Handayani', 'Mia Rosmiati', 'Dini Aryani',
  'Leni Marlina', 'Asih Setiawati', 'Vina Nurhaliza', 'Yuli Astuti',
  'Wiwin Kartini', 'Dedeh Rohaeti', 'Nurhayati Sari', 'Emi Suryani',
  'Ratih Purnama', 'Ipah Latifah', 'Tini Kartini', 'Onah Rohanah',
  'Juju Juariah', 'Nengsih Rohaeti', 'Aan Suryani', 'Ella Karlina',
  'Ita Rosita', 'Yuyu Wahyuni', 'Erni Suhaeti', 'Nurul Hidayah',
  'Ai Sumiati', 'Mimin Rohaeti', 'Tarmi Sumarni', 'Eneng Sopiah',
]

export interface PortfolioMitra {
  mitra: Mitra
  group: MajelisEntry
}

/**
 * The DPD buckets, as ops speaks them. A bucket rather than a day count because
 * this is the grain a filter works at — "show me everyone 8 to 14 days late" is
 * a question; "show me everyone exactly 11 days late" is not.
 */
export const DPD_BUCKETS = ['Lancar', 'DPD 1-7', 'DPD 8-14', 'DPD 15-30', 'DPD 30+'] as const

export type DpdBucket = (typeof DPD_BUCKETS)[number]

export function bucketOf(dpd: number): DpdBucket {
  if (dpd <= 0) return 'Lancar'
  if (dpd <= 7) return 'DPD 1-7'
  if (dpd <= 14) return 'DPD 8-14'
  if (dpd <= 30) return 'DPD 15-30'
  return 'DPD 30+'
}

/**
 * The whole book. Active groups only — a draft has disbursed nothing, so it has
 * members being recruited rather than mitra being managed, and putting them in
 * a list sorted by arrears would file a prospect under "Lancar".
 */
export function portfolio(): PortfolioMitra[] {
  const active = MAJELIS_DIRECTORY.filter((g) => g.status === 'aktif')
  const roster = MAJELIS.members
  const out: PortfolioMitra[] = []
  let nameAt = 0

  active.forEach((group, gi) => {
    // Mawar keeps its real roster whole — those are the women every other
    // screen in this prototype names, and renaming them here would break the
    // one group you can actually walk a pelayanan through.
    if (group.id === MAJELIS.id) {
      roster.forEach((mitra) => out.push({ mitra, group }))
      return
    }

    // The rest borrow a LEDGER and take a new name. The offset per group keeps
    // two groups from carrying the same run of arrears.
    const take = Math.min(group.members, NAMES.length - nameAt)
    for (let i = 0; i < take; i += 1) {
      const source = roster[(gi * 5 + i) % roster.length]
      out.push({
        mitra: { ...source, id: `${group.id}-${source.id}`, name: NAMES[nameAt + i] },
        group,
      })
    }
    nameAt += take
  })

  return out
}

/**
 * The id her own page renders. A portfolio row carries a group-scoped id, and
 * `findMitra` only knows the authored ones, so the prefix comes off on the way
 * through — a borrowed row opens the record it borrowed.
 */
export const sourceMitraId = (id: string): string => (id.includes('-') ? id.split('-')[1] : id)
