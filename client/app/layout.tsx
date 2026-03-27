import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StreamDash — Streaming Analytics Dashboard',
  description: 'Content management and analytics for streaming services',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex h-full bg-background text-foreground">
        <Sidebar />
        <main className="ml-56 flex min-h-screen flex-1 flex-col overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
