import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: 'afin-bank-integration',
  name: 'Bank Account Integration',
  businessUnit: 'Payments',
  platform: 'AFIN',
  owner: 'Hazki',
  description: 'A white-labelled bank account inside AmarthaFin, alongside Poket: opening, balance and top-up.',
  device: 'mobile',
  status: 'draft',
  createdAt: '2026-09-28',
  extends: 'amarthafin-live',
}
