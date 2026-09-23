'use client'

// The BP → mitra drill-down drawer — shared by Pembayaran and Pencairan.
//
// Both tabs answer the same underlying question from a BP row ("what's
// actually going on with her mitra, one by one") with different status
// vocabulary: Pembayaran's chip is a DPD band, Pencairan's is a funnel
// stage; Pembayaran's metric is tunggakan, Pencairan's is the loan amount a
// lead has applied for. Rather than forking the whole drawer per tab, each
// caller maps its own domain data into `MitraDrawerRow` — one shared chip +
// one shared metric — and this file owns the chrome: the roster panel, the
// detail panel, the combined header, and the timeline. Wanted twice inside
// one project already (CLAUDE.md §4's bar for promoting a project-local
// component), so it lives here instead of being copied into each tab's file.

import { useState, type ReactNode } from 'react'
import { Badge, Button, Input, type BadgeIntent } from '@/design-system/components'
import {
  Camera,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Cross,
  CrossCircleFill,
  CheckCircle,
  DownloadSimple,
  House,
  MagnifyingGlass,
  MapPin,
  Phone,
} from '@/design-system/icons'
import { Select } from './ui'
import { type MitraTindakan } from './data'

const LIST_PANEL_W = 460
const DETAIL_PANEL_W = 420

export interface MitraDrawerRow {
  id: string
  /** "002" — a stand-in for the mitra code the real roster prefixes each name
   *  with, so the row reads the same shape without fabricating a full address.
   *  Undefined for a Pencairan lead who hasn't been surveyed yet — she has no
   *  mitra code or majelis assignment to show. */
  code?: string
  name: string
  majelis?: string
  /** Matched against a `statusOptions` value by the roster filter. */
  statusId: string
  statusLabel: string
  statusIntent: BadgeIntent
  /** "Tunggakan" / "Nilai pengajuan" — the one figure this tab reads a mitra
   *  by, already formatted (rupiah prefix and all) by the caller. Undefined
   *  for the same not-surveyed-yet Pencairan lead — there's no proposed
   *  amount to show until a survey has actually captured one. */
  metricLabel?: string
  metricValue?: string
  /** When this lead itself was logged, badged the way the app's own leads
   *  list does ("Kamis, 27 Ags 2026" + "Hari ini"). Pencairan-only —
   *  Pembayaran's mitra aren't "leads" with a logged date, so it leaves
   *  these undefined and the roster row skips the badges entirely. */
  leadDate?: string
  leadDateRelative?: string
  /** How the lead entered the pipeline, and where — also Pencairan-only. */
  source?: string
  location?: string
  /** "baru" | "lanjutan" — Pencairan-only, same reasoning as `leadDate`.
   *  Drives the roster's own segment filter; undefined rows (Pembayaran)
   *  just don't get that filter rendered. */
  segment?: 'baru' | 'lanjutan'
  /** Most recent first — the roster panel shows the first two as a preview,
   *  the mitra's own panel shows the whole thing. */
  tindakan: MitraTindakan[]
  followUp: string
}

/** One tindakan entry, shared by the roster panel's two-line preview and the
 *  detail panel's full log — same row shape either place, just how many of
 *  them show up. `onClick` is only wired in the detail panel's timeline: the
 *  roster preview's rows sit inside a card whose own click already drills
 *  into the mitra, so a second, narrower click target there would fight the
 *  first. When it IS wired, this row skips its own rounded/bg wrapper —
 *  the caller supplies that, so the row and its expanded detail beneath it
 *  read as one card growing taller rather than two stacked boxes. */
