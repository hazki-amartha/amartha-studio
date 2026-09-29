'use client'

import { useState } from 'react'
import { BottomSheet, Button, Input, ListRow, NavigationHeader } from '@/design-system/components'
import { Check, ChevronDown } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle, StepHeader } from '../lib/ui'

// PRD 3.1 + 3.4 — occupation and financial data on one page. The negative-list
// screening and risk profile (3.2, 3.3) run behind it and have no UI.
const FIELDS = [
  { key: 'pekerjaan', label: 'Pekerjaan', options: ['Wiraswasta / Pedagang', 'Petani / Peternak', 'Karyawan', 'Ibu Rumah Tangga', 'Lainnya'] },
  { key: 'penghasilan', label: 'Penghasilan per bulan', options: ['Di bawah Rp3 juta', 'Rp3 – 5 juta', 'Rp5 – 10 juta', 'Di atas Rp10 juta'] },
  { key: 'sumber', label: 'Sumber dana', options: ['Hasil usaha', 'Gaji', 'Kiriman keluarga', 'Lainnya'] },
  { key: 'tujuan', label: 'Tujuan buka rekening', options: ['Terima pencairan pinjaman', 'Menabung', 'Transaksi usaha', 'Lainnya'] },
] as const

type Key = (typeof FIELDS)[number]['key']

export function ObOccupationScreen() {
  const flow = useFlow()
  const [values, setValues] = useState<Partial<Record<Key, string>>>({
    pekerjaan: 'Wiraswasta / Pedagang',
  })
  const [open, setOpen] = useState<Key | null>(null)
  const field = FIELDS.find((f) => f.key === open)

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Buka Rekening" onBack={flow.back} />}>
      <StepHeader stage={3} />
      <PageTitle title="Ceritakan pekerjaan Anda" description="Wajib diisi sesuai aturan perbankan." />
      {FIELDS.map((f) => (
        <Input
          key={f.key}
          label={f.label}
          readOnly
          value={values[f.key] ?? ''}
          placeholder={`Pilih ${f.label.toLowerCase()}`}
          suffix={<ChevronDown size={16} />}
          onClick={() => setOpen(f.key)}
        />
      ))}
      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('ob-address')}>
          Lanjut
        </Button>
      </BottomAction>

      <BottomSheet open={open !== null} onClose={() => setOpen(null)} title={field?.label}>
        <div className="flex flex-col">
          {field?.options.map((o) => (
            <ListRow
              key={o}
              title={o}
              trailing={values[field.key] === o ? <Check size={20} className="text-primary-500" /> : undefined}
              onClick={() => {
                setValues((v) => ({ ...v, [field.key]: o }))
                setOpen(null)
              }}
            />
          ))}
        </div>
      </BottomSheet>
    </Screen>
  )
}
