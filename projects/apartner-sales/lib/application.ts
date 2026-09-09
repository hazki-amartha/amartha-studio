// The eight sections of an FO-assisted pengajuan, in the order the form asks for
// them. Shared so the application screen renders them and the follow-up screen
// can report progress ("Assisted application started · 3/8 bagian").

export interface AppSection {
  id: string
  label: string
  hint: string
}

export const APPLICATION_SECTIONS: AppSection[] = [
  { id: 'majelis', label: 'Majelis', hint: 'Pilih majelis' },
  { id: 'produk', label: 'Produk', hint: 'Pilih GL atau Modal' },
  { id: 'pribadi', label: 'Data pribadi', hint: 'Lengkapi data' },
  { id: 'bank', label: 'Data bank dan usaha', hint: 'Lengkapi data' },
  { id: 'penanggung', label: 'Data penanggung jawab', hint: 'Lengkapi data' },
  { id: 'keluarga', label: 'Data keluarga', hint: 'Lengkapi data' },
  { id: 'foto-rumah', label: 'Foto rumah tinggal', hint: 'Lengkapi data' },
  { id: 'foto-usaha', label: 'Foto tempat usaha', hint: 'Lengkapi data' },
]
