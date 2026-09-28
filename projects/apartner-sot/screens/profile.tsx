'use client'

// Profil — per the BP APP 2026 Figma ("Profile lama" and its log-out flow).
//
// A purple band with who she is, the menu, and LOG OUT. Log out asks WHY
// first, because the commonest reason — the app's data looks stale — has a
// better answer than logging out: sync. So "perbarui data" offers the sync
// before letting her go, and "keamanan / ganti akun" goes straight to the
// confirm. Either confirm lands on the ID Karyawan log-in page.

import { useState, type ReactNode } from 'react'
import { BottomSheet, Button, Card, ListRow, Toggle } from '@/design-system/components'
import { ArrowsClockwise, GearSix, SignOut } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { BP } from '../lib/schedule'
import { TabBar } from '../lib/tabs'
import { AppScreen, Avatar } from '../lib/ui'

const MENU = [
  'Insentif',
  'Tips Menggunakan Aplikasi',
  'Hal yang Sering Ditanyakan',
  'Amartha Plus',
  'Punya Saran untuk Super App?',
  'Butuh bantuan? Hubungi PST',
]

type Sheet = 'reason' | 'sync' | 'logout' | null

/** The tinted panel the sheets use where the Figma has an illustration. */
function Art({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-120 items-center justify-center rounded-16 bg-primary-50 text-primary-500">
      {children}
    </span>
  )
}

export function ProfileScreen() {
  const flow = useFlow()
  const [sheet, setSheet] = useState<Sheet>(null)
  const [smartLogin, setSmartLogin] = useState(false)

  return (
    <AppScreen statusBar="none">
      {/* --- Who she is, on the brand band */}
      <div className="-mx-16 -mt-48 flex items-center gap-12 bg-primary-500 px-16 pb-24 pt-48 text-neutral-white">
        <Avatar name={BP.name} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-16 font-bold">{BP.name}</span>
          <span className="truncate text-12">Business Partner · {BP.branch}</span>
          <span className="truncate text-12">Bergabung sejak 11 April 2017</span>
        </div>
      </div>

      <Card flush>
        <ListRow title={MENU[0]} chevron onClick={() => {}} />
        <ListRow
          title="Smart Login"
          trailing={<Toggle checked={smartLogin} onChange={(e) => setSmartLogin(e.target.checked)} />}
        />
        {MENU.slice(1).map((m) => (
          <ListRow key={m} title={m} chevron onClick={() => {}} />
        ))}
      </Card>

      <Button size="lg" className="w-full" onClick={() => setSheet('reason')}>
        Log Out
      </Button>

      <p className="pb-16 text-center text-12 text-disabled">{BP.version}</p>

      {/* --- Why she is logging out */}
      <BottomSheet
        open={sheet === 'reason'}
        onClose={() => setSheet(null)}
        title="Kenapa kamu log out?"
        slot={
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setSheet('sync')}
              className="flex items-center gap-12 py-12 text-left text-14 text-default"
            >
              <ArrowsClockwise size={20} />
              Untuk perbarui data di aplikasi
            </button>
            <button
              type="button"
              onClick={() => setSheet('logout')}
              className="flex items-center gap-12 py-12 text-left text-14 text-default"
            >
              <SignOut size={20} />
              Alasan keamanan/perlu ganti akun
            </button>
          </div>
        }
      />

      {/* --- Stale data: sync is the better answer */}
      <BottomSheet
        open={sheet === 'sync'}
        onClose={() => setSheet(null)}
        hideClose
        slotPosition="above"
        slot={
          <Art>
            <GearSix size={24} />
          </Art>
        }
        title="Sudah coba sinkronisasi?"
        description="Sinkronisasi ambil waktu maksimum 1 menit. Semua data tugas juga tetap akan tersimpan."
        primaryAction={
          <Button
            className="w-full"
            onClick={() => {
              setSheet(null)
              flow.go('sync')
            }}
          >
            Sinkronisasi Sekarang
          </Button>
        }
        secondaryAction={
          <Button variant="ghost" className="w-full" onClick={() => setSheet('logout')}>
            Log Out Saja
          </Button>
        }
      />

      {/* --- The confirm */}
      <BottomSheet
        open={sheet === 'logout'}
        onClose={() => setSheet(null)}
        hideClose
        slotPosition="above"
        slot={
          <Art>
            <SignOut size={24} />
          </Art>
        }
        title="Log out sekarang?"
        description="Semua data tugas yang belum terkirim akan hilang dan kamu perlu autentikasi akun lagi."
        primaryAction={
          <Button
            variant="danger"
            className="w-full"
            onClick={() => {
              setSheet(null)
              flow.go('login')
            }}
          >
            Log Out
          </Button>
        }
        secondaryAction={
          <Button variant="outline" className="w-full" onClick={() => setSheet(null)}>
            Batalkan
          </Button>
        }
      />

      <TabBar active="profile" />
    </AppScreen>
  )
}
