// The presentation states — the one-click controls beside the device.
//
// Each one seeds the module store and nothing else, so the prototype's own code
// never learns that a demo exists. Kept here, out of the screens, per §3.

import { EVENTS } from './events'
import { pipelineStore } from './pipeline-store'
import { store } from './store'

// --- Sosialisasi -----------------------------------------------------------
//
// The POI screen counts the prospects captured AT this POI, so a state is just
// "how many names are on the board" — the number the BP is working against.

/** Names taken down in the order a BP would take them: first name, then phone. */
const WALK_UPS = [
  { name: 'Ibu Sumiati', phone: '0812-3344-5566' },
  { name: 'Ibu Nurhayati', phone: '0813-2211-9087' },
  { name: 'Ibu Rohmah', phone: '0857-8891-2245' },
  { name: 'Ibu Wartini', phone: '0821-4455-6677' },
  { name: 'Ibu Lastri', phone: '0895-3312-8890' },
]

/** Puts the BP at Warung Bu Ipah with `count` names already on the board. */
function sosialisasi(count: number) {
  pipelineStore.reset()
  store.openSosialisasi('e1')
  const poi = EVENTS[0].poi
  WALK_UPS.slice(0, count).forEach((w) =>
    pipelineStore.addLead({
      name: w.name,
      phone: w.phone,
      source: 'poi',
      poi,
      referredBy: '',
      referrerKind: null,
      majelis: { kind: 'none', branch: 'BP Ciseeng' },
      nik: '',
      ktp: false,
    }),
  )
}

export const eventEmpty = () => sosialisasi(0)
export const eventHalf = () => sosialisasi(3)
export const eventFull = () => sosialisasi(WALK_UPS.length)

// --- Follow Up -------------------------------------------------------------
//
// `openFollowUp` carries the task id, so the screen knows the call is a booked
// one rather than something the BP started off her own roster.

const FOLLOW_UP_TASK = 't2c'
const FOLLOW_UP_LEAD = 'p2'

/** Default layout, on the connected lead, as her scheduled follow-up. */
export const followUpDefault = () => {
  pipelineStore.reset()
  store.startFollowUp(FOLLOW_UP_TASK)
  pipelineStore.openFollowUp(FOLLOW_UP_LEAD, FOLLOW_UP_TASK)
}

/** Alt layout: the "Tawarkan pengajuan" flow, same lead and task. */
export const followUpAlt = () => {
  pipelineStore.reset()
  store.startFollowUp(FOLLOW_UP_TASK)
  pipelineStore.openFollowUp(FOLLOW_UP_LEAD, FOLLOW_UP_TASK)
  pipelineStore.setFollowUpVariant('alt')
}
