'use client'

// Majelis — the group as a shared obligation, seen from inside it.
//
// The screen opens with what the mitra can DO about the group this week, not
// with a roster. That ordering is deliberate: she is the ketua, the group's
// condition is partly hers to fix, and a list of names with red badges is a
// diagnosis without a treatment. The roster sits underneath as the evidence.

import { NavigationHeader } from '@/design-system/components'
import { WhatsappLogo } from '@/design-system/icons'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MEMBERS } from '../lib/data'
import { store } from '../lib/store'
import { SectionTitle, StatRow } from '../lib/ui'

const WA_GROUP = 'Grup WhatsApp Majelis Melati 07'

export function MajelisScreen() {
  const flow = useFlow()

  const total = MEMBERS.length
  const hadir = MEMBERS.filter((m) => m.hadir).length
  const bayar = MEMBERS.filter((m) => m.bayar).length
  const issues = total - hadir + (total - bayar)

  const overall =
    issues === 0
      ? { text: 'Semua lancar 🎉', tone: 'bg-green-50 text-green-500' }
      : issues <= 2
        ? { text: 'Cukup baik', tone: 'bg-orange-50 text-orange-700' }
        : { text: 'Butuh perhatian', tone: 'bg-red-50 text-red-500' }

  const remind = (message: string) => {
    store.composeReminder(WA_GROUP, message)
    flow.go('whatsapp-reminder')
  }

  return (
    <Screen
      topBar={<NavigationHeader title="Majelis Melati 07" onBack={() => flow.go('home')} />}
    >
      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <div className="flex items-center gap-12 border-b border-light pb-12">
          <p className="flex-1 text-12 font-bold text-default">Kondisi majelis minggu ini</p>
          <span className={`rounded-full px-12 py-4 text-12 font-bold ${overall.tone}`}>
            {overall.text}
          </span>
        </div>

        <p className="mt-16 text-12 font-bold text-default">Yang bisa dilakukan minggu ini</p>
        <ActionRow
          emoji="📅"
          text="Ingatkan jadwal kumpulan"
          onRemind={() =>
            remind(
              'Ibu-ibu sekalian, besok Selasa kita akan kumpulan. Mohon hadir tepat waktu ya jam 11.30 pagi.',
            )
          }
        />
        <ActionRow
          border
          emoji="⚠️"
          text="Ingatkan Ibu Nur dan Yulianti untuk bayar."
          onRemind={() =>
            remind(
              'Ibu Nur dan Ibu Yulianti, jangan lupa bayar angsuran minggu ini ya. Terima kasih 🙏',
            )
          }
        />
      </div>

      <SectionTitle>Anggota ({MEMBERS.length})</SectionTitle>

      <button
        type="button"
        className="flex items-center gap-12 rounded-12 border border-neutral-400 bg-neutral-50 p-12 text-left"
      >
        <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-primary-50 text-18 font-bold text-primary-500">
          +
        </span>
        <span className="text-14 font-bold text-primary-500">Undang anggota baru</span>
      </button>

      <div className="rounded-12 border border-default bg-neutral-white px-16">
        {MEMBERS.map((m, i) => (
          <div
            key={m.initials}
            className={`flex items-center gap-12 py-12 ${i === 0 ? '' : 'border-t border-light'}`}
          >
            <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-12 font-bold text-primary-500">
              {m.initials}
            </span>
            <span className="min-w-0 flex-1 text-14 font-bold text-default">{m.name}</span>
            <span className="flex shrink-0 flex-col items-end gap-4">
              <MemberBadge ok={m.hadir} okLabel="Hadir" failLabel="Tidak hadir" />
              <MemberBadge ok={m.bayar} okLabel="Sudah bayar" failLabel="Belum bayar" />
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-12 border border-default bg-neutral-white p-16">
        <p className="mb-8 text-10 font-bold uppercase text-caption">Info majelis</p>
        <StatRow label="Petugas Ibu" value="Fadhil Maulana" border />
        <StatRow label="Jadwal kumpulan" value="Senin, 11.30 – 12.00" border />
        <StatRow label="Lokasi kumpulan" value="Jl. Melati No. 7" border />
        <StatRow label="Ketua majelis" value="Ibu Siti (Anda) 👑" />
      </div>

      <div className="flex items-center gap-12 pb-16">
        <div className="min-w-0 flex-1">
          <p className="text-12 text-caption">Grup WhatsApp</p>
          <p className="mt-2 text-14 font-bold text-default">Info &amp; pengingat kumpulan</p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-full border border-primary-500 bg-neutral-white px-16 py-8 text-12 font-bold text-primary-500"
        >
          Gabung grup
        </button>
      </div>
    </Screen>
  )
}

function ActionRow({
  emoji,
  text,
  border,
  onRemind,
}: {
  emoji: string
  text: string
  border?: boolean
  onRemind: () => void
}) {
  return (
    <div className={`flex items-center gap-8 py-12 ${border ? 'border-t border-light' : ''}`}>
      <span className="shrink-0 text-16">{emoji}</span>
      <p className="min-w-0 flex-1 text-12 text-caption">{text}</p>
      <button
        type="button"
        onClick={onRemind}
        className="flex shrink-0 items-center gap-4 rounded-full border border-green-500 bg-green-50 px-12 py-8 text-12 font-bold text-green-600"
      >
        <WhatsappLogo size={16} /> Ingatkan
      </button>
    </div>
  )
}

function MemberBadge({
  ok,
  okLabel,
  failLabel,
}: {
  ok: boolean
  okLabel: string
  failLabel: string
}) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-8 py-2 text-10 font-bold ${
        ok ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
      }`}
    >
      {ok ? okLabel : failLabel}
    </span>
  )
}
