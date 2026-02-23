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

function LocationPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
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

  // Split appointments into scheduled vs unscheduled
  const upcomingAppointments = appointments.filter(a => isUpcoming(a.scheduledDate))
  const scheduledAppointments = upcomingAppointments
    .filter(a => !isMonthOnlyAppointment(a.scheduledDate, a.title))
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  const unscheduledAppointments = upcomingAppointments
    .filter(a => isMonthOnlyAppointment(a.scheduledDate, a.title))
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())

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
          className="mt-4 bg-warm-coral text-white px-6 py-2 rounded-full hover:bg-warm-coral-hover transition-colors text-sm font-medium"
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
          className="inline-flex items-center bg-warm-coral text-white px-6 py-2 rounded-full hover:bg-warm-coral-hover transition-colors text-sm font-medium"
        >
          Create Appointment
        </Link>
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Scheduled Appointments */}
      {scheduledAppointments.length > 0 && (
        <div>
          <SectionHeader title="Upcoming Appointments" subLabel="Scheduled" />
          <div className="bg-white">
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
                    <LocationPinIcon className="w-3.5 h-3.5 text-medium-gray shrink-0" />
                  </div>

                  {/* Date + time */}
                  <p className="text-sm text-medium-gray">
                    {formatFullDate(appointment.scheduledDate)} | {formatTime(appointment.scheduledDate)}
                  </p>

                  {/* Arrive by */}
                  <p className="text-sm text-medium-gray mt-0.5">
                    Arrive by {getArriveByTime(appointment.scheduledDate)}
                  </p>

                  {/* Bottom row: chat icon + RSVP button */}
                  <div className="flex items-center justify-end gap-3 mt-3">
                    <Link
                      href={`/schedules/${appointment.id}`}
                      className="text-medium-gray hover:text-charcoal transition-colors"
                    >
                      <ChatBubbleIcon className="w-5 h-5" />
                    </Link>
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
          <div className="bg-white">
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
                  <LocationPinIcon className="w-3.5 h-3.5 text-medium-gray shrink-0" />
                </div>

                {/* Month/year */}
                <p className="text-sm text-medium-gray">
                  {formatMonthYear(appointment.scheduledDate)}
                </p>

                {/* Bottom row: chat icon + Schedule button */}
                <div className="flex items-center justify-end gap-3 mt-3">
                  <Link
                    href={`/schedules/${appointment.id}`}
                    className="text-medium-gray hover:text-charcoal transition-colors"
                  >
                    <ChatBubbleIcon className="w-5 h-5" />
                  </Link>
                  <Link
                    href={`/schedules/${appointment.id}/edit`}
                    className="px-4 py-1.5 rounded text-xs font-semibold uppercase tracking-wider bg-warm-coral text-white hover:bg-warm-coral-hover transition-colors"
                  >
                    Schedule
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
