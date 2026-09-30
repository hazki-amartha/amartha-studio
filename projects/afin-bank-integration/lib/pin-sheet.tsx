'use client'

// The account-PIN sheet that authorises a transaction from the account (PRD F).
// In production it is the bank's webview; drawn in AmarthaFin styling because
// the product is white-labelled. What an entry returns is whatever the
// presenter set beside the device — a wrong PIN resets to correct, so the
// retry goes through.

import { useEffect, useState } from 'react'
import { BottomSheet, Button } from '@/design-system/components'
import { LockKey } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { store } from './store'
import { ACCOUNT_NAME, CodeBoxes, Keypad } from './ui'

export function PinSheet({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const flow = useFlow()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    if (pin.length !== 6) return
    const t = setTimeout(() => {
      const result = store.get().pin
      if (result === 'correct') {
        onSuccess()
      } else if (result === 'wrong') {
        setError('PIN salah. Sisa 2 kesempatan lagi.')
        store.set({ pin: 'correct' })
      } else {
        setLocked(true)
      }
      setPin('')
    }, 300)
    return () => clearTimeout(t)
  }, [pin, onSuccess])

  const resetPin = () => {
    store.set({ pinFlow: 'reset', pin: 'correct' })
    flow.go('pin-reset')
  }

  if (locked) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title="PIN terkunci sementara"
        description="Anda salah memasukkan PIN 3 kali. Atur ulang PIN untuk bertransaksi lagi, atau coba lagi dalam 1 jam."
        slot={
          <div className="flex justify-center py-8">
            <span className="flex h-64 w-64 items-center justify-center rounded-full bg-red-50 text-red-500">
              <LockKey size={24} />
            </span>
          </div>
        }
        slotPosition="above"
        primaryAction={
          <Button variant="primary" size="lg" className="w-full" onClick={resetPin}>
            Atur Ulang PIN
          </Button>
        }
      />
    )
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Masukkan PIN"
      description={`PIN 6 angka ${ACCOUNT_NAME}, bukan PIN AmarthaFin.`}
      slot={
        <div className="flex flex-col gap-12">
          <CodeBoxes value={pin} masked />
          {error ? <p className="text-center text-12 text-red-500">{error}</p> : null}
          <button type="button" onClick={resetPin} className="text-center text-14 font-bold text-link">
            Lupa PIN?
          </button>
          <Keypad
            onDigit={(d) => {
              setError(null)
              setPin((p) => (p.length < 6 ? p + d : p))
            }}
            onDelete={() => setPin((p) => p.slice(0, -1))}
          />
        </div>
      }
    />
  )
}
