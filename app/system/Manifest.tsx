'use client'

import { useCallback, useRef, useState, type ReactNode } from 'react'
import {
  Badge,
  BottomSheet,
  Button,
  Card,
  Input,
  ListRow,
  Modal,
  NavigationBar,
  NavigationHeader,
  SelectableCard,
  Toggle,
} from '@/design-system/components'
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
// Icons (inline, currentColor) — for navigation demos
// -----------------------------------------------------------------------------
type IconProps = { className?: string }
function svg(path: ReactNode) {
  return function Icon({ className }: IconProps) {
    return (
      <svg className={className} viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {path}
      </svg>
    )
  }
}
const IconHome = svg(<path d="M3 10l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />)
const IconChart = svg(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>)
const IconWallet = svg(<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M16 12h2" /></>)
const IconUser = svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>)
const IconCopy = svg(<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 012-2h8" /></>)
const IconCheck = svg(<path d="M20 6L9 17l-5-5" />)

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

// -----------------------------------------------------------------------------
// Small building blocks (all on-system)
// -----------------------------------------------------------------------------
function CopyChip({ value, copied, copy }: { value: string; copied: string | null; copy: (v: string) => void }) {
  const isCopied = copied === value
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      className="sys-chip inline-flex items-center gap-4 rounded-6 border border-default bg-neutral-white px-8 py-4 text-12 text-default"
      title="Copy"
    >
      {isCopied ? <IconCheck className="size-12 text-link" /> : <IconCopy className="size-12 text-caption" />}
      <span>{isCopied ? 'Copied' : value}</span>
    </button>
  )
}

function CodeBlock({ code, copied, copy }: { code: string; copied: string | null; copy: (v: string) => void }) {
  const isCopied = copied === code
  return (
    <div className="relative rounded-8 border border-default bg-neutral-50">
      <button
        type="button"
        onClick={() => copy(code)}
        className="absolute right-8 top-8 inline-flex items-center gap-4 rounded-6 border border-default bg-neutral-white px-8 py-4 text-12 text-default"
      >
        {isCopied ? <IconCheck className="size-12 text-link" /> : <IconCopy className="size-12 text-caption" />}
        {isCopied ? 'Copied' : 'Copy'}
      </button>
      <pre className="sys-code p-16">{code}</pre>
    </div>
  )
}

function Section({ id, title, description, children }: { id: string; title: string; description?: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-32 flex-col gap-16">
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

function Demo({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-12 rounded-12 border border-default bg-neutral-white p-16">{children}</div>
}

function Guideline({ source }: { source?: string }) {
  if (!source) return null
  return (
    <details className="rounded-8 border border-default bg-neutral-white">
      <summary className="cursor-pointer px-16 py-12 text-14 font-bold text-default">Guidelines</summary>
      <div className="border-t border-default px-16 py-12">
        <Markdown source={source} />
      </div>
    </details>
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

// =============================================================================
// Main
// =============================================================================
export function Manifest({ guidelines }: { guidelines: Guidelines }) {
  const { copied, copy } = useCopy()

  return (
    <div className="mx-auto flex max-w-screen-lg flex-col gap-48 px-16 py-32">
      <PageHeader title="FunDS Lite" subtitle="Tokens & components reference" />
          {/* -------------------------------------------------- Overview */}
          <Section id="overview" title="Overview" description="The token-locked vocabulary every prototype in this repo is built from. Everything below is generated straight from design-system/tokens.ts and design-system/components.">
            <Guideline source={guidelines['GUIDELINES']} />
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
              {[
                { k: 'Brand', v: '#853291', d: 'primary-500 — the only primary action color' },
                { k: 'Font', v: 'Inter 500 / 700', d: 'never 400, 600, or 800' },
                { k: 'Grid', v: '4px spacing', d: '0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48' },
              ].map((c) => (
                <div key={c.k} className="flex flex-col gap-4 rounded-12 border border-default bg-neutral-white p-16">
                  <span className="text-10 font-bold uppercase text-caption">{c.k}</span>
                  <span className="text-16 font-bold text-default">{c.v}</span>
                  <span className="text-12 text-caption">{c.d}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* -------------------------------------------------- Colors */}
          <Section id="colors" title="Colors" description="Click any hex or class token to copy it. Swatch fills render each token's own value from tokens.ts.">
            <div className="flex flex-col gap-24">
              {Object.entries(COLOR_SCALES).map(([family, stops]) => {
                const base = COLOR_BASE[family] ?? family.toLowerCase()
                return (
                  <div key={family} className="flex flex-col gap-8">
                    <SubHeading>{family}</SubHeading>
                    <div className="grid grid-cols-2 gap-12 sm:grid-cols-4">
                      {stops.map((stop) => {
                        const token = `${base}-${stop.scale}`
                        return (
                          <div key={token} className="flex flex-col gap-4">
                            <div className="h-40 w-full rounded-8 border border-default" style={{ backgroundColor: stop.hex }} />
                            <CopyChip value={token} copied={copied} copy={copy} />
                            <CopyChip value={stop.hex} copied={copied} copy={copy} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-8">
              <SubHeading>Semantic tokens</SubHeading>
              <div className="overflow-x-auto rounded-12 border border-default bg-neutral-white">
                <table className="w-full text-12">
                  <thead>
                    <tr className="border-b border-default">
                      <th className="px-12 py-8 text-left font-bold text-default">Swatch</th>
                      <th className="px-12 py-8 text-left font-bold text-default">Category</th>
                      <th className="px-12 py-8 text-left font-bold text-default">Token</th>
                      <th className="px-12 py-8 text-left font-bold text-default">Hex</th>
                      <th className="px-12 py-8 text-left font-bold text-default">Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOKENS.map((t) => (
                      <tr key={t.key} className="border-b border-light">
                        <td className="px-12 py-8">
                          <span className="inline-block size-16 rounded-4 border border-default" style={{ backgroundColor: t.hex }} />
                        </td>
                        <td className="px-12 py-8 text-caption">{t.cat}</td>
                        <td className="px-12 py-8"><CopyChip value={t.key} copied={copied} copy={copy} /></td>
                        <td className="px-12 py-8"><CopyChip value={t.hex} copied={copied} copy={copy} /></td>
                        <td className="px-12 py-8 text-caption">{t.desc}</td>
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
            <div className="flex flex-col divide-y divide-neutral-200 rounded-12 border border-default bg-neutral-white">
              {TYPE_SCALE.map((t) => (
                <div key={t.cls} className="flex flex-col gap-8 p-16 sm:flex-row sm:items-baseline sm:justify-between">
                  <span className={`${t.cls} ${t.weight === 700 ? 'font-bold' : 'font-regular'} ${t.uppercase ? 'uppercase' : ''} text-default`}>
                    {t.sample}
                  </span>
                  <span className="flex shrink-0 items-center gap-8">
                    <CopyChip value={t.cls} copied={copied} copy={copy} />
                    <span className="text-12 text-caption">{t.spec}</span>
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
              <div className="flex flex-col gap-8 rounded-12 border border-default bg-neutral-white p-16">
                {SPACINGS.map((s) => (
                  <div key={s.v} className="flex items-center gap-12">
                    <span className="w-32 shrink-0 text-12 font-bold text-default">{s.v}</span>
                    <span className="h-16 rounded-4 bg-primary-500" style={{ width: s.px }} />
                    <span className="text-12 text-caption">{s.px} · {s.r}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <SubHeading>Radius scale</SubHeading>
              <div className="grid grid-cols-3 gap-12 sm:grid-cols-6">
                {RADII.map((r) => (
                  <div key={r.k} className="flex flex-col items-center gap-4">
                    <span className="size-40 border border-primary-500 bg-primary-50" style={{ borderRadius: r.v === '∞' ? '9999px' : r.v }} />
                    <span className="text-12 font-bold text-default">{r.k}</span>
                    <span className="text-10 text-caption">{r.v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <SubHeading>Layout patterns</SubHeading>
              <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
                {LAYOUT_PATTERNS.map((p) => (
                  <div key={p.name} className="flex flex-col gap-8 rounded-12 border border-default bg-neutral-white p-16">
                    <span className="text-14 font-bold text-default">{p.name}</span>
                    {p.tokens.map((tk) => (
                      <div key={tk.key} className="flex flex-col gap-2 border-t border-light pt-8">
                        <span className="flex items-center justify-between gap-8">
                          <span className="sys-mono text-12 text-default">{tk.key}</span>
                          <span className="text-12 font-bold text-link">{tk.value}</span>
                        </span>
                        {tk.note ? <span className="text-10 text-caption">{tk.note}</span> : null}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <Guideline source={guidelines['foundations/spacing']} />
          </Section>

          {/* -------------------------------------------------- Button */}
          <Section id="buttons" title="Button" description="Pill-shaped actions. Five variants × five sizes.">
            <Demo>
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </Demo>
            <Demo>
              <Button size="xs">xs</Button>
              <Button size="sm">sm</Button>
              <Button size="md">md</Button>
              <Button size="lg">lg</Button>
              <Button size="xl">xl</Button>
            </Demo>
            <CodeBlock code={'<Button variant="primary" size="md">Lanjutkan</Button>'} copied={copied} copy={copy} />
            <Guideline source={guidelines['components/button']} />
          </Section>

          {/* -------------------------------------------------- Input */}
          <Section id="inputs" title="Input" description="Text fields with labels, affixes, and validation states.">
            <div className="grid grid-cols-1 gap-16 rounded-12 border border-default bg-neutral-white p-16 sm:grid-cols-2">
              <Input label="Nama lengkap" placeholder="Masukkan nama" description="Sesuai KTP" />
              <Input label="Jumlah" prefix="Rp" placeholder="0" required helperText="Minimum Rp 10.000" />
              <Input label="Email" state="valid" defaultValue="ibu@amartha.com" helperText="Email valid" />
              <Input label="OTP" state="error" defaultValue="123" helperText="Kode tidak sesuai" />
            </div>
            <CodeBlock code={'<Input label="Jumlah" prefix="Rp" placeholder="0" />'} copied={copied} copy={copy} />
            <Guideline source={guidelines['components/input']} />
          </Section>

          {/* -------------------------------------------------- Badge */}
          <Section id="badges" title="Badge" description="Status labels — pair a 500 foreground with its 50 tint.">
            <Demo>
              {(['primary', 'blue', 'green', 'orange', 'red', 'yellow', 'neutral'] as const).map((intent) => (
                <Badge key={intent} intent={intent}>{intent}</Badge>
              ))}
            </Demo>
            <Demo>
              <Badge intent="green" variant="subtle" dot>Funded</Badge>
              <Badge intent="blue" variant="solid">In review</Badge>
              <Badge intent="orange" variant="outline">Pending</Badge>
              <Badge intent="red" variant="inverted">Overdue</Badge>
              <Badge intent="primary" size="md">Baru</Badge>
            </Demo>
            <CodeBlock code={'<Badge intent="green" variant="subtle">Funded</Badge>'} copied={copied} copy={copy} />
            <Guideline source={guidelines['components/badge']} />
          </Section>

          {/* -------------------------------------------------- Card & List Row */}
          <Section id="cards" title="Card & List Row" description="12px-radius surface and the list row that lives inside it.">
            <div className="grid grid-cols-1 gap-16 sm:grid-cols-2">
              <div className="flex flex-col gap-8">
                <SubHeading>Card</SubHeading>
                <Card>
                  <span className="text-14 font-bold text-default">Celengan</span>
                  <p className="text-12 text-caption">Tabungan otomatis untuk masa depan.</p>
                </Card>
                <CodeBlock code={'<Card>\n  <ListRow title="Saldo" trailing="Rp 1.250.000" />\n</Card>'} copied={copied} copy={copy} />
              </div>
              <div className="flex flex-col gap-8">
                <SubHeading>List Row</SubHeading>
                <Card flush>
                  <ListRow title="Poket" description="Dompet digital" trailing="Rp 1.250.000" chevron onClick={() => {}} />
                  <ListRow title="Notifikasi" trailing={<Toggle defaultChecked />} />
                  <ListRow title="Status" trailing={<Badge intent="green">Aktif</Badge>} />
                </Card>
                <CodeBlock code={'<ListRow title="Poket" description="Dompet digital" chevron onClick={open} />'} copied={copied} copy={copy} />
              </div>
            </div>
            <Guideline source={guidelines['components/card']} />
            <Guideline source={guidelines['components/list-row']} />
          </Section>

          {/* -------------------------------------------------- Toggle */}
          <Section id="toggles" title="Toggle" description="On/off setting switch.">
            <Demo>
              <Toggle defaultChecked />
              <Toggle />
              <Toggle size="md" defaultChecked />
              <Toggle label="Ingat saya" helperText="Tetap masuk di perangkat ini" defaultChecked />
              <Toggle label="Nonaktif" disabled />
            </Demo>
            <CodeBlock code={'<Toggle label="Ingat saya" defaultChecked />'} copied={copied} copy={copy} />
            <Guideline source={guidelines['components/toggle']} />
          </Section>

          {/* -------------------------------------------------- Selectable Card */}
          <Section id="selectable-cards" title="Selectable Card" description="Radio / checkbox cards for choosing among options.">
            <div className="flex flex-col gap-8 rounded-12 border border-default bg-neutral-white p-16">
              <SelectableCard name="tenor" inputType="radio" defaultChecked title="Tenor 12 Bulan" description="Rp 500rb / bulan" ribbon="Populer" />
              <SelectableCard name="tenor" inputType="radio" title="Tenor 6 Bulan" description="Rp 950rb / bulan" />
              <SelectableCard name="agree" inputType="checkbox" title="Saya menyetujui" description="Syarat & ketentuan berlaku" />
            </div>
            <CodeBlock code={'<SelectableCard title="Tenor 12 Bulan" description="Rp 500rb / bulan" inputType="radio" name="tenor" />'} copied={copied} copy={copy} />
            <Guideline source={guidelines['components/selectable-card']} />
          </Section>

          {/* -------------------------------------------------- Modal */}
          <Section id="modals" title="Modal" description="Centered dialog overlay for confirmations and results.">
            <Demo>
              <ModalDemo />
            </Demo>
            <CodeBlock code={'<Modal\n  open={open}\n  onClose={close}\n  intent="success"\n  title="Investasi berhasil"\n  description="Dana telah masuk ke Celengan kamu."\n  primaryAction={<Button onClick={close}>Selesai</Button>}\n/>'} copied={copied} copy={copy} />
            <Guideline source={guidelines['components/modal']} />
          </Section>

          {/* -------------------------------------------------- Bottom Sheet */}
          <Section id="bottom-sheets" title="Bottom Sheet" description="Mobile drawer anchored to the bottom edge.">
            <Demo>
              <SheetDemo />
            </Demo>
            <CodeBlock code={'<BottomSheet\n  open={open}\n  onClose={close}\n  title="Pilih metode pembayaran"\n  primaryAction={<Button onClick={close}>Konfirmasi</Button>}\n/>'} copied={copied} copy={copy} />
            <Guideline source={guidelines['components/bottom-sheet']} />
          </Section>

          {/* -------------------------------------------------- Navigation */}
          <Section id="navigation-bars" title="Navigation" description="Bottom tab bar and top app header.">
            <div className="flex flex-col gap-8">
              <SubHeading>Navigation Bar</SubHeading>
              <div className="overflow-hidden rounded-12 border border-default bg-neutral-white">
                <NavigationBar
                  items={[
                    { id: 'home', label: 'Beranda', icon: <IconHome />, active: true },
                    { id: 'invest', label: 'Investasi', icon: <IconChart />, badge: 2 },
                    { id: 'wallet', label: 'Poket', icon: <IconWallet /> },
                    { id: 'profile', label: 'Akun', icon: <IconUser /> },
                  ]}
                />
              </div>
              <CodeBlock code={'<NavigationBar items={[{ id: "home", label: "Beranda", icon: <HomeIcon />, active: true }]} />'} copied={copied} copy={copy} />
              <Guideline source={guidelines['components/navigation-bar']} />
            </div>

            <div className="flex flex-col gap-8">
              <SubHeading>Navigation Header</SubHeading>
              <div className="overflow-hidden rounded-12 border border-default bg-neutral-white">
                <NavigationHeader title="Detail Investasi" onBack={() => {}} link="Bantuan" />
              </div>
              <div className="overflow-hidden rounded-12 border border-default">
                <NavigationHeader variant="dark" title="Celengan" onBack={() => {}} />
              </div>
              <CodeBlock code={'<NavigationHeader title="Detail Investasi" onBack={() => flow.back()} />'} copied={copied} copy={copy} />
              <Guideline source={guidelines['components/navigation-header']} />
            </div>
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
            <div className="flex flex-col gap-8 rounded-12 border border-default bg-neutral-white p-16">
              {[
                'Brand color is #853291 (primary-500) — the ONLY primary action color.',
                'Font is Inter, weights 500 and 700 only — never 400, 600, or 800.',
                'Spacing uses the 4px grid: 0 · 2 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48px only.',
                'Buttons and badges are pill (9999px). Cards are 12px radius. Inputs are 8px.',
                'Status colors pair a 500 foreground with its 50-tint background.',
                'No arbitrary Tailwind values (w-[437px], text-[#abc]) — enforced by ESLint.',
                'Compose only from design-system/components + tokens. Never invent hex values.',
              ].map((rule, idx) => (
                <div key={idx} className="flex items-start gap-8 border-t border-light pt-8 first:border-0 first:pt-0">
                  <span className="mt-2 size-8 shrink-0 rounded-full bg-primary-500" />
                  <span className="text-14 text-default">{rule}</span>
                </div>
              ))}
            </div>
            <CodeBlock
              code={[
                'Do NOT use arbitrary Tailwind values: w-[437px], text-[#abc]',
                'Do NOT invent hex values not listed in the token set',
                'Do NOT use font-weight 400, 600, or 800',
                'Do NOT use spacing outside: 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48px',
                'Do NOT use any font other than Inter',
              ].join('\n')}
              copied={copied}
              copy={copy}
            />
          </Section>
    </div>
  )
}
