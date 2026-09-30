'use client'

// Unlinking (PRD B). The account itself stays open at the bank — only its
// link to AmarthaFin goes — so the page says exactly what changes.

import { useState } from 'react'
import { BottomSheet, Button, Card, NavigationHeader } from '@/design-system/components'
import { LinkBreak, WarningCircle } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { BottomAction, PageTitle, RuleList } from '../lib/ui'
import { PinSheet } from '../lib/pin-sheet'

export function UnbindScreen() {
  const flow = useFlow()
  const [confirm, setConfirm] = useState(false)
  const [pin, setPin] = useState(false)

  return (
    <Screen canvas="white" topBar={<NavigationHeader title="Putuskan Rekening" onBack={flow.back} />}>
      <div className="flex justify-center pt-8">
        <span className="flex h-64 w-64 items-center justify-center rounded-full bg-red-50 text-red-500">
          <LinkBreak size={24} />
        </span>
      </div>
      <PageTitle
        title="Putuskan rekening dari AmarthaFin?"
        description="Rekening Anda tetap aktif di bank. Hanya hubungannya dengan AmarthaFin yang diputus."
      />
      <Card className="border border-default">
        <p className="mb-12 text-14 font-bold text-default">Setelah diputus</p>
        <RuleList
          rules={[
            'Saldo rekening tidak lagi tampil di beranda. Saldo Poket tetap.',
            'Pembayaran di AmarthaFin hanya bisa memakai Poket.',
            'Pencairan pinjaman kembali ke rekening bank yang Anda daftarkan sebelumnya.',
          ]}
        />
      </Card>
      <div className="flex items-start gap-8 rounded-12 bg-orange-50 p-12 text-12 text-default">
        <WarningCircle size={20} className="shrink-0 text-orange-500" />
        Tidak bisa diputus selama ada pinjaman aktif yang dicairkan atau ditagih lewat rekening ini.
      </div>
      <BottomAction>
        <Button variant="danger" size="lg" className="w-full" onClick={() => setConfirm(true)}>
          Putuskan Rekening
        </Button>
      </BottomAction>

      <BottomSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Yakin ingin memutuskan?"
        description="Anda bisa menghubungkannya lagi kapan saja."
        primaryAction={
          <Button
            variant="danger"
            size="lg"
            className="w-full"
            onClick={() => {
              setConfirm(false)
              setPin(true)
            }}
          >
            Ya, Putuskan
          </Button>
        }
        secondaryAction={
          <Button variant="ghost" size="lg" className="w-full" onClick={() => setConfirm(false)}>
            Batal
          </Button>
        }
      />
      <PinSheet open={pin} onClose={() => setPin(false)} onSuccess={() => flow.go('unbind-success')} />
    </Screen>
  )
}
