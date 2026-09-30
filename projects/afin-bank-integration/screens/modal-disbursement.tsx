'use client'

// The Modal disbursement page ("Dana akan dicairkan ke rekening") with the new
// entry point: the account becomes the recommended destination, and a user
// without one is offered it here, where a failed disbursement would hurt most.

import { useState } from 'react'
import { Badge, Button, Card, NavigationHeader, SelectableCard } from '@/design-system/components'
import { ProductLogo } from '@/design-system/assets'
import { Bank, CheckCircleFill, WarningCircle } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ACCOUNT_NAME, BottomAction, DataRow } from '../lib/ui'
import { useBankState } from '../lib/store'

export function ModalDisbursementScreen() {
  const flow = useFlow()
  const { account } = useBankState()
  const hasAccount = account === 'active'
  const [dest, setDest] = useState<'rekening' | 'lain'>(hasAccount ? 'rekening' : 'lain')

  return (
    <Screen topBar={<NavigationHeader title="Pencairan Modal" onBack={flow.back} />}>
      <Card>
        <div className="flex items-center gap-12">
          <ProductLogo name="modal" />
          <div>
            <p className="text-14 font-bold text-default">Modal Usaha</p>
            <p className="text-12 text-caption">Pinjaman disetujui</p>
          </div>
        </div>
        <div className="mt-8">
          <DataRow label="Jumlah dicairkan" value="Rp5.000.000" />
          <DataRow label="Tenor" value="50 minggu" />
        </div>
      </Card>

      <p className="text-14 font-bold text-default">Dana akan dicairkan ke rekening</p>

      {hasAccount ? (
        <SelectableCard
          name="dest"
          title={ACCOUNT_NAME}
          description="5010 2233 4455 · a.n. Widyasari"
          prefixIcon={<Bank size={20} className="text-primary-500" />}
          secondary={
            <Badge intent="green" size="sm">
              Direkomendasikan
            </Badge>
          }
          checked={dest === 'rekening'}
          onChange={() => setDest('rekening')}
        />
      ) : (
        <div className="rounded-16 bg-gradient-to-br from-primary-400 to-primary-700 p-12 text-neutral-white">
          <div className="flex items-center gap-8">
            <Bank size={20} />
            <p className="text-14 font-bold">Cair pasti masuk dengan {ACCOUNT_NAME}</p>
          </div>
          <p className="mt-4 text-12 text-primary-50">
            Buka gratis dalam 5 menit, langsung dari AmarthaFin. Tidak ada lagi pencairan gagal karena rekening
            tidak aktif.
          </p>
          <div className="mt-12">
            <Button variant="secondary" size="sm" className="w-full" onClick={() => flow.go('ob-intro')}>
              Buka Rekening
            </Button>
          </div>
        </div>
      )}

      <SelectableCard
        name="dest"
        title="BRI · 0123 0100 5678 505"
        description="a.n. Widyasari"
        prefixIcon={<Bank size={20} className="text-caption" />}
        checked={dest === 'lain'}
        onChange={() => setDest('lain')}
      />

      {dest === 'lain' ? (
        <div className="flex items-start gap-8 rounded-12 bg-orange-50 p-12 text-12 text-default">
          <WarningCircle size={20} className="shrink-0 text-orange-500" />
          Pastikan rekening ini masih aktif. Pencairan ke rekening tidak aktif bisa tertunda hingga 3 hari kerja.
        </div>
      ) : (
        <div className="flex items-start gap-8 rounded-12 bg-green-50 p-12 text-12 text-default">
          <CheckCircleFill size={20} className="shrink-0 text-green-500" />
          Dana masuk dalam hitungan detik dan langsung bisa dipakai di AmarthaFin.
        </div>
      )}

      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => flow.go('home')}>
          Cairkan Dana
        </Button>
      </BottomAction>
    </Screen>
  )
}
