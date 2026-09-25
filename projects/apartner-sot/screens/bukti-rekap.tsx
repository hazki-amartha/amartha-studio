'use client'

// Kirim Rekap Baru — the majelis-level re-send, reached from the "Kirim Bukti
// Bayar Baru" task that appears when ops corrected a nominal on the internal
// dashboard (the `bukti` kind, gated by `showBukti`).
//
// It uses the app's "Tugas selesai → bagikan ringkasan" structure (BuktiSendScreen),
// with the group recap as the message body and the ONE corrected line marked —
// old struck, new highlighted — so the second recap reads as a correction, not a
// receipt that silently disagrees with the first.

import { BUKTI_REKAP, type RekapRow } from '../lib/bukti'
import { rupiah } from '../lib/data'
import { BuktiSendScreen, ChangedAmount, Gap } from '../lib/bukti-ui'

/** One mitra line: "Nama - Hadir: Rp…", with the corrected figure marked. */
function Row({ row }: { row: RekapRow }) {
  return (
    <span>
      • {row.name} - {row.hadir ? 'Hadir' : 'Tidak hadir'}:{' '}
      {row.was !== undefined ? <ChangedAmount was={row.was} now={row.amount} /> : rupiah(row.amount)}
      {row.promise ? `, janji bayar ${row.promise}` : ''}
    </span>
  )
}

export function BuktiRekapScreen() {
  const d = BUKTI_REKAP
  return (
    <BuktiSendScreen
      title="Bukti bayar baru"
      change={d.change}
      shareTitle="Kirim rekap ke"
      targets={[{ id: 'grup', label: `Grup WhatsApp ${d.group}`, hint: `${d.members} anggota` }]}
      sentLabel={`Rekap baru terkirim ke grup ${d.group}`}
    >
      <span>Halo Ibu-ibu {d.group},</span>
      <Gap />
      <span>Terima kasih atas kehadirannya hari ini! Berikut pembayaran yang sudah diterima:</span>
      <Gap />
      <span>Tanggal bayar: {d.date}</span>
      <span>Total dibayar: {rupiah(d.totalPaid)}</span>
      <span>Total tunggakan: {rupiah(d.totalOutstanding)}</span>
      <span>Jumlah mitra bayar: {d.mitraBayar}</span>
      <span>Jumlah mitra hadir: {d.mitraHadir}</span>
      <span>Petugas: {d.petugas}</span>
      <Gap />
      <span>Sudah bayar tunai ke petugas:</span>
      {d.tunai.rows.map((r) => (
        <Row key={r.name} row={r} />
      ))}
      <span>Total: {rupiah(d.tunai.total)}</span>
      <Gap />
      <span>Sudah bayar sendiri ke Poket:</span>
      {d.poket.rows.map((r) => (
        <Row key={r.name} row={r} />
      ))}
      <span>Total: {rupiah(d.poket.total)}</span>
      <Gap />
      <span>Belum bayar:</span>
      {d.belum.map((r) => (
        <Row key={r.name} row={r} />
      ))}
      <Gap />
      <span>
        Mohon diingat, pembayaran dan kehadiran mitra lain di majelis mempengaruhi limit Anda. Saling
        ingatkan untuk bayar tepat waktu dan hadir di kumpulan.
      </span>
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
