'use client'

import { useEffect } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'

// Passive liveness: no shutter. The camera captures on its own once the face
// has been held still inside the oval, then hands over to the check.
export function ObLivenessCameraScreen() {
  const flow = useFlow()

  useEffect(() => {
    const t = setTimeout(() => flow.go('ob-liveness-checking'), 3000)
    return () => clearTimeout(t)
  }, [flow])

  return (
    <Screen
      statusBar="none"
      chromeClassName="bg-neutral-900"
      topBar={<NavigationHeader variant="dark" title="" onBack={flow.back} />}
    >
      <div className="-mx-16 -mt-16 flex flex-1 flex-col items-center bg-neutral-900 px-16">
        <p className="pt-24 text-center text-14 text-neutral-white">Posisikan wajah di dalam oval.</p>
        <div className="mt-32 flex h-288 w-216 items-end justify-center overflow-hidden rounded-full border-4 border-dashed border-neutral-white bg-neutral-700">
          <span className="mb-8 h-120 w-120 rounded-full bg-neutral-500" />
        </div>
        <div className="mt-32 flex items-center gap-8 rounded-full bg-neutral-white/10 px-16 py-8 text-14 font-bold text-neutral-white">
          <span className="h-8 w-8 animate-pulse rounded-full bg-green-400" />
          Tahan posisi, jangan berkedip…
        </div>
      </div>
    </Screen>
  )
}
