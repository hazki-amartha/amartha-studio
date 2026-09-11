'use client'

// Sosialisasi — the "new majelis" branch of Continue application. Reached after
// the majelis sheet on Follow up when the BP chooses "Majelis baru". The product
// is chosen HERE: "Apakah mitra mengajukan pinjaman Modal?" splits the form into
// the Modal majelis flow (name the majelis, invite its ketua, set the kumpulan
// schedule) or the regular sosialisasi flow (area, peserta, komite lapang).
// Saving schedules a sosialisasi task and the lead leaves the Sales list.

import { useState, type ReactNode } from 'react'
import { BottomSheet, Button, Input, NavigationHeader, SelectableCard } from '@/design-system/components'
import { Badge } from '@/design-system/components'
import { Camera, ChevronRight, MapPin, User } from '@/design-system/icons'
import { useFlow } from '@/platform/runtime'
import { pipelineStore, usePipeline } from '../lib/pipeline-store'
import { SelectField } from '../lib/pipeline-ui'
import { AppScreen, StickyBar } from '../lib/ui'

const pad = (n: number) => String(n).padStart(2, '0')
const fmt = (mins: number) => `${pad(Math.floor(mins / 60))}.${pad(mins % 60)}`
const TIMES: string[] = []
for (let m = 8 * 60; m <= 16 * 60; m += 30) TIMES.push(fmt(m))

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const JUMLAH_PESERTA = ['1 - 5', '6 - 10', '11 - 15', '16 - 20', 'Lebih dari 20']
const JUMLAH_KOMLAP = ['1', '2', '3', '4', '5', 'Lebih dari 5']

