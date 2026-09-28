'use client'

// Log in — ID Karyawan, where log out lands (BP APP 2026 Figma).

import { useState } from 'react'
import { Button, Input } from '@/design-system/components'
import { IdentificationCard } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'

export function LoginScreen() {
  const flow = useFlow()
  const [id, setId] = useState('12345')

  return (
    <Screen canvas="white">
      <span className="flex h-40 w-40 items-center justify-center rounded-8 bg-primary-50 text-primary-500">
        <IdentificationCard size={24} />
      </span>
      <div className="flex flex-col gap-4">
        <span className="text-20 font-bold text-default">ID Karyawan</span>
        <span className="text-12 text-caption">Pastikan ID karyawan yang dimasukkan benar</span>
      </div>
      <Input label="ID Karyawan" value={id} onChange={(e) => setId(e.target.value)} />
      <span className="text-12 text-default">
        Ada kendala? <span className="text-link underline">Hubungi Tim Support</span>
      </span>

      <div className="mt-auto flex flex-col gap-12 pb-16">
        <span className="text-12 text-default">
          Dengan login, saya menyatakan telah membaca dan menyetujui seluruh{' '}
          <span className="text-link underline">Syarat &amp; Ketentuan</span>.
        </span>
        <Button size="lg" className="w-full" disabled={!id.trim()} onClick={() => flow.go('home')}>
          Lanjut
        </Button>
      </div>
    </Screen>
  )
}
