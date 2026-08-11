'use client'

import { useCallback, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import {
  Badge,
  BottomSheet,
  Button,
  Card,
  Input,
  InputNominal,
  ListRow,
  Modal,
  NavigationBar,
  NavigationHeader,
  OfferCard,
  SelectableCard,
  Toggle,
} from '@/design-system/components'
import * as FundsIcons from '@/design-system/icons'
import {
  Bell,
  ChartLineUp,
  Check,
  Copy,
  House,
  MagnifyingGlass,
  QrCode,
  User,
  Wallet,
  type IconProps,
} from '@/design-system/icons'
import {
  COLOR_SCALES,
  LAYOUT_PATTERNS,
  RADII,
  SPACINGS,
  TOKENS,
  TYPE_SCALE,
} from '@/design-system/tokens'
import { PageHeader } from '@/platform/chrome'
import { Markdown } from './Markdown'
import './system.css'

export type Guidelines = Record<string, string>

// Map a COLOR_SCALES family name to its Tailwind token base.
const COLOR_BASE: Record<string, string> = {
  Brand: 'primary',
  Neutral: 'neutral',
  Blue: 'blue',
  Green: 'green',
  Orange: 'orange',
  Red: 'red',
  Yellow: 'yellow',
}

// -----------------------------------------------------------------------------
// Copy-to-clipboard
// -----------------------------------------------------------------------------
function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const copy = useCallback((value: string) => {
    const done = () => {
      setCopied(value)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(null), 1200)
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(value).then(done).catch(done)
    } else {
      done()
    }
  }, [])
  return { copied, copy }
}

type CopyProps = { copied: string | null; copy: (v: string) => void }

// -----------------------------------------------------------------------------
// Small building blocks (all on-system)
// -----------------------------------------------------------------------------
function CopyChip({ value, copied, copy }: { value: string } & CopyProps) {
  const isCopied = copied === value
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className="sys-chip inline-flex items-center gap-4 rounded-6 border border-default bg-neutral-white px-8 py-4 text-12 text-default dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-50"
      title="Copy"
    >
      {isCopied ? <Check size={16} className="text-link" /> : <Copy size={16} className="text-caption" />}
      <span>{isCopied ? 'Copied' : value}</span>
    </button>
  )
}

function CodeBlock({ code, copied, copy }: { code: string } & CopyProps) {
  const isCopied = copied === code
  return (
    <div className="relative overflow-hidden rounded-8 border border-default bg-neutral-50 dark:border-ink-700 dark:bg-ink-950">
      <button
        type="button"
        onClick={() => copy(code)}
        className="absolute right-12 top-12 inline-flex items-center gap-4 rounded-6 border border-default bg-neutral-white px-8 py-4 text-12 text-default dark:border-ink-700 dark:bg-ink-800 dark:text-neutral-50"
      >
        {isCopied ? <Check size={16} className="text-link" /> : <Copy size={16} className="text-caption" />}
        {isCopied ? 'Copied' : 'Copy'}
      </button>
      <pre className="sys-code p-16">{code}</pre>
    </div>
  )
}

/** A documentation card — one section of the manifest. */
function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className="flex scroll-mt-32 flex-col gap-16 rounded-16 border border-default bg-neutral-white p-20 dark:border-ink-700 dark:bg-ink-900"
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-20 font-bold text-default dark:text-neutral-50">{title}</h2>
        {description ? <p className="text-14 text-caption dark:text-neutral-400">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-14 font-bold text-default dark:text-neutral-50">{children}</h3>
}

/**
 * The specimen window: components sit on a dot grid, with a footer naming the
 * axis on show (left) and the variants it covers (right).
 */