function Section({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-4 pt-8">
      <span className="text-18 font-bold text-default">{title}</span>
      {description ? <span className="text-14 text-caption">{description}</span> : null}
    </div>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-14 font-bold text-default">{children}</span>
}

// A capture row for a sub-form the prototype doesn't open — it just flips its
// badge from "Belum Diisi" to "Terisi" on tap, enough to show the state change.
function DataRow({
  icon,
  title,
  filled,
  optional,
  onClick,
}: {
  icon: ReactNode
  title: string
  filled: boolean
  optional?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-12 rounded-12 border border-default bg-neutral-white p-16 text-left active:bg-neutral-50"
    >
      <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-4">
        <span className="text-14 font-bold text-default">{title}</span>
        <span>
          {filled ? (
            <Badge intent="green">Terisi</Badge>
          ) : optional ? (
            <Badge intent="neutral">Optional</Badge>
          ) : (
            <Badge intent="orange">Belum Diisi</Badge>
          )}
        </span>
      </span>
      <span className="shrink-0 text-disabled">
        <ChevronRight size={20} />
      </span>
    </button>
  )
}

export function KumpulanJadwalScreen() {
  const flow = useFlow()
  const { leads, openId } = usePipeline()
  const lead = leads[openId]

  // Preselected to "Ya, Modal" — the majelis flow is the common case.
  const [modal, setModal] = useState(true)

  // Modal majelis flow
  const [namaMajelis, setNamaMajelis] = useState('')
  const [ketuaNama, setKetuaNama] = useState('')
  const [ketuaPhone, setKetuaPhone] = useState('')
  const [hari, setHari] = useState('')
  const [jamKumpulan, setJamKumpulan] = useState('')

  // Regular sosialisasi flow
  const [namaDaerah, setNamaDaerah] = useState('')
  const [jumlahPeserta, setJumlahPeserta] = useState('')
  const [mitra1, setMitra1] = useState(false)
  const [mitra2, setMitra2] = useState(false)
  const [foto, setFoto] = useState(false)
  const [lokasi, setLokasi] = useState(false)
  const [komlapJumlah, setKomlapJumlah] = useState('')
  const [tgl, setTgl] = useState('')
  const [jamKomlap, setJamKomlap] = useState('')

  const [picker, setPicker] = useState<null | { key: string; title: string; options: string[]; value: string }>(null)

  if (!lead) {
    return (
      <AppScreen topBar={<NavigationHeader title="Sosialisasi" onBack={() => flow.back()} />}>
        <span className="text-14 text-caption">Lead tidak ditemukan.</span>
      </AppScreen>
    )
  }

  const ready = modal ? namaMajelis.trim() !== '' : namaDaerah.trim() !== ''

  function onPick(v: string) {
    switch (picker?.key) {
      case 'hari':
        setHari(v)
        break
      case 'jam-kumpulan':
        setJamKumpulan(v)
        break
      case 'jumlah':
        setJumlahPeserta(v)
        break
      case 'komlap':
        setKomlapJumlah(v)
        break
      case 'jam-komlap':
        setJamKomlap(v)
        break
    }
    setPicker(null)
  }

  function save() {
    if (!ready) return
    const name = modal ? namaMajelis.trim() : namaDaerah.trim()
    const when = modal
      ? [hari, jamKumpulan].filter(Boolean).join(', ')
      : [tgl, jamKomlap].filter(Boolean).join(', ')
    pipelineStore.createKumpulanSosialisasi(lead.id, name, when || 'Belum dijadwalkan')
    pipelineStore.setFlash('Tugas sosialisasi berhasil ditambahkan')
    flow.go('sales')
  }

  return (
    <AppScreen topBar={<NavigationHeader title="Sosialisasi" onBack={() => flow.back()} />}>
      <div className="flex flex-col gap-12">
        <Section
          title="Data Kegiatan Sosialisasi"
          description="Pastikan data yang diisi benar dan dapat dipertanggungjawabkan."
        />

        <div className="flex flex-col gap-8">
          <FieldLabel>Apakah mitra mengajukan pinjaman Modal?</FieldLabel>
          <div className="grid grid-cols-2 gap-8">
            <SelectableCard
              name="modal"
              inputType="radio"
              title="Tidak"
              checked={modal === false}
              onChange={() => setModal(false)}
            />
            <SelectableCard
              name="modal"
              inputType="radio"
              title="Ya, Modal"
              checked={modal === true}
              onChange={() => setModal(true)}
            />
          </div>
        </div>

        {/* ---- Ya, Modal → majelis ---- */}
        {modal ? (
          <>
            <Input
              label="Nama Majelis"
              required
              value={namaMajelis}
              onChange={(e) => setNamaMajelis(e.target.value)}
              placeholder="Masukkan nama majelis"
              helperText="Contoh: 123_Kota_Kelurahan_01"
            />

            <Section
              title="Undang Ketua Majelis"
              description="Pastikan nomor ketua majelis terdaftar di aplikasi Afin dan tidak ada pinjaman aktif."
            />
            <Input
              label="Nama Ketua Majelis"
              value={ketuaNama}
              onChange={(e) => setKetuaNama(e.target.value)}
              placeholder="Masukkan nama ketua majelis"
            />
            <Input
              label="Nomor Telepon Ketua Majelis"
              inputMode="tel"
              value={ketuaPhone}
              onChange={(e) => setKetuaPhone(e.target.value)}
              placeholder="Masukkan nomor telepon ketua majelis"
              helperText="Contoh: 081xxxxxxxx"
            />

            <Section title="Jadwal Kumpulan" />
            <SelectField
              label="Tentukan Hari Kumpulan"
              boldLabel
              value={hari || undefined}
              placeholder="Pilih hari"
              onClick={() => setPicker({ key: 'hari', title: 'Pilih hari', options: HARI, value: hari })}
            />
            <SelectField
              label="Tentukan Jam Kumpulan"
              boldLabel
              value={jamKumpulan || undefined}
              placeholder="Pilih jam"
              onClick={() =>
                setPicker({ key: 'jam-kumpulan', title: 'Pilih jam', options: TIMES, value: jamKumpulan })
              }
            />
          </>
        ) : null}

        {/* ---- Tidak → sosialisasi ---- */}
        {!modal ? (
          <>
            <Input
              label="Nama Daerah"
              required
              value={namaDaerah}
              onChange={(e) => setNamaDaerah(e.target.value)}
              placeholder="Masukkan nama daerah"
            />
            <SelectField
              label="Jumlah Peserta Sosialisasi"
              boldLabel
              value={jumlahPeserta || undefined}
              placeholder="Pilih jumlah kehadiran"
              onClick={() =>
                setPicker({ key: 'jumlah', title: 'Jumlah peserta', options: JUMLAH_PESERTA, value: jumlahPeserta })
              }
            />
            <DataRow icon={<User size={20} />} title="Perwakilan Mitra 1" filled={mitra1} onClick={() => setMitra1((v) => !v)} />
            <DataRow icon={<User size={20} />} title="Perwakilan Mitra 2" filled={mitra2} optional onClick={() => setMitra2((v) => !v)} />
            <DataRow icon={<Camera size={20} />} title="Foto Kegiatan Sosialisasi" filled={foto} onClick={() => setFoto((v) => !v)} />
            <DataRow icon={<MapPin size={20} />} title="Lokasi Sosialisasi" filled={lokasi} onClick={() => setLokasi((v) => !v)} />

            <Section
              title="Jadwal Komite Lapang"
              description="Tentukan jadwal komite lapang dan pastikan semua peserta yang berminat dapat hadir."
            />
            <SelectField
              label="Berapa peserta yang tertarik Komite Lapang?"
              boldLabel
              value={komlapJumlah || undefined}
              placeholder="Pilih jumlah peserta tertarik komlap"
              onClick={() =>
                setPicker({ key: 'komlap', title: 'Jumlah peserta tertarik', options: JUMLAH_KOMLAP, value: komlapJumlah })
              }
            />
            <label className="flex flex-col gap-4">
              <FieldLabel>Tentukan Hari dan Tanggal</FieldLabel>
              <input
                type="date"
                value={tgl}
                onChange={(e) => setTgl(e.target.value)}
                className="rounded-8 border border-default bg-neutral-white px-12 py-8 text-14 text-default outline-none focus:border-primary-500"
              />
            </label>
            <SelectField
              label="Tentukan Jam"
              boldLabel
              value={jamKomlap || undefined}
              placeholder="Pilih jam"
              onClick={() =>
                setPicker({ key: 'jam-komlap', title: 'Pilih jam', options: TIMES, value: jamKomlap })
              }
            />
          </>
        ) : null}
      </div>

      <StickyBar>
        <div className="flex flex-col gap-8">
          <span className="text-center text-12 text-caption">Mohon cek kembali, pastikan data telah sesuai.</span>
          <Button size="lg" className="w-full" disabled={!ready} onClick={save}>
            Simpan
          </Button>
        </div>
      </StickyBar>

      <BottomSheet open={picker !== null} onClose={() => setPicker(null)} title={picker?.title ?? ''}>
        <div className="flex flex-col gap-8">
          {picker?.options.map((o) => (
            <SelectableCard
              key={o}
              name="picker"
              inputType="radio"
              title={o}
              checked={picker.value === o}
              onChange={() => onPick(o)}
            />
          ))}
        </div>
      </BottomSheet>
    </AppScreen>
  )
}
