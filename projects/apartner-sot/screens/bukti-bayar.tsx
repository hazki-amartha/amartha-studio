'use client'

// Kirim Bukti Bayar Baru — the mitra-level re-send, reached from the doorstep
// "Kirim Bukti Bayar Baru" task that appears when ops corrected a nominal on the
// internal dashboard (the `bukti` kind, gated by `showBukti`).
//
// Same "Tugas selesai → bagikan ringkasan" structure as the majelis re-send
// (BuktiSendScreen), plus the borrower card at the top; the corrected payment is
// marked in the receipt so the mitra's second message reads as a correction.

import { BUKTI_BAYAR } from '../lib/bukti'
import { rupiah } from '../lib/data'
import { BuktiSendScreen, ChangedAmount, Gap } from '../lib/bukti-ui'

export function BuktiBayarScreen() {
  const d = BUKTI_BAYAR
  return (
    <BuktiSendScreen
      title="Bukti bayar baru"
      mitra={{ name: d.mitra, product: d.product, phone: d.phone }}
      change={{ subject: `Ibu ${d.mitra}`, was: d.was, now: d.amount }}
      shareTitle="Kirim bukti bayar ke"
      targets={[{ id: 'mitra', label: `Ibu ${d.mitra}`, hint: 'Chat WhatsApp pribadi' }]}
      sentLabel={`Bukti bayar baru terkirim ke Ibu ${d.mitra}`}
    >
      <span>Halo Ibu {d.mitra},</span>
      <Gap />
      <span>
        Terima kasih, ya, pembayaran tunai Ibu sudah diterima petugas {d.petugas}. Berikut detailnya:
      </span>
      <Gap />
      <span>Tanggal bayar: {d.date}</span>
      <span>
        Jumlah dibayar: <ChangedAmount was={d.was} now={d.amount} />
        {d.partial ? ' (bayar sebagian)' : ''}
      </span>
      <span>Sisa tunggakan: {rupiah(d.sisa)}</span>
      <Gap />
      <span>Jika ada yang tidak sesuai, hubungi manajer cabang di {d.branchPhone}.</span>
      <Gap />
      <span>Task ID: {d.taskId}</span>
      <Gap />
      <span>Salam,</span>
      <span>Amartha</span>
    </BuktiSendScreen>
  )
}
