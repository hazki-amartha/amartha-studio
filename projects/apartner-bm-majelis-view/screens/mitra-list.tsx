'use client'

// Mitra — every borrower the BP carries, across every group.
//
// The Majelis tab answers "who is in this group". This answers "where is Ibu
// Rina", and that is a question a directory of groups cannot take: the BP knows
// the name and not the majelis, because the woman phoning her does not open
// with which balai she attends.
//
// The card is the roster's card, unchanged — same photo, same name, same
// labels, same DPD badge, same chevron last — with one line added under the
// name for which majelis she is in. That line is the only reason this list is
// not the roster: on the roster the group is the page you are already on.
//
// Search and filter split the same way as everywhere else in this direction:
// search is for a woman she can NAME, the filters are for a set she can only
// describe — "everyone past 30 days", "everyone in Kenanga".

import { useState } from 'react'
import { Badge, NavigationHeader } from '@/design-system/components'
import { useFlow } from '@/platform/runtime'
import { BUSINESS_PARTNERS, findBP } from '../lib/bp'
import { DpdBadge, MitraCard } from '../lib/mitra-card'
import { DPD_BUCKETS, bucketOf, portfolio, sourceMitraId, type DpdBucket } from '../lib/portfolio'
import { MAJELIS_DIRECTORY } from '../lib/schedule'
import { store } from '../lib/store'
import { TabBar } from '../lib/tabs'
import { AppScreen, EmptyState, FilterBar, FilterChip, OptionSheet, ProductBadge, ResetLink, SearchField, VisitTitle } from '../lib/ui'

type MenuId = 'dpd' | 'majelis' | 'bp' | null

// The BM reads her branch one BP at a time, so the mitra directory takes the
// same filter the majelis directory does. A mitra has no BP of her own: she
// inherits the one who carries her group, which is why this filters on the
// group rather than on her.
const BP_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Semua BP', value: null },
  ...BUSINESS_PARTNERS.map((bp) => ({ label: bp.name, value: bp.id })),
]

const DPD_OPTIONS: { label: string; value: DpdBucket | null }[] = [
  { label: 'Semua status', value: null },
  ...DPD_BUCKETS.map((b) => ({ label: b, value: b })),
]

const MAJELIS_OPTIONS: { label: string; value: string | null }[] = [
  { label: 'Semua majelis', value: null },
  ...MAJELIS_DIRECTORY.filter((g) => g.status === 'aktif').map((g) => ({
    label: g.name,
    value: g.id,
  })),
]

export function MitraListScreen() {
  const flow = useFlow()
  const [query, setQuery] = useState('')
  const [dpd, setDpd] = useState<DpdBucket | null>(null)
  const [majelis, setMajelis] = useState<string | null>(null)
  const [bp, setBp] = useState<string | null>(null)
  const [menu, setMenu] = useState<MenuId>(null)

  const all = portfolio()
  const q = query.trim().toLowerCase()

  const rows = all
    .filter((row) => {
      if (q && !row.mitra.name.toLowerCase().includes(q)) return false
      if (dpd && bucketOf(row.mitra.dpd) !== dpd) return false
      if (majelis && row.group.id !== majelis) return false
      if (bp && row.group.bpId !== bp) return false
      return true
    })
    // Most behind first, same default as the roster: the mitra worth reading
    // about first are the ones in arrears, whichever group they sit in.
    .sort((a, b) => b.mitra.dpd - a.mitra.dpd || a.mitra.name.localeCompare(b.mitra.name))

  const filtered = Boolean(dpd || majelis || bp)

  return (
    <AppScreen
      topBar={
        // Same header as the Majelis tab: title with the count as its subtitle
        // on the left. The count used to sit pinned to the far edge, which read
        // as a second competing fact rather than as what the title is ABOUT —
        // and put the two directory tabs on two different headers.
        <NavigationHeader
          hideBack
          title={<VisitTitle title="Mitra" when={`${all.length} mitra`} />}
        />
      }
    >
      <SearchField
        value={query}
        onChange={setQuery}
        placeholder="Cari nama mitra"
        label="Cari mitra"
      />

      <FilterBar>
        <FilterChip
          label={bp ? findBP(bp).name : 'BP'}
          active={Boolean(bp)}
          open={menu === 'bp'}
          onClick={() => setMenu('bp')}
        />
        <FilterChip
          label={dpd ?? 'Status'}
          active={Boolean(dpd)}
          open={menu === 'dpd'}
          onClick={() => setMenu('dpd')}
        />
        <FilterChip
          label={MAJELIS_DIRECTORY.find((g) => g.id === majelis)?.name ?? 'Majelis'}
          active={Boolean(majelis)}
          open={menu === 'majelis'}
          onClick={() => setMenu('majelis')}
        />
        {filtered ? (
          <ResetLink
            onClick={() => {
              setDpd(null)
              setMajelis(null)
              setBp(null)
            }}
          />
        ) : null}
      </FilterBar>

      {q || filtered ? (
        <span className="text-12 text-caption">
          {rows.length} dari {all.length} mitra
        </span>
      ) : null}

      <div className="flex flex-col gap-8 pb-16">
        {rows.length === 0 ? (
          <EmptyState title="Mitra tidak ditemukan" body="Coba nama, status, atau majelis lain." />
        ) : null}
        {rows.map(({ mitra, group }) => (
          <MitraCard
            key={mitra.id}
            mitra={mitra}
            // The one addition to the roster's card. Her majelis and when it
            // meets, because a mitra found by name is a mitra whose group the
            // BP does not yet know — which is the whole reason she is here.
            meta={
              <>
                <span className="truncate text-12 text-caption">
                  {group.name} · {group.day}, {group.time}
                </span>
                {/* Who carries her. On the card rather than only on her page,
                    because the BM's question about a mitra she found by name is
                    usually "whose is she" — and answering it should not cost a
                    page. */}
                <span className="truncate text-12 text-caption">
                  BP · {findBP(group.bpId).name}
                </span>
              </>
            }
            titleBadge={
              mitra.id === 'm3' ? <Badge intent="primary">KM</Badge> : null
            }
            labels={
              <>
                <ProductBadge product={mitra.product} />
                {mitra.ptp ? <Badge intent="blue">Janji bayar {mitra.ptp}</Badge> : null}
                {mitra.keringanan ? <Badge intent="yellow">Dapat keringanan</Badge> : null}
                {mitra.pelunasanDini ? (
                  <Badge intent="green">Dapat pelunasan dini</Badge>
                ) : null}
              </>
            }
            trailing={<DpdBadge dpd={mitra.dpd} format="short" />}
            onOpen={() => {
              store.openMitraPage(sourceMitraId(mitra.id))
              flow.go('mitra')
            }}
          />
        ))}
      </div>

      <TabBar active="mitra-list" />

      <OptionSheet
        open={menu === 'bp'}
        title="Business Partner"
        name="mitra-bp"
        options={BP_OPTIONS}
        value={bp}
        onPick={(v) => {
          setBp(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'dpd'}
        title="Status pembayaran"
        name="mitra-dpd"
        options={DPD_OPTIONS}
        value={dpd}
        onPick={(v) => {
          setDpd(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
      <OptionSheet
        open={menu === 'majelis'}
        title="Majelis"
        name="mitra-majelis"
        options={MAJELIS_OPTIONS}
        value={majelis}
        onPick={(v) => {
          setMajelis(v)
          setMenu(null)
        }}
        onClose={() => setMenu(null)}
      />
    </AppScreen>
  )
}
