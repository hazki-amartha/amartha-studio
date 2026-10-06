'use client'

// Poket detail, opened from the Poket widget's title/arrow. The wallet card has
// three tiers (state switcher): a plain Poket with an upgrade nudge, a Premium
// wallet that also holds a Mitra Amartha account (after Modal KYC), and a single
// Premium Plus wallet (after "Upgrade Poket Premium Plus"). Below is the shared
// transaction history. (Reference: node 34-70510.)

import { type ReactNode } from 'react'
import { NavigationHeader } from '@/design-system/components'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  DotsThreeVertical,
  Eye,
  Plus,
  Transfer,
} from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah, TRANSACTIONS } from '../lib/data'
import { useBankState } from '../lib/store'

const CARD_FILL = 'bg-gradient-to-br from-primary-500 to-primary-700 text-neutral-white'

function PurpleAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex shrink-0 flex-col items-center gap-4">
      <span className="flex h-32 w-32 items-center justify-center rounded-full bg-neutral-white text-primary-500">
        {icon}
      </span>
      <span className="text-10 text-neutral-white">{label}</span>
    </button>
  )
}

function Actions({ topupRoute = 'poket-topup' }: { topupRoute?: string }) {
  const flow = useFlow()
  return (
    <div className="flex gap-12">
      <PurpleAction icon={<Plus size={16} />} label="Isi Saldo" onClick={() => flow.go(topupRoute)} />
      <PurpleAction icon={<Transfer size={16} />} label="Transfer" onClick={() => flow.go('poket-transfer')} />
    </div>
  )
}

function NonPremiumCard({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className={`overflow-hidden rounded-16 ${CARD_FILL}`}>
      <div className="flex items-start justify-between p-16">
        <div>
          <p className="text-12">Poket</p>
          <p className="mt-2 flex items-center gap-8 text-20 font-bold">
            Rp150.000 <Eye size={16} />
          </p>
        </div>
        <Actions />
      </div>
      <button
        type="button"
        onClick={onUpgrade}
        className="flex w-full items-center justify-between gap-8 bg-primary-400 px-16 py-12 text-left text-12 font-bold"
      >
        Nikmati semua fitur, upgrade Premium Plus
        <ArrowRight size={16} />
      </button>
    </div>
  )
}

function SubBalance({
  name,
  account,
  amount,
  topupRoute,
}: {
  name: string
  account: string
  amount: string
  topupRoute?: string
}) {
  return (
    <div className="flex items-end justify-between">
      <div className="min-w-0">
        <p className="text-12">{name}</p>
        <p className="text-10 text-primary-50">{account}</p>
        <p className="mt-2 text-16 font-bold">{amount}</p>
      </div>
      <Actions topupRoute={topupRoute} />
    </div>
  )
}

function PremiumMitraCard() {
  return (
    <div className={`rounded-16 p-16 ${CARD_FILL}`}>
      <p className="text-12">Total saldo</p>
      <p className="mt-2 flex items-center gap-8 text-20 font-bold">
        Rp14.500.000 <Eye size={16} />
      </p>
      <div className="mt-16 flex flex-col gap-16 border-t border-neutral-white/20 pt-16">
        <SubBalance name="Poket Premium" account="+628113314040" amount="Rp250.000" />
        <SubBalance name="Rekening Mitra Amartha" account="5010-2233-4455" amount="Rp5.000.000" topupRoute="topup" />
      </div>
    </div>
  )
}

function PremiumNonMitraCard() {
  return (
    <div className={`rounded-16 p-16 ${CARD_FILL}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-12">Poket Premium Plus</p>
          <p className="text-10 text-primary-50">+628113314040 / 5010-2233-4455</p>
          <p className="mt-8 flex items-center gap-8 text-20 font-bold">
            Rp250.000 <Eye size={16} />
          </p>
        </div>
        <Actions />
      </div>
    </div>
  )
}

function FilterChip({ children }: { children: ReactNode }) {
  return (
    <span className="flex shrink-0 items-center gap-4 rounded-full border border-default px-12 py-8 text-12 text-default">
      {children}
      <ChevronDown size={16} className="text-caption" />
    </span>
  )
}

export function PoketDetailScreen() {
  const flow = useFlow()
  const { poketTier } = useBankState()
  const dates = [...new Set(TRANSACTIONS.map((t) => t.date))]

  return (
    <Screen canvas="white" topBar={<NavigationHeader onBack={flow.back} trailingIcons={[<DotsThreeVertical key="more" size={20} />]} />}>
      {poketTier === 'non-premium' ? (
        <NonPremiumCard onUpgrade={() => flow.go('ob-intro')} />
      ) : poketTier === 'premium-mitra' ? (
        <PremiumMitraCard />
      ) : (
        <PremiumNonMitraCard />
      )}

      <p className="text-16 font-bold text-default">Riwayat transaksi</p>
      <div className="-mx-16 flex gap-8 overflow-x-auto px-16">
        <FilterChip>November</FilterChip>
        <FilterChip>Semua Status</FilterChip>
        <FilterChip>Semua Transaksi</FilterChip>
      </div>

      {dates.map((d) => (
        <div key={d}>
          <p className="py-8 text-12 font-bold text-caption">{d}</p>
          {TRANSACTIONS.filter((r) => r.date === d).map((r) => (
            <div key={r.id} className="flex items-center gap-12 border-b border-default py-12">
              <span
                className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-full ${
                  r.amount > 0 ? 'bg-green-50 text-green-500' : 'bg-neutral-100 text-default'
                }`}
              >
                {r.amount > 0 ? <ArrowDown size={20} /> : <ArrowUp size={20} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-14 font-bold text-default">{r.title}</span>
                <span className="block truncate text-12 text-caption">{r.subtitle}</span>
              </span>
              <span className={`shrink-0 text-14 font-bold ${r.amount > 0 ? 'text-green-500' : 'text-default'}`}>
                {rupiah(r.amount)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </Screen>
  )
}
