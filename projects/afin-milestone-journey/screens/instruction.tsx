'use client'

// One screen, four methods. Every off-app method ends the same way — the mitra
// leaves the app to move money and comes back to claim she did — so they share
// a shape: the amount restated, whatever she has to carry with her (a VA number,
// a payment code, an account), the deadline, then the steps.
//
// The variants differ only where the real world does. Minimarket gets an admin
// fee and a phrase to say at the till; the agen gets no code at all, because
// there is nothing to type — she hands over cash to a person, and telling her to
// "copy a number" would be inventing a step that doesn't exist.

import { NavigationHeader } from '@/design-system/components'
import { Screen } from '@/platform/primitives'
import { useFlow } from '@/platform/runtime'
import { rupiah } from '../lib/data'
import { IconBank, IconPin, IconSend, IconStore } from '../lib/icons'
import { store, useApp } from '../lib/store'
import {
  CopyBlock,
  FullWidthButton,
  Hero,
  InfoBlock,
  Notice,
  Steps,
  StickyBar,
} from '../lib/ui'

export function InstructionScreen() {
  const flow = useFlow()
  const s = useApp()
  const amt = rupiah(s.amount)

  const done = () => {
    store.markPending()
    flow.go('pending')
  }

  const isVa = s.method === 'va-bca' || s.method === 'va-mandiri'
  const bank = s.method === 'va-bca' ? 'BCA' : 'Mandiri'
  const va = s.method === 'va-bca' ? '8808 1234 5678 9012' : '8900 1234 5678 9012'

  const title = isVa
    ? `Virtual Account ${bank}`
    : s.method === 'transfer'
      ? 'Transfer bank'
      : s.method === 'indomaret'
        ? 'Bayar di minimarket'
        : s.method === 'amartha-link'
          ? 'Agen Amartha Link'
          : 'Cara pembayaran'

  return (
    <Screen topBar={<NavigationHeader title={title} onBack={() => flow.go('method')} />}>
      {isVa ? (
        <>
          <Hero
            icon={<IconBank size={24} />}
            name={`Virtual Account ${bank}`}
            amount={amt}
          />
          <CopyBlock
            label="Nomor Virtual Account"
            display={va}
            raw={va.replace(/ /g, '')}
          />
          <Notice tone="red">Bayar sebelum 20 Agu 2024, 23:59</Notice>
          <Steps
            title="Cara membayar"
            steps={[
              `Buka aplikasi ${bank} Mobile atau ATM ${bank}`,
              'Pilih Transfer → Virtual Account',
              'Masukkan nomor VA di atas',
              `Konfirmasi pembayaran ${amt}`,
              'Simpan bukti transaksi',
            ]}
          />
          <StickyBar>
            <FullWidthButton onClick={done}>Saya sudah bayar</FullWidthButton>
          </StickyBar>
        </>
      ) : s.method === 'transfer' ? (
        <>
          <Hero icon={<IconSend size={24} />} name="Transfer ke rekening Amartha" amount={amt} />
          <InfoBlock label="Bank tujuan">
            <div className="text-16 font-bold text-default">BCA</div>
          </InfoBlock>
          <CopyBlock label="Nomor rekening" display="1234 567 890" raw="1234567890" />
          <InfoBlock label="Atas nama">
            <div className="text-14 font-bold text-default">PT Amartha Mikro Fintek</div>
          </InfoBlock>
          <Notice tone="orange">Konfirmasi otomatis 5–15 menit setelah transfer</Notice>
          <StickyBar>
            <FullWidthButton onClick={done}>Saya sudah transfer</FullWidthButton>
          </StickyBar>
        </>
      ) : s.method === 'indomaret' ? (
        <>
          <Hero icon={<IconStore size={24} />} name="Indomaret / Alfamart" amount={amt} />
          <CopyBlock label="Kode pembayaran" display="9908 1234 5678" raw="990812345678" />
          <Notice tone="red">Berlaku 24 jam</Notice>
          <Steps
            title="Cara membayar di kasir"
            steps={[
              'Datang ke Indomaret atau Alfamart terdekat',
              <>
                Bilang ke kasir: <span className="font-bold text-default">&ldquo;Bayar Amartha&rdquo;</span>
              </>,
              'Tunjukkan kode pembayaran di atas',
              `Bayar tunai ${amt} + biaya admin Rp2.500`,
              'Simpan struk sebagai bukti',
            ]}
          />
          <StickyBar>
            <FullWidthButton onClick={done}>Selesai</FullWidthButton>
          </StickyBar>
        </>
      ) : (
        <>
          <Hero icon={<IconPin size={24} />} name="Agen Amartha Link" amount={amt} tint="green" />
          <Notice tone="green">
            Bayar langsung ke agen. Tidak perlu kode atau transfer.
          </Notice>
          <Steps
            title="Cara membayar"
            steps={[
              'Temukan agen Amartha Link terdekat di aplikasi atau tanya BP/FO Ibu',
              'Sebutkan nama dan nomor anggota Ibu ke agen',
              `Serahkan uang tunai ${amt} ke agen`,
              'Agen akan memproses pembayaran langsung',
              'Minta bukti pembayaran dari agen',
            ]}
          />
          <Notice tone="orange">
            Konfirmasi masuk setelah agen memproses (biasanya instan)
          </Notice>
          <StickyBar>
            <FullWidthButton onClick={done}>Saya sudah bayar ke agen</FullWidthButton>
          </StickyBar>
        </>
      )}
    </Screen>
  )
}
