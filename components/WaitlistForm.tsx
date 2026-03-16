'use client'

import { useState } from 'react'

interface Props {
  variant?: 'hero' | 'inline' | 'gate'
  defaultCity?: string
}

export default function WaitlistForm({ variant = 'inline', defaultCity = '' }: Props) {
  const [email, setEmail] = useState('')
  const [city, setCity] = useState(defaultCity)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), city: city.trim() || undefined }),
      })
      const data = await res.json()

      if (res.ok || res.status === 200) {
        setStatus('success')
        setMessage(data.message)
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Qualcosa è andato storto. Riprova.')
      }
    } catch {
      setStatus('error')
      setMessage('Errore di connessione. Riprova.')
    }
  }

  if (status === 'success') {
    return (
      <div className={`rounded-2xl border border-green-200 bg-green-50 p-6 text-center ${
        variant === 'hero' ? 'py-8' : ''
      }`}>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
          ✅
        </div>
        <p className="font-semibold text-green-800">{message}</p>
        <p className="mt-1 text-sm text-green-600">
          Controlla la tua email — ti invieremo le prossime opportunità.
        </p>
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
        <div className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="la-tua@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <input
            type="text"
            placeholder="Città di interesse (opzionale)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {status === 'error' && (
            <p className="text-sm text-red-600">{message}</p>
          )}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60"
          >
            {status === 'loading' ? 'Iscrizione in corso…' : 'Entra nella Investor Waitlist →'}
          </button>
          <p className="text-center text-xs text-gray-400">
            Gratuito · Niente spam · Disdici quando vuoi
          </p>
        </div>
      </form>
    )
  }

  if (variant === 'gate') {
    return (
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-b from-white to-blue-50 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl">
          🔒
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          Sblocca tutte le opportunità di investimento
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Unisciti a oltre 500 investitori che scoprono ogni settimana
          le proprietà più sottovalutate d&apos;Italia.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="la-tua@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <input
            type="text"
            placeholder="Città di interesse (opzionale)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {status === 'error' && (
            <p className="text-sm text-red-600">{message}</p>
          )}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-60"
          >
            {status === 'loading' ? 'Iscrizione in corso…' : 'Entra nella Investor Waitlist →'}
          </button>
          <p className="text-center text-xs text-gray-400">Gratuito · Niente spam</p>
        </form>
      </div>
    )
  }

  // inline variant (default)
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
      <p className="mb-4 text-sm font-semibold text-gray-700">
        📬 Ricevi le migliori opportunità ogni settimana
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          placeholder="la-tua@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {status === 'loading' ? '…' : 'Iscriviti'}
        </button>
      </form>
      {status === 'error' && <p className="mt-2 text-xs text-red-600">{message}</p>}
    </div>
  )
}
