import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/design-system/tokens.css'
import './globals.css'
import { AppShell, loadProjectIndex } from '@/platform/chrome'

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const projects = await loadProjectIndex()
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans font-regular">
        <AppShell projects={projects}>{children}</AppShell>
      </body>
    </html>
  )
}
