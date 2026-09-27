'use client'

// Setor pembayaran — the New Concept's front door, reached from the Setor
// button on the schedule.
//
// The difference from the older Setoran screen is what it asks FIRST. That one
// opened on the picker: every source of cash, ticked, waiting to be read before
// she could get to the method. This one assumes the common case — the whole bag
// goes down — states the figure once, and asks the only question left: which
// road. Splitting the handover is "Ubah" on the figure itself, because it is
// the rarer answer and it costs a page rather than a screenful of checkboxes on
// the way to the road.
//
// "Setor" does not go straight to the road. Making the numbers commits this
// handover — it takes one of the day's three — so a sheet asks first, then the
// page waits on the branch (the loader) and either lands on the road or on the
// error page. Loader and error are phases of THIS screen rather than screens of
// their own, so Back from the road never walks her into a spinner again.

import { useEffect, useState } from 'react'
import { BottomSheet, Button, NavigationHeader } from '@/design-system/components'
import { GearSix, MapPin, NotePencilPaper, RpHistory, Warning } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { AGENT, TASKS } from '../lib/schedule'
import { SetorSummary } from '../lib/setor'
import { store, unsettledEntries, unsettledTotal, useApp } from '../lib/store'
import { AppScreen, OptionCard, SectionTitle, StickyBar } from '../lib/ui'

export function SetorPaymentScreen() {
  const flow = useFlow()
  const s = useApp()

  const entries = unsettledEntries(s)
  // What she is settling: whatever the partial page left behind, or the whole
  // bag when she has not been there.
  const amount = s.depositAmount ?? unsettledTotal(s)
  const no = s.settlements.length + 1

  const kindOf = (taskId: string) => TASKS.find((t) => t.id === taskId)?.kind
  const pelayanan = entries.filter((e) => kindOf(e.taskId) === 'majelis').length
  const homeVisit = entries.filter((e) => kindOf(e.taskId) === 'home-visit').length

  const [confirming, setConfirming] = useState(false)
  const [phase, setPhase] = useState<'form' | 'loading' | 'error'>('form')

  // The wait on the branch. Short in the prototype — long enough to be seen.
  useEffect(() => {
    if (phase !== 'loading') return
    const t = setTimeout(() => {
      if (s.setorFail) {
        setPhase('error')
        return
      }
      const method = s.depositMethod ?? 'va'
      store.startSetor(method, amount)
      setPhase('form')
      flow.go(method === 'agent' ? 'setor-agen' : 'setor-va')
    }, 1500)
    return () => clearTimeout(t)
  }, [phase, s.setorFail, s.depositMethod, amount, flow])

  const header = (
    <NavigationHeader
      title="Setor pembayaran"
      onBack={() => flow.back()}
      trailingIcons={
        phase === 'form'
          ? [
              <button
                key="riwayat"
                type="button"
                aria-label="Riwayat pembayaran"
                onClick={() => flow.go('setor-riwayat')}
              >
                <RpHistory size={24} />
              </button>,
            ]
          : undefined
      }
    />
  )

  if (phase === 'loading') {
    return (
      <AppScreen topBar={header}>
        <div className="flex flex-1 flex-col items-center justify-center gap-12 px-16 text-center">
          <span className="flex items-center gap-4">
            <span className="h-8 w-8 rounded-full bg-primary-500" />
            <span className="h-8 w-8 rounded-full bg-primary-200" />
            <span className="h-8 w-8 rounded-full bg-primary-200" />
          </span>
          <span className="text-12 text-caption">
            Sedang membuat data. Tunggu sekitar 30 detik, ya...
          </span>
        </div>
      </AppScreen>
    )
  }

  if (phase === 'error') {
    return (
      <AppScreen topBar={header}>
        <div className="flex flex-1 flex-col items-center justify-center gap-12 px-16 text-center">
          <span className="relative flex h-120 w-120 items-center justify-center rounded-full bg-primary-50 text-primary-500">
            <GearSix size={24} />
            <span className="absolute right-24 top-24 text-orange-500">
              <Warning size={20} />
            </span>
          </span>
          <span className="text-16 font-bold text-default">Maaf, ada sedikit gangguan</span>
          <span className="text-12 text-caption">
            Coba lagi, ya. Jika masih butuh bantuan, hubungi <b className="font-bold">PST</b>.
          </span>
          <Button
            className="w-full"
            onClick={() => {
              // One failure is the demo; the retry goes through.
              store.setSetorFail(false)
              setPhase('loading')
            }}
          >
            Coba Lagi
          </Button>
        </div>
      </AppScreen>
    )
  }

  return (
    <AppScreen topBar={header}>
      <SetorSummary
        no={no}
        amount={amount}
        pelayanan={pelayanan}
        homeVisit={homeVisit}
        onEdit={() => flow.go('setor-partial')}
      />

      {/* --- Which road. Just the choice: the numbers each road settles to
          live on the road's own page, where she is actually paying them. */}
      <SectionTitle>Pilih metode pembayaran</SectionTitle>
      <div className="flex flex-col gap-8">
        <OptionCard
          selected={s.depositMethod === 'agent'}
          title={`Agen ${AGENT.name}`}
          description="Setor tunai ke agen terdekat pakai kode unik"
          onSelect={() => store.setDepositMethod('agent')}
        >
          {/* Where to walk the cash to is a question she may want answered
              BEFORE she commits to this road at all — there has to be a counter
              on her route for it to be the right one. */}
          <button
            type="button"
            onClick={() => flow.go('agent-locator')}
            className="flex items-center justify-center gap-4 rounded-full border border-primary-500 py-8 text-12 font-bold text-primary-500"
          >
            <MapPin size={16} />
            Cari Agen Terdekat
          </button>
        </OptionCard>

        <OptionCard
          selected={s.depositMethod === 'va'}
          title="Virtual Account"
          description="Setor lewat mobile banking ke 2 VA cabang"
          onSelect={() => store.setDepositMethod('va')}
        />
      </div>

      <StickyBar>
        <Button
          size="lg"
          className="w-full"
          disabled={!s.depositMethod || amount <= 0}
          onClick={() => setConfirming(true)}
        >
          Setor {rupiah(amount)}
        </Button>
      </StickyBar>

      <BottomSheet
        open={confirming}
        onClose={() => setConfirming(false)}
        hideClose
        slotPosition="above"
        slot={
          <span className="flex h-120 items-center justify-center rounded-16 bg-primary-50 text-primary-500">
            <NotePencilPaper size={24} />
          </span>
        }
        title={`Siap setor ${rupiah(amount)} sekarang?`}
        description="Lanjutkan hanya jika jumlahnya sudah sesuai dan Anda siap langsung setor."
        primaryAction={
          <Button
            className="w-full"
            onClick={() => {
              setConfirming(false)
              setPhase('loading')
            }}
          >
            Ya, Setor Sekarang
          </Button>
        }
        secondaryAction={
          <Button variant="outline" className="w-full" onClick={() => setConfirming(false)}>
            Setor Nanti
          </Button>
        }
      />
    </AppScreen>
  )
}
