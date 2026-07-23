'use client'

// Six ways to pay, deliberately flat rather than grouped.
//
// Poket is first and carries its balance inline, because it is the only method
// that can fail for a reason the app already knows about — and finding that out
// here, rather than after picking it, is what the shortfall branch exists to
// avoid. The other five are ranked by how many mitra can actually reach them,
// with cash-at-a-counter last but never hidden behind a "lainnya".

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { METHODS, rupiah, type MethodId } from '../lib/data'
import { IconAgent, methodIcon } from '../lib/method-icons'
import { store, useApp } from '../lib/store'
import { FullWidthButton, IconTile, OptionCard, StickyBar } from '../lib/ui'

export function MethodScreen() {
  const flow = useFlow()
  const s = useApp()

  const next = () => {
    if (s.method === 'poket') {
      flow.go(s.poketBalance >= s.amount ? 'poket-confirm' : 'poket-shortfall')
    } else {
      flow.go('instruction')
    }
  }

  return (
    <Screen topBar={<NavigationHeader title="Metode pembayaran" onBack={() => flow.go('amount')} />}>
      <div className="flex items-center gap-12">
        <div className="min-w-0 flex-1">
          <div className="text-12 text-primary-500">Total pembayaran</div>
          <div className="mt-4 text-20 font-bold text-default">{rupiah(s.amount)}</div>
        </div>
        <button
          type="button"
          onClick={() => flow.go('amount')}
          className="shrink-0 text-12 font-bold text-primary-500"
        >
          Ubah
        </button>
      </div>

      <div className="flex flex-col gap-12 pb-16">
        {METHODS.map((m) => (
          <OptionCard
            key={m.id}
            selected={s.method === m.id}
            onClick={() => store.setMethod(m.id as MethodId)}
            leading={
              <IconTile tint={m.id === 'amartha-link' ? 'green' : 'primary'}>
                {m.id === 'amartha-link' ? <IconAgent size={20} /> : methodIcon(m.id, 20)}
              </IconTile>
            }
            title={
              <span className="flex items-center gap-8">
                {m.name}
                {m.badge ? (
                  <span className="rounded-full bg-primary-50 px-8 py-2 text-10 font-bold text-primary-500">
                    {m.badge}
                  </span>
                ) : null}
              </span>
            }
            description={
              m.id === 'poket' ? (
                <>
                  Saldo:{' '}
                  <span className="font-bold text-default">{rupiah(s.poketBalance)}</span>
                </>
              ) : (
                m.sub
              )
            }
          />
        ))}
      </div>

      <StickyBar>
        <FullWidthButton disabled={!s.method} onClick={next}>
          Lanjut
        </FullWidthButton>
      </StickyBar>
    </Screen>
  )
}
