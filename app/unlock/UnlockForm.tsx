'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Button, Input } from '@/design-system/components'
import { unlock, type UnlockState } from './actions'

const initialState: UnlockState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? 'Unlocking…' : 'Unlock'}
    </Button>
  )
}

export function UnlockForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState(unlock, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-16">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="Enter shared password"
        autoComplete="current-password"
        autoFocus
        required
        state={state.error ? 'error' : 'default'}
        helperText={state.error}
      />
      <SubmitButton />
    </form>
  )
}
