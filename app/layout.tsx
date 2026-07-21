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
  title: 'Prototype Studio',
  description: 'Design-system-locked prototyping studio',
}

// Runs before paint so the shell never flashes light then dark. Reads the saved
// choice from localStorage, defaulting to dark, and stamps it on <html>.
const themeInit = `(function(){try{var t=localStorage.getItem('db.chrome.theme');document.documentElement.dataset.theme=(t==='light'||t==='dark')?t:'dark';}catch(e){document.documentElement.dataset.theme='dark';}})();`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const projects = await loadProjectIndex()
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="font-sans font-regular">
        <AppShell projects={projects}>{children}</AppShell>
      </body>
    </html>
  )
}
