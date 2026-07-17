import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: 'apartner-task-first',
  name: 'A-Partner — Task-First IA',
  owner: 'Hazki',
  description:
    "A second direction on the A-Partner IA, opposite in premise to the homepage-IA exploration: the BP should never have to read, analyse, or synthesise anything. The app opens on today's schedule hour by hour and tells them the one thing to do now. The majelis page follows from that — it is a collection queue that drains as the BP works, not a dashboard about the majelis.",
  device: 'mobile',
  status: 'draft',
  createdAt: '2026-07-17',
  notes: [
    'Sibling direction to apartner-homepage-ia, not a replacement — that one makes the KPI page the spine and hangs tasks off the metrics; this one deletes the metrics and keeps only the tasks.',
    'The test: can a BP work an entire majelis visit without reading a single number they have to interpret?',
    'Two screens so far. Home Visit is scheduled and visible on the timeline but has no page yet — the "Mulai Kunjungan" button is disabled when it comes up.',
  ],
}
