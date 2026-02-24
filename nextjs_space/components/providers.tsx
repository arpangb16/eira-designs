'use client'

import { SessionProvider } from 'next-auth/react'
import type { Session } from 'next-auth'
import { ThemeProvider } from '@/components/theme-provider'
import { useState, useEffect } from 'react'

export function Providers({ children, session }: { children: React.ReactNode; session?: Session | null }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <SessionProvider session={session}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
