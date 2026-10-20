'use client'

// =============================================================================
// New project · the gallery's button and its form. Asks for a name, where the
// project starts — inside one of the live apps, or blank — and which business
// unit's folder it goes in, creates the project in the database, and opens it
// with Chat showing: the designer builds it from there by prompting. The
// gallery renders this on the dev server, and on the link for a signed-in
// editor.
//
// Where it starts is the one real decision, so it is one choice, and the
// platform and the frame come with it. They were three separate questions that
// could disagree — a project could be NG-MIS by its platform and the AmarthaFin
// phone app by its start. Only a blank project asks for a platform. And Create
// always answers: what's missing says so in place, instead of a grey button
// that never says why.
// =============================================================================

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/design-system/components/Button'
import { CloseIcon, PlusIcon } from '@/platform/chrome/icons'
import { ToolButton } from '@/platform/chrome/TopBar'
import { setDesignMode, setEditTab } from '@/platform/runtime/designBridge'
import type { BusinessUnit, Platform } from '@/platform/types'
import { getCommenterName } from '@/platform/comments/store'
import { PLATFORM_COLOR, PLATFORM_LABEL, PLATFORM_ORDER } from './platforms'
import { LIVE_STARTS, deviceFor, liveStart, type NewProjectResponse, type ProjectStart } from './protocol'

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
const DEVICE_LABEL = { mobile: 'Mobile', desktop: 'Desktop' } as const

const field = (invalid: boolean) =>
  `w-full rounded-8 border bg-neutral-white px-12 py-8 text-14 text-default outline-none placeholder:text-placeholder dark:bg-ink-950 dark:text-neutral-50 ${
    invalid
      ? 'border-red-600'
      : 'border-default focus:border-neutral-600 dark:border-ink-700 dark:focus:border-neutral-500'
  }`
const LABEL = 'text-12 font-bold text-caption dark:text-neutral-400'
// The radio itself is hidden; the ring on the face after it is what a keyboard sees.
const FOCUS = 'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500'
const chip = (on: boolean) =>
  `inline-flex items-center gap-8 rounded-full border px-12 py-4 text-12 ${FOCUS} ${
    on
      ? 'border-primary-500 bg-primary-500 font-bold text-neutral-white'
      : 'border-default bg-neutral-white font-regular text-caption hover:border-primary-500 hover:text-link dark:border-ink-700 dark:bg-ink-900 dark:text-neutral-400 dark:hover:text-neutral-50'
  }`
const card = (on: boolean) =>
  `flex h-full flex-col gap-4 rounded-12 border px-12 py-12 ${FOCUS} ${
    on
      ? 'border-primary-500 bg-primary-50 dark:bg-ink-800'
      : 'border-default bg-neutral-white hover:border-primary-500 dark:border-ink-700 dark:bg-ink-900'
  }`

/** A radio with its own face: arrow keys move between a group's options, and
 *  a screen reader hears which is chosen. */
function Radio({
  name,
  value,
  checked,
  onChange,
  face,
  children,
}: {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  face: string
  children: ReactNode
}) {
  return (
    <label className="cursor-pointer">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
      <span className={face}>{children}</span>
    </label>
  )
}

function Choice<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string
  options: { id: T; label: string; dot?: string }[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-8">
      {options.map((o) => (
        <Radio key={o.id} name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} face={chip(value === o.id)}>
          {o.dot ? <span aria-hidden className={`size-8 rounded-full ${o.dot}`} /> : null}
          {o.label}
        </Radio>
      ))}
    </div>
  )
}

function Field({ legend, hint, error, children }: { legend: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-8">
        <span className={LABEL}>{legend}</span>
        {hint ? <span className="ml-8 text-12 text-caption dark:text-neutral-400">{hint}</span> : null}
      </legend>
      {children}
      {error ? <p className="mt-8 text-12 text-error">{error}</p> : null}
    </fieldset>
  )
}

