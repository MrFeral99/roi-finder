'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import TrialFeedbackModal from './TrialFeedbackModal'

const EXCLUDED_PATHS = ['/login', '/register', '/onboarding']

export default function TrialGate() {
  const { status } = useSession()
  const pathname = usePathname()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') return
    if (EXCLUDED_PATHS.includes(pathname)) return

    fetch('/api/trial')
      .then((r) => r.json())
      .then(({ expired, hasFeedback }) => {
        if (expired && !hasFeedback) setShowModal(true)
      })
  }, [status, pathname])

  if (!showModal) return null

  return (
    <TrialFeedbackModal
      onSubmitted={() => setShowModal(false)}
    />
  )
}
