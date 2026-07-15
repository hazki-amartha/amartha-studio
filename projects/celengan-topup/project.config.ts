import type { ProjectConfig } from '@/platform/types'

export const config: ProjectConfig = {
  slug: 'celengan-topup',
  name: 'Celengan — Top Up',
  owner: 'Hazki',
  description:
    'A savings (Celengan) top-up flow: pick a savings goal, enter an amount, choose a payment method, confirm in a bottom sheet, and land on a success receipt — with a cancel modal and a payment-failed retry state.',
  device: 'mobile',
  status: 'draft',
  createdAt: '2026-07-15',
  notes: ['Celengan top-up exploration — goal → amount → method → review → success, with cancel + failure branches.'],
}
