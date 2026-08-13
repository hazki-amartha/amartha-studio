'use client'

// User details — reached from the "tandai BP sebagai mangkir" link on the Cash
// outstanding table. A left profile card (identity, status, personal + org info)
// beside a right Activities log. The "Update" link by the status opens a dialog
// to change it. Which BP this is comes from the module store the table sets
// before navigating; the rest of the profile is representative fixed data.

import { useEffect, useState, type ReactNode } from 'react'
import { Badge, Button, Modal } from '@/design-system/components'
import { ChevronLeft, ChevronRight } from '@/design-system/icons'
import { FoShell } from '../lib/shell'
import { Panel, Select } from '../lib/ui'
import { useSelectedBp } from '../lib/store'

type StatusId = 'active' | 'inactive' | 'leave'

const STATUSES: { id: StatusId; label: string; intent: 'green' | 'red' | 'orange' }[] = [
  { id: 'active', label: 'Active', intent: 'green' },
  { id: 'inactive', label: 'Inactive', intent: 'red' },
  { id: 'leave', label: 'Cuti', intent: 'orange' },
]

/** Representative profile fields — fixed for the prototype; only the name and
 *  avatar initial follow the BP the table sent here. */
const PROFILE = {
  employeeId: '20001014',
  joinDate: '14 Apr 2024',
  leaveNote: 'On leave, 20 – 24 Feb 2026',
  majelisCount: 10,
  phone: '+6281324019923',
  email: 'n/a',
  address: 'Jl. Anggrek Barat, Kabupaten Malang 14220',
  role: 'Business Partner',
  division: 'Operations',
  company: 'PT. Amartha Mikro Fintek',
  island: 'Jawa',
  region: 'Jawa Timur',
  area: 'Malang',
  branch: 'Jatimulyo 01',
}

const ACTIVITIES = [
  { title: 'Status update: Active to Inactive', by: 'Andreas Mulyo', at: '06 FEB 2026, 12:09:22 WIB' },
  { title: 'Password change', by: 'superfaudy 🚀', at: '06 FEB 2026, 12:09:22 WIB' },
  { title: 'Account creation', by: 'Robert Peterson', at: '06 FEB 2026, 12:09:22 WIB' },
]

export function FoUserManagementScreen() {
  const name = useSelectedBp()
  const [statusId, setStatusId] = useState<StatusId>('active')
  const [editingStatus, setEditingStatus] = useState(false)

  return (
    <FoShell
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Settings' },
        { label: 'Users' },
        { label: name, current: true },
      ]}
      header={
        <h1 className="py-16 text-24 font-bold text-default">User details - {name}</h1>
      }
    >
      <div className="flex flex-wrap items-start gap-16">
        <ProfileCard
          name={name}
          statusId={statusId}
          onUpdateStatus={() => setEditingStatus(true)}
        />
        <ActivitiesCard />
      </div>

      <StatusDialog
        open={editingStatus}
        current={statusId}
        onClose={() => setEditingStatus(false)}
        onSave={(next) => {
          setStatusId(next)
          setEditingStatus(false)
        }}
      />
    </FoShell>
  )
}

// --- Profile card -----------------------------------------------------------

const CARD_W = 360