export function NewProjectButton({
  account,
  businessUnit,
  platform,
}: {
  /** The signed-in account's name, when there is one. */
  account: string | null
  /** The folder the gallery is standing in, if any — the form starts there. */
  businessUnit: BusinessUnit | null
  /** The platform the gallery is filtered to, if any — the form starts inside that app. */
  platform?: Platform | null
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      {/* In the shell's top bar, so it wears the top bar's button. */}
      <ToolButton icon={<PlusIcon className="size-16" />} label="New project" onClick={() => setOpen(true)} />
      {open ? (
        <NewProjectDialog
          account={account}
          businessUnit={businessUnit}
          platform={platform ?? null}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

function NewProjectDialog({
  account,
  businessUnit,
  platform: filtered,
  onClose,
}: {
  account: string | null
  businessUnit: BusinessUnit | null
  platform: Platform | null
  onClose: () => void
}) {
  const router = useRouter()
  const titleId = useId()
  // Signed in, the account's name is the owner and isn't asked.
  const accountOwner = account
  const [name, setName] = useState('')
  const [owner, setOwner] = useState(() => accountOwner ?? (remembered() || getCommenterName()))
  const [bu, setBu] = useState<BusinessUnit | null>(businessUnit)
  const [start, setStart] = useState<ProjectStart | null>(
    () => LIVE_STARTS.find((s) => s.platform === filtered)?.id ?? null,
  )
  const [blankPlatform, setBlankPlatform] = useState<Platform | null>(filtered)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ reason: string; signIn?: string } | null>(null)
  // Field errors show once Create has been tried, not while the form is filled in.
  const [tried, setTried] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const ownerRef = useRef<HTMLInputElement>(null)
  const startRef = useRef<HTMLDivElement>(null)
  const platformRef = useRef<HTMLDivElement>(null)
  const buRef = useRef<HTMLDivElement>(null)

  const live = liveStart(start)
  const missing = {
    name: name.trim() ? null : 'Give the project a name.',
    start: start ? null : 'Pick where it starts.',
    platform: start === 'blank' && !blankPlatform ? 'Pick the platform it’s for.' : null,
    bu: bu ? null : 'Pick the business unit it belongs to.',
    owner: accountOwner || owner.trim() ? null : 'Say who you are.',
  }
  const shown = (key: keyof typeof missing) => (tried ? missing[key] : null)
  // A form with something in it doesn't vanish on a stray click outside.
  const pristine = !name.trim() && !start

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const create = async () => {
    if (busy) return
    if (Object.values(missing).some(Boolean)) {
      setTried(true)
      const first = missing.name
        ? nameRef.current
        : missing.start
          ? startRef.current?.querySelector('input')
          : missing.platform
            ? platformRef.current?.querySelector('input')
            : missing.bu
            ? buRef.current?.querySelector('input')
            : ownerRef.current
      first?.focus()
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          owner: owner.trim(),
          businessUnit: bu,
          platform: live ? undefined : blankPlatform,
          start,
        }),
      })
      const data = (await res.json().catch(() => null)) as NewProjectResponse | null
      if (!data?.ok) {
        setError(data ? { reason: data.reason, signIn: data.signIn } : { reason: 'The project couldn’t be created — try again.' })
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
      setError({ reason: 'Couldn’t reach the studio — check your connection and try again.' })
      setBusy(false)
    }
  }

  const blankDevice = blankPlatform ? deviceFor(blankPlatform) : null
  const summary = live
    ? `Opens on ${live.opensOn}, with Chat ready for you to describe the change. The rest of ${live.app} is there to tap through.`
    : start === 'blank'
      ? `Opens on one empty ${blankDevice === 'desktop' ? 'desktop ' : blankDevice ? 'phone ' : ''}screen, with Chat ready for you to describe what to build.`
      : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-950/60 px-16 py-24"
      onClick={() => !busy && pristine && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="my-auto w-full max-w-560 rounded-16 border border-default bg-neutral-white p-24 shadow-lg dark:border-ink-700 dark:bg-ink-900"
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void create()
          }}
          className="flex flex-col gap-20"
        >
          <div className="flex items-center justify-between gap-8">
            <h2 id={titleId} className="text-18 font-bold text-default dark:text-neutral-50">
              New project
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex size-32 items-center justify-center rounded-8 text-caption hover:bg-neutral-50 hover:text-default dark:text-neutral-400 dark:hover:bg-ink-800 dark:hover:text-neutral-50"
            >
              <CloseIcon className="size-16" />
            </button>
          </div>

          <label className="flex flex-col gap-8">
            <span className={LABEL}>Name</span>
            <input
              ref={nameRef}
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Poket top-up"
              maxLength={60}
              aria-invalid={Boolean(shown('name'))}
              className={field(Boolean(shown('name')))}
            />
            {shown('name') ? <span className="text-12 text-error">{shown('name')}</span> : null}
          </label>

          <Field legend="Start from" error={shown('start')}>
            <div ref={startRef} className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {LIVE_STARTS.map((s) => (
                <Radio
                  key={s.id}
                  name="start"
                  value={s.id}
                  checked={start === s.id}
                  onChange={() => setStart(s.id)}
                  face={card(start === s.id)}
                >
                  <span className="flex items-center gap-8">
                    <span aria-hidden className={`size-8 shrink-0 rounded-full ${PLATFORM_COLOR[s.platform].dot}`} />
                    <span className="min-w-0 flex-1 text-14 font-bold text-default dark:text-neutral-50">Inside {s.app}</span>
                    <span className="text-12 text-caption dark:text-neutral-400">{DEVICE_LABEL[s.device]}</span>
                  </span>
                  <span className="text-12 text-caption dark:text-neutral-400">
                    The live app, opening on {s.opensOn} — ready to change.
                  </span>
                </Radio>
              ))}
              <Radio
                name="start"
                value="blank"
                checked={start === 'blank'}
                onChange={() => setStart('blank')}
                face={card(start === 'blank')}
              >
                <span className="flex items-center gap-8">
                  <span aria-hidden className="size-8 shrink-0 rounded-full border border-neutral-400" />
                  <span className="min-w-0 flex-1 text-14 font-bold text-default dark:text-neutral-50">Blank</span>
                  {blankDevice ? (
                    <span className="text-12 text-caption dark:text-neutral-400">{DEVICE_LABEL[blankDevice]}</span>
                  ) : null}
                </span>
                <span className="text-12 text-caption dark:text-neutral-400">
                  One empty screen — build everything by prompting.
                </span>
              </Radio>
            </div>
          </Field>

          {start === 'blank' ? (
            <Field legend="Platform" hint="NGMIS opens in the desktop frame." error={shown('platform')}>
              <div ref={platformRef}>
                <Choice
                  name="platform"
                  options={PLATFORM_ORDER.map((p) => ({ id: p, label: PLATFORM_LABEL[p], dot: PLATFORM_COLOR[p].dot }))}
                  value={blankPlatform}
                  onChange={setBlankPlatform}
                />
              </div>
            </Field>
          ) : null}

          <Field legend="Business unit" hint="The gallery folder it goes in." error={shown('bu')}>
            <div ref={buRef}>
              <Choice name="bu" options={BUSINESS_UNITS.map((b) => ({ id: b, label: b }))} value={bu} onChange={setBu} />
            </div>
          </Field>

          {accountOwner ? null : (
            <label className="flex flex-col gap-8">
              <span className={LABEL}>Your name</span>
              <input
                ref={ownerRef}
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Shown as the project’s owner"
                maxLength={60}
                aria-invalid={Boolean(shown('owner'))}
                className={field(Boolean(shown('owner')))}
              />
              {shown('owner') ? <span className="text-12 text-error">{shown('owner')}</span> : null}
            </label>
          )}

          <div className="flex flex-col gap-12 border-t border-default pt-16 dark:border-ink-700">
            {summary ? <p className="text-12 text-caption dark:text-neutral-400">{summary}</p> : null}
            {error ? (
              <p role="alert" className="whitespace-pre-wrap text-12 text-error">
                {error.reason}
                {error.signIn ? (
                  <>
                    {' '}
                    <a href={error.signIn} target="_blank" rel="noreferrer" className="font-bold text-link underline">
                      Sign in
                    </a>
                    , then press Create project again.
                  </>
                ) : null}
              </p>
            ) : null}
            <div className="flex items-center justify-end gap-8">
              {accountOwner ? (
                <span className="min-w-0 flex-1 truncate text-12 text-caption dark:text-neutral-400">As {accountOwner}</span>
              ) : null}
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={busy}>
                {busy ? 'Creating…' : 'Create project'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
