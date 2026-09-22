// The FO-assisted pengajuan, as the three parts the BP works through: her
// feedback, the mitra's feasibility survey, and the majelis ritual explanation.
// Shared so the application screen renders them and the follow-up screen can
// report progress ("Assisted application started · 1/3 bagian").

export interface AppSection {
  id: string
  label: string
  hint: string
}

export const APPLICATION_SECTIONS: AppSection[] = [
  { id: 'feedback', label: 'BP Feedback', hint: 'Isi feedback BP' },
  { id: 'kelayakan', label: 'Survey Uji Kelayakan', hint: 'Lengkapi survey uji kelayakan calon mitra' },
  { id: 'ritual', label: 'Ritual explanation', hint: 'Jelaskan ritual majelis' },
]
