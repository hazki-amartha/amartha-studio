'use client'

// Home A / Home B (Final) — the "Progress limit Anda" / Majelis bonus card
// pair (Figma sections 2918:10990, 2992:39214). One screen, two stories:
// A pays late, B pays on time while other members fall behind. Each walks its
// own ten Minggu (see PATHS in lib/store.ts). Everything else (header, Poket
// widget, recommendations, nav) is unchanged from Home.

import { useEffect } from 'react'
import { NavigationBar, OfferCard } from '@/design-system/components'
import { NavIcon } from '@/design-system/assets'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { EndedCard, LoanProgressCard, MajelisProgressCard, UnlockedCard } from '../lib/progress-card'
import {
  alignToPath,
  setBonusGagal,
  setHomePath,
  setPencairanLanjutan,
  stepHomeVarD,
  useHomeVarD,
  type HomePath,
} from '../lib/store'
import { BAND_FILL, BrandBand, BrandHeader, PoketWidget } from '../lib/ui'

function HomeFinal({ path }: { path: HomePath }) {
  const flow = useFlow()
  useEffect(() => {
    setHomePath(path)
    alignToPath(path)
  }, [path])
  const { main, majelis, majelisRewardLabel, majelisRewardStrike, majelisPage } = useHomeVarD()
  const openBonus = majelisPage
    ? () => {
        setBonusGagal(false)
        flow.go('bonus-majelis')
      }
    : undefined

  return (
    <Screen
      statusBar="none"
      canvas="white"
      chromeClassName={BAND_FILL}
      topBar={<BrandHeader />}
    >
      <BrandBand>
        <PoketWidget
          balance="Rp0"
          onIsiSaldo={() => stepHomeVarD(-1, path)}
          onTransfer={() => stepHomeVarD(1, path)}
        />
      </BrandBand>

      {main.kind === 'progress' ? <LoanProgressCard data={main.data} onClick={() => flow.go('progress-limit')} /> : null}
      {main.kind === 'unlocked' ? (
        <UnlockedCard
          title={main.title}
          description={main.description}
          amount={main.amount}
          buttonLabel={main.buttonLabel}
          nextLabel={main.nextLabel}
          onButtonClick={() => {
            setPencairanLanjutan(true)
            flow.go('pencairan-form')
          }}
        />
      ) : null}

      {majelis.kind === 'progress' ? (
        <MajelisProgressCard
          data={majelis.data}
          rewardLabel={majelisRewardLabel ?? ''}
          rewardStrike={majelisRewardStrike}
          onClick={openBonus}
        />
      ) : null}
      {majelis.kind === 'unlocked' ? (
        <UnlockedCard
          compact
          onClick={openBonus}
          title={majelis.title}
          description={majelis.description}
          amount={majelis.amount}
          buttonLabel={majelis.buttonLabel}
          nextLabel={majelis.nextLabel}
        />
      ) : null}
      {majelis.kind === 'ended' ? (
        <EndedCard title={majelis.title} description={majelis.description} linkLabel={majelis.linkLabel} onClick={openBonus} />
      ) : null}

      <div className="border-t border-default" />

      <p className="text-16 font-bold text-default">Rekomendasi Untuk Anda</p>

      <OfferCard
        product="celengan"
        title="Penempatan dana dari Rp10.000"
        description="Dananya tumbuh dan bisa ditarik kapan pun."
      />
      <OfferCard
        product="amartha-link"
        title="Mulai jualan pulsa, listrik,"
        description="dengan biaya paling murah!"
      />

      <div className="sticky bottom-0 -mx-16 mt-auto">
        <NavigationBar
          items={[
            { id: 'home', label: 'Home', icon: <NavIcon name="home" active />, active: true },
            { id: 'pinjaman', label: 'Pinjaman', icon: <NavIcon name="modal" /> },
            { id: 'scan', label: 'Scan', icon: <NavIcon name="scan" /> },
            { id: 'celengan', label: 'Celengan', icon: <NavIcon name="celengan" /> },
            { id: 'transaksi', label: 'Transaksi', icon: <NavIcon name="transaction" /> },
          ]}
        />
      </div>
    </Screen>
  )
}

export function HomeVarDScreen() {
  return <HomeFinal path="a" />
}

export function HomeBScreen() {
  return <HomeFinal path="b" />
}
