// Past home visits to a mitra — the effort already spent on her door, shown on
// Kunjungi (the latest one) and in full on "Tugas Home Visit". Mock data, per
// the BP APP 2026 Figma: a handful of visits for Wati, none for anyone else, so
// the block only appears when there is a history to show.

export interface PastHomeVisit {
  /** Home Visit ke-N. */
  no: number
  date: string
  officer: string
  /** Who was met at the door. */
  met: string
  paid: number
  reason: string
  /** "Selasa, 21 Juli (Rp250.000)", or "Tidak ada janji". */
  ptp: string
}

const HISTORY: Record<string, PastHomeVisit[]> = {
  h1: [
    {
      no: 4,
      date: '19 Juli 2026',
      officer: 'Dewi Kurnianingsih',
      met: 'Penanggung jawab',
      paid: 0,
      reason: 'Penanggung jawab kena PHK',
      ptp: 'Selasa, 21 Juli (Rp250.000)',
    },
    {
      no: 3,
      date: '16 Juli 2026',
      officer: 'Dewi Kurnianingsih',
      met: 'Penanggung jawab',
      paid: 0,
      reason: 'Usaha sedang sepi',
      ptp: 'Tidak ada janji',
    },
    {
      no: 2,
      date: '10 Juli 2026',
      officer: 'Dewi Kurnianingsih',
      met: 'Mitra',
      paid: 50000,
      reason: 'Usaha sedang sepi',
      ptp: 'Selasa, 16 Juli (Rp250.000)',
    },
    {
      no: 1,
      date: '3 Juli 2026',
      officer: 'Dewi Kurnianingsih',
      met: 'Mitra',
      paid: 0,
      reason: 'Usaha sedang sepi',
      ptp: 'Selasa, 10 Juli (Rp250.000)',
    },
  ],
}

/** Newest first. Empty for a mitra with no earlier home visit. */
export function pastHomeVisits(mitraId: string): PastHomeVisit[] {
  return HISTORY[mitraId] ?? []
}
