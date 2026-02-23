'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Appointment {
  id: string
  title: string
  description: string | null
  scheduledDate: string
  createdAt: string
  temple: {
    id: string
    name: string
    slug: string
    city: string
    state: string | null
    country: string
  }
  createdBy: {
    id: string
    name: string
  }
  attendees: Array<{
    id: string
    user: {
      id: string
      name: string
    }
  }>
  comments: Array<{
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      name: string
    }
  }>
  _count: {
    attendees: number
    comments: number
  }
}

export default function AppointmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null)
  const [showAttendees, setShowAttendees] = useState<string | null>(null)
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null)
  const [commentLoading, setCommentLoading] = useState<string | null>(null)
  const [appointmentComments, setAppointmentComments] = useState<{[key: string]: string}>({})
  const [deleteCommentLoading, setDeleteCommentLoading] = useState<string | null>(null)
  const [deleteAppointmentLoading, setDeleteAppointmentLoading] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    fetchAppointments()
  }, [status, router])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/schedules')
      if (!response.ok) throw new Error('Failed to fetch appointments')
      const data = await response.json()
      setAppointments(data.schedules)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })

  const isMonthOnlyAppointment = (date: string, title: string) => {
    const appointmentDate = new Date(date)
    // Check if it's the first day of the month at noon (indicating month-only scheduling)
    return appointmentDate.getDate() === 1 &&
           appointmentDate.getHours() === 12 &&
           appointmentDate.getMinutes() === 0 &&
           title.includes('(') // Month-only titles include the month/year in parentheses
  }

  const formatAppointmentDateTime = (date: string, title: string) => {
    if (isMonthOnlyAppointment(date, title)) {
      return `Penciled in for ${formatDate(date).split(' ').slice(0, 2).join(' ')}`
    }
    return `${formatDate(date)} at ${formatTime(date)}`
  }

  const formatCommentDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

  const isUpcoming = (date: string) => new Date(date) >= new Date()

  const handleRSVP = async (appointmentId: string) => {
    if (!session?.user) return

    try {
      setRsvpLoading(appointmentId)

      const appointment = appointments.find(a => a.id === appointmentId)
      const isAttending = appointment?.attendees?.some(a => a.user.id === (session.user as any).id) || false

      const response = await fetch(`/api/schedules/${appointmentId}/attendees`, {
        method: isAttending ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: (session.user as any).id }),
      })

      if (!response.ok) throw new Error('Failed to update RSVP')

      await fetchAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update RSVP')
    } finally {
      setRsvpLoading(null)
    }
  }

  const handleComment = async (appointmentId: string) => {
    if (!session?.user || !appointmentComments[appointmentId]?.trim()) return

    try {
      setCommentLoading(appointmentId)

      const response = await fetch(`/api/schedules/${appointmentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (session.user as any).id,
          content: appointmentComments[appointmentId].trim(),
        }),
      })

      if (!response.ok) throw new Error('Failed to post comment')

      setAppointmentComments(prev => ({ ...prev, [appointmentId]: '' }))
      await fetchAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment')
    } finally {
      setCommentLoading(null)
    }
  }

  const handleDeleteComment = async (appointmentId: string, commentId: string) => {
    if (!session?.user) return

    try {
      setDeleteCommentLoading(commentId)

      const response = await fetch(`/api/schedules/${appointmentId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) throw new Error('Failed to delete comment')

      await fetchAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment')
    } finally {
      setDeleteCommentLoading(null)
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!session?.user) return

    if (!confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      return
    }

    try {
      setDeleteAppointmentLoading(appointmentId)

      const response = await fetch(`/api/schedules/${appointmentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) throw new Error('Failed to delete appointment')

      await fetchAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment')
    } finally {
      setDeleteAppointmentLoading(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{status === 'loading' ? 'Authenticating...' : 'Loading appointments...'}</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl">Error: {error}</div>
        <button
          onClick={fetchAppointments}
          className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Temple Appointments</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Schedule temple appointments, invite others, and coordinate visits together
          </p>
        </div>
        <Link
          href="/schedules/new"
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shrink-0"
        >
          Create Appointment
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No appointments yet</h3>
          <p className="text-gray-600 mb-6 text-sm">
            Create your first temple appointment to start planning visits with friends and family.
          </p>
          <Link
            href="/schedules/new"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Create Your First Appointment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg hover:border-blue-200 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">{appointment.title}</h2>
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {appointment.temple.name}, {appointment.temple.city}, {appointment.temple.state || appointment.temple.country}
                  </div>
                  <div className="flex items-center mt-1 text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatAppointmentDateTime(appointment.scheduledDate, appointment.title)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                    isUpcoming(appointment.scheduledDate)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isUpcoming(appointment.scheduledDate) ? 'Upcoming' : 'Past'}
                  </span>
                </div>
              </div>

              {appointment.description && (
                <p className="text-gray-600 text-sm mb-3">
                  {appointment.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                <button
                  onClick={() => setShowAttendees(showAttendees === appointment.id ? null : appointment.id)}
                  className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {appointment._count.attendees} {appointment._count.attendees === 1 ? 'attendee' : 'attendees'}
                </button>
                <button
                  onClick={() => setExpandedAppointment(expandedAppointment === appointment.id ? null : appointment.id)}
                  className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {appointment._count.comments} {appointment._count.comments === 1 ? 'comment' : 'comments'}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRSVP(appointment.id)}
                  disabled={rsvpLoading === appointment.id}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    appointment.attendees?.some(a => a.user.id === (session?.user as any)?.id)
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } ${rsvpLoading === appointment.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {rsvpLoading === appointment.id ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Loading...
                    </div>
                  ) : appointment.attendees?.some(a => a.user.id === (session?.user as any)?.id) ? (
                    'Cancel RSVP'
                  ) : (
                    'RSVP'
                  )}
                </button>
                {appointment.createdBy.id === (session?.user as any)?.id && (
                  <>
                    <Link
                      href={`/schedules/${appointment.id}/edit`}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      disabled={deleteAppointmentLoading === appointment.id}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteAppointmentLoading === appointment.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                          Deleting...
                        </div>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </>
                )}
              </div>

              {showAttendees === appointment.id && appointment.attendees && appointment.attendees.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="space-y-2">
                    {appointment.attendees.map((attendee) => (
                      <div key={attendee.id} className="text-sm text-gray-700">
                        {attendee.user.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {expandedAppointment === appointment.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  {appointment.comments && appointment.comments.length > 0 && (
                    <div className="space-y-2">
                      {appointment.comments.map((comment) => (
                        <div key={comment.id} className="text-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{comment.user.name}</span>
                              <span className="text-xs text-gray-500">{formatCommentDate(comment.createdAt)}</span>
                            </div>
                            {comment.user.id === (session?.user as any)?.id && (
                              <button
                                onClick={() => handleDeleteComment(appointment.id, comment.id)}
                                disabled={deleteCommentLoading === comment.id}
                                className="text-red-600 hover:text-red-800 text-xs disabled:opacity-50"
                              >
                                {deleteCommentLoading === comment.id ? 'Deleting...' : 'Delete'}
                              </button>
                            )}
                          </div>
                          <p className="text-gray-700 mt-1">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={appointmentComments[appointment.id] || ''}
                        onChange={(e) => setAppointmentComments(prev => ({
                          ...prev,
                          [appointment.id]: e.target.value
                        }))}
                        placeholder="Add a comment..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleComment(appointment.id)
                          }
                        }}
                      />
                      <button
                        onClick={() => handleComment(appointment.id)}
                        disabled={commentLoading === appointment.id || !appointmentComments[appointment.id]?.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {commentLoading === appointment.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          'Post'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                Created by {appointment.createdBy.name} on {formatDate(appointment.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
