import { initial, store } from './store'

export const onTrack = () => store.seed(initial)

export const attendanceSlip = () => store.seed({ ...initial, absent: [3, 6, 9] })

export const notEligible = () => store.seed({ ...initial, late: [7] })

export const groupWatch = () => store.seed({ ...initial, groupShort: 2 })

export const bonusReady = () => store.seed({ ...initial, weeksDone: 12, milestones: ['siap'] })

export const milestoneMissed = () =>
  store.seed({ ...initial, weeksDone: 14, milestones: ['lewat'] })
