'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
}

interface Attendee {
  id: string
  createdAt: string
  user: User
}

interface Comment {
  id: string
  createdAt: string
  content: string
  user: User
}

interface Schedule {
  id: string
  title: string
  description: string | null
  scheduledDate: string
  createdAt: string
  tourId: string | null
  temple: {
    id: string
    name: string
    slug: string
    city: string
    state: string | null
    country: string
    address: string | null
  }
  createdBy: User
  attendees: Attendee[]
  comments: Comment[]
  _count: {
    attendees: number
    comments: number
  }
}

interface AllUser {
  id: string
  name: string
  email: string
}

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string; tripId: string }>
}) {
  const { id: tourId, tripId } = use(params)
  const router = useRouter()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [users, setUsers] = useState<AllUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // RSVP state
  const [selectedUserId, setSelectedUserId] = useState('')
  const [rsvpLoading, setRsvpLoading] = useState(false)

  // Comment state
  const [commentUserId, setCommentUserId] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    Promise.all([fetchSchedule(), fetchUsers()]).finally(() => setLoading(false))
  }, [tripId])

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/schedules/${tripId}`)
      if (!response.ok) throw new Error('Failed to fetch trip')
      const data = await response.json()
      setSchedule(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch {
      // Non-critical
    }
  }

  const isUpcoming = schedule
    ? new Date(schedule.scheduledDate) >= new Date()
    : false

  const isAttending = (userId: string) =>
    schedule?.attendees.some((a) => a.user.id === userId) ?? false

  const handleRsvp = async () => {
    if (!selectedUserId || !schedule) return

    try {
      setRsvpLoading(true)

      if (isAttending(selectedUserId)) {
        const response = await fetch(
          `/api/schedules/${tripId}/attendees?userId=${selectedUserId}`,
          { method: 'DELETE' }
        )
        if (!response.ok) throw new Error('Failed to update RSVP')
      } else {
        const response = await fetch(`/api/schedules/${tripId}/attendees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: selectedUserId }),
        })
        if (!response.ok) throw new Error('Failed to update RSVP')
      }

      await fetchSchedule()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update RSVP')
    } finally {
      setRsvpLoading(false)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentUserId || !commentText.trim()) return

    try {
      setCommentLoading(true)
      const response = await fetch(`/api/schedules/${tripId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: commentUserId,
          content: commentText.trim(),
        }),
      })

      if (!response.ok) throw new Error('Failed to post comment')

      setCommentText('')
      await fetchSchedule()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment')
    } finally {
      setCommentLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/schedules/${tripId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete trip')
      router.push(`/schedules/${tourId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trip')
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })

  const formatCommentDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-coral mx-auto"></div>
        <p className="mt-4 text-medium-gray">Loading trip...</p>
      </div>
    )
  }

  if (error && !schedule) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl">Error: {error}</div>
        <Link
          href={`/schedules/${tourId}`}
          className="mt-4 inline-block text-warm-coral hover:text-warm-coral-hover"
        >
          Back to Tour
        </Link>
      </div>
    )
  }

  if (!schedule) return null

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 font-bold text-red-500 hover:text-red-700"
          >
            x
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-light-gray p-4 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
          <div>
            <Link
              href={`/schedules/${tourId}`}
              className="text-warm-coral hover:text-warm-coral-hover text-sm font-medium mb-2 inline-flex items-center"
            >
              ← Back to Tour
            </Link>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">
                {schedule.title}
              </h1>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isUpcoming
                    ? 'bg-green-100 text-green-800'
                    : 'bg-warm-gray-light text-medium-gray'
                }`}
              >
                {isUpcoming ? 'Upcoming' : 'Past'}
              </span>
            </div>
            <p className="text-sm text-medium-gray">
              Added by {schedule.createdBy.name}
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete Trip
          </button>
        </div>

        {/* Temple info */}
        <div className="bg-warm-gray-light rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2 text-warm-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-lg font-semibold text-charcoal">
              {schedule.temple.name}
            </span>
          </div>
          <p className="text-warm-coral text-sm ml-7">
            {schedule.temple.city}
            {schedule.temple.state ? `, ${schedule.temple.state}` : ''},{' '}
            {schedule.temple.country}
          </p>
          {schedule.temple.address && (
            <a
              href={`https://maps.apple.com/?q=${encodeURIComponent(schedule.temple.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm-coral hover:text-warm-coral-hover text-sm ml-7 underline"
            >
              {schedule.temple.address}
            </a>
          )}
        </div>

        {/* Date & Time */}
        <div className="flex items-center text-charcoal mb-4">
          <svg className="w-5 h-5 mr-3 text-medium-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-lg">
            {formatDate(schedule.scheduledDate)} at{' '}
            {formatTime(schedule.scheduledDate)}
          </span>
        </div>

        {/* Description */}
        {schedule.description && (
          <div className="border-t border-light-gray pt-4 mt-4">
            <h3 className="text-sm font-semibold text-medium-gray uppercase tracking-wider mb-2">
              Details
            </h3>
            <p className="text-charcoal whitespace-pre-wrap">
              {schedule.description}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendees section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-light-gray p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4">
              Attending ({schedule._count.attendees})
            </h2>

            {/* RSVP */}
            <div className="mb-4 p-4 bg-warm-gray-light rounded-lg">
              <label className="block text-sm font-medium text-charcoal mb-2">
                RSVP as:
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral mb-2"
              >
                <option value="">Select your name...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              {selectedUserId && (
                <button
                  onClick={handleRsvp}
                  disabled={rsvpLoading}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                    isAttending(selectedUserId)
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-white text-[#B77D63] shadow-sm hover:bg-[#B77D63] hover:text-white'
                  }`}
                >
                  {rsvpLoading
                    ? 'Updating...'
                    : isAttending(selectedUserId)
                    ? "I Can't Make It"
                    : "I'm Attending"}
                </button>
              )}
            </div>

            {/* Attendee list */}
            {schedule.attendees.length === 0 ? (
              <p className="text-medium-gray text-sm text-center py-4">
                No one has RSVP&apos;d yet. Be the first!
              </p>
            ) : (
              <ul className="space-y-2">
                {schedule.attendees.map((attendee) => (
                  <li
                    key={attendee.id}
                    className="flex items-center space-x-3 py-2 px-3 rounded-lg bg-warm-gray-light"
                  >
                    <div className="w-8 h-8 rounded-full bg-warm-coral/20 text-warm-coral flex items-center justify-center text-sm font-semibold">
                      {attendee.user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-charcoal">
                      {attendee.user.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Comments section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-light-gray p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4">
              Trip Discussion ({schedule._count.comments})
            </h2>

            {/* Comment form */}
            <form onSubmit={handleComment} className="mb-6">
              <div className="flex gap-3 mb-3">
                <select
                  value={commentUserId}
                  onChange={(e) => setCommentUserId(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
                >
                  <option value="">Post as...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  className="flex-1 px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
                  placeholder={
                    isUpcoming
                      ? 'Share plans, questions, or coordinate for this trip...'
                      : 'Share your experience or memories from this trip...'
                  }
                />
              </div>
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={commentLoading || !commentUserId || !commentText.trim()}
                  className="bg-white text-[#B77D63] shadow-sm hover:bg-[#B77D63] hover:text-white px-4 py-2.5 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {commentLoading ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>

            {/* Comments list */}
            {schedule.comments.length === 0 ? (
              <div className="text-center py-8 text-medium-gray">
                <svg className="w-12 h-12 mx-auto mb-3 text-light-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">No comments yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {schedule.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border-b border-light-gray pb-4 last:border-0"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-semibold">
                        {comment.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-charcoal">
                          {comment.user.name}
                        </span>
                        <span className="text-xs text-medium-gray ml-2">
                          {formatCommentDate(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-charcoal text-sm ml-11 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-charcoal mb-2">
              Delete Trip?
            </h3>
            <p className="text-medium-gray text-sm mb-6">
              This will permanently delete this trip, including all
              RSVPs and comments. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 text-charcoal text-sm font-medium border border-light-gray rounded-lg hover:bg-warm-gray-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
