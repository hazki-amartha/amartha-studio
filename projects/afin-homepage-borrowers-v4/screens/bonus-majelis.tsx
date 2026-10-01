'use client'

// Bonus majelis — three states from Figma section 2963:32482.

import {
  ActiveBonusCard,
  BonusMajelisFrame,
  ClaimedBonusCard,
  FailedBonusCard,
  LockedBonusCard,
  SectionTitle,
} from '../lib/bonus-majelis'
import { useBonusGagal, useHomeVarD } from '../lib/store'

// 1st bonus open, 2nd & 3rd still locked.
// Bonus ke-1 follows the homepage's "Bonus majelis Anda" card for whichever
// Minggu Home Var D is on.
function BonusMajelisPertama() {
  const { majelis, majelisStatus, majelisRewardStrike } = useHomeVarD()
  return (
    <BonusMajelisFrame status={majelisStatus}>
      <ActiveBonusCard
        index={1}
        dates="1 Sep – 30 Nov 2026"
        reward="Bonus Cair Tambahan Rp1.5 jt"
        progressLabel="1 dari 12"
        data={majelis.kind === 'progress' ? majelis.data : undefined}
        rewardStrike={majelisRewardStrike}
      />
      <LockedBonusCard index={2} dates="Mulai 1 Des – 28 Feb 2027" reward="Bonus Minyak Goreng" />
      <LockedBonusCard index={3} dates="Mulai 1 Mar – 30 Mei 2027" reward="Bonus Cair Tambahan Rp500 rb" />
    </BonusMajelisFrame>
  )
}

// 1st bonus failed, 2nd active, 3rd still locked.
function BonusMajelisGagal() {
  return (
    <BonusMajelisFrame status="tidak">
      <ActiveBonusCard index={2} dates="1 Des – 28 Feb 2027" reward="Bonus Minyak Goreng" progressLabel="13 dari 24" />
      <LockedBonusCard index={3} dates="Mulai 1 Mar – 30 Mei 2027" reward="Bonus Cair Tambahan Rp500 rb" />
      <SectionTitle>Sudah selesai</SectionTitle>
      <FailedBonusCard index={1} dates="1 Sep – 30 Nov 2026" />
    </BonusMajelisFrame>
  )
}

// 1st bonus claimed, 2nd active, 3rd still locked.
function BonusMajelisBerhasil() {
  const { majelisStatus } = useHomeVarD()
  return (
    <BonusMajelisFrame status={majelisStatus}>
      <ActiveBonusCard index={2} dates="1 Des – 28 Feb 2027" reward="Bonus Minyak Goreng" progressLabel="13 dari 24" />
      <LockedBonusCard index={3} dates="Mulai 1 Mar – 30 Mei 2027" reward="Bonus Cair Tambahan Rp500 rb" />
      <SectionTitle>Sudah selesai</SectionTitle>
      <ClaimedBonusCard
        index={1}
        dates="1 Sep – 30 Nov 2026"
        amount="Rp1.500.000"
        description="Limit tambahan ini bisa Anda cairkan hingga 7 Des 2026."
      />
    </BonusMajelisFrame>
  )
}

// All three bonuses earned — opened from Home Var D in Minggu 47 & 48.
function BonusMajelisSemuaBerhasil() {
  const { majelisStatus } = useHomeVarD()
  return (
    <BonusMajelisFrame status={majelisStatus}>
      <SectionTitle>Sudah selesai</SectionTitle>
      <ClaimedBonusCard
        index={1}
        dates="1 Sep – 30 Nov 2026"
        amount="Rp1.500.000"
        description="Limit tambahan ini bisa Anda cairkan hingga 7 Des 2026."
      />
      <ClaimedBonusCard
        index={2}
        dates="1 Des – 28 Feb 2027"
        reward="Bonus Minyak Goreng"
        description="Bonus ini akan diberikan saat kumpulan majelis 7 Mar 2027."
      />
      <ClaimedBonusCard
        index={3}
        dates="1 Mar – 30 Mei 2027"
        amount="Rp500.000"
        description="Limit tambahan ini bisa Anda cairkan hingga 7 Jun 2027."
      />
    </BonusMajelisFrame>
  )
}

// One screen, four pages: which one follows the Minggu Home (Final) is on
// (see `majelisPage` in lib/store.ts), unless the "Bonus 1 gagal" state is
// picked.
export function BonusMajelisScreen() {
  const { majelisPage } = useHomeVarD()
  const gagal = useBonusGagal()
  if (gagal) return <BonusMajelisGagal />
  if (majelisPage === 'bonus-majelis-berhasil') return <BonusMajelisBerhasil />
  if (majelisPage === 'bonus-majelis-semua-berhasil') return <BonusMajelisSemuaBerhasil />
  return <BonusMajelisPertama />
}
