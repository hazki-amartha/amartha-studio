'use client'

import { Card, NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { INSENTIF_BANDS, KPI_DEF, TONE_TEXT, fmt } from '../lib/data'

export function KpiInfoScreen() {
  const flow = useFlow()
  const totalWeight = KPI_DEF.flatMap((g) => g.rows).reduce((s, r) => s + (r.w ?? 0), 0)

  return (
    <Screen topBar={<NavigationHeader title="Cara perhitungan KPI" onBack={flow.back} />}>
      {/* Rumus */}
      <Card className="flex flex-col gap-8">
        <h2 className="text-14 font-bold text-default">Rumus skor</h2>
        <p className="text-12 text-neutral-700">
          Setiap parameter punya <b>target</b> dan <b>bobot</b>. Pencapaian kamu dibandingkan dengan
          target, lalu dikalikan bobotnya. Semua hasilnya dijumlahkan menjadi skor akhir.
        </p>
        <p className="rounded-8 border border-default bg-neutral-50 p-12 text-center text-12 font-bold text-default">
          Skor = Σ ( pencapaian ÷ target × bobot )
        </p>
        <p className="text-10 text-caption">
          Pencapaian per parameter dihitung maksimal 100%. Melebihi target tidak menambah poin, tapi
          tetap menjaga skor tetap penuh.
        </p>
      </Card>

      {/* Bobot tiap parameter */}
      <section className="flex flex-col gap-8">
        <h2 className="text-14 font-bold text-default">Bobot tiap parameter</h2>
        <Card flush>
          <div className="flex items-center gap-8 border-b border-default bg-neutral-50 px-12 py-8 text-10 font-bold uppercase text-caption">
            <span className="flex-1">Parameter</span>
            <span className="w-40 text-right">Target</span>
            <span className="w-40 text-right">Bobot</span>
          </div>

          {KPI_DEF.map((g) => {
            const gw = g.rows.reduce((s, r) => s + (r.w ?? 0), 0)
            return (
              <div key={g.n}>
                <div className="flex items-center gap-8 border-b border-default bg-neutral-50 px-12 py-8">
                  <span className="flex-1 text-10 font-bold uppercase text-neutral-700">{g.n}</span>
                  <span className={`text-10 font-bold ${gw > 0 ? 'text-default' : 'text-caption'}`}>
                    {gw > 0 ? `${gw}%` : 'di luar skor'}
                  </span>
                </div>
                {g.rows.map((r) => (
                  <div key={r.k} className="flex items-center gap-8 border-b border-light px-12 py-8">
                    <span className="min-w-0 flex-1 text-12 text-default">{r.n}</span>
                    <span className="w-40 text-right text-12 text-neutral-700">
                      {fmt(r.target, r.unit)}
                    </span>
                    <span
                      className={`w-40 text-right text-12 font-bold ${r.w ? 'text-default' : 'text-disabled'}`}
                    >
                      {r.w ? `${r.w}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}

          <div className="flex items-center gap-8 bg-neutral-50 px-12 py-12">
            <span className="flex-1 text-12 font-bold text-default">Total bobot</span>
            <span className="text-12 font-bold text-default">{totalWeight}%</span>
          </div>
        </Card>
      </section>

      {/* Contoh */}
      <section className="flex flex-col gap-8">
        <h2 className="text-14 font-bold text-default">Contoh</h2>
        <Card className="flex flex-col gap-8">
          <p className="text-12 text-neutral-700">
            Repayment DPD 0 punya bobot <b>30%</b> dan target <b>90%</b>. Kalau pencapaian kamu{' '}
            <b>91%</b>:
          </p>
          <p className="rounded-8 border border-default bg-neutral-50 p-12 text-12 text-default">
            91 ÷ 90 = 100% (dibatasi maks 100%)
            <br />
            100% × 30 = <b>30 poin dari 30</b>
          </p>
          <p className="text-12 text-neutral-700">
            Poin dari semua parameter dijumlahkan. Total inilah yang menentukan estimasi insentif.
          </p>
        </Card>
      </section>

      {/* Skor & insentif */}
      <section className="flex flex-col gap-8">
        <h2 className="text-14 font-bold text-default">Skor &amp; insentif</h2>
        <Card flush>
          {INSENTIF_BANDS.map((b) => (
            <div key={b.s} className="flex items-center gap-8 border-b border-light px-12 py-12">
              <span className="flex-1 text-12 text-default">{b.s}</span>
              <span className={`text-12 font-bold ${TONE_TEXT[b.tone]}`}>{b.v}</span>
            </div>
          ))}
        </Card>
      </section>

      {/* Boost */}
      <section className="flex flex-col gap-8">
        <h2 className="text-14 font-bold text-default">Insentif tambahan (boost)</h2>
        <Card>
          <p className="text-12 text-neutral-700">
            Celengan dan PPOB <b>tidak masuk hitungan skor</b> (bobotnya 0%). Keduanya adalah bonus
            terpisah: kalau targetnya tercapai, kamu dapat tambahan <b>+Rp100rb</b> di luar insentif
            di atas.
          </p>
        </Card>
      </section>

      <p className="pb-16 text-center text-10 text-disabled">
        Angka insentif di halaman ini masih placeholder — menunggu konfirmasi skema resmi.
      </p>
    </Screen>
  )
}
