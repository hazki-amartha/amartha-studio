'use client'

// The WhatsApp preview after a majelis visit — the send, made its own step.
//
// A majelis settles TOGETHER: the women hold each other to it, so the room's
// receipt goes to the group, not to ops. This screen shows the message the app
// has already written — mitra by mitra, with the total received — and hands the
// BP one trigger: Kirim pesan. The message is a read-back, not a field;
// everything in it is derived from what she just recorded, so the version the
// app writes is the correct one and an editable box would only invite a
// mistake she did not come here to make.
//
// "Kirim" opens the share sheet rather than WhatsApp itself — see ShareSheet in
// lib/ui.tsx for why the sheet is drawn instead of real (CLAUDE.md §3).
//
// It is reached from Summary & Bukti, after the visit is already finished — so
// this is a courtesy she performs, not a gate the task waits on. "Tutup" leaves
// without sending; the schedule is where the visit ends either way.

import { useState } from 'react'
import { Button, NavigationHeader } from '@/design-system/components'
import { PaperPlaneTilt } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { MAJELIS, rupiah } from '../lib/data'
import { collectStatus, collectedTotal, paidOf, pendingMembers, useApp, openMajelisEntry } from '../lib/store'
import { IconCheck } from '../lib/icons'
import { AppScreen, SectionTitle, ShareSheet, StickyBar } from '../lib/ui'

export function ProofWaScreen() {
  const flow = useFlow()
  const s = useApp()
  const group = openMajelisEntry(s)
  const pending = pendingMembers(s)
  const [sent, setSent] = useState(false)
  const [sharing, setSharing] = useState(false)

  // Everyone recorded gets a line; whoever is still open is named at the foot
  // rather than quietly left out.
  const lines = MAJELIS.members
    .map((m) => {
      const status = collectStatus(s, m)
      if (status === 'belum') return null
      // A mitra who has left the program carries no figure — this recap goes to
      // the whole majelis, and "Rp0" against her name reads as a woman who
      // refused to pay this morning rather than one who is no longer borrowing.
      if (status === 'keluar') return `• ${m.name} — Berhenti pinjam`
      const paid = paidOf(s, m)
      const label = status === 'lunas' ? 'Lunas' : status === 'sebagian' ? 'Sebagian' : 'Belum bayar'
      return `• ${m.name} — ${rupiah(paid)} (${label})`
    })
    .filter(Boolean)

  const message = [
    `Assalamualaikum Ibu-ibu ${group.name} 🙏`,
    ``,
    `Rekap pembayaran kumpulan ${group.day}, ${group.time}:`,
    ``,
    ...lines,
    ``,
    `Total diterima: ${rupiah(collectedTotal(s))}`,
    ...(pending.length > 0
      ? [``, `Belum tercatat: ${pending.map((m) => m.name).join(', ')}.`]
      : []),
    ``,
    `Terima kasih atas kehadirannya hari ini.`,
  ].join('\n')

  return (
    <AppScreen
      topBar={<NavigationHeader title="Kirim rekap ke grup" onBack={() => flow.back()} />}
    >
      {/* No "Pesan dikirim ke …" banner: she picks the destination in the
          share sheet, so naming one up here would pre-empt a choice the
          screen has not asked her to make yet. */}
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
            Rekap terkirim ke grup {group.name}
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
            <Button size="lg" className="w-full" onClick={() => setSharing(true)}>
              <span className="flex items-center justify-center gap-8">
                <PaperPlaneTilt size={20} />
                Kirim pesan
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
        title="Kirim rekap ke"
        targets={[{ id: 'grup', label: `Grup WhatsApp ${group.name}`, hint: `${MAJELIS.members.length} anggota` }]}
        onSend={() => {
          setSharing(false)
          setSent(true)
        }}
      />
    </AppScreen>
  )
}
