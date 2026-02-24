'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAdminUser } from '../../lib/admin'

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

function LocationPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  )
}

function CheckMarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  )
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function SectionHeader({ title, subLabel }: { title: string; subLabel: string }) {
  return (
    <div className="mb-3 mt-8 first:mt-4">
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <h2 className="text-xl font-light text-charcoal tracking-wide">{title}</h2>
          <span className="text-xs text-medium-gray tracking-widest">{subLabel}</span>
        </div>
        <div className="flex-1 border-b border-section-rule" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null)
  const [showAttendees, setShowAttendees] = useState<string | null>(null)
  const [showComments, setShowComments] = useState<string | null>(null)
  const [commentText, setCommentText] = useState<{[key: string]: string}>({})
  const [commentLoading, setCommentLoading] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    fetchAppointments()
  }, [status, router])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAttendees(null)
        setShowComments(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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

  const isUpcoming = (date: string) => new Date(date) >= new Date()

  const isMonthOnlyAppointment = (date: string, title: string) => {
    const appointmentDate = new Date(date)
    return appointmentDate.getDate() === 1 &&
           appointmentDate.getHours() === 12 &&
           appointmentDate.getMinutes() === 0 &&
           title.includes('(')
  }

  const formatFullDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
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

  const formatMonthYear = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  }

  const getArriveByTime = (date: string) => {
    const d = new Date(date)
    d.setMinutes(d.getMinutes() - 30)
    return formatTime(d.toISOString())
  }

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

  const formatCommentDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

  const toggleAttendees = (appointmentId: string) => {
    setShowAttendees(showAttendees === appointmentId ? null : appointmentId)
    if (showComments === appointmentId) setShowComments(null)
  }

  const toggleComments = (appointmentId: string) => {
    setShowComments(showComments === appointmentId ? null : appointmentId)
    if (showAttendees === appointmentId) setShowAttendees(null)
  }

  const openMaps = (appointment: Appointment) => {
    const { temple } = appointment

    // Build the address string from available temple data (city, state, country)
    let address = `${temple.city}`
    if (temple.state) address += `, ${temple.state}`
    address += `, ${temple.country}`

    // Add temple name for better search results
    const searchQuery = `${temple.name}, ${address}`

    // Encode the address for URL
    const encodedAddress = encodeURIComponent(searchQuery)

    // Try to detect the platform and use the most appropriate map service
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)

    let mapUrl = ''

    if (isIOS) {
      // Use Apple Maps on iOS devices
      mapUrl = `maps://maps.apple.com/?q=${encodedAddress}`
    } else if (isAndroid) {
      // Use Google Maps on Android devices
      mapUrl = `geo:0,0?q=${encodedAddress}`
    } else {
      // Use Google Maps web for desktop/other platforms
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
    }

    // Open the map URL
    window.open(mapUrl, '_blank')
  }

  const handleComment = async (appointmentId: string) => {
    if (!session?.user || !commentText[appointmentId]?.trim()) return

    try {
      setCommentLoading(appointmentId)

      const response = await fetch(`/api/schedules/${appointmentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (session.user as any).id,
          content: commentText[appointmentId].trim(),
        }),
      })

      if (!response.ok) throw new Error('Failed to post comment')

      // Clear the comment text for this appointment
      setCommentText(prev => ({ ...prev, [appointmentId]: '' }))

      // Refresh appointments to show new comment
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
      setDeleteLoading(commentId)

      const response = await fetch(`/api/schedules/${appointmentId}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete comment')
      }

      // Refresh appointments to show updated comments
      await fetchAppointments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment')
    } finally {
      setDeleteLoading(null)
    }
  }

  // Split appointments into upcoming and past
  const upcomingAppointments = appointments.filter(a => isUpcoming(a.scheduledDate))
  const pastAppointments = appointments.filter(a => !isUpcoming(a.scheduledDate))

  // Split upcoming into scheduled vs unscheduled
  const scheduledAppointments = upcomingAppointments
    .filter(a => !isMonthOnlyAppointment(a.scheduledDate, a.title))
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  const unscheduledAppointments = upcomingAppointments
    .filter(a => isMonthOnlyAppointment(a.scheduledDate, a.title))
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())

  // Past completed appointments (only specific date/time, not penciled)
  const completedAppointments = pastAppointments
    .filter(a => !isMonthOnlyAppointment(a.scheduledDate, a.title))
    .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()) // Most recent first

  if (status === 'loading' || loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-warm-coral mx-auto"></div>
        <p className="mt-4 text-medium-gray text-sm">
          {status === 'loading' ? 'Authenticating...' : 'Loading appointments...'}
        </p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-red-600 text-base">Error: {error}</div>
        <button
          onClick={fetchAppointments}
          className="mt-4 bg-white text-[#B77D63] px-6 py-2 rounded-full border border-[#B77D63] hover:bg-[#B77D63] hover:text-white transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 text-warm-gray">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <h3 className="text-lg font-light text-charcoal mb-2">No appointments yet</h3>
        <p className="text-medium-gray text-sm mb-6">
          Create your first temple appointment to start planning visits.
        </p>
        <Link
          href="/schedules/new"
          className="inline-flex items-center bg-white text-[#B77D63] px-6 py-2 rounded-full border border-[#B77D63] hover:bg-[#B77D63] hover:text-white transition-colors text-sm font-medium"
        >
          Create Appointment
        </Link>
      </div>
    )
  }

  return (
    <div className="pb-8" ref={dropdownRef}>
      {/* Scheduled Appointments */}
      {scheduledAppointments.length > 0 && (
        <div>
          <SectionHeader title="Upcoming Appointments" subLabel="Scheduled" />
          <div className="bg-[#F4F4F4]">
            {scheduledAppointments.map((appointment) => {
              const isAttending = appointment.attendees?.some(
                a => a.user.id === (session?.user as any)?.id
              ) || false

              return (
                <div
                  key={appointment.id}
                  className="py-4 border-b border-light-gray last:border-b-0 pl-3 border-l-2 border-l-warm-gray"
                >
                  {/* Temple name + pin */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <Link
                      href={`/schedules/${appointment.id}`}
                      className="font-bold text-charcoal text-base hover:text-charcoal-dark transition-colors"
                    >
                      {appointment.temple.name}
                    </Link>
                    <button
                      onClick={() => openMaps(appointment)}
                      className="text-medium-gray hover:text-warm-coral transition-colors p-1 hover:bg-warm-coral/10 rounded"
                      title={`Open ${appointment.temple.name} in maps`}
                    >
                      <LocationPinIcon className="w-5 h-5 shrink-0" />
                    </button>
                  </div>

                  {/* Date + time */}
                  <p className="text-sm text-medium-gray">
                    {formatFullDate(appointment.scheduledDate)} | {formatTime(appointment.scheduledDate)}
                  </p>

                  {/* Arrive by */}
                  <p className="text-sm text-medium-gray mt-0.5">
                    Arrive by {getArriveByTime(appointment.scheduledDate)}
                  </p>

                  {/* Bottom row: icons + RSVP button */}
                  <div className="flex items-center justify-end gap-3 mt-3">
                    {/* Attendees icon */}
                    {appointment._count.attendees > 0 && (
                      <button
                        onClick={() => toggleAttendees(appointment.id)}
                        className="flex items-center gap-1.5 text-medium-gray hover:text-charcoal transition-colors p-1 hover:bg-warm-gray-light rounded"
                      >
                        <UsersIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">{appointment._count.attendees}</span>
                      </button>
                    )}

                    {/* Comments icon */}
                    <button
                      onClick={() => toggleComments(appointment.id)}
                      className="flex items-center gap-1.5 text-medium-gray hover:text-charcoal transition-colors p-1 hover:bg-warm-gray-light rounded"
                    >
                      <ChatBubbleIcon className="w-5 h-5" />
                      {appointment._count.comments > 0 && (
                        <span className="text-sm font-medium">{appointment._count.comments}</span>
                      )}
                    </button>

                    <button
                      onClick={() => handleRSVP(appointment.id)}
                      disabled={rsvpLoading === appointment.id}
                      className={`px-4 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                        rsvpLoading === appointment.id ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        isAttending
                          ? 'bg-warm-coral/20 text-warm-coral hover:bg-warm-coral/30'
                          : 'bg-warm-coral text-white hover:bg-warm-coral-hover'
                      }`}
                    >
                      {rsvpLoading === appointment.id ? '...' : isAttending ? 'RSVP\'d' : 'RSVP'}
                    </button>
                  </div>

                  {/* Attendees dropdown */}
                  {showAttendees === appointment.id && (
                    <div className="mt-3 p-3 bg-warm-gray-light rounded-lg border border-light-gray">
                      <h4 className="text-xs font-semibold text-charcoal mb-2 uppercase tracking-wider">
                        Attending ({appointment._count.attendees})
                      </h4>
                      <div className="space-y-1">
                        {appointment.attendees.map((attendee) => (
                          <div key={attendee.id} className="flex items-center gap-2 text-sm">
                            <div className="w-5 h-5 bg-warm-coral/20 text-warm-coral rounded-full flex items-center justify-center text-xs font-medium">
                              {attendee.user.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-charcoal">{attendee.user.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comments dropdown */}
                  {showComments === appointment.id && (
                    <div className="mt-3 p-3 bg-warm-gray-light rounded-lg border border-light-gray">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                          Discussion ({appointment._count.comments})
                        </h4>
                        <Link
                          href={`/schedules/${appointment.id}`}
                          className="text-xs text-warm-coral hover:text-warm-coral-hover font-medium"
                        >
                          View all →
                        </Link>
                      </div>

                      {/* Add comment form */}
                      {session?.user && (
                        <div className="mb-3">
                          <textarea
                            value={commentText[appointment.id] || ''}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [appointment.id]: e.target.value }))}
                            placeholder="Add a comment..."
                            rows={2}
                            className="w-full px-2 py-1.5 border border-light-gray rounded text-sm focus:outline-none focus:ring-1 focus:ring-warm-coral focus:border-warm-coral resize-none"
                          />
                          <div className="flex justify-end mt-1">
                            <button
                              onClick={() => handleComment(appointment.id)}
                              disabled={commentLoading === appointment.id || !commentText[appointment.id]?.trim()}
                              className="bg-white text-[#B77D63] border border-[#B77D63] hover:bg-[#B77D63] hover:text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {commentLoading === appointment.id ? 'Posting...' : 'Post'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Comments list */}
                      {appointment.comments.length > 0 ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {appointment.comments.slice(0, 3).map((comment) => (
                            <div key={comment.id} className="text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 bg-warm-coral/20 text-warm-coral rounded-full flex items-center justify-center text-xs font-medium">
                                    {comment.user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-charcoal text-xs">{comment.user.name}</span>
                                  <span className="text-medium-gray text-xs">{formatCommentDate(comment.createdAt)}</span>
                                </div>
                                {/* Delete button for own comments */}
                                {session?.user && (comment.user.id === (session.user as any).id || isAdminUser(session.user)) && (
                                  <button
                                    onClick={() => handleDeleteComment(appointment.id, comment.id)}
                                    disabled={deleteLoading === comment.id}
                                    className="text-red-400 hover:text-red-600 text-xs p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                    title="Delete comment"
                                  >
                                    {deleteLoading === comment.id ? '...' : '×'}
                                  </button>
                                )}
                              </div>
                              <p className="text-charcoal text-sm pl-5 line-clamp-2" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                                {comment.content}
                              </p>
                            </div>
                          ))}
                          {appointment.comments.length > 3 && (
                            <p className="text-xs text-medium-gray pl-5">
                              +{appointment.comments.length - 3} more comments
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-medium-gray text-center py-2">
                          No comments yet. Be the first to comment!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Unscheduled Appointments */}
      {unscheduledAppointments.length > 0 && (
        <div>
          <SectionHeader title="Upcoming Appointments" subLabel="unscheduled" />
          <div className="bg-[#F4F4F4]">
            {unscheduledAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="py-4 border-b border-light-gray last:border-b-0 pl-3 border-l-2 border-l-warm-gray"
              >
                {/* Temple name + pin */}
                <div className="flex items-center gap-1.5 mb-1">
                  <Link
                    href={`/schedules/${appointment.id}`}
                    className="font-bold text-charcoal text-base hover:text-charcoal-dark transition-colors"
                  >
                    {appointment.temple.name}
                  </Link>
                  <button
                    onClick={() => openMaps(appointment)}
                    className="text-medium-gray hover:text-warm-coral transition-colors p-1 hover:bg-warm-coral/10 rounded"
                    title={`Open ${appointment.temple.name} in maps`}
                  >
                    <LocationPinIcon className="w-5 h-5 shrink-0" />
                  </button>
                </div>

                {/* Month/year */}
                <p className="text-sm text-medium-gray">
                  {formatMonthYear(appointment.scheduledDate)}
                </p>

                {/* Bottom row: icons + Schedule button */}
                <div className="flex items-center justify-end gap-3 mt-3">
                  {/* Attendees icon */}
                  {appointment._count.attendees > 0 && (
                    <button
                      onClick={() => toggleAttendees(appointment.id)}
                      className="flex items-center gap-1.5 text-medium-gray hover:text-charcoal transition-colors p-1 hover:bg-warm-gray-light rounded"
                    >
                      <UsersIcon className="w-5 h-5" />
                      <span className="text-sm font-medium">{appointment._count.attendees}</span>
                    </button>
                  )}

                  {/* Comments icon */}
                  <button
                    onClick={() => toggleComments(appointment.id)}
                    className="flex items-center gap-1.5 text-medium-gray hover:text-charcoal transition-colors p-1 hover:bg-warm-gray-light rounded"
                  >
                    <ChatBubbleIcon className="w-5 h-5" />
                    {appointment._count.comments > 0 && (
                      <span className="text-sm font-medium">{appointment._count.comments}</span>
                    )}
                  </button>

                  <Link
                    href={`/schedules/${appointment.id}/edit`}
                    className="px-4 py-1.5 rounded text-xs font-semibold uppercase tracking-wider bg-white text-[#B77D63] border border-[#B77D63] hover:bg-[#B77D63] hover:text-white transition-colors"
                  >
                    Schedule
                  </Link>
                </div>

                {/* Attendees dropdown */}
                {showAttendees === appointment.id && (
                  <div className="mt-3 p-3 bg-warm-gray-light rounded-lg border border-light-gray">
                    <h4 className="text-xs font-semibold text-charcoal mb-2 uppercase tracking-wider">
                      Attending ({appointment._count.attendees})
                    </h4>
                    <div className="space-y-1">
                      {appointment.attendees.map((attendee) => (
                        <div key={attendee.id} className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 bg-warm-coral/20 text-warm-coral rounded-full flex items-center justify-center text-xs font-medium">
                            {attendee.user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-charcoal">{attendee.user.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments dropdown */}
                {showComments === appointment.id && (
                  <div className="mt-3 p-3 bg-warm-gray-light rounded-lg border border-light-gray">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-charcoal uppercase tracking-wider">
                        Discussion ({appointment._count.comments})
                      </h4>
                      <Link
                        href={`/schedules/${appointment.id}`}
                        className="text-xs text-warm-coral hover:text-warm-coral-hover font-medium"
                      >
                        View all →
                      </Link>
                    </div>

                    {/* Add comment form */}
                    {session?.user && (
                      <div className="mb-3">
                        <textarea
                          value={commentText[appointment.id] || ''}
                          onChange={(e) => setCommentText(prev => ({ ...prev, [appointment.id]: e.target.value }))}
                          placeholder="Add a comment..."
                          rows={2}
                          className="w-full px-2 py-1.5 border border-light-gray rounded text-sm focus:outline-none focus:ring-1 focus:ring-warm-coral focus:border-warm-coral resize-none"
                        />
                        <div className="flex justify-end mt-1">
                          <button
                            onClick={() => handleComment(appointment.id)}
                            disabled={commentLoading === appointment.id || !commentText[appointment.id]?.trim()}
                            className="bg-white text-[#B77D63] border border-[#B77D63] hover:bg-[#B77D63] hover:text-white px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {commentLoading === appointment.id ? 'Posting...' : 'Post'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Comments list */}
                    {appointment.comments.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {appointment.comments.slice(0, 3).map((comment) => (
                          <div key={comment.id} className="text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 bg-warm-coral/20 text-warm-coral rounded-full flex items-center justify-center text-xs font-medium">
                                  {comment.user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-charcoal text-xs">{comment.user.name}</span>
                                <span className="text-medium-gray text-xs">{formatCommentDate(comment.createdAt)}</span>
                              </div>
                              {/* Delete button for own comments */}
                              {session?.user && (comment.user.id === (session.user as any).id || isAdminUser(session.user)) && (
                                <button
                                  onClick={() => handleDeleteComment(appointment.id, comment.id)}
                                  disabled={deleteLoading === comment.id}
                                  className="text-red-400 hover:text-red-600 text-xs p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                  title="Delete comment"
                                >
                                  {deleteLoading === comment.id ? '...' : '×'}
                                </button>
                              )}
                            </div>
                            <p className="text-charcoal text-sm pl-5 line-clamp-2" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {comment.content}
                            </p>
                          </div>
                        ))}
                        {appointment.comments.length > 3 && (
                          <p className="text-xs text-medium-gray pl-5">
                            +{appointment.comments.length - 3} more comments
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-medium-gray text-center py-2">
                        No comments yet. Be the first to comment!
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visited/Completed Appointments */}
      {completedAppointments.length > 0 && (
        <div>
          <SectionHeader title="Visited Temples" subLabel="completed" />
          <div className="bg-[#F4F4F4]">
            {completedAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="py-4 border-b border-light-gray last:border-b-0 pl-3 border-l-2 border-l-green-600"
              >
                {/* Temple name + pin */}
                <div className="flex items-center gap-1.5 mb-1">
                  <Link
                    href={`/schedules/${appointment.id}`}
                    className="font-bold text-charcoal text-base hover:text-charcoal-dark transition-colors"
                  >
                    {appointment.temple.name}
                  </Link>
                  <button
                    onClick={() => openMaps(appointment)}
                    className="text-medium-gray hover:text-warm-coral transition-colors p-1 hover:bg-warm-coral/10 rounded"
                    title={`Open ${appointment.temple.name} in maps`}
                  >
                    <LocationPinIcon className="w-5 h-5 shrink-0" />
                  </button>
                </div>

                {/* Visited date */}
                <p className="text-sm text-medium-gray">
                  Visited {formatFullDate(appointment.scheduledDate)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
