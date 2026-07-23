'use client'

// Compose a group reminder. The message arrives pre-written and stays editable,
// which is the whole design: the mitra is nudging her neighbours about money, and
// a canned sentence she cannot soften is one she will not send.

import { useState } from 'react'
import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { IconWhatsApp } from '../lib/icons'
import { useApp } from '../lib/store'
import { FullWidthButton, StickyBar } from '../lib/ui'

export function WhatsAppReminderScreen() {
  const flow = useFlow()
  const s = useApp()
  const [text, setText] = useState(s.waMessage)
  const [sent, setSent] = useState(false)

  const send = () => {
    setSent(true)
    window.setTimeout(() => flow.go('majelis'), 900)
  }

  return (
    <Screen topBar={<NavigationHeader title="Kirim pengingat" onBack={() => flow.go('majelis')} />}>
      <div className="flex items-center gap-12 rounded-12 border border-green-200 bg-green-50 p-12">
        <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-neutral-white text-green-500">
          <IconWhatsApp size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-12 text-green-600">Kirim ke</p>
          <p className="mt-2 text-14 font-bold text-default">{s.waTarget}</p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <label htmlFor="wa-msg" className="text-12 text-caption">
          Pesan pengingat
        </label>
        <textarea
          id="wa-msg"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full resize-none rounded-8 border border-default bg-neutral-white p-12 text-14 text-default"
        />
        <p className="text-12 text-caption">Bisa diedit sebelum dikirim ke grup.</p>
      </div>

      <StickyBar>
        <FullWidthButton onClick={send} disabled={sent || !text.trim()}>
          {sent ? 'Terkirim ✓' : 'Kirim ke grup'}
        </FullWidthButton>
      </StickyBar>
    </Screen>
  )
}
