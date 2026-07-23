'use client'

// Tawarkan Produk — the offer page.
//
// The counterpart to the collect page, and it exists for the same reason: the
// answer to an offer is a short conversation with its own follow-ups — what she
// said, and if it was no, why — and running that inside a card in a 22-row list
// means the list grows and reflows under the BP while she is talking. Both
// actions on a stage card now behave the same way: the card states what is at
// stake, the button opens the page that settles it, and the card comes back
// carrying the result.
//
// What it does NOT do is pitch. The page states where she stands — "Belum
// pernah menabung" — and leaves the sentence to the BP, who is the one holding
// the relationship. A script here would be read out loud by nobody.

import { useState } from 'react'
import { Badge, Button, Card, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { findMitra, rupiah } from '../lib/data'
import { store, useApp } from '../lib/store'
import { MitraPhoto } from '../lib/mitra-card'
import { ChoiceList, SectionTitle, StickyBar } from '../lib/ui'

// Why she said no. Without a reason on file every "tidak tertarik" looks the
// same, and next week's BP can't tell a settled no from a "not right now".
const DECLINE_REASONS = [
  'Belum butuh saat ini',
  'Dana belum ada',
  'Mau diskusi dulu di rumah',
  'Sudah punya di tempat lain',
]

export function OfferScreen() {
  const flow = useFlow()
  const s = useApp()

  const mitra = findMitra(s.openMitra)
  const growth = mitra.growth

  // Reopened from "Ubah", the page comes back holding what was recorded, so
  // correcting an answer is an edit rather than a re-entry.
  const [result, setResult] = useState<'ya' | 'tidak' | null>(s.growthResults[mitra.id] ?? null)
  const [reason, setReason] = useState<string | null>(s.growthReasons[mitra.id] ?? null)

  const canSave = result === 'ya' || (result === 'tidak' && reason !== null)

  function save() {
    if (!canSave || !result) return
    store.setGrowthResult(mitra.id, result, reason ?? undefined)
    flow.go('growth')
  }

  return (
    <Screen topBar={<NavigationHeader title="Tawarkan Produk" onBack={() => flow.back()} />}>
      {/* Who she is, compactly — the same block the collect page opens on. */}
      <Card>
        <div className="flex items-center gap-12">
          <MitraPhoto size={32} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-14 font-bold text-default">{mitra.name}</span>
            <span className="truncate text-12 text-caption">Pinjaman {rupiah(mitra.loan)}</span>
          </div>
          {mitra.dpd > 0 ? (
            <Badge intent={mitra.dpd >= 30 ? 'red' : 'orange'}>Menunggak {mitra.dpd} hari</Badge>
          ) : (
            <Badge intent="green">Lancar</Badge>
          )}
        </div>
      </Card>

      {growth ? (
        <>
          {/* The offer itself: what it is, what it is worth, and the fact behind
              the recommendation. Three lines, no pitch. */}
          <Card>
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-12">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="truncate text-12 text-caption">{growth.label}</span>
                  <span className="truncate text-20 font-bold text-default">{growth.value}</span>
                </div>
                <Badge intent="primary">Rekomendasi</Badge>
              </div>
              <span className="text-12 text-caption">{growth.status}</span>
            </div>
          </Card>

          <SectionTitle>Bagaimana tanggapan Ibu?</SectionTitle>

          <div className="flex flex-col gap-8">
            <SelectableCard
              name="hasil-penawaran"
              inputType="radio"
              title="Tertarik"
              description={growth.done}
              checked={result === 'ya'}
              onChange={() => {
                setResult('ya')
                setReason(null)
              }}
            />
            <SelectableCard
              name="hasil-penawaran"
              inputType="radio"
              title="Tidak tertarik"
              description="Catat alasannya"
              checked={result === 'tidak'}
              onChange={() => setResult('tidak')}
            />
          </div>

          {result === 'tidak' ? (
            <div className="pb-16">
              <ChoiceList
                label="Alasan tidak tertarik"
                options={DECLINE_REASONS}
                value={reason ?? undefined}
                onPick={setReason}
              />
            </div>
          ) : null}
        </>
      ) : null}

      <StickyBar>
        <Button size="lg" className="w-full" disabled={!canSave} onClick={save}>
          Simpan Hasil
        </Button>
      </StickyBar>
    </Screen>
  )
}