function TindakanRow({
  t,
  expanded,
  onClick,
}: {
  t: MitraTindakan
  expanded?: boolean
  onClick?: () => void
}) {
  const body = (
    <span className="flex flex-wrap items-center justify-between gap-8 px-12 py-8">
      <span className="flex flex-col gap-2">
        <span className="text-12 font-bold text-default">{t.date}</span>
        <span className="flex items-center gap-4">
          <Badge intent={t.pelaku === 'BP' ? 'primary' : t.pelaku === 'BM' ? 'blue' : 'orange'} size="sm">
            {t.pelaku}
          </Badge>
          <span className="text-12 text-caption">{t.jenis}</span>
        </span>
      </span>
      <span className="flex items-center gap-8">
        <span className="flex flex-col items-end gap-2">
          <Badge
            intent={t.hasilOk ? 'green' : 'red'}
            variant="subtle"
            size="sm"
            leadingIcon={t.hasilOk ? <CheckCircle size={16} /> : <CrossCircleFill size={16} />}
          >
            {t.hasil}
          </Badge>
          <span className="text-10 text-caption">{t.dibayar ?? '—'}</span>
        </span>
        {onClick ? (
          <span className="shrink-0 text-caption">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        ) : null}
      </span>
    </span>
  )

  if (!onClick) return <span className="block rounded-8 bg-neutral-50">{body}</span>

  return (
    <button type="button" onClick={onClick} className="block w-full text-left active:opacity-70">
      {body}
    </button>
  )
}

/** The illustrated stand-ins for a tindakan's evidence — drawn, not real
 *  (CLAUDE.md §3: no embedded map, and no fabricated photo asset either).
 *  `MapPreview` is a smaller copy of `agent-map.tsx`'s "roads and pins"
 *  band; `PhotoPreview` is the same idea for a photo, a filled tile rather
 *  than an actual image nobody captured. */
function MapPreview({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-8">
      <span className="flex items-center gap-4 text-12 font-bold text-caption">
        <MapPin size={16} /> Lokasi
      </span>
      <div className="relative overflow-hidden rounded-12 bg-neutral-100 py-32">
        <span className="absolute left-0 right-0 top-16 h-2 bg-neutral-200" />
        <span className="absolute bottom-12 left-0 right-0 h-2 bg-neutral-200" />
        <span className="absolute bottom-0 left-20 top-0 w-2 bg-neutral-200" />
        <span className="absolute bottom-0 right-24 top-0 w-2 bg-neutral-200" />
        <span className="absolute left-24 top-24 text-primary-500">
          <MapPin size={20} />
        </span>
        <span className="absolute bottom-6 right-8 rounded-full bg-neutral-white px-8 py-2 text-10 text-caption">
          Ilustrasi peta
        </span>
      </div>
      <span className="text-12 text-caption">{label}</span>
    </div>
  )
}

/** A bust silhouette — a head circle over a shoulders blob, clipped by the
 *  frame around it. Two of these side by side stand in for the photo a
 *  visit actually produces (CLAUDE.md §3: drawn, not a real or fabricated
 *  asset), without pinning the illustration to whichever two people this
 *  particular tindakan happened to involve. */
function PersonSilhouette({ tone }: { tone: 'a' | 'b' }) {
  const fill = tone === 'a' ? 'bg-primary-200' : 'bg-neutral-400'
  return (
    <div className="relative h-48 w-40 shrink-0 overflow-hidden rounded-t-full">
      <span className={`absolute inset-x-4 bottom-0 h-32 rounded-t-full ${fill}`} />
      <span className={`absolute left-1/2 top-4 size-20 -translate-x-1/2 rounded-full ${fill}`} />
    </div>
  )
}

/** The visit photo, drawn rather than a real asset — two silhouettes on a
 *  neutral card, the same "someone was actually there" shape a real
 *  bukti-kunjungan photo has, without claiming to be one. */
function PhotoPreview() {
  return (
    <div className="flex flex-col gap-8">
      <span className="flex items-center gap-4 text-12 font-bold text-caption">
        <Camera size={16} /> Bukti foto
      </span>
      <div className="relative flex items-end justify-center gap-8 rounded-12 bg-neutral-100 py-16">
        <PersonSilhouette tone="a" />
        <PersonSilhouette tone="b" />
        <span className="absolute bottom-6 right-8 rounded-full bg-neutral-white px-8 py-2 text-10 text-caption">
          Ilustrasi foto
        </span>
      </div>
      <span className="text-12 text-caption">Foto kunjungan tersimpan di aplikasi BP.</span>
    </div>
  )
}

/**
 * One tindakan's own detail, expanded in place beneath its row in the
 * timeline: the date, pelaku, jenis and hasil already show in the row
 * above, so this only adds the catatan behind it, and — for a task logged
 * in person — the photo and location that came with it. A Telepon call has
 * neither, so those two sections just don't render rather than showing an
 * empty box.
 */
