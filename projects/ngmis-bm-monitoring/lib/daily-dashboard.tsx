'use client'

// Progres harian's body — ported from ngmis-bm-monitoring-v2's Daily Monitoring
// dashboard (§1: copied, not imported): the full Tugas/Pembayaran/Setor tunai/
// Pencairan scorecard, and the real briefing flow (Mulai Briefing goes to the
// morning/evening form, Riwayat briefing goes to the history table).
//
// The heading and banner follow the studio's own reference design rather than
// v2's: a plain "Progres harian" + refreshed-timestamp strip (the same shape
// every other tab uses — see branch-summary-page.tsx, which skips its shared
// scope line for this tab so the fact isn't said twice), and a single-row
// tinted banner instead of v2's bordered card.

import { useFlow } from '@/platform/runtime'
import { Button } from '@/design-system/components'
import { ArrowRight, History } from '@/design-system/icons'
import { MoonGlyph, SunGlyph } from './daily-ui'
import { Scorecard } from './daily-scorecard'
import { BRIEFING_LABEL, type BriefingKind } from './daily-data'
import { isDraftStarted, useFlowState } from './daily-store'
import { UPDATE_BAR } from './data'

export function DailyDashboard() {
  const flow = useFlow()
  const { scheduled, submitted, drafts } = useFlowState()

  // The banner only appears while the scheduled briefing is due and unsent; once
  // the BM has started filling it in, the CTA becomes "Lanjutkan …".
  const showBanner = !submitted[scheduled]
  const inProgress = isDraftStarted(drafts[scheduled])

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-16 pb-16">
        <span className="flex items-center gap-16">
          <span className="text-16 font-bold text-default">Progres harian</span>
          <button
            type="button"
            onClick={() => flow.go('briefing-history')}
            className="flex items-center gap-4 text-14 font-bold text-link active:opacity-70"
          >
            <History size={16} /> Riwayat briefing
          </button>
        </span>
        <span className="text-12 text-caption">{UPDATE_BAR.refreshed}</span>
      </div>

      {showBanner ? (
        <div className="pb-16">
          <BriefingBanner
            kind={scheduled}
            inProgress={inProgress}
            onStart={() => flow.go(`briefing-${scheduled}`)}
          />
        </div>
      ) : null}

      <Scorecard />
    </>
  )
}

/** A single tinted row, not a bordered card: icon + copy on the left, the CTA
 *  on the right. Blue for the morning briefing, primary for the evening one —
 *  the CTA itself stays the brand primary either way, the only allowed action
 *  colour. */
function BriefingBanner({
  kind,
  inProgress,
  onStart,
}: {
  kind: BriefingKind
  inProgress: boolean
  onStart: () => void
}) {
  const morning = kind === 'morning'
  const label = BRIEFING_LABEL[kind]
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-16 rounded-12 p-16 ${
        morning ? 'bg-blue-50' : 'bg-primary-50'
      }`}
    >
      <div className="flex items-center gap-12">
        <span className={morning ? 'text-blue-500' : 'text-primary-500'}>
          {morning ? <SunGlyph /> : <MoonGlyph />}
        </span>
        <span className="flex flex-col gap-2">
          <span className="text-16 font-bold text-default">{label}</span>
          <span className="text-12 text-caption">
            {inProgress
              ? 'Briefing tersimpan sebagian. Lanjutkan dan kirim.'
              : `Beri tahu tim Anda tentang target dan rencana hari ini. Mulai briefing ${
                  morning ? 'pagi' : 'sore'
                } sekarang.`}
          </span>
        </span>
      </div>
      <Button variant="primary" size="md" onClick={onStart}>
        <span className="flex items-center gap-8">
          {inProgress ? `Lanjutkan ${label}` : `Mulai ${label}`}
          <ArrowRight size={16} />
        </span>
      </Button>
    </div>
  )
}
