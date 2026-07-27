'use client'

// After a home visit closes with cash in hand, the courtesy step: a WhatsApp
// receipt back to the mitra. Collection at the door has no printed slip and no
// in-app confirmation reaches her phone, so "did the money land?" is a question
// she can otherwise only answer by asking. The BP already has WhatsApp open for
// half her day; this hands her a ready-made message — the amount, the date, and
// any balance still promised — to read, tweak if she likes, and send to that one
// mitra. It shows only when money was actually taken; a "Tidak Bayar" visit has
// nothing to confirm.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { outstandingOf, rupiah } from '../lib/data'
import { profileOf } from '../lib/profile'
import { openHomeMitra, paidOf, useApp } from '../lib/store'
import { DAYS } from '../lib/schedule'
import { MitraPhoto } from '../lib/mitra-card'
import { StickyBar, WaMark } from '../lib/ui'

/** Indonesian mobile number → wa.me digits: strip punctuation, 0-prefix → 62. */
function toWa(phone: string): string {
  return `62${phone.replace(/\D/g, '').replace(/^0/, '')}`
}

export function HomeWaConfirmScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)
  const profile = profileOf(mitra)
  const paid = paidOf(s, mitra)
  const shortfall = Math.max(0, outstandingOf(mitra).total - paid)
  const promise = s.partialPtp[mitra.id]

  const defaultMessage = [
    `Halo Ibu ${mitra.name} 🙏`,
    ``,
    `Terima kasih, pembayaran angsuran sebesar ${rupiah(paid)} sudah kami terima tunai hari ini (${DAYS[0].date}).`,
    ...(shortfall > 0
      ? [``, `Sisa tagihan ${rupiah(shortfall)}${promise ? `, janji bayar ${promise}` : ''}.`]
      : []),
    ``,
    `Salam,`,
    `Amartha`,
  ].join('\n')

  const [text, setText] = useState(defaultMessage)
  const waUrl = `https://wa.me/${toWa(profile.phone)}?text=${encodeURIComponent(text)}`

  function sendAndFinish() {
    if (typeof window !== 'undefined') window.open(waUrl, '_blank', 'noopener')
    flow.go('today')
  }

  return (
    <Screen
      className="bg-neutral-white"
      topBar={<NavigationHeader title="Konfirmasi ke mitra" onBack={() => flow.back()} />}
    >
      <p className="text-14 text-caption">
        Pembayaran tunai sudah tercatat. Kirim konfirmasi ke mitra lewat WhatsApp — bisa diubah dulu
        sebelum dikirim.
      </p>

      {/* Who it goes to. */}
      <div className="flex items-center gap-12 rounded-12 border border-default p-12">
        <MitraPhoto src={profile.photo} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-14 font-bold text-default">{mitra.name}</span>
          <span className="text-12 text-caption">{profile.phone}</span>
        </div>
        <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full border border-green-500 bg-green-50 text-green-500">
          <WaMark size={20} />
        </span>
      </div>

      {/* The message, previewed and editable. */}
      <div className="flex flex-col gap-8">
        <span className="text-12 font-bold text-default">Pesan konfirmasi</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full resize-none rounded-8 border border-default bg-neutral-white p-12 text-14 text-default"
        />
      </div>

      <StickyBar>
        <Button size="lg" className="w-full" onClick={sendAndFinish}>
          <span className="flex items-center justify-center gap-8">
            <WaMark size={20} /> Kirim via WhatsApp
          </span>
        </Button>
        <Button size="lg" variant="ghost" className="w-full" onClick={() => flow.go('today')}>
          Lewati
        </Button>
      </StickyBar>
    </Screen>
  )
}
