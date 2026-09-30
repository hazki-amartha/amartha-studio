'use client'

import { useEffect } from 'react'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { Spinner } from '../lib/ui'
import { store } from '../lib/store'

// The liveness result plus the Dukcapil match (PRD 2.3 + 2.4). What comes back
// is whatever the presenter set with the states beside the device.
export function ObLivenessCheckingScreen() {
  const flow = useFlow()

  useEffect(() => {
    const t = setTimeout(() => {
      const result = store.get().liveness
      flow.go(
        result === 'pass'
          ? store.get().journey === 'bind'
            ? 'bind-success'
            : 'ob-occupation'
           : result === 'fail' ? 'ob-liveness-failed' : 'ob-liveness-locked',
      )
    }, 2000)
    return () => clearTimeout(t)
  }, [flow])

  return (
    <Screen canvas="white">
      <div className="flex flex-1 flex-col items-center justify-center gap-16 text-center">
        <Spinner />
        <div>
          <p className="text-16 font-bold text-default">Memeriksa wajah Anda…</p>
          <p className="mt-4 text-14 text-caption">Kami cocokkan dengan data Dukcapil. Jangan tutup aplikasi.</p>
        </div>
      </div>
    </Screen>
  )
}
