import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/design-system/tokens.css'
import './globals.css'

// FunDS rule: Inter, weights 500 and 700 only
const inter = Inter({
  subsets: ['latin'],
  weight: ['500', '700'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Drafting Board',
  description: 'Design-system-locked prototyping studio',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans font-regular">{children}</body>
    </html>
  )
}
