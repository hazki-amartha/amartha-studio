'use client'

// "Cek dan perbarui datanya" — the six application sections, each a row that
// opens its sub-flow with a per-section status. The switcher flips between the
// review state (some sections still need data) and all-complete. Structure
// follows the reference image.

import { type ReactNode } from 'react'
import { Badge, Button, Card, ListRow, NavigationHeader } from '@/design-system/components'
import {
  Bank,
  FileDoc,
  House,
  IdentificationCard,
  Profile,
  Storefront,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { PageTitle } from '../lib/ui'
import { useBankState } from '../lib/store'

interface HubRow {
  id: string
  title: string
  icon: ReactNode
  tint: string
  route: string
  done: boolean // default (review) state; `modalFilled` forces all complete
}

const ROWS: HubRow[] = [
  { id: 'pribadi', title: 'Data pribadi', icon: <IdentificationCard size={24} />, tint: 'bg-blue-50 text-blue-500', route: 'modal-ktp-guide', done: false },
  { id: 'bank', title: 'Data bank', icon: <Bank size={24} />, tint: 'bg-blue-50 text-blue-500', route: 'modal-bank', done: false },
  { id: 'penanggung', title: 'Data penanggung jawab', icon: <Profile size={24} />, tint: 'bg-orange-50 text-orange-500', route: 'modal-majelis', done: false },
  { id: 'keluarga', title: 'Data keluarga', icon: <FileDoc size={24} />, tint: 'bg-blue-50 text-blue-500', route: 'modal-keluarga', done: false },
  { id: 'domisili', title: 'Data & foto domisili', icon: <House size={24} />, tint: 'bg-orange-50 text-orange-500', route: 'modal-rumah', done: false },
  { id: 'usaha', title: 'Data & foto usaha', icon: <Storefront size={24} />, tint: 'bg-primary-50 text-primary-500', route: 'modal-usaha', done: false },
]

export function ModalHubScreen() {
  const flow = useFlow()
  const { modalFilled, modalStage } = useBankState()
  // How many of the six sections are complete: all when filled, the first three
  // when resuming a "KYC ongoing (3 dari 6)" journey, none otherwise.
  const doneCount = modalFilled ? ROWS.length : modalStage === 'kyc-ongoing' ? 3 : 0
  const rows = ROWS.map((r, i) => ({ ...r, done: i < doneCount }))
  const allDone = rows.every((r) => r.done)

  return (
    <Screen
      canvas="white"
      topBar={<NavigationHeader onBack={flow.back} link="Butuh Bantuan?" onLinkClick={() => {}} />}
    >
      <PageTitle
        title="Cek dan perbarui datanya, ya!"
        description="Batas pinjaman akan disesuaikan dengan data terbaru Anda. Pastikan semuanya sudah benar."
      />

      <div className="flex flex-col gap-12">
        {rows.map((r) => (
          <ListRow
            key={r.id}
            title={r.title}
            leading={
              <span className={`flex h-48 w-48 items-center justify-center rounded-12 ${r.tint}`}>{r.icon}</span>
            }
            description={
              r.done ? (
                <Badge intent="green" size="sm">Sudah Lengkap</Badge>
              ) : (
                <Badge intent="neutral" variant="outline" size="sm">Lengkapi Data</Badge>
              )
            }
            chevron
            onClick={() => flow.go(r.route)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 -mx-16 mt-auto border-t border-default bg-neutral-white px-16 py-12">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!allDone}
          onClick={() => flow.go('modal-review')}
        >
          Cek Lagi
        </Button>
      </div>
    </Screen>
  )
}
