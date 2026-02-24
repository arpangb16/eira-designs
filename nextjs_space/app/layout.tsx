import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { AppLayout } from '@/components/app-layout'
import { getSession } from '@/lib/get-session'

const inter = Inter({ subsets: ['latin'] })

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  title: 'Apparel Design Manager',
  description: 'Professional apparel design automation system for sports teams',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'Apparel Design Manager',
    description: 'Professional apparel design automation system for sports teams',
    images: ['/og-image.png'],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className={inter.className}>
        <Providers session={session}>
          <AppLayout>{children}</AppLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
