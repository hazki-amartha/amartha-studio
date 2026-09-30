'use client'

// PRD C: one combined number, the split under it, and the account's standing.
// Dormant and frozen get a banner saying why and what to do — never a code.

import { Badge, Card, ListRow, NavigationHeader } from '@/design-system/components'
import { Wordmark } from '@/design-system/assets'
import {
  Bank,
  GearSix,
  LightbulbFilament,
  LockKeyOpen,
  LinkBreak,
  LockKey,
  Plus,
  RpHistory,
  WarningCircle,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ACCOUNT_NAME } from '../lib/ui'
import { store, useBankState, type AccountStanding } from '../lib/store'

const STANDING: Record<AccountStanding, { label: string; intent: 'green' | 'orange' | 'red' }> = {
  active: { label: 'Aktif', intent: 'green' },
  dormant: { label: 'Tidak aktif', intent: 'orange' },
  frozen: { label: 'Dibekukan', intent: 'red' },
}

export function BalanceDetailScreen() {
  const flow = useFlow()
  const { status } = useBankState()
  const standing = STANDING[status]

  return (
    <Screen topBar={<NavigationHeader title="Saldo Saya" onBack={flow.back} />}>
      <Card>
        <p className="text-12 text-caption">Total saldo</p>
        <p className="mt-4 text-24 font-bold text-default">Rp24.160.000</p>
        <p className="mt-4 text-12 text-caption">Gabungan {ACCOUNT_NAME} dan Poket</p>
        <div className="mt-12 flex gap-8">
          <button
            type="button"
            onClick={() => flow.go('topup')}
            className="flex flex-1 items-center justify-center gap-8 rounded-full bg-primary-500 py-8 text-14 font-bold text-neutral-white"
          >
            <Plus size={16} /> Isi Saldo
          </button>
          <button
            type="button"
            onClick={() => flow.go('history')}
            className="flex flex-1 items-center justify-center gap-8 rounded-full border border-primary-500 py-8 text-14 font-bold text-primary-500"
          >
            <RpHistory size={16} /> Riwayat
          </button>
        </div>
      </Card>

      {status !== 'active' ? <StandingBanner status={status} /> : null}

      <Card flush>
        <button
          type="button"
          onClick={() => flow.go('account-detail')}
          className="flex w-full items-center gap-12 border-b border-default p-12 text-left"
        >
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <Bank size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-8">
              <span className="text-14 font-bold text-default">{ACCOUNT_NAME}</span>
              <Badge intent={standing.intent} size="sm">
                {standing.label}
              </Badge>
            </span>
            <span className="block text-12 text-caption">5010 2233 4455</span>
          </span>
          <span className="text-14 font-bold text-default">Rp24.000.000</span>
        </button>
        <div className="flex items-center gap-12 p-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center">
            <Wordmark name="poket" height={20} />
          </span>
          <span className="min-w-0 flex-1 text-12 text-caption">Untuk kirim ke sesama AmarthaFin</span>
          <span className="text-14 font-bold text-default">Rp160.000</span>
        </div>
      </Card>

      <div className="flex items-start gap-8 rounded-12 bg-blue-50 p-12 text-12 text-default">
        <LightbulbFilament size={20} className="shrink-0 text-blue-500" />
        Saat membayar, saldo diambil dari {ACCOUNT_NAME} lebih dulu. Poket dipakai untuk kirim uang ke sesama
        pengguna AmarthaFin.
      </div>

      <Card flush>
        <p className="px-12 pt-12 text-14 font-bold text-default">Pengaturan rekening</p>
        <ListRow title="Detail rekening" leading={<GearSix size={20} />} chevron onClick={() => flow.go('account-detail')} />
        <ListRow
          title="Ubah PIN"
          leading={<LockKeyOpen size={20} />}
          chevron
          onClick={() => {
            store.set({ pinFlow: 'change' })
            flow.go('pin-change-old')
          }}
        />
        <ListRow
          title="Lupa PIN"
          leading={<LockKey size={20} />}
          chevron
          onClick={() => {
            store.set({ pinFlow: 'reset' })
            flow.go('pin-reset')
          }}
        />
        <ListRow title="Putuskan dari AmarthaFin" leading={<LinkBreak size={20} />} chevron onClick={() => flow.go('unbind')} />
      </Card>
    </Screen>
  )
}

function StandingBanner({ status }: { status: 'dormant' | 'frozen' }) {
  const dormant = status === 'dormant'
  return (
    <div className={`flex items-start gap-8 rounded-12 p-12 text-12 text-default ${dormant ? 'bg-orange-50' : 'bg-red-50'}`}>
      <WarningCircle size={20} className={`shrink-0 ${dormant ? 'text-orange-500' : 'text-red-500'}`} />
      <div>
        <p className="text-14 font-bold">{dormant ? 'Rekening tidak aktif' : 'Rekening dibekukan'}</p>
        <p className="mt-4">
          {dormant
            ? 'Tidak ada transaksi selama 6 bulan. Isi saldo berapa pun untuk mengaktifkannya lagi.'
            : 'Dibekukan sementara untuk pemeriksaan keamanan. Saldo Anda aman. Hubungi AmarthaCare untuk info lebih lanjut.'}
        </p>
      </div>
    </div>
  )
}
