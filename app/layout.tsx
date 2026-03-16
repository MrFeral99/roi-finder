import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DealEstate — Trova le migliori opportunità immobiliari',
  description: 'Analisi ROI istantanea su proprietà sottovalutate in Italia.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <a href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-blue-600">DealEstate</span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                Beta
              </span>
            </a>
            <nav className="flex items-center gap-4">
              <a href="/properties" className="text-sm text-gray-600 transition hover:text-gray-900">
                Opportunità
              </a>
              <a
                href="/#waitlist"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Unisciti alla Waitlist
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mt-12 border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
          DealEstate MVP — I dati mostrati sono stime a scopo illustrativo.
        </footer>
      </body>
    </html>
  )
}
