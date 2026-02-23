'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface User {
  id: string
  name: string
}

interface TourMember {
  id: string
  createdAt: string
  role: 'ORGANIZER' | 'MEMBER'
  user: User & { email: string }
}

interface TourComment {
  id: string
  createdAt: string
  content: string
  user: User
}

interface Trip {
  id: string
  title: string
  description: string | null
  scheduledDate: string
  temple: {
    id: string
    name: string
    slug: string
    city: string
    state: string | null
    country: string
  }
  createdBy: User
  attendees: Array<{
    id: string
    user: User
  }>
  comments: Array<{
    id: string
    content: string
    createdAt: string
    user: User
  }>
  _count: {
    attendees: number
    comments: number
  }
}

interface Tour {
  id: string
  name: string
  description: string | null
  createdAt: string
  createdBy: User
  members: TourMember[]
  trips: Trip[]
  comments: TourComment[]
  _count: {
    members: number
    trips: number
    comments: number
  }
}

interface AllUser {
  id: string
  name: string
  email: string
}

export default function TourDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const [tour, setTour] = useState<Tour | null>(null)
  const [users, setUsers] = useState<AllUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Trip interaction states
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null)
  const [showAttendees, setShowAttendees] = useState<string | null>(null)
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null)
  const [tripCommentLoading, setTripCommentLoading] = useState<string | null>(null)
  const [tripComments, setTripComments] = useState<{[key: string]: string}>({})

  // Member invite state
  const [inviteUserId, setInviteUserId] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)

  // Tour comment state
  const [commentUserId, setCommentUserId] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<'trips' | 'members' | 'discussion'>('trips')

  useEffect(() => {
    Promise.all([fetchTour(), fetchUsers()]).finally(() => setLoading(false))
  }, [id])

  const fetchTour = async () => {
    try {
      const response = await fetch(`/api/tours/${id}`)
      if (!response.ok) throw new Error('Failed to fetch tour')
      const data = await response.json()
      setTour(data)
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

  const handleInvite = async () => {
    if (!inviteUserId) return

    try {
      setInviteLoading(true)
      const response = await fetch(`/api/tours/${id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: inviteUserId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add member')
      }

      setInviteUserId('')
      await fetchTour()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/tours/${id}/members?userId=${userId}`,
        { method: 'DELETE' }
      )
      if (!response.ok) throw new Error('Failed to remove member')
      await fetchTour()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentUserId || !commentText.trim()) return

    try {
      setCommentLoading(true)
      const response = await fetch(`/api/tours/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: commentUserId,
          content: commentText.trim(),
        }),
      })

      if (!response.ok) throw new Error('Failed to post comment')

      setCommentText('')
      await fetchTour()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment')
    } finally {
      setCommentLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/tours/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete tour')
      router.push('/schedules')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tour')
    }
  }

  const handleRSVP = async (tripId: string) => {
    if (!session?.user) return

    try {
      setRsvpLoading(tripId)

      // Check if already attending
      const trip = tour?.trips.find(t => t.id === tripId)
      const isAttending = trip?.attendees.some(a => a.user.id === (session.user as any).id)

      const response = await fetch(`/api/schedules/${tripId}/attendees`, {
        method: isAttending ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: (session.user as any).id }),
      })

      if (!response.ok) throw new Error('Failed to update RSVP')

      await fetchTour()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update RSVP')
    } finally {
      setRsvpLoading(null)
    }
  }

  const handleTripComment = async (tripId: string) => {
    if (!session?.user || !tripComments[tripId]?.trim()) return

    try {
      setTripCommentLoading(tripId)

      const response = await fetch(`/api/schedules/${tripId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (session.user as any).id,
          content: tripComments[tripId].trim(),
        }),
      })

      if (!response.ok) throw new Error('Failed to post comment')

      setTripComments(prev => ({ ...prev, [tripId]: '' }))
      await fetchTour()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment')
    } finally {
      setTripCommentLoading(null)
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  const isUpcoming = (date: string) => new Date(date) >= new Date()

  const isMember = (userId: string) =>
    tour?.members.some((m) => m.user.id === userId) ?? false

  // Users not yet in the tour
  const nonMemberUsers = users.filter((u) => !isMember(u.id))

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-coral mx-auto"></div>
        <p className="mt-4 text-medium-gray">Loading tour...</p>
      </div>
    )
  }

  if (error && !tour) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl">Error: {error}</div>
        <Link
          href="/schedules"
          className="mt-4 inline-block text-warm-coral hover:text-warm-coral-hover"
        >
          Back to Tours
        </Link>
      </div>
    )
  }

  if (!tour) return null

  return (
    <div className="max-w-5xl mx-auto">
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

      {/* Tour Header */}
      <div className="bg-white rounded-xl shadow-sm border border-light-gray p-4 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
          <div>
            <Link
              href="/schedules"
              className="text-warm-coral hover:text-warm-coral-hover text-sm font-medium mb-2 inline-flex items-center"
            >
              ← Back to Tours
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">
              {tour.name}
            </h1>
            <p className="text-sm text-medium-gray mt-1">
              Created by {tour.createdBy.name}
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Delete Tour
          </button>
        </div>

        {tour.description && (
          <p className="text-medium-gray whitespace-pre-wrap">{tour.description}</p>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-light-gray">
          <div className="flex items-center text-sm text-medium-gray">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {tour._count.members} {tour._count.members === 1 ? 'member' : 'members'}
          </div>
          <div className="flex items-center text-sm text-medium-gray">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {tour._count.trips} {tour._count.trips === 1 ? 'appointment' : 'appointments'}
          </div>
          <div className="flex items-center text-sm text-medium-gray">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {tour._count.comments} {tour._count.comments === 1 ? 'comment' : 'comments'}
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex bg-warm-gray-light rounded-lg p-1 mb-6 w-full sm:w-fit">
        {(['trips', 'members', 'discussion'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-medium-gray hover:text-charcoal'
            }`}
          >
            {tab === 'trips' && `Appointments (${tour._count.trips})`}
            {tab === 'members' && `Members (${tour._count.members})`}
            {tab === 'discussion' && `Discussion (${tour._count.comments})`}
          </button>
        ))}
      </div>

      {/* Trips Tab */}
      {activeTab === 'trips' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-charcoal">Scheduled Appointments</h2>
            <Link
              href={`/schedules/${id}/trips/new`}
              className="bg-warm-coral text-white px-4 py-2.5 rounded-lg hover:bg-warm-coral-hover transition-colors text-sm font-medium"
            >
              Add Appointment
            </Link>
          </div>

          {tour.trips.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-light-gray">
              <div className="text-4xl mb-3">🏛️</div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">No appointments scheduled yet</h3>
              <p className="text-medium-gray text-sm mb-4">
                Add your first temple appointment to this tour.
              </p>
              <Link
                href={`/schedules/${id}/trips/new`}
                className="inline-flex items-center bg-warm-coral text-white px-5 py-2.5 rounded-lg hover:bg-warm-coral-hover transition-colors text-sm font-medium"
              >
                Schedule an Appointment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {tour.trips.map((trip) => {
                const upcoming = isUpcoming(trip.scheduledDate)
                const isAttending = trip.attendees?.some(a => a.user.id === (session?.user as any)?.id) || false
                const isExpanded = expandedTrip === trip.id
                return (
                  <div
                    key={trip.id}
                    className="bg-white rounded-xl shadow-sm border border-light-gray overflow-hidden"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-charcoal">{trip.title}</h3>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                upcoming
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-warm-gray-light text-medium-gray'
                              }`}
                            >
                              {upcoming ? 'Upcoming' : 'Past'}
                            </span>
                          </div>
                          <div className="flex items-center text-medium-gray text-sm mb-1">
                            <svg className="w-4 h-4 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="font-medium">{trip.temple.name}</span>
                            <span className="text-medium-gray ml-1.5">
                              {trip.temple.city}
                              {trip.temple.state ? `, ${trip.temple.state}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center text-medium-gray text-sm">
                            <svg className="w-4 h-4 mr-1.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(trip.scheduledDate)} at {formatTime(trip.scheduledDate)}
                          </div>
                        </div>
                      </div>

                      {/* Actions row */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <button
                          onClick={() => handleRSVP(trip.id)}
                          disabled={rsvpLoading === trip.id}
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isAttending
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-warm-coral text-white hover:bg-warm-coral-hover'
                          } disabled:opacity-50`}
                        >
                          {rsvpLoading === trip.id ? '...' : isAttending ? '✓ Attending' : 'RSVP'}
                        </button>

                        <button
                          onClick={() => setShowAttendees(showAttendees === trip.id ? null : trip.id)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-medium-gray hover:text-charcoal hover:bg-warm-gray-light transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {trip._count.attendees} attending
                        </button>

                        <button
                          onClick={() => setExpandedTrip(isExpanded ? null : trip.id)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium text-medium-gray hover:text-charcoal hover:bg-warm-gray-light transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {trip._count.comments} {trip._count.comments === 1 ? 'comment' : 'comments'}
                        </button>

                        <Link
                          href={`/schedules/${id}/trips/${trip.id}`}
                          className="text-warm-coral hover:text-warm-coral-hover text-sm font-medium ml-auto"
                        >
                          View Details →
                        </Link>
                      </div>

                      {/* Attendees section */}
                      {showAttendees === trip.id && (
                        <div className="mt-4 pt-4 border-t border-light-gray">
                          <h4 className="text-sm font-medium text-charcoal mb-3">
                            Attendees ({trip._count.attendees})
                          </h4>
                          {trip.attendees && trip.attendees.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {trip.attendees.map((attendee) => (
                                <div
                                  key={attendee.id}
                                  className="inline-flex items-center space-x-2 bg-green-50 text-green-800 px-3 py-1.5 rounded-full text-sm"
                                >
                                  <div className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-medium">
                                    {attendee.user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span>{attendee.user.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-medium-gray text-sm">No one is attending yet.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Expanded comments section */}
                    {isExpanded && (
                      <div className="border-t border-light-gray p-4 sm:p-5 bg-warm-gray-light">
                        {/* Add comment form */}
                        <div className="mb-4">
                          <textarea
                            value={tripComments[trip.id] || ''}
                            onChange={(e) => setTripComments(prev => ({ ...prev, [trip.id]: e.target.value }))}
                            placeholder="Add a comment about this appointment..."
                            rows={2}
                            className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => handleTripComment(trip.id)}
                              disabled={tripCommentLoading === trip.id || !tripComments[trip.id]?.trim()}
                              className="bg-warm-coral text-white px-3 py-1.5 rounded-lg hover:bg-warm-coral-hover transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              {tripCommentLoading === trip.id ? 'Posting...' : 'Post Comment'}
                            </button>
                          </div>
                        </div>

                        {/* Comments list */}
                        {(!trip.comments || trip.comments.length === 0) ? (
                          <p className="text-medium-gray text-sm text-center py-4">No comments yet. Be the first to comment!</p>
                        ) : (
                          <div className="space-y-3">
                            {trip.comments.map((comment) => (
                              <div key={comment.id} className="flex space-x-3">
                                <div className="w-6 h-6 rounded-full bg-warm-coral/20 text-warm-coral flex items-center justify-center text-xs font-medium">
                                  {comment.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-charcoal">{comment.user.name}</span>
                                    <span className="text-xs text-medium-gray">
                                      {formatCommentDate(comment.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-charcoal mt-1 whitespace-pre-wrap">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-xl shadow-sm border border-light-gray p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-charcoal mb-4">Tour Members</h2>

          {/* Add member */}
          {nonMemberUsers.length > 0 && (
            <div className="mb-6 p-4 bg-warm-gray-light rounded-lg">
              <label className="block text-sm font-medium text-charcoal mb-2">
                Add a member to this tour:
              </label>
              <div className="flex gap-2">
                <select
                  value={inviteUserId}
                  onChange={(e) => setInviteUserId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
                >
                  <option value="">Select a person...</option>
                  {nonMemberUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleInvite}
                  disabled={!inviteUserId || inviteLoading}
                  className="bg-warm-coral text-white px-4 py-2.5 rounded-lg hover:bg-warm-coral-hover transition-colors text-sm font-medium disabled:opacity-50 shrink-0"
                >
                  {inviteLoading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {/* Member list */}
          <ul className="space-y-2">
            {tour.members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between py-3 px-4 rounded-lg bg-warm-gray-light"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-warm-coral/20 text-warm-coral flex items-center justify-center text-sm font-semibold">
                    {member.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-charcoal">
                      {member.user.name}
                    </span>
                    {member.role === 'ORGANIZER' && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                        Organizer
                      </span>
                    )}
                  </div>
                </div>
                {member.role !== 'ORGANIZER' && (
                  <button
                    onClick={() => handleRemoveMember(member.user.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Discussion Tab */}
      {activeTab === 'discussion' && (
        <div className="bg-white rounded-xl shadow-sm border border-light-gray p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-charcoal mb-4">
            Tour Discussion ({tour._count.comments})
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
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
              placeholder="Share thoughts about the tour, suggest temples to visit, coordinate plans..."
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={commentLoading || !commentUserId || !commentText.trim()}
                className="bg-warm-coral text-white px-4 py-2.5 rounded-lg hover:bg-warm-coral-hover transition-colors text-sm font-medium disabled:opacity-50"
              >
                {commentLoading ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>

          {/* Comments list */}
          {tour.comments.length === 0 ? (
            <div className="text-center py-8 text-medium-gray">
              <svg className="w-12 h-12 mx-auto mb-3 text-light-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">No comments yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tour.comments.map((comment) => (
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
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-charcoal mb-2">
              Delete Tour?
            </h3>
            <p className="text-medium-gray text-sm mb-6">
              This will permanently delete <strong>{tour.name}</strong>, including
              all trips, RSVPs, and comments. This action cannot be undone.
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
