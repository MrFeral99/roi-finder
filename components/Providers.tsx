'use client'

import { SessionProvider, useSession } from 'next-auth/react'
import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, posthog } from '@/lib/posthog'

function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!posthog.__loaded) return
    posthog.capture('$pageview', { $current_url: window.location.href })
  }, [pathname, searchParams])

  return null
}

function PostHogBootstrap() {
  const { data: session, status } = useSession()

  useEffect(() => {
    initPostHog()
  }, [])

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      posthog.identify(session.user.id, {
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
      })
    }
    if (status === 'unauthenticated') {
      posthog.reset()
    }
  }, [status, session])

  return (
    <Suspense fallback={null}>
      <PageviewTracker />
    </Suspense>
  )
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PostHogBootstrap />
      {children}
    </SessionProvider>
  )
}
