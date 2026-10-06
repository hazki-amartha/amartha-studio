'use client'

// Loading sheet while the application is submitted (reference: image 9).
// Auto-advances to the success screen.

import { useEffect } from 'react'
import { BottomSheet } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'

export function ModalSendingScreen() {
  const flow = useFlow()
  useEffect(() => {
    const t = setTimeout(() => flow.go('modal-sent'), 1600)
    return () => clearTimeout(t)
  }, [flow])

  return (
    <BottomSheet
      open
      hideClose
      onClose={() => {}}
      slotPosition="above"
      slot={
        <div className="flex flex-col items-center gap-16 py-16">
          <div className="flex gap-8">
            <span className="h-8 w-8 rounded-full bg-primary-500" />
            <span className="h-8 w-8 rounded-full bg-primary-200" />
            <span className="h-8 w-8 rounded-full bg-primary-200" />
          </div>
          <p className="text-14 text-caption">Mengirim pengajuan Anda...</p>
        </div>
      }
    />
  )
}
