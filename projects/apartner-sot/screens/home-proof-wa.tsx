'use client'

// Tugas selesai — after "Selesaikan Tugas" on a home visit. Per the BP APP 2026
// Figma: the visit is saved, and the BP checks the summary message before
// sending it to the mitra. The message is editable ("ubah jika belum") and has
// two variants — money received, or a visit with a janji bayar instead.
//
// Nothing leaves the prototype: "Kirim ke WhatsApp" and "Tutup" both return to
// Tugas, where the snackbar confirms the task was saved.

import { useState } from 'react'
import { Button } from '@/design-system/components'
import { CheckCircleFill, Cross, WhatsappLogo } from '@/design-system/icons'
import { TopBar } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { ptpLabelOf } from '../lib/collect-options'
import { outstandingOf, rupiah } from '../lib/data'
import { BP, DAYS } from '../lib/schedule'
import { openHomeMitra, paidOf, store, useApp } from '../lib/store'
import { AppScreen, StickyBar } from '../lib/ui'

const YEAR = '2026'
const BRANCH_MANAGER_PHONE = '081212345678'
const TASK_ID = 'MV-88213-0727'

const PAY_LABEL: Record<string, string> = {
  penuh: 'Bayar penuh',
  sebagian: 'Bayar jumlah lain',
  dini: 'Pelunasan dini',
}

export function HomeProofWaScreen() {
  const flow = useFlow()
  const s = useApp()
  const mitra = openHomeMitra(s)

  const paid = s.metWith[mitra.id] === 'nobody' ? 0 : paidOf(s, mitra)
  const owed = outstandingOf(mitra).total
  const ptp = s.partialPtp[mitra.id] ?? s.nonPayments[mitra.id]?.ptp
  const ptpLabel = ptp ? ptpLabelOf(ptp)?.replace(' Juli', ` Juli ${YEAR}`) : undefined
  const today = `${DAYS[0].date} ${YEAR}`
  const payLabel = PAY_LABEL[s.payMode[mitra.id] ?? ''] ?? 'Bayar'

  const initial =
    paid > 0
      ? [
          `Halo Ibu ${mitra.name},`,
          '',
          `Terima kasih, ya, pembayaran tunai Ibu sudah diterima petugas ${BP.name}. Berikut detailnya:`,
          '',
          `Tanggal bayar: ${today}`,
          `Jumlah dibayar: ${rupiah(paid)} (${payLabel})`,
          ...(owed - paid > 0 ? [`Sisa tunggakan: ${rupiah(owed - paid)}`] : []),
          '',
          `Jika ada yang tidak sesuai, hubungi manajer cabang di ${BRANCH_MANAGER_PHONE}.`,
          '',
          `Task ID: ${TASK_ID}`,
          '',
          'Salam,',
          'Amartha',
        ]
      : [
          `Halo Ibu ${mitra.name},`,
          '',
          `Terima kasih atas waktu dan niat baik Ibu menemui petugas ${BP.name} hari ini. Berikut detailnya:`,
          '',
          `Tanggal kunjungan: ${today}`,
          `Tunggakan: ${rupiah(owed)}`,
          ...(ptpLabel ? [`Janji bayar: ${ptpLabel}`] : []),
          ...(ptpLabel
            ? ['', `Petugas akan menghubungi Ibu untuk membantu menepati janji ini, ya.`]
            : []),
          '',
          'Salam,',
          'Amartha',
        ]
  const [message, setMessage] = useState(initial.join('\n'))

  function close() {
    store.showFlash('Tugas berhasil disimpan.')
    flow.go('today')
  }

  return (
    <AppScreen
      className="bg-neutral-white"
      topBar={
        <TopBar>
          <button type="button" aria-label="Tutup" onClick={close} className="text-default">
            <Cross size={24} />
          </button>
        </TopBar>
      }
    >
      <div className="flex flex-col items-center gap-8 pt-8 text-center">
        {/* The Figma's celebration artwork is not in the design system. */}
        <span className="flex h-64 w-64 items-center justify-center rounded-full bg-green-50 text-green-500">
          <CheckCircleFill size={24} />
        </span>
        <span className="text-20 font-bold text-default">Tugas selesai</span>
        <span className="text-14 text-caption">
          Bagikan ringkasan kunjungan ke mitra lewat WhatsApp atau SMS.
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <span className="text-14 font-bold text-default">Cek isi pesan</span>
        <span className="text-12 text-caption">Pastikan info sudah sesuai, ubah jika belum.</span>
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={16}
        aria-label="Isi pesan"
        className="w-full resize-none rounded-12 border border-default p-12 text-14 text-default outline-none focus:border-primary-500"
      />

      <StickyBar>
        <Button size="lg" className="w-full" onClick={close}>
          <span className="flex items-center justify-center gap-8">
            <WhatsappLogo size={20} />
            Kirim ke WhatsApp
          </span>
        </Button>
        <Button size="lg" variant="ghost" className="w-full" onClick={close}>
          Tutup
        </Button>
      </StickyBar>
    </AppScreen>
  )
}