function TindakanDetailBody({
  tindakan,
  locationLabel,
}: {
  tindakan: MitraTindakan
  locationLabel: string
}) {
  return (
    <div className="flex flex-col gap-16 border-t border-default px-12 py-12">
      <div className="flex flex-col gap-4">
        <span className="text-12 font-bold text-caption">Catatan</span>
        <p className="text-14 text-default">{tindakan.catatan}</p>
      </div>

      {tindakan.evidence ? (
        <>
          <PhotoPreview />
          <MapPreview label={locationLabel} />
        </>
      ) : (
        <p className="rounded-8 bg-neutral-white px-12 py-8 text-12 text-caption">
          Tidak ada foto atau lokasi tercatat — tindakan ini dilakukan dari jarak jauh.
        </p>
      )}
    </div>
  )
}

/**
 * "Lihat detail" — every mitra under this BP, not just the ones behind a
 * standard. Each row previews her last two tindakan and her open follow-up;
 * the chevron drills into her own full history in the panel beside this one.
 */
function MitraListPanel({
  roster,
  statusOptions,
  selectedId,
  onSelectMitra,
}: {
  roster: MitraDrawerRow[]
  statusOptions: { value: string; label: string }[]
  selectedId?: string
  onSelectMitra: (mitra: MitraDrawerRow) => void
}) {
  const [status, setStatus] = useState('all')
  // Pencairan-only — a Pembayaran roster's rows carry no `segment`, so the
  // filter has nothing to switch between and stays off rather than showing
  // a control that can only ever do nothing.
  const hasSegments = roster.some((m) => m.segment)
  const [segment, setSegment] = useState('all')
  const filtered = roster.filter(
    (m) => (status === 'all' || m.statusId === status) && (segment === 'all' || m.segment === segment),
  )

  return (
    <div className="flex h-full flex-col" style={{ width: LIST_PANEL_W }}>
      <div className="flex shrink-0 flex-col gap-12 border-b border-default p-24">
        <Input size="sm" prefix={<MagnifyingGlass size={16} />} placeholder="Cari mitra" disabled />
        <div className="flex flex-wrap items-center gap-12">
          <Select
            label="Semua status"
            value={status}
            onChange={setStatus}
            options={[{ value: 'all', label: 'Semua status' }, ...statusOptions]}
          />
          {hasSegments ? (
            <Select
              label="Semua mitra"
              value={segment}
              onChange={setSegment}
              options={[
                { value: 'all', label: 'Semua mitra' },
                { value: 'baru', label: 'Mitra baru' },
                { value: 'lanjutan', label: 'Mitra lanjutan' },
              ]}
            />
          ) : null}
          <Select
            label="Semua majelis"
            value="all"
            onChange={() => undefined}
            options={[{ value: 'all', label: 'Semua majelis' }]}
            disabled
          />
        </div>
        <span className="text-12 text-caption">Total {filtered.length} mitra ditampilkan</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-12 overflow-y-auto p-24">
        {filtered.length === 0 ? (
          <span className="text-14 text-caption">Tidak ada mitra dengan status ini.</span>
        ) : null}
        {filtered.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelectMitra(m)}
            className={`flex flex-col gap-8 rounded-8 border p-12 text-left ${
              selectedId === m.id ? 'border-primary-500' : 'border-default hover:border-primary-500'
            }`}
          >
            <span className="flex items-start justify-between gap-8">
              <span className="flex items-center gap-8">
                <span className="text-14 font-bold text-default">{m.name}</span>
                <Badge intent={m.statusIntent} variant="subtle" size="sm">
                  {m.statusLabel}
                </Badge>
              </span>
              <span className="flex items-center gap-8">
                {m.metricLabel ? (
                  <span className="flex flex-col items-end">
                    <span className="text-10 text-caption">{m.metricLabel}</span>
                    <span className="text-14 font-bold text-default">{m.metricValue}</span>
                  </span>
                ) : null}
                <ChevronRight size={16} className="text-caption" />
              </span>
            </span>

            {/* Pencairan-only — the app's own leads list names a lead's
                source and location, and logs when she was added, on every
                card; Pembayaran's mitra carry none of these fields, so the
                block skips entirely rather than printing blanks. Two meta
                lines, not four: code/majelis paired against when the lead
                was added (both are "when and where does she sit"), source
                and location paired on the line under it (both are "where
                did this lead come from"). Code/majelis themselves are
                blank for a lead who hasn't been surveyed yet — there's no
                assignment to show, so that half of the line goes empty
                rather than printing "undefined · undefined". */}
            {m.leadDate ? (
              <div className="flex flex-col gap-2">
                <span className="flex items-center justify-between gap-8 text-12 text-caption">
                  <span>{m.code && m.majelis ? `${m.code} · ${m.majelis}` : null}</span>
                  <span>
                    {m.leadDate} · {m.leadDateRelative}
                  </span>
                </span>
                {m.source || m.location ? (
                  <span className="flex items-center gap-4 text-12 text-caption">
                    {m.source ? <span>{m.source}</span> : null}
                    {m.source && m.location ? <span>·</span> : null}
                    {m.location ? (
                      <span className="flex items-center gap-2">
                        <MapPin size={16} />
                        {m.location}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </div>
            ) : (
              <span className="text-12 text-caption">
                {m.code} · {m.majelis}
              </span>
            )}

            <div className="flex flex-col gap-8 border-t border-default pt-8">
              <span className="text-10 font-bold text-caption">Tindakan terakhir</span>
              {m.tindakan.slice(0, 2).map((t, i) => (
                <TindakanRow key={i} t={t} />
              ))}
              <span className="rounded-8 bg-neutral-100 px-8 py-4 text-10 text-caption">
                Tindak lanjut: {m.followUp}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * One mitra's own picture, drilled into from her row in the panel beside
 * this one: her call/visit counts, then the tindakan log those counts are
 * drawn from — every entry, not just the preview the roster panel showed.
 */
/** Icon + the sub-caption's verb, per tindakan type — "dijawab" only makes
 *  sense for a call, "ditemui"/"berhasil" only for a visit or a contact that
 *  landed, so each type gets its own rather than one label stretched to
 *  cover all three. */
const JENIS_META: Record<MitraTindakan['jenis'], { icon: ReactNode; subLabel: string }> = {
  Telepon: { icon: <Phone size={16} />, subLabel: 'dijawab' },
  'Home Visit': { icon: <House size={16} />, subLabel: 'ditemui' },
  Contacted: { icon: <Phone size={16} />, subLabel: 'berhasil' },
}

function MitraDetailPanel({ mitra, onClose }: { mitra: MitraDrawerRow; onClose: () => void }) {
  // Which stat cards to show is derived from the tindakan actually logged,
  // not hardcoded to Telepon/Home Visit — Pencairan's leads log "Contacted"
  // instead of Telepon, and a hardcoded pair would print a permanent 0.
  const jenisSeen = Array.from(new Set(mitra.tindakan.map((t) => t.jenis)))
  // Which tindakan's own detail is open, by index rather than identity — two
  // entries can share every visible field. Pencairan's leads carry their own
  // `location`; Pembayaran's mitra don't log one, so her majelis stands in
  // for "roughly where" the visit happened.
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const locationLabel = mitra.location ?? (mitra.majelis ? `Sekitar ${mitra.majelis}` : 'Lokasi tidak tercatat')

  return (
    <div className="flex h-full flex-col border-l border-default" style={{ width: DETAIL_PANEL_W }}>
      <div className="flex shrink-0 items-start justify-between gap-16 border-b border-default p-24">
        <span className="flex flex-col gap-4">
          <span className="flex items-center gap-8">
            <span className="text-16 font-bold text-default">{mitra.name}</span>
            <Badge intent={mitra.statusIntent} variant="subtle" size="sm">
              {mitra.statusLabel}
            </Badge>
          </span>
          {mitra.code && mitra.majelis ? (
            <span className="text-12 text-caption">
              {mitra.code} · {mitra.majelis}
            </span>
          ) : null}
        </span>
        {mitra.metricLabel ? (
          <span className="flex flex-col items-end">
            <span className="text-10 text-caption">{mitra.metricLabel}</span>
            <span className="text-14 font-bold text-default">{mitra.metricValue}</span>
          </span>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-16 overflow-y-auto p-24">
        <span className="text-12 font-bold text-caption">Riwayat tindakan</span>

        <div className="flex gap-12">
          {jenisSeen.map((jenis) => {
            const entries = mitra.tindakan.filter((t) => t.jenis === jenis)
            const ok = entries.filter((t) => t.hasilOk).length
            const meta = JENIS_META[jenis]
            return (
              <div key={jenis} className="flex flex-1 flex-col gap-4 rounded-8 border border-default p-12">
                <span className="flex items-center gap-8 text-caption">
                  {meta.icon}
                  <span className="text-12">{jenis}</span>
                </span>
                <span className="text-20 font-bold text-default">{entries.length} kali</span>
                <span className="text-10 text-caption">
                  {ok} {meta.subLabel}
                </span>
              </div>
            )
          })}
        </div>

        {/* A timeline rather than a flat list — a dot per entry with a
            connector line running down to the next one, so the log reads as
            one continuous history rather than unrelated rows. Built as a
            two-column flex (dot column, content column), not absolute
            positioning: entries wrap to different heights, and a stretchy
            filler always reaches the next dot exactly where a fixed offset
            would drift. The dot column is itself split top/bottom/dot so the
            dot centers on its row's card instead of pinning to the top —
            each half-filler is colored except the very first (nothing above
            the first dot) and very last (nothing below the last), so two
            adjacent halves still read as one continuous line. */}
        <div className="flex flex-col">
          {mitra.tindakan.map((t, i) => {
            const first = i === 0
            const last = i === mitra.tindakan.length - 1
            const open = openIndex === i
            return (
              <div key={i} className="flex gap-12">
                <div className="flex w-8 shrink-0 flex-col items-center">
                  <span className={`w-2 flex-1 ${first ? '' : 'bg-neutral-200'}`} />
                  <span className="block size-8 shrink-0 rounded-full bg-primary-500" />
                  <span className={`w-2 flex-1 ${last ? '' : 'bg-neutral-200'}`} />
                </div>
                <div className="flex-1 pb-12">
                  <div className="overflow-hidden rounded-8 bg-neutral-50">
                    <TindakanRow t={t} expanded={open} onClick={() => setOpenIndex(open ? null : i)} />
                    {open ? (
                      <TindakanDetailBody tindakan={t} locationLabel={locationLabel} />
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-12 border-t border-default p-24">
        <Button variant="outline" onClick={onClose}>
          Tutup
        </Button>
      </div>
    </div>
  )
}

/** The BP roster and, once a mitra is picked, her own detail — both panels
 *  live together in one overlay so the second slides in beside the first
 *  rather than covering it, under one combined header (name, Download, the
 *  drawer's one close control). */
export function MitraDrawer({
  bpName,
  roster,
  statusOptions,
  mitra,
  onCloseAll,
  onSelectMitra,
  onCloseMitra,
}: {
  bpName: string
  roster: MitraDrawerRow[]
  statusOptions: { value: string; label: string }[]
  mitra: MitraDrawerRow | null
  onCloseAll: () => void
  onSelectMitra: (mitra: MitraDrawerRow) => void
  onCloseMitra: () => void
}) {
  const [preparing, setPreparing] = useState(false)

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-overlay">
      <div
        className="flex h-full flex-col bg-neutral-white"
        style={{ width: mitra ? LIST_PANEL_W + DETAIL_PANEL_W : LIST_PANEL_W }}
      >
        <div className="flex shrink-0 items-center justify-between gap-16 border-b border-default p-24">
          <span className="flex items-center gap-16">
            <span className="text-20 font-bold text-default">{bpName}</span>
            <Button variant="outline" size="sm" onClick={() => setPreparing(true)}>
              <span className="flex items-center gap-8">
                <DownloadSimple size={16} />
                {preparing ? 'Sedang disiapkan' : 'Download'}
              </span>
            </Button>
          </span>
          <button type="button" aria-label="Tutup" onClick={onCloseAll} className="text-caption">
            <Cross size={20} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <MitraListPanel roster={roster} statusOptions={statusOptions} selectedId={mitra?.id} onSelectMitra={onSelectMitra} />
          {mitra ? <MitraDetailPanel mitra={mitra} onClose={onCloseMitra} /> : null}
        </div>
      </div>
    </div>
  )
}
