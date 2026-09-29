'use client'

// =============================================================================
// New project · the gallery's button and its form. Asks what the folder needs
// (name, whose, business unit, platform) and where to start, creates the
// project on this laptop, and opens it with Chat showing — the designer builds
// it from there by prompting. The gallery renders this on the dev server only.
// =============================================================================

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/design-system/components/Button'
import { CloseIcon } from '@/platform/chrome/icons'
import { setDesignMode, setEditTab } from '@/platform/runtime/designBridge'
import type { BusinessUnit, Platform } from '@/platform/types'
import { getCommenterName } from '@/platform/comments/store'
import { ownerFor, type NewProjectResponse, type ProjectStart } from './protocol'

/** The name Push remembers (platform/push/PushBar.tsx) — shared, so a
 *  designer who has pushed before is never asked, and Push won't ask after. */
const PUSH_NAME = 'db.design.name'

function remembered(): string {
  try {
    return window.localStorage.getItem(PUSH_NAME) ?? ''
  } catch {
    return ''
  }
}

function remember(name: string) {
  try {
    window.localStorage.setItem(PUSH_NAME, name)
  } catch {
    // Push asks again next time.
  }
}

const BUSINESS_UNITS: BusinessUnit[] = ['Lending', 'Funding', 'Core', 'Payments']
const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'AFIN', label: 'AFIN' },
  { id: 'APartner', label: 'A-Partner' },
  { id: 'NGMIS', label: 'NGMIS' },
]
const STARTS: { id: ProjectStart; title: string; description: string }[] = [
  { id: 'blank', title: 'Blank', description: 'One empty screen — build everything by prompting.' },
  {
    id: 'amarthafin-live',
    title: 'Inside the AmarthaFin app',
    description: 'Starts on the live homepage, ready to change, with the rest of the app around it.',
  },
]

const FIELD =
  'w-full rounded-8 border border-default bg-neutral-white px-12 py-8 text-14 text-default outline-none placeholder:text-placeholder focus:border-neutral-600 dark:border-ink-700 dark:bg-ink-950 dark:text-neutral-50 dark:focus:border-neutral-500'
const LABEL = 'text-12 font-bold text-caption dark:text-neutral-400'
const chip = (on: boolean) =>
  on
    ? 'rounded-full border border-primary-500 bg-primary-500 px-12 py-4 text-12 font-bold text-neutral-white'
    : 'rounded-full border border-default bg-neutral-white px-12 py-4 text-12 font-regular text-caption hover:border-primary-500 hover:text-link dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-400 dark:hover:text-neutral-50'

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-8">
      {options.map((o) => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)} className={chip(value === o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function NewProjectButton({
  account,
  businessUnit,
}: {
  /** The signed-in account's name, when there is one. */
  account: string | null
  /** The folder the gallery is standing in, if any — the form starts there. */
  businessUnit: BusinessUnit | null
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        New project
      </Button>
      {open ? <NewProjectDialog account={account} businessUnit={businessUnit} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

function NewProjectDialog({
  account,
  businessUnit,
  onClose,
}: {
  account: string | null
  businessUnit: BusinessUnit | null
  onClose: () => void
}) {
  const router = useRouter()
  // Signed in as a known designer, the account is the owner and isn't asked.
  const accountOwner = ownerFor(account)
  const [name, setName] = useState('')
  const [owner, setOwner] = useState(() => accountOwner ?? (remembered() || getCommenterName()))
  const [bu, setBu] = useState<BusinessUnit | null>(businessUnit)
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [start, setStart] = useState<ProjectStart>('blank')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ready = Boolean(name.trim() && owner.trim() && bu && platform && !busy)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const create = async () => {
    if (!ready) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), owner: owner.trim(), businessUnit: bu, platform, start }),
      })
      const data = (await res.json().catch(() => null)) as NewProjectResponse | null
      if (!data?.ok) {
        setError(data?.reason ?? 'The project couldn’t be created — try again.')
        setBusy(false)
        return
      }
      if (!accountOwner) remember(data.owner)
      // Open straight into Edit with Chat showing: the next thing to do is
      // say what to build.
      setDesignMode(true)
      setEditTab('chat')
      router.push(`/p/${data.slug}`)
    } catch {
      setError('Couldn’t reach the studio — is the dev server still running?')
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 px-16"
      onClick={() => !busy && onClose()}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          void create()
        }}
        className="flex w-full max-w-440 flex-col gap-16 rounded-16 border border-default bg-neutral-white p-24 shadow-lg dark:border-ink-700 dark:bg-ink-900"
      >
        <div className="flex items-center justify-between gap-8">
          <h2 className="text-18 font-bold text-default dark:text-neutral-50">New project</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-32 items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
          >
            <CloseIcon className="size-16" />
          </button>
        </div>

        <label className="flex flex-col gap-4">
          <span className={LABEL}>Name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Poket top-up"
            maxLength={60}
            className={FIELD}
          />
        </label>

        {accountOwner ? null : (
          <label className="flex flex-col gap-4">
            <span className={LABEL}>Your name</span>
            <input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Shown as the project’s owner"
              maxLength={60}
              className={FIELD}
            />
          </label>
        )}

        <div className="flex flex-col gap-4">
          <span className={LABEL}>Business unit</span>
          <Chips options={BUSINESS_UNITS.map((b) => ({ id: b, label: b }))} value={bu} onChange={setBu} />
        </div>

        <div className="flex flex-col gap-4">
          <span className={LABEL}>Platform</span>
          <Chips options={PLATFORMS} value={platform} onChange={setPlatform} />
        </div>

        <div className="flex flex-col gap-4">
          <span className={LABEL}>Start from</span>
          <div className="flex flex-col gap-8">
            {STARTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStart(s.id)}
                className={`flex flex-col gap-2 rounded-12 border px-12 py-8 text-left ${
                  start === s.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-ink-800'
                    : 'border-default hover:border-primary-500 dark:border-ink-700'
                }`}
              >
                <span className="text-14 font-bold text-default dark:text-neutral-50">{s.title}</span>
                <span className="text-12 text-caption dark:text-neutral-400">{s.description}</span>
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="whitespace-pre-wrap text-12 text-red-500">{error}</p> : null}

        <div className="flex items-center justify-end gap-8">
          {accountOwner ? (
            <span className="min-w-0 flex-1 truncate text-12 text-caption dark:text-neutral-400">As {accountOwner}</span>
          ) : null}
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!ready}>
            {busy ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}
