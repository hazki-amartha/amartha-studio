// The FO-assisted pengajuan, grouped into the three parts the BP works through:
// her feedback, the mitra's survey, and the majelis ritual explanation. Shared so
// the application screen renders the groups and the follow-up screen can report
// progress ("Assisted application started · 3/9 bagian").

export interface AppSection {
  id: string
  label: string
  hint: string
}

export interface AppGroup {
  id: string
  title: string
  sections: AppSection[]
}

export const APPLICATION_GROUPS: AppGroup[] = [
  {
    id: 'bp-feedback',
    title: 'BP Feedback',
    sections: [{ id: 'feedback', label: 'BP Feedback', hint: 'Isi feedback BP' }],
  },
  {
    id: 'mitra-survey',
    title: 'Mitra survey',
    sections: [
      { id: 'produk', label: 'Produk', hint: 'Pilih GL atau Modal' },
      { id: 'pribadi', label: 'Data pribadi', hint: 'Lengkapi data' },
      { id: 'bank', label: 'Data bank dan usaha', hint: 'Lengkapi data' },
      { id: 'penanggung', label: 'Data penanggung jawab', hint: 'Lengkapi data' },
      { id: 'keluarga', label: 'Data keluarga', hint: 'Lengkapi data' },
      { id: 'foto-rumah', label: 'Foto rumah tinggal', hint: 'Lengkapi data' },
      { id: 'foto-usaha', label: 'Foto tempat usaha', hint: 'Lengkapi data' },
    ],
  },
  {
    id: 'ritual',
    title: 'Ritual explanation',
    sections: [{ id: 'ritual', label: 'Ritual explanation', hint: 'Jelaskan ritual majelis' }],
  },
]

/** Every section flattened — for the done-count and the submit gate. */
export const APPLICATION_SECTIONS: AppSection[] = APPLICATION_GROUPS.flatMap((g) => g.sections)
