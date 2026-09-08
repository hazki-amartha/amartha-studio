// The POI a sosialisasi is run at — the lead-generation end of the pipeline.
//
// Lifted from the BP project's `leads.ts`, which also carried the older
// pre-pipeline lead model. Only the POI record comes across; every prospect
// captured at one of these is a `PipelineLead` and lives in `pipeline.ts`.

/**
 * One lead-generation session. It carries a TARGET because that is how the
 * business sets it — a BP is sent to a village to come back with ten names, and
 * a progress line she can read mid-event is the difference between working the
 * room and discovering at 16.00 that she got four.
 */
export interface SosialisasiEvent {
  id: string
  /** The POI name — the title of the visit ("Warung Bu Ipah"). */
  title: string
  place: string
  target: number
  /** The POI a prospect captured here is sourced from, in the Sales pipeline. */
  poi: string
  /** Street address, shown on the POI brief with a maps pin. */
  address: string
  /** Who to ask for on arrival — empty when the POI is an open space. */
  contact: string
  /** "Sosialisasi Kelompok" / "Open space selling" — the kind of POI. */
  type: string
  /** The BP's own briefing note for working this POI. */
  guide: string
  /** Which illustrated scene stands in for a photo of the POI. */
  art: PoiArt
}

/** The illustrated POI "photos" — one scene drawn per kind of place. */
export type PoiArt = 'warung' | 'pasar-ikan' | 'balai'

export const EVENTS: SosialisasiEvent[] = [
  {
    id: 'e1',
    title: 'Warung Bu Ipah',
    place: 'Jl. Batu Sangkar VII, No.15, Kabupaten Ciseeng, Jawa Barat',
    target: 9,
    poi: 'Warung Bu Ipah, Cibeuteung',
    address: 'Jl. Batu Sangkar VII, No.15, Kabupaten Ciseeng, Jawa Barat',
    contact: 'Ibu Ipah',
    type: 'Sosialisasi Kelompok',
    guide: 'Bu Ipah (pemilik warung) memiliki 8 orang teman yang juga tertarik untuk mengambil pinjaman Amartha.',
    art: 'warung',
  },
  {
    id: 'e2',
    title: 'Pasar Ikan Ciseeng',
    place: 'Jl. Burung Perkutut XI, No.41, Kabupaten Ciseeng, Jawa Barat',
    target: 20,
    poi: 'Pasar Ikan Ciseeng',
    address: 'Jl. Burung Perkutut XI, No.41, Kabupaten Ciseeng, Jawa Barat',
    contact: '',
    type: 'Open space selling',
    guide: 'Pasar ikan ini lumayan ramai, ada lebih dari 50 pedagang ikan, mayoritas perempuan. Targetkan pedagang-pedagang yang ada di sana. Beberapa orang sudah punya pinjaman dari Mekaar, tawarkan kemungkinan limit lebih tinggi dari Amartha.',
    art: 'pasar-ikan',
  },
  // Last week's, in Putat Nutug. Nothing opens it — it exists so the seeded
  // leads have somewhere to have come from, which is what makes today's
  // follow-up task a continuation rather than an orphan.
  {
    id: 'e0',
    title: 'Sosialisasi Putat Nutug',
    place: 'Balai RW 02, Putat Nutug',
    target: 10,
    poi: 'Balai RW 02, Putat Nutug',
    address: 'Balai RW 02, Putat Nutug',
    contact: '',
    type: 'Sosialisasi Kelompok',
    guide: '',
    art: 'balai',
  },
]

export const findEvent = (id: string): SosialisasiEvent =>
  EVENTS.find((e) => e.id === id) ?? EVENTS[0]