function Stage({
  label,
  variants,
  stack,
  children,
}: {
  label: string
  variants?: string
  stack?: boolean
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-8 border border-default dark:border-ink-700">
      <div
        className={`sys-stage flex gap-12 p-20 ${stack ? 'flex-col items-stretch' : 'flex-wrap items-center'}`}
      >
        {children}
      </div>
      <div className="flex items-center justify-between gap-12 border-t border-default bg-neutral-50 px-12 py-8 dark:border-ink-700 dark:bg-ink-900">
        <span className="sys-mono text-10 text-caption dark:text-neutral-400">{label}</span>
        {variants ? (
          <span className="sys-mono truncate text-10 text-disabled dark:text-neutral-500">{variants}</span>
        ) : null}
      </div>
    </div>
  )
}

/** A narrow stage — mobile chrome specimens read better at phone width. */
function Phone({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-sm overflow-hidden rounded-8 border border-default dark:border-ink-700">{children}</div>
}

function Guideline({ source }: { source?: string }) {
  if (!source) return null
  return (
    <details className="rounded-8 border border-default bg-neutral-50 dark:border-ink-700 dark:bg-ink-950">
      <summary className="cursor-pointer px-16 py-12 text-14 font-bold text-default dark:text-neutral-50">Guidelines</summary>
      <div className="border-t border-default px-16 py-12 dark:border-ink-700">
        <Markdown source={source} />
      </div>
    </details>
  )
}

// -----------------------------------------------------------------------------
// Colors — compact scale rows (one row per family, one tile per stop)
// -----------------------------------------------------------------------------
function ColorScales({ copy }: { copy: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-8">
      {Object.entries(COLOR_SCALES).map(([family, stops]) => {
        const base = COLOR_BASE[family] ?? family.toLowerCase()
        return (
          <div key={family} className="flex items-end gap-8">
            <span className="sys-mono w-48 shrink-0 pb-8 text-10 text-caption dark:text-neutral-400">{family}</span>
            <div className="flex min-w-0 flex-1 gap-2">
              {stops.map((stop) => (
                <button
                  key={stop.scale}
                  type="button"
                  onClick={() => copy(stop.hex)}
                  title={`${base}-${stop.scale} · ${stop.hex}`}
                  className="flex min-w-0 flex-1 flex-col gap-4"
                >
                  <span className="sys-mono truncate text-10 text-caption dark:text-neutral-500">{stop.scale}</span>
                  <span
                    className="sys-tile h-32 w-full rounded-4 border border-default dark:border-ink-700"
                    style={{ backgroundColor: stop.hex }}
                    data-hex={`${base}-${stop.scale} · ${stop.hex}`}
                  />
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Icons — the whole shared set, filterable, click to copy the import name
// -----------------------------------------------------------------------------
type IconComponent = ComponentType<IconProps>

const ICON_ENTRIES: [string, IconComponent][] = Object.entries(FundsIcons)
  .filter(([name, value]) => typeof value === 'function' && /^[A-Z]/.test(name))
  .map(([name, value]) => [name, value as IconComponent] as [string, IconComponent])
  .sort((a, b) => a[0].localeCompare(b[0]))

function IconGrid({ copied, copy }: CopyProps) {
  const [query, setQuery] = useState('')
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? ICON_ENTRIES.filter(([name]) => name.toLowerCase().includes(q)) : ICON_ENTRIES
  }, [query])

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-center justify-between gap-12">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Cari ikon…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            prefix={<MagnifyingGlass size={20} />}
          />
        </div>
        <span className="sys-mono text-10 text-caption dark:text-neutral-400">
          {shown.length} / {ICON_ENTRIES.length} icons
        </span>
      </div>

      <div className="rounded-8 border border-default p-12 dark:border-ink-700">
        {shown.length === 0 ? (
          <p className="text-14 text-caption dark:text-neutral-400">Tidak ada ikon dengan nama itu.</p>
        ) : (
          <div className="grid grid-cols-3 gap-8 sm:grid-cols-5 lg:grid-cols-8">
            {shown.map(([name, Icon]) => {
              const isCopied = copied === name
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => copy(name)}
                  title={`import { ${name} } from '@/design-system/icons'`}
                  className={
                    isCopied
                      ? 'flex flex-col items-center gap-8 rounded-8 border border-primary-500 bg-primary-50 p-12 dark:bg-ink-800'
                      : 'flex flex-col items-center gap-8 rounded-8 border border-default p-12 hover:border-primary-500 dark:border-ink-700 dark:hover:border-primary-400'
                  }
                >
                  <Icon size={24} className="text-default dark:text-neutral-50" />
                  <span className="sys-mono w-full truncate text-center text-10 text-caption dark:text-neutral-400">
                    {isCopied ? 'Copied' : name}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Interactive component demos
// -----------------------------------------------------------------------------
function ModalDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        intent="success"
        title="Investasi berhasil"
        description="Dana Rp 500.000 telah masuk ke Celengan kamu."
        primaryAction={<Button onClick={() => setOpen(false)}>Selesai</Button>}
        secondaryAction={<Button variant="ghost" onClick={() => setOpen(false)}>Lihat detail</Button>}
      />
    </>
  )
}

function SheetDemo() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Open bottom sheet</Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Pilih metode pembayaran"
        description="Saldo akan dipotong otomatis setiap bulan."
        primaryAction={<Button onClick={() => setOpen(false)}>Konfirmasi</Button>}
        secondaryAction={<Button variant="ghost" onClick={() => setOpen(false)}>Batal</Button>}
      >
        <div className="flex flex-col gap-8">
          <SelectableCard name="pay" inputType="radio" defaultChecked title="Poket" description="Saldo Rp 1.250.000" />
          <SelectableCard name="pay" inputType="radio" title="Transfer Bank" description="BCA · Mandiri · BNI" />
        </div>
      </BottomSheet>
    </>
  )
}

function NominalDemo({
  initial,
  state,
  helperText,
  disabled,
}: {
  initial: string
  state?: 'default' | 'error'
  helperText?: string
  disabled?: boolean
}) {
  const [value, setValue] = useState(initial)
  return (
    <InputNominal
      label="Nominal"
      value={value}
      onValueChange={setValue}
      state={state}
      helperText={helperText}
      disabled={disabled}
    />
  )
}

/** The bottom menu bar, live — tapping a tab moves the active state. */
function NavBarDemo() {
  const [active, setActive] = useState('home')
  const tabs = [
    { id: 'home', label: 'Beranda', icon: <House size={24} /> },
    { id: 'invest', label: 'Investasi', icon: <ChartLineUp size={24} />, badge: 2 },
    { id: 'scan', label: 'Scan', icon: <QrCode size={24} />, feature: true },
    { id: 'wallet', label: 'Poket', icon: <Wallet size={24} /> },
    { id: 'profile', label: 'Akun', icon: <User size={24} /> },
  ]
  return (
    <Phone>
      <NavigationBar
        items={tabs.map((t) => ({ ...t, active: active === t.id, onClick: () => setActive(t.id) }))}
      />
    </Phone>
  )
}

// =============================================================================
// Main
// =============================================================================
export function Manifest({ guidelines }: { guidelines: Guidelines }) {
  const { copied, copy } = useCopy()

  return (
    <div className="mx-auto flex max-w-screen-lg flex-col gap-12 px-16 py-32">
      <PageHeader title="FunDS Lite" subtitle="Tokens & components reference" />

      {/* -------------------------------------------------- Overview */}
      <Section
        id="overview"
        title="Overview"
        description="The token-locked vocabulary every prototype in this repo is built from. Everything below is generated straight from design-system/tokens.ts and design-system/components."
      >
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
          {[
            { k: 'Brand', v: '#853291', d: 'primary-500 — the only primary action color' },
            { k: 'Font', v: 'Inter 500 / 700', d: 'never 400, 600, or 800' },
            { k: 'Grid', v: '4px spacing', d: '0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48' },
          ].map((c) => (
            <div key={c.k} className="flex flex-col gap-4 rounded-12 border border-default p-16 dark:border-ink-700">
              <span className="text-10 font-bold uppercase text-caption dark:text-neutral-400">{c.k}</span>
              <span className="text-16 font-bold text-default dark:text-neutral-50">{c.v}</span>
              <span className="text-12 text-caption dark:text-neutral-400">{c.d}</span>
            </div>
          ))}
        </div>
        <Guideline source={guidelines['GUIDELINES']} />
      </Section>

      {/* -------------------------------------------------- Colors */}
      <Section
        id="colors"
        title="Colors"
        description="Hover a tile to see its token and hex · click to copy the hex. Every fill renders its own value from tokens.ts."
      >
        <ColorScales copy={copy} />

        <div className="flex flex-col gap-8">
          <SubHeading>Semantic tokens</SubHeading>
          <div className="overflow-x-auto rounded-8 border border-default dark:border-ink-700">
            <table className="w-full text-12">
              <thead>
                <tr className="border-b border-default bg-neutral-50 dark:border-ink-700 dark:bg-ink-950">
                  <th className="px-12 py-8 text-left font-bold text-default dark:text-neutral-50">Swatch</th>
                  <th className="px-12 py-8 text-left font-bold text-default dark:text-neutral-50">Category</th>
                  <th className="px-12 py-8 text-left font-bold text-default dark:text-neutral-50">Token</th>
                  <th className="px-12 py-8 text-left font-bold text-default dark:text-neutral-50">Hex</th>
                  <th className="px-12 py-8 text-left font-bold text-default dark:text-neutral-50">Usage</th>
                </tr>
              </thead>
              <tbody>
                {TOKENS.map((t) => (
                  <tr key={t.key} className="border-b border-light dark:border-ink-700">
                    <td className="px-12 py-8">
                      <span className="inline-block size-16 rounded-4 border border-default" style={{ backgroundColor: t.hex }} />
                    </td>
                    <td className="px-12 py-8 text-caption dark:text-neutral-400">{t.cat}</td>
                    <td className="px-12 py-8"><CopyChip value={t.key} copied={copied} copy={copy} /></td>
                    <td className="px-12 py-8"><CopyChip value={t.hex} copied={copied} copy={copy} /></td>
                    <td className="px-12 py-8 text-caption dark:text-neutral-400">{t.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Guideline source={guidelines['foundations/colors']} />
      </Section>

      {/* -------------------------------------------------- Typography */}
      <Section id="typography" title="Typography" description="Inter, weights 500 and 700 only. Each specimen uses its own text token class.">
        <div className="flex flex-col divide-y divide-neutral-200 overflow-hidden rounded-8 border border-default dark:divide-ink-700 dark:border-ink-700">
          {TYPE_SCALE.map((t) => (
            <div key={t.cls} className="flex flex-col gap-8 p-16 sm:flex-row sm:items-baseline sm:justify-between">
              <span className={`${t.cls} ${t.weight === 700 ? 'font-bold' : 'font-regular'} ${t.uppercase ? 'uppercase' : ''} text-default dark:text-neutral-50`}>
                {t.sample}
              </span>
              <span className="flex shrink-0 items-center gap-8">
                <CopyChip value={t.cls} copied={copied} copy={copy} />
                <span className="sys-mono text-10 text-caption dark:text-neutral-400">{t.spec}</span>
              </span>
            </div>
          ))}
        </div>
        <Guideline source={guidelines['foundations/typography']} />
      </Section>

      {/* -------------------------------------------------- Spacing & Layout */}
      <Section id="spacing" title="Spacing & Layout" description="The 4px spacing grid, radius scale, and the mobile layout patterns.">
        <div className="flex flex-col gap-8">
          <SubHeading>Spacing scale</SubHeading>
          <div className="flex flex-col gap-8 rounded-8 border border-default p-16 dark:border-ink-700">
            {SPACINGS.map((s) => (
              <div key={s.v} className="flex items-center gap-12">
                <span className="sys-mono w-32 shrink-0 text-12 font-bold text-default dark:text-neutral-50">{s.v}</span>
                <span className="h-16 rounded-4 bg-primary-500" style={{ width: s.px }} />
                <span className="sys-mono text-10 text-caption dark:text-neutral-400">{s.px} · {s.r}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <SubHeading>Radius scale</SubHeading>
          <div className="grid grid-cols-3 gap-12 rounded-8 border border-default p-16 sm:grid-cols-6 dark:border-ink-700">
            {RADII.map((r) => (
              <div key={r.k} className="flex flex-col items-center gap-4">
                <span className="size-40 border border-primary-500 bg-primary-50" style={{ borderRadius: r.v === '∞' ? '9999px' : r.v }} />
                <span className="text-12 font-bold text-default dark:text-neutral-50">{r.k}</span>
                <span className="sys-mono text-10 text-caption dark:text-neutral-400">{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <SubHeading>Layout patterns</SubHeading>
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
            {LAYOUT_PATTERNS.map((p) => (
              <div key={p.name} className="flex flex-col gap-8 rounded-8 border border-default p-16 dark:border-ink-700">
                <span className="text-14 font-bold text-default dark:text-neutral-50">{p.name}</span>
                {p.tokens.map((tk) => (
                  <div key={tk.key} className="flex flex-col gap-2 border-t border-light pt-8 dark:border-ink-700">
                    <span className="flex items-center justify-between gap-8">
                      <span className="sys-mono text-12 text-default dark:text-neutral-50">{tk.key}</span>
                      <span className="text-12 font-bold text-link dark:text-primary-300">{tk.value}</span>
                    </span>
                    {tk.note ? <span className="text-10 text-caption dark:text-neutral-400">{tk.note}</span> : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <Guideline source={guidelines['foundations/spacing']} />
      </Section>

      {/* -------------------------------------------------- Icons */}
      <Section
        id="icons"
        title="Icons"
        description="The shared FunDS set — every glyph a prototype may use. Click one to copy its name; never hand-roll an icon."
      >
        <IconGrid copied={copied} copy={copy} />
        <CodeBlock
          code={"import { Coins } from '@/design-system/icons'\n\n<Coins size={24} className=\"text-primary-500\" />"}
          copied={copied}
          copy={copy}
        />
      </Section>

      {/* -------------------------------------------------- Button */}
      <Section id="buttons" title="Button" description="Pill-shaped actions — five variants × five sizes.">
        <Stage label="variants" variants="primary · secondary · outline · ghost · danger">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </Stage>
        <Stage label="states" variants="default · disabled">
          <Button variant="primary">Primary</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="secondary" disabled>Disabled</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="outline" disabled>Disabled</Button>
        </Stage>
        <Stage label="sizes" variants="xs · sm · md · lg · xl">
          <Button size="xs">xs</Button>
          <Button size="sm">sm</Button>
          <Button size="md">md</Button>
          <Button size="lg">lg</Button>
          <Button size="xl">xl</Button>
        </Stage>
        <CodeBlock code={'<Button variant="primary" size="md">Lanjutkan</Button>'} copied={copied} copy={copy} />
        <Guideline source={guidelines['components/button']} />
      </Section>

      {/* -------------------------------------------------- Input */}
      <Section id="inputs" title="Input" description="Text fields with labels, affixes, and validation states.">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
          <Stage label="text field" variants="description · prefix · required" stack>
            <Input label="Nama lengkap" placeholder="Masukkan nama" description="Sesuai KTP" />
            <Input label="Jumlah" prefix="Rp" placeholder="0" required helperText="Minimum Rp 10.000" />
          </Stage>
          <Stage label="states" variants="valid · error" stack>
            <Input label="Email" state="valid" defaultValue="ibu@amartha.com" helperText="Email valid" />
            <Input label="OTP" state="error" defaultValue="123" helperText="Kode tidak sesuai" />
          </Stage>
        </div>
        <CodeBlock code={'<Input label="Jumlah" prefix="Rp" placeholder="0" />'} copied={copied} copy={copy} />
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
          <Stage label="nominal" variants="empty · filled" stack>
            <NominalDemo initial="" />
            <NominalDemo initial="500000" />
          </Stage>
          <Stage label="nominal states" variants="error · disabled" stack>
            <NominalDemo initial="500" state="error" helperText="Minimum Rp 10.000" />
            <NominalDemo initial="500000" disabled />
          </Stage>
        </div>
        <CodeBlock code={'<InputNominal label="Jumlah diterima" value={digits} onValueChange={setDigits} />'} copied={copied} copy={copy} />
        <Guideline source={guidelines['components/input']} />
      </Section>

      {/* -------------------------------------------------- Badge */}
      <Section id="badges" title="Badge" description="Status labels — pair a 500 foreground with its 50 tint.">
        <Stage label="intents" variants="primary · blue · green · orange · red · yellow · neutral">
          {(['primary', 'blue', 'green', 'orange', 'red', 'yellow', 'neutral'] as const).map((intent) => (
            <Badge key={intent} intent={intent}>{intent}</Badge>
          ))}
        </Stage>
        <Stage label="variants" variants="subtle · solid · outline · inverted">
          <Badge intent="green" variant="subtle" dot>Funded</Badge>
          <Badge intent="blue" variant="solid">In review</Badge>
          <Badge intent="orange" variant="outline">Pending</Badge>
          <Badge intent="red" variant="inverted">Overdue</Badge>
          <Badge intent="primary" size="md">Baru</Badge>
        </Stage>
        <CodeBlock code={'<Badge intent="green" variant="subtle">Funded</Badge>'} copied={copied} copy={copy} />
        <Guideline source={guidelines['components/badge']} />
      </Section>

      {/* -------------------------------------------------- Card & List Row */}
      <Section id="cards" title="Card & List Row" description="16px-radius surface and the list row that lives inside it.">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
          <Stage label="card" variants="default" stack>
            <Card>
              <span className="text-14 font-bold text-default">Celengan</span>
              <p className="text-12 text-caption">Tabungan otomatis untuk masa depan.</p>
            </Card>
          </Stage>
          <Stage label="list row" variants="chevron · toggle · badge" stack>
            <Card flush>
              <ListRow title="Poket" description="Dompet digital" trailing="Rp 1.250.000" chevron onClick={() => {}} />
              <ListRow title="Notifikasi" trailing={<Toggle defaultChecked />} />
              <ListRow title="Status" trailing={<Badge intent="green">Aktif</Badge>} />
            </Card>
          </Stage>
        </div>
        <CodeBlock code={'<Card flush>\n  <ListRow title="Poket" description="Dompet digital" chevron onClick={open} />\n</Card>'} copied={copied} copy={copy} />
        <Guideline source={guidelines['components/card']} />
        <Guideline source={guidelines['components/list-row']} />
      </Section>

      {/* -------------------------------------------------- Toggle */}
      <Section id="toggles" title="Toggle" description="On/off setting switch.">
        <Stage label="states" variants="on · off · disabled">
          <Toggle defaultChecked />
          <Toggle />
          <Toggle size="md" defaultChecked />
          <Toggle label="Nonaktif" disabled />
        </Stage>
        <Stage label="with label" variants="label · helper">
          <Toggle label="Ingat saya" helperText="Tetap masuk di perangkat ini" defaultChecked />
        </Stage>
        <CodeBlock code={'<Toggle label="Ingat saya" defaultChecked />'} copied={copied} copy={copy} />
        <Guideline source={guidelines['components/toggle']} />
      </Section>

      {/* -------------------------------------------------- Selectable Card */}
      <Section id="selectable-cards" title="Selectable Card" description="Radio / checkbox cards for choosing among options.">
        <Stage label="selection" variants="radio · checkbox · ribbon" stack>
          <SelectableCard name="tenor" inputType="radio" defaultChecked title="Tenor 12 Bulan" description="Rp 500rb / bulan" ribbon="Populer" />
          <SelectableCard name="tenor" inputType="radio" title="Tenor 6 Bulan" description="Rp 950rb / bulan" />
          <SelectableCard name="agree" inputType="checkbox" title="Saya menyetujui" description="Syarat & ketentuan berlaku" />
        </Stage>
        <CodeBlock code={'<SelectableCard title="Tenor 12 Bulan" description="Rp 500rb / bulan" inputType="radio" name="tenor" />'} copied={copied} copy={copy} />
        <Guideline source={guidelines['components/selectable-card']} />
      </Section>

      {/* -------------------------------------------------- Offer Card */}
      <Section id="offer-cards" title="Offer Card" description="Product recommendation card — headline in the product's colour, its lockup along the foot.">
        <Stage label="products" variants="celengan · amartha-link" stack>
          <OfferCard product="celengan" title="Penempatan dana dari Rp10.000" description="Dananya tumbuh dan bisa ditarik kapan pun." />
          <OfferCard product="amartha-link" title="Mulai jualan pulsa, listrik," description="dengan biaya paling murah!" />
        </Stage>
        <CodeBlock code={'<OfferCard product="celengan" title="Penempatan dana dari Rp10.000" description="Dananya tumbuh dan bisa ditarik kapan pun." />'} copied={copied} copy={copy} />
        <Guideline source={guidelines['components/offer-card']} />
      </Section>

      {/* -------------------------------------------------- Modal */}
      <Section id="modals" title="Modal" description="Centered dialog overlay for confirmations and results.">
        <Stage label="live demo" variants="success intent">
          <ModalDemo />
        </Stage>
        <CodeBlock code={'<Modal\n  open={open}\n  onClose={close}\n  intent="success"\n  title="Investasi berhasil"\n  description="Dana telah masuk ke Celengan kamu."\n  primaryAction={<Button onClick={close}>Selesai</Button>}\n/>'} copied={copied} copy={copy} />
        <Guideline source={guidelines['components/modal']} />
      </Section>

      {/* -------------------------------------------------- Bottom Sheet */}
      <Section id="bottom-sheets" title="Bottom Sheet" description="Mobile drawer anchored to the bottom edge.">
        <Stage label="live demo" variants="title · description · actions">
          <SheetDemo />
        </Stage>
        <CodeBlock code={'<BottomSheet\n  open={open}\n  onClose={close}\n  title="Pilih metode pembayaran"\n  primaryAction={<Button onClick={close}>Konfirmasi</Button>}\n/>'} copied={copied} copy={copy} />
        <Guideline source={guidelines['components/bottom-sheet']} />
      </Section>

      {/* -------------------------------------------------- Navigation Bar */}
      <Section id="navigation-bars" title="Navigation Bar" description="The bottom menu bar — up to five tabs, one active, an optional badge and a raised feature tab. Tap a tab to move the active state.">
        <Stage label="bottom menu bar" variants="active · badge · feature">
          <NavBarDemo />
        </Stage>
        <Stage label="four tabs" variants="active · badge">
          <Phone>
            <NavigationBar
              items={[
                { id: 'home', label: 'Beranda', icon: <House size={24} />, active: true },
                { id: 'invest', label: 'Investasi', icon: <ChartLineUp size={24} />, badge: 2 },
                { id: 'wallet', label: 'Poket', icon: <Wallet size={24} /> },
                { id: 'profile', label: 'Akun', icon: <User size={24} /> },
              ]}
            />
          </Phone>
        </Stage>
        <CodeBlock code={'<NavigationBar\n  items={[\n    { id: "home", label: "Beranda", icon: <House size={24} />, active: true },\n    { id: "invest", label: "Investasi", icon: <ChartLineUp size={24} />, badge: 2 },\n  ]}\n/>'} copied={copied} copy={copy} />
        <Guideline source={guidelines['components/navigation-bar']} />
      </Section>

      {/* -------------------------------------------------- Navigation Header */}
      <Section id="navigation-headers" title="Navigation Header" description="The 48px top app bar — back affordance, title, and an optional link or trailing icons.">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
          <Stage label="light" variants="back · link" stack>
            <Phone>
              <NavigationHeader title="Detail Investasi" onBack={() => {}} link="Bantuan" />
            </Phone>
            <Phone>
              <NavigationHeader
                title="Cari Mitra"
                onBack={() => {}}
                trailingIcons={[<MagnifyingGlass key="search" size={24} />, <Bell key="bell" size={24} />]}
              />
            </Phone>
          </Stage>
          <Stage label="dark & status bar" variants="dark · showStatusBar" stack>
            <Phone>
              <NavigationHeader variant="dark" title="Celengan" onBack={() => {}} />
            </Phone>
            <Phone>
              <NavigationHeader title="Beranda" hideBack showStatusBar />
            </Phone>
          </Stage>
        </div>
        <CodeBlock code={'<NavigationHeader title="Detail Investasi" onBack={() => flow.back()} />'} copied={copied} copy={copy} />
        <Guideline source={guidelines['components/navigation-header']} />
      </Section>

      {/* -------------------------------------------------- Prompts */}
      <Section id="prompts" title="Prompts" description="Canonical, copy-ready component usage — the shape an agent should reach for first.">
        <CodeBlock
          code={[
            '// Primary CTA',
            '<Button variant="primary" size="md">Lanjutkan</Button>',
            '',
            '// Amount input with currency prefix',
            '<Input label="Jumlah" prefix="Rp" placeholder="0" />',
            '',
            '// Status badge (500 foreground on 50 tint)',
            '<Badge intent="green" variant="subtle">Funded</Badge>',
            '',
            '// Selection card',
            '<SelectableCard title="Tenor 12 Bulan" description="Rp 500rb/bulan" inputType="radio" name="tenor" />',
            '',
            '// Icon from the shared set',
            "import { Coins } from '@/design-system/icons'",
            '',
            '// Confirmation modal',
            '<Modal open={open} onClose={close} title="Konfirmasi"',
            '  primaryAction={<Button onClick={confirm}>Ya</Button>} />',
          ].join('\n')}
          copied={copied}
          copy={copy}
        />
        <Guideline source={guidelines['components/overview']} />
      </Section>

      {/* -------------------------------------------------- For Agents */}
      <Section id="llms" title="For Agents" description="The non-negotiable guardrails for any AI building in this repo.">
        <div className="flex flex-col gap-8 rounded-8 border border-default p-16 dark:border-ink-700">
          {[
            'Brand color is #853291 (primary-500) — the ONLY primary action color.',
            'Font is Inter, weights 500 and 700 only — never 400, 600, or 800.',
            'Spacing uses the 4px grid: 0 · 2 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48px only.',
            'Buttons and badges are pill (9999px). Cards are 16px radius. Inputs are 8px.',
            'Status colors pair a 500 foreground with its 50-tint background.',
            'Icons come from @/design-system/icons — never hand-roll one.',
            'No arbitrary Tailwind values (w-[437px], text-[#abc]) — enforced by ESLint.',
            'Compose only from design-system/components + tokens. Never invent hex values.',
          ].map((rule, idx) => (
            <div key={idx} className="flex items-start gap-8 border-t border-light pt-8 first:border-0 first:pt-0 dark:border-ink-700">
              <span className="mt-4 size-8 shrink-0 rounded-full bg-primary-500" />
              <span className="text-14 text-default dark:text-neutral-50">{rule}</span>
            </div>
          ))}
        </div>
        <CodeBlock
          code={[
            'Do NOT use arbitrary Tailwind values: w-[437px], text-[#abc]',
            'Do NOT invent hex values not listed in the token set',
            'Do NOT use font-weight 400, 600, or 800',
            'Do NOT use spacing outside: 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48px',
            'Do NOT hand-roll icons — import them from @/design-system/icons',
            'Do NOT use any font other than Inter',
          ].join('\n')}
          copied={copied}
          copy={copy}
        />
      </Section>
    </div>
  )
}
