'use client'

// Poket "Isi Saldo" — the top-up method list (reference: image 11). The top-up
// limit depends on the tier (Rp10jt non-premium, Rp20jt premium). Premium Plus
// adds a tab: under Rp20jt uses the method list, above Rp20jt transfers straight
// to the Bank Aladin rekening. The Rekening Mitra top-up reuses the bank-transfer
// screen directly.

import { type ReactNode, useState } from 'react'
import { Card, NavigationHeader } from '@/design-system/components'
import { ArrowRight, Bank, Copy, Storefront, Wallet } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { DataRow } from '../lib/ui'
import { useBankState } from '../lib/store'

function Logo({ icon, tint = 'bg-neutral-100 text-default' }: { icon: ReactNode; tint?: string }) {
  return <span className={`flex h-40 w-40 shrink-0 items-center justify-center rounded-8 ${tint}`}>{icon}</span>
}

// Admin fee line: struck-through old fee, now free, with a minimum.
function freeFee(old: string, min = 'Rp10.000') {
  return (
    <>
      Biaya admin <span className="line-through">{old}</span> gratis • Minimal {min}
    </>
  )
}

function CopyPill({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="mb-8 ml-52 flex items-center justify-between gap-8 rounded-8 bg-primary-50 px-12 py-8">
      <span className="min-w-0 truncate text-12 text-default">
        {label} <span className="font-bold text-primary-500">{value}</span>
      </span>
      <button
        type="button"
        onClick={() => setCopied(true)}
        className="flex shrink-0 items-center gap-4 rounded-full border border-primary-500 px-12 py-4 text-12 font-bold text-primary-500"
      >
        <Copy size={16} /> {copied ? 'Tersalin' : 'Salin'}
      </button>
    </div>
  )
}

function MethodRow({
  logo,
  title,
  subtitle,
  copy,
  onClick,
}: {
  logo: ReactNode
  title: string
  subtitle: ReactNode
  copy?: { label: string; value: string }
  onClick: () => void
}) {
  return (
    <div className="border-b border-default last:border-b-0">
      <button type="button" onClick={onClick} className="flex w-full items-center gap-12 py-12 text-left">
        {logo}
        <span className="min-w-0 flex-1">
          <span className="block text-14 font-bold text-default">{title}</span>
          <span className="block text-12 text-caption">{subtitle}</span>
        </span>
        <ArrowRight size={20} className="shrink-0 text-caption" />
      </button>
      {copy ? <CopyPill label={copy.label} value={copy.value} /> : null}
    </div>
  )
}

