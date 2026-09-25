// The dashboard correction behind the two `bukti` re-send tasks (see the
// `bukti` kind in schedule.ts and `showBukti` in store.ts).
//
// Both drafts follow the app's current "Tugas selesai → bagikan ringkasan"
// writing structure — the full recap the BP shares after a visit — with the ONE
// figure ops changed on the internal dashboard marked: the old value carried
// beside the new so the re-send reads as a correction, not a second receipt that
// silently disagrees with the first. `was` sits on exactly the line that moved.

export interface RekapRow {
  name: string
  hadir: boolean
  amount: number
  /** Set only on the corrected line — the figure sent before the change. */
  was?: number
  /** On a "Belum bayar" row only — the date she promised. */
  promise?: string
}

/** Majelis level: the group recap that goes back to the whole kumpulan. */
export const BUKTI_REKAP = {
  group: 'Majelis Mawar',
  date: 'Selasa, 21 Juli 2026',
  petugas: 'Rina Marlina',
  branchPhone: '081212345678',
  taskId: 'MV-88213-0727',
  totalPaid: 1_425_000,
  totalOutstanding: 1_100_000,
  mitraBayar: '9 dari 16 mitra',
  mitraHadir: '8 dari 16 mitra',
  members: 16,
  // The one figure ops corrected — named up top so the callout doesn't have to
  // go hunting for the `was` line.
  change: { subject: 'Ibu Imas Masitoh', was: 150_000, now: 200_000 },
  // Cash handed to the BP. Ibu Imas Masitoh is the line ops corrected.
  tunai: {
    total: 900_000,
    rows: [
      { name: 'Nurhayati', hadir: true, amount: 125_000 },
      { name: 'Tuti Herawati', hadir: true, amount: 150_000 },
      { name: 'Wiwin Winarti', hadir: true, amount: 175_000 },
      { name: 'Imas Masitoh', hadir: true, amount: 200_000, was: 150_000 },
      { name: 'Euis Kurniasih', hadir: true, amount: 125_000 },
      { name: 'Cucu Sumiati', hadir: false, amount: 125_000 },
    ] as RekapRow[],
  },
  // Paid herself through Poket, before the BP arrived.
  poket: {
    total: 525_000,
    rows: [
      { name: 'Lilis Suryani', hadir: true, amount: 150_000 },
      { name: 'Ratna Dewi', hadir: true, amount: 175_000 },
      { name: 'Mimin Mintarsih', hadir: false, amount: 200_000 },
    ] as RekapRow[],
  },
  belum: [
    { name: 'Sari Handayani', hadir: true, amount: 125_000, promise: '21 Juli' },
    { name: 'Rina Marlina', hadir: false, amount: 150_000, promise: '22 Juli' },
    { name: 'Ani Suryani', hadir: false, amount: 175_000 },
    { name: 'Dewi Lestari', hadir: false, amount: 200_000 },
    { name: 'Siti Aminah', hadir: false, amount: 125_000 },
    { name: 'Yanti Rohayati', hadir: false, amount: 150_000 },
    { name: 'Eni Nuraeni', hadir: false, amount: 175_000 },
  ] as RekapRow[],
}

/** Mitra / home-visit level: the receipt that goes to one borrower. */
export const BUKTI_BAYAR = {
  mitra: 'Wati Nurhasanah',
  product: 'Modal',
  phone: '0812-3456-7890',
  petugas: 'Rina Marlina',
  date: 'Selasa, 21 Juli 2026',
  branchPhone: '081212345678',
  taskId: 'MV-88213-0727',
  amount: 500_000,
  was: 350_000,
  partial: true,
  sisa: 1_000_000,
}
