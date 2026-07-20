'use client'

/* Kunjungan Rumah (home visit) — branching wizard mirroring the team's
   flowchart: arrive → can meet mitra? → present (pay now? full/partial/PTP, or
   reason → commit PTP, or Peldis DPD 60+) OR not present (meet PJ →
   money/PTP, else meet neighbours, else record no-one). Captures reasons + PTP
   and creates follow-up tasks (next-week HV, relocation, death verification). */

import { useState } from 'react'
import { Button, Card, Input } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { MAJELIS, MITRA, genInstallments, loanStatus, parseRp, ptpOptions, rp, type Task, type TaskKind } from '../lib/data'
import { IconCal, IconCheck, IconUser, IconX } from '../lib/icons'
import { store, useApp } from '../lib/store'
import { ChipPicker, FlowQuestion, SegmentedChoice } from '../lib/ui'

const PAY_REASONS = [
  { l: 'Sakit', note: 'Sementara — mitra kemungkinan masih bisa bayar.' },
  { l: 'Usaha bangkrut', note: 'Sinyal untuk verifikasi BP / reKYB / monitoring usaha.' },
  { l: 'Ganti usaha', note: 'Sinyal untuk verifikasi BP / reKYB / monitoring usaha.' },
  { l: 'Lainnya', note: 'Direkam sebagai catatan tambahan.' },
]

const ABSENT_REASONS = [
  { l: 'Pindah rumah / kabur', note: 'Rekam alamat baru bila diketahui; jika tidak, sistem membuat tugas pelacakan relokasi.', task: 'relokasi', addr: true },
  { l: 'Sedang bekerja', note: 'Sementara — pola waktu dicatat agar HV berikutnya dijadwalkan di jam berbeda.' },
  { l: 'Keluar rumah tanpa pemberitahuan', note: 'Masih tinggal di rumah — dicatat untuk pemantauan.' },
  { l: 'Meninggal dunia', note: 'Sistem membuat tugas verifikasi meninggal.', task: 'meninggal' },
  { l: 'Lainnya', note: 'Direkam sebagai catatan tambahan.' },
]

interface Draft {
  met: string | null
  canPay: string | null
  payKind: string | null
  cashValue: string
  payReason: string | null
  payReasonOther: string
  ptp: string | null
  ptpDay: number | null
  commitPtp: string | null
  peldis: string | null
  metPj: string | null
  absentReason: string | null
  absentReasonOther: string
  newAddr: string
  pjTitip: string | null
  pjPayKind: string | null
  pjCash: string
  pjPtp: string | null
  pjPtpDay: number | null
  pjCommit: string | null
  metNeighbour: string | null
}

const EMPTY_DRAFT: Draft = {
  met: null,
  canPay: null,
  payKind: null,
  cashValue: '',
  payReason: null,
  payReasonOther: '',
  ptp: null,
  ptpDay: null,
  commitPtp: null,
  peldis: null,
  metPj: null,
  absentReason: null,
  absentReasonOther: '',
  newAddr: '',
  pjTitip: null,
  pjPayKind: null,
  pjCash: '',
  pjPtp: null,
  pjPtpDay: null,
  pjCommit: null,
  metNeighbour: null,
}

interface Outcome {
  title: string
  tone: 'red' | 'orange' | 'green' | 'primary'
  detail: string
  tasks?: Task[]
}

