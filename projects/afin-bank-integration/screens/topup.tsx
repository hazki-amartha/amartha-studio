'use client'

// Top-up this round is the account number and nothing else (PRD E): copy it
// or share it, then transfer in from any bank. The share sheet is drawn, not
// opened — nothing leaves the prototype.

import { useState } from 'react'
import { BottomSheet, Button, Card, NavigationHeader } from '@/design-system/components'
import { Bank, ChevronDown, ChevronUp, Copy, ShareNetwork, Storefront } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ACCOUNT_NAME, BottomAction, DataRow } from '../lib/ui'

const GUIDES = [
  {
    title: 'Dari m-banking bank lain',
    steps: [
      'Buka aplikasi m-banking Anda, pilih Transfer.',
      'Pilih bank tujuan Bank Aladin Syariah.',
      'Masukkan nomor rekening 5010 2233 4455.',
      'Masukkan jumlah, cek nama penerima Widyasari, lalu kirim.',
    ],
  },
  {
    title: 'Dari ATM bank lain',
    steps: [
      'Pilih Transfer › Ke Bank Lain.',
      'Masukkan kode bank 947 lalu nomor rekening 5010 2233 4455.',
      'Masukkan jumlah dan konfirmasi.',
    ],
  },
]

export function TopupScreen() {
  const flow = useFlow()
  const [copied, setCopied] = useState(false)
  const [share, setShare] = useState(false)
  const [open, setOpen] = useState(0)

  return (
    <Screen topBar={<NavigationHeader title="Isi Saldo" onBack={flow.back} />}>
      <Card>
        <div className="flex items-center gap-12">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <Bank size={20} />
          </span>
          <div>
            <p className="text-14 font-bold text-default">Transfer ke {ACCOUNT_NAME}</p>
            <p className="text-12 text-caption">Dari bank mana pun, masuk dalam hitungan detik.</p>
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
          <DataRow label="Bank tujuan" value="Bank Aladin Syariah (947)" />
        </div>
      </Card>

      <Card>
        <p className="mb-8 text-16 font-bold text-default">Cara transfer</p>
        {GUIDES.map((g, i) => (
          <div key={g.title} className="border-b border-default last:border-b-0">
            <button
              type="button"
              onClick={() => setOpen(open === i ? -1 : i)}
              className="flex w-full items-center justify-between py-12 text-left text-14 font-bold text-default"
            >
              {g.title}
              {open === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {open === i ? (
              <ol className="flex flex-col gap-8 pb-12">
                {g.steps.map((s, n) => (
                  <li key={s} className="flex gap-8 text-14 text-default">
                    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-50 text-10 font-bold text-primary-500">
                      {n + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ))}
      </Card>

      <div className="flex items-start gap-8 rounded-12 bg-neutral-100 p-12 text-12 text-caption">
        <Storefront size={20} className="shrink-0" />
        Isi saldo lewat Alfamart, Indomaret, dan setor tunai di ATM segera hadir.
      </div>

      <BottomAction>
        <Button variant="primary" size="lg" className="w-full" onClick={() => setShare(true)}>
          <ShareNetwork size={16} /> Bagikan Nomor Rekening
        </Button>
      </BottomAction>

      <BottomSheet
        open={share}
        onClose={() => setShare(false)}
        title="Bagikan lewat"
        slot={
          <div className="flex flex-col gap-12">
            <div className="rounded-12 bg-neutral-50 p-12 text-12 text-default">
              Transfer ke rekening saya ya: Bank Aladin Syariah (947) 5010 2233 4455 a.n. Widyasari
            </div>
            <div className="flex justify-between">
              {['WhatsApp', 'SMS', 'Telegram', 'Salin'].map((app) => (
                <button
                  key={app}
                  type="button"
                  onClick={() => setShare(false)}
                  className="flex flex-1 flex-col items-center gap-4 text-12 text-default"
                >
                  <span className="h-48 w-48 rounded-16 bg-neutral-100" />
                  {app}
                </button>
              ))}
            </div>
          </div>
        }
      />
    </Screen>
  )
}
