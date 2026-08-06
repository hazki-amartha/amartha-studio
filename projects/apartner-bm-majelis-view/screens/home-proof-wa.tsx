'use client'

// The WhatsApp preview after a home visit — the payment receipt, made its own
// step, exactly as the majelis visit's "Kirim Rekap ke Grup".
//
// A doorstep collection leaves no slip, so nothing reaches the mitra's phone
// unless the BP sends it. This screen shows the receipt the app has already
// written — what was paid, and what is still owed with the date promised — and
// hands the BP one trigger: Salin pesan. The message is a read-back, not a
// field; everything in it is derived from what she just recorded, so an editable
// box would only invite a mistake she did not come here to make.
//
// She COPIES rather than sends, same as the majelis recap: the app does not own
// the send, WhatsApp does, and she pastes it into the chat herself.
//
// Reached from Bukti & Kirim, after the visit is already finished — so this is a
// courtesy she performs, not a gate the task waits on. "Tutup" leaves without
// copying; the schedule is where the visit ends either way.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { Copy } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { outstandingOf, rupiah } from '../lib/data'
import { DAYS } from '../lib/schedule'
import { openHomeMitra, paidOf, useApp } from '../lib/store'
import { IconCheck } from '../lib/icons'
import { AppScreen, SectionTitle, StickyBar } from '../lib/ui'

export function HomeProofWaScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)
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
    <AppScreen
      topBar={<NavigationHeader title="Kirim bukti bayar" onBack={() => flow.back()} />}
    >
      {/* No "Pesan dikirim ke …" banner: the app no longer does the sending,
          so naming a destination would promise something this screen does not
          do. She copies, then picks where it goes herself. */}
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
            Pesan tersalin — tinggal tempel di chat {mitra.name}
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
                <Copy size={20} />
                Salin pesan
              </span>
            </Button>
            <Button size="lg" variant="ghost" className="w-full" onClick={() => flow.go('today')}>
              Tutup
            </Button>
          </>
        )}
      </StickyBar>
    </AppScreen>
  )
}
