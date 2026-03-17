import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import Header from '@/components/Header'
import TrialGate from '@/components/TrialGate'

export const metadata: Metadata = {
  title: 'DealEstate — Trova le migliori opportunità immobiliari',
  description: 'Analisi ROI istantanea su proprietà sottovalutate in Italia.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <Providers>
          <Header />
          <TrialGate />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mt-12 border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-400">
            DealEstate MVP — I dati mostrati sono stime a scopo illustrativo.
          </footer>
        </Providers>
      </body>
    </html>
  )
}
