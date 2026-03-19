'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { SavedPropertyWithDetails, WorkflowStatus } from '@/types'
import PropertyColumn from '@/components/dashboard/PropertyColumn'

const STATUSES: WorkflowStatus[] = ['COLLECTION', 'ANALYSIS', 'DECISION', 'REJECTED']

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [items, setItems] = useState<SavedPropertyWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/saved')
      .then((r) => r.json())
      .then((json) => {
        setItems(json.data ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [status])

  function handleStatusChange(propertyId: string, newStatus: WorkflowStatus) {
    setItems((prev) =>
      prev.map((item) => item.id === propertyId ? { ...item, status: newStatus } : item)
    )
  }

  function handleUnsave(propertyId: string) {
    setItems((prev) => prev.filter((item) => item.id !== propertyId))
  }

  if (status === 'loading' || loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-sm text-gray-400">Caricamento dashboard...</p>
      </main>
    )
  }

  if (!session) return null

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard investimenti</h1>
        <p className="text-sm text-gray-500 mt-1">
          {items.length} {items.length === 1 ? 'proprietà salvata' : 'proprietà salvate'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {STATUSES.map((s) => (
          <PropertyColumn
            key={s}
            status={s}
            items={items.filter((item) => item.status === s)}
            onStatusChange={handleStatusChange}
            onUnsave={handleUnsave}
          />
        ))}
      </div>
    </main>
  )
}