export function KunjunganRumahScreen() {
  const flow = useFlow()
  const s = useApp()
  const m = MITRA.find((x) => x.n === s.selMitra) ?? MITRA[0]
  const g = MAJELIS.find((x) => x.n === m.m) ?? MAJELIS[0]
  const task = s.tasks.find((t) => t.id === s.hvTaskId) ?? null
  const st = loanStatus(m)

  const inst = m.pending ? [] : genInstallments(m)
  const due = inst.find((x) => x.status !== 'ontime')
  const dueAmt = due ? due.amt : 0
  const lastPaid = [...inst].reverse().find((x) => x.status === 'ontime')
  const eligiblePeldis = m.dpd >= 60
  const pj = m.pic ?? { n: 'Penanggung jawab', phone: '-', rel: 'PJ' }

  const [result, setResult] = useState<Outcome | null>(null)
  const [d, setDraftRaw] = useState<Draft>(EMPTY_DRAFT)
  const set = (patch: Partial<Draft>) => setDraftRaw((prev) => ({ ...prev, ...patch }))

  const ptps = ptpOptions()
  const absentSel = ABSENT_REASONS.find((r) => r.l === d.absentReason)
  const reasonLabel = (r: string | null, other: string) => (r === 'Lainnya' ? other || 'Lainnya' : (r ?? ''))

  function mkHV(day: number, time: string, meta: string, kind: TaskKind = 'wajib'): Task {
    return {
      id: `hv-${m.n}-${day}-${time}`,
      act: 'Kunjungan Rumah',
      who: m.n,
      maj: m.m,
      time,
      loc: g.area,
      types: ['Collection'],
      meta,
      day,
      kind,
    }
  }

  function absentTasks(): Task[] {
    if (!absentSel || !absentSel.task) return []
    if (absentSel.task === 'relokasi' && d.newAddr) return []
    const act = absentSel.task === 'meninggal' ? 'Verifikasi Meninggal' : 'Pelacakan Relokasi'
    return [
      {
        id: `${absentSel.task}-${m.n}`,
        act,
        who: m.n,
        maj: m.m,
        time: 'Perlu tindak lanjut',
        loc: g.area,
        types: ['Collection'],
        meta: absentSel.l,
        day: 1,
        kind: 'wajib',
      },
    ]
  }

  /** Compute the outcome from the current draft. `ready` means enough has been
   *  answered to submit; `res` is what submit() records. */
  function outcome(): { ready: boolean; res?: Outcome } {
    if (d.met === 'present') {
      if (d.canPay === 'yes') {
        if (d.payKind === 'full') {
          return { ready: true, res: { title: 'Pembayaran penuh diterima', tone: 'green', detail: `${m.n} membayar ${rp(dueAmt)} tunai.` } }
        }
        if (d.payKind === 'partial') {
          if (!d.cashValue || !d.payReason || !d.ptp) return { ready: false }
          return {
            ready: true,
            res: {
              title: 'Bayar sebagian + PTP',
              tone: 'orange',
              detail: `Dibayar ${rp(Number(d.cashValue) || 0)}, sisa pada ${d.ptp}. Alasan: ${reasonLabel(d.payReason, d.payReasonOther)}.`,
              tasks: d.ptpDay != null ? [mkHV(d.ptpDay, `PTP ${d.ptp}`, `Janji bayar ${d.ptp} · ${reasonLabel(d.payReason, d.payReasonOther)}`)] : [],
            },
          }
        }
        return { ready: false }
      }
      if (d.canPay === 'no') {
        if (!d.payReason) return { ready: false }
        if (d.commitPtp === 'yes') {
          if (!d.ptp || d.ptpDay == null) return { ready: false }
          return {
            ready: true,
            res: {
              title: 'Janji bayar direkam',
              tone: 'primary',
              detail: `Janji bayar pada ${d.ptp}. Alasan: ${reasonLabel(d.payReason, d.payReasonOther)}.`,
              tasks: [mkHV(d.ptpDay, `PTP ${d.ptp}`, `Janji bayar ${d.ptp} · ${reasonLabel(d.payReason, d.payReasonOther)}`)],
            },
          }
        }
        if (d.commitPtp === 'no') {
          if (eligiblePeldis) {
            if (d.peldis === 'yes') {
              return {
                ready: true,
                res: {
                  title: 'Peldis diajukan',
                  tone: 'green',
                  detail: `${m.n} tertarik Peldis. Pengajuan diteruskan ke BM → HO.`,
                  tasks: [
                    {
                      id: `peldis-${m.n}`,
                      act: 'Ajukan Peldis ke BM',
                      who: m.n,
                      maj: m.m,
                      time: 'Hari ini',
                      loc: g.area,
                      types: ['Collection'],
                      meta: `Peldis · DPD ${m.dpd}`,
                      day: 0,
                      kind: 'wajib',
                    },
                  ],
                },
              }
            }
            if (d.peldis === 'no') {
              return {
                ready: true,
                res: {
                  title: 'Peldis belum diambil',
                  tone: 'orange',
                  detail: 'Data direkam. Terus ditagih, HV dijadwalkan ulang minggu depan.',
                  tasks: [mkHV(7, 'Minggu depan', 'Peldis ditolak · lanjut tagih')],
                },
              }
            }
            return { ready: false }
          }
          return {
            ready: true,
            res: {
              title: 'Belum ada komitmen bayar',
              tone: 'orange',
              detail: `Alasan: ${reasonLabel(d.payReason, d.payReasonOther)}. Data direkam, HV dijadwalkan ulang minggu depan.`,
              tasks: [mkHV(7, 'Minggu depan', `Belum komitmen · ${reasonLabel(d.payReason, d.payReasonOther)}`)],
            },
          }
        }
        return { ready: false }
      }
      return { ready: false }
    }
    if (d.met === 'absent') {
      if (d.metPj === 'yes') {
        if (!d.absentReason || (d.absentReason === 'Lainnya' && !d.absentReasonOther)) return { ready: false }
        if (d.pjTitip === 'yes') {
          if (d.pjPayKind === 'full') {
            return {
              ready: true,
              res: {
                title: 'Titipan penuh via PJ',
                tone: 'green',
                detail: `${pj.n} menyerahkan titipan penuh ${rp(dueAmt)}. Alasan tidak hadir: ${reasonLabel(d.absentReason, d.absentReasonOther)}.`,
                tasks: absentTasks(),
              },
            }
          }
          if (d.pjPayKind === 'partial') {
            if (!d.pjCash || !d.pjPtp || d.pjPtpDay == null) return { ready: false }
            return {
              ready: true,
              res: {
                title: 'Titipan sebagian + PTP PJ',
                tone: 'orange',
                detail: `Dititip ${rp(Number(d.pjCash) || 0)}, sisa pada ${d.pjPtp}. Alasan tidak hadir: ${reasonLabel(d.absentReason, d.absentReasonOther)}.`,
                tasks: [mkHV(d.pjPtpDay, `PTP ${d.pjPtp}`, `PJ janji bayar ${d.pjPtp}`), ...absentTasks()],
              },
            }
          }
          return { ready: false }
        }
        if (d.pjTitip === 'no') {
          if (d.pjCommit === 'commit') {
            if (!d.pjPtp || d.pjPtpDay == null) return { ready: false }
            return {
              ready: true,
              res: {
                title: 'PTP dari PJ direkam',
                tone: 'orange',
                detail: `PJ berjanji bayar pada ${d.pjPtp}. Alasan tidak hadir: ${reasonLabel(d.absentReason, d.absentReasonOther)}.`,
                tasks: [mkHV(d.pjPtpDay, `PTP ${d.pjPtp}`, `PJ janji bayar ${d.pjPtp}`), ...absentTasks()],
              },
            }
          }
          if (d.pjCommit === 'nocommit') {
            return {
              ready: true,
              res: {
                title: 'PJ tidak bisa komitmen',
                tone: 'red',
                detail: `Tidak ada pembayaran & tidak ada PTP. Alasan tidak hadir: ${reasonLabel(d.absentReason, d.absentReasonOther)}.`,
                tasks: [mkHV(7, 'Minggu depan', 'Tanpa PTP · via PJ'), ...absentTasks()],
              },
            }
          }
          return { ready: false }
        }
        return { ready: false }
      }
      if (d.metPj === 'no') {
        if (d.metNeighbour === 'yes') {
          if (!d.absentReason || (d.absentReason === 'Lainnya' && !d.absentReasonOther)) return { ready: false }
          return {
            ready: true,
            res: {
              title: 'Info dari tetangga direkam',
              tone: 'orange',
              detail: `Alasan tidak hadir: ${reasonLabel(d.absentReason, d.absentReasonOther)}.`,
              tasks: absentTasks(),
            },
          }
        }
        if (d.metNeighbour === 'no') {
          return {
            ready: true,
            res: {
              title: 'Tidak bertemu siapa pun',
              tone: 'red',
              detail: `${m.n} tidak ada dan tak ada yang bisa ditemui. HV dijadwalkan ulang minggu depan.`,
              tasks: [mkHV(7, 'Minggu depan', 'Tidak bertemu siapa pun')],
            },
          }
        }
        return { ready: false }
      }
      return { ready: false }
    }
    return { ready: false }
  }

  const { ready, res } = outcome()

  function submit() {
    if (!ready || !res) return
    ;(res.tasks ?? []).forEach((t) => store.addTask(t))
    setResult(res)
  }

  const header = (
    <header className="flex items-center gap-8 border-b border-default bg-neutral-white px-16 py-12">
      <button type="button" onClick={flow.back} className="-ml-4 flex shrink-0 text-default">
        <IconX size={24} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-16 font-bold text-default">Kunjungan Rumah</p>
        <p className="text-12 text-caption">
          {m.n} · {g.area}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          store.set({ selMitra: m.n, selMajelis: m.m })
          flow.go('mitra-detail')
        }}
        className="flex shrink-0 items-center gap-4 rounded-full border border-primary-200 bg-primary-50 px-10 py-6 text-10 font-bold text-primary-600"
      >
        <IconUser size={16} />
        Mitra
      </button>
    </header>
  )

  if (result) {
    const toneClasses: Record<Outcome['tone'], string> = {
      red: 'bg-red-50 text-red-500',
      orange: 'bg-orange-50 text-orange-700',
      green: 'bg-green-50 text-green-600',
      primary: 'bg-primary-50 text-primary-600',
    }
    return (
      <Screen topBar={header}>
        <div className="flex flex-col items-center py-16 text-center">
          <span className={`mb-12 flex h-56 w-56 items-center justify-center rounded-full ${toneClasses[result.tone]}`}>
            <IconCheck size={24} />
          </span>
          <p className="text-16 font-bold text-default">{result.title}</p>
          <p className="mt-6 max-w-[280px] text-12 text-caption">{result.detail}</p>

          {result.tasks && result.tasks.length > 0 ? (
            <Card className="mt-16 w-full text-left">
              <p className="mb-8 text-10 font-bold text-disabled">TUGAS OTOMATIS DIBUAT</p>
              {result.tasks.map((t) => (
                <div key={t.id} className="mt-6 flex items-center gap-8">
                  <IconCal size={16} className="text-primary-600" />
                  <span className="flex-1 text-12 text-default">
                    {t.act} · {t.time}
                  </span>
                </div>
              ))}
            </Card>
          ) : null}

          <Button className="mt-20 w-full" onClick={flow.back}>
            Selesai kunjungan
          </Button>
        </div>
      </Screen>
    )
  }

  return (
    <Screen topBar={header}>
      <Card className="flex flex-col gap-8">
        <p className="text-14 font-bold text-default">{m.n}</p>
        <p className={`text-12 ${!m.pending && m.dpd > 0 ? 'text-red-500' : 'text-caption'}`}>
          {m.pending ? 'Pengajuan baru' : `DPD ${m.dpd} · tagihan ${rp(dueAmt)}`}
        </p>
        <div className="flex flex-col gap-6 border-t border-light pt-10">
          <div className="flex justify-between text-12">
            <span className="text-caption">Janji bayar terakhir (PTP)</span>
            <span className="font-bold text-default">{task?.time?.startsWith('PTP') ? task.time.replace('PTP ', '') : 'Belum ada'}</span>
          </div>
          <div className="flex justify-between text-12">
            <span className="text-caption">Pembayaran terakhir</span>
            <span className="font-bold text-default">{lastPaid ? `${lastPaid.label} · ${rp(lastPaid.amt)}` : 'Belum ada'}</span>
          </div>
        </div>
      </Card>

      <FlowQuestion title="Bisa bertemu mitra?" sub={`Apakah kamu berhasil menemui ${m.n}?`}>
        <SegmentedChoice
          options={[
            { l: 'Ya, bertemu', v: 'present' },
            { l: 'Tidak ada', v: 'absent' },
          ]}
          value={d.met}
          onPick={(v) => set({ met: v })}
        />
      </FlowQuestion>

      {/* ============ PRESENT branch ============ */}
      {d.met === 'present' ? (
        <FlowQuestion title="Bisa bayar sekarang?" sub={`Tagihan ${rp(dueAmt)} · DPD ${m.dpd}`}>
          <SegmentedChoice
            options={[
              { l: 'Bisa bayar', v: 'yes' },
              { l: 'Belum bisa', v: 'no' },
            ]}
            value={d.canPay}
            onPick={(v) => set({ canPay: v })}
          />
        </FlowQuestion>
      ) : null}

      {d.met === 'present' && d.canPay === 'yes' ? (
        <FlowQuestion title="Penuh atau sebagian?">
          <SegmentedChoice
            options={[
              { l: `Penuh · ${rp(dueAmt)}`, v: 'full' },
              { l: 'Sebagian', v: 'partial' },
            ]}
            value={d.payKind}
            onPick={(v) => set({ payKind: v })}
          />
          {d.payKind === 'partial' ? (
            <Input
              className="mt-8"
              prefix="Rp"
              placeholder="Jumlah dibayar"
              inputMode="numeric"
              value={d.cashValue ? Number(d.cashValue).toLocaleString('id-ID') : ''}
              onChange={(e) => set({ cashValue: e.target.value.replace(/[^\d]/g, '') })}
            />
          ) : null}
        </FlowQuestion>
      ) : null}

      {d.met === 'present' && d.canPay === 'yes' && d.payKind === 'partial' ? (
        <>
          <FlowQuestion title="Alasan belum bisa penuh">
            <ChipPicker options={PAY_REASONS.map((r) => ({ l: r.l, v: r.l }))} value={d.payReason} onPick={(v) => set({ payReason: v })} />
            {d.payReason === 'Lainnya' ? (
              <Input className="mt-8" placeholder="Tulis alasan lain" value={d.payReasonOther} onChange={(e) => set({ payReasonOther: e.target.value })} />
            ) : null}
          </FlowQuestion>
          <FlowQuestion title="Janji bayar sisa (PTP)" sub={`Sudah bayar ${rp(Number(d.cashValue) || 0)}. Kapan sisanya dilunasi?`}>
            <ChipPicker
              options={ptps.map((o) => ({ l: `${o.l} (${o.date})`, v: o.date }))}
              value={d.ptp}
              onPick={(v) => {
                const opt = ptps.find((o) => o.date === v)
                set({ ptp: v, ptpDay: opt?.day ?? null })
              }}
            />
          </FlowQuestion>
        </>
      ) : null}

      {d.met === 'present' && d.canPay === 'no' ? (
        <FlowQuestion title="Alasan belum bisa bayar">
          <ChipPicker options={PAY_REASONS.map((r) => ({ l: r.l, v: r.l }))} value={d.payReason} onPick={(v) => set({ payReason: v })} />
          {d.payReason === 'Lainnya' ? (
            <Input className="mt-8" placeholder="Tulis alasan lain" value={d.payReasonOther} onChange={(e) => set({ payReasonOther: e.target.value })} />
          ) : null}
        </FlowQuestion>
      ) : null}

      {d.met === 'present' && d.canPay === 'no' && d.payReason ? (
        <FlowQuestion title="Bisa berjanji bayar (PTP)?">
          <SegmentedChoice
            options={[
              { l: 'Ya, komitmen PTP', v: 'yes' },
              { l: 'Tidak bisa', v: 'no' },
            ]}
            value={d.commitPtp}
            onPick={(v) => set({ commitPtp: v })}
          />
        </FlowQuestion>
      ) : null}

      {d.met === 'present' && d.canPay === 'no' && d.commitPtp === 'yes' ? (
        <FlowQuestion title="Kapan mitra berjanji bayar?">
          <ChipPicker
            options={ptps.map((o) => ({ l: `${o.l} (${o.date})`, v: o.date }))}
            value={d.ptp}
            onPick={(v) => {
              const opt = ptps.find((o) => o.date === v)
              set({ ptp: v, ptpDay: opt?.day ?? null })
            }}
          />
        </FlowQuestion>
      ) : null}

      {d.met === 'present' && d.canPay === 'no' && d.commitPtp === 'no' && eligiblePeldis ? (
        <FlowQuestion title="Tawarkan Peldis (DPD 60+)" sub={`Mitra DPD ${m.dpd} berhak Peldis — cukup bayar pokok untuk melunasi. Ajukan ke BM → HO.`}>
          <SegmentedChoice
            options={[
              { l: 'Tertarik lunasi', v: 'yes' },
              { l: 'Belum tertarik', v: 'no' },
            ]}
            value={d.peldis}
            onPick={(v) => set({ peldis: v })}
          />
        </FlowQuestion>
      ) : null}

      {/* ============ ABSENT branch ============ */}
      {d.met === 'absent' ? (
        <FlowQuestion title="Bisa bertemu penanggung jawab (PJ)?" sub={`${m.n} tidak ada. PJ: ${pj.n}${pj.rel ? ` · ${pj.rel}` : ''}.`}>
          <SegmentedChoice
            options={[
              { l: 'Ya, bertemu PJ', v: 'yes' },
              { l: 'Tidak', v: 'no' },
            ]}
            value={d.metPj}
            onPick={(v) => set({ metPj: v })}
          />
        </FlowQuestion>
      ) : null}

      {d.met === 'absent' && d.metPj === 'yes' ? (
        <FlowQuestion title="Alasan mitra tidak ada">
          <ChipPicker options={ABSENT_REASONS.map((r) => ({ l: r.l, v: r.l }))} value={d.absentReason} onPick={(v) => set({ absentReason: v })} />
          {absentSel?.note ? <p className="mt-8 text-10 text-caption">{absentSel.note}</p> : null}
          {d.absentReason === 'Lainnya' ? (
            <Input className="mt-8" placeholder="Tulis alasan lain" value={d.absentReasonOther} onChange={(e) => set({ absentReasonOther: e.target.value })} />
          ) : null}
          {absentSel?.addr ? (
            <Input className="mt-8" placeholder="Alamat baru (jika diketahui)" value={d.newAddr} onChange={(e) => set({ newAddr: e.target.value })} />
          ) : null}
        </FlowQuestion>
      ) : null}

      {d.met === 'absent' && d.metPj === 'yes' && d.absentReason && !(d.absentReason === 'Lainnya' && !d.absentReasonOther) ? (
        <FlowQuestion title="Mitra menitip uang ke PJ?">
          <SegmentedChoice
            options={[
              { l: 'Ya, ada titipan', v: 'yes' },
              { l: 'Tidak ada', v: 'no' },
            ]}
            value={d.pjTitip}
            onPick={(v) => set({ pjTitip: v })}
          />
        </FlowQuestion>
      ) : null}

      {d.met === 'absent' && d.metPj === 'yes' && d.pjTitip === 'yes' ? (
        <FlowQuestion title="Titipan penuh atau sebagian?">
          <SegmentedChoice
            options={[
              { l: `Penuh · ${rp(dueAmt)}`, v: 'full' },
              { l: 'Sebagian', v: 'partial' },
            ]}
            value={d.pjPayKind}
            onPick={(v) => set({ pjPayKind: v })}
          />
          {d.pjPayKind === 'partial' ? (
            <Input
              className="mt-8"
              prefix="Rp"
              placeholder="Jumlah dititip"
              inputMode="numeric"
              value={d.pjCash ? Number(d.pjCash).toLocaleString('id-ID') : ''}
              onChange={(e) => set({ pjCash: e.target.value.replace(/[^\d]/g, '') })}
            />
          ) : null}
        </FlowQuestion>
      ) : null}

      {d.met === 'absent' && d.metPj === 'yes' && d.pjTitip === 'yes' && d.pjPayKind === 'partial' ? (
        <FlowQuestion title="Janji bayar sisa dari PJ" sub={`Dititip ${rp(Number(d.pjCash) || 0)}. Kapan sisanya dilunasi?`}>
          <ChipPicker
            options={ptps.map((o) => ({ l: `${o.l} (${o.date})`, v: o.date }))}
            value={d.pjPtp}
            onPick={(v) => {
              const opt = ptps.find((o) => o.date === v)
              set({ pjPtp: v, pjPtpDay: opt?.day ?? null })
            }}
          />
        </FlowQuestion>
      ) : null}

      {d.met === 'absent' && d.metPj === 'yes' && d.pjTitip === 'no' ? (
        <FlowQuestion title="PJ bisa berjanji bayar?">
          <SegmentedChoice
            options={[
              { l: 'Ya, komitmen PTP', v: 'commit' },
              { l: 'Tidak bisa', v: 'nocommit' },
            ]}
            value={d.pjCommit}
            onPick={(v) => set({ pjCommit: v })}
          />
        </FlowQuestion>
      ) : null}

      {d.met === 'absent' && d.metPj === 'yes' && d.pjTitip === 'no' && d.pjCommit === 'commit' ? (
        <FlowQuestion title="Kapan PJ berjanji bayar?">
          <ChipPicker
            options={ptps.map((o) => ({ l: `${o.l} (${o.date})`, v: o.date }))}
            value={d.pjPtp}
            onPick={(v) => {
              const opt = ptps.find((o) => o.date === v)
              set({ pjPtp: v, pjPtpDay: opt?.day ?? null })
            }}
          />
        </FlowQuestion>
      ) : null}

      {/* absent + no PJ → neighbour */}
      {d.met === 'absent' && d.metPj === 'no' ? (
        <FlowQuestion title="Bisa bertemu tetangga?" sub="Coba tanyakan keberadaan mitra ke tetangga.">
          <SegmentedChoice
            options={[
              { l: 'Ya, bertemu', v: 'yes' },
              { l: 'Tidak ada siapa pun', v: 'no' },
            ]}
            value={d.metNeighbour}
            onPick={(v) => set({ metNeighbour: v })}
          />
        </FlowQuestion>
      ) : null}

      {d.met === 'absent' && d.metPj === 'no' && d.metNeighbour === 'yes' ? (
        <FlowQuestion title="Alasan mitra tidak ada (info tetangga)">
          <ChipPicker options={ABSENT_REASONS.map((r) => ({ l: r.l, v: r.l }))} value={d.absentReason} onPick={(v) => set({ absentReason: v })} />
          {absentSel?.note ? <p className="mt-8 text-10 text-caption">{absentSel.note}</p> : null}
          {d.absentReason === 'Lainnya' ? (
            <Input className="mt-8" placeholder="Tulis alasan lain" value={d.absentReasonOther} onChange={(e) => set({ absentReasonOther: e.target.value })} />
          ) : null}
          {absentSel?.addr ? (
            <Input className="mt-8" placeholder="Alamat baru (jika diketahui)" value={d.newAddr} onChange={(e) => set({ newAddr: e.target.value })} />
          ) : null}
        </FlowQuestion>
      ) : null}

      {d.ptp || d.pjPtp ? (
        <div className="rounded-8 border border-primary-200 bg-primary-50 px-12 py-10">
          <p className="text-10 text-primary-600">
            Tugas <b>Kunjungan Rumah</b> otomatis dibuat sistem pada tanggal PTP.
          </p>
        </div>
      ) : null}

      <div className="sticky bottom-0 -mx-16 mt-auto flex flex-col gap-6 border-t border-default bg-neutral-white px-16 py-10">
        <Button disabled={!ready} onClick={submit}>
          Selesai kunjungan
        </Button>
        {!ready ? <p className="text-center text-10 text-disabled">Lengkapi jawaban di atas untuk menyelesaikan.</p> : null}
      </div>
    </Screen>
  )
}
