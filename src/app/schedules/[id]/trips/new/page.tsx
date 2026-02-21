'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Temple {
  id: string
  name: string
  city: string
  state: string | null
  country: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function NewTripPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: tourId } = use(params)
  const router = useRouter()
  const [temples, setTemples] = useState<Temple[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [tourName, setTourName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [templeId, setTempleId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')

  useEffect(() => {
    Promise.all([fetchTemples(), fetchUsers(), fetchTour()]).finally(() =>
      setLoading(false)
    )
  }, [])

  const fetchTemples = async () => {
    const response = await fetch('/api/temples?limit=200')
    if (!response.ok) throw new Error('Failed to fetch temples')
    const data = await response.json()
    setTemples(data.temples)
  }

  const fetchUsers = async () => {
    const response = await fetch('/api/users')
    if (!response.ok) throw new Error('Failed to fetch users')
    const data = await response.json()
    setUsers(data)
  }

  const fetchTour = async () => {
    const response = await fetch(`/api/tours/${tourId}`)
    if (!response.ok) throw new Error('Failed to fetch tour')
    const data = await response.json()
    setTourName(data.name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templeId || !title || !scheduledDate || !selectedUserId) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templeId,
          title,
          description: description || null,
          scheduledDate: new Date(scheduledDate).toISOString(),
          createdById: selectedUserId,
          tourId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create trip')
      }

      router.push(`/schedules/${tourId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create trip')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/schedules/${tourId}`}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4 inline-flex items-center"
      >
        ← Back to {tourName || 'Tour'}
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
        Add a Trip to {tourName || 'Tour'}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Who are you */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Who are you?</h2>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select your name...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Trip details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trip Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Salt Lake Temple Visit"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temple <span className="text-red-500">*</span>
              </label>
              <select
                value={templeId}
                onChange={(e) => setTempleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a temple...</option>
                {temples.map((temple) => (
                  <option key={temple.id} value={temple.id}>
                    {temple.name} - {temple.city}
                    {temple.state ? `, ${temple.state}` : ''}, {temple.country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Meeting point, what to bring, session time, etc."
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(`/schedules/${tourId}`)}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Trip'}
          </button>
        </div>
      </form>
    </div>
  )
}
