'use client'

// The WhatsApp preview after a home visit — the payment receipt, made its own
// step, exactly as the majelis visit's "Kirim Rekap ke Grup".
//
// A doorstep collection leaves no slip, so nothing reaches the mitra's phone
// unless the BP sends it. This screen shows the receipt the app has already
// written — what was paid, and what is still owed with the date promised — and
// hands the BP one trigger: Kirim Bukti Bayar via WhatsApp. The message is a
// read-back, not a field; everything in it is derived from what she just
// recorded, so an editable box would only invite a mistake she did not come here
// to make.
//
// Reached from Bukti & Kirim, after the visit is already finished — so this is a
// courtesy she performs, not a gate the task waits on. "Nanti saja" leaves
// without sending; the schedule is where the visit ends either way.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { PaperPlaneTilt } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { outstandingOf, rupiah } from '../lib/data'
import { profileOf } from '../lib/profile'
import { DAYS } from '../lib/schedule'
import { openHomeMitra, paidOf, useApp } from '../lib/store'
import { IconCheck, IconChatFill } from '../lib/icons'
import { SectionTitle, StickyBar } from '../lib/ui'

export function HomeProofWaScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)
  const profile = profileOf(mitra)
  const [sent, setSent] = useState(false)

  const paid = paidOf(s, mitra)
  const shortfall = Math.max(0, outstandingOf(mitra).total - paid)
  const promise = s.partialPtp[mitra.id] ?? s.nonPayments[mitra.id]?.ptp

  const message = [
    `Halo Ibu ${mitra.name} 🙏`,
    ``,
    paid > 0
      ? `Terima kasih, pembayaran angsuran sebesar ${rupiah(paid)} sudah kami terima hari ini (${DAYS[0].date}).`
      : `Terima kasih atas waktunya hari ini (${DAYS[0].date}). Belum ada pembayaran yang kami terima.`,
    ...(shortfall > 0
      ? [``, `Sisa tagihan ${rupiah(shortfall)}${promise ? `, janji bayar ${promise}` : ''}.`]
      : []),
    ``,
    `Salam,`,
    `Amartha`,
  ].join('\n')

  return (
    <Screen
      topBar={<NavigationHeader title="Kirim bukti bayar" onBack={() => flow.back()} />}
    >
      {/* Who it lands with — the mitra's own WhatsApp, since a doorstep receipt
          is her record of what was agreed at her door, on the phone she keeps. */}
      <div className="flex items-center gap-8 rounded-8 bg-neutral-50 p-12">
        <span className="shrink-0 text-green-500">
          <IconChatFill size={20} />
        </span>
        <span className="min-w-0 flex-1 text-12 text-default">
          Pesan dikirim ke <span className="font-bold">{mitra.name}</span> · {profile.phone}
        </span>
      </div>

      <SectionTitle>Pratinjau pesan</SectionTitle>
      <p className="whitespace-pre-line rounded-12 border border-default bg-neutral-white p-12 text-12 text-default">
        {message}
      </p>

      {sent ? (
        <div className="flex items-center gap-8 rounded-12 border border-green-200 bg-green-50 p-12">
          <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-green-500 text-neutral-white">
            <IconCheck size={16} />
          </span>
          <span className="text-12 font-bold text-green-500">
            Bukti bayar terkirim ke {mitra.name}
          </span>
        </div>
      ) : null}

      <StickyBar>
        {sent ? (
          <Button size="lg" className="w-full" onClick={() => flow.go('today')}>
            Selesai
          </Button>
        ) : (
          <>
            <Button size="lg" className="w-full" onClick={() => setSent(true)}>
              <span className="flex items-center justify-center gap-8">
                <PaperPlaneTilt size={20} />
                Kirim Bukti Bayar via WhatsApp
              </span>
            </Button>
            <Button size="lg" variant="ghost" className="w-full" onClick={() => flow.go('today')}>
              Nanti saja
            </Button>
          </>
        )}
      </StickyBar>
    </Screen>
  )
}
