// Representative rows for the customer table — five, not fifty (CLAUDE.md §3).
// The shipped frame is a component-library specimen with placeholder copy; these
// are plausible NG-MIS values so the density reads honestly, but nothing here is
// real customer data.

import type { Column, Row } from './ui'

export const COLUMNS: Column[] = [
  { id: 'customer', header: 'Customer', width: 280, sortable: true },
  { id: 'account', header: 'Account', width: 280, sortable: true },
  { id: 'status', header: 'Status', width: 240, sortable: true },
]

export const ROWS: Row[] = [
  {
    id: 'AMR-100238',
    cells: {
      customer: { title: 'Siti Rohmah', lines: ['3204 1806 8700 0012', 'Bandung Barat'] },
      account: {
        title: 'AMR-100238',
        link: true,
        person: true,
        lines: ['Majelis Melati 04', 'AO: Dewi Anggraini'],
      },
      status: {
        title: '',
        status: { label: 'Lancar', intent: 'green' },
        lines: ['Angsuran 18/50', 'Rp 4.200.000'],
      },
    },
  },
  {
    id: 'AMR-100411',
    cells: {
      customer: { title: 'Nur Aisyah', lines: ['3273 2204 9200 0007', 'Garut'] },
      account: {
        title: 'AMR-100411',
        link: true,
        lines: ['Majelis Kenanga 11', 'AO: Rizal Maulana'],
      },
      status: {
        title: '',
        status: { label: 'Menunggak', intent: 'orange' },
        lines: ['Angsuran 22/50', 'Rp 1.850.000'],
      },
    },
  },
  {
    id: 'AMR-100517',
    cells: {
      customer: { title: 'Wulandari', lines: ['3204 0911 8800 0031', 'Cianjur'] },
      account: {
        title: 'AMR-100517',
        link: true,
        person: true,
        lines: ['Majelis Anggrek 02', 'AO: Dewi Anggraini'],
      },
      status: {
        title: '',
        status: { label: 'Lancar', intent: 'green' },
        lines: ['Angsuran 7/25', 'Rp 2.400.000'],
      },
    },
  },
  {
    id: 'AMR-100648',
    cells: {
      customer: { title: 'Ratna Sari', lines: ['3216 1502 9100 0044', 'Bekasi'] },
      account: {
        title: 'AMR-100648',
        link: true,
        lines: ['Majelis Dahlia 08', 'AO: Bayu Pratama'],
      },
      status: {
        title: '',
        status: { label: 'Bermasalah', intent: 'red' },
        lines: ['Angsuran 31/50', 'Rp 6.100.000'],
      },
    },
  },
  {
    id: 'AMR-100792',
    cells: {
      customer: { title: 'Endah Purwanti', lines: ['3603 2707 8900 0019', 'Serang'] },
      account: {
        title: 'AMR-100792',
        link: true,
        person: true,
        lines: ['Majelis Melati 04', 'AO: Rizal Maulana'],
      },
      status: {
        title: '',
        status: { label: 'Pengajuan', intent: 'primary' },
        lines: ['Belum dicairkan', 'Rp 3.000.000'],
      },
    },
  },
]