function Group({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Card>
      <p className="text-16 font-bold text-default">{title}</p>
      {subtitle ? <p className="mt-2 text-12 text-caption">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </Card>
  )
}

function MethodList({ batas, back }: { batas: string; back: () => void }) {
  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <span className="text-14 text-default">Batas isi saldo</span>
          <span className="text-16 font-bold text-default">{batas}</span>
        </div>
      </Card>

      <Card>
        <MethodRow
          logo={<Logo icon={<Wallet size={20} className="text-primary-500" />} tint="bg-primary-50" />}
          title="Agen AmarthaLink"
          subtitle="Gratis biaya admin"
          copy={{ label: 'No. HP:', value: '0812345678987' }}
          onClick={back}
        />
      </Card>

      <Group title="Transfer bank" subtitle="Dari m-banking, ATM, internet banking, dll">
        <MethodRow
          logo={<Logo icon={<Bank size={20} className="text-blue-500" />} tint="bg-blue-50" />}
          title="BRI - Virtual Account"
          subtitle={freeFee('Rp1.500')}
          copy={{ label: 'No:', value: '14425081280651845' }}
          onClick={back}
        />
        <MethodRow
          logo={<Logo icon={<Bank size={20} className="text-orange-500" />} tint="bg-orange-50" />}
          title="BNI - Virtual Account"
          subtitle={freeFee('Rp1.998')}
          copy={{ label: 'No:', value: '8578081280651845' }}
          onClick={back}
        />
        <MethodRow
          logo={<Logo icon={<Bank size={20} className="text-primary-500" />} tint="bg-primary-50" />}
          title="Bank lainnya"
          subtitle={freeFee('Rp1.500')}
          onClick={back}
        />
      </Group>

      <Group title="Retail outlet" subtitle="Minimal top up Rp50.000">
        <MethodRow
          logo={<Logo icon={<Storefront size={20} className="text-red-500" />} tint="bg-red-50" />}
          title="Alfamart/Alfamidi/Dan+Dan"
          subtitle="Biaya admin Rp6.000"
          onClick={back}
        />
        <MethodRow
          logo={<Logo icon={<Storefront size={20} className="text-blue-500" />} tint="bg-blue-50" />}
          title="Indomaret"
          subtitle="Biaya admin Rp6.000"
          onClick={back}
        />
      </Group>

      <Group title="E-Wallet" subtitle="Minimal Rp10.000">
        <MethodRow
          logo={<Logo icon={<Wallet size={20} className="text-blue-500" />} tint="bg-blue-50" />}
          title="Dana"
          subtitle={freeFee('Rp1.500')}
          onClick={back}
        />
        <MethodRow
          logo={<Logo icon={<Wallet size={20} className="text-orange-500" />} tint="bg-orange-50" />}
          title="ShopeePay"
          subtitle={freeFee('Rp1.500')}
          onClick={back}
        />
      </Group>
    </>
  )
}

function BankTransferBlock() {
  const [copied, setCopied] = useState(false)
  return (
    <>
      <Card>
        <div className="flex items-center gap-12">
          <Logo icon={<Bank size={20} className="text-primary-500" />} tint="bg-primary-50" />
          <div>
            <p className="text-14 font-bold text-default">Transfer ke Rekening</p>
            <p className="text-12 text-caption">Bank Aladin Syariah</p>
          </div>
        </div>
        <div className="mt-12 rounded-12 bg-neutral-50 p-12">
          <p className="text-12 text-caption">Nomor rekening</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-20 font-bold text-default">5010 2233 4455</span>
            <button
              type="button"
              onClick={() => setCopied(true)}
              className="flex items-center gap-4 text-14 font-bold text-link"
            >
              <Copy size={16} /> {copied ? 'Tersalin' : 'Salin'}
            </button>
          </div>
        </div>
        <div className="mt-4">
          <DataRow label="Nama penerima" value="Widyasari" />
          <DataRow label="Bank" value="Bank Aladin Syariah" />
        </div>
      </Card>
      <p className="text-12 text-caption">
        Untuk isi saldo di atas Rp20 juta, transfer langsung ke rekening di atas dari bank mana pun.
      </p>
    </>
  )
}

export function PoketTopupScreen() {
  const flow = useFlow()
  const { poketTier } = useBankState()
  const isPlus = poketTier === 'premium-non-mitra'
  const [tab, setTab] = useState<'poket' | 'bank'>('poket')
  const batas = poketTier === 'non-premium' ? 'Rp10.000.000' : 'Rp20.000.000'

  return (
    <Screen topBar={<NavigationHeader title="Pilih metode pengisian" onBack={flow.back} />}>
      {isPlus ? (
        <div className="flex gap-8">
          <Tab active={tab === 'poket'} onClick={() => setTab('poket')}>
            Di bawah Rp20 juta
          </Tab>
          <Tab active={tab === 'bank'} onClick={() => setTab('bank')}>
            Di atas Rp20 juta
          </Tab>
        </div>
      ) : null}

      {isPlus && tab === 'bank' ? <BankTransferBlock /> : <MethodList batas={batas} back={flow.back} />}
    </Screen>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-12 border px-12 py-12 text-12 font-bold ${
        active ? 'border-primary-500 bg-primary-50 text-primary-500' : 'border-default bg-neutral-white text-default'
      }`}
    >
      {children}
    </button>
  )
}
