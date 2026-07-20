'use client'

import { useState } from 'react'
import { Badge, Button, Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import {
  MAJELIS,
  PRODUCT,
  TONE_BADGE,
  TYPE_BADGE,
  attendanceRate,
  capitalPath,
  genAttendance,
  genInstallments,
  hashOf,
  limitOutlook,
  loanStatus,
  mitraContact,
  recsFor,
  rp,
  type CapitalStep,
  type Rec,
} from '../lib/data'
import { IconCal, IconCheck, IconChart, IconChat, IconChevR, IconDoc, IconPin, IconShield, IconUser, IconX } from '../lib/icons'
import { selectedMitra, store, useApp } from '../lib/store'
import { Avatar, ProgressBar } from '../lib/ui'

const EVAL_DATE = '31 Des 2026'
const DISB_ELIGIBLE_DATE = '31 Agu 2026'

type View = 'main' | 'profil'

export function MitraDetailScreen() {
  const flow = useFlow()
  const s = useApp()
  const m = selectedMitra(s)
  const g = MAJELIS.find((x) => x.n === m.m) ?? MAJELIS[0]

  const [view, setView] = useState<View>('main')
  const [taken, setTaken] = useState<string[]>([])

  const st = loanStatus(m)
  const installments = m.pending ? [] : genInstallments(m)
  const next = installments.find((x) => x.status === 'upcoming')
  const outlook = m.pending ? null : limitOutlook(m, g)
  const attendance = m.pending ? [] : genAttendance(m)
  const contact = mitraContact(m)
  const path = m.pending ? [] : capitalPath(m, g)

  const activeAll = s.tasks.filter((t) => t.who === m.n)
  const hvTask = activeAll.find((t) => t.act === 'Kunjungan Rumah')
  const activeNonHV = activeAll.filter((t) => t.act !== 'Kunjungan Rumah')
  const recs = recsFor(m).filter((r) => !taken.includes(r.id))

  const hasCelengan = m.prod.includes('celengan')
  const hasInsurance = m.prod.includes('insurance')
  const celenganAmt = hasCelengan ? (100 + (hashOf(m.n) % 90) * 10) * 1000 : 0

  const outstandingLoans = m.pending ? 0 : 1
  const outstandingAmt = installments.filter((x) => x.status !== 'ontime').reduce((sum, x) => sum + x.amt, 0)

  function take(r: Rec) {
    store.addTask({
      id: `${r.id}-${taken.length}`,
      act: r.act,
      who: m.n,
      maj: m.m,
      time: 'Belum dijadwalkan',
      loc: g.area,
      types: r.types,
      meta: r.why,
      day: 0,
      kind: 'rekomendasi',
    })
    setTaken((prev) => [...prev, r.id])
  }

  function startHV() {
    if (!hvTask) return
    store.set({ selMajelis: m.m })
    store.openHomeVisit(hvTask.id, m.n)
    flow.go('home-visit')
  }

  if (view === 'profil') {
    return (
      <Screen topBar={<NavigationHeader title="Profil Mitra" onBack={() => setView('main')} />}>
        {/* Identity + loan */}
        <Card>
          <div className="flex items-center gap-12">
            <Avatar tone="neutral" size={48}>
              {m.n.charAt(0)}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-12 text-caption">
                {m.ketua ? <b className="text-primary-600">Ketua Majelis · </b> : null}
                {m.m} · {g.area}
              </p>
              <p className="text-16 font-bold text-default">{m.p}</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Badge intent={st.intent}>{st.l}</Badge>
            {m.keringanan ? <Badge intent="orange">Dapat Keringanan</Badge> : null}
          </div>

          <div className="mt-12 flex items-start gap-8 border-t border-light pt-12">
            <span className="mt-2 shrink-0 text-disabled">
              <IconPin size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-10 text-disabled">Alamat rumah</p>
              <p className="mt-2 break-words text-12 text-default">{contact.addr}</p>
            </div>
            <button type="button" className="mt-2 shrink-0 text-12 font-bold text-link">
              Buka peta
            </button>
          </div>

          <div className="mt-12 flex items-center gap-8 border-t border-light pt-12">
            <span className="shrink-0 text-disabled">
              <IconChat size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-10 text-disabled">Nomor HP</p>
              <p className="mt-2 text-12 text-default">{contact.phone}</p>
            </div>
            <button type="button" className="shrink-0 text-12 font-bold text-link">
              Chat WhatsApp
            </button>
          </div>

          {m.pic ? (
            <div className="mt-12 flex items-center gap-8 border-t border-light pt-12">
              <span className="shrink-0 text-disabled">
                <IconUser size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-12 font-bold text-default">{m.pic.n}</p>
                <p className="text-10 text-disabled">Kontak darurat · {m.pic.rel}</p>
              </div>
              <Button variant="ghost" size="xs">
                Hubungi
              </Button>
            </div>
          ) : null}
        </Card>

        {/* Pinjaman aktif */}
        {!m.pending ? (
          <section className="flex flex-col gap-8">
            <div className="flex items-center gap-8">
              <h2 className="flex-1 text-14 font-bold text-default">Pinjaman aktif</h2>
              <button type="button" className="text-12 font-bold text-link">
                Lihat detail
              </button>
            </div>
            <p className="text-12 text-caption">
              {next ? `Jatuh tempo berikutnya: ${next.label} · ${rp(next.amt)}` : 'Tidak ada cicilan mendatang'}
            </p>

            <Card className="flex items-center gap-12">
              <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-8 bg-primary-50 text-primary-500">
                <IconDoc size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-12 text-caption">Pinjaman aktif berjalan</p>
                <p className="mt-2 text-16 font-bold text-default">{outstandingLoans} pinjaman</p>
              </div>
              <div className="text-right">
                <p className="text-10 text-disabled">Sisa tagihan</p>
                <p className="mt-2 text-14 font-bold text-default">{rp(outstandingAmt)}</p>
              </div>
            </Card>

            <Card flush>
              {installments.slice(-3).map((x, i) => (
                <div key={x.no} className={`flex items-center gap-8 px-12 py-8 ${i === 0 ? '' : 'border-t border-light'}`}>
                  <span className="w-20 text-12 text-disabled">{x.no}</span>
                  <span className="flex-1 text-12 text-default">{x.label}</span>
                  <span className="text-12 text-neutral-700">{rp(x.amt)}</span>
                  <Badge intent={x.status === 'ontime' ? 'green' : x.status === 'late' ? 'red' : 'neutral'}>
                    {x.status === 'ontime' ? 'Lunas' : x.status === 'late' ? 'Telat' : 'Belum jatuh tempo'}
                  </Badge>
                </div>
              ))}
            </Card>
          </section>
        ) : null}

        {/* Potensi pencairan tambahan */}
        {outlook ? (
          <section className="flex flex-col gap-8">
            <h2 className="text-14 font-bold text-default">Potensi pencairan tambahan</h2>
            <Card className="border-primary-200 bg-primary-50">
              <p className="text-12 text-neutral-700">
                Jika <b>{m.n}</b> membayar rutin sampai <b>{DISB_ELIGIBLE_DATE}</b>, ia dapat mencairkan tambahan hingga
              </p>
              <p className="mt-4 text-20 font-bold text-primary-600">{rp(1250000)}</p>
            </Card>
          </section>
        ) : null}

        {/* Progress limit */}
        <section className="flex flex-col gap-8">
          <h2 className="text-14 font-bold text-default">Progress limit</h2>
          {outlook ? (
            <Card flush>
              <div className="bg-primary-50 p-12">
                <div className="flex items-end gap-8">
                  <div className="flex-1">
                    <p className="text-10 font-bold uppercase tracking-wide text-primary-600">Limit sekarang</p>
                    <p className="mt-2 text-16 font-bold text-default">{rp(outlook.current)}</p>
                  </div>
                  <IconChevR size={16} className="text-primary-400" />
                  <div className="flex-1 text-right">
                    <p className="text-10 font-bold uppercase tracking-wide text-primary-600">Bisa naik hingga</p>
                    <p className="mt-2 text-16 font-bold text-primary-600">{rp(outlook.ceiling)}</p>
                  </div>
                </div>
                <p className="mt-8 text-10 text-primary-600">
                  Kenaikan tidak dijamin — tergantung pola di bawah. Estimasi, bukan angka pasti.
                </p>
              </div>

              <div className="flex items-center gap-8 border-b border-light bg-neutral-50 px-12 py-8">
                <IconCal size={16} className="text-disabled" />
                <p className="flex-1 text-10 text-caption">
                  Evaluasi limit akan dilakukan pada <b className="text-default">{EVAL_DATE}</b>
                </p>
              </div>

              <div className="px-12 pb-12 pt-4">
                {outlook.factors.map((f) => (
                  <div key={f.k} className="flex items-center gap-8 border-b border-light py-8">
                    <span
                      className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full ${
                        f.ok ? 'bg-green-50' : 'bg-neutral-200'
                      }`}
                    >
                      {f.ok ? <IconCheck size={16} className="text-green-600" /> : <span className="h-8 w-8 rounded-full bg-neutral-500" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-12 font-bold text-default">{f.l}</p>
                      <p className="mt-2 text-10 text-disabled">{f.detail}</p>
                    </div>
                  </div>
                ))}

                <div className="mt-8 flex items-center gap-8">
                  <Badge intent={TONE_BADGE[outlook.status.tone]}>{outlook.status.l}</Badge>
                  <span className="flex-1 text-12 text-neutral-700">
                    {outlook.status.tone === 'on'
                      ? 'Kalau pola ini dijaga, limit berpeluang naik cycle depan.'
                      : outlook.status.tone === 'warn'
                        ? 'Perbaiki faktor di atas untuk memperbesar peluang naik.'
                        : 'Beberapa faktor perlu diperbaiki sebelum limit bisa naik.'}
                  </span>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="border-dashed text-center">
              <p className="text-12 text-caption">Progress limit akan muncul setelah pencairan pertama.</p>
            </Card>
          )}
        </section>

        {/* Jalur Naik Modal */}
        {path.length > 0 ? <CapitalPath steps={path} /> : null}

        {/* Kehadiran kumpulan */}
        {!m.pending ? (
          <section className="flex flex-col gap-4">
            <h2 className="text-14 font-bold text-default">Kehadiran kumpulan</h2>
            <p className="text-12 text-caption">
              {attendanceRate(m)}% hadir · {attendance.filter((a) => a.hadir).length} dari {attendance.length} sesi terakhir
            </p>
            <Card>
              <div className="flex justify-between gap-4">
                {attendance.map((a) => (
                  <div key={a.label} className="flex-1 text-center">
                    <span
                      className={`mx-auto flex h-32 w-32 items-center justify-center rounded-full ${
                        a.hadir ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      {a.hadir ? <IconCheck size={16} className="text-green-600" /> : <IconX size={16} className="text-red-500" />}
                    </span>
                    <p className="mt-4 text-10 text-disabled">{a.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        ) : null}

        {/* Produk lain */}
        <section className="flex flex-col gap-8 pb-16">
          <h2 className="text-14 font-bold text-default">Produk lain</h2>
          <Card flush>
            <div className="flex items-center gap-12 border-b border-light px-12 py-12">
              <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-8 bg-green-50">
                <IconChart size={20} className="text-green-600" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-14 font-bold text-default">Celengan</p>
                <p className="mt-2 text-10 text-disabled">{hasCelengan ? 'Saldo simpanan' : 'Belum punya simpanan'}</p>
              </div>
              {hasCelengan ? (
                <span className="text-14 font-bold text-green-600">{rp(celenganAmt)}</span>
              ) : (
                <Badge intent="neutral">Belum ada</Badge>
              )}
            </div>
            <div className="flex items-center gap-12 px-12 py-12">
              <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-8 bg-blue-50">
                <IconShield size={20} className="text-blue-500" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-14 font-bold text-default">Asuransi Mikro</p>
                <p className="mt-2 text-10 text-disabled">{hasInsurance ? 'Proteksi aktif' : 'Belum ada proteksi'}</p>
              </div>
              <Badge intent={hasInsurance ? 'green' : 'neutral'}>{hasInsurance ? 'Aktif' : 'Tidak aktif'}</Badge>
            </div>
          </Card>
        </section>
      </Screen>
    )
  }

  return (
    <Screen topBar={<NavigationHeader title={m.n} onBack={flow.back} />}>
      {/* Profile preview — a full-bleed header band (edge to edge, flush under
          the nav bar) so it reads as the mitra's header rather than one more
          card in the task stack. Taps through to the full profile. */}
      <button
        type="button"
        onClick={() => setView('profil')}
        className="-mx-16 -mt-16 border-b border-default bg-neutral-white px-16 py-16 text-left"
      >
        <div className="flex items-center gap-8">
          <Avatar tone={m.ketua ? 'primary' : 'neutral'} size={48}>
            {m.n.charAt(0)}
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-14 font-bold text-default">{m.n}</span>
              {m.ketua ? <Badge intent="primary">Ketua</Badge> : null}
            </div>
            <p className="mt-2 text-12 text-caption">
              {m.m} · {g.area}
            </p>
            <p className={`mt-2 text-12 ${m.pending ? 'font-bold text-blue-700' : m.dpd > 0 ? 'font-bold text-red-500' : 'text-caption'}`}>
              {m.pending ? 'Pengajuan baru · belum verifikasi SLIK' : m.dpd > 0 ? `DPD ${m.dpd} · ${m.p}` : `${m.p} · Lancar`}
            </p>
          </div>
          <span className="shrink-0 text-12 font-bold text-link">Profil</span>
        </div>
        {m.prod.length > 0 ? (
          <div className="mt-12 flex flex-wrap gap-4">
            {m.prod.map((p) => (
              <Badge key={p} intent={PRODUCT[p].intent}>
                {PRODUCT[p].l}
              </Badge>
            ))}
          </div>
        ) : null}
      </button>

      {/* Tugas aktif — HV task excluded; it gets its own launcher below */}
      <section className="flex flex-col gap-8">
        <div className="flex items-center gap-8">
          <h2 className="flex-1 text-14 font-bold text-default">Tugas aktif</h2>
          <span className="text-12 text-caption">{activeNonHV.length + (hvTask ? 1 : 0)}</span>
        </div>

        {activeNonHV.length === 0 && !hvTask ? (
          <Card className="border-dashed text-center">
            <p className="text-12 text-caption">Belum ada tugas aktif untuk mitra ini.</p>
          </Card>
        ) : activeNonHV.length > 0 ? (
          <ul className="flex flex-col gap-8">
            {activeNonHV.map((t) => (
              <li key={t.id}>
                <Card>
                  <div className="flex flex-wrap gap-4">
                    {t.types.map((k) => (
                      <Badge key={k} intent={TYPE_BADGE[k]}>
                        {k}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-8 text-14 font-bold text-default">{t.act}</p>
                  <p className="mt-2 text-12 text-caption">{t.time}</p>
                  {t.meta ? <p className="mt-4 text-12 font-bold text-orange-700">{t.meta}</p> : null}
                </Card>
              </li>
            ))}
          </ul>
        ) : null}

        {hvTask ? (
          <div className="flex items-center gap-8 rounded-12 border border-primary-200 bg-primary-50 px-12 py-12">
            <div className="min-w-0 flex-1">
              <p className="text-14 font-bold text-primary-600">Kunjungan Rumah</p>
              <p className="mt-2 text-10 text-caption">
                {hvTask.time}
                {hvTask.meta ? ` · ${hvTask.meta}` : ''}
              </p>
            </div>
            <Button size="sm" onClick={startHV}>
              Mulai kunjungan
            </Button>
          </div>
        ) : null}
      </section>

      {/* Rekomendasi tugas */}
      <section className="flex flex-col gap-8 pb-16">
        <div>
          <h2 className="text-14 font-bold text-default">Rekomendasi tugas</h2>
          <p className="text-12 text-caption">Berdasarkan status pinjaman &amp; produk mitra ini.</p>
        </div>

        {recs.length === 0 ? (
          <Card className="text-center">
            <p className="text-12 text-caption">Semua rekomendasi sudah dijadikan tugas.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-8">
            {recs.map((r) => (
              <li key={r.id}>
                <Card className="flex flex-col gap-8">
                  <div className="flex flex-wrap gap-4">
                    {r.types.map((k) => (
                      <Badge key={k} intent={TYPE_BADGE[k]}>
                        {k}
                      </Badge>
                    ))}
                  </div>
                  <div>
                    <p className="text-14 font-bold text-default">{r.act}</p>
                    <p className="text-12 text-caption">{r.why}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => take(r)}>
                    + Jadikan tugas
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {taken.length > 0 ? (
          <div className="flex items-center gap-8 rounded-8 bg-green-50 px-12 py-8 text-12 text-green-600">
            <IconCheck size={16} />
            <span className="flex-1">{taken.length} tugas ditambahkan ke Tugas hari ini</span>
          </div>
        ) : null}
      </section>
    </Screen>
  )
}

// --- Jalur Naik Modal ------------------------------------------------------
// A vertical milestone timeline: a rail of nodes (done / current / future) with
// a card each. It reframes the loan cycle as a path to bigger capital — the same
// hedged framing as Progress limit, never a promise.
function CapitalPath({ steps }: { steps: CapitalStep[] }) {
  return (
    <section className="flex flex-col gap-8">
      <div>
        <h2 className="text-14 font-bold text-default">Jalur Naik Modal</h2>
        <p className="text-12 text-caption">Disiplin hari ini, modal lebih besar menanti.</p>
      </div>

      <div className="flex flex-col">
        {steps.map((st, i) => {
          const last = i === steps.length - 1
          const node =
            st.status === 'done'
              ? 'bg-green-500 text-neutral-white'
              : st.status === 'current'
                ? 'bg-primary-500 text-neutral-white'
                : 'bg-neutral-200 text-neutral-600'
          return (
            <div key={st.months} className="flex gap-12">
              <div className="flex flex-col items-center">
                <span className={`flex h-32 w-32 shrink-0 items-center justify-center rounded-full text-12 font-bold ${node}`}>
                  {st.status === 'done' ? <IconCheck size={16} /> : i + 1}
                </span>
                {!last ? (
                  <span className={`w-2 flex-1 ${st.status === 'done' ? 'bg-green-500' : 'bg-neutral-200'}`} />
                ) : null}
              </div>

              <div className={`min-w-0 flex-1 ${last ? '' : 'pb-12'}`}>
                <Card className={st.status === 'current' ? 'border-primary-500' : undefined}>
                  <div className="flex flex-wrap items-center gap-8">
                    <span className="text-16 font-bold text-default">{st.months} Bulan</span>
                    <span className="rounded-full bg-primary-50 px-8 py-2 text-10 font-bold uppercase text-primary-600">
                      {st.badge}
                    </span>
                  </div>
                  <p className="mt-4 text-12 text-caption">{st.desc}</p>
                  {st.amount != null ? (
                    <p className="mt-2 text-18 font-bold text-primary-600">
                      {st.kind === 'limit' ? rp(st.amount) : `+${rp(st.amount)}`}
                    </p>
                  ) : null}
                  {st.status === 'done' ? (
                    <p className="mt-4 text-12 font-bold text-green-600">Selesai pada {st.doneDate}</p>
                  ) : st.status === 'current' ? (
                    <div className="mt-8">
                      <p className="mb-4 text-12 text-caption">{st.weeksLeft} minggu tersisa</p>
                      <ProgressBar value={st.progress ?? 0} />
                    </div>
                  ) : null}
                </Card>
              </div>
            </div>
          )
        })}
      </div>

      <Card className="flex items-center gap-8 border-primary-200 bg-primary-50">
        <span className="shrink-0 text-primary-600">
          <IconChart size={20} />
        </span>
        <p className="text-12 text-primary-600">
          Setiap pembayaran tepat waktu dan kehadiran kumpulan membuat Ibu semakin dekat ke modal yang lebih besar.
        </p>
      </Card>
    </section>
  )
}
