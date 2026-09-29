'use client'

import { useEffect } from 'react'
import { Button } from '@/design-system/components'
import { CheckCircleFill } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ACCOUNT_NAME, BottomAction, Spinner } from '../lib/ui'
import { store } from '../lib/store'

// PRD 4.4 — CIF, account and access creation. The target is real-time, so the
// page waits a moment and lands on success; the user can also leave, and the
// homepage picks the status up from there (PRD A, status widget).
export function ObProcessingScreen() {
  const flow = useFlow()

  useEffect(() => {
    const t = setTimeout(() => flow.go('ob-success'), 3500)
    return () => clearTimeout(t)
  }, [flow])

  return (
    <Screen canvas="white">
      <div className="flex flex-1 flex-col items-center justify-center gap-16 text-center">
        <Spinner />
        <div>
          <p className="text-16 font-bold text-default">{ACCOUNT_NAME} sedang dibuat</p>
          <p className="mt-4 text-14 text-caption">Biasanya hanya beberapa menit.</p>
        </div>
        <ul className="mt-8 flex flex-col gap-8 text-left text-14">
          <li className="flex items-center gap-8 text-default">
            <CheckCircleFill size={20} className="text-green-500" /> Data diri diterima
          </li>
          <li className="flex items-center gap-8 text-default">
            <CheckCircleFill size={20} className="text-green-500" /> Verifikasi wajah berhasil
          </li>
          <li className="flex items-center gap-8 text-caption">
            <span className="h-20 w-20 rounded-full border-2 border-neutral-400" /> Membuat nomor rekening
          </li>
        </ul>
      </div>
      <BottomAction>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            store.set({ account: 'in-progress' })
            flow.go('home')
          }}
        >
          Kembali ke Beranda
        </Button>
      </BottomAction>
    </Screen>
  )
}
