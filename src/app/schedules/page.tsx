'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Schedule {
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
  _count: {
    attendees: number
    comments: number
  }
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    fetchSchedules()
  }, [filter])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter === 'upcoming') params.set('upcoming', 'true')
      if (filter === 'past') params.set('upcoming', 'false')

      const response = await fetch(`/api/schedules?${params}`)
      if (!response.ok) throw new Error('Failed to fetch schedules')
      const data = await response.json()
      setSchedules(data.schedules)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isUpcoming = (date: string) => new Date(date) >= new Date()

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading schedules...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl">Error: {error}</div>
        <button
          onClick={fetchSchedules}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Temple Trip Schedules</h1>
          <p className="text-gray-600 mt-1">
            Plan temple visits, see who&apos;s attending, and share your thoughts
          </p>
        </div>
        <Link
          href="/schedules/new"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Schedule a Trip
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8 w-fit">
        {(['upcoming', 'past', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {schedules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No schedules found</h3>
          <p className="text-gray-600 mb-6">
            {filter === 'upcoming'
              ? 'No upcoming temple trips scheduled yet.'
              : filter === 'past'
              ? 'No past temple trips to show.'
              : 'No temple trips have been scheduled.'}
          </p>
          <Link
            href="/schedules/new"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Schedule the First Trip
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const upcoming = isUpcoming(schedule.scheduledDate)
            return (
              <Link
                key={schedule.id}
                href={`/schedules/${schedule.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        {schedule.title}
                      </h2>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          upcoming
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {upcoming ? 'Upcoming' : 'Past'}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600 mb-1">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm font-medium">{schedule.temple.name}</span>
                      <span className="text-sm text-gray-400 ml-2">
                        {schedule.temple.city}
                        {schedule.temple.state ? `, ${schedule.temple.state}` : ''},{' '}
                        {schedule.temple.country}
                      </span>
                    </div>

                    <div className="flex items-center text-gray-600 mb-3">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">
                        {formatDate(schedule.scheduledDate)} at {formatTime(schedule.scheduledDate)}
                      </span>
                    </div>

                    {schedule.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {schedule.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end ml-6 space-y-2">
                    <div className="flex items-center text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-sm font-medium">
                        {schedule._count.attendees} attending
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-sm font-medium">
                        {schedule._count.comments} comments
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      by {schedule.createdBy.name}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
