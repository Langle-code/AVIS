import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Avis — Your NMAT Study Companion',
  description: 'Personalized NMAT review powered by your own study materials.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
