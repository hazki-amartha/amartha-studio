'use client'

// Shared shell for the two `bukti` re-send screens (bukti-rekap, bukti-bayar).
//
// Both follow the app's current "Tugas selesai → bagikan ringkasan" structure,
// so the success header, the mitra card, the correction callout, the "Cek isi
// pesan" block, the share button and the share sheet live here once. Each screen
// supplies only its own message body (and, for the mitra level, the mitra it is
// addressed to). The message stays a read-back the BP sends as written; the ONE
// figure ops corrected is marked with `ChangedAmount` inside it.

import { useState, type ReactNode } from 'react'
import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import { Coins, PaperPlaneTilt, WhatsappLogo } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { rupiah } from './data'
import { IconCheck } from './icons'
import { AppScreen, Avatar, ShareSheet, StickyBar, type ShareTarget } from './ui'

/** A corrected rupiah: old figure struck, new figure highlighted. */
export function ChangedAmount({ was, now }: { was: number; now: number }) {
  return (
    <>
      <span className="text-disabled line-through">{rupiah(was)}</span>{' '}
      <span className="rounded-8 bg-orange-50 px-4 py-2 font-bold text-orange-500">{rupiah(now)}</span>
    </>
  )
}

/** A blank line between paragraphs of the message read-back. */
export function Gap() {
  return <span aria-hidden className="block h-12" />
}

export interface BuktiMitra {
  name: string
  product: string
  phone: string
}

export function BuktiSendScreen({
  title,
  mitra,
  change,
  children,
  shareTitle,
  targets,
  sentLabel,
}: {
  /** The header title — the same on both re-sends. */
  title: string
  /** Set on the mitra-level re-send — draws the borrower card under the header. */
  mitra?: BuktiMitra
  /** The correction, named once above the draft. */
  change: { subject: string; was: number; now: number }
  /** The message body, as a stack of lines and <Gap/> spacers. */
  children: ReactNode
  shareTitle: string
  targets: ShareTarget[]
  sentLabel: string
}) {
  const flow = useFlow()
  const [sharing, setSharing] = useState(false)
  const [sent, setSent] = useState(false)

  return (
    <AppScreen topBar={<NavigationHeader title={title} onBack={() => flow.back()} />}>
      {/* Mitra card — mitra-level re-send only. */}
      {mitra ? (
        <Card>
          <div className="flex items-center gap-12">
            <Avatar name={mitra.name} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="flex items-center gap-4">
                <span className="truncate text-16 font-bold text-default">{mitra.name}</span>
                <Badge intent="blue">
                  <span className="flex items-center gap-2">
                    <Coins size={16} />
                    {mitra.product}
                  </span>
                </Badge>
              </span>
              <span className="truncate text-12 text-caption">{mitra.phone}</span>
            </div>
            <button
              type="button"
              aria-label={`Bagikan ke WhatsApp ${mitra.name}`}
              onClick={() => setSharing(true)}
              className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full border border-default text-green-500"
            >
              <WhatsappLogo size={20} />
            </button>
          </div>
        </Card>
      ) : null}

      {/* The correction, named once before the draft. */}
      <div className="rounded-12 border border-orange-200 bg-orange-50 p-12">
        <span className="text-12 font-bold text-orange-500">Nominal diperbarui dari dashboard</span>
        <p className="pt-2 text-12 text-default">
          {change.subject}: {rupiah(change.was)} → {rupiah(change.now)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-16 font-bold text-default">Cek isi pesan</span>
        <span className="text-12 text-caption">Pastikan info sudah sesuai, ubah jika belum.</span>
      </div>

      <div className="flex flex-col rounded-12 border border-default bg-neutral-white p-12 text-14 text-default">
        {children}
      </div>

      {sent ? (
        <div className="flex items-center gap-8 rounded-12 border border-green-200 bg-green-50 p-12">
          <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-green-500 text-neutral-white">
            <IconCheck size={16} />
          </span>
          <span className="text-12 font-bold text-green-500">{sentLabel}</span>
        </div>
      ) : null}

      <StickyBar>
        {sent ? (
          <Button size="lg" className="w-full" onClick={() => flow.go('today')}>
            Selesai
          </Button>
        ) : (
          <>
            <Button size="lg" className="w-full" onClick={() => setSharing(true)}>
              <span className="flex items-center justify-center gap-8">
                <PaperPlaneTilt size={20} />
                Bagikan Pesan
              </span>
            </Button>
            <Button size="lg" variant="ghost" className="w-full" onClick={() => flow.go('today')}>
              Tutup
            </Button>
          </>
        )}
      </StickyBar>

      <ShareSheet
        open={sharing}
        onClose={() => setSharing(false)}
        title={shareTitle}
        targets={targets}
        onSend={() => {
          setSharing(false)
          setSent(true)
        }}
      />
    </AppScreen>
  )
}
