'use client'

// Confirmation sheet before the final submit (reference: image 8). The
// BottomSheet's own dark scrim gives the overlay look.

import { Button, BottomSheet } from '@/design-system/components'
import { IdentificationCard, Warning } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'

export function ModalConfirmScreen() {
  const flow = useFlow()
  return (
    <BottomSheet
      open
      onClose={() => flow.back()}
      slotPosition="above"
      slot={
        <div className="flex items-center justify-center gap-8 py-8">
          <IdentificationCard size={24} className="text-primary-500" />
          <Warning size={24} className="text-orange-500" />
        </div>
      }
      title="Kirim pengajuan sekarang?"
      description="Data tidak bisa diubah lagi dan batas pinjaman akan diberikan sesuai data yang Anda kirim."
      secondaryAction={
        <Button variant="outline" size="lg" onClick={() => flow.back()}>
          Kembali
        </Button>
      }
      primaryAction={
        <Button variant="primary" size="lg" onClick={() => flow.go('modal-sending')}>
          Ya, Kirim
        </Button>
      }
    />
  )
}
