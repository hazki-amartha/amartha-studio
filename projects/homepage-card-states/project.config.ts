import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: 'homepage-card-states',
  name: 'Homepage Card States',
  platform: 'AFIN',
  owner: 'Chandra',
  description:
    'Component-level exploration of the three AmarthaFin homepage cards — pinjaman berjalan, dana siap, and limit growth — across the loan lifecycle. Each state is a screen, so the flow view reads as the state machine the cards move through. Tests one direction: motivational purple headlines with an arrow affordance on every card, the top-up projection collapsed behind a disclosure, and the three ring meters rolled up into a single current→potential gauge.',
  device: 'mobile',
  status: 'draft',
  createdAt: '2026-07-17',
  updatedAt: '2026-07-17',
  notes: [
    'This is a component exploration, not a page flow — the unit under test is the card stack, and each screen is one lifecycle state of it.',
    'The three cards live in lib/ as project-local components. Ring, LimitGauge, and CardHeader have no design-system equivalent yet — see NOTES.md for the promotion proposal.',
  ],
}
