'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface User {
  id: string
  name: string
}

interface ScheduleComment {
  id: string
  createdAt: string
  content: string
  user: User
}

interface ScheduleAttendee {
  id: string
  user: User
}

interface Schedule {
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
    address: string | null
  }
  createdBy: User
  attendees: ScheduleAttendee[]
  comments: ScheduleComment[]
  _count: {
    attendees: number
    comments: number
  }
}

export default function ScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session } = useSession()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Interaction states
  const [showAttendees, setShowAttendees] = useState(false)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentText, setCommentText] = useState('')

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteCommentLoading, setDeleteCommentLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchSchedule().finally(() => setLoading(false))
  }, [id])

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/schedules/${id}`)
      if (!response.ok) throw new Error('Failed to fetch schedule')
      const data = await response.json()
      setSchedule(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleRSVP = async () => {
    if (!session?.user) return

    try {
      setRsvpLoading(true)

      // Check if already attending
      const isAttending = schedule?.attendees.some(a => a.user.id === (session.user as any).id)

      const response = await fetch(`/api/schedules/${id}/attendees`, {
        method: isAttending ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: (session.user as any).id }),
      })

      if (!response.ok) throw new Error('Failed to update RSVP')

      await fetchSchedule()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update RSVP')
    } finally {
      setRsvpLoading(false)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user || !commentText.trim()) return

    try {
      setCommentLoading(true)

      const response = await fetch(`/api/schedules/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: (session.user as any).id,
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
      const response = await fetch(`/api/schedules/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete appointment')
      router.push('/schedules')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete appointment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!session?.user) return

    try {
      setDeleteCommentLoading(commentId)
      const response = await fetch(`/api/schedules/${id}/comments/${commentId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete comment')
      }
      await fetchSchedule()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment')
    } finally {
      setDeleteCommentLoading(null)
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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
  const isAttending = schedule?.attendees.some(a => a.user.id === (session?.user as any)?.id) || false
  const isCreator = schedule?.createdBy.id === (session?.user as any)?.id

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-coral mx-auto"></div>
        <p className="mt-4 text-medium-gray">Loading appointment...</p>
      </div>
    )
  }

  if (error && !schedule) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl">Error: {error}</div>
        <Link
          href="/schedules"
          className="mt-4 inline-block text-warm-coral hover:text-warm-coral-hover"
        >
          Back to Schedules
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
            ×
          </button>
        </div>
      )}

      {/* Schedule Header */}
      <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
          <div className="flex-1">
            <Link
              href="/schedules"
              className="text-warm-coral hover:text-warm-coral-hover text-sm font-medium mb-2 inline-flex items-center"
            >
              ← Back to Schedules
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-charcoal mb-1">
              {schedule.title}
            </h1>
            <p className="text-sm text-medium-gray">
              Created by {schedule.createdBy.name}
            </p>
          </div>
          {isCreator && (
            <div className="flex gap-2">
              <Link
                href={`/schedules/${id}/edit`}
                className="text-warm-coral hover:text-warm-coral-hover text-sm font-medium px-3 py-2 rounded-lg hover:bg-warm-coral/5 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Temple and Date Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-charcoal">
            <svg className="w-5 h-5 mr-2 text-warm-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="font-medium text-lg">{schedule.temple.name}</span>
          </div>

          {schedule.temple.address && (
            <div className="flex items-center text-medium-gray ml-7">
              <span className="text-sm">{schedule.temple.address}</span>
            </div>
          )}

          <div className="flex items-center text-medium-gray ml-7">
            <span className="text-sm">
              {schedule.temple.city}
              {schedule.temple.state && `, ${schedule.temple.state}`}
              , {schedule.temple.country}
            </span>
          </div>

          <div className="flex items-center text-charcoal">
            <svg className="w-5 h-5 mr-2 text-warm-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">
              {formatDate(schedule.scheduledDate)} at {formatTime(schedule.scheduledDate)}
            </span>
            <span
              className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isUpcoming(schedule.scheduledDate)
                  ? 'bg-green-100 text-green-800'
                  : 'bg-warm-gray-light text-medium-gray'
              }`}
            >
              {isUpcoming(schedule.scheduledDate) ? 'Upcoming' : 'Past'}
            </span>
          </div>
        </div>

        {schedule.description && (
          <div className="pt-4 border-t border-light-gray">
            <p className="text-medium-gray whitespace-pre-wrap">{schedule.description}</p>
          </div>
        )}
      </div>

      {/* Actions and Attendees */}
      <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {session?.user && (
            <button
              onClick={handleRSVP}
              disabled={rsvpLoading}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isAttending
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-warm-coral text-white hover:bg-warm-coral-hover'
              } disabled:opacity-50`}
            >
              {rsvpLoading ? '...' : isAttending ? '✓ Attending' : 'RSVP'}
            </button>
          )}

          <button
            onClick={() => setShowAttendees(!showAttendees)}
            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-medium-gray hover:text-charcoal hover:bg-warm-gray-light transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {schedule._count.attendees} attending
          </button>

          <div className="text-sm text-medium-gray">
            {schedule._count.comments} {schedule._count.comments === 1 ? 'comment' : 'comments'}
          </div>
        </div>

        {/* Attendees section */}
        {showAttendees && (
          <div className="pt-4 border-t border-light-gray">
            <h3 className="text-sm font-medium text-charcoal mb-3">
              Attendees ({schedule._count.attendees})
            </h3>
            {schedule.attendees && schedule.attendees.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {schedule.attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="inline-flex items-center space-x-2 bg-green-50 text-green-800 px-3 py-2 rounded-full text-sm"
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

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-light-gray p-6">
        <h2 className="text-lg font-semibold text-charcoal mb-4">
          Discussion ({schedule._count.comments})
        </h2>

        {/* Add comment form */}
        {session?.user && (
          <form onSubmit={handleComment} className="mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment about this appointment..."
              rows={3}
              className="w-full px-3 py-2 border border-light-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-warm-coral focus:border-warm-coral"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={commentLoading || !commentText.trim()}
                className="bg-warm-coral text-white px-4 py-2 rounded-lg hover:bg-warm-coral-hover transition-colors text-sm font-medium disabled:opacity-50"
              >
                {commentLoading ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        )}

        {/* Comments list */}
        {schedule.comments.length === 0 ? (
          <div className="text-center py-8 text-medium-gray">
            <svg className="w-12 h-12 mx-auto mb-3 text-light-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedule.comments.map((comment) => (
              <div
                key={comment.id}
                className="border-b border-light-gray pb-4 last:border-0"
              >
                <div className="flex items-center space-x-3 mb-2 justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-warm-coral/20 text-warm-coral flex items-center justify-center text-sm font-semibold">
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
                  {/* Delete button for own comments */}
                  {session?.user && comment.user.id === (session.user as any).id && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deleteCommentLoading === comment.id}
                      className="text-red-400 hover:text-red-600 text-xs p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Delete comment"
                    >
                      {deleteCommentLoading === comment.id ? '...' : '×'}
                    </button>
                  )}
                </div>
                <p className="text-charcoal text-sm ml-11 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-charcoal mb-2">
              Delete Appointment?
            </h3>
            <p className="text-medium-gray text-sm mb-6">
              This will permanently delete <strong>{schedule.title}</strong> and
              all associated comments. This action cannot be undone.
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