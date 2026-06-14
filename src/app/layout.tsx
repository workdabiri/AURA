import type { Metadata } from 'next'

import '@/styles/tokens.css'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'AURA',
  description: 'AURA Real Estate Platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
