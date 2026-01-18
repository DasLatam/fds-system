import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FDS - Firma Digital Simple',
  description: 'Firma Digital Simple (Ley 25.506) - MVP'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        <main className="mx-auto max-w-5xl p-6">{children}</main>
      </body>
    </html>
  )
}
