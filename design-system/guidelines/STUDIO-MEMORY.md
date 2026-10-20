# Studio memory

Lessons that apply to every prototype, beyond CLAUDE.md and the cheatsheet.
Chat reads this at the start of every conversation but can't change it; the
studio owner adds to it with `/studio-memory`. What belongs to one prototype goes
in that prototype's own `MEMORY.md`.

## Copy

- Screen copy is Bahasa Indonesia, like the shipped apps. Keep it that way, and
  don't translate copy that's already there unless the designer asks.

## Copy a common piece from the live reference that has it

FunDS has no component for these yet, and they are what prototypes redraw most.
Copy the piece into your own `lib/` (never import across projects):

- Sticky bottom action bar: `StickyBar`, in `apartner-sot/lib/ui.tsx`
- Label–value rows: `StatRows`, in `apartner-sot/lib/ui.tsx`
- Section heading: `SectionTitle`, in `amarthafin-live/lib/ui.tsx` (AmarthaFin)
  or `apartner-sot/lib/ui.tsx` (A-Partner)
- Empty state: `EmptyState`, in `apartner-sot/lib/ui.tsx`
- Desktop table: `DataTable`, `TableCard`, `Toolbar` and `Pagination`, in
  `ngmis-live/lib/ui.tsx`
- AmarthaFin home: `BrandBand`, `PoketWidget` and `Shortcut`, in
  `amarthafin-live/lib/ui.tsx`

## A-Partner

- `apartner-sot` is the shipped field app, matched to the BP APP 2026 Figma.
  `apartner-majelis-view` is a concept exploration, not the shipped app.
- Its Tugas list deliberately doesn't follow Figma: the Figma version is old.
- Radio lists in bottom sheets use the plain radio style, `ChoiceList` and
  `RadioRow`.

## Visual taste

- Don't stack solid purple blocks. The brand band plus two purple cards read as
  "too purple" (afin-linear home, 2026-09). For secondary cards, use white, a
  coloured header strip, or the light `primary-50` tint the Poket widget uses.
