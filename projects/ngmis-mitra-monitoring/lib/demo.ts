'use client'

// Presentation states offered beside the device. Each writes the same store
// the screen reads, so picking one is the same as the page having been built
// that way.

import { store } from './store'

export const showHmb = () => store.setRole('hmb')
export const showFo = () => store.setRole('fo')