function ProfileCard({
  name,
  statusId,
  onUpdateStatus,
}: {
  name: string
  statusId: StatusId
  onUpdateStatus: () => void
}) {
  const status = STATUSES.find((s) => s.id === statusId) ?? STATUSES[0]
  return (
    <div
      className="shrink-0 overflow-hidden rounded-16 border border-default bg-neutral-white"
      style={{ width: CARD_W }}
    >
      {/* Brand band + overlapping avatar */}
      <div className="h-64 bg-gradient-to-r from-neutral-900 to-primary-600" />
      <div className="flex flex-col gap-16 px-16 pb-16">
        <span
          className="-mt-32 flex size-64 items-center justify-center rounded-full border-4 border-neutral-white bg-green-500 text-24 font-bold text-neutral-white"
        >
          {name.charAt(0)}
        </span>

        <div className="flex flex-col gap-4">
          <h2 className="text-20 font-bold text-default">{name}</h2>
          <span className="text-12 text-caption">Employee ID: {PROFILE.employeeId}</span>
          <span className="text-12 text-caption">Join date: {PROFILE.joinDate}</span>
          <span className="pt-4">
            <Button variant="outline" size="sm">
              Edit Details
            </Button>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-12 text-caption">Status</span>
          <span className="flex items-center gap-8">
            <Badge intent={status.intent} variant="subtle" size="sm">
              {status.label}
            </Badge>
            <button
              type="button"
              onClick={onUpdateStatus}
              className="text-14 font-regular text-link underline active:opacity-70"
            >
              Update
            </button>
          </span>
          <span className="text-12 text-caption">{PROFILE.leaveNote}</span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-12 text-caption">Majelis under management</span>
          <span className="flex items-center gap-8 text-14 text-default">
            {PROFILE.majelisCount} majelis
            <button
              type="button"
              className="text-14 font-regular text-link underline active:opacity-70"
            >
              View ↗
            </button>
          </span>
        </div>
      </div>

      <SectionHeader>Personal information</SectionHeader>
      <div className="flex flex-col gap-16 px-16 py-16">
        <Field label="Phone number" value={PROFILE.phone} />
        <Field label="Email" value={PROFILE.email} />
        <Field label="Address" value={PROFILE.address} />
      </div>

      <SectionHeader>Organization information</SectionHeader>
      <div className="flex flex-col gap-16 px-16 py-16">
        <Field label="Role" value={PROFILE.role} />
        <Field label="Division/department" value={PROFILE.division} />
        <Field label="Company" value={PROFILE.company} />
        <div className="grid grid-cols-2 gap-16">
          <Field label="Island" value={PROFILE.island} />
          <Field label="Region" value={PROFILE.region} />
          <Field label="Area" value={PROFILE.area} />
          <Field label="Branch" value={PROFILE.branch} />
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ children }: { children: ReactNode }) {
  return <div className="bg-primary-50 px-16 py-8 text-14 font-bold text-default">{children}</div>
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-12 text-caption">{label}</span>
      <span className="text-14 text-default">{value}</span>
    </div>
  )
}

// --- Activities card --------------------------------------------------------

function ActivitiesCard() {
  const [perPage, setPerPage] = useState('10')
  return (
    <Panel className="min-w-0 flex-1 p-24">
      <h2 className="pb-16 text-20 font-bold text-default">Activities</h2>
      <div className="flex flex-col">
        {ACTIVITIES.map((a) => (
          <div key={a.title} className="flex flex-col gap-2 border-b border-default py-12 first:pt-0">
            <span className="text-14 font-bold uppercase text-default">{a.title}</span>
            <span className="text-14 text-caption">
              Updated by {a.by}, {a.at}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-16 pt-16 text-12 text-caption">
        <span>1 – {ACTIVITIES.length} of {ACTIVITIES.length} entries</span>
        <div className="flex items-center gap-8">
          <span className="flex size-32 items-center justify-center rounded-full text-placeholder">
            <ChevronLeft size={16} />
          </span>
          <span className="flex size-32 items-center justify-center rounded-8 border border-primary-500 text-12 font-bold text-link">
            1
          </span>
          <span className="flex size-32 items-center justify-center rounded-full text-placeholder">
            <ChevronRight size={16} />
          </span>
        </div>
        <Select
          label="Baris per halaman"
          value={perPage}
          onChange={setPerPage}
          options={[
            { value: '10', label: '10 / page' },
            { value: '20', label: '20 / page' },
            { value: '50', label: '50 / page' },
          ]}
        />
      </div>
    </Panel>
  )
}

// --- Status dialog ----------------------------------------------------------

function StatusDialog({
  open,
  current,
  onClose,
  onSave,
}: {
  open: boolean
  current: StatusId
  onClose: () => void
  onSave: (next: StatusId) => void
}) {
  const [choice, setChoice] = useState<StatusId>(current)
  useEffect(() => {
    if (open) setChoice(current)
  }, [open, current])
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Update status"
      primaryAction={
        <Button variant="primary" size="md" onClick={() => onSave(choice)}>
          Simpan
        </Button>
      }
      secondaryAction={
        <Button variant="outline" size="md" onClick={onClose}>
          Batal
        </Button>
      }
    >
      <div className="flex flex-col gap-8 pt-8">
        {STATUSES.map((s) => {
          const on = s.id === choice
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setChoice(s.id)}
              className={`flex items-center gap-12 rounded-8 border px-12 py-12 text-left ${
                on ? 'border-primary-500 bg-primary-50' : 'border-default hover:bg-neutral-50'
              }`}
            >
              <span
                className={`flex size-16 items-center justify-center rounded-full border-2 ${
                  on ? 'border-primary-500' : 'border-default'
                }`}
              >
                {on ? <span className="size-8 rounded-full bg-primary-500" /> : null}
              </span>
              <span className="text-14 font-regular text-default">{s.label}</span>
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
