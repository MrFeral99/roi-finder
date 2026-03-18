'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

const NAV_LINKS = [
  { href: '/properties',  label: 'Opportunità',    icon: '🏠' },
  { href: '/saved',       label: 'Salvate',         icon: '🔖' },
  { href: '/calcolatore', label: 'Calcolatore ROI', icon: '🧮' },
  { href: '/account',     label: 'Account',         icon: '👤' },
]

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Hamburger — only when logged in */}
            {session && (
              <button
                onClick={() => setOpen(true)}
                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100"
                aria-label="Apri menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-blue-600">DealEstate</span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">Beta</span>
            </Link>
          </div>

          <nav className="flex items-center gap-3">
            {session ? (
              <span className="hidden text-sm text-gray-500 sm:block">
                {session.user.name ?? '—'}
              </span>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 transition hover:text-gray-900">
                  Accedi
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 sm:px-4 sm:text-sm"
                >
                  Registrati
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Sidebar overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
          <span className="font-bold text-blue-600">DealEstate</span>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User info */}
        {session && (
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-medium text-gray-900">{session.user.name ?? '—'}</p>
            <p className="text-xs text-gray-400">{session.user.email}</p>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                pathname === link.href
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 px-3 py-4">
          <button
            onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }) }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <span>🚪</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
